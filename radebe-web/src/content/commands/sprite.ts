import type { ExampleDoc } from "../../types.js";

export const spriteDoc: ExampleDoc = {
    id: "sprite",
    title: "Sprite Header",
    navGroup: "Header Commands",
    summary:
      "Defines the file-level sprite identity and holds nested header properties such as size and background.",
    properties: [
      "name: optional sprite identifier",
      "size: output width and height",
      "background: output background color",
      "antialias: default smoothing for drawable geometry"
    ],
    childCommands: ["Header property commands"],
    notes: [
      "The sprite header must be the first root command in the file.",
      "Only one sprite header is allowed per file.",
      "Header properties can be written inline or as child commands.",
      "`antialias` defaults to `false` so output stays pixel-perfect unless you opt in."
    ],
    examples: [
      {
        id: "sprite-basic",
        title: "Basic Header",
        summary: "A minimal sprite header followed by one rectangle draw command.",
        source: [
          "sprite",
          "  name command-header-demo",
          "  size 64 32",
          "  background #0f1318",
          "  antialias false",
          "",
          "# A simple panel to confirm the header values are active",
          "rect 6 6 52 20 #1c2a33"
        ].join("\n")
      }
    ]
  };
