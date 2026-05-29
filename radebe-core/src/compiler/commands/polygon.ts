import { getCommandDefinition } from "../../schema.js";
import { getPositionalArgumentDefinitionForBinding } from "../../argument-binding.js";

import type {
  GlowAppearance,
  ParsedCommandNode,
  PolygonCommand,
  PolygonPoint,
  RadebeDiagnostic,
  RectFill,
  RectRadius,
  ShadowAppearance,
  StrokeAppearance
} from "../../types.js";

import { compileShapeAppearances } from "../appearance.js";
import {
  createCompilerDiagnostic,
  createMaskShapeFill,
  parseArguments,
  parseStrictIntegerToken,
  readOptionalBoolean,
  readOptionalString,
  readRequiredInteger,
  resolveCommandProperties,
  setResolvedValue,
  validateChildren,
  type CompileDrawOptions
} from "../shared.js";
import {
  compileRectCut,
  compileRectRadius
} from "../rect-modifiers.js";

type FloatPoint = {
  x: number;
  y: number;
};

export function compilePolygonPoint(
  node: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[]
): PolygonPoint | null {
  const definition = getCommandDefinition(node.name);

  if (!definition) {
    diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
    return null;
  }

  const resolvedProperties = resolveCommandProperties(node, definition);
  diagnostics.push(...resolvedProperties.diagnostics);

  const x = readRequiredInteger(node, resolvedProperties.values, "x", diagnostics);
  const y = readRequiredInteger(node, resolvedProperties.values, "y", diagnostics);

  if (x === null || y === null) {
    return null;
  }

  return { x, y };
}

function getPolygonDoubledArea(points: PolygonPoint[]): number {
  return points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length]!;
    return sum + point.x * next.y - next.x * point.y;
  }, 0);
}

function validatePolygonPoints(
  node: ParsedCommandNode,
  points: PolygonPoint[],
  diagnostics: RadebeDiagnostic[]
): boolean {
  if (points.length < 3) {
    diagnostics.push(
      createCompilerDiagnostic(
        `The ${node.name} command requires at least three points.`,
        node
      )
    );
    return false;
  }

  if (getPolygonDoubledArea(points) === 0) {
    diagnostics.push(
      createCompilerDiagnostic(
        `The ${node.name} command requires points that enclose a non-zero area.`,
        node
      )
    );
    return false;
  }

  return true;
}

function dedupePolygonPoints(points: FloatPoint[]): PolygonPoint[] {
  const rounded = points.map((point) => ({
    x: Math.round(point.x),
    y: Math.round(point.y)
  }));
  const deduped: PolygonPoint[] = [];

  for (const point of rounded) {
    const previous = deduped[deduped.length - 1];

    if (!previous || previous.x !== point.x || previous.y !== point.y) {
      deduped.push(point);
    }
  }

  if (deduped.length > 1) {
    const first = deduped[0]!;
    const last = deduped[deduped.length - 1]!;

    if (first.x === last.x && first.y === last.y) {
      deduped.pop();
    }
  }

  return deduped;
}

function getPolygonModifierLimit(points: PolygonPoint[], index: number): number {
  const current = points[index]!;
  const previous = points[(index - 1 + points.length) % points.length]!;
  const next = points[(index + 1) % points.length]!;
  const previousLength = Math.hypot(previous.x - current.x, previous.y - current.y);
  const nextLength = Math.hypot(next.x - current.x, next.y - current.y);

  return Math.min(previousLength, nextLength) / 2;
}

function validatePolygonCornerModifier(
  node: ParsedCommandNode,
  modifierName: "cut" | "radius",
  amount: number,
  points: PolygonPoint[],
  diagnostics: RadebeDiagnostic[]
): boolean {
  if (amount <= 0) {
    return true;
  }

  for (let index = 0; index < points.length; index += 1) {
    const limit = getPolygonModifierLimit(points, index);

    if (amount > limit) {
      diagnostics.push(
        createCompilerDiagnostic(
          `The ${modifierName} command expects a value no greater than ${Math.floor(limit)} for at least one polygon corner in the current shape.`,
          node
        )
      );
      return false;
    }
  }

  return true;
}

