import { renderSource } from "@radebe/core";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Expected #app container");
}

type ExamplePlayground = {
  id: string;
  title: string;
  summary: string;
  source: string;
};

type ExampleDoc = {
  id: string;
  title: string;
  navGroup: string;
  summary: string;
  args: string[];
  childCommands: string[];
  notes: string[];
  examples?: ExamplePlayground[];
  comingSoon?: boolean;
};

type PageDefinition =
  | {
      id: "experimental";
      kind: "playground";
      title: string;
      summary: string;
      examples: ExamplePlayground[];
    }
  | {
      id: string;
      kind: "example";
      doc: ExampleDoc;
    };

const experimentalPage: Extract<PageDefinition, { kind: "playground" }> = {
  id: "experimental",
  kind: "playground",
  title: "Experimental",
  summary:
    "Use the current language slice freely here. This page stays loose on purpose so new commands can be tried before they settle into more curated examples.",
  examples: [
    {
      id: "experimental-main",
      title: "Scratch Pad",
      summary: "A broad mixed example using the latest fill and geometry commands.",
      source: [
        "sprite sci-fi-button",
        "  size 256 80",
        "  background transparent",
        "",
        "// Base button shape",
        "rect 8 8 240 64",
        "  fill gradient-linear #101820 #365266",
        "",
        "// Radial glow from the left side",
        "rect 8 8 240 64",
        "  fill",
        "    gradient-radial",
        "      center-x 0.22",
        "      center-y 0.5",
        "      radius 0.7",
        "      stop #d8f8ff66 0",
        "      stop #70c8e800 1",
        "",
        "// Outer frame stroke",
        "rect-inset 8",
        "  stroke 1 #d8f8ff",
        "",
        "// Accent and baseline",
        "plot 28 24 #d8f8ff",
        "line 40 54 216 54 #70c8e8"
      ].join("\n")
    }
  ]
};

function createComingSoonDoc(definition: {
  id: string;
  title: string;
  navGroup: string;
  summary: string;
  args: string[];
  childCommands: string[];
  notes?: string[];
}): ExampleDoc {
  return {
    ...definition,
    comingSoon: true,
    notes: [
      "Coming soon.",
      ...(definition.notes ?? [])
    ]
  };
}

