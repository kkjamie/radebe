# Product Spec

Owner: `Main Thread`
Last updated: `2026-05-21`

## Product Summary
- Radebe is a language and toolchain for authoring procedural UI sprites as text-first source files that compile into raster outputs and optional metadata.
- The initial use case is crisp sci-fi and game UI sprites built from pixel-perfect lines, rectangles, angled cuts, fills, strokes, and later masks, patterns, gradients, and noise.
- The core value proposition is one canonical implementation that powers authoring, validation, rendering, browser preview, CLI compilation, and downstream engine integration without divergent logic.

## Core Experience Goals
- Make sprite authoring practical from both developer tooling and interactive authoring surfaces.
- Keep the core engine reusable so every integration consumes the same parsing, semantic validation, and rendering behavior.
- Support easy embedding in external tools, especially Unity, without requiring a separate runtime implementation.

## Core Principles
- Text-first authoring.
- Deterministic output.
- Pixel-perfect by default.
- Easy to parse.
- Engine-agnostic core.
- Stable intermediate representation.
- Simple features early, extensible renderer later.
- Separate geometry from appearance.
- Treat shapes as implicit coverage regions for their own fills.
- Use explicit masks only when clipping arbitrary child drawing.
- Compile advanced effects into normal render commands rather than parser-specific hacks.

## Canonical File Format
- Do not treat the source extension as permanently locked yet.
- A short project-specific extension such as `.rdb` is currently preferred over `.uis`, but the extension is a convention rather than a semantic requirement.
- Primary artifact targets:
  - raster images such as `.png`
  - diagnostics/errors
  - optional metadata such as sprite dimensions, borders, labels, and engine-facing import hints

## Language Overview
- The language is indentation-based.
- Each non-comment line is one command.
- Indentation defines ownership and scope.
- Arguments provide shorthand configuration for the current command.
- Blank lines are ignored.
- Comments start with `#`.
- The file begins with a small `sprite` header block for overall file properties.
- Actual draw commands should be allowed at root indentation after the header block so authoring stays flatter and easier to scan.

Example:

```text
sprite sci-fi-button
  size 256 64
  background transparent

plot 4 4 #d8f8ff
line 8 8 240 8 #70c8e8
```

## Syntax Rules
- Canonical command form is `command-name arg1 arg2 arg3`.
- Prefer explicit normalized commands such as `rect-inset 6`, `rect-absolute 0 0 128 64`, and `line-to 20 30`.
- Avoid overloaded function-style syntax such as `rect(inset: 6)` or `lineTo(20, 30)`.
- A command may terminate on the same line or own an indented child block.

## Structural Rules
- `newline` means a new command.
- `indentation` means child ownership or scope.
- `arguments` are shorthand for the current command.

Compact and expanded forms are semantically equivalent when a command schema allows shorthand expansion.

The `sprite` command is treated as a header block rather than a requirement that every draw command be nested under one structural parent.

Compact:

```text
sprite panel
  size 128 32
  background transparent

plot 4 4 white
line 8 8 120 8 #70c8e8
```

Expanded:

```text
sprite panel
  size 128 32
  background transparent

plot x=4 y=4 color=white
line x1=8 y1=8 x2=120 y2=8 color=#70c8e8
```

## Positional and Named Arguments
- Commands may define positional shorthand arguments in a canonical order.
- Named arguments may appear in any order.
- Only commands with explicit shorthand schemas may consume positional arguments.
- Commands without shorthand must use explicit child commands for configuration.

Examples:

```text
plot 4 4 #ffffff
```

Equivalent to:

```text
plot x=4 y=4 color=#ffffff
```

```text
line 8 8 120 8 #70c8e8
```

Equivalent to:

```text
line x1=8 y1=8 x2=120 y2=8 color=#70c8e8
```

## Command Categories And Author Vocabulary
The implementation schema still uses broad command kinds such as `header`, `property`, `geometry`, `appearance`, and `structural`, but author-facing docs should use more specific vocabulary:

