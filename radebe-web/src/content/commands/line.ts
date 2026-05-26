import type { ExampleDoc } from "../../types.js";

export const lineDoc: ExampleDoc = {
    id: "line",
    title: "Line",
    navGroup: "Drawable Commands",
    summary: "Draws a line from one integer point to another using the shared raster line path.",
    args: ["x1", "y1", "x2", "y2", "color", "antialias"],
    childCommands: ["antialias"],
    notes: [
      "Line coordinates are integer pixel coordinates.",
      "`antialias` can override the sprite default for this line.",
      "Child-property form is equivalent to inline positional or named args."
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
