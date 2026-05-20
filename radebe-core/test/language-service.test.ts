import test from "node:test";
import assert from "node:assert/strict";

import {
  getArgumentHelp,
  getEnterIndentation,
  getLanguageCompletions,
  getLanguageContext,
  type LanguageServiceRequest
} from "../src/index.js";

function atCursor(markedSource: string): LanguageServiceRequest {
  const cursorIndex = markedSource.indexOf("|");

  if (cursorIndex < 0) {
    throw new Error("Expected source marker");
  }

  const source = markedSource.slice(0, cursorIndex) + markedSource.slice(cursorIndex + 1);
  const beforeCursor = markedSource.slice(0, cursorIndex);
  const lines = beforeCursor.split("\n");

  return {
    source,
    position: {
      line: lines.length,
      column: lines[lines.length - 1]!.length + 1
    }
  };
}

function labels(markedSource: string): string[] {
  return getLanguageCompletions(atCursor(markedSource)).items.map(
    (item) => item.label
  );
}

test("getLanguageCompletions suggests root commands by prefix", () => {
  assert.deepEqual(labels("sprite panel\n  size 16 16\n\nrec|"), [
    "rect",
    "rect-absolute",
    "rect-inset"
  ]);
});

test("getLanguageCompletions suggests schema-valid child commands", () => {
  assert.deepEqual(labels("sprite panel\n  |"), [
    "size",
    "background",
    "name",
    "antialias"
  ]);

  assert.deepEqual(
    labels("sprite panel\n  size 24 24\n\ncircle 12 12 8\n  |"),
    [
      "x",
      "y",
      "radius",
      "color",
      "antialias",
      "fill",
      "shadow",
      "stroke"
    ]
  );
});

test("getArgumentHelp reports the active positional argument", () => {
  const help = getArgumentHelp(atCursor("rect 10 |"));

  assert.equal(help?.commandName, "rect");
  assert.equal(help?.mode, "positional");
  assert.equal(help?.activeArgumentIndex, 1);
  assert.equal(help?.activeArgument?.name, "y");
  assert.equal(help?.activeArgument?.valueKind, "integer");
});

test("getArgumentHelp uses parent metadata for child property commands", () => {
  const help = getArgumentHelp(atCursor("circle 12 12 8\n  radius |"));

  assert.equal(help?.commandName, "radius");
  assert.equal(help?.activeArgument?.name, "radius");
  assert.equal(help?.activeArgument?.valueKind, "integer");
  assert.equal(help?.activeArgument?.min, 1);
});

test("getLanguageCompletions suggests enum values", () => {
  assert.deepEqual(labels("stroke 2 white align=o|"), ["outside"]);
  assert.deepEqual(labels("stroke 2 white\n  align |"), [
    "inside",
    "center",
    "outside"
  ]);
  assert.deepEqual(labels("circle 12 12 8\n  antialias |"), [
    "true",
    "false"
  ]);
});

test("getLanguageCompletions suggests inline fill variants", () => {
  assert.deepEqual(labels("fill |"), [
    "solid",
    "gradient",
    "gradient-linear",
    "gradient-radial"
  ]);

  const help = getArgumentHelp(atCursor("fill gradient-linear |"));

  assert.equal(help?.commandName, "gradient-linear");
  assert.equal(help?.parentCommandName, "fill");
  assert.equal(help?.activeArgument?.name, "from");
  assert.equal(help?.activeArgument?.valueKind, "color");
});

test("getLanguageCompletions suggests named argument keys by prefix", () => {
  assert.deepEqual(labels("stroke 2 white al|"), ["alpha=", "align="]);
});

test("getLanguageContext reports cursor context for editor adapters", () => {
  assert.deepEqual(getLanguageContext(atCursor("rect 1 2 3 4\n  st|")), {
    line: 2,
    column: 5,
    lineText: "  st",
    indent: "  ",
    indentLevel: 1,
    mode: "command",
    prefix: "st",
    commandName: "st",
    parentCommandName: "rect"
  });
});

test("getEnterIndentation follows schema editor hints", () => {
  assert.equal(getEnterIndentation(atCursor("sprite panel|")), "  ");
  assert.equal(getEnterIndentation(atCursor("sprite panel\n  size 16 16|")), "  ");
  assert.equal(getEnterIndentation(atCursor("rect 0 0 10 10|")), "  ");
  assert.equal(getEnterIndentation(atCursor("  fill|")), "    ");
  assert.equal(getEnterIndentation(atCursor("  fill solid red|")), "  ");
  assert.equal(getEnterIndentation(atCursor("plot 0 0 white|")), "");
});
