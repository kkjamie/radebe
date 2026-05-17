import test from "node:test";
import assert from "node:assert/strict";

import {
  compileDocument,
  parseSource,
  renderDocument,
  renderSource
} from "../src/index.js";

test("parseSource returns ordered lines for the parser boundary", () => {
  const result = parseSource({ source: "hello\r\nworld" });

  assert.equal(result.document.kind, "parsed-document");
  assert.deepEqual(result.document.lines, [
    { lineNumber: 1, text: "hello" },
    { lineNumber: 2, text: "world" }
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("compileDocument removes empty lines and preserves source ordering", () => {
  const parsed = parseSource({ source: "alpha\n\nbeta" });
  const result = compileDocument(parsed.document);

  assert.equal(result.document.kind, "compiled-document");
  assert.deepEqual(result.document.segments, [
    { kind: "text", lineNumber: 1, value: "alpha" },
    { kind: "text", lineNumber: 3, value: "beta" }
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("renderDocument joins compiled segments into output", () => {
  const parsed = parseSource({ source: "alpha\nbeta" });
  const compiled = compileDocument(parsed.document);
  const result = renderDocument(compiled.document);

  assert.equal(result.output, "alpha\nbeta");
  assert.deepEqual(result.diagnostics, []);
});

test("renderSource runs the parser, compiler, and renderer pipeline", () => {
  const result = renderSource({ source: "alpha\n\nbeta" });

  assert.equal(result.output, "alpha\nbeta");
  assert.equal(result.parsed.lines.length, 3);
  assert.equal(result.compiled.segments.length, 2);
  assert.deepEqual(result.diagnostics, []);
});
