/**
 * Exposes the renderer APIs that consumers call directly, while the rendering
 * implementation stays inside `src/renderer/`.
 */
import { compileDocument } from "./compiler.js";
import { parseSource } from "./parser.js";
import { DocumentRenderer } from "./renderer/renderer.js";

import type {
  CompileResult,
  CompiledDocument,
  PipelineResult,
  ParseResult,
  RenderResult,
  SourceDocument
} from "./types.js";

/**
 * Render an already-compiled Radebe document into a rendered image.
 *
 * Use this when the caller owns parsing and compilation, wants to inspect or
 * cache the compiled document, or is rendering compiled instructions received
 * from another package boundary. Renderer diagnostics are returned alongside
 * the image; parser and compiler diagnostics are not re-run here.
 */
export function renderDocument(document: CompiledDocument): RenderResult {
  return new DocumentRenderer(document).render();
}

/**
 * Run the full source pipeline for a Radebe document.
 *
 * This convenience API parses source text, compiles the parsed command tree,
 * renders the compiled document, and returns the intermediate parsed/compiled
 * documents with one combined diagnostics list in pipeline order.
 */
export function renderSource(request: SourceDocument): PipelineResult {
  const parsed: ParseResult = parseSource(request);
  const compiled: CompileResult = compileDocument(parsed.document);
  const rendered: RenderResult = renderDocument(compiled.document);

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
