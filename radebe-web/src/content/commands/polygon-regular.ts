import type { ExampleDoc } from "../../types.js";

export const polygonRegularDoc: ExampleDoc = {
    id: "polygon-regular",
    title: "Regular Polygon",
    navGroup: "Drawable Commands",
    summary:
      "Generates an equal-sided polygon shape drawable around an explicit center point. It accepts the same fill, stroke, shadow, glow, antialias, and uniform vertex `cut` or `radius` modifiers as `polygon`.",
    args: ["x", "y", "sides", "radius", "optional color shorthand", "antialias"],
    childCommands: ["cut", "radius", "fill", "stroke", "shadow", "glow", "antialias"],
    notes: [
      "`polygon-regular <x> <y> <sides> <radius>` creates points around the provided center.",
      "`sides` must be at least `3`; `radius` must be at least `1`.",
      "The first point is placed at the top, then the remaining points proceed clockwise.",
      "Use inline arguments for the center and base radius; child `radius` is reserved for the corner-rounding modifier.",
      "`cut` and `radius` modify every vertex uniformly, and the current slice does not allow both at once.",
      "A trailing color shorthand lowers into an implicit solid fill.",
      "Use explicit `polygon` when individual point positions need manual control."
    ],
    examples: [
      {
        id: "polygon-regular-basic",
        title: "Offset Hexagon",
        summary: "A compact regular hexagon positioned from an explicit center point.",
        source: [
          "sprite regular-hexagon-demo",
          "  size 96 96",
          "  background transparent",
          "  antialias true",
          "",
          "polygon-regular 42 48 6 36 #18242c",
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
          "polygon-regular 48 48 8 34",
          "  shadow 0 4 #000000 alpha=0.32 blur=3",
          "  fill gradient-radial #d8f8ff #2c8fb2",
          "  stroke 2 #fff8d8 alpha=0.75"
        ].join("\n")
      },
      {
        id: "polygon-regular-cut",
        title: "Chamfered Hexagon",
        summary: "Uniform `cut` bevels each regular-polygon vertex for a more mechanical panel feel.",
        source: [
          "sprite regular-polygon-cut-demo",
          "  size 96 96",
          "  background transparent",
          "  antialias true",
          "",
          "polygon-regular 48 48 6 34 #18242c",
          "  cut 6",
          "  stroke 3 #70c8e8"
        ].join("\n")
      }
    ]
  };
