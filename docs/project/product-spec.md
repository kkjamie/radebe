# Product Spec

Owner: `Main Thread`
Last updated: `2026-05-18`

## Product Summary
- Radebe is a language and toolchain for authoring procedural UI sprites as text-first source files that compile into raster outputs and optional metadata.
- The initial use case is crisp sci-fi and game UI sprites built from pixel-perfect lines, rectangles, angled cuts, fills, strokes, overlays, and later masks, patterns, gradients, and noise.
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
- Treat shapes as implicit coverage regions for their own fills and overlays.
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

## Command Categories
The language distinguishes between five semantic command categories:

- Header commands: define overall file and sprite properties.
- Property commands: configure the current node.
- Geometry commands: define geometry generators.
- Appearance commands: add renderable appearance passes.
- Structural commands: create hierarchy, ownership, or layout scope.

Examples:

```text
Header Commands:
  sprite
  size
  background

Property Commands:
  inset
  width
  height
  align
  cut
  radius
  alpha
  blend

Geometry Commands:
  plot
  line
  rect
  rect-inset
  rect-absolute
  cut-rect
  rounded-rect
  circle
  polygon

Appearance Commands:
  fill
  overlay
  stroke
  shadow

Structural Commands:
  shape
  group
  mask
  path
  draw
  vars
```

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

cut-rect:
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

## Geometry Model
Geometry defines coverage or edges.

Initial geometry types discussed in the recovered spec and current direction:
- `plot <x> <y> <color>`
- `line <x1> <y1> <x2> <y2> <color>`
- `rect-inset <amount>`
- `rect-absolute <x> <y> <w> <h>`
- `path <name?>`
- `shape <name?>`
- `cut-rect`

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
- `overlay`
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

Longer term, strokes should behave like generated shapes that can themselves carry fill, overlay, and nested stroke passes.

## Mask Model
- Every shape has implicit coverage for its own fill and overlays.
- Explicit masks are for clipping arbitrary child drawing commands.
- Planned mask modes include `intersect`, `subtract`, `replace`, and `add`.

Example:

```text
mask body-mask
  shape
    cut-rect
    rect-inset 6
    cut 12

  draw
    line
      from -20 20
      to 280 20
      stroke
        width 1
        fill
          solid white
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
- `OverlayNoise`
- `OverlayPattern`
- `OverlayGradient`

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
- polygon fills
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
- The next language implementation work should align to the recovered sprite-oriented MVP slice, starting from a small `sprite` header block plus root-level `plot` and `line` commands.

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
