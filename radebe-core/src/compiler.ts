import {
  FILE_DEFINITION,
  getAllowedPropertyCommands,
  getCommandDefinition,
  hasCapability,
  type CommandDefinition
} from "./schema.js";

import type {
  CircleCommand,
  CompileResult,
  CompiledDrawCommand,
  GradientStop,
  GroupCommand,
  LinearGradientFill,
  PathCommand,
  ParsedCommandNode,
  ParsedDocument,
  PlotCommand,
  PolygonCommand,
  PolygonPoint,
  RadialGradientFill,
  RectCommand,
  RectCut,
  RectFill,
  RectRadius,
  RadebeDiagnostic,
  ShadowAppearance,
  SolidFill,
  StrokeAppearance,
  SpriteHeader
} from "./types.js";

function createCompilerDiagnostic(
  message: string,
  node: Pick<ParsedCommandNode, "lineNumber" | "column">
): RadebeDiagnostic {
  return {
    stage: "compiler",
    message,
    line: node.lineNumber,
    column: node.column
  };
}

const VARIABLE_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_-]*$/;
const VARIABLE_REFERENCE_PATTERN = /^\$([A-Za-z][A-Za-z0-9_-]*)$/;

type VariableEnvironment = Map<string, string>;

function parseArguments(
  node: ParsedCommandNode,
  definition: CommandDefinition
): { values: Map<string, string>; diagnostics: RadebeDiagnostic[] } {
  const values = new Map<string, string>();
  const diagnostics: RadebeDiagnostic[] = [];
  const shorthand = definition.shorthandSchema ?? [];
  let positionalIndex = 0;

  node.args.forEach((token) => {
    const equalsIndex = token.indexOf("=");

    if (equalsIndex > 0) {
      const key = token.slice(0, equalsIndex);
      const value = token.slice(equalsIndex + 1);

      if (value.length === 0) {
        diagnostics.push(
          createCompilerDiagnostic(
            `The ${definition.name} command received an empty value for "${key}".`,
            node
          )
        );
        return;
      }

      if (values.has(key)) {
        diagnostics.push(
          createCompilerDiagnostic(
            `The ${definition.name} command received duplicate "${key}" values.`,
            node
          )
        );
        return;
      }

      values.set(key, value);
      return;
    }

    const shorthandKey = shorthand[positionalIndex];

    if (!shorthandKey) {
      diagnostics.push(
        createCompilerDiagnostic(
          `The ${definition.name} command received too many positional arguments.`,
          node
        )
      );
      return;
    }

    if (values.has(shorthandKey)) {
      diagnostics.push(
        createCompilerDiagnostic(
          `The ${definition.name} command received duplicate "${shorthandKey}" values.`,
          node
        )
      );
      return;
    }

    values.set(shorthandKey, token);
    positionalIndex += 1;
  });

  return { values, diagnostics };
}

function setResolvedValue(
  values: Map<string, string>,
  propertyName: string,
  value: string,
  ownerNode: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[]
): void {
  if (values.has(propertyName)) {
    diagnostics.push(
      createCompilerDiagnostic(
        `The ${ownerNode.name} command received duplicate "${propertyName}" values.`,
        ownerNode
      )
    );
    return;
  }

  values.set(propertyName, value);
}

function allowsChild(
  parentDefinition: CommandDefinition,
  childDefinition: CommandDefinition
): boolean {
  if (parentDefinition.allowedChildCommands?.includes(childDefinition.name)) {
    return true;
  }

  if (getAllowedPropertyCommands(parentDefinition).includes(childDefinition.name)) {
    return true;
  }

  if (
    parentDefinition.allowedChildCapabilities?.some((capability) =>
      hasCapability(childDefinition, capability)
    )
  ) {
    return true;
  }

  return parentDefinition.allowedChildKinds?.includes(childDefinition.kind) ?? false;
}

function readRequiredString(
  node: ParsedCommandNode,
  values: Map<string, string>,
  key: string,
  diagnostics: RadebeDiagnostic[]
): string | null {
  const value = values.get(key);

  if (!value) {
    diagnostics.push(
      createCompilerDiagnostic(
        `The ${node.name} command requires "${key}".`,
        node
      )
    );
    return null;
  }

  return value;
}

