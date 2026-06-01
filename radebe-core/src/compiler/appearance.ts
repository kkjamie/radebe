import { getCommandDefinition } from "../schema.js";

import type {
  GlowAppearance,
  GlowMode,
  GradientStop,
  LinearGradientFill,
  ParsedCommandNode,
  RadialGradientFill,
  RadebeDiagnostic,
  RectFill,
  ShadowAppearance,
  SolidFill,
  StrokeAlign,
  StrokeAppearance,
  StrokeStyle
} from "../types.js";

import {
  allowsChild,
  createCompilerDiagnostic,
  parseArguments,
  readOptionalInteger,
  readOptionalNumber,
  readOptionalString,
  readRequiredInteger,
  readRequiredNumber,
  readRequiredString,
  resolveCommandProperties,
  setResolvedValue,
  validateChildren
} from "./shared.js";

export function compileShapeAppearances(
  node: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[]
): {
  fills: RectFill[];
  glows: GlowAppearance[];
  shadows: ShadowAppearance[];
  strokes: StrokeAppearance[];
} {
  const fills: RectFill[] = [];
  const glows: GlowAppearance[] = [];
  const shadows: ShadowAppearance[] = [];
  const strokes: StrokeAppearance[] = [];

  node.children.forEach((child) => {
    if (child.name === "fill") {
      const fill = compileFill(child, diagnostics);

      if (fill) {
        fills.push(fill);
      }

      return;
    }

    if (child.name === "glow") {
      const glow = compileGlow(child, diagnostics);

      if (glow) {
        glows.push(glow);
      }

      return;
    }

    if (child.name === "shadow") {
      const shadow = compileShadow(child, diagnostics);

      if (shadow) {
        shadows.push(shadow);
      }

      return;
    }

    if (child.name === "stroke") {
      const stroke = compileStroke(child, diagnostics);

      if (stroke) {
        strokes.push(stroke);
      }
    }
  });

  return { fills, glows, shadows, strokes };
}

function compileSolid(
  node: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[],
  alpha: number
): SolidFill | null {
  const definition = getCommandDefinition(node.name);

  if (!definition) {
    diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
    return null;
  }

  const resolvedProperties = resolveCommandProperties(node, definition);
  diagnostics.push(...resolvedProperties.diagnostics);

  const color = readRequiredString(
    node,
    resolvedProperties.values,
    "color",
    diagnostics
  );

  if (color === null) {
    return null;
  }

  return {
    kind: "solid",
    color,
    alpha
  };
}

function compileGradientStop(
  node: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[]
): GradientStop | null {
  const definition = getCommandDefinition(node.name);

  if (!definition) {
    diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
    return null;
  }

  const resolvedProperties = resolveCommandProperties(node, definition);
  diagnostics.push(...resolvedProperties.diagnostics);

  const color = readRequiredString(
    node,
    resolvedProperties.values,
    "color",
    diagnostics
  );
  const position = readRequiredNumber(
    node,
    resolvedProperties.values,
    "position",
    diagnostics,
    { min: 0, max: 1 }
  );

  if (color === null || position === null) {
    return null;
  }

  return {
    color,
    position
  };
}

function compileGradientStops(
  node: ParsedCommandNode,
  values: Map<string, string>,
  diagnostics: RadebeDiagnostic[]
): GradientStop[] | null {
  const from = readOptionalString(values, "from");
  const to = readOptionalString(values, "to");
  const stopChildren = node.children.filter((child) => child.name === "stop");

  if ((from !== null || to !== null) && stopChildren.length > 0) {
    diagnostics.push(
      createCompilerDiagnostic(
        `The ${node.name} command should use either shorthand "from/to" colors or explicit stop children, not both.`,
        node
      )
    );
    return null;
  }

  if (from !== null || to !== null) {
    if (from === null || to === null) {
      diagnostics.push(
        createCompilerDiagnostic(
          `The ${node.name} command requires both "from" and "to" colors when using shorthand form.`,
          node
        )
      );
      return null;
    }

    return [
      { color: from, position: 0 },
      { color: to, position: 1 }
    ];
  }

  if (stopChildren.length < 2) {
    diagnostics.push(
      createCompilerDiagnostic(
        `The ${node.name} command requires at least two "stop" children.`,
        node
      )
    );
    return null;
  }

  const stops: GradientStop[] = stopChildren
    .map((child) => compileGradientStop(child, diagnostics))
    .filter((stop): stop is GradientStop => stop !== null);

  if (stops.length < 2) {
    return null;
  }

  return stops;
}

