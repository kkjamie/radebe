import type { ExampleDoc } from "../../types.js";

export const gradientLinearDoc: ExampleDoc = {
    id: "gradient-linear",
    title: "Linear Gradient",
    navGroup: "Appearance Commands",
    summary:
      "Supplies a linear color ramp to a `fill` appearance pass.",
    args: ["from", "to", "direction", "angle"],
    childCommands: ["stop"],
    notes: [
      "`gradient` remains a linear-gradient alias for compatibility, while `gradient-linear` is the explicit name.",
      "Use either `direction` or `angle`, not both.",
      "Supported directions are `horizontal` and `vertical`.",
      "Expanded stop form supports multiple colors and alpha-capable hex values."
    ],
    examples: [
      {
        id: "gradient-linear-shape-hosts",
        title: "Shape Hosts",
        summary: "The same linear gradient fill variant works across filled shape drawables.",
        source: [
          "sprite linear-gradient-shape-hosts",
          "  size 640 192",
          "  background transparent",
          "  antialias true",
          "",
          "rect 24 52 92 76",
          "  fill gradient #101820 #70c8e8",
          "",
          "circle 172 90 42",
          "  fill",
          "    gradient-linear",
          "      direction vertical",
          "      stop #101820 0",
          "      stop #70c8e8 1",
          "",
          "polygon",
          "  point 264 44",
          "  point 352 58",
          "  point 334 132",
          "  point 250 120",
          "  fill",
          "    gradient-linear",
          "      angle 35",
          "      stop #ffcc88 0",
          "      stop #ff8f70 1",
          "",
          "polygon-regular 450 90 6 48",
          "  fill gradient-linear #18242c #d8f8ff",
          "",
          "polygon-star 560 90 5 22 52",
          "  fill gradient-linear #ffcc88 #70c8e8"
        ].join("\n")
      }
    ]
  };
