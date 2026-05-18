# Procedural UI Sprite Authoring Tool — Specification & Implementation Plan

## 1. Goal

Build a lightweight text-based tool for authoring procedural UI sprites.

The tool should allow sprites to be described using a small indentation-based command language, then compiled into raster images such as PNGs and optional metadata for engines such as Unity.

The initial use case is crisp sci-fi/game UI sprites made mostly from pixel-perfect lines, rectangles, angled cuts, fills, strokes, overlays, and later masks, patterns, gradients and noise.

The tool should not initially be a full SVG replacement. It should be a focused sprite recipe compiler.

---

## 2. Core Principles

- Text-first authoring.
- Deterministic output.
- Pixel-perfect by default.
- Easy to parse.
- Engine-agnostic core.
- Stable intermediate representation.
- Simple features early, extensible renderer later.
- Geometry and appearance should be separated.
- Shapes implicitly define coverage regions.
- Explicit masks are only needed when clipping arbitrary child drawing.
- Advanced effects should compile into normal render commands, not special parser hacks.

---

## 3. Possible Tech Stacks

### Option A: TypeScript / Node

Best for tool authoring and preview workflow.

Benefits:

- Easy CLI.
- Easy file watching.
- Easy browser preview.
- Great text tooling.
- Can later build a web-based editor.
- Engine-agnostic by default.

Possible outputs:

- `.png`
- `.json` metadata
- diagnostics/errors
- preview HTML

Unity bridge:

- Unity watches/imports generated PNGs.
- Unity reads metadata JSON.
- Unity applies sprite settings, pixels-per-unit, borders, labels.

### Option B: C# / .NET

Best for direct Unity integration.

Benefits:

- Easy to consume from Unity.
- Shared language/runtime with game code.
- Strong typing.
- Good for Unity importers and editor windows.
- CLI still possible via .NET console app.

Possible structure:

- `UiSprite.Core`
- `UiSprite.Cli`
- `UiSprite.Unity`

Recommendation for now:

Keep the specification tech-agnostic. Design the compiler as:

```text
Source Text
  -> Lexer/Parser
  -> AST
  -> Semantic Model
  -> Resolved Draw Commands
  -> Raster Output
  -> Metadata Output
```

---

## 4. File Format Overview

Working extension name:

```text
.uis
```

Example:

```text
sprite sci-fi-button
  size 256 64
  clear transparent

  shape body
    cut-rect
    rect-inset 6
    cut 12

    fill
      solid #17242c

    overlay gradient-vertical
      from #263b45
      to transparent
      alpha 0.35

    overlay noise
      amount 0.05
      scale 8
      seed 42

    stroke
      width 2
      align center
      fill
        solid #d8f8ff

  shape inner-frame
    rect-inset 14

    stroke
      width 1
      align inside
      fill
        solid #70c8e8
```

---

## 5. Syntax Rules

The language is indentation-based.

Each line is a command:

```text
command-name arg1 arg2 arg3
```

Indented lines belong to the previous command.

Comments:

```text
// comment
# comment
```

Blank lines are ignored.

Commands should be normalized and explicit.

Prefer:

```text
rect-inset 6
rect-absolute 0 0 128 64
line-to 20 30
```

Avoid overloaded function-style syntax:

```text
rect(inset: 6)
lineTo(20, 30)
```

### Structural Rules

The language uses a simple structural model:

```text
Newline = new command
Indentation = ownership/scope
Arguments = shorthand configuration for the current command
```

Commands may either:

- terminate on the same line
- or own an indented child block

Example:

```text
shape panel
  rect 4
  fill solid #18242c
  stroke 1 white
```

Equivalent expanded form:

```text
shape panel
  rect inset=4

  fill
    solid #18242c

  stroke
    width 1
    fill
      solid white
```

The compact form is shorthand expansion, not a different semantic structure.

### Positional vs Named Arguments

Commands may define positional shorthand arguments.

Example:

```text
cut-rect 6 12
```

Equivalent to:

```text
cut-rect inset=6 cut=12
```

And:

```text
stroke 2 white
```

Equivalent to:

```text
stroke
  width 2
  fill white
```

Named arguments may appear in any order:

```text
stroke width=2 fill=white align=outside
```

Positional arguments should follow the canonical command-defined order.

### Command Schemas

Shorthand is explicitly schema-driven.

Only commands that define shorthand rules may consume positional arguments.

Examples:

```text
fill black
stroke 2 white
stroke 2 dashed inside white
cut-rect 6 12
rect 4
```

