import type { ExampleDoc } from "../../types.js";

export const plotDoc: ExampleDoc = {
    id: "plot",
    title: "Plot",
    navGroup: "Drawable Commands",
    summary: "Draws one pixel at the given coordinates using the provided color.",
    args: ["x", "y", "color"],
    childCommands: [],
    notes: [
      "Supports positional, named, and child-property forms.",
      "Coordinates are integer pixel locations with origin at the top-left."
    ],
    examples: [
      {
        id: "plot-forms",
        title: "Equivalent Syntax Forms",
        summary: "The same command expressed with positional, named, and child-property arguments.",
        source: [
          "sprite plot-demo",
          "  size 24 10",
          "  background transparent",
          "",
          "# Positional shorthand",
          "plot 4 2 #d8f8ff",
          "",
          "# Named inline args",
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
