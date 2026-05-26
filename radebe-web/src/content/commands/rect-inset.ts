import type { ExampleDoc } from "../../types.js";

export const rectInsetDoc: ExampleDoc = {
    id: "rect-inset",
    title: "Rect Inset",
    navGroup: "Drawable Commands",
    summary:
      "Defines a rectangle from the current sprite bounds using a uniform inset amount, four-side top/right/bottom/left shorthand, or expanded side-specific insets.",
    args: ["inset", "top right bottom left", "color shorthand", "fill", "antialias"],
    childCommands: ["fill", "stroke", "shadow", "glow", "antialias"],
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
        title: "Uniform Inset",
        summary: "A centered panel defined purely from the sprite bounds and one inset value.",
        source: [
          "sprite inset-panel-demo",
          "  size 192 96",
          "  background transparent",
          "",
          "rect-inset 16 #18242c"
        ].join("\n")
      },
      {
        id: "rect-inset-layered",
        title: "Four-Side Inset",
        summary: "Four inline values use top, right, bottom, left order.",
        source: [
          "sprite inset-sides-demo",
          "  size 256 112",
          "  background transparent",
          "",
          "rect-inset 12 36 20 20",
          "  fill solid #18242c"
        ].join("\n")
      }
    ]
  };