- Header commands: define file or sprite metadata. Examples: `sprite`, `size`, `background`.
- Declarations: define reusable source-level values without drawing. Examples: `var`, `vars`.
- Drawable commands: produce pixels directly or define a drawable region. Examples: `plot`, `line`, `rect`, `circle`, `polygon`, `path`, `group`.
- Pixel primitives: simple drawable commands that do not expose a reusable filled region. Current examples: `plot`, `line`.
- Shape drawables: drawable commands with a coverage region that can receive fills, strokes, and effects. Current examples: `rect`, `rect-inset`, `rect-absolute`, `circle`, `polygon`, and composited `group` blocks when they have group-level passes.
- Path drawables: edge-oriented drawables that are currently visible through strokes rather than fills. Current example: `path`.
- Geometry modifiers: change a shape drawable's coverage before it is painted. Current examples: `cut`, `radius`.
- Property commands: expanded child forms for command configuration or arguments. Examples: `x`, `y`, `width`, `height`, `align`, `alpha`, `antialias`.
- Appearance passes: paint a drawable region. Current examples: `fill`, `stroke`.
- Effect passes: derive pixels from a drawable region or composited layer. Current example: `shadow`; future examples include `glow` and blur-like effects. The current schema may still classify effects under the broad `appearance` command kind until a separate internal kind is useful.
- Structural containers: create hierarchy, ownership, or scope. Current examples: `group`, `vars`; planned examples include mask containers.
- Mask shape: the child container under a future `mask` command that defines clipping coverage.
- Masked content: the child container under a future `mask` command that contains the drawables clipped by the mask.

Use these terms consistently in product docs, web reference docs, diagnostics, autocomplete details, and editor help.

## Ordering Model
The language should not silently reorder child commands whose source order appears meaningful.

Arguments on the parent command line are command configuration and conceptually apply before child phases. Expanded child property commands are the child-block form of the same configuration.

Planned compiler restrictions:
- For shape drawables, property commands and geometry modifiers should come before appearance or effect passes.
- Once a shape child block starts appearance or effect passes, later geometry modifiers or property commands should produce a focused diagnostic.
- For composited groups, child drawables and nested groups should come before group-level appearance or effect passes.
- Once a composited group starts group-level appearance or effect passes, later group content should produce a focused diagnostic; authors can use nested groups for staged behavior.
- For future masks, `shape` should define the mask region and `content` should define the clipped drawables, with names and ordering documented in the web reference.

Examples:

```text
rect 0 0 100 100
  cut 10
  fill solid black
```

Preferred over:

```text
rect 0 0 100 100
  fill solid black
  cut 10
```

Group-level effects should follow content:

```text
group badge
  rect 8 8 80 32 #101820
  circle 24 24 10 #18242c
  stroke 2 #70c8e8
  shadow 2 2 black
```

If staged effects are needed, use nested groups rather than relying on the compiler to apply an effect to "the group so far."

## Command Schema and Child Capability Model
- The parser should remain generic and structurally simple.
- Semantic meaning should be resolved through a command schema registry rather than hard-coded parser behavior.
- Parent commands should validate children through capability groups and optional explicit command allow-lists.
- The file itself should expose top-level capability rules so header commands and root drawing commands can be validated without inventing a fake wrapper node for the whole document.

Suggested command definition structure:

```text
CommandDefinition
  name
  kind
  propertyArgs
  allowedChildKinds
  allowedChildCommands
  shorthandSchema
  semanticBuilder
```

Validation rule:

```text
child.name explicitly allowed
OR
child.kind allowed by parent
```

This makes the language extensible: new geometry or appearance commands can become valid under existing parents if they advertise the right capability kind.

Example:

```text
file:
  allows:
    commands:
      - sprite
      - plot
      - line
      - rect-fill
      - rect-outline
      - shape
      - mask
      - path

sprite:
  kind: header
  allows:
    commands:
      - size
      - background

shape:
  allows:
    kinds:
      - geometry
      - appearance

plot:
  kind: geometry

line:
  kind: geometry

rect:
  kind: geometry

fill:
  kind: appearance

stroke:
  kind: appearance
```

If `hex-rect` is later introduced with `kind: geometry`, it becomes valid under `shape` without rewriting the `shape` schema.

## Parser and Semantic Pipeline
The canonical pipeline is:

```text
Source Text
  -> Tokens
  -> Indented Command Tree
  -> AST
  -> Semantic Nodes
  -> Resolved Draw Commands
  -> Raster Output
  -> Metadata Output
```

Parser responsibilities:
- command names
- positional args
- named args
- indentation
- child ownership