function buildCutPolygonPoints(points: PolygonPoint[], amount: number): PolygonPoint[] {
  if (amount <= 0) {
    return points;
  }

  const cutPoints: FloatPoint[] = [];

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index]!;
    const previous = points[(index - 1 + points.length) % points.length]!;
    const next = points[(index + 1) % points.length]!;
    const previousLength = Math.hypot(previous.x - current.x, previous.y - current.y);
    const nextLength = Math.hypot(next.x - current.x, next.y - current.y);
    const offset = Math.min(amount, previousLength / 2, nextLength / 2);
    const previousDirection = {
      x: (previous.x - current.x) / previousLength,
      y: (previous.y - current.y) / previousLength
    };
    const nextDirection = {
      x: (next.x - current.x) / nextLength,
      y: (next.y - current.y) / nextLength
    };

    cutPoints.push({
      x: current.x + previousDirection.x * offset,
      y: current.y + previousDirection.y * offset
    });
    cutPoints.push({
      x: current.x + nextDirection.x * offset,
      y: current.y + nextDirection.y * offset
    });
  }

  return dedupePolygonPoints(cutPoints);
}

function buildRoundedPolygonPoints(
  points: PolygonPoint[],
  amount: number
): PolygonPoint[] {
  if (amount <= 0) {
    return points;
  }

  const roundedPoints: FloatPoint[] = [];
  const segments = Math.max(2, Math.min(8, Math.ceil(amount)));

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index]!;
    const previous = points[(index - 1 + points.length) % points.length]!;
    const next = points[(index + 1) % points.length]!;
    const previousLength = Math.hypot(previous.x - current.x, previous.y - current.y);
    const nextLength = Math.hypot(next.x - current.x, next.y - current.y);
    const offset = Math.min(amount, previousLength / 2, nextLength / 2);
    const previousDirection = {
      x: (previous.x - current.x) / previousLength,
      y: (previous.y - current.y) / previousLength
    };
    const nextDirection = {
      x: (next.x - current.x) / nextLength,
      y: (next.y - current.y) / nextLength
    };
    const start = {
      x: current.x + previousDirection.x * offset,
      y: current.y + previousDirection.y * offset
    };
    const end = {
      x: current.x + nextDirection.x * offset,
      y: current.y + nextDirection.y * offset
    };

    for (let step = 0; step <= segments; step += 1) {
      if (index > 0 && step === 0) {
        continue;
      }

      const t = step / segments;
      const inverse = 1 - t;

      roundedPoints.push({
        x: inverse * inverse * start.x + 2 * inverse * t * current.x + t * t * end.x,
        y: inverse * inverse * start.y + 2 * inverse * t * current.y + t * t * end.y
      });
    }
  }

  return dedupePolygonPoints(roundedPoints);
}

function compileUniformPolygonCut(
  node: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[]
): number | null {
  const cut = compileRectCut(node, diagnostics);

  if (cut === null) {
    return null;
  }

  if (
    cut.topLeft !== cut.topRight ||
    cut.topLeft !== cut.bottomRight ||
    cut.topLeft !== cut.bottomLeft
  ) {
    diagnostics.push(
      createCompilerDiagnostic(
        'The polygon family currently supports only a uniform "cut" value on every vertex.',
        node
      )
    );
    return null;
  }

  return cut.topLeft;
}

function applyPolygonCornerModifiers(
  ownerNode: ParsedCommandNode,
  points: PolygonPoint[],
  cut: number | null,
  radius: RectRadius | null,
  diagnostics: RadebeDiagnostic[]
): PolygonPoint[] | null {
  if (cut !== null && radius !== null) {
    diagnostics.push(
      createCompilerDiagnostic(
        `The ${ownerNode.name} command currently does not allow both "cut" and "radius" on the same polygon shape.`,
        ownerNode
      )
    );
    return null;
  }

  if (cut !== null) {
    if (!validatePolygonCornerModifier(ownerNode, "cut", cut, points, diagnostics)) {
      return null;
    }

    return buildCutPolygonPoints(points, cut);
  }

  if (radius !== null) {
    if (!validatePolygonCornerModifier(ownerNode, "radius", radius.value, points, diagnostics)) {
      return null;
    }

    return buildRoundedPolygonPoints(points, radius.value);
  }

  return points;
}

