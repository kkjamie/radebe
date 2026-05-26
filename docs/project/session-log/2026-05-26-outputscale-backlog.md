# Session Log: Output Scale Backlog Capture

Date: `2026-05-26`
Thread: `codex-main`
Task: `T-127 backlog capture`
Milestone/Gate: `M3 / Gate A`

## Scope Completed
- Added T-127 to track a sprite-level `outputscale` property.
- Captured the intended behavior: keep source authoring in logical sprite space, then emit larger raster output while scaling sprite dimensions and all pixel metrics together.
- Placed the work in M3 Gate A beside expressions, sprite dimension variables, and relative dimension units.

## Files Changed
- `docs/project/task-board.md`: added T-127 as an M3 Gate A P1 backlog task.
- `docs/project/roadmap.md`: added sprite output scaling to the M3 rendering/language backlog summary.
- `docs/project/milestones/M3-rendering-expansion.md`: included output scaling in Gate A scope and seed tasks.
- `docs/project/main-thread-state.md`: recorded T-127 in the resumable backlog context.

## Behavioral Impact
- No compiler, renderer, CLI, web, or Unity behavior changed.
- Future implementation should distinguish `outputscale` from preview zoom: it changes emitted artifact pixels and metric scaling, not just display size.

## Remaining Work
- Decide the final property spelling and grammar, including whether the author-facing token stays `outputscale`.
- Define accepted scale values, validation rules, rounding behavior, and artifact metadata for logical size versus emitted output size.
- Specify how the scale applies to coordinates, lengths, strokes, cuts/radii, shadows/glows, blur/spread values, gradients, antialiasing, relative units, CLI output, web previews, and Unity import.

## Risks / Blockers
- The feature overlaps with T-087 and T-088, so the value-evaluation model should avoid contradictory semantics between logical sprite dimensions and scaled output dimensions.
- Non-integer or very large scales may create rounding, performance, and memory-policy questions that need explicit diagnostics.

## Exact Next 3 Steps
1. Decide the canonical property spelling and whether it is an integer-only multiplier or a broader positive numeric scale.
2. Define the logical-size/output-size metadata contract for core render artifacts and downstream CLI/web/Unity consumers.
3. Implement parser, compiler, renderer, docs, editor metadata, and tests once the scale semantics are locked.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `t-127-outputscale`.

Objective:
- Define and implement sprite-level output scaling for Radebe.

Current state:
- T-127 is an M3 Gate A backlog task for a sprite property such as `outputscale`.
- The intended behavior is to keep authoring in logical sprite coordinates, then emit a larger raster where sprite dimensions and all pixel metrics scale together.
- This must be separate from web preview zoom.
- Related tasks: T-087 built-in sprite variables, T-088 relative dimension units, and T-068 symbolic/expression values.

Done criteria:
- Decide and document the canonical property spelling and accepted values.
- Implement parser/compiler/renderer support with deterministic output dimensions and clear diagnostics.
- Update CLI/web/editor metadata/docs/tests, and account for Unity import metadata needs.
- Update task-board, roadmap if affected, decisions if a syntax decision is accepted, session-log, and main-thread-state.
```
