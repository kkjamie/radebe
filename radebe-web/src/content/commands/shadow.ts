import type { ExampleDoc } from "../../types.js";

export const shadowDoc: ExampleDoc = {
    id: "shadow",
    title: "Shadow",
    navGroup: "Effect Commands",
    summary:
      "Defines an offset silhouette pass behind supported filled shapes and composited groups, with optional spread and soft blur.",
    properties: [
      "x/y: shadow offset",
      "spread: grow or shrink the silhouette",
      "blur: softening radius",
      "alpha: pass opacity"
    ],
    childCommands: ["Fill commands", "Property commands"],
    notes: [
      "Supported hosts include shapes and composited groups.",
      "Positive `spread` grows the shadow silhouette outward; negative `spread` shrinks it inward.",
      "`blur 0` keeps the shadow hard-edged.",
      "Shadows render behind the source shape or group and preserve authoring order among multiple shadow nodes."
    ],
    examples: [
      {
        id: "shadow-rect-basic",
        title: "Hard Offset Shadow",
        summary: "A darker offset silhouette sits behind the source shape.",
        source: [
          "sprite shadow-basic-demo",
          "  size 256 144",
          "  background transparent",
          "  antialias true",
          "",
          "rect 38 34 144 72",
          "  shadow 14 12 #000000 alpha=0.4",
          "  fill solid #18242c",
          "  stroke 2 #70c8e8"
        ].join("\n")
      },
      {
        id: "shadow-spread-grow",
        title: "Positive Spread",
        summary: "Positive spread widens the shadow silhouette before the offset is applied.",
        source: [
          "sprite shadow-spread-grow-demo",
          "  size 280 160",
          "  background transparent",
          "  antialias true",
          "",
          "polygon-regular 136 76 6 54",
          "  shadow",
          "    x 12",
          "    y 12",
          "    spread 6",
          "    alpha 0.35",
          "    fill solid black",
          "  fill solid #70c8e8"
        ].join("\n")
      },
      {
        id: "shadow-soft-blur",
        title: "Soft Blur",
        summary: "Blur softens the spread silhouette while preserving the same source shape and offset semantics.",
        source: [
          "sprite shadow-soft-blur-demo",
          "  size 280 160",
          "  background transparent",
          "  antialias true",
          "",
          "circle 128 72 50",
          "  shadow 14 14 #000000 alpha=0.45 spread=4 blur=8",
          "  fill gradient-linear #203040 #2d4a5a",
          "  stroke 2 #70c8e8"
        ].join("\n")
      },
      {
        id: "shadow-spread-shrink",
        title: "Negative Spread",
        summary: "Negative spread tightens the shadow silhouette before the offset is applied.",
        source: [
          "sprite shadow-spread-shrink-demo",
          "  size 416 224",
          "  background transparent",
          "  antialias true",
          "",
          "circle 104 96 54",
          "  shadow",
          "    x 12",
          "    y 14",
          "    spread -6",
          "    blur 5",
          "    alpha 0.45",
          "    fill solid #000000",
          "  fill solid #70c8e8",
          "",
          "polygon 224 56 352 48 376 104 306 164 216 128",
          "  shadow",
          "    x 14",
          "    y 16",
          "    spread -5",
          "    blur 5",
          "    fill solid #000000",
          "  fill solid #ffcc88"
        ].join("\n")
      }
    ]
  };
