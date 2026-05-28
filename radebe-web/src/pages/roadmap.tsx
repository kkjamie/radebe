import type { PageDefinition } from "../types.js";
import { Hero, HighlightedCodeBlock } from "../ui.js";

export const roadmapPage: Extract<PageDefinition, { kind: "roadmap" }> = {
  id: "roadmap",
  kind: "roadmap",
  title: "Roadmap"
};

type RoadmapVisualKind = "npm" | "unity" | "vscode";

type RoadmapFeature = {
  body: string;
  status?: string;
  title: string;
} & (
  | {
      syntax: string;
      visual?: never;
    }
  | {
      syntax?: never;
      visual: RoadmapVisualKind;
    }
);

type RoadmapSection = {
  features: RoadmapFeature[];
  summary: string;
  title: string;
};

const roadmapSections: RoadmapSection[] = [
  {
    title: "Integrations",
    summary:
      "Bringing radebe support to different platforms.",
    features: [
      {
        title: "Unity plugin",
        body: "Import `.rdb` files in Unity and generate sprites for game projects.",
        status: "Incoming",
        visual: "unity"
      },
      {
        title: "VS Code extension",
        body:
          "Syntax highlighting, completions, diagnostics, color tools, and preview commands for `.rdb` files.",
        status: "Incoming",
        visual: "vscode"
      },
      {
        title: "npm packages",
        body:
          "Public packages for using the parser, compiler, renderer, and editor pieces from JavaScript.",
        status: "Incoming",
        visual: "npm"
      },
      {
        title: "Reusable web editor",
        body:
          "A reusable React component for embedding the Radebe editor and live preview.",
        status: "Incoming",
        syntax: [
          "import { RadebeEditor } from \"@radebe/editor/react\";",
          "",
          "<RadebeEditor",
          "  source={source}",
          "  onSourceChange={setSource}",
          "  preview=\"live\"",
          "/>"
        ].join("\n")
      }
    ]
  },
  {
    title: "Rendering And Appearance",
    summary:
      "More ways to paint, layer, and combine sprite artwork.",
    features: [
      {
        title: "Noise fills",
        body:
          "Seeded texture fills for panel grain, surface detail, and stable generated noise.",
        syntax: [
          "rect-inset 8",
          "  fill noise seed=17 scale=6",
          "  stroke 2 #70c8e8"
        ].join("\n")
      },
      {
        title: "Cloud and fractal fills",
        body:
          "Cloudy, plasma, and layered fractal fills with repeatable seeds.",
        syntax: [
          "circle 32 32 24",
          "  fill cloud seed=42 scale=9",
          "  stop 0 #101820",
          "  stop 1 #70c8e8"
        ].join("\n")
      },
      {
        title: "Voronoi and cell fills",
        body:
          "Cell patterns for cracked panels, shields, maps, and sci-fi surfaces.",
        syntax: [
          "rect 0 0 96 48",
          "  fill voronoi seed=11 cells=18",
          "  stroke 1 #d8f8ff alpha=0.45"
        ].join("\n")
      },
      {
        title: "Tileable patterns",
        body:
          "Stripes, hatches, dots, grids, scanlines, and circuit-like repeats.",
        syntax: [
          "rect-inset 6",
          "  fill pattern stripes angle=45 spacing=4 alpha=0.35",
          "  fill pattern scanlines spacing=3 alpha=0.18"
        ].join("\n")
      },
      {
        title: "Blend modes",
        body: "Blend controls for stacked fills, strokes, shadows, and glows.",
        syntax: [
          "rect 8 8 96 40 #101820",
          "  fill solid #70c8e8 blend=screen alpha=0.4"
        ].join("\n")
      },
      {
        title: "Boolean regions",
        body:
          "Combine shapes with union, subtract, intersect, and difference before painting.",
        syntax: [
          "region badge subtract",
          "  rect 8 8 80 32",
          "  circle 24 24 10",
          "  fill solid #101820"
        ].join("\n")
      },
      {
        title: "Mask composition modes",
        body: "Stack and combine masks with add, intersect, subtract, and replace.",
        syntax: [
          "mask panel mode=intersect",
          "  shape",
          "    rect-inset 6",
          "  shape mode=subtract",
          "    circle 32 24 10"
        ].join("\n")
      }
    ]
  },
  {
    title: "Language Authoring",
    summary:
      "Source features for scaling, reuse, layout, and more precise shape control.",
    features: [
      {
        title: "Output scale",
        body:
          "Export larger rasters from the same source while scaling every pixel value together.",
        syntax: [
          "sprite badge",
          "  size 32 32",
          "  outputscale 4",
          "",
          "rect 4 4 24 24 #70c8e8",
          "  stroke 1 #101820"
        ].join("\n")
      },
      {
        title: "Symbolic bounds and expressions",
        body: "Readable values like `left+8`, `right-8`, `center-x`, and simple arithmetic.",
        syntax: [
          "rect left+8 top+8 right-8 bottom-8",
          "line left+16 center-y right-16 center-y #d8f8ff"
        ].join("\n")
      },
      {
        title: "Built-in sprite variables",
        body:
          "Use sprite width, height, center, and bounds without declaring them yourself.",
        syntax: [
          "rect 0 0 $sprite.width $sprite.height #101820",
          "line 0 $sprite.center-y $sprite.width $sprite.center-y #d8f8ff"
        ].join("\n")
      },
      {
        title: "Relative dimension units",
        body:
          "Use width- and height-relative values while keeping deterministic pixel output.",
        syntax: [
          "rect 10%W 12%H 80%W 76%H #101820",
          "line 0 0.5h 1w 0.5h #70c8e8"
        ].join("\n")
      },
      {
        title: "Inline comments",
        body:
          "Add notes at the end of a command line.",
        syntax: [
          "rect 8 8 96 40 #101820",
          "  cut 4 # chamfer each corner",
          "  stroke 2 #70c8e8 # outline the panel"
        ].join("\n")
      },
      {
        title: "Command ordering diagnostics",
        body:
          "Clear messages when properties, modifiers, fills, strokes, or effects are out of order.",
        syntax: [
          "rect 8 8 96 40",
          "  cut 4",
          "  fill solid #101820",
          "  shadow 2 2 #000000 alpha=0.35"
        ].join("\n")
      },
      {
        title: "Transforms",
        body:
          "Translate, rotate, and scale shapes or groups predictably.",
        syntax: [
          "group pointer",
          "  rotate 45 center-x=32 center-y=32",
          "  polygon 24 8 40 32 24 56 #ffcc88"
        ].join("\n")
      },
      {
        title: "Repeat containers",
        body:
          "Structural containers for linear, grid, radial, mirrored, tiled, and path-following repetition.",
        syntax: [
          "repeat-radial 12 64 64",
          "  rect 61 8 6 16 #d8f8ff",
          "",
          "mirror x=64",
          "  polygon 64 24 96 64 64 104 #70c8e8",
          "",
          "tile 0 0 128 64 dx=16 dy=16",
          "  circle 0 0 2 #70c8e8"
        ].join("\n")
      },
      {
        title: "Reusable symbols",
        body: "Define reusable pieces like bolts, tabs, dividers, and panel details.",
        syntax: [
          "symbol bolt size color",
          "  circle 0 0 size color",
          "",
          "use bolt x=12 y=12 size=3 color=#d8f8ff"
        ].join("\n")
      },
      {
        title: "Richer paths",
        body: "Add caps, joins, closed paths, fills, and curves.",
        syntax: [
          "path rail close=true",
          "  point 12 12",
          "  point 60 12",
          "  curve-to 80 24 60 36",
          "  stroke 2 #70c8e8"
        ].join("\n")
      },
      {
        title: "Targeted corner controls",
        body:
          "Apply `cut` and `radius` to specific rectangle corners or polygon vertices.",
        syntax: [
          "rect 0 0 96 40 #101820",
          "  cut top 8",
          "  radius bottom-right 12",
          "",
          "polygon-star 48 24 5 12 22 #70c8e8",
          "  radius outer 3"
        ].join("\n")
      }
    ]
  },
];

