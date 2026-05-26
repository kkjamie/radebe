import type { ExampleDoc } from "../../types.js";

export const radiusDoc: ExampleDoc = {
  id: "radius",
  title: "Radius",
  navGroup: "Geometry Modifiers",
  summary:
    "Rounds corners on rectangle-backed shapes or vertices on polygon-family shapes.",
  properties: ["amount: uniform rounding size"],
  childCommands: [],
  notes: [
    "Place `radius` under `rect`, `rect-inset`, `polygon`, `polygon-regular`, or `polygon-star`.",
    "The value is uniform across every corner or vertex on the host shape.",
    "A shape cannot use `radius` and `cut` together.",
    "Use `cut` when you need per-corner rectangle variation.",
    "`antialias true` makes rounded edges render with partial alpha instead of stair-step pixels."
  ],
  examples: [
    {
      id: "radius-uniform-hosts",
      title: "Uniform Radius",
      summary: "One value rounds every supported corner or vertex on the host shape.",
      source: [
        "sprite radius-uniform-demo",
        "  size 512 176",
        "  background transparent",
        "  antialias true",
        "",
        "rect 32 44 104 80 #d8f8ff",
        "  radius 22",
        "",
        "polygon-regular 254 86 6 62 #ffcc88",
        "  radius 10",
        "",
        "polygon-star 414 88 5 28 64 #70c8e8",
        "  radius 8"
      ].join("\n")
    },
    {
      id: "radius-rect-amounts",
      title: "Rectangle Radius Amounts",
      summary: "The current radius modifier uses one corner value for the whole rectangle.",
      source: [
        "sprite radius-rect-amounts-demo",
        "  size 512 176",
        "  background transparent",
        "  antialias true",
        "",
        "rect 32 48 104 72 #70c8e8",
        "  radius 8",
        "",
        "rect 204 48 104 72 #ffcc88",
        "  radius 18",
        "",
        "rect 376 48 104 72 #d8f8ff",
        "  radius 34"
      ].join("\n")
    }
  ]
};
