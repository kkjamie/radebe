# Session Log: T-012 Product Spec Recovery

Date: `2026-05-18`
Thread: `t-012-product-spec-recovery`

## Scope
- Recover the missing product-spec content from the restored root source document.
- Fold the recovered language design, examples, and semantics back into the canonical project docs.
- Highlight meaningful drift between the recovered product spec and the current implementation/planning state.

## Work Completed
- Read the restored root source document `procedural_ui_sprite_tool_spec_and_plan.md` and treated it as the recovered source for the missing product-spec content.
- Rewrote `docs/project/product-spec.md` to restore the intended procedural UI sprite product framing, `.uis` file format, indentation-based syntax, command categories, parser/semantic pipeline, coordinate model, geometry and appearance model, mask model, rasterization rules, MVP command set, and advanced language examples.
- Restored the command-schema and child-capability model into the canonical product docs so the repo now records how parent-child legality should work and how new language commands can be added without parser-specific hacks.
- Logged a new decision that makes the `.uis` command-tree plus schema-driven semantic model canonical and supersedes the speculative `@text` / `@repeat` command decision.
- Added an inconsistency entry capturing the current implementation drift between the recovered canonical language and the speculative command slice already landed in code.
- Updated the roadmap, milestone, task board, and main-thread state to reflect that M2 Gate A is blocked again until the implementation is realigned to the recovered spec.

## Key Differences Highlighted
- The recovered spec is for a procedural UI sprite compiler, not a generic text-grid language.
- The canonical source language is `.uis`, indentation-based, and sprite-oriented around commands such as `sprite`, `size`, `clear`, `line`, `rect-outline`, `fill`, `solid`, and `stroke`.
- The intended parser is generic and structural; command behavior, shorthand, and allowed children should come from a schema registry and semantic resolver.
- The current implementation’s `@text` / `@repeat` syntax is not part of the recovered canonical language design.
- The current text-grid render artifact remains a useful preview bridge, but it is not the recovered product spec’s end-state output model, which centers on raster images plus optional metadata.

## Verification
- Documentation-only thread; no build or test commands were required.

## Notes
- Planning and phase breakdown were intentionally treated as secondary to the recovered product-language truth, but the key implementation-order differences were reflected in the roadmap and milestone state where they affect current execution.
- The restored root source document remains useful as a historical reference, but the canonical source-of-truth for product facts is again `docs/project/product-spec.md`.

## Next Recommendation
- Start the next worker on a spec-aligned language realignment slice rather than further Unity validation.
