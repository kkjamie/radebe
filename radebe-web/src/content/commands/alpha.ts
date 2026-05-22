import type { ExampleDoc } from "../../types.js";

export const alphaDoc: ExampleDoc = {
    id: "alpha",
    title: "Alpha",
    navGroup: "Property Commands",
    summary:
      "Defines explicit opacity on `fill` and `stroke` appearance passes without introducing implicit child inheritance.",
    args: ["value 0..1"],
    childCommands: [],
    notes: [
      "`alpha` applies to `fill` and `stroke` appearance passes.",
      "`alpha` defaults to `1` when omitted.",
      "Nested child strokes do not inherit parent stroke alpha automatically.",
      "Pass alpha multiplies with any alpha already present in solid colors or gradient stop colors."
    ],
    examples: [
      {
        id: "alpha-fill-gradient",
        title: "Fill Alpha With Gradient Stops",
        summary:
          "A fill-level alpha scales the whole gradient while still preserving per-stop transparency differences.",
        source: [
          "sprite alpha-fill-demo",
          "  size 128 48",
          "  background transparent",
          "",
          "rect 12 10 104 28 #ff0044",
          "  fill alpha=0.5",
          "    gradient-linear",
          "      stop #00ff0000 0",
          "      stop #0000ff80 1"
        ].join("\n")
      },
      {
        id: "alpha-stroke-explicit",
        title: "Explicit Stroke Alpha",
        summary:
          "Stroke alpha affects only that stroke pass, so nested strokes stay fully explicit.",
        source: [
          "sprite alpha-stroke-demo",
          "  size 128 64",
          "  background transparent",
          "",
          "rect-inset 18 #18242c",
          "  stroke 3 #d8f8ff alpha=0.4",
          "    stroke 1 white"
        ].join("\n")
      }
    ]
  };
