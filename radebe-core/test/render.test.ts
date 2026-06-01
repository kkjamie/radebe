import test from "node:test";
import assert from "node:assert/strict";

import { compileDocument, parseSource, renderDocument, renderSource } from "../src/index.js";

test("renderDocument rasterizes plot and line commands into a rendered image", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 5 4\n  background transparent\n\nplot 2 2 #ffffff\nline 0 0 4 0 #70c8e8"
  });
  const compiled = compileDocument(parsed.document);
  const result = renderDocument(compiled.document);

  assert.deepEqual(result.artifact, {
    kind: "rendered-image",
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

test("renderDocument fills rectangles from rect-absolute and rect alias", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 6 5\n  background transparent\n\nrect-absolute 1 1 3 2 #70c8e8\nrect 0 4 2 1 #ffffff"
  });
  const compiled = compileDocument(parsed.document);
  const result = renderDocument(compiled.document);

  assert.deepEqual(result.artifact.rows, [
    "......",
    ".###..",
    ".###..",
    "......",
    "##...."
  ]);
  assert.deepEqual(result.artifact.pixels, [
    [null, null, null, null, null, null],
    [null, "#70c8e8", "#70c8e8", "#70c8e8", null, null],
    [null, "#70c8e8", "#70c8e8", "#70c8e8", null, null],
    [null, null, null, null, null, null],
    ["#ffffff", "#ffffff", null, null, null, null]
  ]);
});

test("renderDocument rasterizes rect-inset inside the sprite bounds", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 8 6\n  background transparent\n\nrect-inset 2 #ffffff"
  });
  const compiled = compileDocument(parsed.document);
  const result = renderDocument(compiled.document);

  assert.deepEqual(result.artifact.rows, [
    "........",
    "........",
    "..####..",
    "..####..",
    "........",
    "........"
  ]);
  assert.deepEqual(result.artifact.pixels, [
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, "#ffffff", "#ffffff", "#ffffff", "#ffffff", null, null],
    [null, null, "#ffffff", "#ffffff", "#ffffff", "#ffffff", null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null]
  ]);
});

test("renderDocument rasterizes side-specific rect-inset values", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 8 6\n  background transparent\n\nrect-inset\n  top 1\n  right 2\n  bottom 3\n  left 1\n  color #ffffff"
  });
  const compiled = compileDocument(parsed.document);
  const result = renderDocument(compiled.document);

  assert.deepEqual(result.artifact.rows, [
    "........",
    ".#####..",
    ".#####..",
    "........",
    "........",
    "........"
  ]);
});

test("renderDocument rasterizes four-side rect-inset shorthand", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 8 6\n  background transparent\n\nrect-inset 1 2 3 1 #ffffff"
  });
  const compiled = compileDocument(parsed.document);
  const result = renderDocument(compiled.document);

  assert.deepEqual(result.artifact.rows, [
    "........",
    ".#####..",
    ".#####..",
    "........",
    "........",
    "........"
  ]);
});

test("renderDocument rasterizes cut rectangles as clipped silhouettes", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 7 7\n  background transparent\n\nrect 1 1 5 5 #ffffff\n  cut 2 0 2 0"
  });
  const compiled = compileDocument(parsed.document);
  const result = renderDocument(compiled.document);

  assert.deepEqual(result.artifact.rows, [
    ".......",
    "..####.",
    ".#####.",
    ".#####.",
    ".####..",
    ".###...",
    "......."
  ]);
});

test("renderDocument rasterizes rounded rectangles from radius-modified rects", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 7 7\n  background transparent\n\nrect 1 1 5 5 #ffffff\n  radius 2"
  });
  const compiled = compileDocument(parsed.document);
  const result = renderDocument(compiled.document);

  assert.deepEqual(result.artifact.rows, [
    ".......",
    "..###..",
    ".#####.",
    ".#####.",
    ".#####.",
    "..###..",
    "......."
  ]);
});

test("renderDocument rasterizes circle fills around the configured center", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 7 7\n  background transparent\n\ncircle 3 3 3 #ffffff"
  });
  const compiled = compileDocument(parsed.document);
  const result = renderDocument(compiled.document);

  assert.deepEqual(result.artifact.rows, [
    "...#...",
    ".#####.",
    ".#####.",
    "#######",
    ".#####.",
    ".#####.",
    "...#..."
  ]);
});