export function compilePolygonCommand(
  node: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[],
  options: CompileDrawOptions = {}
): PolygonCommand | null {
  const definition = getCommandDefinition(node.name);

  if (!definition) {
    diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
    return null;
  }

  validateChildren(node, definition, diagnostics);

  const coordinateTokens: string[] = [];
  const propertyValues = new Map<string, string>();
  const points: PolygonPoint[] = [];
  let color: string | null = null;
  let cut: number | null = null;
  let radius: RectRadius | null = null;

  node.args.forEach((token) => {
    const equalsIndex = token.indexOf("=");

    if (equalsIndex > 0) {
      const key = token.slice(0, equalsIndex);
      const value = token.slice(equalsIndex + 1);

      if (key === "antialias") {
        if (value.length === 0) {
          diagnostics.push(
            createCompilerDiagnostic(
              'The polygon command received an empty value for "antialias".',
              node
            )
          );
          return;
        }

        setResolvedValue(propertyValues, "antialias", value, node, diagnostics);
        return;
      }

      if (key !== "color") {
        diagnostics.push(
          createCompilerDiagnostic(
            `The polygon command does not support named argument "${key}".`,
            node
          )
        );
        return;
      }

      if (value.length === 0) {
        diagnostics.push(
          createCompilerDiagnostic(
            'The polygon command received an empty value for "color".',
            node
          )
        );
        return;
      }

      if (color !== null) {
        diagnostics.push(
          createCompilerDiagnostic(
            'The polygon command received duplicate "color" values.',
            node
          )
        );
        return;
      }

      color = value;
      return;
    }

    coordinateTokens.push(token);
  });

  if (coordinateTokens.length % 2 !== 0) {
    const trailingToken = coordinateTokens[coordinateTokens.length - 1] ?? null;
    const trailingArgument =
      trailingToken === null
        ? null
        : getPositionalArgumentDefinitionForBinding(
            definition,
            coordinateTokens,
            coordinateTokens.length - 1,
            { activeTokenText: trailingToken }
          );

    if (
      trailingToken !== null &&
      trailingArgument?.name === "color" &&
      color === null &&
      coordinateTokens.length >= 7
    ) {
      color = trailingToken;
      coordinateTokens.pop();
    } else {
      diagnostics.push(
        createCompilerDiagnostic(
          "The polygon command expects point coordinates as whitespace-separated x y pairs, with an optional trailing color shorthand.",
          node
        )
      );
      return null;
    }
  }

  for (let index = 0; index < coordinateTokens.length; index += 2) {
    const xToken = coordinateTokens[index]!;
    const yToken = coordinateTokens[index + 1]!;
    const x = parseStrictIntegerToken(xToken);
    const y = parseStrictIntegerToken(yToken);

    if (!Number.isInteger(x)) {
      diagnostics.push(
        createCompilerDiagnostic(
          `The polygon command expects point x values to be integers, but received "${xToken}".`,
          node
        )
      );
      return null;
    }

    if (!Number.isInteger(y)) {
      diagnostics.push(
        createCompilerDiagnostic(
          `The polygon command expects point y values to be integers, but received "${yToken}".`,
          node
        )
      );
      return null;
    }

    points.push({ x, y });
  }

  const appearances = compileShapeAppearances(node, diagnostics);
  const fills: RectFill[] = appearances.fills;
  const glows: GlowAppearance[] = appearances.glows;
  const shadows: ShadowAppearance[] = appearances.shadows;
  const strokes: StrokeAppearance[] = appearances.strokes;

  node.children.forEach((child) => {
    if (child.name === "point") {
      const point = compilePolygonPoint(child, diagnostics);

      if (point !== null) {
        points.push(point);
      }

      return;
    }

    if (child.name === "color") {
      const childDefinition = getCommandDefinition(child.name);

      if (!childDefinition) {
        return;
      }

      const childArguments = parseArguments(child, childDefinition);
      diagnostics.push(...childArguments.diagnostics);
      const value = childArguments.values.get("value");

      if (!value) {
        diagnostics.push(
          createCompilerDiagnostic(
            'The color command requires "value".',
            child
          )
        );
        return;
      }

      if (color !== null) {
        diagnostics.push(
          createCompilerDiagnostic(
            'The polygon command received duplicate "color" values.',
            node
          )
        );
        return;
      }

      color = value;
      return;
    }

    if (child.name === "cut") {
      cut = compileUniformPolygonCut(child, diagnostics);
      return;
    }

    if (child.name === "radius") {
      radius = compileRectRadius(child, diagnostics);
      return;
    }

    if (child.name === "antialias") {
      const childDefinition = getCommandDefinition(child.name);

      if (!childDefinition) {
        return;
      }

      const childArguments = parseArguments(child, childDefinition);
      diagnostics.push(...childArguments.diagnostics);
      const value = childArguments.values.get("value");

      if (!value) {
        diagnostics.push(
          createCompilerDiagnostic(
            'The antialias command requires "value".',
            child
          )
        );
        return;
      }

      setResolvedValue(propertyValues, "antialias", value, node, diagnostics);
    }
  });

  if (color !== null) {
    fills.unshift({
      kind: "solid",
      color,
      alpha: 1
    });
  }

  if (
    options.maskShape &&
    fills.length === 0 &&
    glows.length === 0 &&
    shadows.length === 0 &&
    strokes.length === 0
  ) {
    fills.push(createMaskShapeFill());
  }

  if (!validatePolygonPoints(node, points, diagnostics)) {
    return null;
  }

  const finalPoints = applyPolygonCornerModifiers(node, points, cut, radius, diagnostics);

  if (finalPoints === null || !validatePolygonPoints(node, finalPoints, diagnostics)) {
    return null;
  }

  if (
    fills.length === 0 &&
    glows.length === 0 &&
    shadows.length === 0 &&
    strokes.length === 0
  ) {
    diagnostics.push(
      createCompilerDiagnostic(
        "The polygon command requires a color shorthand, a fill child, a glow child, a shadow child, or a stroke child.",
        node
      )
    );
    return null;
  }

  const antialias = readOptionalBoolean(
    node,
    propertyValues,
    "antialias",
    diagnostics
  );

  return {
    kind: "polygon",
    lineNumber: node.lineNumber,
    ...(antialias === null ? {} : { antialias }),
    points: finalPoints,
    fills,
    ...(shadows.length === 0 ? {} : { shadows }),
    ...(glows.length === 0 ? {} : { glows }),
    strokes
  };
}

