# 2026-05-28 GitHub Refactor Milestone Replan

## Scope Completed
- Reworked the project milestone sequence around the new decision to move public code hosting, website hosting, release binary hosting, and pipelines to GitHub.
- Parked the old Azure/Cloudflare release closeout path so refactoring happens before the GitHub migration.
- Replaced the old M3 rendering-expansion milestone with M3 refactoring and architecture stabilization.
- Replaced the old M4 Unity/editor milestone with M4 GitHub migration.
- Added M5 backlog review and replan so broad feature work resumes only after the full backlog is pruned and validated.

## Files Changed
- `docs/project/task-board.md`
- `docs/project/roadmap.md`
- `docs/project/decisions.md`
- `docs/project/main-thread-state.md`
- `docs/project/milestones/M2-scale-and-optimization.md`
- `docs/project/milestones/M3-refactoring-stabilization.md`
- `docs/project/milestones/M4-github-migration.md`
- `docs/project/milestones/M5-backlog-review-and-replan.md`
- Removed old milestone files:
  - `docs/project/milestones/M3-rendering-expansion.md`
  - `docs/project/milestones/M4-unity-and-editor-integration.md`

## Behavioral Impact
- No runtime code changed.
- Planning now directs the next worker threads toward refactor work before any GitHub migration or feature expansion.
- T-126 is no longer active against the Azure/Cloudflare closeout path; it is retargeted to the M4 GitHub release cutover.
- T-135 is no longer a hosting-comparison task; it is the GitHub migration execution task.
- T-148 now tracks the mandatory post-migration backlog review before "everything else" work resumes.

## Remaining Work
- Start M3 Gate A with T-143, then T-141 and T-140.
- Complete M3 Gate B and Gate C refactor tasks before moving public infrastructure to GitHub.
- Run M4 GitHub migration after M3 consolidation.
- Run M5 backlog review before selecting language/rendering, Unity/editor, VS Code, reusable editor, or public-site feature milestones.

## Risks Or Blockers
- Refactor scope can sprawl if T-143/T-141/T-140 are combined too broadly.
- T-126 is paused until GitHub hosting is available, so no public release tags should be created from the old Azure/Cloudflare path.
- The old Azure/Cloudflare pipeline decisions remain historical context, but should not be treated as the current deployment direction.

## Exact Next 3 Steps
1. Start T-143 to split the core render test suite and add malformed numeric-token regression coverage.
2. Start T-141 to create the first shared argument-binding/value-validation seam.
3. Start T-140 after the safety-net and binding direction are clear, keeping public compiler APIs stable.

## Paste-Ready Prompt For Next Thread
```md
You are working in worker thread `t-143-core-test-suite-split`.

Objective:
- Start M3 Gate A by improving the core refactor safety net before compiler and renderer extraction work.

Done criteria:
- Split a safe first slice out of `radebe-core/test/render.test.ts` into focused parser/compiler/renderer or feature-oriented test coverage.
- Add or prepare shared test helpers that reduce repeated parse/compile/render setup.
- Add focused malformed numeric-token coverage for integer/number values such as decimal, unit-suffixed, and partial number strings where strict parsing matters.
- Preserve current public behavior unless a malformed-token bug is intentionally fixed with explicit regression coverage.
- Run the closest practical core tests.

Read order:
1) AGENTS.md
2) docs/project/task-board.md (items: T-143, T-141, T-140, T-147)
3) docs/project/roadmap.md (M3)
4) docs/project/milestones/M3-refactoring-stabilization.md
5) docs/project/decisions.md (DEC-078, DEC-079)
6) docs/project/session-log/2026-05-28-codebase-maintainability-audit.md
7) docs/project/session-log/2026-05-28-github-refactor-milestone-replan.md
8) radebe-core/test/render.test.ts
9) radebe-core/src/compiler.ts
```

This is a good handoff point. Start a new worker thread.
