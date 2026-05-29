import {
  FILE_DEFINITION,
  getCommandDefinition
} from "./schema.js";

import type {
  CompileResult,
  CompiledDrawCommand,
  ParsedCommandNode,
  ParsedDocument,
  RadebeDiagnostic,
  SpriteHeader
} from "./types.js";

import { compileCircleCommand } from "./compiler/commands/circle.js";
import { compilePathCommand } from "./compiler/commands/path.js";
import {
  compileGeneratedPolygonCommand,
  compilePolygonCommand
} from "./compiler/commands/polygon.js";
import {
  compileLineCommand,
  compilePlotCommand
} from "./compiler/commands/primitives.js";
import { compileRectCommand } from "./compiler/commands/rect.js";
import {
  compileGroupCommand,
  compileMaskCommand
} from "./compiler/commands/structural.js";
import { compileSpriteHeader } from "./compiler/sprite.js";
import {
  allowsChild,
  createCompilerDiagnostic,
  type CompileDrawOptions
} from "./compiler/shared.js";
import {
  compileVariableDefinition,
  compileVariableGroup,
  resolveVariableReferencesInNode,
  type VariableEnvironment
} from "./compiler/variables.js";

function compileDrawCommand(
  node: ParsedCommandNode,
  sprite: SpriteHeader,
  diagnostics: RadebeDiagnostic[],
  options: CompileDrawOptions = {}
): CompiledDrawCommand | null {
  if (node.name === "group") {
    return compileGroupCommand(node, sprite, diagnostics, compileDrawCommand, options);
  }

  if (node.name === "mask") {
    return compileMaskCommand(node, sprite, diagnostics, compileDrawCommand);
  }

  if (node.name === "plot") {
    return compilePlotCommand(node, diagnostics);
  }

  if (node.name === "line") {
    return compileLineCommand(node, diagnostics);
  }

  if (node.name === "circle") {
    return compileCircleCommand(node, diagnostics, options);
  }

  if (node.name === "polygon") {
    return compilePolygonCommand(node, diagnostics, options);
  }

  if (node.name === "polygon-regular" || node.name === "polygon-star") {
    return compileGeneratedPolygonCommand(node, diagnostics, options);
  }

  if (node.name === "path") {
    return compilePathCommand(node, diagnostics);
  }

  if (
    node.name === "rect" ||
    node.name === "rect-absolute" ||
    node.name === "rect-inset"
  ) {
    return compileRectCommand(node, sprite, diagnostics, options);
  }

  diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
  return null;
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