function compileLinearGradient(
  node: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[],
  alpha: number
): LinearGradientFill | null {
  const definition = getCommandDefinition(node.name);

  if (!definition) {
    diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
    return null;
  }

  const resolvedProperties = resolveCommandProperties(node, definition);
  diagnostics.push(...resolvedProperties.diagnostics);

  const direction = readOptionalString(resolvedProperties.values, "direction");
  const angle = readOptionalNumber(
    node,
    resolvedProperties.values,
    "angle",
    diagnostics
  );
  const stops = compileGradientStops(node, resolvedProperties.values, diagnostics);

  if (stops === null) {
    return null;
  }

  if (direction !== null && angle !== null) {
    diagnostics.push(
      createCompilerDiagnostic(
        `The ${node.name} command should use either "direction" or "angle", not both.`,
        node
      )
    );
    return null;
  }

  if (
    direction !== null &&
    direction !== "horizontal" &&
    direction !== "vertical"
  ) {
    diagnostics.push(
      createCompilerDiagnostic(
        `The ${node.name} command only supports "horizontal" or "vertical" direction right now.`,
        node
      )
    );
    return null;
  }

  return {
    kind: "gradient-linear",
    direction: direction === "vertical" ? "vertical" : "horizontal",
    angle,
    stops,
    alpha
  };
}

function compileRadialGradient(
  node: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[],
  alpha: number
): RadialGradientFill | null {
  const definition = getCommandDefinition(node.name);

  if (!definition) {
    diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
    return null;
  }

  const resolvedProperties = resolveCommandProperties(node, definition);
  diagnostics.push(...resolvedProperties.diagnostics);

  const centerX =
    readOptionalNumber(node, resolvedProperties.values, "center-x", diagnostics, {
      min: 0,
      max: 1
    }) ?? 0.5;
  const centerY =
    readOptionalNumber(node, resolvedProperties.values, "center-y", diagnostics, {
      min: 0,
      max: 1
    }) ?? 0.5;
  const radius =
    readOptionalNumber(node, resolvedProperties.values, "radius", diagnostics, {
      min: 0.0001
    }) ?? 1;
  const stops = compileGradientStops(node, resolvedProperties.values, diagnostics);

  if (stops === null) {
    return null;
  }

  return {
    kind: "gradient-radial",
    centerX,
    centerY,
    radius,
    stops,
    alpha
  };
}

export function compileFill(
  node: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[]
): RectFill | null {
  const definition = getCommandDefinition(node.name);

  if (!definition) {
    diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
    return null;
  }

  validateChildren(node, definition, diagnostics);

  const fillPropertyValues = new Map<string, string>();
  let variantName: string | null = null;
  const variantArgs: string[] = [];

  node.args.forEach((token) => {
    const equalsIndex = token.indexOf("=");

    if (equalsIndex > 0) {
      const key = token.slice(0, equalsIndex);
      const value = token.slice(equalsIndex + 1);

      if (key === "alpha") {
        if (value.length === 0) {
          diagnostics.push(
            createCompilerDiagnostic(
              'The fill command received an empty value for "alpha".',
              node
            )
          );
          return;
        }

        setResolvedValue(fillPropertyValues, key, value, node, diagnostics);
        return;
      }
    }

    if (variantName === null) {
      variantName = token;
      return;
    }

    variantArgs.push(token);
  });

  node.children.forEach((child) => {
    if (child.name !== "alpha") {
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
          'The alpha command requires "value".',
          child
        )
      );
      return;
    }

    setResolvedValue(fillPropertyValues, "alpha", value, node, diagnostics);
  });

  const alpha =
    readOptionalNumber(node, fillPropertyValues, "alpha", diagnostics, {
      min: 0,
      max: 1
    }) ?? 1;

  if (variantName !== null) {
    const variantDefinition = getCommandDefinition(variantName);

    if (!variantDefinition || !allowsChild(definition, variantDefinition)) {
      diagnostics.push(
        createCompilerDiagnostic(
          `The fill command does not allow child command "${variantName}".`,
          node
        )
      );
      return null;
    }

    const syntheticNode: ParsedCommandNode = {
      name: variantName,
      args: variantArgs,
      children: [],
      lineNumber: node.lineNumber,
      column: node.column,
      indentLevel: node.indentLevel
    };

    if (variantName === "solid") {
      return compileSolid(syntheticNode, diagnostics, alpha);
    }

    if (variantName === "gradient" || variantName === "gradient-linear") {
      return compileLinearGradient(syntheticNode, diagnostics, alpha);
    }

    if (variantName === "gradient-radial") {
      return compileRadialGradient(syntheticNode, diagnostics, alpha);
    }
  }

  const variantChildren = node.children.filter(
    (child) =>
      child.name === "solid" ||
      child.name === "gradient" ||
      child.name === "gradient-linear" ||
      child.name === "gradient-radial"
  );

  if (variantChildren.length === 0) {
    diagnostics.push(
      createCompilerDiagnostic(
        'The fill command currently requires a "solid", "gradient", "gradient-linear", or "gradient-radial" child or shorthand.',
        node
      )
    );
    return null;
  }

  if (variantChildren.length > 1) {
    diagnostics.push(
      createCompilerDiagnostic(
        "The fill command currently supports only one appearance variant per fill node.",
        node
      )
    );
    return null;
  }

  const variantNode = variantChildren[0]!;

  if (variantNode.name === "solid") {
    return compileSolid(variantNode, diagnostics, alpha);
  }

  if (variantNode.name === "gradient-radial") {
    return compileRadialGradient(variantNode, diagnostics, alpha);
  }

  return compileLinearGradient(variantNode, diagnostics, alpha);
}

