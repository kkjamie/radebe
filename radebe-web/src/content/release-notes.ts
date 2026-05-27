import { productVersion } from "./version.js";

export type ProductReleaseNote = {
  date: string;
  notes: string[];
  title: string;
  version: string;
};

export const productReleaseNotes: ProductReleaseNote[] = [
  {
    version: productVersion,
    date: "2026-05-27",
    title: "First public web release",
    notes: [
      "Radebe 0.1.0 is the first public release of the browser-based authoring experience.",
      "The site now ships a usable web editor, live preview, command reference, syntax guide, examples, roadmap, and product release notes.",
      "The language now supports sprite headers, variables, groups, masks, plot, line, rectangles, circles, polygons, regular and star polygons, paths, fills, strokes, shadows, glow, alpha, and antialiasing.",
      "Downloadable CLI, VS Code, and Unity packages are not part of this public web-only release."
    ]
  }
];
