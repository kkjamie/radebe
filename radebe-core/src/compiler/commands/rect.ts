import {
  getAllowedPropertyCommands,
  getCommandDefinition,
  type CommandDefinition
} from "../../schema.js";

import type {
  GlowAppearance,
  ParsedCommandNode,
  RadebeDiagnostic,
  RectCommand,
  RectCut,
  RectFill,
  RectRadius,
  ShadowAppearance,
  SpriteHeader,
  StrokeAppearance
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
          `The ${child.name} command requires "value".`,
          child
        )
      );
      return;
    }

    setResolvedValue(values, child.name, value, node, diagnostics);
  });

  return {
    values,
    diagnostics
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

  let x: number | null;
  let y: number | null;
  let width: number | null;
  let height: number | null;

  if (node.name === "rect-inset") {
    const hasInset = readOptionalString(resolvedProperties.values, "inset") !== null;
    const hasTop = readOptionalString(resolvedProperties.values, "top") !== null;
    const hasRight = readOptionalString(resolvedProperties.values, "right") !== null;
    const hasBottom = readOptionalString(resolvedProperties.values, "bottom") !== null;
    const hasLeft = readOptionalString(resolvedProperties.values, "left") !== null;

    if (!hasInset && !hasTop && !hasRight && !hasBottom && !hasLeft) {
      diagnostics.push(
        createCompilerDiagnostic(
          'The rect-inset command requires "inset" or at least one side-specific inset property.',
          node
        )
      );
      return null;
    }

    const inset = hasInset
      ? readRequiredInteger(
          node,
          resolvedProperties.values,
          "inset",
          diagnostics,
          { min: 0 }
        )
      : 0;
    const top = hasTop
      ? readRequiredInteger(node, resolvedProperties.values, "top", diagnostics, {
          min: 0
        })
      : inset;
    const right = hasRight
      ? readRequiredInteger(node, resolvedProperties.values, "right", diagnostics, {
          min: 0
        })
      : inset;
    const bottom = hasBottom
      ? readRequiredInteger(node, resolvedProperties.values, "bottom", diagnostics, {
          min: 0
        })
      : inset;
    const left = hasLeft
      ? readRequiredInteger(node, resolvedProperties.values, "left", diagnostics, {
          min: 0
        })
      : inset;

    if (
      inset === null ||
      top === null ||
      right === null ||
      bottom === null ||
      left === null
    ) {
      return null;
    }

    x = left;
    y = top;
    width = sprite.width - left - right;
    height = sprite.height - top - bottom;

    if (width < 1 || height < 1) {
      diagnostics.push(
        createCompilerDiagnostic(
          `The rect-inset command with top=${top}, right=${right}, bottom=${bottom}, left=${left} does not fit inside the current sprite size ${sprite.width}x${sprite.height}.`,
          node
        )
      );
      return null;
    }
  } else {
    x = readRequiredInteger(node, resolvedProperties.values, "x", diagnostics);
    y = readRequiredInteger(node, resolvedProperties.values, "y", diagnostics);
    width = readRequiredInteger(
      node,
      resolvedProperties.values,
      "width",
      diagnostics,
      { min: 1 }
    );
    height = readRequiredInteger(
      node,
      resolvedProperties.values,
      "height",
      diagnostics,
      { min: 1 }
    );
  }

  const color = readOptionalString(resolvedProperties.values, "color");
  const antialias = readOptionalBoolean(
    node,
    resolvedProperties.values,
    "antialias",
    diagnostics
  );
  const appearances = compileShapeAppearances(node, diagnostics);
  const fills: RectFill[] = appearances.fills;
  const glows: GlowAppearance[] = appearances.glows;
  const shadows: ShadowAppearance[] = appearances.shadows;
  const strokes: StrokeAppearance[] = appearances.strokes;
  let cut: RectCut | null = null;
  let radius: RectRadius | null = null;

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

  for (const child of node.children) {
    if (child.name === "cut") {
      cut = compileRectCut(child, diagnostics);
      continue;
    }

    if (child.name === "radius") {
      radius = compileRectRadius(child, diagnostics);
      continue;
    }

    if (
      child.name === "fill" ||
      child.name === "glow" ||
      child.name === "shadow" ||
      child.name === "stroke"
    ) {
      continue;
    }
  }

  if (
    x === null ||
    y === null ||
    width === null ||
    height === null
  ) {
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

  const rectCut: RectCut | null = cut;
  const rectRadius: RectRadius | null = radius;

  if (rectCut !== null && rectRadius !== null) {
    diagnostics.push(
      createCompilerDiagnostic(
        'The rect command currently does not allow both "cut" and "radius" on the same rectangle.',
        node
      )
    );
    return null;
  }

  if (rectCut !== null) {
    if (rectCut.topLeft + rectCut.topRight >= width) {
      diagnostics.push(
        createCompilerDiagnostic(
          `The cut command expects top-left (${rectCut.topLeft}) plus top-right (${rectCut.topRight}) to leave horizontal space inside width ${width}.`,
          node
        )
      );
      return null;
    }

    if (rectCut.bottomLeft + rectCut.bottomRight >= width) {
      diagnostics.push(
        createCompilerDiagnostic(
          `The cut command expects bottom-left (${rectCut.bottomLeft}) plus bottom-right (${rectCut.bottomRight}) to leave horizontal space inside width ${width}.`,
          node
        )
      );
      return null;
    }

    if (rectCut.topLeft + rectCut.bottomLeft >= height) {
      diagnostics.push(
        createCompilerDiagnostic(
          `The cut command expects top-left (${rectCut.topLeft}) plus bottom-left (${rectCut.bottomLeft}) to leave vertical space inside height ${height}.`,
          node
        )
      );
      return null;
    }

    if (rectCut.topRight + rectCut.bottomRight >= height) {
      diagnostics.push(
        createCompilerDiagnostic(
          `The cut command expects top-right (${rectCut.topRight}) plus bottom-right (${rectCut.bottomRight}) to leave vertical space inside height ${height}.`,
          node
        )
      );
      return null;
    }
  }

  if (rectRadius !== null) {
    const maxRadius = Math.floor(Math.min(width, height) / 2);

    if (rectRadius.value > maxRadius) {
      diagnostics.push(
        createCompilerDiagnostic(
          `The radius command expects a value no greater than ${maxRadius} for a rectangle sized ${width}x${height}.`,
          node
        )
      );
      return null;
    }
  }

  return {
    kind: "rect",
    lineNumber: node.lineNumber,
    x,
    y,
    width,
    height,
    ...(antialias === null ? {} : { antialias }),
    ...(rectCut === null ? {} : { cut: rectCut }),
    ...(rectRadius === null ? {} : { radius: rectRadius }),
    fills,
    ...(shadows.length === 0 ? {} : { shadows }),
    ...(glows.length === 0 ? {} : { glows }),
    strokes,
    sourceCommandName:
      node.name === "rect"
        ? "rect"
        : node.name === "rect-inset"
          ? "rect-inset"
          : "rect-absolute"
  };
}