function readOptionalString(
  values: Map<string, string>,
  key: string
): string | null {
  return values.get(key) ?? null;
}

function readOptionalBoolean(
  node: ParsedCommandNode,
  values: Map<string, string>,
  key: string,
  diagnostics: RadebeDiagnostic[]
): boolean | null {
  const token = values.get(key);

  if (token === undefined) {
    return null;
  }

  const normalized = token.toLowerCase();

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  diagnostics.push(
    createCompilerDiagnostic(
      `The ${node.name} command expects "${key}" to be either "true" or "false".`,
      node
    )
  );
  return null;
}

function resolveVariableToken(
  token: string,
  variables: VariableEnvironment,
  node: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[]
): string | null {
  if (!token.includes("$")) {
    return token;
  }

  const variableMatch = token.match(VARIABLE_REFERENCE_PATTERN);

  if (!variableMatch) {
    diagnostics.push(
      createCompilerDiagnostic(
        `Variable references must occupy a whole value token, such as "$accent". Received "${token}".`,
        node
      )
    );
    return null;
  }

  const variableName = variableMatch[1]!;
  const value = variables.get(variableName);

  if (value === undefined) {
    diagnostics.push(
      createCompilerDiagnostic(`Unknown variable "$${variableName}".`, node)
    );
    return null;
  }

  return value;
}

function resolveVariableArgumentToken(
  token: string,
  variables: VariableEnvironment,
  node: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[]
): string | null {
  const equalsIndex = token.indexOf("=");

  if (equalsIndex > 0) {
    const key = token.slice(0, equalsIndex);
    const value = token.slice(equalsIndex + 1);
    const resolvedValue = resolveVariableToken(value, variables, node, diagnostics);

    return resolvedValue === null ? null : `${key}=${resolvedValue}`;
  }

  return resolveVariableToken(token, variables, node, diagnostics);
}

function resolveVariableReferencesInNode(
  node: ParsedCommandNode,
  variables: VariableEnvironment,
  diagnostics: RadebeDiagnostic[]
): ParsedCommandNode | null {
  const resolvedArgs: string[] = [];
  const resolvedChildren: ParsedCommandNode[] = [];

  for (const token of node.args) {
    const resolvedToken = resolveVariableArgumentToken(
      token,
      variables,
      node,
      diagnostics
    );

    if (resolvedToken === null) {
      return null;
    }

    resolvedArgs.push(resolvedToken);
  }

  for (const child of node.children) {
    const resolvedChild = resolveVariableReferencesInNode(
      child,
      variables,
      diagnostics
    );

    if (resolvedChild === null) {
      return null;
    }

    resolvedChildren.push(resolvedChild);
  }

  return {
    ...node,
    args: resolvedArgs,
    children: resolvedChildren
  };
}

function readOptionalNumber(
  node: ParsedCommandNode,
  values: Map<string, string>,
  key: string,
  diagnostics: RadebeDiagnostic[],
  options?: { min?: number; max?: number }
): number | null {
  if (!values.has(key)) {
    return null;
  }

  return readRequiredNumber(node, values, key, diagnostics, options);
}

function readRequiredInteger(
  node: ParsedCommandNode,
  values: Map<string, string>,
  key: string,
  diagnostics: RadebeDiagnostic[],
  options?: { min?: number }
): number | null {
  const token = readRequiredString(node, values, key, diagnostics);

  if (token === null) {
    return null;
  }

  const value = Number.parseInt(token, 10);

  if (!Number.isInteger(value)) {
    diagnostics.push(
      createCompilerDiagnostic(
        `The ${node.name} command expects "${key}" to be an integer.`,
        node
      )
    );
    return null;
  }

  if (options?.min !== undefined && value < options.min) {
    diagnostics.push(
      createCompilerDiagnostic(
        `The ${node.name} command expects "${key}" to be at least ${options.min}.`,
        node
      )
    );
    return null;
  }

  return value;
}

