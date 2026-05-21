import type { ExampleDoc } from "../../types.js";

export const spriteDoc: ExampleDoc = {
    id: "sprite",
    title: "Sprite Header",
    navGroup: "Header Commands",
    summary:
      "Defines the file-level sprite identity and holds nested header properties such as size and background.",
    args: ["name", "size width height", "background color", "antialias true|false"],
    childCommands: ["size", "background", "antialias"],
    notes: [
      "The sprite header must be the first root command in the file.",
      "Only one sprite header is allowed per file.",
      "`antialias` defaults to `false` when omitted and acts as the document render default.",
      "Expanded property form can use child commands such as `name panel`."
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