const exampleDocs: ExampleDoc[] = [
  {
    id: "sprite",
    title: "Sprite Header",
    navGroup: "Document",
    summary:
      "Defines the file-level sprite identity and holds nested header properties such as size and background.",
    args: ["name", "size width height", "background color"],
    childCommands: ["size", "background"],
    notes: [
      "The sprite header must be the first root command in the file.",
      "Only one sprite header is allowed per file.",
      "Expanded property form can use child commands such as `name panel`."
    ],
    examples: [
      {
        id: "sprite-basic",
        title: "Basic Header",
        summary: "A minimal sprite header followed by one rectangle draw command.",
        source: [
          "sprite",
          "  name command-header-demo",
          "  size 24 12",
          "  background #0f1318",
          "",
          "// A simple panel to confirm the header values are active",
          "rect 2 2 20 8 #1c2a33"
        ].join("\n")
      }
    ]
  },
  createComingSoonDoc({
    id: "size",
    title: "Size",
    navGroup: "Document",
    summary: "Defines the sprite canvas dimensions inside the sprite header block.",
    args: ["width", "height"],
    childCommands: []
  }),
  createComingSoonDoc({
    id: "background",
    title: "Background",
    navGroup: "Document",
    summary: "Defines the sprite background color or transparency inside the sprite header block.",
    args: ["color"],
    childCommands: []
  }),
  {
    id: "plot",
    title: "Plot",
    navGroup: "Geometry",
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
          "// Positional shorthand",
          "plot 4 2 #d8f8ff",
          "",
          "// Named inline args",
          "plot x=10 y=2 color=#70c8e8",
          "",
          "// Child-property form",
          "plot",
          "  x 16",
          "  y 2",
          "  color white"
        ].join("\n")
      }
    ]
  },
  {
    id: "line",
    title: "Line",
    navGroup: "Geometry",
    summary: "Draws a line from one integer point to another using the shared raster line path.",
    args: ["x1", "y1", "x2", "y2", "color"],
    childCommands: [],
    notes: [
      "The current MVP rasterizer handles integer coordinates.",
      "Child-property form is equivalent to inline positional or named args."
    ],
    examples: [
      {
        id: "line-basic",
        title: "Horizontal And Diagonal",
        summary: "A small example showing a simple top stroke and a diagonal accent.",
        source: [
          "sprite line-demo",
          "  size 32 16",
          "  background transparent",
          "",
          "// Top edge",
          "line 2 2 29 2 #d8f8ff",
          "",
          "// Diagonal cut",
          "line",
          "  x1 4",
          "  y1 13",
          "  x2 26",
          "  y2 5",
          "  color #70c8e8"
        ].join("\n")
      }
    ]
  },
  {
    id: "rect-inset",
    title: "Rect Inset",
    navGroup: "Geometry",
    summary:
      "Defines a rectangle from the current sprite bounds using a uniform inset amount or side-specific top/right/bottom/left insets, which makes it a convenient panel and frame primitive.",
    args: ["inset", "top", "right", "bottom", "left", "color shorthand", "fill"],
    childCommands: ["fill"],
    notes: [
      "The uniform `inset` value applies to every side by default.",
      "Any of `top`, `right`, `bottom`, or `left` can override the uniform inset per side.",
      "Like `rect`, direct color shorthand lowers into an implicit solid fill.",
      "The computed rectangle must still fit inside the sprite bounds."
    ],
    examples: [
      {
        id: "rect-inset-basic",
        title: "Inset Panel",
        summary: "A centered panel defined purely from the sprite bounds and one inset value.",
        source: [
          "sprite inset-panel-demo",
          "  size 96 48",
          "  background #0f1318",
          "",
          "// Simple inset panel using color shorthand",
          "rect-inset 8 #18242c"
        ].join("\n")
      },
      {
        id: "rect-inset-layered",
        title: "Different Per Side",
        summary: "Overrides individual sides when you want asymmetric padding or a shifted plate.",
        source: [
          "sprite inset-sides-demo",
          "  size 160 72",
          "  background #0f1318",
          "",
          "// Uniform inset with a tighter top and wider right edge",
          "rect-inset",
          "  inset 10",
          "  top 6",
          "  right 18",
          "  fill solid #18242c"
        ].join("\n")
      }
    ]
  },
  createComingSoonDoc({
    id: "rounded-rect",
    title: "Rounded Rect",
    navGroup: "Geometry",
    summary: "Defines a rectangle with rounded corners.",
    args: ["x", "y", "width", "height", "radius"],
    childCommands: ["fill", "overlay", "stroke", "shadow"]
  }),
  createComingSoonDoc({
    id: "circle",
    title: "Circle",
    navGroup: "Geometry",
    summary: "Defines a circular coverage region for fills, overlays, and stroke-like treatments.",
    args: ["center", "radius"],
    childCommands: ["fill", "overlay", "stroke", "shadow"]
  }),
  createComingSoonDoc({
    id: "polygon",
    title: "Polygon",
    navGroup: "Geometry",
    summary: "Defines a polygon coverage region for later complex panels and badges.",
    args: ["point list"],
    childCommands: ["fill", "overlay", "stroke", "shadow"]
  }),
  createComingSoonDoc({
    id: "path",
    title: "Path",
    navGroup: "Geometry",
    summary: "Defines a reusable or inline path region for more flexible shapes and future winding rules.",
    args: ["optional name"],
    childCommands: ["draw", "fill", "overlay", "stroke"]
  }),
  {
    id: "rect",
    title: "Rect / Rect-Absolute",
    navGroup: "Geometry",
    summary:
      "Fills a rectangle using explicit x, y, width, height, and fill values. `rect` is a convenience alias for `rect-absolute`.",
    args: ["x", "y", "width", "height", "color shorthand", "fill"],
    childCommands: ["fill"],
    notes: [
      "`rect` and `rect-absolute` compile to the same rectangle draw command.",
      "Width and height must be positive integers.",
      "Direct color shorthand lowers into an implicit solid fill."
    ],
    examples: [
      {
        id: "rect-basic",
        title: "Alias And Expanded Form",
        summary: "Shows `rect-absolute` shorthand next to an expanded `rect` with explicit fill.",
        source: [
          "sprite rect-demo",
          "  size 40 18",
          "  background #0f1318",
          "",
          "// Direct color shorthand",
          "rect-absolute 2 2 12 6 #18242c",
          "",
          "// Expanded property form with explicit fill",
          "rect",
          "  x 20",
          "  y 4",
          "  width 14",
          "  height 8",
          "  fill solid #70c8e8"
        ].join("\n")
      }
    ]
  },
  createComingSoonDoc({
    id: "fill",
    title: "Fill",
    navGroup: "Appearance",
    summary: "Acts as the appearance container for one concrete fill variant such as solid or gradient.",
    args: ["variant shorthand"],
    childCommands: ["solid", "gradient-linear", "gradient-radial"],
    notes: ["The container itself is structural; it does not render without a concrete fill variant."]
  }),
  {
    id: "solid",
    title: "Solid Fill",
    navGroup: "Appearance",
    summary:
      "Uses `fill` as an appearance container and `solid` as the actual fill variant that supplies one color.",
    args: ["color"],
    childCommands: [],
    notes: [
      "`fill` on its own is only a container; it does not render without a variant such as `solid`, `gradient-linear`, or `gradient-radial`.",
      "Canonical expanded form is `fill -> solid -> color`.",
      "Shorthand `fill solid red` is supported.",
      "Multiple fills are preserved as ordered passes."
    ],
    examples: [
      {
        id: "solid-basic",
        title: "Two Solid Rectangles",
        summary: "One rectangle uses shorthand, the other uses the expanded canonical form.",
        source: [
          "sprite solid-fill-demo",
          "  size 64 24",
          "  background #0f1318",
          "",
          "// Shorthand solid fill",
          "rect 4 5 20 12",
          "  fill solid #18242c",
          "",
          "// Expanded canonical solid fill",
          "rect 34 6 20 10",
          "  fill",
          "    solid",
          "      color #70c8e8"
        ].join("\n")
      }
    ]
  },
  {
    id: "gradient-linear",
    title: "Linear Gradient",
    navGroup: "Appearance",
    summary:
      "Defines a linear gradient fill. It supports the old two-color shorthand through `gradient`, the explicit `gradient-linear` variant, stop lists, axis directions, and custom angles.",
    args: ["from", "to", "direction", "angle"],
    childCommands: ["stop"],
    notes: [
      "`gradient` remains a linear-gradient alias for compatibility, while `gradient-linear` is the explicit name.",
      "Use either `direction` or `angle`, not both.",
      "Supported directions are currently `horizontal` and `vertical`.",
      "Expanded stop form supports multiple colors and alpha-capable hex values like `#0000ff80`."
    ],
    examples: [
      {
        id: "gradient-linear-horizontal",
        title: "Horizontal Shorthand",
        summary: "The compact two-color form maps left-to-right across the rectangle.",
        source: [
          "sprite linear-horizontal-demo",
          "  size 256 56",
          "  background #0f1318",
          "",
          "// Default horizontal gradient alias",
          "rect 8 8 240 40",
          "  fill gradient #ff0055 #70c8e8"
        ].join("\n")
      },
      {
        id: "gradient-linear-vertical",
        title: "Vertical Stops",
        summary: "Uses explicit stops and a vertical axis to produce a top-to-bottom blend.",
        source: [
          "sprite linear-vertical-demo",
          "  size 256 80",
          "  background #0f1318",
          "",
          "// Vertical gradient with three stops",
          "rect 20 8 216 64",
          "  fill",
          "    gradient-linear",
          "      direction vertical",
          "      stop #101820 0",
          "      stop #2f4c5c 0.45",
          "      stop #d8f8ff 1"
        ].join("\n")
      },
      {
        id: "gradient-linear-angle",
        title: "Angled Custom Gradient",
        summary: "Shows the custom-angle form for diagonal lighting passes.",
        source: [
          "sprite linear-angle-demo",
          "  size 256 96",
          "  background #0f1318",
          "",
          "// Diagonal sweep using an explicit angle",
          "rect 16 12 224 72",
          "  fill",
          "    gradient-linear",
          "      angle 35",
          "      stop #14191f 0",
          "      stop #365266 0.55",
          "      stop #d8f8ffcc 1"
        ].join("\n")
      }
    ]
  },
  {
    id: "gradient-radial",
    title: "Radial Gradient",
    navGroup: "Appearance",
    summary:
      "Defines a radial gradient fill with a normalized center and radius. It works well for glows, vignette-like falloff, and soft highlights.",
    args: ["from", "to", "center-x", "center-y", "radius"],
    childCommands: ["stop"],
    notes: [
      "`center-x` and `center-y` are normalized from 0 to 1 within the rectangle bounds.",
      "A radius of `1` reaches the farthest rectangle corner from the chosen center.",
      "Expanded stop form supports multiple colors and transparency through alpha-capable hex values."
    ],
    examples: [
      {
        id: "gradient-radial-centered",
        title: "Centered Glow",
        summary: "A symmetric glow using the default center and radius.",
        source: [
          "sprite radial-centered-demo",
          "  size 192 112",
          "  background #0f1318",
          "",
          "// Default centered radial glow",
          "rect 16 16 160 80",
          "  fill",
          "    gradient-radial",
          "      stop #d8f8ff 0",
          "      stop #365266 0.5",
          "      stop #101820 1"
        ].join("\n")
      },
      {
        id: "gradient-radial-offset",
        title: "Offset Highlight",
        summary: "Moves the radial source to one side to fake a light hotspot.",
        source: [
          "sprite radial-offset-demo",
          "  size 192 112",
          "  background #0f1318",
          "",
          "// Offset highlight near the upper-left",
          "rect 16 16 160 80",
          "  fill",
          "    gradient-radial",
          "      center-x 0.25",
          "      center-y 0.28",
          "      radius 0.7",
          "      stop #fff8d8 0",
          "      stop #70c8e855 0.45",
          "      stop #14191f 1"
        ].join("\n")
      },
      {
        id: "gradient-radial-transparent",
        title: "Transparent Overlay",
        summary: "A radial overlay pass that can sit above another fill because alpha is preserved.",
        source: [
          "sprite radial-overlay-demo",
          "  size 192 112",
          "  background transparent",
          "",
          "// Base plate",
          "rect 16 16 160 80 #18242c",
          "",
          "// Transparent radial highlight layered on top",
          "rect 16 16 160 80",
          "  fill",
          "    gradient-radial",
          "      center-x 0.55",
          "      center-y 0.4",
          "      radius 0.75",
          "      stop #d8f8ffaa 0",
          "      stop #70c8e833 0.45",
          "      stop #70c8e800 1"
        ].join("\n")
      }
    ]
  },
  createComingSoonDoc({
    id: "overlay",
    title: "Overlay",
    navGroup: "Appearance",
    summary: "Adds a secondary ordered appearance pass above the base fill.",
    args: ["overlay-specific args"],
    childCommands: ["solid", "gradient-linear", "gradient-radial"]
  }),
  {
    id: "stroke",
    title: "Stroke",
    navGroup: "Appearance",
    summary:
      "Defines a generated stroked region around a rectangle-backed shape. The first slice supports solid, dashed, and dotted rectangle strokes with fill-based color.",
    args: ["width", "color", "align", "style", "dash-length", "gap-length", "dot-spacing"],
    childCommands: ["fill"],
    notes: [
        "`stroke 2 white` is shorthand for width plus an implicit solid fill color.",
        "Current rendering support is rectangle-backed only.",
        "Supported align values are `inside`, `center`, and `outside`.",
        "Supported style values are `solid`, `dashed`, and `dotted`.",
        "Nested `stroke` is supported on the generated stroke envelope in this first recursive slice."
      ],
    examples: [
      {
        id: "stroke-solid-basic",
        title: "Solid Stroke",
        summary: "The compact common case using width and color shorthand.",
        source: [
          "sprite stroke-solid-demo",
          "  size 96 48",
          "  background #0f1318",
          "",
          "// A simple centered white frame",
          "rect-inset 10",
          "  stroke 2 white"
        ].join("\n")
      },
        {
          id: "stroke-align-inside",
          title: "Inside Alignment",
          summary: "Shows how alignment changes where the stroke thickness sits relative to the base rectangle.",
        source: [
          "sprite stroke-align-demo",
          "  size 96 48",
          "  background #0f1318",
          "",
          "// Stroke stays entirely inside the generated rectangle",
          "rect-inset 8",
          "  stroke",
          "    width 4",
          "    align inside",
            "    fill solid #70c8e8"
          ].join("\n")
        },
        {
          id: "stroke-gradient-fill",
          title: "Gradient-Filled Stroke",
          summary: "The stroke region can use the same fill model as a rectangle, including gradients.",
          source: [
            "sprite stroke-gradient-demo",
            "  size 160 72",
            "  background #0f1318",
            "",
            "// Gradient-filled border around a darker inner plate",
            "rect-inset 12 #14191f",
            "  stroke",
            "    width 4",
            "    align center",
            "    fill",
            "      gradient-linear",
            "        angle 15",
            "        stop #d8f8ff 0",
            "        stop #70c8e8 0.45",
            "        stop #365266 1"
          ].join("\n")
        },
        {
          id: "stroke-dashed",
          title: "Dashed And Dotted",
          summary: "Style values can tune the cadence of rectangle-backed strokes.",
        source: [
          "sprite stroke-style-demo",
          "  size 160 72",
          "  background #0f1318",
          "",
          "// Dashed outer frame",
          "rect-inset 10",
          "  stroke width=2 color=#d8f8ff style=dashed dash-length=10 gap-length=6",
          "",
          "// Dotted inner frame",
          "rect-inset 22",
          "  stroke",
          "    width 2",
            "    style dotted",
            "    dot-spacing 4",
            "    fill solid #70c8e8"
          ].join("\n")
        },
        {
          id: "stroke-outside",
          title: "Outside Alignment",
          summary: "An outside stroke can grow beyond the base rectangle while keeping the interior untouched.",
          source: [
            "sprite stroke-outside-demo",
            "  size 128 64",
            "  background #0f1318",
            "",
            "// Base plate stays compact while the frame expands outward",
            "rect-inset 18 #18242c",
            "  stroke",
            "    width 3",
            "    align outside",
            "    fill solid #d8f8ff"
          ].join("\n")
        },
        {
          id: "stroke-nested",
          title: "Nested Stroke",
          summary: "A stroke can now own another stroke so double-outline treatments stay inside the same appearance model.",
          source: [
            "sprite stroke-nested-demo",
            "  size 128 64",
            "  background #0f1318",
            "",
            "// Outer cyan frame with a nested white inner edge",
            "rect-inset 12",
            "  stroke 3 #70c8e8",
            "    stroke 1 white"
          ].join("\n")
        }
      ]
    },
  createComingSoonDoc({
    id: "shadow",
    title: "Shadow",
    navGroup: "Appearance",
    summary: "Adds a shadow-like appearance pass to a shape.",
    args: ["shadow-specific args"],
    childCommands: ["fill", "overlay"]
  }),
  {
    id: "align",
    title: "Align",
    navGroup: "Properties",
    summary: "Selects how a generated region such as a stroke sits relative to the source shape.",
    args: ["inside | center | outside"],
    childCommands: [],
    notes: [
      "Currently implemented on `stroke`.",
      "`inside` keeps the stroke within the source bounds.",
      "`center` splits the thickness around the source edge.",
      "`outside` pushes the thickness outward."
    ]
  },
  {
    id: "style",
    title: "Style",
    navGroup: "Properties",
    summary: "Selects a stylistic distribution pattern for features such as strokes.",
    args: ["solid | dashed | dotted"],
    childCommands: [],
    notes: [
      "Currently implemented on `stroke`.",
      "`dashed` can be tuned with `dash-length` and `gap-length`.",
      "`dotted` can be tuned with `dot-spacing`."
    ]
  },
  createComingSoonDoc({
    id: "inset",
    title: "Inset",
    navGroup: "Properties",
    summary: "Defines inset spacing for shapes or appearance passes that support inner offsets.",
    args: ["amount"],
    childCommands: []
  }),
  {
    id: "cut",
    title: "Cut",
    navGroup: "Properties",
    summary:
      "Defines chamfered corner cuts as a geometry modifier on rectangle-backed shapes.",
    args: ["cut", "top-left", "top-right", "bottom-right", "bottom-left"],
    childCommands: [],
    notes: [
      "`cut 4` applies the same cut value to every corner.",
      "`cut 4 4 8 8` uses `top-left top-right bottom-right bottom-left` order.",
      "Expanded named corner values are also supported.",
      "The first slice currently affects the rectangle fill silhouette."
    ],
    examples: [
      {
        id: "cut-uniform",
        title: "Uniform Cut",
        summary: "A single cut value creates the same chamfer size on every corner.",
        source: [
          "sprite cut-uniform-demo",
          "  size 128 64",
          "  background #0f1318",
          "",
          "// Uniform chamfered panel",
          "rect 16 12 96 40 #18242c",
          "  cut 8"
        ].join("\n")
      },
      {
        id: "cut-four-values",
        title: "Four-Value Shorthand",
        summary: "Each corner can be specified inline in clockwise order when asymmetry is useful.",
        source: [
          "sprite cut-four-demo",
          "  size 128 64",
          "  background #0f1318",
          "",
          "// Small top corners with larger lower corners",
          "rect 16 12 96 40 #18242c",
          "  cut 4 4 10 10"
        ].join("\n")
      },
      {
        id: "cut-expanded",
        title: "Expanded Named Form",
        summary: "The expanded form names each corner directly and reads clearly in larger files.",
        source: [
          "sprite cut-expanded-demo",
          "  size 128 64",
          "  background #0f1318",
          "",
          "// Named corner cuts for a more directional panel shape",
          "rect 16 12 96 40 #18242c",
          "  cut",
          "    top-left 4",
          "    top-right 8",
          "    bottom-right 12",
          "    bottom-left 8"
        ].join("\n")
      }
    ]
  },
  createComingSoonDoc({
    id: "radius",
    title: "Radius",
    navGroup: "Properties",
    summary: "Defines corner radius or radial sizing for features that expose rounded geometry.",
    args: ["amount"],
    childCommands: []
  }),
  createComingSoonDoc({
    id: "alpha",
    title: "Alpha",
    navGroup: "Properties",
    summary: "Defines opacity for appearance passes where separate alpha control is useful.",
    args: ["value 0..1"],
    childCommands: []
  }),
  createComingSoonDoc({
    id: "blend",
    title: "Blend",
    navGroup: "Properties",
    summary: "Selects a blend mode for later richer compositing behavior.",
    args: ["mode"],
    childCommands: []
  }),
  createComingSoonDoc({
    id: "group",
    title: "Group",
    navGroup: "Structure",
    summary: "Collects child commands into a structural group for future composition and transforms.",
    args: ["optional name"],
    childCommands: ["geometry", "appearance", "mask", "draw"]
  }),
  createComingSoonDoc({
    id: "mask",
    title: "Mask",
    navGroup: "Structure",
    summary: "Clips arbitrary child drawing using an explicit mask region rather than implicit shape coverage.",
    args: ["optional name"],
    childCommands: ["draw", "geometry", "appearance"],
    notes: ["Planned mask modes include intersect, subtract, replace, and add."]
  }),
  createComingSoonDoc({
    id: "draw",
    title: "Draw",
    navGroup: "Structure",
    summary: "Holds explicit child drawing under a structural parent such as a mask or reusable path block.",
    args: [],
    childCommands: ["plot", "line", "rect", "rect-inset", "cut-rect", "rounded-rect", "circle", "polygon", "path"]
  }),
  createComingSoonDoc({
    id: "vars",
    title: "Vars",
    navGroup: "Structure",
    summary: "Defines future named values or reusable variables for larger sprite sources.",
    args: [],
    childCommands: ["variable definitions"]
  })
];

