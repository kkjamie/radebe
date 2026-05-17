import { compileDocument } from "./compiler.js";
import { parseSource } from "./parser.js";

import type {
  CompiledDocument,
  PipelineResult,
  RenderResult,
  SourceDocument
} from "./types.js";

export function renderDocument(document: CompiledDocument): RenderResult {
  return {
    output: document.segments.map((segment) => segment.value).join("\n"),
    diagnostics: []
  };
}

export function renderSource(request: SourceDocument): PipelineResult {
  const parsed = parseSource(request);
  const compiled = compileDocument(parsed.document);
  const rendered = renderDocument(compiled.document);

  return {
    parsed: parsed.document,
    compiled: compiled.document,
    output: rendered.output,
    diagnostics: [
      ...parsed.diagnostics,
      ...compiled.diagnostics,
      ...rendered.diagnostics
    ]
  };
}
