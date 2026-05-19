# Main Thread State

Owner: `Main Thread`
Last updated: `2026-05-19`

## Current Milestone / Gate
- Milestone: `M2`
- Gate: `Gate C`
- Status: `Not Started`

## Current Focus
- The recovered source product spec is now reflected in code through an indentation-aware command tree, a schema-backed compiler registry, a small `sprite` header block with nested `size` and `background` properties, root-level `plot`, `line`, `rect`, `rect-absolute`, `rect-inset`, and `circle` commands, generic property normalization across positional inline args, named inline args, and child property commands, plus actual `fill` / `solid` / explicit `gradient-linear` / explicit `gradient-radial` appearance commands while `gradient` remains the compatibility alias for the linear form.
- `fill` and `stroke` now also support explicit `alpha` properties as per-pass opacity multipliers; they default to `1`, multiply with any alpha already present in solid colors or gradient stop colors, and do not implicitly flow into nested child strokes.
- Rectangle geometry now also supports `cut` and `radius` as child geometry modifiers on rectangle-backed shapes, with `cut` covering chamfered corners, `radius` covering rounded corners, and the current compiler intentionally rejecting both on the same rectangle until a richer mixed-corner model exists.
- Geometry commands can now opt into shared shape appearance children through a `shape-appearance` capability path in the schema, and the compiler collects those `fill` / `stroke` children through a shared appearance pass instead of per-shape child wiring.
- Rectangle-backed `stroke` is now available as the first generated-region appearance slice, including `stroke <width> <color>` shorthand, optional `align`, optional `style`, rectangle rendering for `solid`, `dashed`, and `dotted` styles, nested child `stroke` support on the generated stroke envelope, and modifier-aware contour following for `cut` and `radius`.
- `circle` is now available as the first non-rectangular shape primitive using integer `x`, `y`, and `radius` geometry plus color shorthand or explicit `fill`, and it now also participates in the shared `stroke` model.
- `polygon` is now available as a shared-shape geometry primitive using either flat whitespace-separated `x y` point pairs or canonical child `point` commands, plus color shorthand or explicit `fill`, and it now also participates in the shared `stroke` model while still keeping polygon syntax on the existing whitespace token model.
- `path` is now available as a stroke-first open polyline primitive using canonical child `point` commands and required `stroke`; the first slice intentionally limits path to `stroke` align `center` and does not yet treat paths as fillable or closable regions.
- Source comments now use hash-prefixed lines only. The parser ignores lines whose trimmed text starts with `#`; `//` is no longer a comment marker and will be parsed as ordinary source.
- The shared `radebe-core` / `radebe-cli` / `radebe-web` path remains intact, the SEA smoke path still exercises the same spec-aligned sample contract, and the web shell has grown into a left-nav docs/playground surface with an experimental page plus per-feature example pages that now support multiple editable live scenarios on a single page.
- The web source editor now keeps native textarea editing while rendering a synchronized syntax-highlight layer for comments, command tokens, property-command child args, named argument keys, argument values, and unknown command tokens.
- The web examples now fold cut and rounded-corner rectangle cases into the main `rect` page instead of keeping separate `cut` or `rounded-rect` pages, and `polygon` now has real live examples instead of a placeholder page.
- `radebe-web` now has a Vite resolver config that maps `@radebe/core` and its exported subpaths to `radebe-core/src` for web dev/build bundling, so `npm run dev:web` no longer requires a pre-existing `radebe-core/dist`.
- M2 Gate A and Gate B now have deeper end-to-end evidence. The next recommended execution step is returning to Unity validation with the richer modifier-aware stroke slice unless a different language increment clearly outranks that checkpoint.

## Open Decisions / Blockers
- No M1 blocker remains; the shared core/web render contract, workspace build, workspace tests, and CLI SEA smoke path all pass in the current environment.
- No active blocker remains on the language or web-dev tooling side. The main open execution step is choosing between deeper path semantics and Unity-side revalidation of the packaged CLI bridge against the richer source syntax.

## Best Next Tasks
1. Re-exercise the packaged Unity CLI bridge with the current richer geometry set, now including strokable `polygon` and stroke-first `path`.
2. If Unity Gate C is intentionally deferred again, choose the next geometry follow-up between deeper path semantics and further contour refinement.
3. Continue widening the capability-driven shape model after the Unity checkpoint is re-established.

## Resume Checklist
1. Read the latest `docs/project/session-log/*.md`.
2. Verify consistency across `task-board`, `roadmap`, `milestone`, and `decisions`.
3. Select the next best unblocked objective.