const pages: PageDefinition[] = [
  experimentalPage,
  ...exampleDocs.map((doc) => ({
    id: doc.id,
    kind: "example" as const,
    doc
  }))
];

const pageById = new Map(pages.map((page) => [page.id, page]));
const allPlaygrounds = pages.flatMap((page) =>
  page.kind === "playground" ? page.examples : (page.doc.examples ?? [])
);
const sourceState = new Map(
  allPlaygrounds.map((playground) => [playground.id, playground.source])
);

const shell = document.createElement("main");
const sidebar = document.createElement("aside");
const brand = document.createElement("div");
const brandTitle = document.createElement("h1");
const brandMeta = document.createElement("p");
const nav = document.createElement("nav");
const navPrimary = document.createElement("div");
const navExamples = document.createElement("div");
const navExamplesHeader = document.createElement("p");
const content = document.createElement("section");

shell.style.cssText =
  "display: grid; grid-template-columns: minmax(220px, 260px) minmax(0, 1fr); min-height: 100vh; color: #f4efe6; font-family: Consolas, 'Courier New', monospace;";
document.body.style.cssText = "margin: 0; background: #141311; min-height: 100vh;";
sidebar.style.cssText =
  "border-right: 1px solid rgba(255,255,255,0.08); background: linear-gradient(180deg, #161412 0%, #1d1a18 100%); padding: 24px 18px;";
