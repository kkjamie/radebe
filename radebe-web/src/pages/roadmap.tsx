import type { PageDefinition } from "../types.js";
import { Hero, HighlightedCodeBlock } from "../ui.js";

export const roadmapPage: Extract<PageDefinition, { kind: "roadmap" }> = {
  id: "roadmap",
  kind: "roadmap",
  title: "Roadmap"
};

const roadmapSections = [
  {
    title: "Rendering And Appearance",
    summary:
      "Features that expand how drawables are painted, layered, and combined into richer sprite surfaces.",
    features: [
      {
        title: "Noise fills",
        body:
          "Seeded texture fills with scale controls, color ramps, and stable output for sci-fi panels and surface detail.",
        syntax: [
          "rect-inset 8",
          "  fill noise seed=17 scale=6",
          "  stroke 2 #70c8e8"
        ].join("\n")
      },
      {
        title: "Cloud and fractal fills",
        body:
          "Smooth procedural fill families for cloudy, plasma, and layered fractal looks with deterministic seeds.",
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
          "Cell-based fills for cracked panels, alien technology surfaces, shields, and map-like UI backgrounds.",
        syntax: [
          "rect 0 0 96 48",
          "  fill voronoi seed=11 cells=18",
          "  stroke 1 #d8f8ff alpha=0.45"
        ].join("\n")
      },
      {
        title: "Tileable patterns",
        body:
          "Pattern fills such as stripes, hatches, dots, grids, scanlines, and circuit-like repeats.",
        syntax: [
          "rect-inset 6",
          "  fill pattern stripes angle=45 spacing=4 alpha=0.35",
          "  fill pattern scanlines spacing=3 alpha=0.18"
        ].join("\n")
      },
      {
        title: "Blend modes",
        body: "Layer-friendly compositing controls for ordered appearance passes.",
        syntax: [
          "rect 8 8 96 40 #101820",
          "  fill solid #70c8e8 blend=screen alpha=0.4"
        ].join("\n")
      },
      {
        title: "Boolean regions",
        body:
          "Union, subtract, intersect, and difference operations for composing shape regions before painting.",
        syntax: [
          "region badge subtract",
          "  rect 8 8 80 32",
          "  circle 24 24 10",
          "  fill solid #101820"
        ].join("\n")
      },
      {
        title: "Mask composition modes",
        body: "Stacked or nested mask regions with add, intersect, subtract, and replace semantics.",
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
    title: "Language Expressiveness",
    summary:
      "Features that make source files more reusable, responsive to sprite bounds, and expressive for complex shapes.",
    features: [
      {
        title: "Output scale",
        body:
          "A sprite-level `outputscale` property for exporting larger rasters while scaling every authored pixel metric together.",
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
        body: "Readable values such as `left+8`, `right-8`, `center-x`, and reusable arithmetic.",
        syntax: [
          "rect left+8 top+8 right-8 bottom-8",
          "line left+16 center-y right-16 center-y #d8f8ff"
        ].join("\n")
      },
      {
        title: "Built-in sprite variables",
        body:
          "Read-only sprite values for width, height, center, and bounds without declaring them in every file.",
        syntax: [
          "rect 0 0 $sprite.width $sprite.height #101820",
          "line 0 $sprite.center-y $sprite.width $sprite.center-y #d8f8ff"
        ].join("\n")
      },
      {
        title: "Relative dimension units",
        body:
          "Width- and height-relative values for responsive source that still compiles to deterministic pixels.",
        syntax: [
          "rect 10%W 12%H 80%W 76%H #101820",
          "line 0 0.5h 1w 0.5h #70c8e8"
        ].join("\n")
      },
      {
        title: "Inline comments",
        body:
          "End-of-line notes for explaining source without moving the explanation onto its own line.",
        syntax: [
          "rect 8 8 96 40 #101820",
          "  cut 4 # chamfer each corner",
          "  stroke 2 #70c8e8 # outline the panel"
        ].join("\n")
      },
      {
        title: "Command ordering diagnostics",
        body:
          "Clear compiler and editor guidance for where properties, geometry modifiers, appearance passes, and effects belong.",
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
          "Translate, rotate, scale, and mirror for shapes or groups while keeping pixel output predictable.",
        syntax: [
          "group pointer",
          "  rotate 45 center-x=32 center-y=32",
          "  polygon 24 8 40 32 24 56 #ffcc88"
        ].join("\n")
      },
      {
        title: "Reusable symbols",
        body: "Small component definitions for repeated bolts, tabs, dividers, and panel details.",
        syntax: [
          "symbol bolt size color",
          "  circle 0 0 size color",
          "",
          "use bolt x=12 y=12 size=3 color=#d8f8ff"
        ].join("\n")
      },
      {
        title: "Richer paths",
        body: "Caps, joins, closed paths, fill behavior, and curve commands.",
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
          "Selector-based `cut` and `radius` controls for rectangle corners and polygon-family vertices.",
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
  {
    title: "Tooling And Integrations",
    summary:
      "Features that make Radebe source easier to package, embed, and use inside game-authoring workflows.",
    features: [
      {
        title: "Source-authored import metadata",
        body:
          "Sprite import hints for Unity-facing settings such as pivot, pixels per unit, borders, slicing, and filters.",
        syntax: [
          "sprite panel",
          "  size 128 48",
          "  unity pivot=center ppu=100",
          "  border 8 8 8 8"
        ].join("\n")
      },
      {
        title: "Reusable editor package",
        body: "A packaging boundary for embedding the editor surface outside this site.",
        syntax: [
          "import { RadebeEditor } from \"@radebe/editor\"",
          "<RadebeEditor source={source} onChange={setSource} />"
        ].join("\n")
      },
      {
        title: "Unity live authoring",
        body:
          "A Unity editor surface with live preview parity once importer and language workflows are ready for it.",
        syntax: [
          "Assets/Create/Radebe Sprite",
          "Open Radebe Authoring Window",
          "Edit .rdb source with live generated Sprite preview"
        ].join("\n")
      }
    ]
  }
];

export function RoadmapPage() {
  return (
    <>
      <Hero
        title="Roadmap"
        summary="This page tracks user-facing capabilities from the project task board. New language, rendering, editor, and integration features belong here; internal fixes generally stay off the public roadmap unless they change the author workflow."
      />
      {roadmapSections.map((section) => (
        <section className="roadmap-section" key={section.title}>
          <h3 className="roadmap-heading">{section.title}</h3>
          <p className="roadmap-summary">{section.summary}</p>
          <div className="roadmap-grid">
            {section.features.map((feature) => (
              <article className="roadmap-card" key={feature.title}>
                <h4 className="roadmap-card-title">{feature.title}</h4>
                <p className="roadmap-card-body">{feature.body}</p>
                <HighlightedCodeBlock
                  source={feature.syntax}
                  options={{ strictCommands: false }}
                />
              </article>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
