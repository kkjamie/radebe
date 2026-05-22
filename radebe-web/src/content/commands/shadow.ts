import type { ExampleDoc } from "../../types.js";

export const shadowDoc: ExampleDoc = {
    id: "shadow",
    title: "Shadow",
    navGroup: "Effect Commands",
    summary:
      "Defines an offset silhouette pass behind supported filled shapes and composited groups, with optional spread and soft blur.",
    args: ["x", "y", "color", "spread", "blur", "alpha"],
    childCommands: ["blur", "fill"],
    notes: [
      "`shadow 2 2 black` is shorthand for `x`, `y`, and an implicit solid fill color.",
      "Supported hosts include rectangle-backed shapes, circle geometry, polygon geometry, and composited groups.",
      "Positive `spread` grows the shadow silhouette outward; negative `spread` shrinks it inward.",
      "`blur` applies a deterministic box blur to the shadow alpha; `blur 0` keeps the hard-edged behavior.",
      "Shadows render behind the source shape or group and preserve authoring order among multiple shadow nodes."
    ],
    examples: [
      {
        id: "shadow-rect-basic",
        title: "Hard Offset Shadow",
        summary: "The common case: a darker offset silhouette sitting behind the base plate.",
        source: [
          "sprite shadow-basic-demo",
          "  size 160 88",
          "  background transparent",
          "",
          "rect 20 16 104 48",
          "  shadow 8 6 #000000 alpha=0.4",
          "  fill solid #18242c",
          "  stroke 1 #70c8e8"
        ].join("\n")
      },
      {
        id: "shadow-spread-grow",
        title: "Positive Spread",
        summary: "Spread can widen the silhouette before the offset is applied, which reads more like a heavier drop shadow.",
        source: [
          "sprite shadow-spread-grow-demo",
          "  size 180 96",
          "  background transparent",
          "",
          "rect 28 20 112 44",
          "  radius 10",
          "  shadow",
          "    x 8",
          "    y 8",
          "    spread 3",
          "    alpha 0.35",
          "    fill solid black",
          "  fill gradient-linear #18242c #243643"
        ].join("\n")
      },
      {
        id: "shadow-soft-blur",
        title: "Soft Blur",
        summary: "Blur softens the spread silhouette while preserving the same source shape and offset semantics.",
        source: [
          "sprite shadow-soft-blur-demo",
          "  size 180 96",
          "  background transparent",
          "",
          "rect 30 20 112 44",
          "  radius 8",
          "  shadow 8 8 #000000 alpha=0.45 spread=2 blur=4",
          "  fill gradient-linear #203040 #2d4a5a",
          "  stroke 1 #70c8e8"
        ].join("\n")
      },
      {
        id: "shadow-spread-shrink",
        title: "Negative Spread",
        summary: "Negative spread tightens the silhouette, which is useful for restrained drop shadows with or without blur.",
        source: [
          "sprite shadow-spread-shrink-demo",
          "  size 208 112",
          "  background transparent",
          "",
          "circle 54 46 22",
          "  shadow",
          "    x 5",
          "    y 6",
          "    spread -2",
          "    alpha 0.45",
          "    fill solid #000000",
          "  fill solid #70c8e8",
          "",
          "polygon 112 20 176 20 188 48 154 78 108 60",
          "  shadow",
          "    x 6",
          "    y 7",
          "    spread -1",
          "    fill solid #000000",
          "  fill solid #ffcc88"
        ].join("\n")
      }
    ]
  };
