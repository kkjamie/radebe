# Session Log: T-022 Rectangle Stroke Slice

Date: `2026-05-18`
Thread: `t-022-rectangle-stroke-slice`

## Scope
- Add the first usable `stroke` slice with shorthand width/color syntax, alignment controls, and basic style options while keeping rendering scoped to rectangle-backed shapes.

## Work Completed
- Extended the schema registry with `stroke` plus the first stroke-related property commands:
  - `align`
  - `style`
  - `dash-length`
  - `gap-length`
  - `dot-spacing`
- Implemented `stroke <width> <color>` shorthand and equivalent named/expanded forms.
- Lowered stroke color shorthand into a fill-based stroke appearance model so `stroke` still uses `fill` under the hood instead of becoming a one-off color-only feature.
- Added compiler support for rectangle-backed strokes on:
  - `rect`
  - `rect-absolute`
  - `rect-inset`
- Implemented the first renderer slice for rectangle-backed strokes with:
  - `align inside`
  - `align center`
  - `align outside`
  - `style solid`
  - `style dashed`
  - `style dotted`
- Kept `line` as its own primitive instead of redefining it as path stroke behavior.
- Added a dedicated live `Stroke` page in `radebe-web` and marked `align` / `style` as real implemented property docs instead of placeholders.

## Verification
- Ran `npm run build` at the repo root successfully.
- Ran `npm test` at the repo root successfully.

## Notes
- The first stroke slice is intentionally rectangle-backed only.
- Nested `stroke` on `stroke` is not implemented yet even though the broader language direction still points that way.
- `style dashed` and `style dotted` currently reset their cadence per rectangle side instead of tracing one continuous contour loop.

## Next Recommendation
- Either add nested stroke support next, or land a simpler `rect-outline` convenience alias before moving on to `cut-rect`.