brand.style.marginBottom = "28px";
brandTitle.textContent = "Radebe";
brandTitle.style.cssText = "margin: 0 0 8px; font-size: 1.6rem; letter-spacing: 0.04em;";
brandMeta.textContent = "Language workbench";
brandMeta.style.cssText = "margin: 0; color: #b7ab99; font-size: 0.95rem;";
nav.style.cssText = "display: grid; gap: 18px;";
navPrimary.style.cssText = "display: grid; gap: 8px;";
navExamples.style.cssText = "display: grid; gap: 8px;";
navExamplesHeader.textContent = "Examples";
navExamplesHeader.style.cssText =
  "margin: 0 0 4px; color: #d4c6b0; font-size: 0.88rem; text-transform: uppercase; letter-spacing: 0.08em;";
content.style.cssText = "padding: 28px 32px 40px; min-width: 0;";

brand.append(brandTitle, brandMeta);
navExamples.append(navExamplesHeader);
nav.append(navPrimary, navExamples);
sidebar.append(brand, nav);
shell.append(sidebar, content);
app.append(shell);

function createNavLink(
  pageId: string,
  label: string,
  indent = false,
  comingSoon = false
): HTMLElement {
  const item = comingSoon
    ? document.createElement("span")
    : document.createElement("a");

  if (item instanceof HTMLAnchorElement) {
    item.href = `#/${pageId}`;
    item.dataset.pageId = pageId;
  }

  item.textContent = comingSoon ? `${label} (Coming Soon)` : label;
  item.style.cssText = [
    "display: block",
    "padding: 10px 12px",
    "border: 1px solid rgba(255,255,255,0.08)",
    "text-decoration: none",
    indent ? "margin-left: 14px" : "",
    comingSoon
      ? "color: #8e8476; background: rgba(255,255,255,0.015); border-color: rgba(255,255,255,0.05); cursor: not-allowed; opacity: 0.65"
      : "color: #efe6d9; background: rgba(255,255,255,0.02)"
  ]
    .filter(Boolean)
    .join("; ");

  if (comingSoon) {
    item.setAttribute("aria-disabled", "true");
  }

  return item;
}

