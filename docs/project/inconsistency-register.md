# Inconsistency Register

Owner: `Main Thread`
Last updated: `2026-05-18`

Use this for unresolved product/implementation ambiguities and conflicts.

| ID | Type | Issue | Sources | Impact | Decision Needed | Status | Decision Link |
| --- | --- | --- | --- | --- | --- | --- | --- |
| IR-001 | Implementation Drift | The earlier speculative `@text` / `@repeat` slice diverged from the canonical indentation-based sprite language. T-012 replaced it with a schema-backed `sprite` header block plus root-level `plot` and `line` commands across core, CLI, web, and SEA smoke coverage. | `procedural_ui_sprite_tool_spec_and_plan.md`; `docs/project/product-spec.md`; `radebe-core/src/compiler.ts`; `radebe-web/src/main.ts`; `scripts/src/sea.ts` | The immediate spec drift is resolved, and Unity follow-on work can now validate the correct contract. | None. | Resolved | DEC-011 |
