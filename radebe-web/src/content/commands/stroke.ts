import type { ExampleDoc } from "../../types.js";

export const strokeDoc: ExampleDoc = {
    id: "stroke",
    title: "Stroke",
    navGroup: "Appearance Commands",
    summary:
      "Defines a generated stroked region around a supported shape, path, group layer, or nested stroke envelope. Strokes can be solid, dashed, or dotted and are painted through the fill model.",
    args: ["width", "color", "align", "style", "dash-length", "gap-length", "dot-spacing"],
    childCommands: ["fill"],
    notes: [
        "`stroke 2 white` is shorthand for width plus an implicit solid fill color.",
        "Supported hosts include rectangle-backed shapes, circle geometry, polygon geometry, paths, composited groups, and nested stroke envelopes.",
        "Supported align values are `inside`, `center`, and `outside`.",
        "Supported style values are `solid`, `dashed`, and `dotted`.",
        "Nested `stroke` attaches another outline to the generated stroke envelope."
      ],
    examples: [
      {
        id: "stroke-shape-showcase",
        title: "All Supported Shapes",
        summary: "One sprite showing supported stroked shape types: plain rectangle, cut rectangle, rounded rectangle, circle, and polygon.",
        source: [
          "sprite stroke-shape-showcase",
          "  size 568 264",
          "  background transparent",
          "",
          "# Plain rectangle",
          "rect 24 36 80 60 #18242c",
          "  stroke 2 #d8f8ff",
          "",
          "# Cut rectangle",
          "rect 132 36 80 60 #18242c",
          "  cut 14",
          "  stroke 2 #ffcc88",
          "",
          "# Rounded rectangle",
          "rect 240 36 80 60 #18242c",
          "  radius 14",
          "  stroke 2 #70c8e8",
          "",
          "# Circle",
          "circle 388 66 30 #18242c",
          "  stroke 2 white",
          "",
          "# Polygon",
          "polygon 456 36 528 36 540 66 494 96 452 78 #18242c",
          "  stroke 2 #ff8f70"
        ].join("\n")
      },
      {
        id: "stroke-solid-basic",
        title: "Solid Stroke",
        summary: "The compact common case using width and color shorthand.",
        source: [
          "sprite stroke-solid-demo",
          "  size 96 48",
          "  background transparent",
          "",
          "# A simple centered white frame",
          "rect-inset 10",
          "  stroke 2 white"
        ].join("\n")
      },
        {
          id: "stroke-align-inside",
          title: "Inside Alignment",
          summary: "Shows how alignment changes where the stroke thickness sits relative to the base rectangle.",
        source: [
          "sprite stroke-align-demo",
          "  size 96 48",
          "  background transparent",
          "",
          "# Stroke stays entirely inside the generated rectangle",
          "rect-inset 8",
          "  stroke",
          "    width 4",
          "    align inside",
            "    fill solid #70c8e8"
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
            "# Gradient-filled border around a darker inner plate",
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
          summary: "Style values can tune the cadence of rectangle-backed strokes.",
        source: [
          "sprite stroke-style-demo",
          "  size 160 72",
          "  background transparent",
          "",
          "# Dashed outer frame",
          "rect-inset 10",
          "  stroke width=2 color=#d8f8ff style=dashed dash-length=10 gap-length=6",
          "",
          "# Dotted inner frame",
          "rect-inset 22",
          "  stroke",
          "    width 2",
            "    style dotted",
            "    dot-spacing 4",
            "    fill solid #70c8e8"
          ].join("\n")
        },
        {
          id: "stroke-outside",
          title: "Outside Alignment",
          summary: "An outside stroke can grow beyond the base rectangle while keeping the interior untouched.",
          source: [
            "sprite stroke-outside-demo",
            "  size 128 64",
            "  background transparent",
            "",
            "# Base plate stays compact while the frame expands outward",
            "rect-inset 18 #18242c",
            "  stroke",
            "    width 3",
            "    align outside",
            "    fill solid #d8f8ff"
          ].join("\n")
        },
        {
          id: "stroke-nested",
          title: "Nested Stroke",
          summary: "A stroke can own another stroke so double-outline treatments stay inside the same appearance model.",
          source: [
            "sprite stroke-nested-demo",
            "  size 128 64",
            "  background transparent",
            "",
            "# Outer cyan frame with a nested white inner edge",
            "rect-inset 12",
            "  stroke 3 #70c8e8",
            "    stroke 1 white"
          ].join("\n")
        }
      ]
    };
