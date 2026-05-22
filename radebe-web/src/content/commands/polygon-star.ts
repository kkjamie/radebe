import type { ExampleDoc } from "../../types.js";

export const polygonStarDoc: ExampleDoc = {
    id: "polygon-star",
    title: "Star Polygon",
    navGroup: "Drawable Commands",
    summary:
      "Generates a centered star polygon by alternating outer and inner radii. It behaves like a polygon shape drawable for fills, strokes, shadows, glow, and antialiasing.",
    args: ["points", "inner-radius", "outer-radius", "optional color shorthand", "antialias"],
    childCommands: [
      "points",
      "inner-radius",
      "outer-radius",
      "color",
      "fill",
      "stroke",
      "shadow",
      "glow",
      "antialias"
    ],
    notes: [
      "`polygon-star <points> <inner-radius> <outer-radius>` creates a star around the sprite center.",
      "`points` must be at least `3`; both radii must be at least `1`.",
      "`outer-radius` must be greater than `inner-radius`.",
      "The first outer point is placed at the top, then inner and outer points alternate clockwise.",
      "A trailing color shorthand lowers into an implicit solid fill."
    ],
    examples: [
      {
        id: "polygon-star-basic",
        title: "Prize Star",
        summary: "A five-point star with a warm fill, stroke, shadow, and glow.",
        source: [
          "sprite star-polygon-demo",
          "  size 96 96",
          "  background transparent",
          "  antialias true",
          "",
          "polygon-star 5 16 38",
          "  shadow 0 4 #9f5a16 alpha=0.35 blur=3",
          "  fill gradient-radial #fff8d8 #ffb02e",
          "  stroke 3 #9f5a16 alpha=0.7",
          "  glow #ffd766 blur=4 alpha=0.45"
        ].join("\n")
      },
      {
        id: "polygon-star-many-points",
        title: "Spark",
        summary: "More points and tighter radii produce a bright sparkle-style shape.",
        source: [
          "sprite star-spark-demo",
          "  size 96 96",
          "  background transparent",
          "  antialias true",
          "",
          "polygon-star 8 10 36 #d8f8ff",
          "  stroke 2 #70c8e8",
          "  glow #70c8e8 blur=5 alpha=0.55"
        ].join("\n")
      }
    ]
  };
