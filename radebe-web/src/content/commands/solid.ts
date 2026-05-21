import type { ExampleDoc } from "../../types.js";

export const solidDoc: ExampleDoc = {
    id: "solid",
    title: "Solid Fill",
    navGroup: "Appearance Commands",
    summary:
      "Uses `fill` as an appearance container and `solid` as the actual fill variant that supplies one color.",
    args: ["color"],
    childCommands: [],
    notes: [
      "`fill` on its own is only a container; it does not render without a variant such as `solid`, `gradient-linear`, or `gradient-radial`.",
      "Canonical expanded form is `fill -> solid -> color`.",
      "Shorthand `fill solid red` is supported.",
      "Multiple fills are preserved as ordered passes."
    ],
    examples: [
      {
        id: "solid-basic",
        title: "Two Solid Rectangles",
        summary: "One rectangle uses shorthand, the other uses the expanded canonical form.",
        source: [
          "sprite solid-fill-demo",
          "  size 96 40",
          "  background transparent",
          "",
          "# Shorthand solid fill",
          "rect 8 10 30 18",
          "  fill solid #18242c",
          "",
          "# Expanded canonical solid fill",
          "rect 58 11 30 16",
          "  fill",
          "    solid",
          "      color #70c8e8"
        ].join("\n")
      }
    ]
  };
