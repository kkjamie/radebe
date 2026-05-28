# 2026-05-28 T-141 Argument Binding Refactor

## Scope Completed
- Introduced a shared internal argument-binding helper in `radebe-core/src/argument-binding.ts`.
- Moved the highest-risk duplicated positional interpretation onto that helper:
  - strict integer-token detection
  - `rect-inset` positional slot mapping
  - variadic trailing-color detection for polygon-style commands
- Wired compiler, language-service argument help, and color-token detection onto the shared helper.
- Added focused tests for `rect-inset` argument help, variadic trailing color help, and polygon trailing color token detection.

## Files Changed
- `radebe-core/src/argument-binding.ts`
- `radebe-core/src/compiler.ts`
- `radebe-core/src/colors.ts`
- `radebe-core/src/language-service.ts`
- `radebe-core/test/colors.test.ts`
- `radebe-core/test/language-service.test.ts`
- `docs/project/task-board.md`
- `docs/project/milestones/M3-refactoring-stabilization.md`
- `docs/project/main-thread-state.md`
- `docs/project/technical-debt-register.md`
- `docs/project/session-log/2026-05-28-t141-argument-binding-refactor.md`

## Behavioral Impact
- No public `@radebe/core` exports changed.
- Compiler, language-service argument help, and color-token scanning now agree on the covered positional cases instead of each keeping their own `rect-inset` and trailing-color heuristics.
- The strict malformed numeric-token behavior from T-143 remains preserved while T-140 prepares to split compiler modules behind the stable public boundary.

## Verification
- `npm run build -w @radebe/core`
- `node --test dist/test/colors.test.js dist/test/compiler.test.js dist/test/language-service.test.js dist/test/render.test.js dist/test/schema.test.js` in `radebe-core`

## Remaining Work
- T-140 is next: compiler responsibilities still need to be extracted into clearer modules while preserving the new shared binding seam.
- M3 Gate A remains in progress until the compiler split behind stable public APIs is complete.

## Risks Or Blockers
- The new helper intentionally targets the highest-risk duplicated positional cases first rather than every argument path in the compiler.
- `npm run test -w @radebe/core` remains unreliable in this shell because of the existing Windows short-home-path `EPERM` issue, so direct `node --test` against built files is still the reliable verification path here.

## Exact Next 3 Steps
1. Start T-140 and extract compiler responsibilities into command-owned modules while preserving the new shared binding helper.
2. Keep the split core suite green during extraction so compiler modularization does not drift from language-service or color-token behavior.
3. Re-check M3 Gate A evidence after T-140 to decide whether the gate can pass or needs a narrow follow-up.

## Paste-Ready Prompt For Next Thread
```md
You are working in worker thread `t-140-compiler-module-split`.

Objective:
- Continue M3 Gate A by splitting `radebe-core/src/compiler.ts` into clearer internal modules while keeping public compiler APIs stable and preserving the shared binding seam from T-141.

Done criteria:
- Extract at least one coherent compiler slice into internal modules or helpers with stable behavior.
- Keep `compileDocument` and public `@radebe/core` compiler exports unchanged.
- Preserve the shared argument-binding helper introduced in T-141 and the strict malformed numeric-token coverage from T-143.
- Run the closest practical core verification.

Read order:
1) AGENTS.md
2) docs/project/task-board.md (items: T-140, T-147)
3) docs/project/milestones/M3-refactoring-stabilization.md
4) docs/project/technical-debt-register.md (TD-001, TD-002)
5) docs/project/session-log/2026-05-28-t143-core-test-suite-split.md
6) docs/project/session-log/2026-05-28-t141-argument-binding-refactor.md
7) radebe-core/src/compiler.ts
8) radebe-core/src/argument-binding.ts
9) radebe-core/test/compiler.test.ts
```

This is a good handoff point. Start a new worker thread.
