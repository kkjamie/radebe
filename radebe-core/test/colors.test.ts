import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatRadebeColor,
  getRadebeColorTokens,
  parseRadebeColorToken
} from "../src/colors.js";

test("parseRadebeColorToken recognizes named and hex colors", () => {
  assert.deepEqual(parseRadebeColorToken("white"), {
    r: 255,
    g: 255,
    b: 255,
    a: 1
  });
  assert.deepEqual(parseRadebeColorToken("#70c8e880"), {
    r: 112,
    g: 200,
    b: 232,
    a: 128 / 255
  });
  assert.equal(parseRadebeColorToken("not-a-color"), null);
});

test("formatRadebeColor emits compact hex when alpha is opaque", () => {
  assert.equal(
    formatRadebeColor({ r: 255, g: 255, b: 255, a: 1 }),
    "#ffffff"
  );
  assert.equal(
    formatRadebeColor({ r: 0, g: 0, b: 0, a: 0 }),
    "#00000000"
  );
});

test("getRadebeColorTokens finds value tokens without marking comments or commands", () => {
  const source = [
    "# white in a comment is ignored",
    "white",
    "sprite demo",
    "  background transparent",
    "plot x=1 y=2 color=white",
    "rect 0 0 4 4 #70c8e8",
    "rect-inset 1 2 3 4 #112233",
    "var white #ffffff"
  ].join("\n");
  const tokens = getRadebeColorTokens(source).map((token) => ({
    text: token.text,
    source: source.slice(token.start, token.end)
  }));

  assert.deepEqual(tokens, [
    { text: "transparent", source: "transparent" },
    { text: "white", source: "white" },
    { text: "#70c8e8", source: "#70c8e8" },
    { text: "#112233", source: "#112233" },
    { text: "#ffffff", source: "#ffffff" }
  ]);
});
