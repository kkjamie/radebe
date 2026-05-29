# 2026-05-29 T-147 Class-Owned Compiler Slice

## Scope Completed
- Introduced the first class-owned core subsystem slice for DEC-078.
- Added an internal `Compiler` class under `radebe-core/src/compiler/compiler.ts`.
- Kept the public `compileDocument(document)` facade in `radebe-core/src/compiler.ts`.
- Moved document-level compiler state ownership into the `Compiler` class:
  - diagnostics
  - compiled command collection
  - file-scoped variable environment
  - current sprite header state
  - top-level command sequencing
  - draw-command dispatch for groups, masks, primitives, shapes, and paths

## Files Changed
- `radebe-core/src/compiler.ts`
- `radebe-core/src/compiler/compiler.ts`
- `docs/project/task-board.md`
- `docs/project/roadmap.md`
- `docs/project/milestones/M3-refactoring-stabilization.md`
- `docs/project/main-thread-state.md`
- `docs/project/codebase-map.md`
- `docs/project/technical-debt-register.md`
- `docs/project/session-log/2026-05-29-t147-class-owned-compiler-slice.md`

## Behavioral Impact
- No public `@radebe/core` API changed.
- Compiled documents and render instructions remain plain descriptive data.
- Rendering behavior was not moved onto instruction objects.
- Renderer hot loops were untouched, so there is no new per-pixel object churn.

## Verification
- `npm run build -w @radebe/core`
- `node --test dist/test/colors.test.js dist/test/compiler.test.js dist/test/language-service.test.js dist/test/render.test.js dist/test/schema.test.js` in `radebe-core`
- `npm run build`
- Note: the root web build still emits the existing Vite large-chunk warning for the main bundle; the build completed successfully.

## Remaining Work
- T-133 is next for M3 Gate B: reduce renderer appearance-pass duplication through reusable capabilities without erasing the per-command renderer boundaries from T-132.
- TD-009 remains open because the renderer still needs more explicit ownership and the compiler command modules are not yet command compiler classes.

## Risks Or Blockers
- The class slice is intentionally narrow and behavior-preserving; the main risk is future drift between the `Compiler` owner and command compiler modules if later features grow without clear ownership.
- There are no current blockers.

## Exact Next 3 Steps
1. Start T-133 and identify the smallest repeated renderer appearance-pass path worth unifying first.
2. Preserve rect, circle, and polygon command renderer boundaries while introducing reusable coverage, stroke-distance/perimeter sampling, or fill-coordinate capabilities.
3. Re-run the core build and split core test suite, then decide whether M3 Gate B can pass or needs one narrow renderer ownership follow-up.

## Paste-Ready Prompt For Next Thread
```md
You are working in worker thread `t-133-renderer-appearance-capabilities`.

Objective:
- Continue M3 Gate B by reducing renderer appearance-pass duplication across shapes without collapsing the clearer command renderer boundaries from T-132.

Done criteria:
- Identify one small repeated renderer capability behind `fill`, `stroke`, `shadow`, or `glow` that can be shared safely across rect, circle, polygon, group, or mask paths.
- Preserve public APIs and render-output behavior.
- Keep compiled render instructions as plain data and keep renderer dispatch at document/command/pass granularity rather than per pixel.
- Avoid allocation-heavy per-pixel abstractions.
- Run the closest practical core verification.

Read order:
1) AGENTS.md
2) docs/project/task-board.md (item: T-133)
3) docs/project/milestones/M3-refactoring-stabilization.md (Gate B)
4) docs/project/decisions.md (DEC-075 and DEC-078)
5) docs/project/session-log/2026-05-29-t147-class-owned-compiler-slice.md
6) docs/project/session-log/2026-05-28-codebase-maintainability-audit.md
7) radebe-core/src/renderer.ts
8) radebe-core/src/renderer/shared.ts
9) radebe-core/src/renderer/commands/
10) radebe-core/test/render.test.ts
```

This is a good handoff point. Start a new worker thread.
