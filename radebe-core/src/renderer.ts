import { compileDocument } from "./compiler.js";
import { parseSource } from "./parser.js";

import type {
  CompiledDocument,
  PipelineResult,
  RenderArtifact,
  RenderResult,
  SourceDocument
} from "./types.js";

function buildTextGridArtifact(document: CompiledDocument): RenderArtifact {
  const rows = document.segments.map((segment) => segment.value);
  const width = rows.reduce(
    (currentWidth, row) => Math.max(currentWidth, row.length),
    0
  );

  return {
    kind: "text-grid",
    width,
    height: rows.length,
    rows
  };
}

export function renderDocument(document: CompiledDocument): RenderResult {
  return {
    artifact: buildTextGridArtifact(document),
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
    artifact: rendered.artifact,
    diagnostics: [
      ...parsed.diagnostics,
      ...compiled.diagnostics,
      ...rendered.diagnostics
    ]
  };
}
