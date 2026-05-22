import { Playground } from "../playground.js";
import type { PageDefinition } from "../types.js";

export const tryItPage: Extract<PageDefinition, { kind: "playground" }> = {
  id: "try-it",
  kind: "playground",
  title: "Try it",
  summary:
    "Edit a Radebe source file and see the sprite artifact update immediately.",
  examples: [
    {
      id: "try-it-main",
      title: "Editor",
      summary: "A small panel example with a header, one shape, an appearance pass, and a line.",
      source: [
        "sprite first-panel",
        "  size 128 48",
        "  background transparent",
        "",
        "rect-inset 6 #101820",
        "  cut 6",
        "  stroke 2 #70c8e8",
        "  glow #70c8e8 blur=3 alpha=0.55",
        "",
        "line 18 16 110 16 #d8f8ff",
        "line 28 32 100 32 #ffcc88"
      ].join("\n")
    }
  ]
};

export function TryItPage(props: {
  sourceState: Map<string, string>;
  page: Extract<PageDefinition, { kind: "playground" }>;
}) {
  return (
    <>
      {props.page.examples.map((example) => (
        <Playground
          immersive
          key={example.id}
          playground={example}
          sourceState={props.sourceState}
        />
      ))}
    </>
  );
}
