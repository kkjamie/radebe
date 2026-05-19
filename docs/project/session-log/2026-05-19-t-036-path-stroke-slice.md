# Session Log: T-036 Path Stroke Slice

Date: `2026-05-19`
Thread: `t-036-path-stroke-slice`

## Scope
- Add the first real `path` implementation to the shared language loop.
- Keep the first path slice stroke-first, matching the decision that open paths are only visible through `stroke`.
- Update tests, docs, and project state around the new path behavior.

## Work Completed
- Added `path` as a root-allowed geometry command in the schema.
- Implemented the first `path` compiler slice as:
  - optional `name`
  - canonical child `point` commands
  - required `stroke`
  - at least two points
  - rejection of consecutive duplicate points
  - restriction to `stroke` align `center` for now
- Added renderer support for stroked open paths by sampling distance to the nearest path segment and applying the existing stroke style, alpha, and gradient fill rules across a path-local stroke bounds box.
- Added core coverage for:
  - compiling stroke-only paths
  - rejecting invisible stroke-less paths
  - rendering stroked open paths
- Replaced the web docs placeholder path page with real live examples and notes describing the stroke-first open-polyline semantics.
- Updated roadmap, milestone, decisions, task board, main-thread state, and product spec to reflect that `path` now exists as a stroke-first primitive.

## Verification
- Ran `npm run build` successfully.
- Ran `npm test` successfully.

## Notes
- The first path slice intentionally uses child `point` commands instead of inline shorthand so optional naming and ordered polyline authoring stay unambiguous.
- This is an open path primitive only. Closing, fillable contour behavior, winding rules, reusable path references, and non-center alignment remain future work.

## Next Recommendation
- Return to M2 Gate C and re-exercise the packaged CLI bridge from Unity against the richer geometry set, now including `path`, unless deeper path semantics clearly outrank that checkpoint.
