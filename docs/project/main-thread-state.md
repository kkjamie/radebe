# Main Thread State

Owner: `Main Thread`
Last updated: `2026-05-18`

## Current Milestone / Gate
- Milestone: `M2`
- Gate: `Gate A`
- Status: `Blocked`

## Current Focus
- The recovered source product spec is now folded back into the canonical docs and restores the intended language design, including syntax examples, semantic command categories, child-capability validation, and schema-driven extensibility.
- The current preferred file shape is a small `sprite` header block with nested file properties such as `size` and `background`, followed by root-level draw commands.
- The current `@text` / `@repeat` implementation is now recognized as implementation drift rather than canonical language progress. The next thread should realign the first vertical slice to a `sprite` header plus root-level `plot` and `line`.

## Open Decisions / Blockers
- No M1 blocker remains; the shared core/web render contract, workspace build, workspace tests, and CLI SEA smoke path all pass in the current environment.
- M2 Gate A is blocked by spec drift: the current implementation does not match the canonical header-plus-root-command language model, so further Unity validation should wait until the language slice is realigned.

## Best Next Tasks
1. Replace the speculative `@text` / `@repeat` slice with a spec-aligned vertical slice that starts at a small `sprite` header block plus root-level `plot` and `line`.
2. Design the initial schema registry so parent-child legality, shorthand expansion, and future command additions are data-driven rather than parser-specific.
3. Return to Unity bridge validation only after the first spec-aligned language slice is stable through `radebe-core`, `radebe-cli`, and `radebe-web`.

## Resume Checklist
1. Read the latest `docs/project/session-log/*.md`.
2. Verify consistency across `task-board`, `roadmap`, `milestone`, and `decisions`.
3. Select the next best unblocked objective.
