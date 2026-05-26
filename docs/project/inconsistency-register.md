# Inconsistency Register

Owner: `Main Thread`
Last updated: `2026-05-26`

Use this for unresolved product/implementation ambiguities and conflicts.

| ID | Type | Issue | Sources | Impact | Decision Needed | Status | Decision Link |
| --- | --- | --- | --- | --- | --- | --- | --- |
| IR-001 | Implementation Drift | The earlier speculative `@text` / `@repeat` slice diverged from the canonical indentation-based sprite language. T-012 replaced it with a schema-backed `sprite` header block plus root-level `plot` and `line` commands across core, CLI, web, and SEA smoke coverage. | `procedural_ui_sprite_tool_spec_and_plan.md`; `docs/project/product-spec.md`; `radebe-core/src/compiler.ts`; `radebe-web/src/main.ts`; `scripts/src/sea.ts` | The immediate spec drift is resolved, and Unity follow-on work can now validate the correct contract. | None. | Resolved | DEC-011 |
| IR-002 | Product Ambiguity | Author-facing coordinate semantics are not fully settled across sprite bounds, filled extents, pixel-addressed commands, and open stroked paths. `plot`, `line`, and `rect` feel pixel-cell oriented, while `path` points currently behave more like raw stroke centerline coordinates, which can make horizontal or vertical antialiased 1px paths appear partially transparent when they fall on sample boundaries. | `radebe-core/src/renderer.ts`; `radebe-core/src/compiler.ts`; DEC-023; T-127 | Authors may see inconsistent results between visually similar primitives, and future `outputscale` work needs a stable rule for what logical coordinate `0`, `size`, integer points, stroke centers, and antialias samples mean before scaling. | Decide whether Radebe source coordinates distinguish edge-based extents from cell-based point addressing, or adopt another unified model; define how the choice applies to `path`, stroke alignment, antialiasing, generated shapes, and `outputscale`. | Open | N/A |
