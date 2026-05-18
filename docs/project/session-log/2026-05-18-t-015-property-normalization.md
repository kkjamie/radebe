# Session Log: T-015 Property Normalization

Date: `2026-05-18`
Thread: `t-015-property-normalization`

## Scope
- Add a schema-driven normalization rule so command properties can be expressed as canonical child property commands, named inline args, or ordered positional inline args.

## Work Completed
- Extended `radebe-core/src/schema.ts` with explicit `propertyArgs` metadata and reusable single-value property command definitions such as `color`, `x`, `y`, `x1`, `y1`, `x2`, `y2`, `width`, `height`, and `name`.
- Updated the compiler to resolve properties through one shared path that merges positional shorthand, named inline args, and child property commands into a single normalized property bag.
- Preserved the intended rule that expanded child forms are command-based, for example `color white`, rather than allowing bare child values.
- Added duplicate-value diagnostics when a command mixes forms and provides the same property more than once.
- Added coverage proving the current slice accepts mixed forms such as `sprite -> name`, `size -> width/height`, `line -> x2/y2/color`, and `plot -> x/y/color`.

## Verification
- Ran `npm run build` at the repo root successfully.
- Ran `npm test` at the repo root successfully.

## Notes
- This lays the right foundation for upcoming commands like `rect-absolute` and `rect-inset`, because new commands can opt into the same syntax rule without ad hoc compiler work.
- The canonical expanded form remains child property commands, not bare child literals.

## Next Recommendation
- Implement `rect-absolute` next so the richer syntax rule immediately pays off on a more substantial drawing primitive before returning to Unity.
