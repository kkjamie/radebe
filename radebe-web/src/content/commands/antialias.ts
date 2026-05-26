import type { ExampleDoc } from "../../types.js";

export const antialiasDoc: ExampleDoc = {
    id: "antialias",
    title: "Antialias",
    navGroup: "Property Commands",
    summary:
      "Controls real renderer coverage smoothing for geometry while keeping pixel-perfect output as the default.",
    properties: ["value: true or false"],
    childCommands: [],
    notes: [
      "`antialias` defaults to `false` when omitted.",
      "A sprite-level value becomes the document render default.",
      "Geometry commands can override the sprite default inline or with a child property.",
      "Smoothing is part of the rendered artifact, not just the browser preview."
    ],
    examples: [
      {
        id: "antialias-sprite-default",
        title: "Sprite Default With Override",
        summary:
          "A sprite can opt into smoothing broadly, then a single shape can opt back out when crisp pixels matter.",
        source: [
          "sprite antialias-default-demo",
          "  size 144 64",
          "  background transparent",
          "  antialias true",
          "",
          "# Smooth circle from the sprite default",
          "circle 38 32 20 #70c8e8",
          "",
          "# Crisp circle override",
          "circle 104 32 20 #ffcc88 antialias=false"
        ].join("\n")
      },
      {
        id: "antialias-shape-opt-in",
        title: "Shape Opt-In",
        summary:
          "The default stays pixel-perfect, while curved or diagonal geometry can opt into subpixel coverage.",
        source: [
          "sprite antialias-opt-in-demo",
          "  size 160 72",
          "  background transparent",
          "",
          "circle 40 36 24 #70c8e8",
          "  antialias true",
          "",
          "path sweep antialias=true",
          "  point 88 54",
          "  point 112 18",
          "  point 144 34",
          "  stroke 2 #d8f8ff"
        ].join("\n")
      }
    ]
  };
