import type { ExampleDoc } from "../../types.js";

export const glowDoc: ExampleDoc = {
    id: "glow",
    title: "Glow",
    navGroup: "Effect Commands",
    summary:
      "Defines a colored contour effect on supported shapes and composited groups, with outer and inner modes.",
    properties: [
      "mode: outer or inner",
      "spread: glow thickness before blur",
      "blur: softening radius",
      "alpha: pass opacity"
    ],
    childCommands: ["Fill commands", "Property commands"],
    notes: [
      "`mode` defaults to `outer`; `blur` defaults to `1`.",
      "Use `mode=inner` or a child `mode inner` command to clip the glow inside the source region.",
      "Positive `spread` widens an outer glow or pushes an inner glow farther inward before blur is applied.",
      "Supported hosts include shapes and composited groups."
    ],
    examples: [
      {
        id: "glow-modes",
        title: "Outer And Inner Modes",
        summary:
          "Outer glow expands around the source; inner glow is clipped inside a separate source shape.",
        source: [
          "sprite glow-modes-demo",
          "  size 416 224",
          "  background transparent",
          "  antialias true",
          "",
          "circle 112 112 58",
          "  glow #70c8e8 spread=6 blur=12 alpha=0.65",
          "  fill solid #18242c",
          "",
          "polygon-regular 300 112 6 62",
          "  glow #ffcc88 mode=inner spread=8 blur=10 alpha=0.75",
          "  fill solid #243643"
        ].join("\n")
      }
    ]
  };