test("renderDocument rasterizes circle gradients across the circle bounds", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 5 5\n  background transparent\n\ncircle 2 2 2\n  fill gradient-linear #ff0000 #0000ff"
  });
  const compiled = compileDocument(parsed.document);
  const result = renderDocument(compiled.document);

  assert.deepEqual(result.artifact.pixels, [
    [null, null, "#800080", null, null],
    [null, "#bf0040", "#800080", "#4000bf", null],
    ["#ff0000", "#bf0040", "#800080", "#4000bf", "#0000ff"],
    [null, "#bf0040", "#800080", "#4000bf", null],
    [null, null, "#800080", null, null]
  ]);
});

test("renderDocument applies sprite antialias defaults with shape overrides", () => {
  const smoothed = renderSource({
    source:
      "sprite panel\n  size 5 5\n  background transparent\n  antialias true\n\ncircle 2 2 2 #ffffff"
  });
  const crispOverride = renderSource({
    source:
      "sprite panel\n  size 5 5\n  background transparent\n  antialias true\n\ncircle 2 2 2 #ffffff antialias=false"
  });
  const optIn = renderSource({
    source:
      "sprite panel\n  size 5 5\n  background transparent\n\ncircle 2 2 2 #ffffff antialias=true"
  });

  assert.deepEqual(smoothed.artifact.rows, [
    ".###.",
    "#####",
    "#####",
    "#####",
    ".###."
  ]);
  assert.deepEqual(smoothed.artifact.pixels[0], [
    null,
    "#ffffff40",
    "#ffffff80",
    "#ffffff40",
    null
  ]);
  assert.deepEqual(crispOverride.artifact.rows, [
    "..#..",
    ".###.",
    "#####",
    ".###.",
    "..#.."
  ]);
  assert.equal(optIn.artifact.pixels[0]?.[1], "#ffffff40");
});

test("renderDocument rasterizes polygon fills from whitespace-separated point pairs", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 8 8\n  background transparent\n\npolygon 1 1 7 1 4 7 #ffffff"
  });
  const compiled = compileDocument(parsed.document);
  const result = renderDocument(compiled.document);

  assert.deepEqual(result.artifact.rows, [
    "........",
    ".######.",
    "..####..",
    "..####..",
    "...##...",
    "...##...",
    "........",
    "........"
  ]);
});

test("renderDocument rasterizes generated regular polygons and stars", () => {
  const regular = renderSource({
    source:
      "sprite panel\n  size 10 10\n  background transparent\n\npolygon-regular 6 4 4 3 #ffffff"
  });
  const star = renderSource({
    source:
      "sprite panel\n  size 10 10\n  background transparent\n\npolygon-star 4 6 5 2 4 #ffffff"
  });

  assert.deepEqual(regular.diagnostics, []);
  assert.deepEqual(star.diagnostics, []);
  assert.equal(regular.artifact.pixels[4]?.[6], "#ffffff");
  assert.equal(star.artifact.pixels[6]?.[4], "#ffffff");
});

test("renderDocument rasterizes polygon cut modifiers as beveled corners", () => {
  const result = renderSource({
    source:
      "sprite panel\n  size 8 8\n  background transparent\n\npolygon 1 1 6 1 6 6 1 6 #ffffff\n  cut 2"
  });

  assert.equal(result.artifact.pixels[1]?.[1], null);
  assert.equal(result.artifact.pixels[2]?.[1], "#ffffff");
  assert.equal(result.artifact.pixels[1]?.[2], "#ffffff");
});

test("renderDocument rasterizes polygon radius modifiers as rounded corners", () => {
  const result = renderSource({
    source:
      "sprite panel\n  size 8 8\n  background transparent\n\npolygon 1 1 6 1 6 6 1 6 #ffffff\n  radius 2"
  });

  assert.equal(result.artifact.pixels[1]?.[1], null);
  assert.equal(result.artifact.pixels[2]?.[2], "#ffffff");
  assert.equal(result.artifact.pixels[4]?.[4], "#ffffff");
});

test("renderDocument rasterizes polygon gradients across the polygon bounds", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 8 8\n  background transparent\n\npolygon\n  point 1 1\n  point 7 1\n  point 4 7\n  fill gradient-linear #ff0000 #0000ff"
  });
  const compiled = compileDocument(parsed.document);
  const result = renderDocument(compiled.document);

  assert.equal(result.artifact.pixels[1]?.[1], "#ff0000");
  assert.equal(result.artifact.pixels[1]?.[6], "#0000ff");
  assert.equal(result.artifact.pixels[3]?.[3], "#990066");
  assert.equal(result.artifact.pixels[0]?.[0], null);
});

