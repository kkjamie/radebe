import type {
  CompileResult,
  CompiledSegment,
  ParsedDocument
} from "./types.js";

export function compileDocument(document: ParsedDocument): CompileResult {
  const segments: CompiledSegment[] = document.lines
    .filter((line) => line.text.length > 0)
    .map((line) => ({
      kind: "text",
      lineNumber: line.lineNumber,
      value: line.text
    }));

  return {
    document: {
      kind: "compiled-document",
      source: document.source,
      segments
    },
    diagnostics: []
  };
}
