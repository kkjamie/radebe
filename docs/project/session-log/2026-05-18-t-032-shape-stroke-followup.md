# Session Log: T-032 Shape Stroke Follow-Up

Date: `2026-05-18`
Thread: `t-032-shape-stroke-followup`

## Scope
- Move shape appearance attachment closer to the intended capability-based schema model.
- Extend the shared `stroke` command to `circle`.
- Keep docs, tests, and project state aligned with the new architecture boundary.

## Work Completed
- Added schema-level capability matching through a shared `shape-appearance` capability.
- Updated rectangle and circle geometry definitions so they opt into shape appearance children through capability matching rather than per-command `fill` / `stroke` allow-lists.
- Kept rectangle-only geometry modifiers (`cut` and `radius`) explicit on rectangle-backed commands.
- Refactored the compiler so shape appearance children are collected through one shared appearance pass instead of separate per-shape `fill` handling.
- Extended `circle` to compile `stroke` children alongside `fill`.
- Added circle stroke rendering with support for:
  - shorthand or expanded stroke configuration
  - `inside` / `center` / `outside` alignment
  - `solid`, `dashed`, and `dotted` styles
  - nested child strokes
  - gradient-filled stroke regions through the existing fill variants
- Added core coverage for:
  - compiling circle strokes through the shared appearance model
  - rejecting empty circles without fill or stroke coverage
  - rasterizing solid circle strokes
  - basic dashed circle stroke behavior
- Updated the web docs/playground so the `circle` page now documents and demonstrates stroke usage.
- Updated roadmap, milestone, task board, decisions, main-thread state, and product spec entries to reflect the capability-driven appearance path.

## Verification
- Ran `npm run build` successfully.
- Ran `npm test` successfully.

## Notes
- The schema is now more capability-driven at the shape-appearance layer, but renderer contour logic is still geometry-specific where needed.
- Rectangle-backed strokes still follow the rectangle envelope rather than the final `cut` or `radius` silhouette, which remains the biggest fidelity gap in the current stroke model.

## Next Recommendation
- Make rectangle-backed `stroke` contour-aware for `cut` and `radius`, or move to Unity Gate C revalidation if the current geometry/appearance slice feels sufficient for that checkpoint.
