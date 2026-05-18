import test from "node:test";
import assert from "node:assert/strict";

import {
  compileDocument,
  parseSource,
  renderDocument,
  renderSource
} from "../src/index.js";

test("parseSource returns a nested command tree for indentation-based source", () => {
  const result = parseSource({
    source: "sprite panel\n  size 4 3\n  background transparent\n\nplot 1 1 #ffffff"
  });

  assert.equal(result.document.kind, "parsed-document");
  assert.equal(result.document.commands.length, 2);
  assert.deepEqual(result.document.commands[0], {
    name: "sprite",
    args: ["panel"],
    children: [
      {
        name: "size",
        args: ["4", "3"],
        children: [],
        lineNumber: 2,
        column: 3,
        indentLevel: 1
      },
      {
        name: "background",
        args: ["transparent"],
        children: [],
        lineNumber: 3,
        column: 3,
        indentLevel: 1
      }
    ],
    lineNumber: 1,
    column: 1,
    indentLevel: 0
  });
  assert.deepEqual(result.document.commands[1], {
    name: "plot",
    args: ["1", "1", "#ffffff"],
    children: [],
    lineNumber: 5,
    column: 1,
    indentLevel: 0
  });
  assert.deepEqual(result.diagnostics, []);
});

test("compileDocument builds the sprite header and draw commands", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 4 3\n  background transparent\n\nplot 1 1 #ffffff\nline 0 0 3 0 #70c8e8"
  });
  const result = compileDocument(parsed.document);

  assert.equal(result.document.kind, "compiled-document");
  assert.deepEqual(result.document.sprite, {
    name: "panel",
    width: 4,
    height: 3,
    background: "transparent"
  });
  assert.deepEqual(result.document.commands, [
    { kind: "plot", lineNumber: 5, x: 1, y: 1, color: "#ffffff" },
    {
      kind: "line",
      lineNumber: 6,
      x1: 0,
      y1: 0,
      x2: 3,
      y2: 0,
      color: "#70c8e8"
    }
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("compileDocument reports schema and argument diagnostics", () => {
  const parsed = parseSource({
    source: "plot 0 0 #fff\nsprite panel\n  plot 1 1 #fff\n  size 0 3"
  });
  const result = compileDocument(parsed.document);

  assert.deepEqual(result.document.commands, []);
  assert.deepEqual(result.diagnostics, [
    {
      stage: "compiler",
      message: "Root draw commands require a sprite header before drawing commands.",
      line: 1,
      column: 1
    },
    {
      stage: "compiler",
      message: "The sprite header must be the first root command in the file.",
      line: 2,
      column: 1
    },
    {
      stage: "compiler",
      message: 'The sprite command does not allow child command "plot".',
      line: 3,
      column: 3
    },
    {
      stage: "compiler",
      message: 'The size command expects "width" to be at least 1.',
      line: 4,
      column: 3
    },
    {
      stage: "compiler",
      message: "A sprite header is required before root draw commands.",
      line: 1,
      column: 1
    }
  ]);
});

test("renderDocument rasterizes plot and line commands into a sprite grid", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 5 4\n  background transparent\n\nplot 2 2 #ffffff\nline 0 0 4 0 #70c8e8"
  });
  const compiled = compileDocument(parsed.document);
  const result = renderDocument(compiled.document);

  assert.deepEqual(result.artifact, {
    kind: "sprite-grid",
    width: 5,
    height: 4,
    background: "transparent",
    rows: ["#####", ".....", "..#..", "....."],
    pixels: [
      ["#70c8e8", "#70c8e8", "#70c8e8", "#70c8e8", "#70c8e8"],
      [null, null, null, null, null],
      [null, null, "#ffffff", null, null],
      [null, null, null, null, null]
    ]
  });
  assert.deepEqual(result.diagnostics, []);
});

test("renderSource runs the parser, compiler, and renderer pipeline", () => {
  const result = renderSource({
    source:
      "sprite button\n  size 4 4\n  background #101010\n\nplot 1 1 white\nline 0 3 3 0 #70c8e8"
  });

  assert.deepEqual(result.artifact.rows, [":::#", ":##:", ":#::", "#:::"]);
  assert.equal(result.parsed.commands.length, 3);
  assert.equal(result.compiled.commands.length, 2);
  assert.deepEqual(result.diagnostics, []);
});

test("parseSource reports indentation diagnostics", () => {
  const result = parseSource({
    source: "sprite panel\n   size 4 3"
  });

  assert.deepEqual(result.diagnostics, [
    {
      stage: "parser",
      message: "Indentation must use whole two-space levels.",
      line: 2,
      column: 1
    }
  ]);
});
