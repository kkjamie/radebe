import type { ExampleDoc } from "../../types.js";

export const alphaDoc: ExampleDoc = {
    id: "alpha",
    title: "Alpha",
    navGroup: "Property Commands",
    summary:
      "Defines explicit opacity on `fill` and `stroke` appearance passes without introducing implicit child inheritance.",
    properties: ["value: opacity from 0 to 1"],
    childCommands: [],
    notes: [
      "`alpha` applies to `fill` and `stroke` appearance passes.",
      "`alpha` defaults to `1` when omitted.",
      "Nested strokes set their own alpha explicitly.",
      "Pass alpha multiplies with any alpha already present in solid colors or gradient stop colors."
    ],
    examples: [
      {
        id: "alpha-solid-fills",
        title: "Fill Alpha",
        summary:
          "Separate solid fills can use different pass-level alpha values.",
        source: [
          "sprite alpha-fill-demo",
          "  size 360 144",
          "  background transparent",
          "  antialias true",
          "",
          "rect 32 36 76 72",
          "  fill solid white alpha=0.25",
          "",
          "circle 180 72 40",
          "  fill solid white alpha=0.55",
          "",
          "polygon-regular 296 72 6 44",
          "  fill solid white alpha=0.85"
        ].join("\n")
      },
      {
        id: "alpha-gradient-stops",
        title: "Hex Alpha Stops",
        summary:
          "Alpha-capable hex colors can fade a gradient without a separate backing fill.",
        source: [
          "sprite alpha-gradient-demo",
          "  size 360 144",
          "  background transparent",
          "  antialias true",
          "",
          "rect 32 32 296 80",
          "  fill",
          "    gradient-linear",
          "      stop #ffffff 0",
          "      stop #ffffff80 0.45",
          "      stop #ffffff00 1"
        ].join("\n")
      }
    ]
  };
