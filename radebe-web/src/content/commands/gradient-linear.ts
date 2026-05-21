import type { ExampleDoc } from "../../types.js";

export const gradientLinearDoc: ExampleDoc = {
    id: "gradient-linear",
    title: "Linear Gradient",
    navGroup: "Appearance Commands",
    summary:
      "Defines a linear gradient fill. It supports the old two-color shorthand through `gradient`, the explicit `gradient-linear` variant, stop lists, axis directions, and custom angles.",
    args: ["from", "to", "direction", "angle"],
    childCommands: ["stop"],
    notes: [
      "`gradient` remains a linear-gradient alias for compatibility, while `gradient-linear` is the explicit name.",
      "Use either `direction` or `angle`, not both.",
      "Supported directions are currently `horizontal` and `vertical`.",
      "Expanded stop form supports multiple colors and alpha-capable hex values like `#0000ff80`."
    ],
    examples: [
      {
        id: "gradient-linear-horizontal",
        title: "Horizontal Shorthand",
        summary: "The compact two-color form maps left-to-right across the rectangle.",
        source: [
          "sprite linear-horizontal-demo",
          "  size 256 56",
          "  background transparent",
          "",
          "# Default horizontal gradient alias",
          "rect 8 8 240 40",
          "  fill gradient #ff0055 #70c8e8"
        ].join("\n")
      },
      {
        id: "gradient-linear-vertical",
        title: "Vertical Stops",
        summary: "Uses explicit stops and a vertical axis to produce a top-to-bottom blend.",
        source: [
          "sprite linear-vertical-demo",
          "  size 256 80",
          "  background transparent",
          "",
          "# Vertical gradient with three stops",
          "rect 20 8 216 64",
          "  fill",
          "    gradient-linear",
          "      direction vertical",
          "      stop #101820 0",
          "      stop #2f4c5c 0.45",
          "      stop #d8f8ff 1"
        ].join("\n")
      },
      {
        id: "gradient-linear-angle",
        title: "Angled Custom Gradient",
        summary: "Shows the custom-angle form for diagonal lighting passes.",
        source: [
          "sprite linear-angle-demo",
          "  size 256 96",
          "  background transparent",
          "",
          "# Diagonal sweep using an explicit angle",
          "rect 16 12 224 72",
          "  fill",
          "    gradient-linear",
          "      angle 35",
          "      stop #14191f 0",
          "      stop #365266 0.55",
          "      stop #d8f8ffcc 1"
        ].join("\n")
      }
    ]
  };
