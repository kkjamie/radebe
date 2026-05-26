import type { ExampleDoc } from "../../types.js";

export const varsDoc: ExampleDoc = {
    id: "vars",
    title: "Vars",
    navGroup: "Declarations",
    summary:
      "Defines reusable file-scoped values for later commands. Use root `var` declarations for small files or a `vars` block when grouping makes the source easier to scan.",
    args: ["var name value", "$name usage"],
    childCommands: ["vars", "var"],
    notes: [
      "`var` is the semantic declaration command and can appear at the file root after the sprite header.",
      "`vars` is an optional grouping command that accepts `var` children.",
      "Variables must be defined before they are used.",
      "A variable reference must occupy a whole value token such as `$accent`; embedded expressions are not supported."
    ],
    examples: [
      {
        id: "vars-root",
        title: "Root Variables",
        summary: "Small files can keep declarations directly at root before the commands that use them.",
        source: [
          "sprite vars-root-demo",
          "  size 96 40",
          "  background transparent",
          "",
          "var pad 6",
          "var panel-fill #101820",
          "var accent #70c8e8",
          "var glow #d8f8ff",
          "",
          "rect-inset $pad $panel-fill",
          "  stroke 2 $accent",
          "",
          "line 16 28 80 28 $glow"
        ].join("\n")
      },
      {
        id: "vars-group",
        title: "Grouped Variables",
        summary: "A `vars` block keeps larger token sets together without changing how references work.",
        source: [
          "sprite vars-group-demo",
          "  size 120 56",
          "  background transparent",
          "",
          "vars",
          "  var inset 8",
          "  var stroke-size 2",
          "  var frame #d8f8ff",
          "  var fill-color #18242c",
          "",
          "rect-inset $inset $fill-color",
          "  stroke $stroke-size $frame"
        ].join("\n")
      }
    ]
  };
