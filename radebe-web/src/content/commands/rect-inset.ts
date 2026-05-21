import type { ExampleDoc } from "../../types.js";

export const rectInsetDoc: ExampleDoc = {
    id: "rect-inset",
    title: "Rect Inset",
    navGroup: "Drawable Commands",
    summary:
      "Defines a rectangle from the current sprite bounds using a uniform inset amount, four-side top/right/bottom/left shorthand, or expanded side-specific insets.",
    args: ["inset", "top right bottom left", "color shorthand", "fill", "antialias"],
    childCommands: ["fill", "stroke", "cut", "radius", "antialias"],
    notes: [
      "The uniform `inset` value applies to every side by default.",
      "`rect-inset 4 4 8 8` and child `inset 4 4 8 8` use top, right, bottom, left order.",
      "Any of `top`, `right`, `bottom`, or `left` can override the uniform inset per side.",
      "Like `rect`, direct color shorthand lowers into an implicit solid fill.",
      "The computed rectangle must still fit inside the sprite bounds."
    ],
    examples: [
      {
        id: "rect-inset-basic",
        title: "Inset Panel",
        summary: "A centered panel defined purely from the sprite bounds and one inset value.",
        source: [
          "sprite inset-panel-demo",
          "  size 96 48",
          "  background transparent",
          "",
          "# Simple inset panel using color shorthand",
          "rect-inset 8 #18242c"
        ].join("\n")
      },
      {
        id: "rect-inset-layered",
        title: "Different Per Side",
        summary: "Overrides individual sides when you want asymmetric padding or a shifted plate.",
        source: [
          "sprite inset-sides-demo",
          "  size 160 72",
          "  background transparent",
          "",
          "# Four-side shorthand: top right bottom left",
          "rect-inset 6 18 10 10",
          "  fill solid #18242c"
        ].join("\n")
      }
    ]
  };