navPrimary.append(createNavLink("experimental", "Experimental"));
let currentGroup = "";
exampleDocs.forEach((doc) => {
  if (doc.navGroup !== currentGroup) {
    currentGroup = doc.navGroup;
    const groupHeader = document.createElement("p");
    groupHeader.textContent = currentGroup;
    groupHeader.style.cssText =
      "margin: 8px 0 2px 14px; color: #bba88a; font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.08em;";
    navExamples.append(groupHeader);
  }

  navExamples.append(createNavLink(doc.id, doc.title, true, doc.comingSoon === true));
});

function getCurrentPageId(): string {
  const hash = window.location.hash.trim();
  const pageId = hash.startsWith("#/") ? hash.slice(2) : "";
  return pageById.has(pageId) ? pageId : "experimental";
}

function setActiveNav(pageId: string): void {
  sidebar.querySelectorAll<HTMLAnchorElement>("a[data-page-id]").forEach((link) => {
    const isActive = link.dataset.pageId === pageId;
    link.style.background = isActive ? "#28231e" : "rgba(255,255,255,0.02)";
    link.style.borderColor = isActive
      ? "rgba(255,255,255,0.18)"
      : "rgba(255,255,255,0.08)";
    link.style.color = isActive ? "#fff8ef" : "#efe6d9";
  });
}