Commands without shorthand must use explicit child commands.

This is invalid:

```text
shape body cut-rect 6 12 fill black stroke 2 white
```

This is valid:

```text
shape body
  cut-rect 6 12
  fill black
  stroke 2 white
```

### Properties vs Structural Children

Some child commands are properties/configuration.

Others are structural/render children.

Property/configuration commands may be expressed either inline or as child commands.

Example:

```text
rect inset=4
```

Equivalent to:

```text
rect
  inset 4
```

Because `inset` is a property/configuration command.

However render and structural commands are not treated as properties.

This is valid:

```text
shape body
  rect inset=4
  stroke 2 white
```

But this is invalid:

```text
shape body rect inset=4 stroke 2 white
```

The semantic distinction is:

```text
Property Commands
  configure the current node

Geometry Commands
  define geometry generators

Render Commands
  add renderable appearance passes

Structural Commands
  create hierarchy/scope/layout
```

Examples:

```text
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
  rect
  cut-rect
  rounded-rect
  circle
  polygon

Render Commands:
  fill
  overlay
  stroke
  shadow

Structural Commands:
  shape
  group
  mask
  path
```

### Command Groups and Child Capabilities

Command schemas should support both explicit child commands and child capability groups.

This avoids every command needing to list every possible child command.

Example:

```text
shape:
  allows:
    - geometry
    - appearance
    - layout-child
```

Commands then declare their kind/capability:

```text
rect:
  kind: geometry

cut-rect:
  kind: geometry

fill:
  kind: appearance

stroke:
  kind: appearance

shape:
  kind: layout-child
```

This allows new geometry/render commands to work automatically anywhere that accepts that capability group.

Example:

```text
hex-rect:
  kind: geometry
```

would automatically become valid under:

```text
shape
```

without modifying the `shape` schema.

Schemas may combine both capability groups and explicit commands:

```text
allows:
  kinds:
    - geometry
    - appearance

  commands:
    - vars
    - debug-bounds
```

Suggested schema structure:

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

The semantic resolver validates children using:

```text
child.name explicitly allowed
OR
child.kind allowed by parent
```

### Parser Architecture

The parser itself should remain structurally simple.

The parser only understands:

```text
- command names
- positional args
- named args
- indentation
- child ownership
```

It produces a generic command tree.

Semantic meaning is resolved later using command schema definitions.

Example parsed structure:

```text
stroke 2 white
  overlay noise amount=0.04
```

Produces:

```text
CommandNode
  name: "stroke"
  args: ["2", "white"]
  children:
    CommandNode
      name: "overlay"
      args: ["noise"]
      named:
        amount: "0.04"
```

Command schemas define:

```text
- allowed child commands
- positional arg mappings
- named arg types
- shorthand expansions
- validation rules
```

Example:

```text
stroke:
  positional:
    0 -> width
    1 -> fill
    2 -> align
    3 -> style

  allowedChildren:
    - fill
    - overlay
    - stroke
```

The parser should not contain command-specific logic.

All command semantics should be data-driven through the schema registry.

---

## 6. Coordinate Model

Initial coordinate system:

```text
0,0 = top-left
x increases right
y increases down
```

Built-in symbolic values:

```text
left
right
top
bottom
width
height
center-x
center-y
```

Expressions should eventually support simple arithmetic:

```text
left+8
right-8
center-x
bottom-12
```

MVP can start with integers only.

---

## 7. Geometry Model

Geometry describes coverage or edges.

Initial geometry types:

```text
rect-inset <amount>
rect-absolute <x> <y> <w> <h>
line <name?>
path <name?>
shape <name?>
cut-rect
```

Examples:

```text
shape panel
  rect-inset 4
```

```text
shape panel
  cut-rect
  rect-inset 6
  cut 12
```

```text
path tab
  move-to 8 0
  line-to 120 0
  line-to 128 8
  line-to 128 32
  line-to 0 32
  line-to 0 8
  close
```

---

## 8. Appearance Model

Geometry and appearance are separate.

A shape can produce:

```text
fill region
stroke region
child clip/mask region
```

Appearance commands include:

```text
fill
overlay
stroke
```

### Fill

Fills the inside coverage of the current shape.

```text
fill
  solid #18242c
```

Later:

```text
fill
  gradient-vertical #18242c #304c58
```

### Overlay

Paints or modifies pixels inside the current coverage.

```text
overlay noise
  amount 0.06
  scale 10
  blend overlay
```

