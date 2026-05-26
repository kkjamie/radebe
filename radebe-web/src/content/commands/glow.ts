import type { ExampleDoc } from "../../types.js";

export const glowDoc: ExampleDoc = {
    id: "glow",
    title: "Glow",
    navGroup: "Effect Commands",
    summary:
      "Defines a colored contour effect on supported shapes and composited groups, with outer and inner modes.",
    args: ["color", "mode", "spread", "blur", "alpha"],
    childCommands: ["mode", "spread", "blur", "fill"],
    notes: [
      "`glow #70c8e8` creates an outer glow using the color shorthand and a default `blur` of `1`.",
      "`mode` defaults to `outer`; use `mode=inner` or a child `mode inner` command to clip the glow inside the source region.",
      "Outer glow uses the same deterministic box-blur alpha sampling as soft shadows, but clips the source interior out of the glow coverage.",
      "Positive `spread` widens an outer glow or pushes an inner glow farther inward before blur is applied.",
      "Supported hosts include rectangle-backed shapes, circle geometry, polygon geometry including generated regular/star polygons, and composited groups."
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
