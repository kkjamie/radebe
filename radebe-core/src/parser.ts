import type { ParseResult, ParsedLine, SourceDocument } from "./types.js";

function normalizeSource(source: string): string {
  return source.replace(/\r\n/g, "\n");
}

export function parseSource(request: SourceDocument): ParseResult {
  const normalizedSource = normalizeSource(request.source);
  const lines = normalizedSource === "" ? [] : normalizedSource.split("\n");
  const parsedLines: ParsedLine[] = lines.map((text, index) => ({
    lineNumber: index + 1,
    text
  }));

  return {
    document: {
      kind: "parsed-document",
      source: normalizedSource,
      lines: parsedLines
    },
    diagnostics: []
  };
}