Parser non-responsibilities:
- command-specific semantics
- shorthand expansion behavior
- child capability validation
- renderer-specific behavior

Those belong to the schema registry and semantic resolver.

## Coordinate Model
- `0,0` is the top-left corner.
- `x` increases right.
- `y` increases down.
- Planned symbolic values:
  - `left`
  - `right`
  - `top`
  - `bottom`
  - `width`
  - `height`
  - `center-x`
  - `center-y`
- Planned expressions include forms such as `left+8`, `right-8`, and `bottom-12`.
- MVP may start with integer coordinates only.

## Variables
- `var` defines a file-scoped reusable value for later commands.
- `var` may appear at the file root after the `sprite` header and before or between draw commands.
- `vars` is an optional structural grouping command for multiple `var` children.
- Variables resolve top-to-bottom and must be defined before use.
- The current implementation supports whole-token references such as `$accent`, including named argument values like `color=$accent`.
- Embedded expression references such as `left+$pad` are intentionally deferred until the expression system lands.

Examples:

```text
sprite panel
  size 128 48
  background transparent

var pad 6
var accent #70c8e8
var panel-fill #101820

rect-inset $pad $panel-fill
  stroke 2 $accent
```

```text
sprite panel
  size 128 48
  background transparent

vars
  var pad 6
  var accent #70c8e8
  var panel-fill #101820

rect-inset $pad $panel-fill
  stroke 2 $accent
```

## Groups
- `group` is a structural command for collecting related draw commands.
- Groups without group-level passes are transparent ordering containers.
- Groups with group-level `fill`, `stroke`, or `shadow` render child drawables into an offscreen layer, use the combined alpha/pixels as the group drawable, apply those passes, then composite the result back into the parent.
- A group may have an optional name for authoring clarity and future tooling.
- Groups accept root-style draw commands, nested groups, and group-level `fill`, `shadow`, and `stroke` passes.
- Group child drawables and nested groups must come before group-level appearance or effect passes; use nested groups for staged behavior.
- Group-level alpha, blend modes, masks, filters, blur, and transforms are intentionally deferred.
- Group-level appearance and effect passes should not act as inherited defaults for children. If authors need staged effects, they should use nested groups.

Example:

```text
sprite panel
  size 128 48
  background transparent

group frame
  rect-inset 6 #101820
    stroke 2 #70c8e8

group highlights
  line 16 14 112 14 white
```

Composited group example:

```text
group badge
  rect 8 8 80 32 #101820
  circle 24 24 10 #18242c
  polygon 70 12 88 24 70 36 #18242c
  stroke 2 #70c8e8
  shadow 2 2 black
```

## Geometry Model
Geometry defines coverage or edges.

Initial geometry types discussed in the recovered spec and current direction:
- `plot <x> <y> <color>`
- `line <x1> <y1> <x2> <y2> <color>`
- `rect <x> <y> <w> <h>`
- `rect-inset <amount>`
- `rect-absolute <x> <y> <w> <h>`
- `circle <x> <y> <radius>`
- `polygon <x1> <y1> <x2> <y2> <x3> <y3> ...`
- `polygon` with child `point <x> <y>`
- `rect` with child `cut` or child `radius`
- `path <name?>`
- `path` with child `point <x> <y>` and child `stroke`
- `shape <name?>`

Example:

```text
plot 4 4 #ffffff
line 8 8 120 8 #70c8e8
```

## Appearance Model
Geometry and appearance are separate.

A shape may produce:
- fill region
- stroke region
- clip or mask region for child drawing

Initial appearance commands:
- `fill`
- `stroke`

Example fill:

```text
fill
  solid #18242c
```

Example stroke:

```text
stroke
  width 2
  align center
  fill
    solid white
```

Stroke alignment values:
- `inside`
- `center`
- `outside`

Longer term, strokes should behave like generated shapes that can themselves carry fill and nested stroke passes.

## Mask Model
- Every shape has implicit coverage for its own fill.
- Explicit masks are for clipping arbitrary child drawing commands.
- Planned mask modes include `intersect`, `subtract`, `replace`, and `add`.
- Planned mask containers use `shape` for the clipping region and `content` for the clipped drawables.

Example:

```text
mask body-mask
  shape
    rect-inset 6
      cut 12
    circle 32 32 10

  content
    group hatch-lines
      line -20 20 280 20 white
      line -20 28 280 28 white
```

