# 2026-05-28 Codebase Maintainability Audit

## Scope Completed
- Reviewed the current codebase for large files, duplication, readability hazards, and likely refactor pressure after the first renderer split.
- Confirmed the largest maintainability hotspots by line count and source inspection:
  - `radebe-core/src/compiler.ts` at 3k-plus lines.
  - `radebe-core/test/render.test.ts` at 2k-plus lines.
  - `radebe-web/src/playground.tsx` at 1k-plus lines.
  - `radebe-web/src/styles.css`, `radebe-core/src/renderer/shared.ts`, `scripts/src/web-page-perf.ts`, `radebe-core/src/language-service.ts`, `radebe-core/src/schema.ts`, and `radebe-unity/Assets/Editor/RadebeCliBridgeHelper.cs` each over or near the 800-line review threshold.
- Added durable backlog and debt tracking for the highest-value refactor targets.
- Promoted the remaining web styling and performance-tooling debt entries into task-board items after review.

## Files Changed
- `docs/project/task-board.md`
- `docs/project/roadmap.md`
- `docs/project/technical-debt-register.md`
- `docs/project/main-thread-state.md`
- `docs/project/session-log/2026-05-28-codebase-maintainability-audit.md`

## Behavioral Impact
- No runtime code changed.
- The project now has explicit follow-up tasks for compiler modularization, shared argument binding, web Playground splitting, core test-suite splitting, Unity bridge helper splitting, web CSS token/style splitting, and web performance tooling splitting.

## Key Findings
- The compiler is the top refactor candidate. It currently owns low-level argument parsing, variable resolution, command-specific compilation, geometry modifier math, appearance-pass compilation, and structural container ordering in one module. It also uses partial numeric parsing through `Number.parseInt` and `Number.parseFloat`, which can accept malformed tokens unless tightened.
- Argument interpretation is duplicated across `compiler.ts`, `schema.ts`, `language-service.ts`, `colors.ts`, and web editor code. `rect-inset` and polygon variadic handling are the clearest examples.
- Renderer work should continue with T-133. The command split helped, but `renderer/shared.ts` is becoming the next broad helper module and pass loops still repeat across rect, circle, polygon, masks, and groups.
- The web Playground module is a large imperative island that combines CodeMirror setup, assist UI, diagnostics, preview worker lifecycle, canvas rendering, cached previews, and startup queueing.
- Core render tests are comprehensive but concentrated in one large file with repeated parse/compile/render setup, making future behavior-preserving refactors noisier than necessary.
- Unity bridge code is serviceable but one large helper owns unrelated install, validation, process, quoting, manifest, and DTO responsibilities.
- Web styling and web performance diagnostics are lower-priority maintainability debts, but they now have task IDs so they can be scheduled deliberately instead of lingering as unassigned register entries.

## Remaining Work
- Do not interrupt T-126 release closeout unless a concrete bug makes one of these refactors urgent.
- After M2 closes, choose whether the first cleanup thread should be T-140/T-141 together or T-143 first to improve the safety net.
- Keep T-133 as the renderer-specific follow-up already planned for M3.

## Risks Or Blockers
- Several refactors touch language semantics and editor behavior at the same time; splitting compiler code before unifying argument binding may create churn.
- The strict numeric parsing issue is behavior-affecting, so it should be covered by tests before changing compiler parsing.
- Unity helper refactoring needs Unity edit-mode validation when Unity work resumes.

## Exact Next 3 Steps
1. Finish T-126 release hosting and tagging before starting non-urgent refactors.
2. Start T-143 if the next thread wants a safer test harness first; otherwise start T-141 to define shared argument binding before cutting up the compiler.
3. Start T-140 after the argument-binding direction is clear, keeping public `@radebe/core` compile APIs stable.

## Follow-Up Task Addendum
- T-145 now tracks the CSS token/style split for TD-007.
- T-146 now tracks the web performance tooling split for TD-008.

## Paste-Ready Prompt For Next Thread
```md
You are working in worker thread `t-141-argument-binding-refactor`.

Objective:
- Design and implement the first shared argument-binding/value-validation seam used by compiler, language-service, and color-token handling, starting with the duplicated `rect-inset` and polygon variadic cases.

Done criteria:
- Identify the smallest shared helper API that can bind positional, named, child-property, variadic, and special shorthand arguments without changing author-facing behavior.
- Add regression coverage for malformed numeric tokens such as `1.5`, `12px`, and partial number strings where integer or number values should be strict.
- Move at least one duplicated `rect-inset` or polygon argument interpretation path onto the shared helper.
- Keep public `@radebe/core` exports stable unless deliberately adding an internal subpath.
- Run the closest practical core tests.

Read order:
1) AGENTS.md
2) docs/project/task-board.md (items: T-141, T-140, T-143)
3) docs/project/technical-debt-register.md (TD-001, TD-002, TD-005)
4) docs/project/session-log/2026-05-28-codebase-maintainability-audit.md
5) radebe-core/src/compiler.ts
6) radebe-core/src/schema.ts
7) radebe-core/src/language-service.ts
8) radebe-core/src/colors.ts
9) radebe-core/test/render.test.ts
```

This is a good handoff point. Start a new worker thread.
