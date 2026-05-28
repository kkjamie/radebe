# 2026-05-28 T-143 Core Test Suite Split

## Scope Completed
- Split the old mixed `radebe-core/test/render.test.ts` suite into focused `schema`, `compiler`, and `render` test modules.
- Added shared core test helpers for common parse/compile/render setup.
- Added malformed numeric-token regression coverage for decimal, unit-suffixed, and partial-number inputs where strict integer/number parsing matters.
- Tightened compiler numeric parsing so integer and number fields no longer partially parse malformed tokens such as `3.5`, `2px`, or `0.5x`.

## Files Changed
- `radebe-core/test/helpers.ts`
- `radebe-core/test/schema.test.ts`
- `radebe-core/test/compiler.test.ts`
- `radebe-core/test/render.test.ts`
- `radebe-core/src/compiler.ts`
- `docs/project/task-board.md`
- `docs/project/milestones/M3-refactoring-stabilization.md`
- `docs/project/main-thread-state.md`
- `docs/project/technical-debt-register.md`
- `docs/project/session-log/2026-05-28-t143-core-test-suite-split.md`

## Behavioral Impact
- No public `@radebe/core` API surface changed.
- The core test safety net is easier to navigate during upcoming T-141 and T-140 refactors because schema/parser/compiler assertions are no longer mixed into the renderer suite.
- Compiler integer/number validation is now strict for the covered paths, including polygon coordinate parsing and shared integer/number readers.

## Verification
- `npm run build -w @radebe/core`
- `node --test dist/test/colors.test.js dist/test/compiler.test.js dist/test/language-service.test.js dist/test/render.test.js dist/test/schema.test.js` in `radebe-core`
- Note: `npm run test -w @radebe/core` hit an environment-level Windows `EPERM` realpath failure against `C:\Users\JamieH~1` under the current shell's `npm`/Node setup, so direct `node --test` execution was used to verify the built suite instead.

## Remaining Work
- T-141 still needs the first shared argument-binding/value-validation seam across compiler, schema metadata, language-service help, and color-token handling.
- T-140 still needs the compiler module split behind stable public APIs once the T-141 binding direction is clear.
- M3 Gate A remains in progress until the shared binding and compiler modularization work land.

## Risks Or Blockers
- The strict numeric parsing change is intentionally small and compiler-scoped; editor help and other metadata consumers still have their own permissive checks until T-141 unifies them.
- The local `npm run test -w @radebe/core` path is still unreliable in this shell because of the Windows short-home-path `EPERM` issue, even though direct `node --test` verification passed.

## Exact Next 3 Steps
1. Start T-141 and move one high-risk duplicated argument path such as `rect-inset` or polygon variadics onto a shared binding helper.
2. Re-run the core split suite while T-141 lands so compiler, language-service, and schema behavior stay aligned.
3. Start T-140 after the binding seam is proven, keeping public compiler exports stable while extracting command-owned modules.

## Paste-Ready Prompt For Next Thread
```md
You are working in worker thread `t-141-argument-binding-refactor`.

Objective:
- Continue M3 Gate A by creating the first shared argument-binding/value-validation seam across compiler, schema metadata, language-service help/smart edits, and color-token handling.

Done criteria:
- Identify the smallest reusable helper API that can bind positional, named, child-property, variadic, and shorthand arguments without changing author-facing behavior.
- Move at least one duplicated high-risk path such as `rect-inset` or polygon variadics onto that shared helper.
- Preserve the strict malformed numeric-token behavior now covered by T-143.
- Keep public `@radebe/core` exports stable unless a new internal subpath is intentionally added.
- Run the closest practical core verification.

Read order:
1) AGENTS.md
2) docs/project/task-board.md (items: T-141, T-140, T-147)
3) docs/project/milestones/M3-refactoring-stabilization.md
4) docs/project/technical-debt-register.md (TD-001, TD-002)
5) docs/project/session-log/2026-05-28-t143-core-test-suite-split.md
6) radebe-core/src/compiler.ts
7) radebe-core/src/schema.ts
8) radebe-core/src/language-service.ts
9) radebe-core/test/compiler.test.ts
```

This is a good handoff point. Start a new worker thread.
