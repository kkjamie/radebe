import {
  FILE_DEFINITION,
  getCommandDefinition
} from "../schema.js";

import type {
  CompileResult,
  CompiledDrawCommand,
  ParsedCommandNode,
  ParsedDocument,
  RadebeDiagnostic,
  SpriteHeader
} from "../types.js";

import { compileCircleCommand } from "./commands/circle.js";
import { compilePathCommand } from "./commands/path.js";
import {
  compileGeneratedPolygonCommand,
  compilePolygonCommand
} from "./commands/polygon.js";
import {
  compileLineCommand,
  compilePlotCommand
} from "./commands/primitives.js";
import { compileRectCommand } from "./commands/rect.js";
import {
  compileGroupCommand,
  compileMaskCommand,
  type DrawCommandCompiler
} from "./commands/structural.js";
import { compileSpriteHeader } from "./sprite.js";
import {
  allowsChild,
  createCompilerDiagnostic,
  type CompileDrawOptions
} from "./shared.js";
import {
  compileVariableDefinition,
  compileVariableGroup,
  resolveVariableReferencesInNode,
  type VariableEnvironment
} from "./variables.js";

export class Compiler {
  private readonly diagnostics: RadebeDiagnostic[] = [];
  private readonly commands: CompiledDrawCommand[] = [];
  private readonly variables: VariableEnvironment = new Map();
  private sprite: SpriteHeader | null = null;

  public constructor(private readonly document: ParsedDocument) {}

  public compile(): CompileResult {
    this.document.commands.forEach((node, index) => {
      this.compileTopLevelCommand(node, index);
    });

    if (this.sprite === null) {
      this.diagnostics.push({
        stage: "compiler",
        message: "A sprite header is required before root draw commands.",
        line: 1,
        column: 1
      });
    }

    return {
      document: {
        kind: "compiled-document",
        source: this.document.source,
        sprite: this.sprite,
        commands: this.commands
      },
      diagnostics: this.diagnostics
    };
  }

  private compileTopLevelCommand(node: ParsedCommandNode, index: number): void {
    const definition = getCommandDefinition(node.name);

    if (!definition) {
      this.diagnostics.push(
        createCompilerDiagnostic(`Unknown command "${node.name}".`, node)
      );
      return;
    }

    if (!allowsChild(FILE_DEFINITION, definition)) {
      this.diagnostics.push(
        createCompilerDiagnostic(
          `The file root does not allow command "${node.name}".`,
          node
        )
      );
      return;
    }

    if (node.name === "sprite") {
      this.compileSprite(node, index);
      return;
    }

    if (node.name === "var") {
      compileVariableDefinition(node, this.variables, this.diagnostics);
      return;
    }

    if (node.name === "vars") {
      compileVariableGroup(node, this.variables, this.diagnostics);
      return;
    }

    const resolvedNode = resolveVariableReferencesInNode(
      node,
      this.variables,
      this.diagnostics
    );

    if (resolvedNode === null) {
      return;
    }

    this.commands.push(...this.compileRootCommand(resolvedNode));
  }

  private compileSprite(node: ParsedCommandNode, index: number): void {
    if (index !== 0) {
      this.diagnostics.push(
        createCompilerDiagnostic(
          "The sprite header must be the first root command in the file.",
          node
        )
      );
    }

    if (this.sprite !== null) {
      this.diagnostics.push(
        createCompilerDiagnostic(
          "Only one sprite header is allowed per file.",
          node
        )
      );
      return;
    }

    this.sprite = compileSpriteHeader(node, this.diagnostics);
  }

  private compileRootCommand(node: ParsedCommandNode): CompiledDrawCommand[] {
    const definition = getCommandDefinition(node.name);

    if (!definition) {
      this.diagnostics.push(
        createCompilerDiagnostic(`Unknown command "${node.name}".`, node)
      );
      return [];
    }

    if (!allowsChild(FILE_DEFINITION, definition)) {
      this.diagnostics.push(
        createCompilerDiagnostic(
          `The file root does not allow command "${node.name}".`,
          node
        )
      );
      return [];
    }

    if (node.name === "sprite") {
      this.diagnostics.push(
        createCompilerDiagnostic(
          "The sprite header may only appear once at the top of the file.",
          node
        )
      );
      return [];
    }

    if (this.sprite === null) {
      this.diagnostics.push(
        createCompilerDiagnostic(
          "Root draw commands require a sprite header before drawing commands.",
          node
        )
      );
      return [];
    }

    const compiledCommand = this.compileDrawCommand(node, this.sprite, this.diagnostics);

    return compiledCommand === null ? [] : [compiledCommand];
  }

  private readonly compileDrawCommand: DrawCommandCompiler = (
    node: ParsedCommandNode,
    sprite: SpriteHeader,
    diagnostics: RadebeDiagnostic[],
    options: CompileDrawOptions = {}
  ): CompiledDrawCommand | null => {
    if (node.name === "group") {
      return compileGroupCommand(
        node,
        sprite,
        diagnostics,
        this.compileDrawCommand,
        options
      );
    }

    if (node.name === "mask") {
      return compileMaskCommand(node, sprite, diagnostics, this.compileDrawCommand);
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
  };
}
