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
      "Supported hosts include rectangle-backed shapes, circle geometry, polygon geometry, and composited groups."
    ],
    examples: [
      {
        id: "glow-panel",
        title: "Outer And Inner",
        summary:
          "Outer glow radiates around the panel while inner glow is clipped to the panel silhouette.",
        source: [
          "sprite glow-panel-demo",
          "  size 180 96",
          "  background transparent",
          "",
          "rect 28 22 124 48",
          "  radius 10",
          "  glow #70c8e8 spread=2 blur=5 alpha=0.7",
          "  fill gradient-linear #18242c #243643",
          "  glow #d8f8ff mode=inner spread=1 blur=4 alpha=0.5",
          "  stroke 1 #d8f8ff"
        ].join("\n")
      },
      {
        id: "glow-circle-inner",
        title: "Inner Indicator",
        summary:
          "A compact inner glow can make circular indicators read as lit without adding extra geometry.",
        source: [
          "sprite glow-indicator-demo",
          "  size 112 72",
          "  background transparent",
          "",
          "circle 36 36 22 #101820",
          "  glow #ffcc88 mode=inner spread=2 blur=5 alpha=0.8",
          "  stroke 1 #ffcc88",
          "",
          "circle 76 36 16 #18242c",
          "  glow #70c8e8 blur=4 alpha=0.7",
          "  fill gradient-radial #d8f8ff #70c8e8"
        ].join("\n")
      },
      {
        id: "glow-group",
        title: "Composited Group Glow",
        summary:
          "Group glow follows the combined child alpha instead of applying separately to each child.",
        source: [
          "sprite glow-group-demo",
          "  size 136 80",
          "  background transparent",
          "",
          "group badge",
          "  rect 26 22 52 32 #101820",
          "    radius 7",
          "  circle 78 38 16 #d8f8ff",
          "  glow #70c8e8 spread=1 blur=5 alpha=0.7",
          "  fill solid #70c8e8 alpha=0.24",
          "  stroke 2 white alpha=0.85"
        ].join("\n")
      }
    ]
  };