function readOptionalInteger(
  node: ParsedCommandNode,
  values: Map<string, string>,
  key: string,
  diagnostics: RadebeDiagnostic[],
  options?: { min?: number }
): number | null {
  if (!values.has(key)) {
    return null;
  }

  return readRequiredInteger(node, values, key, diagnostics, options);
}

function readRequiredNumber(
  node: ParsedCommandNode,
  values: Map<string, string>,
  key: string,
  diagnostics: RadebeDiagnostic[],
  options?: { min?: number; max?: number }
): number | null {
  const token = readRequiredString(node, values, key, diagnostics);

  if (token === null) {
    return null;
  }

  const value = Number.parseFloat(token);

  if (!Number.isFinite(value)) {
    diagnostics.push(
      createCompilerDiagnostic(
        `The ${node.name} command expects "${key}" to be a number.`,
        node
      )
    );
    return null;
  }

  if (options?.min !== undefined && value < options.min) {
    diagnostics.push(
      createCompilerDiagnostic(
        `The ${node.name} command expects "${key}" to be at least ${options.min}.`,
        node
      )
    );
    return null;
  }

  if (options?.max !== undefined && value > options.max) {
    diagnostics.push(
      createCompilerDiagnostic(
        `The ${node.name} command expects "${key}" to be at most ${options.max}.`,
        node
      )
    );
    return null;
  }

  return value;
}

function validateChildren(
  node: ParsedCommandNode,
  definition: CommandDefinition,
  diagnostics: RadebeDiagnostic[]
): void {
  node.children.forEach((child) => {
    const childDefinition = getCommandDefinition(child.name);

    if (!childDefinition) {
      diagnostics.push(
        createCompilerDiagnostic(`Unknown command "${child.name}".`, child)
      );
      return;
    }

    if (!allowsChild(definition, childDefinition)) {
      diagnostics.push(
        createCompilerDiagnostic(
          `The ${definition.name} command does not allow child command "${child.name}".`,
          child
        )
      );
      return;
    }

    validateChildren(child, childDefinition, diagnostics);
  });
}