function RoadmapVisual(props: { kind: RoadmapVisualKind }) {
  const logo = {
    npm: {
      label: "npm packages",
      src: "https://cdn.simpleicons.org/npm/CB3837"
    },
    unity: {
      label: "Unity plugin",
      src: "https://cdn.simpleicons.org/unity/FFFFFF"
    },
    vscode: {
      label: "VS Code extension",
      src: ""
    }
  }[props.kind];

  if (props.kind === "vscode") {
    return (
      <div className="roadmap-visual roadmap-visual--vscode" aria-label={logo.label} role="img">
        <svg
          className="roadmap-brand-logo roadmap-brand-logo--vscode"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z" />
        </svg>
        <p className="roadmap-visual-label">{logo.label}</p>
      </div>
    );
  }

  if (props.kind === "npm") {
    return (
      <div className="roadmap-visual roadmap-visual--npm" aria-label="npm package" role="img">
        <img
          className={`roadmap-brand-logo roadmap-brand-logo--${props.kind}`}
          alt=""
          src={logo.src}
        />
        <p className="roadmap-visual-label">{logo.label}</p>
      </div>
    );
  }

  return (
    <div
      className={`roadmap-visual roadmap-visual--${props.kind}`}
      aria-label={logo.label}
      role="img"
    >
      <img
        className={`roadmap-brand-logo roadmap-brand-logo--${props.kind}`}
        alt=""
        src={logo.src}
      />
      <p className="roadmap-visual-label">{logo.label}</p>
    </div>
  );
}

export function RoadmapPage() {
  return (
    <>
      <Hero title="Roadmap" />
      {roadmapSections.map((section) => (
        <section className="roadmap-section" key={section.title}>
          <h3 className="roadmap-heading">{section.title}</h3>
          <p className="roadmap-summary">{section.summary}</p>
          <div className="roadmap-grid">
            {section.features.map((feature) => (
              <article className="roadmap-card" key={feature.title}>
                <div className="roadmap-card-header">
                  <h4 className="roadmap-card-title">{feature.title}</h4>
                  {feature.status !== undefined ? (
                    <span className="roadmap-status">{feature.status}</span>
                  ) : null}
                </div>
                <p className="roadmap-card-body">{feature.body}</p>
                {feature.visual !== undefined ? (
                  <RoadmapVisual kind={feature.visual} />
                ) : (
                  <HighlightedCodeBlock
                    source={feature.syntax}
                    options={{ strictCommands: false }}
                  />
                )}
              </article>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
