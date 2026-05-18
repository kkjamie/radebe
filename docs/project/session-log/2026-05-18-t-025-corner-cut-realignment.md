# Session Log: T-025 Corner Cut Realignment

Date: `2026-05-18`
Thread: `t-025-corner-cut-realignment`

## Scope
- Realign `cut` from side-based semantics to true corner-based chamfer semantics across the shared core and web example surface.

## Work Completed
- Changed the shared `RectCut` model from `top` / `right` / `bottom` / `left` to `topLeft` / `topRight` / `bottomRight` / `bottomLeft`.
- Updated the schema registry so `cut` now exposes:
  - uniform shorthand: `cut 4`
  - four-value shorthand: `cut 4 4 8 8`
  - expanded named corner values using `top-left`, `top-right`, `bottom-right`, and `bottom-left`
- Updated compiler validation so cut limits are checked per corner pair along each edge instead of per side against itself.
- Updated rectangle fill polygon generation so the rendered silhouette follows the per-corner chamfer model.
- Updated the `cut` web docs/examples so they teach corner order and named corner properties instead of side properties.
- Added core tests for both uniform and expanded named corner `cut` forms.

## Verification
- Ran `npm run build` at the repo root successfully.
- Ran `npm test` at the repo root successfully.

## Notes
- `cut` now models actual rectangle corners, which matches the intended language better and composes more cleanly with future shape modifiers.
- Rectangle-backed `stroke` still follows the rectangle envelope rather than the cut-modified contour; that is now the clearest next fidelity improvement.

## Next Recommendation
- Make `stroke` respect cut-modified silhouettes so fill and stroke agree on the same chamfered geometry.
