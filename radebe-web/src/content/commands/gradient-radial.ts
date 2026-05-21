import type { ExampleDoc } from "../../types.js";

export const gradientRadialDoc: ExampleDoc = {
    id: "gradient-radial",
    title: "Radial Gradient",
    navGroup: "Appearance Commands",
    summary:
      "Defines a radial gradient fill with a normalized center and radius. It works well for glows, vignette-like falloff, and soft highlights.",
    args: ["from", "to", "center-x", "center-y", "radius"],
    childCommands: ["stop"],
    notes: [
      "`center-x` and `center-y` are normalized from 0 to 1 within the rectangle bounds.",
      "A radius of `1` reaches the farthest rectangle corner from the chosen center.",
      "Expanded stop form supports multiple colors and transparency through alpha-capable hex values."
    ],
    examples: [
      {
        id: "gradient-radial-centered",
        title: "Centered Glow",
        summary: "A symmetric glow using the default center and radius.",
        source: [
          "sprite radial-centered-demo",
          "  size 192 112",
          "  background transparent",
          "",
          "# Default centered radial glow",
          "rect 16 16 160 80",
          "  fill",
          "    gradient-radial",
          "      stop #d8f8ff 0",
          "      stop #365266 0.5",
          "      stop #101820 1"
        ].join("\n")
      },
      {
        id: "gradient-radial-offset",
        title: "Offset Highlight",
        summary: "Moves the radial source to one side to fake a light hotspot.",
        source: [
          "sprite radial-offset-demo",
          "  size 192 112",
          "  background transparent",
          "",
          "# Offset highlight near the upper-left",
          "rect 16 16 160 80",
          "  fill",
          "    gradient-radial",
          "      center-x 0.25",
          "      center-y 0.28",
          "      radius 0.7",
          "      stop #fff8d8 0",
          "      stop #70c8e855 0.45",
          "      stop #14191f 1"
        ].join("\n")
      },
      {
        id: "gradient-radial-transparent",
        title: "Transparent Highlight",
        summary: "A radial highlight can sit above an earlier fill because ordered fill passes preserve alpha.",
        source: [
          "sprite radial-highlight-demo",
          "  size 192 112",
          "  background transparent",
          "",
          "# Base plate",
          "rect 16 16 160 80 #18242c",
          "",
          "# Transparent radial highlight layered on top with another fill pass",
          "rect 16 16 160 80",
          "  fill",
          "    gradient-radial",
          "      center-x 0.55",
          "      center-y 0.4",
          "      radius 0.75",
          "      stop #d8f8ffaa 0",
          "      stop #70c8e833 0.45",
          "      stop #70c8e800 1"
        ].join("\n")
      }
    ]
  };
