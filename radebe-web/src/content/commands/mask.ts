import type { ExampleDoc } from "../../types.js";

export const maskDoc: ExampleDoc = {
    id: "mask",
    title: "Mask",
    navGroup: "Structural Containers",
    summary:
      "Clips arbitrary child drawing using an explicit mask shape rather than implicit shape coverage.",
    args: ["optional name", "invert=true|false", "show=masked-content|shape-only|content-only"],
    childCommands: ["shape", "contents", "name", "invert", "show"],
    notes: [
      "`shape` defines the clipping coverage and must come before `contents`.",
      "Shape drawables inside `shape` get implicit coverage, so a mask shape can use `rect`, `circle`, `polygon`, `polygon-regular`, or `polygon-star` without adding a visible fill color.",
      "`contents` contains the drawables clipped by the mask shape.",
      "`invert=true` keeps content outside the mask shape instead of inside it.",
      "`show` defaults to `masked-content`; use `show=shape-only` or `show=content-only` to debug either side of the mask without changing child source.",
      "Mask composition modes such as add, intersect, subtract, and replace are not supported."
    ],
    examples: [
      {
        id: "mask-window",
        title: "Window Clip",
        summary:
          "A gradient fill renders only where it passes through the panel-shaped mask.",
        source: [
          "sprite mask-window-demo",
          "  size 128 56",
          "  background transparent",
          "",
          "mask panel-window",
          "  shape",
          "    rect-inset 8",
          "  contents",
          "    rect-inset 0",
          "      fill gradient-linear #18242c #70c8e8"
        ].join("\n")
      },
      {
        id: "mask-invert",
        title: "Inverted Cutout",
        summary:
          "An inverted mask excludes the circle area so the overlay surrounds the indicator instead of covering it.",
        source: [
          "sprite mask-invert-demo",
          "  size 256 144",
          "  background transparent",
          "  antialias true",
          "",
          "mask ring-clear invert=true",
          "  shape",
          "    circle 128 72 34",
          "  contents",
          "    rect-inset 20",
          "      fill solid #70c8e8 alpha=0.48"
        ].join("\n")
      },
      {
        id: "mask-combined-shape",
        title: "Combined Shape Coverage",
        summary:
          "Multiple drawables inside `shape` combine into one mask coverage layer.",
        source: [
          "sprite mask-combined-shape-demo",
          "  size 320 168",
          "  background transparent",
          "  antialias true",
          "",
          "mask joined-shape",
          "  shape",
          "    circle 104 84 46",
          "    rect 104 44 92 80",
          "    circle 196 84 34",
          "  contents",
          "    rect-inset 0",
          "      fill gradient-linear #ffcc88 #70c8e8"
        ].join("\n")
      },
      {
        id: "mask-debug-show",
        title: "Debug Show",
        summary:
          "The show option can preview either the mask shape or the unclipped contents while tuning coverage.",
        source: [
          "sprite mask-debug-demo",
          "  size 128 56",
          "  background transparent",
          "",
          "mask debug-shape show=shape-only",
          "  shape",
          "    rect 10 10 44 36",
          "  contents",
          "    rect 0 0 64 56 #70c8e8",
          "",
          "mask debug-content show=content-only",
          "  shape",
          "    circle 96 28 14",
          "  contents",
          "    rect 72 12 48 32 #ffcc88"
        ].join("\n")
      }
    ]
  };