function createInfoList(title: string, items: string[]): HTMLElement {
  const section = document.createElement("section");
  const heading = document.createElement("h3");
  const list = document.createElement("ul");

  section.style.cssText =
    "border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); padding: 16px;";
  heading.textContent = title;
  heading.style.cssText = "margin: 0 0 12px; font-size: 1rem;";
  list.style.cssText = "margin: 0; padding-left: 18px; color: #d9cfbf;";

  items.forEach((item) => {
    const line = document.createElement("li");
    line.textContent = item;
    line.style.marginBottom = "8px";
    list.append(line);
  });

  section.append(heading, list);
  return section;
}

function createPlayground(playground: ExamplePlayground): HTMLElement {
  const section = document.createElement("section");
  const heading = document.createElement("h3");
  const summary = document.createElement("p");
  const layout = document.createElement("section");
  const editorPanel = document.createElement("article");
  const previewPanel = document.createElement("article");
  const sourceLabel = document.createElement("label");
  const sourceInput = document.createElement("textarea");
  const status = document.createElement("p");
  const previewLabel = document.createElement("h4");
  const previewMeta = document.createElement("p");
  const previewToolbar = document.createElement("div");
  const zoomLabel = document.createElement("label");
  const zoomSelect = document.createElement("select");
  const diagnosticsLabel = document.createElement("h4");
  const diagnosticsOutput = document.createElement("pre");
  const spriteViewport = document.createElement("div");
  const spriteSurface = document.createElement("div");
  const spriteCanvas = document.createElement("canvas");
  let currentArtifactSize = { width: 1, height: 1 };

  section.style.cssText = "display: grid; gap: 14px; margin-bottom: 28px;";
  heading.textContent = playground.title;
  heading.style.cssText = "margin: 0; font-size: 1.2rem;";
  summary.textContent = playground.summary;
  summary.style.cssText = "margin: 0; color: #d2c7b4; max-width: 72ch; line-height: 1.5;";
  layout.style.cssText =
    "display: grid; gap: 20px; grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr); align-items: start;";
  editorPanel.style.cssText =
    "border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); padding: 18px; min-width: 0;";
  previewPanel.style.cssText =
    "border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); padding: 18px; min-width: 0;";
  sourceLabel.textContent = "Source";
  sourceLabel.style.cssText = "display: block; margin-bottom: 12px; color: #fff3e1;";
  sourceInput.value = sourceState.get(playground.id) ?? "";
  sourceInput.setAttribute("spellcheck", "false");
  sourceInput.style.cssText =
    "width: 100%; min-height: 320px; resize: vertical; box-sizing: border-box; border: 1px solid rgba(255,255,255,0.12); background: #12110f; color: #f8f4ec; padding: 14px; font: inherit;";
  status.style.cssText = "margin: 0; color: #cbbda7;";
  previewLabel.textContent = "Preview";
  previewLabel.style.cssText = "margin: 0;";
  previewMeta.style.cssText = "margin: 0; color: #cbbda7;";
  previewToolbar.style.cssText =
    "display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 0 0 16px;";
  zoomLabel.textContent = "Zoom";
  zoomLabel.style.cssText =
    "display: inline-flex; align-items: center; gap: 8px; color: #d2c7b4; font-size: 0.95rem;";
  zoomSelect.style.cssText =
    "border: 1px solid rgba(255,255,255,0.12); background: #12110f; color: #f8f4ec; padding: 6px 12px; font: inherit;";
  [
    { value: "fit", label: "Fit" },
    { value: "1", label: "1x" },
    { value: "2", label: "2x" },
    { value: "4", label: "4x" },
    { value: "8", label: "8x" }
  ].forEach((option) => {
    const element = document.createElement("option");
    element.value = option.value;
    element.textContent = option.label;
    zoomSelect.append(element);
  });
  zoomSelect.value = "fit";
  diagnosticsLabel.textContent = "Diagnostics";
  diagnosticsLabel.style.cssText = "margin: 0 0 8px;";
  diagnosticsOutput.style.cssText =
    "margin: 0; min-height: 88px; white-space: pre-wrap; background: #191613; color: #ffcf99; padding: 14px; overflow: auto;";
  spriteViewport.style.cssText =
    "display: flex; align-items: center; justify-content: center; min-height: 180px; max-height: min(60vh, 520px); margin: 0 0 18px; padding: 20px; background: #1a1917; border: 1px solid rgba(255,255,255,0.08); overflow: hidden;";
  spriteSurface.style.cssText =
    "display: inline-flex; align-items: stretch; justify-content: stretch; flex: 0 0 auto; background: linear-gradient(45deg, rgba(255,255,255,0.12) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.12) 75%), linear-gradient(45deg, rgba(255,255,255,0.12) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.12) 75%), #100f0d; background-size: 16px 16px; background-position: 0 0, 8px 8px; box-shadow: 0 18px 40px rgba(0,0,0,0.35);";
  spriteCanvas.style.cssText =
    "display: block; image-rendering: pixelated; image-rendering: crisp-edges;";

  function applyCanvasScale(width: number, height: number): void {
    currentArtifactSize = {
      width: Math.max(width, 1),
      height: Math.max(height, 1)
    };

    let scale = Number.parseInt(zoomSelect.value, 10);

    if (zoomSelect.value === "fit") {
      const viewportWidth = Math.max(spriteViewport.clientWidth - 40, 1);
      const viewportHeight = Math.max(spriteViewport.clientHeight - 40, 1);
      scale = Math.max(
        Math.min(
          Math.floor(
            Math.min(
              viewportWidth / currentArtifactSize.width,
              viewportHeight / currentArtifactSize.height
            )
          ),
          32
        ),
        1
      );
    }

    spriteCanvas.style.width = `${currentArtifactSize.width * scale}px`;
    spriteCanvas.style.height = `${currentArtifactSize.height * scale}px`;
    spriteSurface.style.width = spriteCanvas.style.width;
    spriteSurface.style.height = spriteCanvas.style.height;
  }

  function drawCheckerboardFallback(width: number, height: number): void {
    const context = spriteCanvas.getContext("2d");

    if (!context) {
      return;
    }

    context.clearRect(0, 0, width, height);
    context.fillStyle = "#151311";
    context.fillRect(0, 0, width, height);
  }

  function drawSprite(
    pixels: (string | null)[][],
    width: number,
    height: number,
    background: string
  ): void {
    spriteCanvas.width = Math.max(width, 1);
    spriteCanvas.height = Math.max(height, 1);
    applyCanvasScale(width, height);

    const context = spriteCanvas.getContext("2d");

    if (!context) {
      return;
    }

    context.clearRect(0, 0, spriteCanvas.width, spriteCanvas.height);

    if (background !== "transparent") {
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);
    }

    pixels.forEach((row, y) => {
      row.forEach((pixel, x) => {
        if (pixel === null) {
          return;
        }

        context.fillStyle = pixel;
        context.fillRect(x, y, 1, 1);
      });
    });
  }

  function updatePreview(source: string): void {
    const result = renderSource({ source });
    const diagnosticsText = result.diagnostics
      .map((diagnostic) => {
        const location =
          diagnostic.line === undefined
            ? diagnostic.stage
            : `${diagnostic.stage}:${diagnostic.line}:${diagnostic.column ?? 1}`;

        return `${location} ${diagnostic.message}`;
      })
      .join("\n");

    status.textContent = `Parsed ${result.parsed.commands.length} root command(s), compiled ${result.compiled.commands.length} draw command(s).`;
    previewMeta.textContent = `Artifact: ${result.artifact.kind} ${result.artifact.width}x${result.artifact.height} background=${result.artifact.background}`;
    diagnosticsOutput.textContent =
      diagnosticsText === "" ? "(no diagnostics)" : diagnosticsText;

    if (result.artifact.width === 0 || result.artifact.height === 0) {
      applyCanvasScale(1, 1);
      drawCheckerboardFallback(1, 1);
    } else {
      drawSprite(
        result.artifact.pixels,
        result.artifact.width,
        result.artifact.height,
        result.artifact.background
      );
    }
  }

  sourceInput.addEventListener("input", () => {
    sourceState.set(playground.id, sourceInput.value);
    updatePreview(sourceInput.value);
  });

  zoomSelect.addEventListener("change", () => {
    applyCanvasScale(currentArtifactSize.width, currentArtifactSize.height);
  });

  new ResizeObserver(() => {
    if (zoomSelect.value === "fit") {
      applyCanvasScale(currentArtifactSize.width, currentArtifactSize.height);
    }
  }).observe(spriteViewport);

  sourceLabel.append(sourceInput);
  editorPanel.append(sourceLabel, status);
  zoomLabel.append(zoomSelect);
  previewToolbar.append(previewMeta, zoomLabel);
  spriteSurface.append(spriteCanvas);
  spriteViewport.append(spriteSurface);
  previewPanel.append(
    previewLabel,
    previewToolbar,
    spriteViewport,
    diagnosticsLabel,
    diagnosticsOutput
  );
  layout.append(editorPanel, previewPanel);
  section.append(heading, summary, layout);

  updatePreview(sourceInput.value);
  return section;
}

