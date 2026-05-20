import test from "node:test";
import assert from "node:assert/strict";

import {
  getArgumentHelp,
  getEnterIndentation,
  getLanguageCompletions,
  getLanguageContext,
  getLanguageSmartEdits,
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

function applySmartEdits(markedSource: string): string {
  const request = atCursor(markedSource);
  const edits = getLanguageSmartEdits(request).edits
    .map((smartEdit) => smartEdit.edit)
    .sort((left, right) => right.start - left.start);

  return edits.reduce((source, edit) => {
    return source.slice(0, edit.start) + edit.text + source.slice(edit.end);
  }, request.source);
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

test("getArgumentHelp includes optional schema arguments in the signature", () => {
  const rectHelp = getArgumentHelp(atCursor("rect |"));

  assert.deepEqual(rectHelp?.arguments.map((argument) => argument.name), [
    "x",
    "y",
    "width",
    "height",
    "color",
    "antialias"
  ]);
  assert.equal(rectHelp?.activeArgument?.name, "x");

  const fillHelp = getArgumentHelp(atCursor("fill |"));

  assert.deepEqual(fillHelp?.arguments.map((argument) => argument.name), [
    "variant",
    "alpha"
  ]);
  assert.deepEqual(fillHelp?.activeArgument?.enumValues, [
    "solid",
    "gradient",
    "gradient-linear",
    "gradient-radial"
  ]);

  const gradientHelp = getArgumentHelp(atCursor("fill gradient-linear |"));

  assert.deepEqual(gradientHelp?.arguments.map((argument) => argument.name), [
    "from",
    "to",
    "direction",
    "angle"
  ]);
  assert.equal(gradientHelp?.activeArgument?.name, "from");
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

test("getLanguageSmartEdits removes shorthand color when fill command is complete", () => {
  assert.equal(
    applySmartEdits("rect 10 10 100 100 black\n  fill|"),
    "rect 10 10 100 100\n  fill"
  );

  assert.equal(
    applySmartEdits("rect 10 10 100 100 color=black antialias=true\n  fill|"),
    "rect 10 10 100 100 antialias=true\n  fill"
  );

  assert.equal(
    applySmartEdits("polygon 0 0 8 0 8 8 black\n  fill|"),
    "polygon 0 0 8 0 8 8\n  fill"
  );
});

test("getLanguageSmartEdits keeps shorthand when no matching child is started", () => {
  assert.equal(
    getLanguageSmartEdits(atCursor("rect 10 10 100 100 black\n  |")).edits.length,
    0
  );
  assert.equal(
    getLanguageSmartEdits(atCursor("rect 10 10 100 100 black\n  f|")).edits.length,
    0
  );
  assert.equal(
    getLanguageSmartEdits(atCursor("rect 10 10 100 100 black\n  st|")).edits.length,
    0
  );
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
