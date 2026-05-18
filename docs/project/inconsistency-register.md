# Inconsistency Register

Owner: `Main Thread`
Last updated: `2026-05-18`

Use this for unresolved product/implementation ambiguities and conflicts.

| ID | Type | Issue | Sources | Impact | Decision Needed | Status | Decision Link |
| --- | --- | --- | --- | --- | --- | --- | --- |
| IR-001 | Implementation Drift | The current `radebe-core` implementation uses speculative `@text` / `@repeat` commands and a text-grid preview artifact, while the current canonical product spec defines an indentation-based sprite language with a small `sprite` header block and root-level draw commands beginning with `plot` and `line`. | `procedural_ui_sprite_tool_spec_and_plan.md`; `docs/project/product-spec.md`; `radebe-core/src/compiler.ts`; `radebe-web/src/main.ts` | The current M2 language slice does not yet validate the intended product language, and Unity follow-on work against the speculative syntax would reinforce the wrong contract. | Decide whether to replace the speculative command slice directly or stage a narrower parser/semantic realignment first. | Open | N/A |
