# Session Log: Web Main Module Split

Date: `2026-05-21`
Thread: `codex-main`
Task: `T-082`
Milestone/Gate: `M2 / Gate B`

## Scope
- Decide whether the web app needs a frontend framework now that it is no longer a simple testbed.
- Split `radebe-web/src/main.ts` into maintainable modules so page/content edits are easier.

## Completed
- Kept the web stack on Vite + TypeScript + CodeMirror 6 + direct DOM for now because the site is still mostly static and does not need framework-level app state.
- Logged DEC-045 for the modular vanilla TypeScript direction.
- Split `radebe-web/src/main.ts` from roughly 3,700 lines to shell/router wiring only.
- Added `radebe-web/src/data.ts` for static content, command docs, examples, integrations, and page registry.
- Added `radebe-web/src/pages.ts` for page renderer functions.
- Added `radebe-web/src/playground.ts` for CodeMirror editor, assists, diagnostics, color swatches, preview rendering, and playground behavior.
- Added `radebe-web/src/ui.ts` for shared DOM helpers and reusable page panels.
- Added `radebe-web/src/styles.ts` for site/editor style injection.
- Added `radebe-web/src/types.ts` for web page/content types.
- Updated `docs/project/codebase-map.md` with the new web module map.

## Verification
- `npm run build` passed.
- `npm test` passed: core 111 tests, CLI 3 tests, VS Code 7 tests, scripts SEA smoke 1 test.
- Vite still reports the existing large chunk warning for the CodeMirror-heavy bundle.

## Remaining
- `data.ts` is intentionally large because it owns command docs and examples; split it further into command docs, release data, roadmap data, and integration data if editing pressure grows there.
- Final package branding can replace the CSS placeholder icon later.

## Risks / Blockers
- No blocker.
- Moving to a frontend framework is deferred, not forbidden. Revisit if the site gains richer persistent state, shareable examples, cookie/local-storage workflows, or a hostable reusable editor package that benefits from component boundaries.

## Exact Next 3 Steps
1. Edit a small page copy item in `radebe-web/src/pages.ts` or an example in `radebe-web/src/data.ts` to confirm the new authoring feel.
2. If shareable examples are next, decide whether source state should use URL fragments, local storage, cookies, or gist-backed persistence.
3. If style editing becomes frequent, consider moving `styles.ts` to a Vite CSS import with the needed TS declaration support.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `<task-id>`.

Objective:
- Continue after the T-082 web module split.

Current state:
- `radebe-web` stays on Vite + TypeScript + CodeMirror + modular direct DOM for now.
- `main.ts` owns only shell/router wiring.
- Static web content and examples are in `data.ts`.
- Page renderers are in `pages.ts`.
- CodeMirror playground/editor internals are in `playground.ts`.
- Shared panels/helpers are in `ui.ts`.
- Styles are in `styles.ts`.
- Web-only types are in `types.ts`.
- Build and tests pass.

Done criteria:
- Implement the selected follow-up with focused code/docs/test coverage.
- Update task-board, roadmap if affected, decisions if a meaningful semantic/product choice changes, session-log, codebase-map if paths change, and main-thread-state.
- Return an end-of-thread handoff using the repository contract.
```

This is a good handoff point. Start a new worker thread.
