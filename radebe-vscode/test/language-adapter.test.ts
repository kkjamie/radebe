import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createRenderPreviewText,
  formatDocumentColor,
  getCompletionResultAtOffset,
  getDiagnosticRanges,
  getDocumentColors,
  getEnterIndentationAtOffset,
  getLanguagePositionAtOffset,
  getSmartTextEditsAtOffset,
} from "../src/language-adapter.js";

interface TextEdit {
  start: number;
  end: number;
  text: string;
}

function applyEdits(source: string, edits: TextEdit[]): string {
  return [...edits]
    .sort((left, right) => right.start - left.start)
    .reduce((nextSource, edit) => {
      return `${nextSource.slice(0, edit.start)}${edit.text}${nextSource.slice(edit.end)}`;
    }, source);
}

test("maps source offsets into the core language-service position model", () => {
  const source = "sprite demo\n  size 16 16\nrect";

  assert.deepEqual(getLanguagePositionAtOffset(source, source.length), {
    line: 3,
    column: 5
  });
});

test("returns schema-driven command completions for a .rdb cursor", () => {
  const source = "sprite demo\n  size 16 16\n\nrec";
  const result = getCompletionResultAtOffset(source, source.length);
  const labels = result.items.map((item) => item.label);

  assert.equal(result.context.prefix, "rec");
  assert.ok(labels.includes("rect"));
  assert.ok(labels.includes("rect-absolute"));
  assert.ok(labels.includes("rect-inset"));
});

test("uses shared indentation behavior for child command blocks", () => {
  const source = "sprite demo";

  assert.equal(getEnterIndentationAtOffset(source, source.length), "  ");
});

test("exposes smart shorthand cleanup edits from the shared language service", () => {
  const source = "rect 0 0 10 10 red\n  fill";
  const edits = getSmartTextEditsAtOffset(source, source.length);

  assert.equal(applyEdits(source, edits), "rect 0 0 10 10\n  fill");
});

test("infers useful diagnostic ranges for VS Code diagnostics", () => {
  const source = "sprite demo\n  size bad 16\n";
  const diagnostics = getDiagnosticRanges(source);
  const badTokenRange = diagnostics.find((diagnostic) => {
    return source.slice(diagnostic.start, diagnostic.end) === "bad";
  });

  assert.ok(badTokenRange);
  assert.equal(badTokenRange.line, 2);
});

test("creates a text render preview from the shared renderer", () => {
  const preview = createRenderPreviewText(
    [
      "sprite demo",
      "  size 4 3",
      "  background transparent",
      "plot 1 1 red"
    ].join("\n")
  );

  assert.match(preview, /Radebe rendered image: rendered-image/);
  assert.match(preview, /Size: 4x3/);
  assert.match(preview, /Diagnostics:\n\(no diagnostics\)/);
});

test("exposes Radebe colors for VS Code document color decorations", () => {
  const source = "sprite demo\n  background white\nplot 1 1 color=#70c8e8";
  const colors = getDocumentColors(source);

  assert.deepEqual(
    colors.map((color) => source.slice(color.start, color.end)),
    ["white", "#70c8e8"]
  );
  assert.equal(formatDocumentColor(colors[0]!.color), "#ffffff");
});