## Renderer Concepts
The renderer should operate on resolved draw commands, not raw parsed nodes.

Recovered core render command concepts:
- `Clear`
- `PlotPixel`
- `LineStroke`
- `RectFill`
- `RectStroke`
- `PathFill`
- `PathStroke`
- `PushMask`
- `PopMask`
- `NoisePass`
- `PatternPass`
- `GradientPass`

Longer term, these may unify under a richer renderable-region model, but the early compiler should prefer explicit, easy-to-validate draw commands.

## Rasterization Rules
MVP rasterization rules:
- no anti-aliasing
- integer pixel coordinates
- horizontal, vertical, and 45-degree lines first
- square caps
- transparent backgrounds supported
- alpha blending supported

Deferred features:
- anti-aliasing
- stroke joins
- stroke caps
- arbitrary line angles
- path winding rules
- subpixel coordinates

## Recovered MVP Language Slice
The recovered spec's minimum useful language slice is sprite-oriented rather than text-grid oriented, and the current preferred authoring shape uses a small `sprite` header block followed by root-level draw commands.

Example:

```text
sprite test-button
  size 128 32
  background transparent

plot 4 4 #ffffff
plot 5 4 #ffffff
line 8 8 120 8 #70c8e8
```

Recovered MVP command set:
- `sprite`
- `size`
- `background`
- `plot`
- `line`

The next commands after the initial MVP slice are likely to include:
- `rect-fill`
- `rect-outline`
- `rect-inset`
- `rect-absolute`
- `fill`
- `solid`
- `stroke`
- `width`
- `align`

Recovered MVP outputs:
- `.png`
- diagnostics
- optional metadata JSON

## Advanced Example

```text
sprite sci-fi-panel
  size 256 96
  background transparent

plot 12 12 #ffffff
line 16 24 220 24 #70c8e8
```

## Packaging and Integration Direction
- Keep local development on the shared TypeScript workspace.
- Package `radebe-cli` as a standalone executable for Unity and other non-Node consumers.
- Keep Unity integration on the CLI bridge path rather than creating a separate runtime implementation.
- Preserve an engine-agnostic core with optional raster metadata that downstream tools can consume.

## Current Implementation Notes
- The current repo already has a shared TypeScript core, CLI, web preview shell, and Unity CLI bridge baseline.
- The current browser preview artifact is a temporary text-grid artifact used for fast feedback, not the recovered canonical end-state product output.
- The current `@text` and `@repeat` command syntax in the codebase is not part of the recovered canonical language design.
- The current Unity import baseline treats `.rdb` files as source assets, invokes the packaged CLI with `compile <file> --format unity-json`, and imports the resulting `unity-sprite` artifact into generated Unity `Texture2D` and `Sprite` subassets.
- The current implemented geometry set now includes a small `sprite` header block plus root-level `plot`, `line`, `rect`, `rect-absolute`, `rect-inset`, `circle`, `polygon`, and stroke-first `path` commands.
- The current implemented appearance slice includes `fill` with `solid`, `gradient-linear`, and `gradient-radial` variants, explicit per-pass `alpha`, and a shared shape-level `fill` / `stroke` child model driven by schema capability matching.
- The current implemented appearance slice also includes hard-edged `shadow` on rectangle-backed shapes, circles, polygons, and composited groups with `x`, `y`, `spread`, explicit per-pass `alpha`, and either color shorthand or nested `fill`; `blur` remains deferred.
- The current implemented structural slice includes file-scoped `var` declarations and optional `vars` grouping blocks for whole-token value reuse, plus `group` containers for ordering nested draw commands; groups stay transparent without group-level passes and become composited layer drawables when they include group-level `fill`, `stroke`, or hard-edged `shadow`.
- The current stroke renderer supports rectangle-backed, circle-backed, polygon-backed, and open path shapes, and rectangle-backed stroke now follows `cut` and `radius` contours instead of only the plain rectangle envelope.
- The current renderer supports optional real output antialiasing through a sprite-level `antialias` default and per-geometry overrides, defaulting to pixel-perfect `false` when omitted.

## Important Non-Goals for MVP
- full SVG compatibility
- curves
- anti-aliasing
- arbitrary transforms
- text rendering
- boolean geometry
- complex blend modes
- GUI editor
- runtime Unity rendering