```text
overlay pattern diagonal-stripes
  color white
  alpha 0.12
  spacing 4
```

### Stroke

Stroke is not automatically clipped to the fill region.

```text
stroke
  width 2
  align center
  fill
    solid white
```

Stroke alignment:

```text
inside
center
outside
```

A stroke should eventually behave like its own generated shape, meaning it can have:

```text
fill
overlay
stroke
```

Example:

```text
stroke
  width 4
  align outside

  fill
    gradient-horizontal #70c8e8 #d8f8ff

  overlay noise
    amount 0.04

  stroke
    width 1
    align center
    fill
      solid white
```

---

## 9. Masks

Every shape has implicit coverage for its own fill and overlays.

Explicit masks are for clipping arbitrary child drawing commands.

Example:

```text
mask body-mask
  shape
    cut-rect
    rect-inset 6
    cut 12

  draw
    rect-fill
      rect-inset 0
      fill
        gradient-vertical #18242c #304c58

    line
      from -20 20
      to 280 20
      stroke
        width 1
        fill
          solid white
```

Meaning:

```text
Create mask from cut-rect.
Draw child commands.
Clip child output to mask coverage.
```

Mask modes, later:

```text
mode intersect
mode subtract
mode replace
mode add
```

---

## 10. Intermediate Representation

The parser should not render.

Suggested pipeline:

```text
Source Text
  -> Tokens
  -> Indented Command Tree
  -> AST
  -> Semantic Nodes
  -> Resolved Draw Commands
  -> Rasterizer
```

### Command Tree

Example source:

```text
shape body
  cut-rect
  rect-inset 6
  cut 12
  fill
    solid #18242c
```

Parsed tree:

```text
CommandNode: shape ["body"]
  CommandNode: cut-rect []
  CommandNode: rect-inset ["6"]
  CommandNode: cut ["12"]
  CommandNode: fill []
    CommandNode: solid ["#18242c"]
```

### Semantic Node

```text
ShapeNode
  name: body
  geometry: CutRectGeometry
    rect: RectInset(6)
    cut: 12
  appearances:
    Fill(Solid(#18242c))
```

### Resolved Draw Commands

At render size `256x64`:

```text
PathFill(path: CutRect(6,6,244,52,cut:12), fill: Solid(#18242c))
```

---

## 11. Renderer Concepts

The renderer should work from resolved commands only.

Core command types:

```text
Clear
RectFill
RectStroke
LineStroke
PathFill
PathStroke
PushMask
PopMask
OverlayNoise
OverlayPattern
OverlayGradient
```

Long-term, these can be unified under:

```text
RenderableRegion
  geometry
  fill stack
  overlay stack
  stroke stack
  children
```

But MVP should use simple explicit commands.

---

## 12. Rasterization Rules

MVP:

- No anti-aliasing.
- Integer pixel coordinates.
- Horizontal, vertical and 45-degree lines first.
- Square caps.
- Miter/clean joins can come later.
- Transparent background supported.
- Alpha blending supported.

Later:

- Anti-aliasing.
- Stroke joins.
- Stroke caps.
- Arbitrary line angles.
- Polygon fills.
- Path winding rules.
- Subpixel coordinates.

---

## 13. MVP Language

Minimum useful version:

```text
sprite test-button
  size 128 32
  clear transparent

  line top
    from 0 0
    to 127 0
    stroke
      width 1
      fill
        solid white

  line bottom
    from 0 31
    to 127 31
    stroke
      width 1
      fill
        solid white

  rect-outline inner
    rect-inset 4
    stroke
      width 1
      fill
        solid #70c8e8
```

MVP commands:

```text
sprite
size
clear

line
from
to

rect-fill
rect-outline
rect-inset
rect-absolute

fill
solid

stroke
width
align
```

MVP output:

```text
.png
diagnostics
```

Optional MVP metadata:

```json
{
  "name": "test-button",
  "width": 128,
  "height": 32
}
```

---

## 14. Feature Roadmap

### Phase 1 — Parser Foundation

Goal:

Parse indentation-based command files into a command tree.

Tasks:

- Read source text.
- Strip comments.
- Track indentation.
- Build parent/child command tree.
- Produce useful line/column errors.
- Validate basic commands.
- Unit-test parser with sample files.

No rendering yet.

---

### Phase 2 — MVP Raster Renderer

Goal:

Generate basic crisp PNG sprites.

Tasks:

