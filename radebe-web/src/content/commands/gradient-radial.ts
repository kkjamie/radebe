import type { ExampleDoc } from "../../types.js";

export const gradientRadialDoc: ExampleDoc = {
    id: "gradient-radial",
    title: "Radial Gradient",
    navGroup: "Appearance Commands",
    summary:
      "Supplies a radial color ramp to a `fill` appearance pass.",
    properties: [
      "from/to: compact two-color gradient endpoints",
      "center-x/center-y: normalized gradient center",
      "radius: normalized gradient reach"
    ],
    childCommands: ["Stop commands", "Property commands"],
    notes: [
      "`center-x` and `center-y` are normalized from 0 to 1 within the rectangle bounds.",
      "A radius of `1` reaches the farthest rectangle corner from the chosen center.",
      "Expanded stop form supports multiple colors and transparency through alpha-capable hex values."
    ],
    examples: [
      {
        id: "gradient-radial-shape-hosts",
        title: "Shape Hosts",
        summary: "The same radial gradient fill variant works across filled shape drawables.",
        source: [
          "sprite radial-gradient-shape-hosts",
          "  size 640 192",
          "  background transparent",
          "  antialias true",
          "",
          "rect 24 52 92 76",
          "  fill gradient-radial #d8f8ff #18242c",
          "",
          "circle 172 90 42",
          "  fill",
          "    gradient-radial",
          "      center-x 0.35",
          "      center-y 0.32",
          "      radius 0.85",
          "      stop #fff8d8 0",
          "      stop #70c8e8 1",
          "",
          "polygon",
          "  point 264 44",
          "  point 352 58",
          "  point 334 132",
          "  point 250 120",
          "  fill",
          "    gradient-radial",
          "      center-x 0.42",
          "      center-y 0.34",
          "      radius 0.75",
          "      stop #ffcc88 0",
          "      stop #ff8f70 1",
          "",
          "polygon-regular 450 90 6 48",
          "  fill gradient-radial #d8f8ff #365266",
          "",
          "polygon-star 560 90 5 22 52",
          "  fill gradient-radial #fff8d8 #ff8f70"
        ].join("\n")
      }
    ]
  };
