export const roadmapFeatures = [
  {
    title: "Procedural fills",
    task: "T-063 to T-066",
    body: "Noise, cloudy gradients, Voronoi cells, scanlines, hatches, and other tileable patterns for richer UI surfaces.",
    syntax: ["rect-inset 8", "  fill noise seed=17 scale=6", "  fill pattern stripes angle=45 spacing=4 alpha=0.35"].join("\n")
  },
  {
    title: "Blend modes",
    task: "T-067",
    body: "Layer-friendly compositing controls for ordered appearance passes.",
    syntax: ["rect 8 8 96 40 #101820", "  fill solid #70c8e8 blend=screen alpha=0.4"].join("\n")
  },
  {
    title: "Symbolic bounds and expressions",
    task: "T-068",
    body: "Readable values such as `left+8`, `right-8`, `center-x`, and reusable arithmetic.",
    syntax: ["rect left+8 top+8 right-8 bottom-8", "line left+16 center-y right-16 center-y #d8f8ff"].join("\n")
  },
  {
    title: "Transforms",
    task: "T-069",
    body: "Translate, rotate, scale, and mirror for shapes or groups while keeping pixel output predictable.",
    syntax: ["group pointer", "  rotate 45 center-x=32 center-y=32", "  polygon 24 8 40 32 24 56 #ffcc88"].join("\n")
  },
  {
    title: "Reusable symbols",
    task: "T-070",
    body: "Small component definitions for repeated bolts, tabs, dividers, and panel details.",
    syntax: ["symbol bolt size color", "  circle 0 0 size color", "", "use bolt x=12 y=12 size=3 color=#d8f8ff"].join("\n")
  },
  {
    title: "Richer paths",
    task: "T-071",
    body: "Caps, joins, closed paths, fill behavior, and eventually curve commands.",
    syntax: ["path rail close=true", "  point 12 12", "  point 60 12", "  curve-to 80 24 60 36", "  stroke 2 #70c8e8"].join("\n")
  },
  {
    title: "Source-authored import metadata",
    task: "T-072",
    body: "Sprite import hints for Unity-facing settings such as pivot, pixels per unit, borders, slicing, and filters.",
    syntax: ["sprite panel", "  size 128 48", "  unity pivot=center ppu=100", "  border 8 8 8 8"].join("\n")
  },
  {
    title: "Boolean regions",
    task: "T-073",
    body: "Union, subtract, intersect, and difference operations for shape composition before painting.",
    syntax: ["region badge subtract", "  rect 8 8 80 32", "  circle 24 24 10", "  fill solid #101820"].join("\n")
  },
  {
    title: "Mixed per-corner treatments",
    task: "T-077",
    body: "Cut and rounded corners on the same rectangle without confusing omitted corners with explicit zero values.",
    syntax: ["rect 0 0 96 40 #101820", "  cut top-left 8", "  radius top-right 12", "  cut bottom-right 4"].join("\n")
  },
  {
    title: "Mask composition modes",
    task: "T-079",
    body: "Stacked or nested mask regions with add, intersect, subtract, and replace semantics.",
    syntax: ["mask panel mode=intersect", "  shape", "    rect-inset 6", "  shape mode=subtract", "    circle 32 24 10"].join("\n")
  },
  {
    title: "Reusable editor package",
    task: "T-054",
    body: "A deliberate packaging boundary for embedding the editor surface outside this site.",
    syntax: ["import { RadebeEditor } from \"@radebe/editor\"", "<RadebeEditor source={source} onChange={setSource} />"].join("\n")
  },
  {
    title: "Unity live authoring",
    task: "T-055",
    body: "A Unity editor surface with live preview parity once the importer and language surface settle further.",
    syntax: ["Assets/Create/Radebe Sprite", "Open Radebe Authoring Window", "Edit .rdb source with live generated Sprite preview"].join("\n")
  }
];
