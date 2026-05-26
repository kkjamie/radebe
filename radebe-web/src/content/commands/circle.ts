import type { ExampleDoc } from "../../types.js";

export const circleDoc: ExampleDoc = {
    id: "circle",
    title: "Circle",
    navGroup: "Drawable Commands",
    summary:
      "Defines a circular shape drawable from a center point and radius. Circles accept the shared shape fill, stroke, shadow, glow, and antialias controls.",
    properties: [
      "x/y: center point",
      "radius: circle radius in pixels",
      "antialias: optional geometry smoothing"
    ],
    childCommands: ["Appearance commands", "Effect commands", "Property commands"],
    notes: [
      "The center uses integer pixel coordinates.",
      "Circle fill variants reuse the same solid, linear-gradient, and radial-gradient model as rectangles.",
      "`antialias` can smooth circle fill, stroke, shadow, and glow coverage.",
      "Circle strokes use the shared `stroke` command model."
    ],
    examples: [
      {
        id: "circle-basic",
        title: "Solid Circles",
        summary: "A direct constructor next to an expanded form with an explicit fill child.",
        source: [
          "sprite circle-demo",
          "  size 384 192",
          "  background transparent",
          "",
          "# Constructor solid circle",
          "circle 80 96 40 #d8f8ff",
          "",
          "# Expanded property form with explicit fill",
          "circle",
          "  x 256",
          "  y 96",
          "  radius 48",
          "  fill solid #70c8e8"
        ].join("\n")
      }
    ]
  };
