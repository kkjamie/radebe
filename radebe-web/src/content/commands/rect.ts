import type { ExampleDoc } from "../../types.js";

export const rectDoc: ExampleDoc = {
    id: "rect",
    title: "Rect / Rect-Absolute",
    navGroup: "Drawable Commands",
    summary:
      "Defines an explicit rectangle using x, y, width, and height. `rect` is a convenience alias for `rect-absolute`, and rectangle-backed shapes can also take geometry modifiers such as `cut` and `radius`.",
    args: ["x", "y", "width", "height", "color shorthand", "fill", "antialias"],
    childCommands: ["fill", "stroke", "cut", "radius", "antialias"],
    notes: [
      "`rect` and `rect-absolute` compile to the same rectangle draw command.",
      "Width and height must be positive integers.",
      "Direct color shorthand lowers into an implicit solid fill.",
      "`cut` and `radius` are geometry modifiers on the same base rectangle model.",
      'A rectangle currently cannot use both `cut` and `radius` at the same time.',
      "`antialias` is most visible on cut and rounded rectangle contours; plain integer-aligned rectangles remain crisp.",
      "Rectangle-backed strokes now follow cut and rounded contours instead of the plain rectangle envelope."
    ],
    examples: [
      {
        id: "rect-basic",
        title: "Alias And Expanded Form",
        summary: "Shows `rect-absolute` shorthand next to an expanded `rect` with explicit fill.",
        source: [
          "sprite rect-demo",
          "  size 80 36",
          "  background transparent",
          "",
          "# Direct color shorthand",
          "rect-absolute 4 4 24 12 #18242c",
          "",
          "# Expanded property form with explicit fill",
          "rect",
          "  x 40",
          "  y 8",
          "  width 28",
          "  height 16",
          "  fill solid #70c8e8"
        ].join("\n")
      },
      {
        id: "rect-radius",
        title: "Rounded Corners With Radius",
        summary: "Rounded corners now come from a `radius` child on the base rectangle rather than a separate shape command.",
        source: [
          "sprite rect-radius-demo",
          "  size 128 64",
          "  background transparent",
          "",
          "# Rounded plate using a radius modifier on rect",
          "rect 16 12 96 40 #18242c",
          "  radius 8"
        ].join("\n")
      },
      {
        id: "rect-cut-uniform",
        title: "Uniform Cut",
        summary: "A single cut value creates the same chamfer size on every corner.",
        source: [
          "sprite cut-uniform-demo",
          "  size 128 64",
          "  background transparent",
          "",
          "# Uniform chamfered panel",
          "rect 16 12 96 40 #18242c",
          "  cut 8"
        ].join("\n")
      },
      {
        id: "rect-cut-four-values",
        title: "Four-Value Cut Shorthand",
        summary: "Each corner can be specified inline in clockwise order when asymmetry is useful.",
        source: [
          "sprite cut-four-demo",
          "  size 128 64",
          "  background transparent",
          "",
          "# Small top corners with larger lower corners",
          "rect 16 12 96 40 #18242c",
          "  cut 4 4 10 10"
        ].join("\n")
      },
      {
        id: "rect-cut-expanded",
        title: "Expanded Named Cut Form",
        summary: "The expanded form names each corner directly and reads clearly in larger files.",
        source: [
          "sprite cut-expanded-demo",
          "  size 128 64",
          "  background transparent",
          "",
          "# Named corner cuts for a more directional panel shape",
          "rect 16 12 96 40 #18242c",
          "  cut",
          "    top-left 4",
          "    top-right 8",
          "    bottom-right 12",
          "    bottom-left 8"
        ].join("\n")
      },
      {
        id: "rect-contour-stroke",
        title: "Contour-Aware Stroke",
        summary: "Stroke now follows the modified rectangle silhouette instead of ignoring cut and radius.",
        source: [
          "sprite rect-stroke-contour-demo",
          "  size 128 72",
          "  background transparent",
          "",
          "# Rounded plate with a matching outline",
          "rect 14 14 44 44 #18242c",
          "  radius 8",
          "  stroke 2 #d8f8ff",
          "",
          "# Chamfered plate with a contour-aware warning ring",
          "rect 70 14 44 44 #18242c",
          "  cut 6",
          "  stroke",
          "    width 2",
          "    fill solid #ffcc88"
        ].join("\n")
      }
    ]
  };
