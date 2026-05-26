import type { ExampleDoc } from "../../types.js";

export const polygonDoc: ExampleDoc = {
    id: "polygon",
    title: "Polygon",
    navGroup: "Drawable Commands",
    summary:
      "Defines a polygon shape drawable from at least three points.",
    properties: [
      "points: inline x/y point pairs",
      "antialias: optional geometry smoothing"
    ],
    childCommands: [
      "Point commands",
      "Appearance commands",
      "Effect commands",
      "Geometry modifier commands",
      "Property commands"
    ],
    notes: [
      "Constructor form uses whitespace-separated `x y` pairs, not comma-separated tuples.",
      "Use `point` children when the polygon has several vertices.",
      "`antialias` can smooth polygon fill, stroke, shadow, and glow coverage."
    ],
    examples: [
      {
        id: "polygon-basic",
        title: "Inline Point Pairs",
        summary: "Flat whitespace-separated point pairs are the constructor form.",
        source: [
          "sprite polygon-demo",
          "  size 256 160",
          "  background transparent",
          "  antialias true",
          "",
          "polygon 32 24 208 32 180 132 58 120 #70c8e8"
        ].join("\n")
      },
      {
        id: "polygon-points",
        title: "Expanded Point Children",
        summary: "Child `point` commands keep larger polygons easy to scan.",
        source: [
          "sprite polygon-points-demo",
          "  size 256 160",
          "  background transparent",
          "  antialias true",
          "",
          "polygon",
          "  point 40 36",
          "  point 198 26",
          "  point 222 78",
          "  point 164 132",
          "  point 52 116",
          "  fill solid #ffcc88"
        ].join("\n")
      }
    ]
  };