function toStrokeAlign(token: string | null): StrokeAlign | null {
  if (token === null) {
    return "center";
  }

  return token === "inside" || token === "center" || token === "outside"
    ? token
    : null;
}

function toStrokeStyle(token: string | null): StrokeStyle | null {
  if (token === null) {
    return "solid";
  }

  return token === "solid" || token === "dashed" || token === "dotted"
    ? token
    : null;
}

export function compileStroke(
  node: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[]
): StrokeAppearance | null {
  const definition = getCommandDefinition(node.name);

  if (!definition) {
    diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
    return null;
  }

  const resolvedProperties = resolveCommandProperties(node, definition);
  diagnostics.push(...resolvedProperties.diagnostics);

  const width = readRequiredInteger(
    node,
    resolvedProperties.values,
    "width",
    diagnostics,
    { min: 1 }
  );
  const color = readOptionalString(resolvedProperties.values, "color");
  const alpha =
    readOptionalNumber(node, resolvedProperties.values, "alpha", diagnostics, {
      min: 0,
      max: 1
    }) ?? 1;
  const alignToken = readOptionalString(resolvedProperties.values, "align");
  const styleToken = readOptionalString(resolvedProperties.values, "style");
  const dashLength = readOptionalNumber(
    node,
    resolvedProperties.values,
    "dash-length",
    diagnostics,
    { min: 1 }
  );
  const gapLength = readOptionalNumber(
    node,
    resolvedProperties.values,
    "gap-length",
    diagnostics,
    { min: 0 }
  );
  const dotSpacing = readOptionalNumber(
    node,
    resolvedProperties.values,
    "dot-spacing",
    diagnostics,
    { min: 0 }
  );

  if (width === null) {
    return null;
  }

  const align: StrokeAlign | null = toStrokeAlign(alignToken);

  if (align === null) {
    diagnostics.push(
      createCompilerDiagnostic(
        'The stroke command only supports align values "inside", "center", or "outside".',
        node
      )
    );
    return null;
  }

  const style: StrokeStyle | null = toStrokeStyle(styleToken);

  if (style === null) {
    diagnostics.push(
      createCompilerDiagnostic(
        'The stroke command only supports style values "solid", "dashed", or "dotted".',
        node
      )
    );
    return null;
  }

  const fills: RectFill[] = [];
  const strokes: StrokeAppearance[] = [];

  if (color !== null) {
    fills.push({
      kind: "solid",
      color,
      alpha: 1
    });
  }

  node.children.forEach((child) => {
    if (child.name === "fill") {
      const fill = compileFill(child, diagnostics);

      if (fill) {
        fills.push(fill);
      }

      return;
    }

    if (child.name === "stroke") {
      const nestedStroke = compileStroke(child, diagnostics);

      if (nestedStroke) {
        strokes.push(nestedStroke);
      }
    }
  });

  if (fills.length === 0 && strokes.length === 0) {
    diagnostics.push(
      createCompilerDiagnostic(
        "The stroke command requires a color shorthand, a fill child, or a nested stroke child.",
        node
      )
    );
    return null;
  }

  if (fills.length > 1) {
    diagnostics.push(
      createCompilerDiagnostic(
        "The first stroke slice supports only one fill per stroke node.",
        node
      )
    );
    return null;
  }

  return {
    kind: "stroke",
    width,
    align,
    style,
    alpha,
    dashLength,
    gapLength,
    dotSpacing,
    fill: fills[0] ?? null,
    strokes
  };
}

