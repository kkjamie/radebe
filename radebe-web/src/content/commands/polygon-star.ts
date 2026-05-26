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
      "Generates a star polygon around an explicit center point by alternating outer and inner radii. It behaves like a polygon shape drawable for fills, strokes, shadows, glow, antialiasing, and uniform vertex `cut` or `radius` modifiers.",
    args: ["x", "y", "points", "inner-radius", "outer-radius", "optional color shorthand", "antialias"],
    childCommands: [
      "cut",
      "radius",
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
      "`cut` and `radius` modify every star vertex uniformly, including the inner corners.",
      'A star currently cannot use both `cut` and `radius` at the same time.',
      "The first outer point is placed at the top, then inner and outer points alternate clockwise.",
      "A trailing color shorthand lowers into an implicit solid fill."
    ],
    examples: [
      {
        id: "polygon-star-basic",
        title: "Prize Star",
        summary: "A five-point star with a warm fill, stroke, shadow, and glow.",
        cachedPreview: getPreview("polygon-star-basic"),
        source: [
          "sprite star-polygon-demo",
          "  size 96 96",
          "  background transparent",
          "  antialias true",
          "",
          "polygon-star 48 48 5 16 38",
          "  shadow 0 4 #9f5a16 alpha=0.35 blur=3",
          "  fill gradient-radial #fff8d8 #ffb02e",
          "  stroke 3 #9f5a16 alpha=0.7",
          "  glow #ffd766 blur=4 alpha=0.45"
        ].join("\n")
      },
      {
        id: "polygon-star-many-points",
        title: "Spark",
        summary: "More points and tighter radii produce a bright sparkle-style shape.",
        cachedPreview: getPreview("polygon-star-many-points"),
        source: [
          "sprite star-spark-demo",
          "  size 96 96",
          "  background transparent",
          "  antialias true",
          "",
          "polygon-star 48 48 8 10 36 #d8f8ff",
          "  stroke 2 #70c8e8",
          "  glow #70c8e8 blur=5 alpha=0.55"
        ].join("\n")
      },
      {
        id: "polygon-star-radius",
        title: "Rounded Star",
        summary: "A uniform `radius` softens both the outer tips and inner star notches.",
        cachedPreview: getPreview("polygon-star-radius"),
        source: [
          "sprite star-rounded-demo",
          "  size 96 96",
          "  background transparent",
          "  antialias true",
          "",
          "polygon-star 48 48 5 14 34",
          "  radius 4",
          "  fill gradient-radial #fff8d8 #ffb02e",
          "  stroke 2 #9f5a16 alpha=0.7"
        ].join("\n")
      }
    ]
  };
