# Session Log: T-023 Nested Stroke

Date: `2026-05-18`
Thread: `t-023-nested-stroke`

## Scope
- Allow `stroke` to contain child `stroke` nodes so outline treatments can recurse within the same appearance model.

## Work Completed
- Extended the `stroke` schema so it accepts nested child `stroke` commands.
- Updated the stroke compiler to preserve nested stroke trees and to allow a stroke node to exist with either:
  - a shorthand color / fill
  - one fill child
  - one or more nested child strokes
- Updated the rectangle-backed stroke renderer to recurse over the generated stroke envelope rectangle.
- Added a nested stroke example to the `Stroke` page in `radebe-web`.

## Verification
- Ran `npm run build` at the repo root successfully.
- Ran `npm test` at the repo root successfully.

## Notes
- This first recursion pass still treats nested stroke as operating on the parent stroke envelope, not a mathematically exact stroked-ring contour boundary.
- That tradeoff keeps the model aligned with the intended language direction while staying within the current rectangle-backed renderer scope.

## Next Recommendation
- Add a `rect-outline` convenience alias or go straight into `cut-rect`, then return to Unity validation once the next feature settles.
