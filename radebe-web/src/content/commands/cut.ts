import type { ExampleDoc } from "../../types.js";

export const cutDoc: ExampleDoc = {
  id: "cut",
  title: "Cut",
  navGroup: "Geometry Modifiers",
  summary:
    "Chamfers corners on rectangle-backed shapes or vertices on polygon-family shapes.",
  args: ["amount", "top-left top-right bottom-right bottom-left"],
  childCommands: ["top-left", "top-right", "bottom-right", "bottom-left"],
  notes: [
    "Place `cut` under `rect`, `rect-inset`, `polygon`, `polygon-regular`, or `polygon-star`.",
    "Rectangles accept one value, four clockwise values, or named corner children.",
    "Polygon-family shapes use one uniform value for every vertex.",
    "A shape cannot use `cut` and `radius` together."
  ],
  examples: [
    {
      id: "cut-uniform-hosts",
      title: "Uniform Cut",
      summary: "One value chamfers every supported corner or vertex on the host shape.",
      source: [
        "sprite cut-uniform-demo",
        "  size 512 176",
        "  background transparent",
        "  antialias true",
        "",
        "rect 32 44 104 80 #d8f8ff",
        "  cut 18",
        "",
        "polygon-regular 254 86 6 62 #ffcc88",
        "  cut 10",
        "",
        "polygon-star 414 88 5 28 64 #70c8e8",
        "  cut 8"
      ].join("\n")
    },
    {
      id: "cut-rect-forms",
      title: "Rectangle Corner Forms",
      summary: "Rectangle cuts can use clockwise shorthand or expanded named corner children.",
      source: [
        "sprite cut-rect-forms-demo",
        "  size 416 176",
        "  background transparent",
        "  antialias true",
        "",
        "rect 32 44 128 80 #70c8e8",
        "  cut 6 18 28 12",
        "",
        "rect 240 44 128 80 #ffcc88",
        "  cut",
        "    top-left 6",
        "    top-right 18",
        "    bottom-right 28",
        "    bottom-left 12"
      ].join("\n")
    }
  ]
};
