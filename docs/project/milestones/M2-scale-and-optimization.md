# M2 First Usable Language Loop

Milestone ID: `M2`
Title: `First Usable Language Loop`
Owner: `Main Thread`
Last updated: `2026-05-19`
Status: `In Progress`

## Outcome
- Establish basic language operation with one or two rendering commands that are usable through the shared runtime and visible in the web preview.

## Scope
- Extend `radebe-core` with one or two minimal rendering commands in the language.
- Keep `radebe-cli` aligned with the updated language behavior through the existing shared pipeline.
- Keep `radebe-web` as the fastest feedback surface for previewing the new commands and their rendered artifact output.
- Preserve the Unity bridge baseline without making full Unity vertical integration the current priority.

## Gate Definitions
| Gate | Name | Required Evidence | Status | Notes |
| --- | --- | --- | --- | --- |
| Gate A | Basic Operation | One or two rendering commands are implemented and verified through `radebe-core`, `radebe-cli`, and `radebe-web` | Passed | T-012 replaced the speculative `@text` / `@repeat` slice with a schema-backed indentation-based parser/compiler path, a small `sprite` header block, and root-level `plot`, `line`, and now filled rectangle commands with real `fill` / `solid` / `gradient` appearance support verified through workspace build and tests. |
| Gate B | Feedback Loop | The first language commands have usable diagnostics and artifact presentation for iteration in the web and CLI surfaces | Passed | The CLI now prints the shared sprite-grid rows with compiler diagnostics, the web shell paints the artifact into a real sprite stage at 1x by default with zoom controls and per-command example pages, those example pages now support multiple editable scenarios per feature, the compiler normalizes command properties across positional inline, named inline, and child property forms, `rect-absolute`, `rect`, `rect-inset`, `circle`, `polygon`, and now a stroke-first open `path` slice render through the shared artifact with explicit `fill` / `solid` / `gradient-linear` / `gradient-radial` support while `gradient` remains the linear alias, polygon authoring stays on the existing whitespace token model through flat `x y` point pairs or canonical `point` children, path authoring uses canonical `point` children plus required `stroke`, geometry commands can now opt into shared `fill` / `stroke` children through the `shape-appearance` capability path where appropriate, `fill` and `stroke` support explicit per-pass `alpha` that multiplies with color and gradient-stop transparency, circle and polygon geometry now participate in the shared stroke model, path participates in the shared stroke syntax with center alignment in its first slice, rectangle shapes support child `cut` modifiers for clipped fill silhouettes with corner-based control, rectangle-backed stroke now also follows `cut` and `radius` silhouettes instead of the plain rectangle envelope, and the SEA smoke path exercises the same spec-aligned sample. |
| Gate C | Unity Return | The packaged CLI path is exercised again from Unity after the basic command loop is stable | Not Started | Next thread should reuse the packaged CLI bridge from Unity against the richer spec-aligned sample, now including filled and stroked circles plus contour-aware rectangle stroke cases. |

Allowed status values: `Not Started`, `In Progress`, `Passed`, `Blocked`.