function generateRadialPolygonPoints(
  centerX: number,
  centerY: number,
  radii: number[]
): PolygonPoint[] {
  const step = (Math.PI * 2) / radii.length;

  return radii.map((radius, index) => {
    const angle = -Math.PI / 2 + step * index;

    return {
      x: Math.round(centerX + Math.cos(angle) * radius),
      y: Math.round(centerY + Math.sin(angle) * radius)
    };
  });
}

export function compileGeneratedPolygonCommand(
  node: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[],
  options: CompileDrawOptions = {}
): PolygonCommand | null {
  const definition = getCommandDefinition(node.name);

  if (!definition) {
    diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
    return null;
  }

  validateChildren(node, definition, diagnostics);

  const parsedArguments = parseArguments(node, definition);
  const values = new Map(parsedArguments.values);
  diagnostics.push(...parsedArguments.diagnostics);
  let cut: number | null = null;
  let modifierRadius: RectRadius | null = null;

  for (const child of node.children) {
    if (child.name === "cut") {
      cut = compileUniformPolygonCut(child, diagnostics);
      continue;
    }

    if (child.name === "radius") {
      modifierRadius = compileRectRadius(child, diagnostics);
      continue;
    }

    const childDefinition = getCommandDefinition(child.name);

    if (!childDefinition) {
      continue;
    }

    if (
      child.name === "x" ||
      child.name === "y" ||
      child.name === "sides" ||
      child.name === "points" ||
      child.name === "inner-radius" ||
      child.name === "outer-radius" ||
      child.name === "color" ||
      child.name === "antialias"
    ) {
      const childArguments = parseArguments(child, childDefinition);
      diagnostics.push(...childArguments.diagnostics);
      const value = childArguments.values.get("value");

      if (!value) {
        diagnostics.push(
          createCompilerDiagnostic(
            `The ${child.name} command requires "value".`,
            child
          )
        );
        continue;
      }

      setResolvedValue(values, child.name, value, node, diagnostics);
    }
  }

  const color = readOptionalString(values, "color");
  const antialias = readOptionalBoolean(
    node,
    values,
    "antialias",
    diagnostics
  );
  const appearances = compileShapeAppearances(node, diagnostics);
  const fills: RectFill[] = appearances.fills;
  const glows: GlowAppearance[] = appearances.glows;
  const shadows: ShadowAppearance[] = appearances.shadows;
  const strokes: StrokeAppearance[] = appearances.strokes;
  const centerX = readRequiredInteger(node, values, "x", diagnostics);
  const centerY = readRequiredInteger(node, values, "y", diagnostics);
  let points: PolygonPoint[] | null = null;

  if (node.name === "polygon-regular") {
    const sides = readRequiredInteger(
      node,
      values,
      "sides",
      diagnostics,
      { min: 3 }
    );
    const radius = readRequiredInteger(
      node,
      values,
      "radius",
      diagnostics,
      { min: 1 }
    );

    if (centerX !== null && centerY !== null && sides !== null && radius !== null) {
      points = generateRadialPolygonPoints(
        centerX,
        centerY,
        Array.from({ length: sides }, () => radius)
      );
    }
  } else {
    const starPoints = readRequiredInteger(
      node,
      values,
      "points",
      diagnostics,
      { min: 3 }
    );
    const innerRadius = readRequiredInteger(
      node,
      values,
      "inner-radius",
      diagnostics,
      { min: 1 }
    );
    const outerRadius = readRequiredInteger(
      node,
      values,
      "outer-radius",
      diagnostics,
      { min: 1 }
    );

    if (
      innerRadius !== null &&
      outerRadius !== null &&
      outerRadius <= innerRadius
    ) {
      diagnostics.push(
        createCompilerDiagnostic(
          'The polygon-star command expects "outer-radius" to be greater than "inner-radius".',
          node
        )
      );
    }

    if (
      centerX !== null &&
      centerY !== null &&
      starPoints !== null &&
      innerRadius !== null &&
      outerRadius !== null &&
      outerRadius > innerRadius
    ) {
      points = generateRadialPolygonPoints(
        centerX,
        centerY,
        Array.from({ length: starPoints * 2 }, (_, index) =>
          index % 2 === 0 ? outerRadius : innerRadius
        )
      );
    }
  }

  if (color !== null) {
    fills.unshift({
      kind: "solid",
      color,
      alpha: 1
    });
  }

  if (
    options.maskShape &&
    fills.length === 0 &&
    glows.length === 0 &&
    shadows.length === 0 &&
    strokes.length === 0
  ) {
    fills.push(createMaskShapeFill());
  }

  if (points === null || !validatePolygonPoints(node, points, diagnostics)) {
    return null;
  }

  const finalPoints = applyPolygonCornerModifiers(
    node,
    points,
    cut,
    modifierRadius,
    diagnostics
  );

  if (finalPoints === null || !validatePolygonPoints(node, finalPoints, diagnostics)) {
    return null;
  }

  if (
    fills.length === 0 &&
    glows.length === 0 &&
    shadows.length === 0 &&
    strokes.length === 0
  ) {
    diagnostics.push(
      createCompilerDiagnostic(
        `The ${node.name} command requires a color shorthand, a fill child, a glow child, a shadow child, or a stroke child.`,
        node
      )
    );
    return null;
  }

  return {
    kind: "polygon",
    lineNumber: node.lineNumber,
    ...(antialias === null ? {} : { antialias }),
    points: finalPoints,
    fills,
    ...(shadows.length === 0 ? {} : { shadows }),
    ...(glows.length === 0 ? {} : { glows }),
    strokes
  };
}
