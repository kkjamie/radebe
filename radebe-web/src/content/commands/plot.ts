import type { ExampleDoc } from "../../types.js";

export const plotDoc: ExampleDoc = {
    id: "plot",
    title: "Plot",
    navGroup: "Drawable Commands",
    summary: "Draws one pixel at the given coordinates using the provided color.",
    properties: [
      "x: horizontal pixel coordinate",
      "y: vertical pixel coordinate",
      "color: pixel color"
    ],
    childCommands: [],
    notes: [
      "Coordinates use the top-left of the sprite as the origin."
    ],
    examples: [
      {
        id: "plot-forms",
        title: "Equivalent Syntax Forms",
        summary: "The same command expressed with constructor, named, and child-property arguments.",
        source: [
          "sprite plot-demo",
          "  size 24 10",
          "  background transparent",
          "",
          "# Constructor form",
          "plot 4 2 #d8f8ff",
          "",
          "# Named inline properties",
          "plot x=10 y=2 color=#70c8e8",
          "",
          "# Child-property form",
          "plot",
          "  x 16",
          "  y 2",
          "  color white"
        ].join("\n")
      }
    ]
  };
