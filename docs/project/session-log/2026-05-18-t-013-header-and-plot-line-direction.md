# Session Log: T-013 Header And Plot/Line Direction

Date: `2026-05-18`
Thread: `t-013-header-and-plot-line-direction`

## Scope
- Refine the recovered product spec around the preferred file shape and first concrete commands.
- Capture the updated language direction in the canonical docs and prepare the next implementation prompt.

## Work Completed
- Updated the canonical product spec so the source file extension is no longer treated as fixed, with `.rdb` noted as a tentative short-form preference rather than a hard rule.
- Refined the language structure so `sprite` is treated as a small header block for overall file properties such as `size` and `background`.
- Updated the canonical authoring model so actual draw commands sit at root indentation after the header block rather than being nested under `sprite`.
- Changed the first intended implementation slice to `plot x y color` followed by `line x1 y1 x2 y2 color`.
- Updated the recovered language examples, command categories, schema notes, roadmap, milestone, task board, and main-thread state to reflect the flatter authoring model.
- Logged a new decision superseding the earlier `.uis`-oriented recovery direction with the header-plus-root-command direction.

## Verification
- Documentation-only thread; no build or test commands were required.

## Notes
- The schema-driven parser/semantic split remains intact. The main change is the top-level file model and the first concrete command sequence.
- The current code still contains speculative `@text` / `@repeat` behavior and remains implementation drift until a follow-up implementation thread replaces it.

## Next Recommendation
- Start the next worker on a spec-aligned implementation slice for the `sprite` header, `plot`, and `line` commands.