test("renderDocument rasterizes solid polygon strokes", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 8 8\n  background transparent\n\npolygon 1 1 7 1 4 7\n  stroke 1 white"
  });
  const compiled = compileDocument(parsed.document);
  const result = renderDocument(compiled.document);

  assert.deepEqual(result.artifact.rows, [
    "........",
    ".######.",
    "..#..#..",
    "..#..#..",
    "...##...",
    "...##...",
    "........",
    "........"
  ]);
  assert.equal(result.artifact.pixels[1]?.[1], "#ffffff");
  assert.equal(result.artifact.pixels[1]?.[6], "#ffffff");
  assert.equal(result.artifact.pixels[4]?.[3], "#ffffff");
  assert.equal(result.artifact.pixels[3]?.[3], null);
});

test("renderDocument rasterizes stroked open paths", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 10 7\n  background transparent\n\npath\n  point 1 1\n  point 6 1\n  point 8 4\n  stroke 1 white"
  });
  const compiled = compileDocument(parsed.document);
  const result = renderDocument(compiled.document);

  assert.equal(result.artifact.pixels[1]?.[1], "#ffffff");
  assert.equal(result.artifact.pixels[1]?.[5], "#ffffff");
  assert.equal(result.artifact.pixels[3]?.[7], "#ffffff");
  assert.equal(result.artifact.pixels[5]?.[5], null);
});

test("renderDocument rasterizes solid circle strokes", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 9 9\n  background transparent\n\ncircle 4 4 3\n  stroke 1 white"
  });
  const compiled = compileDocument(parsed.document);
  const result = renderDocument(compiled.document);

  assert.deepEqual(result.artifact.rows, [
    ".........",
    "....#....",
    "..##.##..",
    "..#...#..",
    ".#.....#.",
    "..#...#..",
    "..##.##..",
    "....#....",
    "........."
  ]);
});

test("renderDocument rasterizes dashed circle strokes", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 11 11\n  background transparent\n\ncircle 5 5 4\n  stroke width=1 color=white style=dashed dash-length=2 gap-length=1"
  });
  const compiled = compileDocument(parsed.document);
  const result = renderDocument(compiled.document);

  assert.equal(
    result.artifact.rows.some((row) => row.includes("#")),
    true
  );
  assert.equal(result.artifact.pixels[5]?.[5], null);
});

test("renderSource advances nested circle strokes from the outer radius", () => {
  const result = renderSource({
    source:
      "sprite ring\n  size 11 11\n  background transparent\n\ncircle 5 5 3 #18242c\n  stroke 2 #70c8e8\n    stroke width=1 color=white align=outside"
  });

  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.artifact.pixels[0]?.[5], "#ffffff");
  assert.equal(result.artifact.pixels[1]?.[5], "#70c8e8");
  assert.equal(result.artifact.pixels[5]?.[5], "#18242c");
  assert.equal(result.artifact.pixels[0]?.[0], null);
});

test("renderDocument applies multiple rectangle fills in order", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 4 3\n  background transparent\n\nrect 0 0 4 3 #112233\n  fill solid #ffffff"
  });
  const compiled = compileDocument(parsed.document);
  const result = renderDocument(compiled.document);

  assert.deepEqual(result.artifact.rows, ["####", "####", "####"]);
  assert.deepEqual(result.artifact.pixels, [
    ["#ffffff", "#ffffff", "#ffffff", "#ffffff"],
    ["#ffffff", "#ffffff", "#ffffff", "#ffffff"],
    ["#ffffff", "#ffffff", "#ffffff", "#ffffff"]
  ]);
});

test("renderDocument rasterizes horizontal linear gradients across rectangle width", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 3 2\n  background transparent\n\nrect 0 0 3 2\n  fill gradient #ff0000 #0000ff"
  });
  const compiled = compileDocument(parsed.document);
  const result = renderDocument(compiled.document);

  assert.deepEqual(result.artifact.rows, ["###", "###"]);
  assert.deepEqual(result.artifact.pixels, [
    ["#ff0000", "#800080", "#0000ff"],
    ["#ff0000", "#800080", "#0000ff"]
  ]);
});

