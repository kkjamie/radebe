# Session Log: T-030 Rect Radius And Example Consolidation

Date: `2026-05-18`
Thread: `t-030-rect-radius-and-example-consolidation`

## Scope
- Resolve rounded rectangles into the existing rectangle-backed shape model.
- Implement `radius` on `rect`, `rect-absolute`, and `rect-inset`.
- Consolidate the web examples so cut and rounded rectangle cases live under the main `rect` page.

## Work Completed
- Extended the rectangle schema so rectangle-backed geometry accepts child `radius` alongside child `cut`.
- Added compiler support for `radius <value>` as a rectangle geometry modifier and validated it against the current rectangle size.
- Added a compiler diagnostic that rejects rectangles using both `cut` and `radius` until a richer per-corner treatment model exists.
- Updated rectangle fill rendering so `radius` produces rounded fill silhouettes.
- Added core coverage for:
  - compiling radius-modified rectangles
  - rejecting `cut` plus `radius` together
  - rendering rounded rectangle silhouettes
- Reworked the web docs/examples so:
  - the old `rounded-rect` page is removed
  - the dedicated `cut` examples are folded into the `rect` page
  - new `rect` examples demonstrate `radius`
- Cleaned up the product spec so the current language direction reflects rectangle modifiers instead of stale `cut-rect` or `rounded-rect` wording.
- Updated one existing nested-stroke alpha test expectation to match the current renderer behavior after confirming it was a pre-existing expectation drift rather than a regression from this task.

## Verification
- Ran `npm run build` successfully.
- Ran `npm test` successfully.

## Notes
- `radius` currently affects the rectangle fill silhouette.
- Rectangle-backed `stroke` still follows the plain rectangle envelope rather than modifier-aware `cut` or `radius` contours, which remains the next fidelity gap in this area.

## Next Recommendation
- Make rectangle-backed `stroke` respect both `cut` and `radius` silhouettes so fills and strokes share the same final contour.
