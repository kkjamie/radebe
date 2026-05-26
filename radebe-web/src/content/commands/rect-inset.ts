import type { ExampleDoc } from "../../types.js";

export const rectInsetDoc: ExampleDoc = {
    id: "rect-inset",
    title: "Rect Inset",
    navGroup: "Drawable Commands",
    summary:
      "Defines a rectangle from the current sprite bounds using a uniform inset amount, four-side top/right/bottom/left constructor, or expanded side-specific insets.",
    properties: [
      "inset: uniform distance from every sprite edge",
      "top/right/bottom/left: four-side constructor order",
      "antialias: optional geometry smoothing"
    ],
    childCommands: [
      "Appearance commands",
      "Effect commands",
      "Geometry modifier commands",
      "Property commands"
    ],
    notes: [
      "Any of `top`, `right`, `bottom`, or `left` can override the uniform inset per side.",
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