test("renderDocument rasterizes vertical linear gradients", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 2 3\n  background transparent\n\nrect 0 0 2 3\n  fill\n    gradient-linear\n      direction vertical\n      stop #ff0000 0\n      stop #0000ff 1"
  });
  const compiled = compileDocument(parsed.document);
  const result = renderDocument(compiled.document);

  assert.deepEqual(result.artifact.pixels, [
    ["#ff0000", "#ff0000"],
    ["#800080", "#7f0080"],
    ["#0000ff", "#0000ff"]
  ]);
});

test("renderDocument rasterizes angled linear gradients", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 3 3\n  background transparent\n\nrect 0 0 3 3\n  fill\n    gradient-linear\n      angle 45\n      stop #000000 0\n      stop #ffffff 1"
  });
  const compiled = compileDocument(parsed.document);
  const result = renderDocument(compiled.document);

  assert.deepEqual(result.artifact.pixels, [
    ["#000000", "#404040", "#808080"],
    ["#404040", "#808080", "#bfbfbf"],
    ["#808080", "#bfbfbf", "#ffffff"]
  ]);
});

test("renderDocument rasterizes radial gradients from the configured center", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 3 3\n  background transparent\n\nrect 0 0 3 3\n  fill\n    gradient-radial\n      stop #ffffff 0\n      stop #000000 1"
  });
  const compiled = compileDocument(parsed.document);
  const result = renderDocument(compiled.document);

  assert.deepEqual(result.artifact.pixels, [
    ["#000000", "#4b4b4b", "#000000"],
    ["#4b4b4b", "#ffffff", "#4b4b4b"],
    ["#000000", "#4b4b4b", "#000000"]
  ]);
});

test("renderDocument blends semi-transparent gradient fills over previous fills", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 3 1\n  background transparent\n\nrect 0 0 3 1 #ff0000\n  fill\n    gradient\n      stop #00ff0000 0\n      stop #0000ff80 1"
  });
  const compiled = compileDocument(parsed.document);
  const result = renderDocument(compiled.document);

  assert.deepEqual(result.artifact.pixels, [["#ff0000", "#bf2020", "#7f0080"]]);
});

test("renderDocument multiplies fill alpha with gradient stop alpha", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 3 1\n  background transparent\n\nrect 0 0 3 1 #ff0000\n  fill alpha=0.5\n    gradient\n      stop #00ff0000 0\n      stop #0000ff80 1"
  });
  const compiled = compileDocument(parsed.document);
  const result = renderDocument(compiled.document);

  assert.deepEqual(result.artifact.pixels, [["#ff0000", "#df1010", "#bf0040"]]);
});

test("renderDocument rasterizes solid rectangle strokes", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 7 5\n  background transparent\n\nrect 1 1 5 3\n  stroke 1 white"
  });
  const compiled = compileDocument(parsed.document);
  const result = renderDocument(compiled.document);

  assert.deepEqual(result.artifact.rows, [
    ".......",
    ".#####.",
    ".#...#.",
    ".#####.",
    "......."
  ]);
});

test("renderDocument rasterizes dashed rectangle strokes", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 8 4\n  background transparent\n\nrect 1 1 6 2\n  stroke width=1 color=white style=dashed dash-length=2 gap-length=1"
  });
  const compiled = compileDocument(parsed.document);
  const result = renderDocument(compiled.document);

  assert.deepEqual(result.artifact.rows, [
    "........",
    ".##.##..",
    ".##.##..",
    "........"
  ]);
});

test("renderDocument makes rectangle strokes follow cut contours", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 7 7\n  background transparent\n\nrect 1 1 5 5\n  cut 2 0 2 0\n  stroke 1 white"
  });
  const compiled = compileDocument(parsed.document);
  const result = renderDocument(compiled.document);

  assert.deepEqual(result.artifact.rows, [
    ".......",
    "..####.",
    ".#...#.",
    ".#...#.",
    ".#..#..",
    ".###...",
    "......."
  ]);
});

test("renderDocument makes rectangle strokes follow rounded contours", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 7 7\n  background transparent\n\nrect 1 1 5 5\n  radius 2\n  stroke 1 white"
  });
  const compiled = compileDocument(parsed.document);
  const result = renderDocument(compiled.document);

  assert.deepEqual(result.artifact.rows, [
    ".......",
    "..###..",
    ".#...#.",
    ".#...#.",
    ".#...#.",
    "..###..",
    "......."
  ]);
});

