# 2026-05-22 Preview Fit Zoom

## Scope
- Fixed `Zoom: Fit` in the shared web `Playground` so it no longer measures a preview area that was enlarged by the previous manual zoom.

## Changes
- Replaced the hard-coded `clientWidth/clientHeight - 40` fit math with a measured viewport content box that subtracts actual computed padding.
- Gave normal `.sprite-viewport` wells a stable responsive height with `height: clamp(260px, 34vh, 360px)` so small sprites have room to scale up.
- Kept immersive playground preview wells height-auto so the Try It page can continue using its full-height layout.

## Validation
- `npm run build -w @radebe/web` passes and regenerated all 6 example preview PNGs.
- The running dev server serves updated `src/playground.tsx` and `src/styles.css` with HTTP 200.

## Notes
- The intended browser behavior is that selecting Fit after 1x, 2x, 4x, or 8x uses the same preview-well dimensions and scales small sprites to a useful size instead of preserving the previous manual zoom.
- A hands-on browser pass is still useful to tune the exact responsive height if the preview feels too tall or too short.
