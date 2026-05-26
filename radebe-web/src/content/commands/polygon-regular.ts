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

export const polygonRegularDoc: ExampleDoc = {
    id: "polygon-regular",
    title: "Regular Polygon",
    navGroup: "Drawable Commands",
    summary:
      "Generates an equal-sided polygon shape drawable around an explicit center point.",
    properties: [
      "x/y: center point",
      "sides: number of polygon sides",
      "radius: distance from center to each vertex",
      "antialias: optional geometry smoothing"
    ],
    childCommands: [
      "Appearance commands",
      "Effect commands",
      "Geometry modifier commands",
      "Property commands"
    ],
    notes: [
      "`sides` must be at least `3`; `radius` must be at least `1`.",
      "The first point is placed at the top, then the remaining points proceed clockwise.",
      "Use explicit `polygon` when individual point positions need manual control."
    ],
    examples: [
      {
        id: "polygon-regular-basic",
        title: "Different Side Counts",
        summary: "Several regular polygons using the same radius and different `sides` values.",
        cachedPreview: getPreview("polygon-regular-basic"),
        source: [
          "sprite regular-polygon-demo",
          "  size 640 192",
          "  background transparent",
          "  antialias true",
          "",
          "polygon-regular 80 96 3 52 #ffcc88",
          "polygon-regular 210 96 4 52 #70c8e8",
          "polygon-regular 340 96 5 52 #d8f8ff",
          "polygon-regular 480 96 8 52 #ff8f70"
        ].join("\n")
      }
    ]
  };