test("renderDocument samples gradient-filled strokes across the whole stroke envelope", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 7 5\n  background transparent\n\nrect 1 1 5 3\n  stroke\n    width 1\n    fill gradient-linear #ff0000 #0000ff"
  });
  const compiled = compileDocument(parsed.document);
  const result = renderDocument(compiled.document);

  assert.deepEqual(result.artifact.pixels, [
    [null, null, null, null, null, null, null],
    [null, "#ff0000", "#bf0040", "#800080", "#4000bf", "#0000ff", null],
    [null, "#ff0000", null, null, null, "#0000ff", null],
    [null, "#ff0000", "#bf0040", "#800080", "#4000bf", "#0000ff", null],
    [null, null, null, null, null, null, null]
  ]);
});

test("renderDocument keeps nested stroke alpha explicit instead of inherited", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 7 5\n  background transparent\n\nrect 2 2 3 1\n  stroke 1 #ffffff alpha=0.5\n    stroke 1 #0000ff"
  });
  const compiled = compileDocument(parsed.document);
  const result = renderDocument(compiled.document);

  assert.deepEqual(result.artifact.pixels, [
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, "#0000ff", "#0000ff", "#0000ff", null, null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null]
  ]);
});

test("renderDocument rasterizes rectangle shadows behind the base shape", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 5 5\n  background transparent\n\nrect 1 1 3 3 white\n  shadow 1 1 black"
  });
  const compiled = compileDocument(parsed.document);
  const result = renderDocument(compiled.document);

  assert.deepEqual(result.artifact.rows, [
    ".....",
    ".###.",
    ".####",
    ".####",
    "..###"
  ]);
  assert.equal(result.artifact.pixels[2]?.[2], "#ffffff");
  assert.equal(result.artifact.pixels[4]?.[4], "#000000");
});

test("renderDocument applies blur to rectangle shadow alpha", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 5 5\n  background transparent\n\nrect 2 2 1 1 white\n  shadow 0 0 black blur=1"
  });
  const compiled = compileDocument(parsed.document);
  const result = renderDocument(compiled.document);

  assert.deepEqual(result.artifact.pixels, [
    [null, null, null, null, null],
    [null, "#0000001c", "#0000001c", "#0000001c", null],
    [null, "#0000001c", "#ffffff", "#0000001c", null],
    [null, "#0000001c", "#0000001c", "#0000001c", null],
    [null, null, null, null, null]
  ]);
});

test("renderDocument applies positive spread to circle shadows", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 9 9\n  background transparent\n\ncircle 3 3 1 white\n  shadow\n    x 2\n    y 1\n    spread 1\n    fill solid black"
  });
  const compiled = compileDocument(parsed.document);
  const result = renderDocument(compiled.document);

  assert.equal(result.artifact.pixels[2]?.[5], "#000000");
  assert.equal(result.artifact.pixels[4]?.[7], "#000000");
  assert.equal(result.artifact.pixels[3]?.[3], "#ffffff");
});

test("renderDocument applies negative spread to polygon shadows", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 9 9\n  background transparent\n\npolygon 1 1 7 1 4 7\n  shadow\n    y 1\n    spread -1\n    fill solid black"
  });
  const compiled = compileDocument(parsed.document);
  const result = renderDocument(compiled.document);

  assert.deepEqual(result.artifact.rows, [
    ".........",
    ".........",
    ".........",
    "...##....",
    "...##....",
    ".........",
    ".........",
    ".........",
    "........."
  ]);
});

test("renderDocument applies outer glow outside the source contour", () => {
  const parsed = parseSource({
    source:
      "sprite glow\n  size 5 5\n  background transparent\n\nrect 2 2 1 1 white\n  glow #00ffff blur=1"
  });
  const compiled = compileDocument(parsed.document);
  const result = renderDocument(compiled.document);

  assert.deepEqual(result.artifact.pixels, [
    [null, null, null, null, null],
    [null, "#00ffff1c", "#00ffff1c", "#00ffff1c", null],
    [null, "#00ffff1c", "#ffffff", "#00ffff1c", null],
    [null, "#00ffff1c", "#00ffff1c", "#00ffff1c", null],
    [null, null, null, null, null]
  ]);
});

