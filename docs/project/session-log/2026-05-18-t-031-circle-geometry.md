# Session Log: T-031 Circle Geometry

Date: `2026-05-18`
Thread: `t-031-circle-geometry`

## Scope
- Add the first `circle` geometry primitive through the shared core/compiler/renderer pipeline.
- Reuse the existing fill model so circles support color shorthand plus explicit `fill` variants.
- Replace the web docs placeholder with live editable circle examples.

## Work Completed
- Extended the root schema so `circle` is a valid top-level geometry command.
- Added compiler support for `circle` with integer `x`, `y`, and `radius` properties plus color shorthand lowering into an implicit solid fill.
- Kept the first circle slice intentionally fill-first: circles currently accept explicit `fill` children, but not circle-specific `stroke` yet.
- Reused the existing `solid`, `gradient-linear`, and `gradient-radial` fill variants for circle rendering by sampling those fills across the circle bounds.
- Adjusted circle rasterization so integer center coordinates map to the addressed pixel center for more intuitive authoring.
- Added core test coverage for:
  - compiling shorthand and expanded circle forms
  - rejecting circles with no fill coverage
  - rasterizing solid circles
  - rasterizing gradient-filled circles
- Replaced the `circle` "Coming Soon" page in `radebe-web` with live examples and added a circle glow sample to the experimental page.
- Updated project docs and decision records so the new shape boundary is explicit for the next thread.

## Verification
- Ran `npm run build` successfully.
- Ran `npm test` successfully.

## Notes
- The first `circle` slice shares the current fill model with rectangles, which keeps authoring and renderer behavior consistent.
- Circle-specific `stroke` support is still intentionally deferred; the only existing stroke implementation remains rectangle-backed.
- The current filled-circle raster footprint follows the renderer's discrete Euclidean coverage rule, which produces a crisp pixel-art disc rather than a maximally wide flood-filled blob.

## Next Recommendation
- Decide whether the next shape pass should add circle-aware stroke support or make rectangle-backed strokes follow `cut` and `radius` silhouettes first.
