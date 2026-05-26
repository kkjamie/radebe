import type { ExampleDoc } from "../../types.js";

export const solidDoc: ExampleDoc = {
    id: "solid",
    title: "Solid Fill",
    navGroup: "Appearance Commands",
    summary:
      "Supplies one color to a `fill` appearance pass.",
    args: ["color"],
    childCommands: [],
    notes: [
      "`fill` on its own is only a container; it does not render without a variant such as `solid`, `gradient-linear`, or `gradient-radial`.",
      "`fill solid red` is the compact form.",
      "Expanded form is `fill` then `solid` then `color`.",
      "Shape drawables can all use the same solid fill variant."
    ],
    examples: [
      {
        id: "solid-shape-hosts",
        title: "Shape Hosts",
        summary: "`fill solid` works on the supported filled shape drawables.",
        source: [
          "sprite solid-shape-hosts",
          "  size 560 176",
          "  background transparent",
          "  antialias true",
          "",
          "rect 24 44 80 72",
          "  fill solid #18242c",
          "",
          "circle 154 80 38",
          "  fill solid #70c8e8",
          "",
          "polygon",
          "  point 242 38",
          "  point 328 50",
          "  point 312 124",
          "  point 226 116",
          "  fill solid #ffcc88",
          "",
          "polygon-regular 406 82 6 44",
          "  fill",
          "    solid",
          "      color #d8f8ff",
          "",
          "polygon-star 508 82 5 22 48",
          "  fill",
          "    solid #ff8f70"
        ].join("\n")
      }
    ]
  };