test("renderDocument clips inner glow inside the source contour", () => {
  const parsed = parseSource({
    source:
      "sprite inner-glow\n  size 5 5\n  background transparent\n\nrect 1 1 3 3 black\n  glow #00ffff mode=inner blur=1"
  });
  const compiled = compileDocument(parsed.document);
  const result = renderDocument(compiled.document);

  assert.deepEqual(result.artifact.pixels, [
    [null, null, null, null, null],
    [null, "#008e8e", "#005555", "#008e8e", null],
    [null, "#005555", "#000000", "#005555", null],
    [null, "#008e8e", "#005555", "#008e8e", null],
    [null, null, null, null, null]
  ]);
});

test("renderDocument rasterizes nested rectangle strokes", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 9 7\n  background transparent\n\nrect-inset 2\n  stroke 2 #70c8e8\n    stroke 1 white"
  });
  const compiled = compileDocument(parsed.document);
  const result = renderDocument(compiled.document);

  assert.deepEqual(result.artifact.rows, [
    ".........",
    ".#######.",
    ".#######.",
    ".##...##.",
    ".#######.",
    ".#######.",
    "........."
  ]);
});

test("renderDocument advances nested polygon strokes from the outer envelope", () => {
  const result = renderSource({
    source:
      "sprite panel\n  size 12 12\n  background transparent\n\npolygon 4 4 8 4 8 8 4 8 #18242c\n  stroke 2 #70c8e8\n    stroke width=2 color=white align=outside"
  });

  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.artifact.pixels[1]![4], "#ffffff");
  assert.equal(result.artifact.pixels[4]![4], "#70c8e8");
  assert.equal(result.artifact.pixels[5]![5], "#18242c");
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

test("renderSource clips mask contents to the mask shape coverage", () => {
  const result = renderSource({
    source:
      "sprite masked\n  size 5 3\n  background transparent\n\nmask window\n  shape\n    rect 1 0 3 3\n  contents\n    rect 0 0 5 3 white"
  });

  assert.deepEqual(result.artifact.rows, [".###.", ".###.", ".###."]);
  assert.deepEqual(result.artifact.pixels, [
    [null, "#ffffff", "#ffffff", "#ffffff", null],
    [null, "#ffffff", "#ffffff", "#ffffff", null],
    [null, "#ffffff", "#ffffff", "#ffffff", null]
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("renderSource supports inverted masks that exclude the shape area", () => {
  const result = renderSource({
    source:
      "sprite masked-invert\n  size 5 3\n  background transparent\n\nmask invert=true\n  shape\n    rect 1 0 3 3\n  contents\n    rect 0 0 5 3 white"
  });

  assert.deepEqual(result.artifact.rows, ["#...#", "#...#", "#...#"]);
  assert.deepEqual(result.artifact.pixels, [
    ["#ffffff", null, null, null, "#ffffff"],
    ["#ffffff", null, null, null, "#ffffff"],
    ["#ffffff", null, null, null, "#ffffff"]
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("renderSource supports mask shape-only debug output", () => {
  const result = renderSource({
    source:
      "sprite masked-shape\n  size 5 3\n  background transparent\n\nmask show=shape-only\n  shape\n    rect 1 0 3 3\n  contents\n    rect 0 0 5 3 #70c8e8"
  });

  assert.deepEqual(result.artifact.rows, [".###.", ".###.", ".###."]);
  assert.deepEqual(result.artifact.pixels, [
    [null, "#ffffff", "#ffffff", "#ffffff", null],
    [null, "#ffffff", "#ffffff", "#ffffff", null],
    [null, "#ffffff", "#ffffff", "#ffffff", null]
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("renderSource supports mask content-only debug output", () => {
  const result = renderSource({
    source:
      "sprite masked-content\n  size 5 3\n  background transparent\n\nmask show=content-only\n  shape\n    rect 1 0 3 3\n  contents\n    rect 0 0 5 3 #70c8e8"
  });

  assert.deepEqual(result.artifact.rows, ["#####", "#####", "#####"]);
  assert.deepEqual(result.artifact.pixels, [
    ["#70c8e8", "#70c8e8", "#70c8e8", "#70c8e8", "#70c8e8"],
    ["#70c8e8", "#70c8e8", "#70c8e8", "#70c8e8", "#70c8e8"],
    ["#70c8e8", "#70c8e8", "#70c8e8", "#70c8e8", "#70c8e8"]
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("renderSource renders grouped commands with normal ordering semantics", () => {
  const result = renderSource({
    source:
      "sprite grouped\n  size 4 2\n  background transparent\n\nplot 1 0 red\ngroup overlay\n  rect 0 0 2 2 #70c8e8\n  plot 1 0 white\nplot 3 1 red"
  });

  assert.deepEqual(result.compiled.commands.map((command) => command.kind), [
    "plot",
    "group",
    "plot"
  ]);
  assert.deepEqual(result.artifact.pixels, [
    ["#70c8e8", "#ffffff", null, null],
    ["#70c8e8", "#70c8e8", null, "#ff0000"]
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("renderSource applies group fill to the composited child alpha", () => {
  const result = renderSource({
    source:
      "sprite grouped-fill\n  size 4 2\n  background transparent\n\ngroup badge\n  rect 0 0 2 2 white\n  plot 2 0 white\n  fill solid #70c8e8"
  });

  assert.deepEqual(result.artifact.pixels, [
    ["#70c8e8", "#70c8e8", "#70c8e8", null],
    ["#70c8e8", "#70c8e8", null, null]
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("renderSource applies group stroke to the combined child contour", () => {
  const result = renderSource({
    source:
      "sprite grouped-stroke\n  size 5 5\n  background transparent\n\ngroup badge\n  rect 1 1 3 3 #101010\n  stroke 1 white"
  });

  assert.deepEqual(result.artifact.pixels, [
    [null, null, null, null, null],
    [null, "#ffffff", "#ffffff", "#ffffff", null],
    [null, "#ffffff", "#101010", "#ffffff", null],
    [null, "#ffffff", "#ffffff", "#ffffff", null],
    [null, null, null, null, null]
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("renderSource advances nested group strokes from the composited contour", () => {
  const result = renderSource({
    source:
      "sprite grouped-nested-stroke\n  size 9 7\n  background transparent\n\ngroup badge\n  rect-inset 2 #18242c\n  stroke 2 #70c8e8\n    stroke 1 white"
  });

  assert.deepEqual(result.artifact.pixels, [
    [null, null, null, null, null, null, null, null, null],
    [null, "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", null],
    [null, "#ffffff", "#70c8e8", "#70c8e8", "#70c8e8", "#70c8e8", "#70c8e8", "#ffffff", null],
    [null, "#ffffff", "#70c8e8", "#18242c", "#18242c", "#18242c", "#70c8e8", "#ffffff", null],
    [null, "#ffffff", "#70c8e8", "#70c8e8", "#70c8e8", "#70c8e8", "#70c8e8", "#ffffff", null],
    [null, "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", null],
    [null, null, null, null, null, null, null, null, null]
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("renderSource applies group shadow behind composited children", () => {
  const result = renderSource({
    source:
      "sprite grouped-shadow\n  size 4 4\n  background transparent\n\ngroup badge\n  rect 0 0 2 2 white\n  shadow 1 1 black"
  });

  assert.deepEqual(result.artifact.pixels, [
    ["#ffffff", "#ffffff", null, null],
    ["#ffffff", "#ffffff", "#000000", null],
    [null, "#000000", "#000000", null],
    [null, null, null, null]
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("renderSource applies blur to group shadow alpha", () => {
  const result = renderSource({
    source:
      "sprite grouped-shadow-blur\n  size 5 5\n  background transparent\n\ngroup badge\n  plot 2 2 white\n  shadow 0 0 black blur=1"
  });

  assert.deepEqual(result.artifact.pixels, [
    [null, null, null, null, null],
    [null, "#0000001c", "#0000001c", "#0000001c", null],
    [null, "#0000001c", "#ffffff", "#0000001c", null],
    [null, "#0000001c", "#0000001c", "#0000001c", null],
    [null, null, null, null, null]
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("renderSource applies outer glow to composited group alpha", () => {
  const result = renderSource({
    source:
      "sprite grouped-glow\n  size 5 5\n  background transparent\n\ngroup badge\n  plot 2 2 white\n  glow #00ffff blur=1"
  });

  assert.deepEqual(result.artifact.pixels, [
    [null, null, null, null, null],
    [null, "#00ffff1c", "#00ffff1c", "#00ffff1c", null],
    [null, "#00ffff1c", "#ffffff", "#00ffff1c", null],
    [null, "#00ffff1c", "#00ffff1c", "#00ffff1c", null],
    [null, null, null, null, null]
  ]);
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
