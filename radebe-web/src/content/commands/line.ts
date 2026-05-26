import type { ExampleDoc } from "../../types.js";

export const lineDoc: ExampleDoc = {
    id: "line",
    title: "Line",
    navGroup: "Drawable Commands",
    summary: "Draws a line between two integer points.",
    properties: [
      "x1/y1: start point",
      "x2/y2: end point",
      "color: line color",
      "antialias: optional geometry smoothing"
    ],
    childCommands: ["Property commands"],
    notes: [
      "Coordinates use integer pixel locations.",
      "`antialias` can override the sprite default for one line."
    ],
    examples: [
      {
        id: "line-basic",
        title: "Three Lines",
        summary: "A compact example showing a top edge, a property-form diagonal, and an antialiased diagonal.",
        source: [
          "sprite line-demo",
          "  size 64 32",
          "  background transparent",
          "",
          "# Top edge",
          "line 4 4 58 4 #d8f8ff",
          "",
          "# Property-form diagonal",
          "line",
          "  x1 8",
          "  y1 26",
          "  x2 52",
          "  y2 10",
          "  color #70c8e8",
          "",
          "# Smoothed diagonal",
          "line 6 30 58 16 #ffcc88 antialias=true"
        ].join("\n")
      }
    ]
  };
