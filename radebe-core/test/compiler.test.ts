import test from "node:test";
import assert from "node:assert/strict";

import type { CompiledDrawCommand } from "../src/types.js";
import { renderSource } from "../src/index.js";
import { compileTestSource, joinSourceLines, parseTestSource } from "./helpers.js";

test("parseSource returns a nested command tree for indentation-based source", () => {
  const result = parseTestSource(
    "sprite panel\n  size 4 3\n  background transparent\n\nplot 1 1 #ffffff"
  );

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
  const result = parseTestSource(
    "# File comment\nsprite panel\n  # Header comment\n  size 4 3\n  background transparent\n// legacy slash comment"
  );

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
  const result = compileTestSource(
    "sprite panel\n  size 4 3\n  background transparent\n\nplot 1 1 #ffffff\nline 0 0 3 0 #70c8e8"
  );

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

test("compileDocument supports sprite antialias defaults and geometry overrides", () => {
  const result = compileTestSource(
    "sprite panel\n  size 7 7\n  background transparent\n  antialias true\n\nline 0 0 6 6 white antialias=false\ncircle 3 3 2 #70c8e8\n  antialias false\nrect 0 0 2 2 white\n  antialias true"
  );

  assert.deepEqual(result.document.sprite, {
    name: "panel",
    width: 7,
    height: 7,
    background: "transparent",
    antialias: true
  });
  assert.deepEqual(result.document.commands, [
    {
      kind: "line",
      lineNumber: 6,
      x1: 0,
      y1: 0,
      x2: 6,
      y2: 6,
      color: "white",
      antialias: false
    },
    {
      kind: "circle",
      lineNumber: 7,
      x: 3,
      y: 3,
      radius: 2,
      antialias: false,
      fills: [{ kind: "solid", color: "#70c8e8", alpha: 1 }],
      strokes: []
    },
    {
      kind: "rect",
      lineNumber: 9,
      x: 0,
      y: 0,
      width: 2,
      height: 2,
      antialias: true,
      fills: [{ kind: "solid", color: "white", alpha: 1 }],
      strokes: [],
      sourceCommandName: "rect"
    }
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("compileDocument reports invalid antialias values", () => {
  const result = compileTestSource(
    "sprite panel\n  size 5 5\n  background transparent\n  antialias maybe\n\ncircle 2 2 2 white antialias=sometimes"
  );

  assert.deepEqual(
    result.diagnostics.map((diagnostic) => diagnostic.message),
    [
      'The sprite command expects "antialias" to be either "true" or "false".',
      'The circle command expects "antialias" to be either "true" or "false".'
    ]
  );
});

test("compileDocument supports rect-absolute and rect alias", () => {
  const result = compileTestSource(
    "sprite panel\n  size 6 5\n  background transparent\n\nrect-absolute 1 1 3 2 #70c8e8\nrect\n  x 0\n  y 4\n  width 2\n  height 1\n  color #ffffff"
  );

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
  const result = compileTestSource(
    "sprite panel\n  size 10 8\n  background transparent\n\nrect-inset 2 #70c8e8"
  );

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
  const result = compileTestSource(
    "sprite panel\n  size 12 10\n  background transparent\n\nrect-inset\n  inset 2\n  top 1\n  right 3\n  fill solid #70c8e8"
  );

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

test("compileDocument supports four-side rect-inset shorthand", () => {
  const result = compileTestSource(joinSourceLines([
    "sprite panel",
    "  size 16 12",
    "  background transparent",
    "",
    "rect-inset 1 2 3 4 #70c8e8",
    "rect-inset",
    "  inset 2 1 4 3",
    "  fill solid #ffffff"
  ]));

  assert.deepEqual(result.document.commands, [
    {
      kind: "rect",
      lineNumber: 5,
      x: 4,
      y: 1,
      width: 10,
      height: 8,
      fills: [{ kind: "solid", color: "#70c8e8", alpha: 1 }],
      strokes: [],
      sourceCommandName: "rect-inset"
    },
    {
      kind: "rect",
      lineNumber: 6,
      x: 3,
      y: 2,
      width: 12,
      height: 6,
      fills: [{ kind: "solid", color: "#ffffff", alpha: 1 }],
      strokes: [],
      sourceCommandName: "rect-inset"
    }
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("compileDocument supports circle shorthand and explicit fills", () => {
  const result = compileTestSource(
    "sprite panel\n  size 9 9\n  background transparent\n\ncircle 4 4 3 #70c8e8\ncircle\n  x 4\n  y 4\n  radius 2\n  fill solid #ffffff"
  );

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
  const result = compileTestSource(
    "sprite panel\n  size 11 11\n  background transparent\n\ncircle 5 5 3\n  stroke 1 white"
  );

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
  const result = compileTestSource(
    "sprite panel\n  size 10 10\n  background transparent\n\npolygon 1 1 7 1 4 6 #70c8e8\npolygon\n  point 1 7\n  point 4 3\n  point 7 7\n  fill solid #ffffff"
  );

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

test("compileDocument supports generated regular polygons and stars", () => {
  const result = compileTestSource(
    "sprite panel\n  size 10 10\n  background transparent\n\npolygon-regular 6 4 4 3 #70c8e8\npolygon-star 4 6 5 2 4\n  fill solid white"
  );

  assert.deepEqual(result.document.commands, [
    {
      kind: "polygon",
      lineNumber: 5,
      points: [
        { x: 6, y: 1 },
        { x: 9, y: 4 },
        { x: 6, y: 7 },
        { x: 3, y: 4 }
      ],
      fills: [{ kind: "solid", color: "#70c8e8", alpha: 1 }],
      strokes: []
    },
    {
      kind: "polygon",
      lineNumber: 6,
      points: [
        { x: 4, y: 2 },
        { x: 5, y: 4 },
        { x: 8, y: 5 },
        { x: 6, y: 7 },
        { x: 6, y: 9 },
        { x: 4, y: 8 },
        { x: 2, y: 9 },
        { x: 2, y: 7 },
        { x: 0, y: 5 },
        { x: 3, y: 4 }
      ],
      fills: [{ kind: "solid", color: "white", alpha: 1 }],
      strokes: []
    }
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("compileDocument supports polygon strokes through the shared appearance model", () => {
  const result = compileTestSource(
    "sprite panel\n  size 8 8\n  background transparent\n\npolygon 1 1 6 1 3 6\n  stroke 1 white"
  );

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

test("compileDocument supports polygon-family cut and radius modifiers", () => {
  const result = compileTestSource(
    "sprite panel\n  size 16 16\n  background transparent\n\npolygon 2 2 13 2 13 13 2 13 #70c8e8\n  cut 2\n\npolygon-regular 8 8 6 5 #ffffff\n  radius 1\n\npolygon-star 8 8 5 2 6 #ffcc88\n  cut 1"
  );

  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.document.commands.length, 3);
  assert.equal(result.document.commands[0]?.kind, "polygon");
  assert.equal(result.document.commands[1]?.kind, "polygon");
  assert.equal(result.document.commands[2]?.kind, "polygon");
  assert.notDeepEqual(
    (result.document.commands[0] as Extract<CompiledDrawCommand, { kind: "polygon" }>).points,
    [
      { x: 2, y: 2 },
      { x: 13, y: 2 },
      { x: 13, y: 13 },
      { x: 2, y: 13 }
    ]
  );
});

test("compileDocument rejects polygon-family shapes that combine cut and radius", () => {
  const result = compileTestSource(
    "sprite panel\n  size 16 16\n  background transparent\n\npolygon 2 2 13 2 13 13 2 13 #70c8e8\n  cut 2\n  radius 1"
  );

  assert.deepEqual(result.diagnostics, [
    {
      stage: "compiler",
      line: 5,
      column: 1,
      message:
        'The polygon command currently does not allow both "cut" and "radius" on the same polygon shape.'
    }
  ]);
});

test("compileDocument supports path as a stroke-only polyline", () => {
  const result = compileTestSource(
    "sprite panel\n  size 12 12\n  background transparent\n\npath rail\n  point 1 1\n  point 5 1\n  point 8 4\n  stroke 1 white"
  );

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
  const result = compileTestSource(
    "sprite panel\n  size 6 4\n  background transparent\n\nvar pad 1\nvar panel-fill #18242c\nvar accent #70c8e8\n\nrect-inset $pad $panel-fill\n  stroke 1 $accent"
  );

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
  const result = compileTestSource(
    "sprite panel\n  size 4 3\n  background transparent\n\nvars\n  var accent #ffffff\n  var x-pos 2\n\nplot x=$x-pos y=1 color=$accent"
  );

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

test("compileDocument preserves transparent group containers in source order", () => {
  const result = compileTestSource(
    "sprite panel\n  size 6 4\n  background transparent\n\nvar accent #70c8e8\n\ngroup frame\n  rect 0 0 3 2 $accent\n  group lights\n    plot 2 0 white\nline 0 3 5 3 white"
  );

  assert.deepEqual(result.document.commands, [
    {
      kind: "group",
      lineNumber: 7,
      name: "frame",
      commands: [
        {
          kind: "rect",
          lineNumber: 8,
          x: 0,
          y: 0,
          width: 3,
          height: 2,
          fills: [{ kind: "solid", color: "#70c8e8", alpha: 1 }],
          strokes: [],
          sourceCommandName: "rect"
        },
        {
          kind: "group",
          lineNumber: 9,
          name: "lights",
          commands: [{ kind: "plot", lineNumber: 10, x: 2, y: 0, color: "white" }],
          fills: [],
          strokes: []
        }
      ],
      fills: [],
      strokes: []
    },
    {
      kind: "line",
      lineNumber: 11,
      x1: 0,
      y1: 3,
      x2: 5,
      y2: 3,
      color: "white"
    }
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("compileDocument compiles group-level appearance passes after content", () => {
  const result = compileTestSource(
    "sprite panel\n  size 4 4\n  background transparent\n\ngroup frame\n  rect 1 1 2 2 white\n  fill solid #70c8e8\n  shadow 1 1 black\n  stroke 1 white"
  );
  const group = result.document.commands[0];

  assert.equal(group?.kind, "group");
  assert.deepEqual(group.commands.map((command) => command.kind), ["rect"]);
  assert.deepEqual(group.fills, [
    { kind: "solid", color: "#70c8e8", alpha: 1 }
  ]);
  assert.deepEqual(group.shadows, [
    {
      kind: "shadow",
      offsetX: 1,
      offsetY: 1,
      spread: 0,
      blur: 0,
      alpha: 1,
      fill: { kind: "solid", color: "black", alpha: 1 }
    }
  ]);
  assert.deepEqual(group.strokes, [
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
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("compileDocument rejects group passes before group content", () => {
  const result = compileTestSource(
    "sprite panel\n  size 4 4\n  background transparent\n\ngroup frame\n  fill solid white"
  );

  assert.deepEqual(result.document.commands, []);
  assert.deepEqual(result.diagnostics, [
    {
      stage: "compiler",
      message:
        "The group command expects at least one child draw command before group-level appearance or effect passes.",
      line: 6,
      column: 3
    }
  ]);
});

test("compileDocument rejects group content after group passes", () => {
  const result = compileTestSource(
    "sprite panel\n  size 4 4\n  background transparent\n\ngroup frame\n  rect 0 0 2 2 white\n  stroke 1 black\n  plot 3 3 white"
  );
  const group = result.document.commands[0];

  assert.equal(group?.kind, "group");
  assert.deepEqual(group.commands.map((command) => command.kind), ["rect"]);
  assert.deepEqual(result.diagnostics, [
    {
      stage: "compiler",
      message:
        "The group command expects all child draw commands before group-level appearance or effect passes.",
      line: 8,
      column: 3
    }
  ]);
});

test("compileDocument supports mask shape and contents containers", () => {
  const result = compileTestSource(
    "sprite panel\n  size 5 3\n  background transparent\n\nmask body invert=true show=shape-only\n  shape\n    rect 1 0 3 3\n  contents\n    rect 0 0 5 3 #70c8e8"
  );

  assert.deepEqual(result.document.commands, [
    {
      kind: "mask",
      lineNumber: 5,
      name: "body",
      invert: true,
      show: "shape-only",
      shapeCommands: [
        {
          kind: "rect",
          lineNumber: 7,
          x: 1,
          y: 0,
          width: 3,
          height: 3,
          fills: [{ kind: "solid", color: "white", alpha: 1 }],
          strokes: [],
          sourceCommandName: "rect"
        }
      ],
      contentCommands: [
        {
          kind: "rect",
          lineNumber: 9,
          x: 0,
          y: 0,
          width: 5,
          height: 3,
          fills: [{ kind: "solid", color: "#70c8e8", alpha: 1 }],
          strokes: [],
          sourceCommandName: "rect"
        }
      ]
    }
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("compileDocument rejects mask contents before shape", () => {
  const result = compileTestSource(
    "sprite panel\n  size 4 4\n  background transparent\n\nmask bad\n  contents\n    plot 0 0 white\n  shape\n    rect 0 0 2 2"
  );

  assert.deepEqual(result.document.commands, []);
  assert.deepEqual(result.diagnostics, [
    {
      stage: "compiler",
      message:
        "The mask command expects a shape container before its contents container.",
      line: 6,
      column: 3
    },
    {
      stage: "compiler",
      message: "The mask command requires a contents container.",
      line: 5,
      column: 1
    }
  ]);
});

test("compileDocument rejects invalid mask show values", () => {
  const result = compileTestSource(
    "sprite panel\n  size 4 4\n  background transparent\n\nmask debug show=wireframe\n  shape\n    rect 0 0 2 2\n  contents\n    plot 0 0 white"
  );

  assert.deepEqual(result.document.commands, []);
  assert.deepEqual(result.diagnostics, [
    {
      stage: "compiler",
      message:
        'The mask command expects "show" to be "masked-content", "shape-only", or "content-only".',
      line: 5,
      column: 1
    }
  ]);
});

test("compileDocument reports variable definition and usage diagnostics", () => {
  const result = compileTestSource(
    "sprite panel\n  size 4 3\n  background transparent\n\nvar accent #ffffff\nvar accent #70c8e8\nplot 1 1 $missing\nplot left+$accent 1 white"
  );

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
  const result = compileTestSource(
    "sprite panel\n  size 12 12\n  background transparent\n\npath\n  point 1 1\n  point 5 1"
  );

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
  const result = compileTestSource(
    "sprite panel\n  size 6 4\n  background transparent\n\nrect 1 1 3 2 #70c8e8"
  );

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
  const result = compileTestSource(
    "sprite panel\n  size 7 5\n  background transparent\n\nrect\n  x 1\n  y 1\n  width 4\n  height 3\n  fill solid #70c8e8"
  );

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
  const result = compileTestSource(
    "sprite panel\n  size 7 5\n  background transparent\n\nrect\n  x 1\n  y 1\n  width 4\n  height 3\n  fill\n    solid\n      color #70c8e8"
  );

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
  const result = compileTestSource(
    "sprite panel\n  size 4 3\n  background transparent\n\nrect 0 0 4 3 #112233\n  fill solid #ffffff"
  );

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
  const result = compileTestSource(
    "sprite panel\n  size 6 4\n  background transparent\n\nrect 0 0 3 4\n  fill gradient red blue\nrect 3 0 3 4\n  fill\n    gradient-linear\n      stop red 0\n      stop #0000ff80 1\n      direction vertical"
  );

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
  const result = compileTestSource(
    "sprite panel\n  size 8 8\n  background transparent\n\nrect 1 1 4 3\n  shadow x=1 y=2 spread=1 blur=2 color=#000000 alpha=0.5"
  );

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
          blur: 2,
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

test("compileDocument supports shape glows through the shared appearance model", () => {
  const result = compileTestSource(
    "sprite panel\n  size 8 8\n  background transparent\n\nrect 1 1 4 3\n  glow #70c8e8 mode=inner spread=1 blur=2 alpha=0.5"
  );

  assert.deepEqual(result.document.commands, [
    {
      kind: "rect",
      lineNumber: 5,
      x: 1,
      y: 1,
      width: 4,
      height: 3,
      fills: [],
      glows: [
        {
          kind: "glow",
          mode: "inner",
          spread: 1,
          blur: 2,
          alpha: 0.5,
          fill: { kind: "solid", color: "#70c8e8", alpha: 1 }
        }
      ],
      strokes: [],
      sourceCommandName: "rect"
    }
  ]);
  assert.deepEqual(result.diagnostics, []);
});

test("compileDocument supports radial gradient properties and stop children", () => {
  const result = compileTestSource(
    "sprite panel\n  size 8 8\n  background transparent\n\nrect 0 0 8 8\n  fill\n    gradient-radial\n      center-x 0.25\n      center-y 0.75\n      radius 0.6\n      stop #ffffff 0\n      stop #00000000 1"
  );

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
  const result = compileTestSource(
    "sprite panel\n  size 8 4\n  background transparent\n\nrect 1 1 6 2\n  fill alpha=0.5 gradient-linear red blue\n  stroke 1 white alpha=0.25"
  );

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
  const result = compileTestSource(
    "sprite panel\n  size 12 8\n  background transparent\n\nrect-inset 2\n  stroke width=2 color=white align=inside style=dashed dash-length=3 gap-length=1"
  );

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
  const result = compileTestSource(
    "sprite panel\n  size 10 8\n  background transparent\n\nrect 1 1 6 5 #70c8e8\n  cut 2"
  );

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
  const result = compileTestSource(
    "sprite panel\n  size 12 10\n  background transparent\n\nrect 1 1 8 6 #70c8e8\n  cut\n    top-left 1\n    top-right 2\n    bottom-right 3\n    bottom-left 4"
  );

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
  const result = compileTestSource(
    "sprite panel\n  size 10 8\n  background transparent\n\nrect 1 1 6 5 #70c8e8\n  radius 2"
  );

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
  const result = compileTestSource(
    "sprite panel\n  size 10 8\n  background transparent\n\nrect 1 1 6 5 #70c8e8\n  cut 2\n  radius 1"
  );

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
  const result = compileTestSource(
    "sprite panel\n  size 14 10\n  background transparent\n\nrect-inset 2\n  stroke 2 #70c8e8\n    stroke 1 white"
  );

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
  const result = compileTestSource(
    "sprite\n  name panel\n  size\n    width 4\n    height 3\n  background color=transparent\n\nline x1=0 y1=0\n  x2 3\n  y2 0\n  color #70c8e8\nplot\n  x 1\n  y 1\n  color #ffffff"
  );

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
  const result = compileTestSource(
    "plot 0 0 #fff\nsprite panel\n  plot 1 1 #fff\n  size 0 3"
  );

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
  const result = compileTestSource(
    "sprite panel\n  size 4 3\n\nplot 1 1 #fff\n  color white"
  );

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
  const result = compileTestSource(
    "sprite panel\n  size 5 5\n  background transparent\n\ncircle 2 2 1"
  );

  assert.deepEqual(result.diagnostics, [
    {
      stage: "compiler",
      message:
        "The circle command requires a color shorthand, a fill child, a glow child, a shadow child, or a stroke child.",
      line: 5,
      column: 1
    }
  ]);
});

test("compileDocument rejects malformed numeric tokens instead of partially parsing them", () => {
  const result = compileTestSource(joinSourceLines([
    "sprite panel",
    "  size 8 8",
    "  background transparent",
    "",
    "rect 0 0 3.5 2 white",
    "circle 4 4 2px white",
    "polygon 1.5 1 6 1 4 6 white",
    "rect 0 0 4 4",
    "  fill solid white alpha=0.5x"
  ]));

  assert.deepEqual(
    result.diagnostics.map((diagnostic) => diagnostic.message),
    [
      'The rect command expects "width" to be an integer.',
      'The circle command expects "radius" to be an integer.',
      'The polygon command expects point x values to be integers, but received "1.5".',
      'The fill command expects "alpha" to be a number.'
    ]
  );
});

test("parseSource reports indentation diagnostics", () => {
  const result = parseTestSource("sprite panel\n   size 4 3");

  assert.deepEqual(result.diagnostics, [
    {
      stage: "parser",
      message: "Indentation must use whole two-space levels.",
      line: 2,
      column: 1
    }
  ]);
});
