import type { ExampleDoc } from "../../types.js";

export const polygonDoc: ExampleDoc = {
    id: "polygon",
    title: "Polygon",
    navGroup: "Drawable Commands",
    summary:
      "Defines a polygon shape drawable from at least three points. Polygons accept shared fill, stroke, shadow, glow, and antialias controls.",
    args: ["x y point pairs", "optional color shorthand", "antialias"],
    childCommands: ["point", "fill", "stroke", "antialias"],
    notes: [
      "Inline shorthand uses whitespace-separated `x y` pairs, not comma-separated tuples.",
      "The canonical readable form is repeated `point` children under `polygon`.",
      "A trailing color shorthand lowers into an implicit solid fill.",
      "`antialias` can smooth polygon fill, stroke, and shadow coverage.",
      "Polygon stroke uses the shared `stroke` command model, including align, style, and gradient fill support."
    ],
    examples: [
      {
        id: "polygon-basic",
        title: "Inline Point Pairs",
        summary: "A compact wedge using flat whitespace-separated point pairs and trailing color shorthand.",
        source: [
          "sprite polygon-demo",
          "  size 96 64",
          "  background transparent",
          "",
          "# Compact shorthand with a trailing color",
          "polygon 12 10 76 10 56 50 24 50 #18242c"
        ].join("\n")
      },
      {
        id: "polygon-gradient",
        title: "Expanded Point Children",
        summary: "The expanded form reads more clearly in larger files and works with the shared fill variants.",
        source: [
          "sprite polygon-gradient-demo",
          "  size 120 72",
          "  background transparent",
          "",
          "polygon",
          "  point 16 12",
          "  point 92 12",
          "  point 104 32",
          "  point 64 56",
          "  point 20 44",
          "  fill gradient-linear #101820 #70c8e8"
        ].join("\n")
      },
      {
        id: "polygon-stroke",
        title: "Polygon Stroke",
        summary: "A stroke-only polygon wedge using the same appearance model as the other supported shapes.",
        source: [
          "sprite polygon-stroke-demo",
          "  size 120 72",
          "  background transparent",
          "",
          "polygon",
          "  point 16 14",
          "  point 92 14",
          "  point 104 32",
          "  point 62 58",
          "  point 20 44",
          "  stroke 2 #d8f8ff"
        ].join("\n")
      }
    ]
  };
