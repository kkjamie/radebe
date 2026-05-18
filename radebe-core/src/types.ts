export type RadebeStage = "parser" | "compiler" | "renderer";

export type CommandKind =
  | "file"
  | "header"
  | "property"
  | "geometry"
  | "appearance"
  | "structural";

export interface RadebeDiagnostic {
  stage: RadebeStage;
  message: string;
  line?: number;
  column?: number;
}

export interface SourceDocument {
  source: string;
}

export interface ParsedLine {
  lineNumber: number;
  text: string;
}

export interface ParsedCommandNode {
  name: string;
  args: string[];
  children: ParsedCommandNode[];
  lineNumber: number;
  column: number;
  indentLevel: number;
}

export interface ParsedDocument {
  kind: "parsed-document";
  source: string;
  lines: ParsedLine[];
  commands: ParsedCommandNode[];
}

export interface SpriteHeader {
  name: string;
  width: number;
  height: number;
  background: string;
}

export interface PlotCommand {
  kind: "plot";
  lineNumber: number;
  x: number;
  y: number;
  color: string;
}

export interface LineCommand {
  kind: "line";
  lineNumber: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

export type CompiledDrawCommand = PlotCommand | LineCommand;

export interface CompiledDocument {
  kind: "compiled-document";
  source: string;
  sprite: SpriteHeader | null;
  commands: CompiledDrawCommand[];
}

export interface ParseResult {
  document: ParsedDocument;
  diagnostics: RadebeDiagnostic[];
}

export interface CompileResult {
  document: CompiledDocument;
  diagnostics: RadebeDiagnostic[];
}

export interface SpriteGridRenderArtifact {
  kind: "sprite-grid";
  width: number;
  height: number;
  background: string;
  rows: string[];
  pixels: (string | null)[][];
}

export type RenderArtifact = SpriteGridRenderArtifact;

export interface RenderResult {
  artifact: RenderArtifact;
  diagnostics: RadebeDiagnostic[];
}

export interface PipelineResult {
  parsed: ParsedDocument;
  compiled: CompiledDocument;
  artifact: RenderArtifact;
  diagnostics: RadebeDiagnostic[];
}