- Implement image buffer.
- Implement color parser.
- Implement clear command.
- Implement solid fill.
- Implement line stroke.
- Implement rect fill.
- Implement rect outline/stroke.
- Export PNG.
- Add CLI:

```text
uis compile input.uis --out output.png
```

---

### Phase 3 — Layout Expressions

Goal:

Allow sprites to resize without reauthoring coordinates.

Tasks:

- Add symbolic values:
  - `left`
  - `right`
  - `top`
  - `bottom`
  - `width`
  - `height`
  - `center-x`
  - `center-y`
- Add simple expressions:
  - `right-4`
  - `left+8`
  - `center-x`
- Add rect expressions:
  - `rect-inset`
  - `rect-absolute`
  - `rect-ltrb`
  - `rect-anchor`

---

### Phase 4 — Shapes and Paths

Goal:

Support irregular panels and sci-fi cuts.

Tasks:

- Add path node.
- Add move-to.
- Add line-to.
- Add close.
- Add path fill.
- Add path stroke.
- Add cut-rect convenience geometry.
- Add polygon fill rasterization.

---

### Phase 5 — Appearance Stack

Goal:

Make fills, overlays and strokes composable.

Tasks:

- Convert fill/stroke into renderable appearance nodes.
- Add gradient fills.
- Add overlay gradient.
- Add overlay noise.
- Add overlay pattern.
- Add blend modes:
  - normal
  - add
  - multiply
  - overlay, optional later
- Allow stroke to have its own fill.

---

### Phase 6 — Masks and Groups

Goal:

Clip arbitrary child drawing to masks.

Tasks:

- Add mask command.
- Add draw block.
- Add mask stack.
- Implement push/pop mask.
- Support nested masks.
- Add group command for shared alpha/blend/transform later.

---

### Phase 7 — Tooling

Goal:

Make authoring pleasant.

Tasks:

- Add CLI watch mode.
- Add diagnostics output.
- Add preview HTML or editor preview.
- Add metadata JSON.
- Add batch compilation.
- Add includes/imports.
- Add palette/variables.
- Add reusable snippets/macros.

---

### Phase 8 — Engine Bridge

Goal:

Integrate generated output with Unity.

Tasks:

- Unity asset postprocessor.
- Detect generated PNG and metadata.
- Apply sprite import settings.
- Apply pixels-per-unit.
- Apply 9-slice border metadata.
- Optional custom editor preview.
- Optional context menu: recompile selected `.uis`.

---

## 15. Example Advanced End-State File

```text
sprite sci-fi-panel
  size 256 96
  clear transparent

  vars
    edge 6
    cut 14
    pad 12

  shape body
    cut-rect
    rect-inset edge
    cut cut

    fill
      gradient-vertical #17242c #263b45

    overlay noise
      amount 0.05
      scale 8
      seed 42
      blend overlay

    overlay pattern diagonal-stripes
      color white
      alpha 0.08
      spacing 4

    stroke
      width 2
      align center
      fill
        gradient-horizontal #70c8e8 #d8f8ff

      overlay noise
        amount 0.03
        scale 4

      stroke
        width 1
        align inside
        fill
          solid white

  mask body-details
    shape
      cut-rect
      rect-inset edge
      cut cut

    draw
      line scanline
        from -20 top+24
        to right+20 top+24
        stroke
          width 1
          fill
            solid white
          alpha 0.2

      rect-fill bottom-strip
        rect-anchor bottom 12
        fill
          solid #ffffff
        alpha 0.06
```

---

## 16. First Implementation Target

The first useful vertical slice should be:

```text
Input .uis file
  -> parse command tree
  -> validate sprite/size/clear
  -> render line + rect commands
  -> write PNG
```

Example first test file:

```text
sprite button
  size 128 32
  clear transparent

  rect-outline outer
    rect-inset 0
    stroke
      width 1
      fill
        solid white

  rect-outline inner
    rect-inset 4
    stroke
      width 1
      fill
        solid #70c8e8

  line accent
    from 8 8
    to 120 8
    stroke
      width 1
      fill
        solid white
```

Expected result:

A transparent 128x32 PNG with two crisp rectangular outlines and one horizontal accent line.

---

## 17. Important Non-Goals for MVP

Do not implement these initially:

- Full SVG compatibility.
- Curves.
- Anti-aliasing.
- Arbitrary transforms.
- Text rendering.
- Boolean geometry.
- Complex blend modes.
- GUI editor.
- Runtime Unity rendering.

The first version should be a compiler, not an editor.

