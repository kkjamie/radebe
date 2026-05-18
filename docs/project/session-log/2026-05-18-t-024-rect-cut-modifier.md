# Session Log: T-024 Rect Cut Modifier

Date: `2026-05-18`
Thread: `t-024-rect-cut-modifier`

## Scope
- Add `cut` as a child geometry modifier on rectangle-backed shapes and expose the chosen shape model in the web examples.

## Work Completed
- Extended the rectangle schema so `rect`, `rect-absolute`, and `rect-inset` accept a child `cut` command.
- Implemented `cut` parsing with:
  - uniform shorthand: `cut 4`
  - four-value shorthand: `cut 4 4 8 8`
  - expanded named corner values using `top-left`, `top-right`, `bottom-right`, and `bottom-left`
- Added compiler validation so cut values still leave valid space within the rectangle bounds.
- Updated rectangle fill rendering so the shape silhouette is clipped by the resolved cut polygon.
- Reworked the web docs to document `cut` as the implemented feature and remove the earlier `cut-rect` direction from the active examples surface.

## Verification
- Ran `npm run build` at the repo root successfully.
- Ran `npm test` at the repo root successfully.

## Notes
- The first `cut` slice currently changes the filled rectangle silhouette directly.
- Rectangle-backed `stroke` still follows the rectangle envelope rather than the cut-modified contour; that is a sensible next refinement if we want cut panels and outline treatments to align perfectly.

## Next Recommendation
- Make `stroke` respect cut-modified silhouettes next, or add a smaller `rect-outline` convenience alias before moving on to another distinct shape.
