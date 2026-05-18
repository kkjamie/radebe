# Session Log: T-012 Spec-Aligned Language Slice

Date: `2026-05-18`
Thread: `t-012-spec-aligned-language-slice`

## Scope
- Replace the speculative `@text` / `@repeat` implementation with the canonical sprite-oriented MVP slice.
- Support a small `sprite` header block with nested file properties and root-level draw commands.
- Preserve the shared `radebe-core` / `radebe-cli` / `radebe-web` path while deferring Unity return until after the realignment is stable.

## Work Completed
- Replaced the flat line-oriented parser path in `radebe-core` with an indentation-aware command tree that ignores blank lines and comment lines, preserves root versus child structure, and reports indentation diagnostics.
- Introduced a first schema registry in `radebe-core/src/schema.ts` so command kinds, shorthand argument order, and allowed-child rules live outside the parser.
- Rebuilt the compiler around the schema-backed model and added a spec-aligned compiled document shape with a `sprite` header plus root `plot` and `line` draw commands.
- Implemented the first real rasterization slice by rendering into a shared sprite-grid artifact with dimensions, background, ASCII rows, and per-pixel color data.
- Updated `radebe-cli` to emit sprite-grid rows and compiler diagnostics for the new source shape.
- Updated `radebe-web` to start from a spec-aligned sample and preview both the pixel grid and the shared ASCII artifact rows.
- Updated the SEA smoke path so the packaged CLI is exercised with the same spec-aligned sample rather than the old plain-text assumption.
- Replaced the prior tests with coverage for the indentation tree, schema validation, sprite header compilation, `plot`, `line`, CLI output, and SEA smoke behavior.

## Verification
- Ran `npm run build` at the repo root successfully.
- Ran `npm test` at the repo root successfully.

## Notes
- The renderer artifact is still intentionally lightweight for fast CLI/web feedback, but it now reflects sprite dimensions and pixel data instead of the old plain-text row expansion model.
- Unity validation remains intentionally deferred; the next thread should only re-exercise the packaged CLI bridge against the new contract rather than widen language scope again.

## Next Recommendation
- Start the next worker on T-011 to validate the packaged Unity bridge against the spec-aligned `sprite` header plus root-level `plot` and `line` slice.
