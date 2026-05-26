import type { ExampleDoc } from "../../types.js";

export const strokeDoc: ExampleDoc = {
  id: "stroke",
  title: "Stroke",
  navGroup: "Appearance Commands",
  summary:
    "Defines a generated stroked region around a supported shape, path, group layer, or nested stroke envelope. Strokes can be solid, dashed, or dotted and are painted through the fill model.",
  properties: [
    "width: stroke thickness",
    "align: inside, center, or outside",
    "style: solid, dashed, or dotted",
    "dash/gap/dot: style spacing controls"
  ],
  childCommands: ["Fill commands", "Nested stroke commands", "Property commands"],
  notes: [
    "Supported hosts include shapes, paths, composited groups, and nested stroke envelopes.",
    "Supported align values are `inside`, `center`, and `outside`.",
    "Supported style values are `solid`, `dashed`, and `dotted`.",
    "Nested outside strokes can build separate rings around the previous stroke envelope."
  ],
  examples: [
    {
      id: "stroke-shape-showcase",
      title: "All Supported Shapes",
      summary: "One sprite showing the supported stroked shape hosts.",
      source: [
        "sprite stroke-shape-showcase",
        "  size 568 192",
        "  background transparent",
        "  antialias true",
        "",
        "rect 24 58 80 60 #18242c",
        "  stroke 2 #d8f8ff",
        "",
        "circle 172 88 34 #18242c",
        "  stroke 2 white",
        "",
        "polygon 252 48 332 58 318 126 238 118 #18242c",
        "  stroke 2 #ff8f70",
        "",
        "polygon-regular 414 88 6 44 #18242c",
        "  stroke 2 #70c8e8",
        "",
        "polygon-star 516 88 5 18 44 #18242c",
        "  stroke 2 #ffcc88"
      ].join("\n")
    },
    {
      id: "stroke-solid-basic",
      title: "Solid Stroke",
      summary: "The compact common case using the stroke constructor.",
      source: [
        "sprite stroke-solid-demo",
        "  size 96 48",
        "  background transparent",
        "",
        "rect-inset 10",
        "  stroke 2 white"
      ].join("\n")
    },
    {
      id: "stroke-alignments",
      title: "Alignment",
      summary: "Three identical source rectangles show how `inside`, `center`, and `outside` place stroke thickness.",
      source: [
        "sprite stroke-align-demo",
        "  size 420 152",
        "  background transparent",
        "  antialias true",
        "",
        "rect 42 44 72 56 #18242c",
        "  stroke width=10 color=#70c8e8 align=inside",
        "",
        "rect 174 44 72 56 #18242c",
        "  stroke width=10 color=#ffcc88 align=center",
        "",
        "rect 306 44 72 56 #18242c",
        "  stroke width=10 color=#d8f8ff align=outside"
      ].join("\n")
    },
    {
      id: "stroke-gradient-fill",
      title: "Gradient-Filled Stroke",
      summary: "The stroke region can use the same fill model as a rectangle, including gradients.",
      source: [
        "sprite stroke-gradient-demo",
        "  size 160 72",
        "  background transparent",
        "",
        "rect-inset 12 #14191f",
        "  stroke",
        "    width 4",
        "    align center",
        "    fill",
        "      gradient-linear",
        "        angle 15",
        "        stop #d8f8ff 0",
        "        stop #70c8e8 0.45",
        "        stop #365266 1"
      ].join("\n")
    },
    {
      id: "stroke-dashed",
      title: "Dashed And Dotted",
      summary: "Style values tune the cadence of rectangle-backed strokes.",
      source: [
        "sprite stroke-style-demo",
        "  size 160 72",
        "  background transparent",
        "",
        "rect-inset 10",
        "  stroke width=2 color=#d8f8ff style=dashed dash-length=10 gap-length=6",
        "",
        "rect-inset 22",
        "  stroke",
        "    width 2",
        "    style dotted",
        "    dot-spacing 4",
        "    fill solid #70c8e8"
      ].join("\n")
    },
    {
      id: "stroke-path-style",
      title: "Path Stroke Style",
      summary: "Open paths use the same stroke style controls, with `align center`.",
      source: [
        "sprite stroke-path-style-demo",
        "  size 360 192",
        "  background transparent",
        "  antialias true",
        "",
        "path route",
        "  point 36 144",
        "  point 98 58",
        "  point 176 76",
        "  point 252 34",
        "  point 318 104",
        "  stroke width=5 color=#ffcc88 style=dashed dash-length=14 gap-length=6"
      ].join("\n")
    },
    {
      id: "stroke-nested",
      title: "Nested Stroke",
      summary: "Nested outside strokes build several same-width rings around one generated stroke envelope.",
      source: [
        "sprite stroke-nested-demo",
        "  size 224 224",
        "  background transparent",
        "  antialias true",
        "",
        "polygon-star 112 112 5 34 82 #18242c",
        "  stroke width=5 color=#ffcc88 align=outside",
        "    stroke width=5 color=#70c8e8 align=outside",
        "      stroke width=5 color=white align=outside"
      ].join("\n")
    }
  ]
};
