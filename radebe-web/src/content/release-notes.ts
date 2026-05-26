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
    date: "2026-05-26",
    title: "First formal release",
    notes: [
      "Radebe 0.1.0 is the first formal public release of the authoring toolchain.",
      "The product now ships a usable authoring loop across the web editor, CLI, VS Code language support, and the Unity importer baseline.",
      "The language now supports sprite headers, variables, groups, masks, plot, line, rectangles, circles, polygons, regular and star polygons, paths, fills, strokes, shadows, glow, alpha, and antialiasing.",
      "Tooling includes web authoring, CLI SEA packaging, VS Code language support, and the Unity importer baseline."
    ]
  }
];