function renderExperimentalPage(page: Extract<PageDefinition, { kind: "playground" }>): void {
  const hero = document.createElement("section");
  const title = document.createElement("h2");
  const summary = document.createElement("p");
  const note = document.createElement("p");

  hero.style.cssText = "margin-bottom: 24px;";
  title.textContent = page.title;
  title.style.cssText = "margin: 0 0 12px; font-size: 2rem;";
  summary.textContent = page.summary;
  summary.style.cssText =
    "margin: 0 0 10px; max-width: 72ch; color: #d8cdbf; line-height: 1.6;";
  note.textContent =
    "When new commands land, they should appear here quickly and then get a dedicated example page once the behavior settles.";
  note.style.cssText = "margin: 0; color: #af9f88;";

  hero.append(title, summary, note);
  content.append(hero, ...page.examples.map((example) => createPlayground(example)));
}

function renderExamplePage(page: Extract<PageDefinition, { kind: "example" }>): void {
  const hero = document.createElement("section");
  const title = document.createElement("h2");
  const summary = document.createElement("p");
  const infoGrid = document.createElement("section");

  hero.style.cssText = "margin-bottom: 24px;";
  title.textContent = page.doc.title;
  title.style.cssText = "margin: 0 0 12px; font-size: 2rem;";
  summary.textContent = page.doc.summary;
  summary.style.cssText =
    "margin: 0; max-width: 72ch; color: #d8cdbf; line-height: 1.6;";
  infoGrid.style.cssText =
    "display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin: 0 0 24px;";

  hero.append(title, summary);
  infoGrid.append(
    createInfoList("Arguments", page.doc.args),
    createInfoList(
      "Child Commands",
      page.doc.childCommands.length === 0
        ? ["No structural child commands."]
        : page.doc.childCommands
    ),
    createInfoList("Notes", page.doc.notes)
  );

  if (page.doc.comingSoon) {
    const placeholder = document.createElement("section");
    const label = document.createElement("p");
    const body = document.createElement("p");

    placeholder.style.cssText =
      "border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); padding: 20px;";
    label.textContent = "Coming Soon";
    label.style.cssText =
      "margin: 0 0 10px; color: #fff3e1; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 0.08em;";
    body.textContent =
      "This feature is listed in the product direction but does not have a shared-core implementation yet. When it lands, this page will gain live editable examples like the implemented pages.";
    body.style.cssText = "margin: 0; color: #d2c7b4; line-height: 1.6; max-width: 72ch;";

    placeholder.append(label, body);
    content.append(hero, infoGrid, placeholder);
    return;
  }

  content.append(
    hero,
    infoGrid,
    ...(page.doc.examples ?? []).map((example) => createPlayground(example))
  );
}

function renderPage(): void {
  const pageId = getCurrentPageId();
  const page = pageById.get(pageId) ?? pages[0];

  setActiveNav(page.id);
  content.replaceChildren();

  if (page.kind === "playground") {
    renderExperimentalPage(page);
    return;
  }

  renderExamplePage(page);
}

window.addEventListener("hashchange", renderPage);

if (!window.location.hash) {
  window.location.hash = "#/experimental";
}

renderPage();
