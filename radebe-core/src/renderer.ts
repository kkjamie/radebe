/**
 * Public renderer stage facade. Keep implementation detail inside
 * `src/renderer/` so this package entry point stays stable for consumers.
 */
import { compileDocument } from "./compiler.js";
import { parseSource } from "./parser.js";
import { DocumentRenderer } from "./renderer/renderer.js";

import type {
  CompiledDocument,
  PipelineResult,
  RenderResult,
  SourceDocument
} from "./types.js";

export function renderDocument(document: CompiledDocument): RenderResult {
  return new DocumentRenderer(document).render();
}

export function renderSource(request: SourceDocument): PipelineResult {
  const parsed = parseSource(request);
  const compiled = compileDocument(parsed.document);
  const rendered = renderDocument(compiled.document);

  return {
    parsed: parsed.document,
    compiled: compiled.document,
    artifact: rendered.artifact,
    diagnostics: [
      ...parsed.diagnostics,
      ...compiled.diagnostics,
      ...rendered.diagnostics
    ]
  };
}
