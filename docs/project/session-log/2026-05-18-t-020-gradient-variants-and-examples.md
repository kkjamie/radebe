# Session Log: T-020 Gradient Variants And Example Pages

Date: `2026-05-18`
Thread: `t-020-gradient-variants-and-examples`

## Scope
- Add explicit radial gradients, split gradient behavior into clearer linear vs radial variants, and upgrade the `radebe-web` example shell so each feature page can carry multiple editable live examples.

## Work Completed
- Extended the schema registry with explicit `gradient-linear` and `gradient-radial` appearance variants while keeping `gradient` as the compatibility alias for the linear form.
- Added gradient-specific property support for:
  - `direction` and `angle` on linear gradients
  - `center-x`, `center-y`, and `radius` on radial gradients
- Updated the compiler so linear and radial gradients compile into distinct fill structures while still sharing stop-based expansion and shorthand `from` / `to` handling.
- Updated the renderer so:
  - linear gradients can run horizontally, vertically, or at a custom angle
  - radial gradients sample from a normalized center and radius
  - transparent stops continue to blend correctly over earlier fills
- Expanded core coverage with compile and render tests for:
  - linear shorthand
  - vertical linear gradients
  - angled linear gradients
  - radial gradients
  - transparent gradient compositing
- Refactored `radebe-web` so example pages can show multiple editable live scenarios, then split fill docs into separate `Linear Gradient` and `Radial Gradient` pages with commented sample source.

## Verification
- Ran `npm run build` at the repo root successfully.
- Ran `npm test` at the repo root successfully.

## Notes
- `gradient` now means the linear family by default, but explicit `gradient-linear` and `gradient-radial` are preferred for clarity in docs and richer examples.
- Radial gradient positioning uses normalized rectangle space, which keeps the current language compact without introducing a larger transform system yet.

## Next Recommendation
- Implement `rect-inset` next, then move into the first stroke or outline-capable rectangle path before returning to Unity validation.
