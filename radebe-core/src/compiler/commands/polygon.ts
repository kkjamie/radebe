import {
  getCommandDefinition,
  type CommandDefinition
} from "../../schema.js";
import { getPositionalArgumentDefinitionForBinding } from "../../argument-binding.js";

import type {
  ParsedCommandNode,
  PolygonCommand,
  PolygonPoint,
  RadebeDiagnostic,
  RectRadius
} from "../../types.js";

import { compileShapeAppearances } from "../appearance.js";
import {
  createCompilerDiagnostic,
  createMaskShapeFill,
  parseArguments,
  parseStrictIntegerToken,
  readOptionalBoolean,
  readOptionalString,
  readPropertyChildValue,
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

type PolygonInlineArguments = {
  coordinateTokens: string[];
  propertyValues: Map<string, string>;
  color: string | null;
};

type PolygonModifiers = {
  cut: number | null;
  radius: RectRadius | null;
};

type PolygonAppearanceBundle = ReturnType<typeof compileShapeAppearances>;

const MIN_POLYGON_POINTS_ARGUMENT = { min: 3 } as const;
const POSITIVE_INTEGER_ARGUMENT = { min: 1 } as const;

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

function collectPolygonInlineArguments(
  node: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[]
): PolygonInlineArguments {
  const coordinateTokens: string[] = [];
  const propertyValues = new Map<string, string>();
  let color: string | null = null;

  node.args.forEach((token) => {
    const equalsIndex = token.indexOf("=");

    if (equalsIndex <= 0) {
      coordinateTokens.push(token);
      return;
    }

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
  });

  return {
    coordinateTokens,
    propertyValues,
    color
  };
}

function resolveTrailingPolygonColor(
  node: ParsedCommandNode,
  definition: CommandDefinition,
  coordinateTokens: string[],
  color: string | null,
  diagnostics: RadebeDiagnostic[]
): string | null | undefined {
  if (coordinateTokens.length % 2 === 0) {
    return color;
  }

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
    coordinateTokens.pop();
    return trailingToken;
  }

  diagnostics.push(
    createCompilerDiagnostic(
      "The polygon command expects point coordinates as whitespace-separated x y pairs, with an optional trailing color shorthand.",
      node
    )
  );
  return undefined;
}

function appendPolygonPointsFromTokens(
  node: ParsedCommandNode,
  coordinateTokens: string[],
  points: PolygonPoint[],
  diagnostics: RadebeDiagnostic[]
): boolean {
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
      return false;
    }

    if (!Number.isInteger(y)) {
      diagnostics.push(
        createCompilerDiagnostic(
          `The polygon command expects point y values to be integers, but received "${yToken}".`,
          node
        )
      );
      return false;
    }

    points.push({ x, y });
  }

  return true;
}

