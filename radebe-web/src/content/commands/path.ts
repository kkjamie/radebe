import type { ExampleDoc } from "../../types.js";

export const pathDoc: ExampleDoc = {
    id: "path",
    title: "Path",
    navGroup: "Drawable Commands",
    summary:
      "Defines an open polyline path from child points. A path is visible through `stroke`, making it the multi-segment counterpart to `line`.",
    args: ["optional name", "antialias"],
    childCommands: ["point", "stroke", "antialias"],
    notes: [
      "Use child `point` commands to define the path in order.",
      "A path requires at least one `stroke` child because open paths do not produce fill coverage.",
      "Path strokes accept only `align center`.",
      "`antialias` smooths the generated stroke coverage for curved-looking route segments and diagonals.",
      "Closed or fillable path contours are not supported."
    ],
    examples: [
      {
        id: "path-basic",
        title: "Open Polyline",
        summary: "A named path rendered through a simple solid stroke.",
        source: [
          "sprite path-demo",
          "  size 120 72",
          "  background transparent",
          "",
          "path rail",
          "  point 16 18",
          "  point 56 18",
          "  point 78 34",
          "  point 102 22",
          "  stroke 2 #d8f8ff"
        ].join("\n")
      },
      {
        id: "path-dashed",
        title: "Dashed Path",
        summary: "The path stroke uses the same stroke style controls as the other supported shapes.",
        source: [
          "sprite path-dashed-demo",
          "  size 144 80",
          "  background transparent",
          "",
          "path route",
          "  point 16 56",
          "  point 42 22",
          "  point 76 30",
          "  point 108 14",
          "  point 126 40",
          "  stroke width=2 color=#ffcc88 style=dashed dash-length=5 gap-length=2"
        ].join("\n")
      }
    ]
  };
