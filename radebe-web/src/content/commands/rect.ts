import type { ExampleDoc } from "../../types.js";

export const rectDoc: ExampleDoc = {
    id: "rect",
    title: "Rect / Rect-Absolute",
    navGroup: "Drawable Commands",
    summary:
      "Defines an explicit rectangle from x, y, width, and height. `rect` is the short form of `rect-absolute`.",
    properties: [
      "x/y: top-left corner",
      "width/height: rectangle size",
      "antialias: optional geometry smoothing"
    ],
    childCommands: [
      "Appearance commands",
      "Effect commands",
      "Geometry modifier commands",
      "Property commands"
    ],
    notes: [
      "`rect` and `rect-absolute` are equivalent.",
      "Width and height must be positive integers.",
      "Plain integer-aligned rectangles remain crisp with or without antialiasing."
    ],
    examples: [
      {
        id: "rect-inline-and-expanded",
        title: "Inline And Property Forms",
        summary: "The same rectangle geometry can be written with constructor values or named child properties.",
        source: [
          "sprite rect-demo",
          "  size 256 96",
          "  background transparent",
          "",
          "rect-absolute 24 24 72 40 #18242c",
          "",
          "rect",
          "  x 144",
          "  y 24",
          "  width 72",
          "  height 40",
          "  fill solid #70c8e8"
        ].join("\n")
      }
    ]
  };