function resolveCommandProperties(
  node: ParsedCommandNode,
  definition: CommandDefinition
): { values: Map<string, string>; diagnostics: RadebeDiagnostic[] } {
  const diagnostics: RadebeDiagnostic[] = [];
  const parsedArguments = parseArguments(node, definition);
  const values = new Map(parsedArguments.values);
  diagnostics.push(...parsedArguments.diagnostics);
  validateChildren(node, definition, diagnostics);

  node.children.forEach((child) => {
    if (!getAllowedPropertyCommands(definition).includes(child.name)) {
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

function compileVariableDefinition(
  node: ParsedCommandNode,
  variables: VariableEnvironment,
  diagnostics: RadebeDiagnostic[]
): void {
  const definition = getCommandDefinition(node.name);

  if (!definition) {
    diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
    return;
  }

  const resolvedProperties = resolveCommandProperties(node, definition);
  diagnostics.push(...resolvedProperties.diagnostics);

  const name = readRequiredString(
    node,
    resolvedProperties.values,
    "name",
    diagnostics
  );
  const valueToken = readRequiredString(
    node,
    resolvedProperties.values,
    "value",
    diagnostics
  );

  if (name === null || valueToken === null) {
    return;
  }

  if (!VARIABLE_NAME_PATTERN.test(name)) {
    diagnostics.push(
      createCompilerDiagnostic(
        `The var command expects "name" to start with a letter and contain only letters, numbers, underscores, or hyphens.`,
        node
      )
    );
    return;
  }

  if (variables.has(name)) {
    diagnostics.push(
      createCompilerDiagnostic(`Variable "$${name}" is already defined.`, node)
    );
    return;
  }

  const value = resolveVariableToken(valueToken, variables, node, diagnostics);

  if (value === null) {
    return;
  }

  variables.set(name, value);
}

function compileVariableGroup(
  node: ParsedCommandNode,
  variables: VariableEnvironment,
  diagnostics: RadebeDiagnostic[]
): void {
  const definition = getCommandDefinition(node.name);

  if (!definition) {
    diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
    return;
  }

  validateChildren(node, definition, diagnostics);

  node.children.forEach((child) => {
    if (child.name === "var") {
      compileVariableDefinition(child, variables, diagnostics);
    }
  });
}

function compileSpriteHeader(
  node: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[]
): SpriteHeader | null {
  const definition = getCommandDefinition(node.name);

  if (!definition) {
    diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
    return null;
  }

  const resolvedProperties = resolveCommandProperties(node, definition);
  diagnostics.push(...resolvedProperties.diagnostics);

  const name = readRequiredString(
    node,
    resolvedProperties.values,
    "name",
    diagnostics
  );
  let width: number | null = null;
  let height: number | null = null;
  let background = "transparent";
  const antialias = readOptionalBoolean(
    node,
    resolvedProperties.values,
    "antialias",
    diagnostics
  );

  node.children.forEach((child) => {
    const childDefinition = getCommandDefinition(child.name);

    if (!childDefinition) {
      return;
    }

    const childProperties = resolveCommandProperties(child, childDefinition);
    diagnostics.push(...childProperties.diagnostics);

    if (child.name === "size") {
      width = readRequiredInteger(
        child,
        childProperties.values,
        "width",
        diagnostics,
        { min: 1 }
      );
      height = readRequiredInteger(
        child,
        childProperties.values,
        "height",
        diagnostics,
        { min: 1 }
      );
    }

    if (child.name === "background") {
      const color = readRequiredString(
        child,
        childProperties.values,
        "color",
        diagnostics
      );

      if (color) {
        background = color;
      }
    }
  });

  if (name === null || width === null || height === null) {
    return null;
  }

  return {
    name,
    width,
    height,
    background,
    ...(antialias === null ? {} : { antialias })
  };
}

function compilePlotCommand(
  node: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[]
): PlotCommand | null {
  const definition = getCommandDefinition(node.name);

  if (!definition) {
    diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
    return null;
  }

  const resolvedProperties = resolveCommandProperties(node, definition);
  diagnostics.push(...resolvedProperties.diagnostics);

  const x = readRequiredInteger(node, resolvedProperties.values, "x", diagnostics);
  const y = readRequiredInteger(node, resolvedProperties.values, "y", diagnostics);
  const color = readRequiredString(
    node,
    resolvedProperties.values,
    "color",
    diagnostics
  );

  if (x === null || y === null || color === null) {
    return null;
  }

  return {
    kind: "plot",
    lineNumber: node.lineNumber,
    x,
    y,
    color
  };
}

function compileLineCommand(
  node: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[]
): CompiledDrawCommand | null {
  const definition = getCommandDefinition(node.name);

  if (!definition) {
    diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
    return null;
  }

  const resolvedProperties = resolveCommandProperties(node, definition);
  diagnostics.push(...resolvedProperties.diagnostics);

  const x1 = readRequiredInteger(node, resolvedProperties.values, "x1", diagnostics);
  const y1 = readRequiredInteger(node, resolvedProperties.values, "y1", diagnostics);
  const x2 = readRequiredInteger(node, resolvedProperties.values, "x2", diagnostics);
  const y2 = readRequiredInteger(node, resolvedProperties.values, "y2", diagnostics);
  const color = readRequiredString(
    node,
    resolvedProperties.values,
    "color",
    diagnostics
  );
  const antialias = readOptionalBoolean(
    node,
    resolvedProperties.values,
    "antialias",
    diagnostics
  );

  if (x1 === null || y1 === null || x2 === null || y2 === null || color === null) {
    return null;
  }

  return {
    kind: "line",
    lineNumber: node.lineNumber,
    x1,
    y1,
    x2,
    y2,
    color,
    ...(antialias === null ? {} : { antialias })
  };
}

function compileShapeAppearances(
  node: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[]
): {
  fills: RectFill[];
  shadows: ShadowAppearance[];
  strokes: StrokeAppearance[];
} {
  const fills: RectFill[] = [];
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

  return { fills, shadows, strokes };
}

function compileRectCommand(
  node: ParsedCommandNode,
  sprite: SpriteHeader,
  diagnostics: RadebeDiagnostic[]
): RectCommand | null {
  const definition = getCommandDefinition(node.name);

  if (!definition) {
    diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
    return null;
  }

  const resolvedProperties = resolveCommandProperties(node, definition);
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

  if (fills.length === 0 && shadows.length === 0 && strokes.length === 0) {
    diagnostics.push(
      createCompilerDiagnostic(
        `The ${node.name} command requires a color shorthand, a fill child, a shadow child, or a stroke child.`,
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
    strokes,
    sourceCommandName:
      node.name === "rect"
        ? "rect"
        : node.name === "rect-inset"
          ? "rect-inset"
          : "rect-absolute"
  };
}

function compileCircleCommand(
  node: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[]
): CircleCommand | null {
  const definition = getCommandDefinition(node.name);

  if (!definition) {
    diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
    return null;
  }

  const resolvedProperties = resolveCommandProperties(node, definition);
  diagnostics.push(...resolvedProperties.diagnostics);

  const x = readRequiredInteger(node, resolvedProperties.values, "x", diagnostics);
  const y = readRequiredInteger(node, resolvedProperties.values, "y", diagnostics);
  const radius = readRequiredInteger(
    node,
    resolvedProperties.values,
    "radius",
    diagnostics,
    { min: 1 }
  );
  const color = readOptionalString(resolvedProperties.values, "color");
  const antialias = readOptionalBoolean(
    node,
    resolvedProperties.values,
    "antialias",
    diagnostics
  );
  const appearances = compileShapeAppearances(node, diagnostics);
  const fills: RectFill[] = appearances.fills;
  const shadows: ShadowAppearance[] = appearances.shadows;
  const strokes: StrokeAppearance[] = appearances.strokes;

  if (color !== null) {
    fills.unshift({
      kind: "solid",
      color,
      alpha: 1
    });
  }

  if (x === null || y === null || radius === null) {
    return null;
  }

  if (fills.length === 0 && shadows.length === 0 && strokes.length === 0) {
    diagnostics.push(
      createCompilerDiagnostic(
        "The circle command requires a color shorthand, a fill child, a shadow child, or a stroke child.",
        node
      )
    );
    return null;
  }

  return {
    kind: "circle",
    lineNumber: node.lineNumber,
    x,
    y,
    radius,
    ...(antialias === null ? {} : { antialias }),
    fills,
    ...(shadows.length === 0 ? {} : { shadows }),
    strokes
  };
}

function compilePolygonPoint(
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

function compilePolygonCommand(
  node: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[]
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
    const trailingNumber =
      trailingToken === null ? Number.NaN : Number.parseInt(trailingToken, 10);

    if (
      trailingToken !== null &&
      !Number.isInteger(trailingNumber) &&
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
    const x = Number.parseInt(xToken, 10);
    const y = Number.parseInt(yToken, 10);

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

  if (points.length < 3) {
    diagnostics.push(
      createCompilerDiagnostic(
        "The polygon command requires at least three points.",
        node
      )
    );
    return null;
  }

  const doubledArea = points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length]!;
    return sum + point.x * next.y - next.x * point.y;
  }, 0);

  if (doubledArea === 0) {
    diagnostics.push(
      createCompilerDiagnostic(
        "The polygon command requires points that enclose a non-zero area.",
        node
      )
    );
    return null;
  }

  if (fills.length === 0 && shadows.length === 0 && strokes.length === 0) {
    diagnostics.push(
      createCompilerDiagnostic(
        "The polygon command requires a color shorthand, a fill child, a shadow child, or a stroke child.",
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
    points,
    fills,
    ...(shadows.length === 0 ? {} : { shadows }),
    strokes
  };
}

function compilePathCommand(
  node: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[]
): PathCommand | null {
  const definition = getCommandDefinition(node.name);

  if (!definition) {
    diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
    return null;
  }

  const resolvedProperties = resolveCommandProperties(node, definition);
  diagnostics.push(...resolvedProperties.diagnostics);
  validateChildren(node, definition, diagnostics);

  const name = readOptionalString(resolvedProperties.values, "name");
  const antialias = readOptionalBoolean(
    node,
    resolvedProperties.values,
    "antialias",
    diagnostics
  );
  const points: PolygonPoint[] = [];
  const strokes: StrokeAppearance[] = [];

  node.children.forEach((child) => {
    if (child.name === "point") {
      const point = compilePolygonPoint(child, diagnostics);

      if (point !== null) {
        points.push(point);
      }

      return;
    }

    if (child.name === "stroke") {
      const stroke = compileStroke(child, diagnostics);

      if (stroke !== null) {
        strokes.push(stroke);
      }
    }
  });

  if (points.length < 2) {
    diagnostics.push(
      createCompilerDiagnostic(
        "The path command requires at least two points.",
        node
      )
    );
    return null;
  }

  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index]!;
    const next = points[index + 1]!;

    if (current.x === next.x && current.y === next.y) {
      diagnostics.push(
        createCompilerDiagnostic(
          "The path command does not allow consecutive duplicate points.",
          node
        )
      );
      return null;
    }
  }

  if (strokes.length === 0) {
    diagnostics.push(
      createCompilerDiagnostic(
        "The path command requires at least one stroke child because open paths are only visible through stroke in the current slice.",
        node
      )
    );
    return null;
  }

  for (const stroke of strokes) {
    if (stroke.align !== "center") {
      diagnostics.push(
        createCompilerDiagnostic(
          'The path command currently supports only `stroke` align "center".',
          node
        )
      );
      return null;
    }
  }

  return {
    kind: "path",
    lineNumber: node.lineNumber,
    name,
    ...(antialias === null ? {} : { antialias }),
    points,
    strokes
  };
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

function compileRectCut(
  node: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[]
): RectCut | null {
  const definition = getCommandDefinition(node.name);

  if (!definition) {
    diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
    return null;
  }

  validateChildren(node, definition, diagnostics);

  let topLeftToken: string | null = null;
  let topRightToken: string | null = null;
  let bottomRightToken: string | null = null;
  let bottomLeftToken: string | null = null;

  if (node.args.length === 1) {
    [topLeftToken] = node.args;
    topRightToken = topLeftToken;
    bottomRightToken = topLeftToken;
    bottomLeftToken = topLeftToken;
  } else if (node.args.length === 4) {
    [topLeftToken, topRightToken, bottomRightToken, bottomLeftToken] = node.args;
  } else if (node.args.length > 0) {
    diagnostics.push(
      createCompilerDiagnostic(
        'The cut command expects either one value or four values in "top-left top-right bottom-right bottom-left" order.',
        node
      )
    );
    return null;
  }

  const resolvedProperties = resolveCommandProperties(node, definition);
  diagnostics.push(...resolvedProperties.diagnostics);

  if (topLeftToken !== null) {
    resolvedProperties.values.set("top-left", topLeftToken);
  }
  if (topRightToken !== null) {
    resolvedProperties.values.set("top-right", topRightToken);
  }
  if (bottomRightToken !== null) {
    resolvedProperties.values.set("bottom-right", bottomRightToken);
  }
  if (bottomLeftToken !== null) {
    resolvedProperties.values.set("bottom-left", bottomLeftToken);
  }

  const topLeft = readRequiredInteger(
    node,
    resolvedProperties.values,
    "top-left",
    diagnostics,
    { min: 0 }
  );
  const topRight = readRequiredInteger(
    node,
    resolvedProperties.values,
    "top-right",
    diagnostics,
    { min: 0 }
  );
  const bottomRight = readRequiredInteger(
    node,
    resolvedProperties.values,
    "bottom-right",
    diagnostics,
    { min: 0 }
  );
  const bottomLeft = readRequiredInteger(
    node,
    resolvedProperties.values,
    "bottom-left",
    diagnostics,
    { min: 0 }
  );

  if (
    topLeft === null ||
    topRight === null ||
    bottomRight === null ||
    bottomLeft === null
  ) {
    return null;
  }

  return {
    topLeft,
    topRight,
    bottomRight,
    bottomLeft
  };
}

function compileRectRadius(
  node: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[]
): RectRadius | null {
  const definition = getCommandDefinition(node.name);

  if (!definition) {
    diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
    return null;
  }

  const resolvedProperties = resolveCommandProperties(node, definition);
  diagnostics.push(...resolvedProperties.diagnostics);

  const value = readRequiredInteger(node, resolvedProperties.values, "value", diagnostics, {
    min: 0
  });

  if (value === null) {
    return null;
  }

  return { value };
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

  const stops = stopChildren
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

function compileFill(
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

function compileStroke(
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

  const align =
    alignToken === null ? "center" : alignToken === "inside" || alignToken === "center" || alignToken === "outside"
      ? alignToken
      : null;

  if (align === null) {
    diagnostics.push(
      createCompilerDiagnostic(
        'The stroke command only supports align values "inside", "center", or "outside".',
        node
      )
    );
    return null;
  }

  const style =
    styleToken === null ? "solid" : styleToken === "solid" || styleToken === "dashed" || styleToken === "dotted"
      ? styleToken
      : null;

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

function compileShadow(
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
    alpha,
    fill: fills[0] ?? null
  };
}

function compileDrawCommand(
  node: ParsedCommandNode,
  sprite: SpriteHeader,
  diagnostics: RadebeDiagnostic[]
): CompiledDrawCommand | null {
  if (node.name === "group") {
    return compileGroupCommand(node, sprite, diagnostics);
  }

  if (node.name === "plot") {
    return compilePlotCommand(node, diagnostics);
  }

  if (node.name === "line") {
    return compileLineCommand(node, diagnostics);
  }

  if (node.name === "circle") {
    return compileCircleCommand(node, diagnostics);
  }

  if (node.name === "polygon") {
    return compilePolygonCommand(node, diagnostics);
  }

  if (node.name === "path") {
    return compilePathCommand(node, diagnostics);
  }

  if (
    node.name === "rect" ||
    node.name === "rect-absolute" ||
    node.name === "rect-inset"
  ) {
    return compileRectCommand(node, sprite, diagnostics);
  }

  diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
  return null;
}

function compileGroupCommand(
  node: ParsedCommandNode,
  sprite: SpriteHeader,
  diagnostics: RadebeDiagnostic[]
): GroupCommand | null {
  const definition = getCommandDefinition(node.name);
  const commands: CompiledDrawCommand[] = [];
  const fills: RectFill[] = [];
  const shadows: ShadowAppearance[] = [];
  const strokes: StrokeAppearance[] = [];
  let sawDrawable = false;
  let sawPass = false;
  let invalidPassBeforeDrawable = false;

  if (!definition) {
    diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
    return null;
  }

  const parsedArguments = parseArguments(node, definition);
  const propertyValues = new Map(parsedArguments.values);
  diagnostics.push(...parsedArguments.diagnostics);

  node.children.forEach((child) => {
    const childDefinition = getCommandDefinition(child.name);

    if (!childDefinition) {
      diagnostics.push(createCompilerDiagnostic(`Unknown command "${child.name}".`, child));
      return;
    }

    if (!allowsChild(definition, childDefinition)) {
      diagnostics.push(
        createCompilerDiagnostic(
          `The group command does not allow child command "${child.name}".`,
          child
        )
      );
      return;
    }

    if (getAllowedPropertyCommands(definition).includes(child.name)) {
      if (sawDrawable || sawPass) {
        diagnostics.push(
          createCompilerDiagnostic(
            "The group command expects property commands before child draw commands and group-level passes.",
            child
          )
        );
        return;
      }

      const childArguments = parseArguments(child, childDefinition);
      diagnostics.push(...childArguments.diagnostics);
      const value = childArguments.values.get("value");

      if (!value) {
        diagnostics.push(
          createCompilerDiagnostic(`The ${child.name} command requires "value".`, child)
        );
        return;
      }

      setResolvedValue(propertyValues, child.name, value, node, diagnostics);
      return;
    }

    if (child.name === "fill" || child.name === "shadow" || child.name === "stroke") {
      if (!sawDrawable) {
        invalidPassBeforeDrawable = true;
        sawPass = true;
        diagnostics.push(
          createCompilerDiagnostic(
            "The group command expects at least one child draw command before group-level appearance or effect passes.",
            child
          )
        );
        return;
      }

      sawPass = true;

      if (child.name === "fill") {
        const fill = compileFill(child, diagnostics);

        if (fill) {
          fills.push(fill);
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

      const stroke = compileStroke(child, diagnostics);

      if (stroke) {
        strokes.push(stroke);
      }
      return;
    }

    if (sawPass) {
      diagnostics.push(
        createCompilerDiagnostic(
          "The group command expects all child draw commands before group-level appearance or effect passes.",
          child
        )
      );
      return;
    }

    const compiledCommand = compileDrawCommand(child, sprite, diagnostics);

    if (compiledCommand) {
      commands.push(compiledCommand);
      sawDrawable = true;
    }
  });

  if (invalidPassBeforeDrawable && commands.length === 0) {
    return null;
  }

  return {
    kind: "group",
    lineNumber: node.lineNumber,
    name: readOptionalString(propertyValues, "name"),
    commands,
    fills,
    ...(shadows.length === 0 ? {} : { shadows }),
    strokes
  };
}

function compileRootCommand(
  node: ParsedCommandNode,
  sprite: SpriteHeader | null,
  diagnostics: RadebeDiagnostic[]
): CompiledDrawCommand[] {
  const definition = getCommandDefinition(node.name);

  if (!definition) {
    diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
    return [];
  }

  if (!allowsChild(FILE_DEFINITION, definition)) {
    diagnostics.push(
      createCompilerDiagnostic(
        `The file root does not allow command "${node.name}".`,
        node
      )
    );
    return [];
  }

  if (node.name === "sprite") {
    diagnostics.push(
      createCompilerDiagnostic(
        "The sprite header may only appear once at the top of the file.",
        node
      )
    );
    return [];
  }

  if (sprite === null) {
    diagnostics.push(
      createCompilerDiagnostic(
        "Root draw commands require a sprite header before drawing commands.",
        node
      )
    );
    return [];
  }

  if (node.name === "group") {
    const compiledGroup = compileGroupCommand(node, sprite, diagnostics);

    return compiledGroup === null ? [] : [compiledGroup];
  }

  const compiledCommand = compileDrawCommand(node, sprite, diagnostics);

  return compiledCommand === null ? [] : [compiledCommand];
}

export function compileDocument(document: ParsedDocument): CompileResult {
  const diagnostics: RadebeDiagnostic[] = [];
  const commands: CompiledDrawCommand[] = [];
  const variables: VariableEnvironment = new Map();
  let sprite: SpriteHeader | null = null;

  document.commands.forEach((node, index) => {
    const definition = getCommandDefinition(node.name);

    if (!definition) {
      diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
      return;
    }

    if (!allowsChild(FILE_DEFINITION, definition)) {
      diagnostics.push(
        createCompilerDiagnostic(
          `The file root does not allow command "${node.name}".`,
          node
        )
      );
      return;
    }

    if (node.name === "sprite") {
      if (index !== 0) {
        diagnostics.push(
          createCompilerDiagnostic(
            "The sprite header must be the first root command in the file.",
            node
          )
        );
      }

      if (sprite !== null) {
        diagnostics.push(
          createCompilerDiagnostic(
            "Only one sprite header is allowed per file.",
            node
          )
        );
        return;
      }

      sprite = compileSpriteHeader(node, diagnostics);
      return;
    }

    if (node.name === "var") {
      compileVariableDefinition(node, variables, diagnostics);
      return;
    }

    if (node.name === "vars") {
      compileVariableGroup(node, variables, diagnostics);
      return;
    }

    const resolvedNode = resolveVariableReferencesInNode(
      node,
      variables,
      diagnostics
    );

    if (resolvedNode === null) {
      return;
    }

    const compiledCommands = compileRootCommand(resolvedNode, sprite, diagnostics);

    commands.push(...compiledCommands);
  });

  if (sprite === null) {
    diagnostics.push({
      stage: "compiler",
      message: "A sprite header is required before root draw commands.",
      line: 1,
      column: 1
    });
  }

  return {
    document: {
      kind: "compiled-document",
      source: document.source,
      sprite,
      commands
    },
    diagnostics
  };
}
