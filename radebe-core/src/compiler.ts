import {
  FILE_DEFINITION,
  getCommandDefinition,
  type CommandDefinition
} from "./schema.js";

import type {
  CompileResult,
  CompiledDrawCommand,
  ParsedCommandNode,
  ParsedDocument,
  PlotCommand,
  RadebeDiagnostic,
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

    values.set(shorthandKey, token);
    positionalIndex += 1;
  });

  return { values, diagnostics };
}

function allowsChild(
  parentDefinition: CommandDefinition,
  childDefinition: CommandDefinition
): boolean {
  if (parentDefinition.allowedChildCommands?.includes(childDefinition.name)) {
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

function compileSpriteHeader(
  node: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[]
): SpriteHeader | null {
  const definition = getCommandDefinition(node.name);

  if (!definition) {
    diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
    return null;
  }

  const parsedArguments = parseArguments(node, definition);
  diagnostics.push(...parsedArguments.diagnostics);
  validateChildren(node, definition, diagnostics);

  const name = readRequiredString(
    node,
    parsedArguments.values,
    "name",
    diagnostics
  );
  let width: number | null = null;
  let height: number | null = null;
  let background = "transparent";

  node.children.forEach((child) => {
    const childDefinition = getCommandDefinition(child.name);

    if (!childDefinition) {
      return;
    }

    const childArguments = parseArguments(child, childDefinition);
    diagnostics.push(...childArguments.diagnostics);

    if (child.name === "size") {
      width = readRequiredInteger(
        child,
        childArguments.values,
        "width",
        diagnostics,
        { min: 1 }
      );
      height = readRequiredInteger(
        child,
        childArguments.values,
        "height",
        diagnostics,
        { min: 1 }
      );
    }

    if (child.name === "background") {
      const color = readRequiredString(
        child,
        childArguments.values,
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
    background
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

  const parsedArguments = parseArguments(node, definition);
  diagnostics.push(...parsedArguments.diagnostics);
  validateChildren(node, definition, diagnostics);

  const x = readRequiredInteger(node, parsedArguments.values, "x", diagnostics);
  const y = readRequiredInteger(node, parsedArguments.values, "y", diagnostics);
  const color = readRequiredString(
    node,
    parsedArguments.values,
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

  const parsedArguments = parseArguments(node, definition);
  diagnostics.push(...parsedArguments.diagnostics);
  validateChildren(node, definition, diagnostics);

  const x1 = readRequiredInteger(node, parsedArguments.values, "x1", diagnostics);
  const y1 = readRequiredInteger(node, parsedArguments.values, "y1", diagnostics);
  const x2 = readRequiredInteger(node, parsedArguments.values, "x2", diagnostics);
  const y2 = readRequiredInteger(node, parsedArguments.values, "y2", diagnostics);
  const color = readRequiredString(
    node,
    parsedArguments.values,
    "color",
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
    color
  };
}

function compileRootCommand(
  node: ParsedCommandNode,
  sprite: SpriteHeader | null,
  diagnostics: RadebeDiagnostic[]
): CompiledDrawCommand | null {
  const definition = getCommandDefinition(node.name);

  if (!definition) {
    diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
    return null;
  }

  if (!allowsChild(FILE_DEFINITION, definition)) {
    diagnostics.push(
      createCompilerDiagnostic(
        `The file root does not allow command "${node.name}".`,
        node
      )
    );
    return null;
  }

  if (node.name === "sprite") {
    diagnostics.push(
      createCompilerDiagnostic(
        "The sprite header may only appear once at the top of the file.",
        node
      )
    );
    return null;
  }

  if (sprite === null) {
    diagnostics.push(
      createCompilerDiagnostic(
        "Root draw commands require a sprite header before drawing commands.",
        node
      )
    );
    return null;
  }

  if (node.name === "plot") {
    return compilePlotCommand(node, diagnostics);
  }

  if (node.name === "line") {
    return compileLineCommand(node, diagnostics);
  }

  diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
  return null;
}

export function compileDocument(document: ParsedDocument): CompileResult {
  const diagnostics: RadebeDiagnostic[] = [];
  const commands: CompiledDrawCommand[] = [];
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

    const compiledCommand = compileRootCommand(node, sprite, diagnostics);

    if (compiledCommand) {
      commands.push(compiledCommand);
    }
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
