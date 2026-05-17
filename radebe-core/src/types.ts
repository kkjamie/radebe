export type RadebeStage = "parser" | "compiler" | "renderer";

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

export interface ParsedDocument {
  kind: "parsed-document";
  source: string;
  lines: ParsedLine[];
}

export interface CompiledSegment {
  kind: "text";
  lineNumber: number;
  value: string;
}

export interface CompiledDocument {
  kind: "compiled-document";
  source: string;
  segments: CompiledSegment[];
}

export interface ParseResult {
  document: ParsedDocument;
  diagnostics: RadebeDiagnostic[];
}

export interface CompileResult {
  document: CompiledDocument;
  diagnostics: RadebeDiagnostic[];
}

export interface RenderResult {
  output: string;
  diagnostics: RadebeDiagnostic[];
}

export interface PipelineResult {
  parsed: ParsedDocument;
  compiled: CompiledDocument;
  output: string;
  diagnostics: RadebeDiagnostic[];
}
