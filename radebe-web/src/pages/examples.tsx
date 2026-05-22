import brandIconData from "../content/brand-icon.json" with { type: "json" };
import showcaseExamplesData from "../content/examples.json" with { type: "json" };
import { Playground } from "../playground.js";
import type { PageDefinition } from "../types.js";
import type { ExamplePlayground } from "../types.js";
import { Hero } from "../ui.js";

export const examplesPage: Extract<PageDefinition, { kind: "examples" }> = {
  id: "examples",
  kind: "examples",
  title: "Examples"
};

type ShowcaseExampleData = {
  id: string;
  title: string;
  summary: string;
  preview: string;
  source: string[];
};

type ShowcaseExample = ExamplePlayground & {
  preview: string;
  previewHeight: number;
  previewWidth: number;
};

function getSourceSize(source: string): { width: number; height: number } {
  const match = source.match(/^\s+size\s+(\d+)\s+(\d+)$/m);

  if (!match) {
    return { width: 1, height: 1 };
  }

  return {
    width: Number.parseInt(match[1]!, 10),
    height: Number.parseInt(match[2]!, 10)
  };
}

const showcaseExamples = (
  [brandIconData, ...showcaseExamplesData] as ShowcaseExampleData[]
).map((example): ShowcaseExample => {
    const source = example.source.join("\n");
    const size = getSourceSize(source);

    return {
      ...example,
      previewHeight: size.height,
      previewWidth: size.width,
      source
    };
  });

export function ExamplesPage(props: { sourceState: Map<string, string> }) {
  return (
    <>
      <Hero
        title="Examples"
        summary="Complete Radebe sprites built from the current language surface. Each source renders as-is and is meant to be a useful starting point for buttons, badges, panels, icons, and HUD pieces."
      />
      <section className="examples-list">
        {showcaseExamples.map((example) => (
          <Playground
            cachedPreview={{
              height: example.previewHeight,
              src: example.preview,
              width: example.previewWidth
            }}
            key={example.id}
            playground={example}
            sourceState={props.sourceState}
          />
        ))}
      </section>
    </>
  );
}
