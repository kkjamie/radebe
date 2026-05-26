import type { ExampleDoc } from "../../types.js";

export const pathDoc: ExampleDoc = {
    id: "path",
    title: "Path",
    navGroup: "Drawable Commands",
    summary:
      "Defines an open polyline path from child points. A path is visible through `stroke`, making it the multi-segment counterpart to `line`.",
    properties: [
      "name: optional path label",
      "antialias: optional geometry smoothing"
    ],
    childCommands: ["Point commands", "Stroke commands", "Property commands"],
    notes: [
      "Use child `point` commands to define the path in order.",
      "A path requires at least one `stroke` child because open paths do not produce fill coverage.",
      "Path strokes accept only `align center`.",
      "`antialias` smooths diagonal segment coverage."
    ],
    examples: [
      {
        id: "path-basic",
        title: "Point Children",
        summary: "A path is defined by ordered child points and rendered through `stroke`.",
        source: [
          "sprite path-demo",
          "  size 320 176",
          "  background transparent",
          "  antialias true",
          "",
          "path rail",
          "  point 32 116",
          "  point 112 48",
          "  point 188 72",
          "  point 264 36",
          "  stroke 6 #d8f8ff"
        ].join("\n")
      }
    ]
  };
