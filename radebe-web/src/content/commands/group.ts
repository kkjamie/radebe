import type { ExampleDoc } from "../../types.js";

export const groupDoc: ExampleDoc = {
    id: "group",
    title: "Group",
    navGroup: "Structural Containers",
    summary:
      "Collects drawing commands into an ordered structure that can stay transparent or receive composited appearance passes.",
    args: ["optional name"],
    childCommands: [
      "plot",
      "line",
      "rect",
      "rect-absolute",
      "rect-inset",
      "circle",
      "polygon",
      "path",
      "group",
      "mask",
      "name",
      "fill",
      "shadow",
      "glow",
      "stroke"
    ],
    notes: [
      "`group` is transparent until it has a group-level `fill`, `shadow`, `glow`, or `stroke` child.",
      "With group-level passes, children render into an offscreen layer first; the combined alpha becomes the group drawable.",
      "Group-level `shadow` and outer `glow` draw behind the composited children, `fill` overlays the combined child alpha, inner `glow` clips inside it, and `stroke` follows the combined child contour.",
      "Child draw commands and nested groups must come before group-level appearance or effect passes.",
      "An optional group name is accepted for authoring clarity and diagnostics.",
      "Group alpha, blend, filters, and transforms are not supported."
    ],
    examples: [
      {
        id: "group-panel-parts",
        title: "Panel Parts",
        summary:
          "A named group keeps related panel geometry together while the renderer still draws each child normally.",
        source: [
          "sprite group-panel-demo",
          "  size 128 56",
          "  background transparent",
          "",
          "group frame",
          "  rect-inset 6 #101820",
          "    cut 8",
          "    stroke 2 #70c8e8",
          "",
          "group highlights",
          "  line 20 14 108 14 #d8f8ff",
          "  line 26 42 102 42 #70c8e8",
          "  circle 64 28 4 #d8f8ff"
        ].join("\n")
      },
      {
        id: "group-nested-order",
        title: "Nested Order",
        summary:
          "Nested transparent groups render at their source position, so later children can draw over earlier ones.",
        source: [
          "sprite group-order-demo",
          "  size 96 48",
          "  background transparent",
          "",
          "group base",
          "  rect 12 10 72 28 #18242c",
          "    radius 6",
          "    stroke 2 #70c8e8",
          "  group lights",
          "    plot 24 20 white",
          "    plot 72 20 white",
          "",
          "line 18 34 78 34 #ffcc88"
        ].join("\n")
      },
      {
        id: "group-composited-passes",
        title: "Composited Passes",
        summary:
          "A group-level fill, shadow, glow, or stroke applies to the rasterized child layer rather than becoming a default for each child.",
        source: [
          "sprite group-pass-demo",
          "  size 112 64",
          "  background transparent",
          "",
          "group badge",
          "  rect 18 16 44 28 #101820",
          "    radius 6",
          "  circle 62 30 14 #d8f8ff",
          "  shadow 3 3 black alpha=0.35 spread=1",
          "  glow #70c8e8 blur=4 alpha=0.5",
          "  fill solid #70c8e8 alpha=0.32",
          "  stroke 2 white alpha=0.85"
        ].join("\n")
      }
    ]
  };
