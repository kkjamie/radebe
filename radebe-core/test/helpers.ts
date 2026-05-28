import {
  compileDocument,
  parseSource,
  renderDocument
} from "../src/index.js";

export function joinSourceLines(lines: string[]): string {
  return lines.join("\n");
}

export function parseTestSource(source: string) {
  return parseSource({ source });
}

export function compileTestSource(source: string) {
  const parsed = parseTestSource(source);
  return compileDocument(parsed.document);
}

export function renderDocumentFixture(source: string) {
  const parsed = parseTestSource(source);
  const compiled = compileDocument(parsed.document);

  return {
    parsed,
    compiled,
    rendered: renderDocument(compiled.document)
  };
}
