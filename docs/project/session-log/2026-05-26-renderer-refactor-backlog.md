# 2026-05-26 Renderer Refactor Backlog

## Scope Completed
- Captured the renderer refactor concern as a future task instead of changing runtime code in the current thread.
- Placed the work in M3 so it stays with the broader rendering expansion backlog rather than interrupting the current M2 release closeout.

## Files Changed
- `docs/project/task-board.md`
- `docs/project/roadmap.md`
- `docs/project/milestones/M3-rendering-expansion.md`
- `docs/project/main-thread-state.md`
- `docs/project/session-log/2026-05-26-renderer-refactor-backlog.md`

## Behavioral Impact
- No runtime behavior changed.
- The renderer maintainability concern is now explicitly tracked as backlog task T-132 for a future M3 thread.

## Remaining Work
- Decide the preferred module boundaries for the renderer refactor.
- Preserve existing render behavior and coverage while extracting the large `renderer.ts` file.
- Sequence the refactor so it either precedes or travels with the next substantial rendering feature work.

## Risks Or Blockers
- Deferring the refactor means new rendering work may keep landing in a branch-heavy file unless T-132 is scheduled deliberately.
- Splitting the renderer later will need care around shared layer, mask, gradient, contour, and antialias helpers so performance does not regress.

## Exact Next 3 Steps
1. Keep M2 focused on T-126 release hosting and closeout work.
2. When M3 rendering work resumes, consider taking T-132 before or alongside the next substantial renderer feature slice.
3. Use existing renderer tests as the baseline safety net before moving code into shape- or concern-specific modules.

## Paste-Ready Prompt For Next Thread
```md
You are working in worker thread `t-132-renderer-refactor`.

Objective:
- Refactor `radebe-core/src/renderer.ts` into maintainable internal seams without changing rendering behavior.

Done criteria:
- Reduce the size and branching density of the current renderer module by extracting clear boundaries such as command dispatch, shared layer/mask helpers, fill/effect sampling, and shape-specific rasterizers.
- Keep the public `@radebe/core` render API stable.
- Run the closest practical renderer tests to confirm behavior stays unchanged.
- Update task-board, roadmap if milestone or priority changes, session-log, and main-thread-state before ending the thread.

Read order:
1) AGENTS.md
2) docs/project/task-board.md (item: T-132)
3) docs/project/roadmap.md
4) docs/project/milestones/M3-rendering-expansion.md
5) docs/project/main-thread-state.md
6) docs/project/session-log/2026-05-26-renderer-refactor-backlog.md
7) docs/project/codebase-map.md
8) radebe-core/src/renderer.ts
9) radebe-core/test/render.test.ts

At completion:
- Update task-board, roadmap if needed, session-log, and main-thread-state.
- Add a decision entry only if the refactor settles a durable renderer architecture choice.
- Return the standard handoff summary.
```

This is a good handoff point. Start a new worker thread.
