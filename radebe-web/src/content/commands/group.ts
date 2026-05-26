import type { ExampleDoc } from "../../types.js";

export const groupDoc: ExampleDoc = {
    id: "group",
    title: "Group",
    navGroup: "Structural Containers",
    summary:
      "Collects drawing commands into an ordered structure that can stay transparent or receive composited appearance passes.",
    properties: ["name: optional group label"],
    childCommands: [
      "Drawable commands",
      "Structural containers",
      "Appearance commands",
      "Effect commands",
      "Property commands"
    ],
    notes: [
      "`group` is transparent until it has a group-level `fill`, `shadow`, `glow`, or `stroke` child.",
      "With group-level passes, the combined child alpha becomes the group drawable.",
      "Group-level `shadow` and outer `glow` draw behind the composited children, `fill` overlays the combined child alpha, inner `glow` clips inside it, and `stroke` follows the combined child contour.",
      "Child draw commands and nested groups must come before group-level appearance or effect passes.",
      "Use a group name when it makes larger sources easier to scan."
    ],
    examples: [
      {
        id: "group-composited-stroke",
        title: "Composited Stroke",
        summary:
          "A group-level stroke follows the combined alpha of overlapping child shapes.",
        source: [
          "sprite group-stroke-demo",
          "  size 416 176",
          "  background transparent",
          "  antialias true",
          "",
          "group badge",
          "  rect 84 52 124 72 #18242c",
          "  circle 218 88 48 #70c8e8",
          "  stroke 5 white"
        ].join("\n")
      },
      {
        id: "group-unified-fill",
        title: "Unified Fill",
        summary:
          "A group-level fill paints the combined child silhouette as one surface.",
        source: [
          "sprite group-fill-demo",
          "  size 416 176",
          "  background transparent",
          "  antialias true",
          "",
          "group badge",
          "  rect 84 52 124 72 #101820",
          "  circle 218 88 48 #243643",
          "  fill solid #70c8e8 alpha=0.55",
          "  stroke 4 #d8f8ff"
        ].join("\n")
      }
    ]
  };
