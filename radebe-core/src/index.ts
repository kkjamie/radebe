export { compileDocument } from "./compiler.js";
export { parseSource } from "./parser.js";
export { renderDocument, renderSource } from "./renderer.js";
export { COMMAND_REGISTRY, FILE_DEFINITION, getCommandDefinition } from "./schema.js";

export type {
  CommandKind,
  CompileResult,
  CompiledDocument,
  CompiledDrawCommand,
  LineCommand,
  ParseResult,
  ParsedCommandNode,
  ParsedDocument,
  ParsedLine,
  PipelineResult,
  PlotCommand,
  RadebeDiagnostic,
  RenderArtifact,
  RenderResult,
  RadebeStage,
  SpriteGridRenderArtifact,
  SpriteHeader,
  SourceDocument
} from "./types.js";
