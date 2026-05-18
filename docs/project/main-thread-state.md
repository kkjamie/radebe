# Main Thread State

Owner: `Main Thread`
Last updated: `2026-05-18`

## Current Milestone / Gate
- Milestone: `M2`
- Gate: `Gate C`
- Status: `Not Started`

## Current Focus
- The recovered source product spec is now reflected in code through an indentation-aware command tree, a schema-backed compiler registry, a small `sprite` header block with nested `size` and `background` properties, root-level `plot`, `line`, `rect`, `rect-absolute`, and `rect-inset` commands, generic property normalization across positional inline args, named inline args, and child property commands, plus actual `fill` / `solid` / explicit `gradient-linear` / explicit `gradient-radial` appearance commands while `gradient` remains the compatibility alias for the linear form.
- `fill` and `stroke` now also support explicit `alpha` properties as per-pass opacity multipliers; they default to `1`, multiply with any alpha already present in solid colors or gradient stop colors, and do not implicitly flow into nested child strokes.
- Rectangle geometry now also supports `cut` and `radius` as child geometry modifiers on rectangle-backed shapes, with `cut` covering chamfered corners, `radius` covering rounded corners, and the current compiler intentionally rejecting both on the same rectangle until a richer mixed-corner model exists.
- Rectangle-backed `stroke` is now available as the first generated-region appearance slice, including `stroke <width> <color>` shorthand, optional `align`, optional `style`, rectangle rendering for `solid`, `dashed`, and `dotted` styles, and nested child `stroke` support on the generated stroke envelope.
- Source comments now use hash-prefixed lines only. The parser ignores lines whose trimmed text starts with `#`; `//` is no longer a comment marker and will be parsed as ordinary source.
- The shared `radebe-core` / `radebe-cli` / `radebe-web` path remains intact, the SEA smoke path still exercises the same spec-aligned sample contract, and the web shell has grown into a left-nav docs/playground surface with an experimental page plus per-feature example pages that now support multiple editable live scenarios on a single page.
- The web source editor now keeps native textarea editing while rendering a synchronized syntax-highlight layer for comments, command tokens, property-command child args, named argument keys, argument values, and unknown command tokens.
- The web examples now fold cut and rounded-corner rectangle cases into the main `rect` page instead of keeping separate `cut` or `rounded-rect` pages, which matches the implemented rectangle-plus-modifier model more closely.
- `radebe-web` now has a Vite resolver config that maps `@radebe/core` and its exported subpaths to `radebe-core/src` for web dev/build bundling, so `npm run dev:web` no longer requires a pre-existing `radebe-core/dist`.
- M2 Gate A and Gate B now have deeper end-to-end evidence. The next recommended implementation step is still to add one or two richer geometry or stroke commands on top of the current fill model before returning to Unity validation.

## Open Decisions / Blockers
- No M1 blocker remains; the shared core/web render contract, workspace build, workspace tests, and CLI SEA smoke path all pass in the current environment.
- No active blocker remains on the language or web-dev tooling side. The main open execution step is choosing the next command increment before Unity-side revalidation of the packaged CLI bridge against the richer source syntax.

## Best Next Tasks
1. Make `stroke` respect modifier-aware silhouettes so rectangle-backed strokes can follow `cut` and `radius` shapes instead of the plain rectangle envelope.
2. Follow with another shape or appearance feature that benefits directly from the new rectangle, cut, radius, fill, and recursive stroke foundations.
3. Return to Unity bridge validation after that slightly richer language slice is stable through core, CLI, web, and SEA smoke coverage.

## Resume Checklist
1. Read the latest `docs/project/session-log/*.md`.
2. Verify consistency across `task-board`, `roadmap`, `milestone`, and `decisions`.
3. Select the next best unblocked objective.
