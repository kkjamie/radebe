import {
  getAllowedPropertyCommands,
  getCommandDefinition,
  type CommandDefinition
} from "../../schema.js";

import type {
  ParsedCommandNode,
  RadebeDiagnostic,
  RectCommand,
  RectCut,
  RectRadius,
  SpriteHeader,
} from "../../types.js";

import {
  compileShapeAppearances
} from "../appearance.js";
import {
  allowsChild,
  createCompilerDiagnostic,
  createMaskShapeFill,
  parseArguments,
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

const RECT_INSET_SIDE_KEYS = ["top", "right", "bottom", "left"] as const;
const RECT_INSET_PROPERTY_KEYS = ["inset", ...RECT_INSET_SIDE_KEYS] as const;
const NON_NEGATIVE_INTEGER = { min: 0 } as const;
const POSITIVE_INTEGER = { min: 1 } as const;

type RectGeometry = Pick<RectCommand, "x" | "y" | "width" | "height">;
type RectAppearanceBundle = ReturnType<typeof compileShapeAppearances>;
type RectModifiers = {
  cut: RectCut | null;
  radius: RectRadius | null;
};

function setResolvedRectInsetSideValues(
  values: Map<string, string>,
  sideTokens: string[],
  ownerNode: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[]
): void {
  RECT_INSET_SIDE_KEYS.forEach((side, index) => {
    const token = sideTokens[index];

    if (token !== undefined) {
      setResolvedValue(values, side, token, ownerNode, diagnostics);
    }
  });
}

function resolveRectInsetPositionalArguments(
  node: ParsedCommandNode,
  positionalTokens: string[],
  values: Map<string, string>,
  diagnostics: RadebeDiagnostic[]
): void {
  if (positionalTokens.length === 0) {
    return;
  }

  if (positionalTokens.length === 1 || positionalTokens.length === 2) {
    setResolvedValue(values, "inset", positionalTokens[0]!, node, diagnostics);

    if (positionalTokens.length === 2) {
      setResolvedValue(values, "color", positionalTokens[1]!, node, diagnostics);
    }

    return;
  }

  if (positionalTokens.length === 4 || positionalTokens.length === 5) {
    setResolvedRectInsetSideValues(
      values,
      positionalTokens.slice(0, 4),
      node,
      diagnostics
    );

    if (positionalTokens.length === 5) {
      setResolvedValue(values, "color", positionalTokens[4]!, node, diagnostics);
    }

    return;
  }

  diagnostics.push(
    createCompilerDiagnostic(
      'The rect-inset command expects either one inset value, one inset value plus color, four side values in "top right bottom left" order, or four side values plus color.',
      node
    )
  );
}

function resolveRectInsetChildProperty(
  parentNode: ParsedCommandNode,
  child: ParsedCommandNode,
  values: Map<string, string>,
  diagnostics: RadebeDiagnostic[]
): void {
  const positionalTokens: string[] = [];

  child.args.forEach((token) => {
    const equalsIndex = token.indexOf("=");

    if (equalsIndex > 0) {
      const key = token.slice(0, equalsIndex);
      const value = token.slice(equalsIndex + 1);

      if (value.length === 0) {
        diagnostics.push(
          createCompilerDiagnostic(
            `The inset command received an empty value for "${key}".`,
            child
          )
        );
        return;
      }

      if (key === "value") {
        setResolvedValue(values, "inset", value, parentNode, diagnostics);
        return;
      }

      if (RECT_INSET_SIDE_KEYS.includes(key as (typeof RECT_INSET_SIDE_KEYS)[number])) {
        setResolvedValue(values, key, value, parentNode, diagnostics);
        return;
      }

      diagnostics.push(
        createCompilerDiagnostic(
          `The inset command does not support named argument "${key}".`,
          child
        )
      );
      return;
    }

    positionalTokens.push(token);
  });

  if (positionalTokens.length === 0) {
    if (child.args.length === 0) {
      diagnostics.push(
        createCompilerDiagnostic('The inset command requires "value".', child)
      );
    }

    return;
  }

  if (positionalTokens.length === 1) {
    setResolvedValue(values, "inset", positionalTokens[0]!, parentNode, diagnostics);
    return;
  }

  if (positionalTokens.length === 4) {
    setResolvedRectInsetSideValues(
      values,
      positionalTokens,
      parentNode,
      diagnostics
    );
    return;
  }

  diagnostics.push(
    createCompilerDiagnostic(
      'The inset command expects either one value or four values in "top right bottom left" order.',
      child
    )
  );
}

function resolveRectInsetProperties(
  node: ParsedCommandNode,
  definition: CommandDefinition
): { values: Map<string, string>; diagnostics: RadebeDiagnostic[] } {
  const values = new Map<string, string>();
  const diagnostics: RadebeDiagnostic[] = [];
  const positionalTokens: string[] = [];

  validateChildren(node, definition, diagnostics);

  node.args.forEach((token) => {
    const equalsIndex = token.indexOf("=");

    if (equalsIndex > 0) {
      const key = token.slice(0, equalsIndex);
      const value = token.slice(equalsIndex + 1);

      if (value.length === 0) {
        diagnostics.push(
          createCompilerDiagnostic(
            `The rect-inset command received an empty value for "${key}".`,
            node
          )
        );
        return;
      }

      setResolvedValue(values, key, value, node, diagnostics);
      return;
    }

    positionalTokens.push(token);
  });

  resolveRectInsetPositionalArguments(node, positionalTokens, values, diagnostics);

  node.children.forEach((child) => {
    if (!getAllowedPropertyCommands(definition).includes(child.name)) {
      return;
    }

    if (child.name === "inset") {
      resolveRectInsetChildProperty(node, child, values, diagnostics);
      return;
    }

    const value = readPropertyChildValue(child, diagnostics);

    if (value === null) {
      return;
    }

    setResolvedValue(values, child.name, value, node, diagnostics);
  });

  return {
    values,
    diagnostics
  };
}

function hasResolvedProperty(
  values: Map<string, string>,
  key: string
): boolean {
  return readOptionalString(values, key) !== null;
}

function readRequiredNonNegativeInteger(
  node: ParsedCommandNode,
  values: Map<string, string>,
  key: string,
  diagnostics: RadebeDiagnostic[]
): number | null {
  return readRequiredInteger(node, values, key, diagnostics, NON_NEGATIVE_INTEGER);
}

function readRectInsetSide(
  node: ParsedCommandNode,
  values: Map<string, string>,
  key: (typeof RECT_INSET_SIDE_KEYS)[number],
  fallback: number,
  diagnostics: RadebeDiagnostic[]
): number | null {
  if (!hasResolvedProperty(values, key)) {
    return fallback;
  }

  return readRequiredNonNegativeInteger(node, values, key, diagnostics);
}

function resolveRectInsetGeometry(
  node: ParsedCommandNode,
  sprite: SpriteHeader,
  values: Map<string, string>,
  diagnostics: RadebeDiagnostic[]
): RectGeometry | null {
  const hasAnyInsetProperty = RECT_INSET_PROPERTY_KEYS.some((key) =>
    hasResolvedProperty(values, key)
  );

  if (!hasAnyInsetProperty) {
    diagnostics.push(
      createCompilerDiagnostic(
        'The rect-inset command requires "inset" or at least one side-specific inset property.',
        node
      )
    );
    return null;
  }

  const inset = hasResolvedProperty(values, "inset")
    ? readRequiredNonNegativeInteger(node, values, "inset", diagnostics)
    : 0;

  if (inset === null) {
    return null;
  }

  const top = readRectInsetSide(node, values, "top", inset, diagnostics);
  if (top === null) return null;

  const right = readRectInsetSide(node, values, "right", inset, diagnostics);
  if (right === null) return null;

  const bottom = readRectInsetSide(node, values, "bottom", inset, diagnostics);
  if (bottom === null) return null;

  const left = readRectInsetSide(node, values, "left", inset, diagnostics);
  if (left === null) return null;

  const geometry: RectGeometry = {
    x: left,
    y: top,
    width: sprite.width - left - right,
    height: sprite.height - top - bottom
  };

  if (geometry.width < 1 || geometry.height < 1) {
    diagnostics.push(
      createCompilerDiagnostic(
        `The rect-inset command with top=${top}, right=${right}, bottom=${bottom}, left=${left} does not fit inside the current sprite size ${sprite.width}x${sprite.height}.`,
        node
      )
    );
    return null;
  }

  return geometry;
}

function resolveExplicitRectGeometry(
  node: ParsedCommandNode,
  values: Map<string, string>,
  diagnostics: RadebeDiagnostic[]
): RectGeometry | null {
  const x = readRequiredInteger(node, values, "x", diagnostics);
  if (x === null) return null;

  const y = readRequiredInteger(node, values, "y", diagnostics);
  if (y === null) return null;

  const width = readRequiredInteger(
    node,
    values,
    "width",
    diagnostics,
    POSITIVE_INTEGER
  );
  if (width === null) return null;

  const height = readRequiredInteger(
    node,
    values,
    "height",
    diagnostics,
    POSITIVE_INTEGER
  );
  if (height === null) return null;

  return {
    x,
    y,
    width,
    height
  };
}

function resolveRectGeometry(
  node: ParsedCommandNode,
  sprite: SpriteHeader,
  values: Map<string, string>,
  diagnostics: RadebeDiagnostic[]
): RectGeometry | null {
  if (node.name === "rect-inset") {
    return resolveRectInsetGeometry(node, sprite, values, diagnostics);
  }

  return resolveExplicitRectGeometry(node, values, diagnostics);
}

function validateRectCutFits(
  node: ParsedCommandNode,
  rectCut: RectCut,
  geometry: RectGeometry,
  diagnostics: RadebeDiagnostic[]
): boolean {
  const checks = [
    {
      total: rectCut.topLeft + rectCut.topRight,
      limit: geometry.width,
      message: `The cut command expects top-left (${rectCut.topLeft}) plus top-right (${rectCut.topRight}) to leave horizontal space inside width ${geometry.width}.`
    },
    {
      total: rectCut.bottomLeft + rectCut.bottomRight,
      limit: geometry.width,
      message: `The cut command expects bottom-left (${rectCut.bottomLeft}) plus bottom-right (${rectCut.bottomRight}) to leave horizontal space inside width ${geometry.width}.`
    },
    {
      total: rectCut.topLeft + rectCut.bottomLeft,
      limit: geometry.height,
      message: `The cut command expects top-left (${rectCut.topLeft}) plus bottom-left (${rectCut.bottomLeft}) to leave vertical space inside height ${geometry.height}.`
    },
    {
      total: rectCut.topRight + rectCut.bottomRight,
      limit: geometry.height,
      message: `The cut command expects top-right (${rectCut.topRight}) plus bottom-right (${rectCut.bottomRight}) to leave vertical space inside height ${geometry.height}.`
    }
  ];

  for (const check of checks) {
    if (check.total < check.limit) {
      continue;
    }

    diagnostics.push(createCompilerDiagnostic(check.message, node));
    return false;
  }

  return true;
}

function rectHasAppearance(appearances: RectAppearanceBundle): boolean {
  return (
    appearances.fills.length > 0 ||
    appearances.glows.length > 0 ||
    appearances.shadows.length > 0 ||
    appearances.strokes.length > 0
  );
}

function addRectColorAndMaskFill(
  color: string | null,
  appearances: RectAppearanceBundle,
  options: CompileDrawOptions
): void {
  if (color !== null) {
    appearances.fills.unshift({
      kind: "solid",
      color,
      alpha: 1
    });
  }

  if (options.maskShape && !rectHasAppearance(appearances)) {
    appearances.fills.push(createMaskShapeFill());
  }
}

function collectRectModifiers(
  node: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[]
): RectModifiers {
  let cut: RectCut | null = null;
  let radius: RectRadius | null = null;

  for (const child of node.children) {
    if (child.name === "cut") {
      cut = compileRectCut(child, diagnostics);
      continue;
    }

    if (child.name === "radius") {
      radius = compileRectRadius(child, diagnostics);
    }
  }

  return { cut, radius };
}

function validateRectModifiers(
  node: ParsedCommandNode,
  geometry: RectGeometry,
  modifiers: RectModifiers,
  diagnostics: RadebeDiagnostic[]
): boolean {
  if (modifiers.cut !== null && modifiers.radius !== null) {
    diagnostics.push(
      createCompilerDiagnostic(
        'The rect command currently does not allow both "cut" and "radius" on the same rectangle.',
        node
      )
    );
    return false;
  }

  if (
    modifiers.cut !== null &&
    !validateRectCutFits(node, modifiers.cut, geometry, diagnostics)
  ) {
    return false;
  }

  if (modifiers.radius === null) {
    return true;
  }

  const maxRadius = Math.floor(Math.min(geometry.width, geometry.height) / 2);

  if (modifiers.radius.value <= maxRadius) {
    return true;
  }

  diagnostics.push(
    createCompilerDiagnostic(
      `The radius command expects a value no greater than ${maxRadius} for a rectangle sized ${geometry.width}x${geometry.height}.`,
      node
    )
  );
  return false;
}

function getRectSourceCommandName(
  node: ParsedCommandNode
): RectCommand["sourceCommandName"] {
  if (node.name === "rect") {
    return "rect";
  }

  return node.name === "rect-inset" ? "rect-inset" : "rect-absolute";
}

function buildRectCommand(
  node: ParsedCommandNode,
  geometry: RectGeometry,
  antialias: boolean | null,
  modifiers: RectModifiers,
  appearances: RectAppearanceBundle
): RectCommand {
  return {
    kind: "rect",
    lineNumber: node.lineNumber,
    ...geometry,
    ...(antialias === null ? {} : { antialias }),
    ...(modifiers.cut === null ? {} : { cut: modifiers.cut }),
    ...(modifiers.radius === null ? {} : { radius: modifiers.radius }),
    fills: appearances.fills,
    ...(appearances.shadows.length === 0 ? {} : { shadows: appearances.shadows }),
    ...(appearances.glows.length === 0 ? {} : { glows: appearances.glows }),
    strokes: appearances.strokes,
    sourceCommandName: getRectSourceCommandName(node)
  };
}

export function compileRectCommand(
  node: ParsedCommandNode,
  sprite: SpriteHeader,
  diagnostics: RadebeDiagnostic[],
  options: CompileDrawOptions = {}
): RectCommand | null {
  const definition = getCommandDefinition(node.name);

  if (!definition) {
    diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
    return null;
  }

  const resolvedProperties =
    node.name === "rect-inset"
      ? resolveRectInsetProperties(node, definition)
      : resolveCommandProperties(node, definition);
  diagnostics.push(...resolvedProperties.diagnostics);

  const geometry = resolveRectGeometry(
    node,
    sprite,
    resolvedProperties.values,
    diagnostics
  );

  if (geometry === null) {
    return null;
  }

  const color = readOptionalString(resolvedProperties.values, "color");
  const antialias = readOptionalBoolean(
    node,
    resolvedProperties.values,
    "antialias",
    diagnostics
  );
  const appearances = compileShapeAppearances(node, diagnostics);
  addRectColorAndMaskFill(color, appearances, options);

  if (!rectHasAppearance(appearances)) {
    diagnostics.push(
      createCompilerDiagnostic(
        `The ${node.name} command requires a color shorthand, a fill child, a glow child, a shadow child, or a stroke child.`,
        node
      )
    );
    return null;
  }

  const modifiers = collectRectModifiers(node, diagnostics);

  if (!validateRectModifiers(node, geometry, modifiers, diagnostics)) {
    return null;
  }

  return buildRectCommand(node, geometry, antialias, modifiers, appearances);
}