export function compileGlow(
  node: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[]
): GlowAppearance | null {
  const definition = getCommandDefinition(node.name);

  if (!definition) {
    diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
    return null;
  }

  const resolvedProperties = resolveCommandProperties(node, definition);
  diagnostics.push(...resolvedProperties.diagnostics);

  const modeToken = readOptionalString(resolvedProperties.values, "mode") ?? "outer";
  let mode: GlowMode | null = null;

  if (modeToken === "inner" || modeToken === "outer") {
    mode = modeToken;
  } else {
    diagnostics.push(
      createCompilerDiagnostic(
        'The glow command expects "mode" to be either "inner" or "outer".',
        node
      )
    );
  }

  const color = readOptionalString(resolvedProperties.values, "color");
  const spread =
    readOptionalInteger(node, resolvedProperties.values, "spread", diagnostics, {
      min: 0
    }) ?? 0;
  const blur =
    readOptionalInteger(node, resolvedProperties.values, "blur", diagnostics, {
      min: 0
    }) ?? 1;
  const alpha =
    readOptionalNumber(node, resolvedProperties.values, "alpha", diagnostics, {
      min: 0,
      max: 1
    }) ?? 1;
  const fills: RectFill[] = [];

  if (color !== null) {
    fills.push({
      kind: "solid",
      color,
      alpha: 1
    });
  }

  node.children.forEach((child) => {
    if (child.name !== "fill") {
      return;
    }

    const fill = compileFill(child, diagnostics);

    if (fill) {
      fills.push(fill);
    }
  });

  if (mode === null) {
    return null;
  }

  if (fills.length === 0) {
    diagnostics.push(
      createCompilerDiagnostic(
        "The glow command requires a color shorthand or a fill child.",
        node
      )
    );
    return null;
  }

  if (fills.length > 1) {
    diagnostics.push(
      createCompilerDiagnostic(
        "The first glow slice supports only one fill per glow node.",
        node
      )
    );
    return null;
  }

  return {
    kind: "glow",
    mode,
    spread,
    blur,
    alpha,
    fill: fills[0] ?? null
  };
}

export function compileShadow(
  node: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[]
): ShadowAppearance | null {
  const definition = getCommandDefinition(node.name);

  if (!definition) {
    diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
    return null;
  }

  const resolvedProperties = resolveCommandProperties(node, definition);
  diagnostics.push(...resolvedProperties.diagnostics);

  const offsetX =
    readOptionalNumber(node, resolvedProperties.values, "x", diagnostics) ?? 0;
  const offsetY =
    readOptionalNumber(node, resolvedProperties.values, "y", diagnostics) ?? 0;
  const color = readOptionalString(resolvedProperties.values, "color");
  const spread =
    readOptionalInteger(node, resolvedProperties.values, "spread", diagnostics) ?? 0;
  const blur =
    readOptionalInteger(node, resolvedProperties.values, "blur", diagnostics, {
      min: 0
    }) ?? 0;
  const alpha =
    readOptionalNumber(node, resolvedProperties.values, "alpha", diagnostics, {
      min: 0,
      max: 1
    }) ?? 1;
  const fills: RectFill[] = [];

  if (color !== null) {
    fills.push({
      kind: "solid",
      color,
      alpha: 1
    });
  }

  node.children.forEach((child) => {
    if (child.name !== "fill") {
      return;
    }

    const fill = compileFill(child, diagnostics);

    if (fill) {
      fills.push(fill);
    }
  });

  if (fills.length === 0) {
    diagnostics.push(
      createCompilerDiagnostic(
        "The shadow command requires a color shorthand or a fill child.",
        node
      )
    );
    return null;
  }

  if (fills.length > 1) {
    diagnostics.push(
      createCompilerDiagnostic(
        "The first shadow slice supports only one fill per shadow node.",
        node
      )
    );
    return null;
  }

  return {
    kind: "shadow",
    offsetX,
    offsetY,
    spread,
    blur,
    alpha,
    fill: fills[0] ?? null
  };
}
