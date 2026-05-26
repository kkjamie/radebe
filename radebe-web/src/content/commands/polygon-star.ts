import type { ExampleDoc, ExamplePlayground } from "../../types.js";
import commandPreviews from "../command-previews.json" with { type: "json" };

type CommandPreviewEntry = {
  id: string;
  preview: string;
  source: string[];
};

function getPreview(id: string): ExamplePlayground["cachedPreview"] {
  const preview = (commandPreviews as CommandPreviewEntry[]).find((entry) => entry.id === id);

  if (!preview) {
    return undefined;
  }

  const sizeMatch = preview.source.join("\n").match(/^\s+size\s+(\d+)\s+(\d+)$/m);
  const width = sizeMatch ? Number.parseInt(sizeMatch[1]!, 10) : 1;
  const height = sizeMatch ? Number.parseInt(sizeMatch[2]!, 10) : 1;

  return {
    height,
    src: preview.preview,
    width
  };
}

export const polygonStarDoc: ExampleDoc = {
    id: "polygon-star",
    title: "Star Polygon",
    navGroup: "Drawable Commands",
    summary:
      "Generates a star polygon around an explicit center point by alternating outer and inner radii.",
    args: ["x", "y", "points", "inner-radius", "outer-radius", "optional color shorthand", "antialias"],
    childCommands: [
      "fill",
      "stroke",
      "shadow",
      "glow",
      "antialias"
    ],
    notes: [
      "`polygon-star <x> <y> <points> <inner-radius> <outer-radius>` creates a star around the provided center.",
      "`points` must be at least `3`; both radii must be at least `1`.",
      "`outer-radius` must be greater than `inner-radius`.",
      "The first outer point is placed at the top, then inner and outer points alternate clockwise.",
      "A trailing color shorthand lowers into an implicit solid fill."
    ],
    examples: [
      {
        id: "polygon-star-basic",
        title: "Points And Radii",
        summary: "`points` sets the outer tips; inner and outer radii set the alternating vertex distances.",
        cachedPreview: getPreview("polygon-star-basic"),
        source: [
          "sprite star-polygon-demo",
          "  size 384 176",
          "  background transparent",
          "  antialias true",
          "",
          "polygon-star 72 88 5 24 64 #ffcc88",
          "polygon-star 192 88 7 22 58 #70c8e8",
          "polygon-star 312 88 8 14 60 #d8f8ff"
        ].join("\n")
      }
    ]
  };
