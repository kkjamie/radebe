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

test("parseSource treats only hash-prefixed lines as comments", () => {
  const result = parseSource({
    source:
      "# File comment\nsprite panel\n  # Header comment\n  size 4 3\n  background transparent\n// legacy slash comment"
  });

  assert.deepEqual(
    result.document.commands.map((command) => command.name),
    ["sprite", "//"]
  );
  assert.deepEqual(result.document.commands[0]?.children.map((child) => child.name), [
    "size",
    "background"
  ]);
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

test("compileDocument supports rect-absolute and rect alias", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 6 5\n  background transparent\n\nrect-absolute 1 1 3 2 #70c8e8\nrect\n  x 0\n  y 4\n  width 2\n  height 1\n  color #ffffff"
  });
  const result = compileDocument(parsed.document);

  assert.deepEqual(result.document.commands, [
    {
      kind: "rect",
      lineNumber: 5,
      x: 1,
      y: 1,
      width: 3,
      height: 2,
      fills: [{ kind: "solid", color: "#70c8e8", alpha: 1 }],
      strokes: [],
      sourceCommandName: "rect-absolute"
    },
    {
      kind: "rect",
      lineNumber: 6,
      x: 0,
      y: 4,
      width: 2,
      height: 1,
      fills: [{ kind: "solid", color: "#ffffff", alpha: 1 }],
      strokes: [],
      sourceCommandName: "rect"
    }
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("compileDocument supports rect-inset against the current sprite bounds", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 10 8\n  background transparent\n\nrect-inset 2 #70c8e8"
  });
  const result = compileDocument(parsed.document);

  assert.deepEqual(result.document.commands, [
    {
      kind: "rect",
      lineNumber: 5,
      x: 2,
      y: 2,
      width: 6,
      height: 4,
      fills: [{ kind: "solid", color: "#70c8e8", alpha: 1 }],
      strokes: [],
      sourceCommandName: "rect-inset"
    }
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("compileDocument supports side-specific rect-inset overrides", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 12 10\n  background transparent\n\nrect-inset\n  inset 2\n  top 1\n  right 3\n  fill solid #70c8e8"
  });
  const result = compileDocument(parsed.document);

  assert.deepEqual(result.document.commands, [
    {
      kind: "rect",
      lineNumber: 5,
      x: 2,
      y: 1,
      width: 7,
      height: 7,
      fills: [{ kind: "solid", color: "#70c8e8", alpha: 1 }],
      strokes: [],
      sourceCommandName: "rect-inset"
    }
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("compileDocument supports circle shorthand and explicit fills", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 9 9\n  background transparent\n\ncircle 4 4 3 #70c8e8\ncircle\n  x 4\n  y 4\n  radius 2\n  fill solid #ffffff"
  });
  const result = compileDocument(parsed.document);

  assert.deepEqual(result.document.commands, [
    {
      kind: "circle",
      lineNumber: 5,
      x: 4,
      y: 4,
      radius: 3,
      fills: [{ kind: "solid", color: "#70c8e8", alpha: 1 }],
      strokes: []
    },
    {
      kind: "circle",
      lineNumber: 6,
      x: 4,
      y: 4,
      radius: 2,
      fills: [{ kind: "solid", color: "#ffffff", alpha: 1 }],
      strokes: []
    }
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("compileDocument supports circle strokes through the shared appearance model", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 11 11\n  background transparent\n\ncircle 5 5 3\n  stroke 1 white"
  });
  const result = compileDocument(parsed.document);

  assert.deepEqual(result.document.commands, [
    {
      kind: "circle",
      lineNumber: 5,
      x: 5,
      y: 5,
      radius: 3,
      fills: [],
      strokes: [
        {
          kind: "stroke",
          width: 1,
          align: "center",
          style: "solid",
          alpha: 1,
          dashLength: null,
          gapLength: null,
          dotSpacing: null,
          fill: { kind: "solid", color: "white", alpha: 1 },
          strokes: []
        }
      ]
    }
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("compileDocument supports polygon shorthand and point children without comma-separated pairs", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 10 10\n  background transparent\n\npolygon 1 1 7 1 4 6 #70c8e8\npolygon\n  point 1 7\n  point 4 3\n  point 7 7\n  fill solid #ffffff"
  });
  const result = compileDocument(parsed.document);

  assert.deepEqual(result.document.commands, [
    {
      kind: "polygon",
      lineNumber: 5,
      points: [
        { x: 1, y: 1 },
        { x: 7, y: 1 },
        { x: 4, y: 6 }
      ],
      fills: [{ kind: "solid", color: "#70c8e8", alpha: 1 }],
      strokes: []
    },
    {
      kind: "polygon",
      lineNumber: 6,
      points: [
        { x: 1, y: 7 },
        { x: 4, y: 3 },
        { x: 7, y: 7 }
      ],
      fills: [{ kind: "solid", color: "#ffffff", alpha: 1 }],
      strokes: []
    }
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("compileDocument supports polygon strokes through the shared appearance model", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 8 8\n  background transparent\n\npolygon 1 1 6 1 3 6\n  stroke 1 white"
  });
  const result = compileDocument(parsed.document);

  assert.deepEqual(result.document.commands, [
    {
      kind: "polygon",
      lineNumber: 5,
      points: [
        { x: 1, y: 1 },
        { x: 6, y: 1 },
        { x: 3, y: 6 }
      ],
      fills: [],
      strokes: [
        {
          kind: "stroke",
          width: 1,
          align: "center",
          style: "solid",
          alpha: 1,
          dashLength: null,
          gapLength: null,
          dotSpacing: null,
          fill: { kind: "solid", color: "white", alpha: 1 },
          strokes: []
        }
      ]
    }
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("compileDocument supports path as a stroke-only polyline", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 12 12\n  background transparent\n\npath rail\n  point 1 1\n  point 5 1\n  point 8 4\n  stroke 1 white"
  });
  const result = compileDocument(parsed.document);

  assert.deepEqual(result.document.commands, [
    {
      kind: "path",
      lineNumber: 5,
      name: "rail",
      points: [
        { x: 1, y: 1 },
        { x: 5, y: 1 },
        { x: 8, y: 4 }
      ],
      strokes: [
        {
          kind: "stroke",
          width: 1,
          align: "center",
          style: "solid",
          alpha: 1,
          dashLength: null,
          gapLength: null,
          dotSpacing: null,
          fill: { kind: "solid", color: "white", alpha: 1 },
          strokes: []
        }
      ]
    }
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("compileDocument resolves root var declarations before later commands", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 6 4\n  background transparent\n\nvar pad 1\nvar panel-fill #18242c\nvar accent #70c8e8\n\nrect-inset $pad $panel-fill\n  stroke 1 $accent"
  });
  const result = compileDocument(parsed.document);

  assert.deepEqual(result.document.commands, [
    {
      kind: "rect",
      lineNumber: 9,
      x: 1,
      y: 1,
      width: 4,
      height: 2,
      fills: [{ kind: "solid", color: "#18242c", alpha: 1 }],
      strokes: [
        {
          kind: "stroke",
          width: 1,
          align: "center",
          style: "solid",
          alpha: 1,
          dashLength: null,
          gapLength: null,
          dotSpacing: null,
          fill: { kind: "solid", color: "#70c8e8", alpha: 1 },
          strokes: []
        }
      ],
      sourceCommandName: "rect-inset"
    }
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("compileDocument resolves grouped vars and named argument usage", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 4 3\n  background transparent\n\nvars\n  var accent #ffffff\n  var x-pos 2\n\nplot x=$x-pos y=1 color=$accent"
  });
  const result = compileDocument(parsed.document);

  assert.deepEqual(result.document.commands, [
    { kind: "plot", lineNumber: 9, x: 2, y: 1, color: "#ffffff" }
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("compileDocument allows vars to be defined between draw commands", () => {
  const result = renderSource({
    source:
      "sprite panel\n  size 3 1\n  background transparent\n\nvar first #ffffff\nplot 0 0 $first\nvar second #70c8e8\nplot 2 0 $second"
  });

  assert.deepEqual(result.artifact.pixels, [
    ["#ffffff", null, "#70c8e8"]
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("compileDocument reports variable definition and usage diagnostics", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 4 3\n  background transparent\n\nvar accent #ffffff\nvar accent #70c8e8\nplot 1 1 $missing\nplot left+$accent 1 white"
  });
  const result = compileDocument(parsed.document);

  assert.deepEqual(result.document.commands, []);
  assert.deepEqual(result.diagnostics, [
    {
      stage: "compiler",
      message: 'Variable "$accent" is already defined.',
      line: 6,
      column: 1
    },
    {
      stage: "compiler",
      message: 'Unknown variable "$missing".',
      line: 7,
      column: 1
    },
    {
      stage: "compiler",
      message:
        'Variable references must occupy a whole value token, such as "$accent". Received "left+$accent".',
      line: 8,
      column: 1
    }
  ]);
});

test("compileDocument requires stroke visibility for path", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 12 12\n  background transparent\n\npath\n  point 1 1\n  point 5 1"
  });
  const result = compileDocument(parsed.document);

  assert.deepEqual(result.document.commands, []);
  assert.deepEqual(result.diagnostics, [
    {
      stage: "compiler",
      message:
        "The path command requires at least one stroke child because open paths are only visible through stroke in the current slice.",
      line: 5,
      column: 1
    }
  ]);
});

test("compileDocument lowers rectangle color shorthand into fill solid", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 6 4\n  background transparent\n\nrect 1 1 3 2 #70c8e8"
  });
  const result = compileDocument(parsed.document);

  assert.deepEqual(result.document.commands, [
    {
      kind: "rect",
      lineNumber: 5,
      x: 1,
      y: 1,
      width: 3,
      height: 2,
      fills: [{ kind: "solid", color: "#70c8e8", alpha: 1 }],
      strokes: [],
      sourceCommandName: "rect"
    }
  ]);
});

test("compileDocument supports explicit fill solid on rectangles", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 7 5\n  background transparent\n\nrect\n  x 1\n  y 1\n  width 4\n  height 3\n  fill solid #70c8e8"
  });
  const result = compileDocument(parsed.document);

  assert.deepEqual(result.document.commands, [
    {
      kind: "rect",
      lineNumber: 5,
      x: 1,
      y: 1,
      width: 4,
      height: 3,
      fills: [{ kind: "solid", color: "#70c8e8", alpha: 1 }],
      strokes: [],
      sourceCommandName: "rect"
    }
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("compileDocument supports expanded fill solid color child form", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 7 5\n  background transparent\n\nrect\n  x 1\n  y 1\n  width 4\n  height 3\n  fill\n    solid\n      color #70c8e8"
  });
  const result = compileDocument(parsed.document);

  assert.deepEqual(result.document.commands, [
    {
      kind: "rect",
      lineNumber: 5,
      x: 1,
      y: 1,
      width: 4,
      height: 3,
      fills: [{ kind: "solid", color: "#70c8e8", alpha: 1 }],
      strokes: [],
      sourceCommandName: "rect"
    }
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("compileDocument allows multiple rectangle fills as ordered passes", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 4 3\n  background transparent\n\nrect 0 0 4 3 #112233\n  fill solid #ffffff"
  });
  const result = compileDocument(parsed.document);

  assert.deepEqual(result.document.commands, [
    {
      kind: "rect",
      lineNumber: 5,
      x: 0,
      y: 0,
      width: 4,
      height: 3,
      fills: [
        { kind: "solid", color: "#112233", alpha: 1 },
        { kind: "solid", color: "#ffffff", alpha: 1 }
      ],
      strokes: [],
      sourceCommandName: "rect"
    }
  ]);
});

test("compileDocument supports linear gradient shorthand and explicit stops", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 6 4\n  background transparent\n\nrect 0 0 3 4\n  fill gradient red blue\nrect 3 0 3 4\n  fill\n    gradient-linear\n      stop red 0\n      stop #0000ff80 1\n      direction vertical"
  });
  const result = compileDocument(parsed.document);

  assert.deepEqual(result.document.commands, [
    {
      kind: "rect",
      lineNumber: 5,
      x: 0,
      y: 0,
      width: 3,
      height: 4,
      fills: [
        {
          kind: "gradient-linear",
          direction: "horizontal",
          angle: null,
          alpha: 1,
          stops: [
            { color: "red", position: 0 },
            { color: "blue", position: 1 }
          ]
        }
      ],
      strokes: [],
      sourceCommandName: "rect"
    },
    {
      kind: "rect",
      lineNumber: 7,
      x: 3,
      y: 0,
      width: 3,
      height: 4,
      fills: [
        {
          kind: "gradient-linear",
          direction: "vertical",
          angle: null,
          alpha: 1,
          stops: [
            { color: "red", position: 0 },
            { color: "#0000ff80", position: 1 }
          ]
        }
      ],
      strokes: [],
      sourceCommandName: "rect"
    }
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("compileDocument supports shape shadows through the shared appearance model", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 8 8\n  background transparent\n\nrect 1 1 4 3\n  shadow x=1 y=2 spread=1 color=#000000 alpha=0.5"
  });
  const result = compileDocument(parsed.document);

  assert.deepEqual(result.document.commands, [
    {
      kind: "rect",
      lineNumber: 5,
      x: 1,
      y: 1,
      width: 4,
      height: 3,
      fills: [],
      shadows: [
        {
          kind: "shadow",
          offsetX: 1,
          offsetY: 2,
          spread: 1,
          alpha: 0.5,
          fill: { kind: "solid", color: "#000000", alpha: 1 }
        }
      ],
      strokes: [],
      sourceCommandName: "rect"
    }
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("compileDocument supports radial gradient properties and stop children", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 8 8\n  background transparent\n\nrect 0 0 8 8\n  fill\n    gradient-radial\n      center-x 0.25\n      center-y 0.75\n      radius 0.6\n      stop #ffffff 0\n      stop #00000000 1"
  });
  const result = compileDocument(parsed.document);

  assert.deepEqual(result.document.commands, [
    {
      kind: "rect",
      lineNumber: 5,
      x: 0,
      y: 0,
      width: 8,
      height: 8,
      fills: [
        {
          kind: "gradient-radial",
          centerX: 0.25,
          centerY: 0.75,
          radius: 0.6,
          alpha: 1,
          stops: [
            { color: "#ffffff", position: 0 },
            { color: "#00000000", position: 1 }
          ]
        }
      ],
      strokes: [],
      sourceCommandName: "rect"
    }
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("compileDocument supports fill alpha and stroke alpha independently", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 8 4\n  background transparent\n\nrect 1 1 6 2\n  fill alpha=0.5 gradient-linear red blue\n  stroke 1 white alpha=0.25"
  });
  const result = compileDocument(parsed.document);

  assert.deepEqual(result.document.commands, [
    {
      kind: "rect",
      lineNumber: 5,
      x: 1,
      y: 1,
      width: 6,
      height: 2,
      fills: [
        {
          kind: "gradient-linear",
          direction: "horizontal",
          angle: null,
          alpha: 0.5,
          stops: [
            { color: "red", position: 0 },
            { color: "blue", position: 1 }
          ]
        }
      ],
      strokes: [
        {
          kind: "stroke",
          width: 1,
          align: "center",
          style: "solid",
          alpha: 0.25,
          dashLength: null,
          gapLength: null,
          dotSpacing: null,
          fill: { kind: "solid", color: "white", alpha: 1 },
          strokes: []
        }
      ],
      sourceCommandName: "rect"
    }
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("compileDocument supports stroke shorthand and named properties on rectangles", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 12 8\n  background transparent\n\nrect-inset 2\n  stroke width=2 color=white align=inside style=dashed dash-length=3 gap-length=1"
  });
  const result = compileDocument(parsed.document);

  assert.deepEqual(result.document.commands, [
    {
      kind: "rect",
      lineNumber: 5,
      x: 2,
      y: 2,
      width: 8,
      height: 4,
      fills: [],
      strokes: [
        {
          kind: "stroke",
          width: 2,
          align: "inside",
          style: "dashed",
          alpha: 1,
          dashLength: 3,
          gapLength: 1,
          dotSpacing: null,
          fill: { kind: "solid", color: "white", alpha: 1 },
          strokes: []
        }
      ],
      sourceCommandName: "rect-inset"
    }
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("compileDocument supports cut as a rectangle geometry modifier", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 10 8\n  background transparent\n\nrect 1 1 6 5 #70c8e8\n  cut 2"
  });
  const result = compileDocument(parsed.document);

  assert.deepEqual(result.document.commands, [
    {
      kind: "rect",
      lineNumber: 5,
      x: 1,
      y: 1,
      width: 6,
      height: 5,
      cut: {
        topLeft: 2,
        topRight: 2,
        bottomRight: 2,
        bottomLeft: 2
      },
      fills: [{ kind: "solid", color: "#70c8e8", alpha: 1 }],
      strokes: [],
      sourceCommandName: "rect"
    }
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("compileDocument supports named corner values for cut", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 12 10\n  background transparent\n\nrect 1 1 8 6 #70c8e8\n  cut\n    top-left 1\n    top-right 2\n    bottom-right 3\n    bottom-left 4"
  });
  const result = compileDocument(parsed.document);

  assert.deepEqual(result.document.commands, [
    {
      kind: "rect",
      lineNumber: 5,
      x: 1,
      y: 1,
      width: 8,
      height: 6,
      cut: {
        topLeft: 1,
        topRight: 2,
        bottomRight: 3,
        bottomLeft: 4
      },
      fills: [{ kind: "solid", color: "#70c8e8", alpha: 1 }],
      strokes: [],
      sourceCommandName: "rect"
    }
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("compileDocument supports radius as a rectangle geometry modifier", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 10 8\n  background transparent\n\nrect 1 1 6 5 #70c8e8\n  radius 2"
  });
  const result = compileDocument(parsed.document);

  assert.deepEqual(result.document.commands, [
    {
      kind: "rect",
      lineNumber: 5,
      x: 1,
      y: 1,
      width: 6,
      height: 5,
      radius: {
        value: 2
      },
      fills: [{ kind: "solid", color: "#70c8e8", alpha: 1 }],
      strokes: [],
      sourceCommandName: "rect"
    }
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("compileDocument rejects rectangles that combine cut and radius", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 10 8\n  background transparent\n\nrect 1 1 6 5 #70c8e8\n  cut 2\n  radius 1"
  });
  const result = compileDocument(parsed.document);

  assert.deepEqual(result.document.commands, []);
  assert.deepEqual(result.diagnostics, [
    {
      stage: "compiler",
      message:
        'The rect command currently does not allow both "cut" and "radius" on the same rectangle.',
      line: 5,
      column: 1
    }
  ]);
});

test("compileDocument supports nested rectangle strokes", () => {
  const parsed = parseSource({
    source:
      "sprite panel\n  size 14 10\n  background transparent\n\nrect-inset 2\n  stroke 2 #70c8e8\n    stroke 1 white"
  });
  const result = compileDocument(parsed.document);

  assert.deepEqual(result.document.commands, [
    {
      kind: "rect",
      lineNumber: 5,
      x: 2,
      y: 2,
      width: 10,
      height: 6,
      fills: [],
      strokes: [
        {
          kind: "stroke",
          width: 2,
          align: "center",
          style: "solid",
          alpha: 1,
          dashLength: null,
          gapLength: null,
          dotSpacing: null,
          fill: { kind: "solid", color: "#70c8e8", alpha: 1 },
          strokes: [
            {
              kind: "stroke",
              width: 1,
              align: "center",
              style: "solid",
              alpha: 1,
              dashLength: null,
              gapLength: null,
              dotSpacing: null,
              fill: { kind: "solid", color: "white", alpha: 1 },
              strokes: []
            }
          ]
        }
      ],
      sourceCommandName: "rect-inset"
    }
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("compileDocument treats inline and child property arguments as equivalent", () => {
  const parsed = parseSource({
    source:
      "sprite\n  name panel\n  size\n    width 4\n    height 3\n  background color=transparent\n\nline x1=0 y1=0\n  x2 3\n  y2 0\n  color #70c8e8\nplot\n  x 1\n  y 1\n  color #ffffff"
  });
  const result = compileDocument(parsed.document);

  assert.deepEqual(result.document.sprite, {
    name: "panel",
    width: 4,
    height: 3,
    background: "transparent"
  });
  assert.deepEqual(result.document.commands, [
    {
      kind: "line",
      lineNumber: 8,
      x1: 0,
      y1: 0,
      x2: 3,
      y2: 0,
      color: "#70c8e8"
    },
    {
      kind: "plot",
      lineNumber: 12,
      x: 1,
      y: 1,
      color: "#ffffff"
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

test("compileDocument reports duplicate values across inline and child forms", () => {
  const parsed = parseSource({
    source: "sprite panel\n  size 4 3\n\nplot 1 1 #fff\n  color white"
  });
  const result = compileDocument(parsed.document);

  assert.deepEqual(result.diagnostics, [
    {
      stage: "compiler",
      message: 'The plot command received duplicate "color" values.',
      line: 4,
      column: 1
    }
  ]);
});

test("compileDocument requires circle fill coverage", () => {
  const parsed = parseSource({
    source: "sprite panel\n  size 5 5\n  background transparent\n\ncircle 2 2 1"
  });
  const result = compileDocument(parsed.document);

  assert.deepEqual(result.diagnostics, [
    {
      stage: "compiler",
      message:
        "The circle command requires a color shorthand, a fill child, a shadow child, or a stroke child.",
      line: 5,
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