function collectPolygonChildren(
  node: ParsedCommandNode,
  points: PolygonPoint[],
  propertyValues: Map<string, string>,
  initialColor: string | null,
  diagnostics: RadebeDiagnostic[]
): { color: string | null } & PolygonModifiers {
  let color = initialColor;
  let cut: number | null = null;
  let radius: RectRadius | null = null;

  node.children.forEach((child) => {
    if (child.name === "point") {
      const point = compilePolygonPoint(child, diagnostics);

      if (point !== null) {
        points.push(point);
      }

      return;
    }

    if (child.name === "color") {
      const value = readPropertyChildValue(child, diagnostics);

      if (value === null) {
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
      const value = readPropertyChildValue(child, diagnostics);

      if (value !== null) {
        setResolvedValue(propertyValues, "antialias", value, node, diagnostics);
      }
    }
  });

  return { color, cut, radius };
}

function commandHasAppearance(appearances: PolygonAppearanceBundle): boolean {
  return (
    appearances.fills.length > 0 ||
    appearances.glows.length > 0 ||
    appearances.shadows.length > 0 ||
    appearances.strokes.length > 0
  );
}

function addMaskShapeFillIfNeeded(
  appearances: PolygonAppearanceBundle,
  options: CompileDrawOptions
): void {
  if (options.maskShape && !commandHasAppearance(appearances)) {
    appearances.fills.push(createMaskShapeFill());
  }
}

function buildPolygonCommand(
  node: ParsedCommandNode,
  points: PolygonPoint[],
  color: string | null,
  antialias: boolean | null,
  modifiers: PolygonModifiers,
  appearances: PolygonAppearanceBundle,
  diagnostics: RadebeDiagnostic[],
  options: CompileDrawOptions
): PolygonCommand | null {
  if (color !== null) {
    appearances.fills.unshift({
      kind: "solid",
      color,
      alpha: 1
    });
  }

  addMaskShapeFillIfNeeded(appearances, options);

  if (!validatePolygonPoints(node, points, diagnostics)) {
    return null;
  }

  const finalPoints = applyPolygonCornerModifiers(
    node,
    points,
    modifiers.cut,
    modifiers.radius,
    diagnostics
  );

  if (finalPoints === null || !validatePolygonPoints(node, finalPoints, diagnostics)) {
    return null;
  }

  if (!commandHasAppearance(appearances)) {
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
    fills: appearances.fills,
    ...(appearances.shadows.length === 0 ? {} : { shadows: appearances.shadows }),
    ...(appearances.glows.length === 0 ? {} : { glows: appearances.glows }),
    strokes: appearances.strokes
  };
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

  const inlineArguments = collectPolygonInlineArguments(node, diagnostics);
  const color = resolveTrailingPolygonColor(
    node,
    definition,
    inlineArguments.coordinateTokens,
    inlineArguments.color,
    diagnostics
  );

  if (color === undefined) {
    return null;
  }

  const points: PolygonPoint[] = [];

  if (
    !appendPolygonPointsFromTokens(
      node,
      inlineArguments.coordinateTokens,
      points,
      diagnostics
    )
  ) {
    return null;
  }

  const appearances = compileShapeAppearances(node, diagnostics);
  const childDetails = collectPolygonChildren(
    node,
    points,
    inlineArguments.propertyValues,
    color,
    diagnostics
  );

  const antialias = readOptionalBoolean(
    node,
    inlineArguments.propertyValues,
    "antialias",
    diagnostics
  );

  return buildPolygonCommand(
    node,
    points,
    childDetails.color,
    antialias,
    childDetails,
    appearances,
    diagnostics,
    options
  );
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

function isGeneratedPolygonPropertyChildName(name: string): boolean {
  return (
    name === "x" ||
    name === "y" ||
    name === "sides" ||
    name === "points" ||
    name === "inner-radius" ||
    name === "outer-radius" ||
    name === "color" ||
    name === "antialias"
  );
}

function collectGeneratedPolygonChildren(
  node: ParsedCommandNode,
  values: Map<string, string>,
  diagnostics: RadebeDiagnostic[]
): PolygonModifiers {
  let cut: number | null = null;
  let radius: RectRadius | null = null;

  for (const child of node.children) {
    if (child.name === "cut") {
      cut = compileUniformPolygonCut(child, diagnostics);
      continue;
    }

    if (child.name === "radius") {
      radius = compileRectRadius(child, diagnostics);
      continue;
    }

    if (!isGeneratedPolygonPropertyChildName(child.name)) {
      continue;
    }

    const value = readPropertyChildValue(child, diagnostics);

    if (value !== null) {
      setResolvedValue(values, child.name, value, node, diagnostics);
    }
  }

  return { cut, radius };
}

function resolveRegularPolygonPoints(
  node: ParsedCommandNode,
  values: Map<string, string>,
  centerX: number | null,
  centerY: number | null,
  diagnostics: RadebeDiagnostic[]
): PolygonPoint[] | null {
  const sides = readRequiredInteger(
    node,
    values,
    "sides",
    diagnostics,
    MIN_POLYGON_POINTS_ARGUMENT
  );
  const radius = readRequiredInteger(
    node,
    values,
    "radius",
    diagnostics,
    POSITIVE_INTEGER_ARGUMENT
  );

  if (centerX === null || centerY === null || sides === null || radius === null) {
    return null;
  }

  return generateRadialPolygonPoints(
    centerX,
    centerY,
    Array.from({ length: sides }, () => radius)
  );
}

function resolveStarPolygonPoints(
  node: ParsedCommandNode,
  values: Map<string, string>,
  centerX: number | null,
  centerY: number | null,
  diagnostics: RadebeDiagnostic[]
): PolygonPoint[] | null {
  const starPoints = readRequiredInteger(
    node,
    values,
    "points",
    diagnostics,
    MIN_POLYGON_POINTS_ARGUMENT
  );
  const innerRadius = readRequiredInteger(
    node,
    values,
    "inner-radius",
    diagnostics,
    POSITIVE_INTEGER_ARGUMENT
  );
  const outerRadius = readRequiredInteger(
    node,
    values,
    "outer-radius",
    diagnostics,
    POSITIVE_INTEGER_ARGUMENT
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
    centerX === null ||
    centerY === null ||
    starPoints === null ||
    innerRadius === null ||
    outerRadius === null ||
    outerRadius <= innerRadius
  ) {
    return null;
  }

  return generateRadialPolygonPoints(
    centerX,
    centerY,
    Array.from({ length: starPoints * 2 }, (_, index) =>
      index % 2 === 0 ? outerRadius : innerRadius
    )
  );
}

function resolveGeneratedPolygonPoints(
  node: ParsedCommandNode,
  values: Map<string, string>,
  centerX: number | null,
  centerY: number | null,
  diagnostics: RadebeDiagnostic[]
): PolygonPoint[] | null {
  if (node.name === "polygon-regular") {
    return resolveRegularPolygonPoints(node, values, centerX, centerY, diagnostics);
  }

  return resolveStarPolygonPoints(node, values, centerX, centerY, diagnostics);
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
  const modifiers = collectGeneratedPolygonChildren(node, values, diagnostics);

  const color = readOptionalString(values, "color");
  const antialias = readOptionalBoolean(
    node,
    values,
    "antialias",
    diagnostics
  );
  const appearances = compileShapeAppearances(node, diagnostics);
  const centerX = readRequiredInteger(node, values, "x", diagnostics);
  const centerY = readRequiredInteger(node, values, "y", diagnostics);

  const points = resolveGeneratedPolygonPoints(
    node,
    values,
    centerX,
    centerY,
    diagnostics
  );

  if (points === null) {
    return null;
  }

  return buildPolygonCommand(
    node,
    points,
    color,
    antialias,
    modifiers,
    appearances,
    diagnostics,
    options
  );
}
