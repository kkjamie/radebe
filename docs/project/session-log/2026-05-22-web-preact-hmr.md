# Session Log: Web Preact HMR

Date: `2026-05-22`
Thread: `codex-main`
Task: `T-092`
Milestone/Gate: `M2 / Gate B`

## Scope Completed
- Investigated TSX edits causing the migrated web app to go black during `npm run dev:web`.
- Added `@preact/preset-vite` to the web package.
- Registered `preact()` first in `radebe-web/vite.config.ts`, ahead of the local downloads middleware.
- Recorded the tooling decision in DEC-048.

## Files Changed
- `radebe-web/package.json`: added `@preact/preset-vite` as a dev dependency.
- `package-lock.json`: added the preset and its transitive dev dependencies.
- `radebe-web/vite.config.ts`: enabled the Preact Vite preset.
- `docs/project/task-board.md`: recorded T-092 completion.
- `docs/project/main-thread-state.md`: recorded the HMR fix.
- `docs/project/decisions.md`: added DEC-048.

## Behavioral Impact
- TSX page/component edits now go through Preact's supported refresh integration instead of plain Vite TSX handling.
- CSS hot reload remains unchanged.
- Local dev download routes are still served by the existing custom Vite middleware.

## Tests / Verification
- Ran `npm run build`: passed. Vite still reports the existing CodeMirror-heavy chunk-size warning.
- Ran `npm test`: passed. Core 111 tests, CLI 3 tests, VS Code 7 tests, scripts SEA 1 smoke test.
- Ran `npm --prefix radebe-web run dev -- --host 127.0.0.1 --port 5173`; 5173 was already occupied, so Vite served on `http://127.0.0.1:5174/`.
- Verified `http://127.0.0.1:5174/` returned HTTP 200.
- Touched `radebe-web/src/pages/syntax.tsx` without content changes and observed Vite report HMR updates for `/src/pages/syntax.tsx`.

## Remaining Work
- Validate in the browser during normal editing that TSX updates no longer black out the page.
- If black screens persist, capture the browser console error immediately after a TSX edit.

## Risks / Blockers
- `npm install` reported two moderate audit findings in the dependency tree. No audit fix was run because it could create unrelated package churn.
- No browser automation is configured, so the final HMR behavior still needs hands-on browser confirmation.

## Exact Next 3 Steps
1. Restart `npm run dev:web` so the new Vite config and dependency are active.
2. Edit a TSX page such as `radebe-web/src/pages/syntax.tsx` and confirm the browser updates without going black.
3. If it still fails, copy the browser console error and inspect the specific failing module.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `<task-id>`.

Objective:
- Continue after T-092 added `@preact/preset-vite` to fix unreliable TSX hot reload in `radebe-web`.

Current state:
- `radebe-web/package.json` has `@preact/preset-vite`.
- `radebe-web/vite.config.ts` runs `preact()` before the custom local-downloads plugin.
- `npm run build` passed.
- A dev server reached HTTP 200 and reported HMR updates for `src/pages/syntax.tsx`.

Done criteria:
- Confirm normal browser editing no longer blacks out after TSX changes, or capture and fix the browser console error if it persists.
- Update task-board, roadmap if affected, decisions if needed, session-log, and main-thread-state.
```

This is a good handoff point. Start a new worker thread.
