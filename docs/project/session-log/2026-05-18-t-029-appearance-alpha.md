# Session Log: T-029 Appearance Alpha

Date: `2026-05-18`
Thread: `t-029-appearance-alpha`

## Scope
- Add explicit `alpha` support on `fill` and `stroke` appearance passes.
- Keep alpha non-inherited so nested child strokes stay explicit.
- Make pass alpha multiply with any alpha already present in solid colors and gradient stop colors.

## Work Completed
- Extended the schema registry so `fill` accepts `alpha` and `stroke` accepts `alpha` alongside its existing properties.
- Updated compiled fill and stroke types to carry explicit alpha values.
- Updated the compiler so:
  - fill alpha defaults to `1`
  - stroke alpha defaults to `1`
  - rectangle color shorthand still lowers into a solid fill with alpha `1`
  - stroke color shorthand still lowers into a solid fill with alpha `1`
  - fill alpha can be authored in child-property form and inline named form
- Updated the renderer so fill alpha and stroke alpha multiply with parsed color alpha before blending into the sprite grid.
- Preserved explicit nesting semantics so parent stroke alpha does not automatically affect nested child strokes.
- Added compiler and renderer coverage for:
  - fill alpha on gradient fills
  - stroke alpha
  - fill-alpha times gradient-stop alpha multiplication
  - explicit nested-stroke non-inheritance
- Replaced the placeholder web docs entry for `alpha` with a real docs page and live examples.

## Verification
- Ran `npm test` successfully.
- Ran `npm run build` successfully.

## Notes
- This first slice intentionally keeps alpha on appearance passes rather than geometry nodes.
- Shape-level or group-level opacity would be a different future semantic because it implies subtree-style compositing behavior rather than simple per-pass alpha multiplication.

## Next Recommendation
- Make rectangle-backed `stroke` respect cut-modified silhouettes so fill and stroke share the same chamfered contour.
