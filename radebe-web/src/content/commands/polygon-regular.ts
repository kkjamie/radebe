import type { ExampleDoc } from "../../types.js";

export const polygonRegularDoc: ExampleDoc = {
    id: "polygon-regular",
    title: "Regular Polygon",
    navGroup: "Drawable Commands",
    summary:
      "Generates an equal-sided polygon shape drawable centered in the sprite. It accepts the same fill, stroke, shadow, glow, and antialias controls as `polygon`.",
    args: ["sides", "radius", "optional color shorthand", "antialias"],
    childCommands: ["sides", "radius", "color", "fill", "stroke", "shadow", "glow", "antialias"],
    notes: [
      "`polygon-regular <sides> <radius>` creates points around the sprite center.",
      "`sides` must be at least `3`; `radius` must be at least `1`.",
      "The first point is placed at the top, then the remaining points proceed clockwise.",
      "A trailing color shorthand lowers into an implicit solid fill.",
      "Use explicit `polygon` when the center or individual point positions need manual control."
    ],
    examples: [
      {
        id: "polygon-regular-basic",
        title: "Centered Hexagon",
        summary: "A compact regular hexagon using color shorthand and a shared stroke pass.",
        source: [
          "sprite regular-hexagon-demo",
          "  size 96 96",
          "  background transparent",
          "  antialias true",
          "",
          "polygon-regular 6 36 #18242c",
          "  stroke 3 #70c8e8"
        ].join("\n")
      },
      {
        id: "polygon-regular-fill",
        title: "Expanded Fill",
        summary: "Regular polygons use the same appearance children as other shape drawables.",
        source: [
          "sprite regular-polygon-fill-demo",
          "  size 96 96",
          "  background transparent",
          "  antialias true",
          "",
          "polygon-regular 8 34",
          "  shadow 0 4 #000000 alpha=0.32 blur=3",
          "  fill gradient-radial #d8f8ff #2c8fb2",
          "  stroke 2 #fff8d8 alpha=0.75"
        ].join("\n")
      }
    ]
  };
