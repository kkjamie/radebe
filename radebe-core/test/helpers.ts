import {
  compileDocument,
  parseSource,
  renderDocument
} from "../src/index.js";

import type {
  CompileResult,
  ParseResult,
  RenderResult
} from "../src/types.js";

export interface RenderDocumentFixture {
  compiled: CompileResult;
  parsed: ParseResult;
  rendered: RenderResult;
}

export function joinSourceLines(lines: string[]): string {
  return lines.join("\n");
}

export function parseTestSource(source: string): ParseResult {
  return parseSource({ source });
}

export function compileTestSource(source: string): CompileResult {
  const parsed: ParseResult = parseTestSource(source);

  return compileDocument(parsed.document);
}

export function renderDocumentFixture(source: string): RenderDocumentFixture {
  const parsed: ParseResult = parseTestSource(source);
  const compiled: CompileResult = compileDocument(parsed.document);

  return {
    parsed,
    compiled,
    rendered: renderDocument(compiled.document)
  };
}
