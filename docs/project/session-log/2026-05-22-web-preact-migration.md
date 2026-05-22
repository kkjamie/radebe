# Session Log: Web Preact Migration

Date: `2026-05-22`
Thread: `codex-main`
Task: `T-085`
Milestone/Gate: `M2 / Gate B`

## Scope Completed
- Chose Preact as the web framework layer because it gives React-style TSX components with a small runtime and no extra Vite plugin.
- Superseded DEC-045 with DEC-046 and converted `radebe-web` from modular direct DOM construction to a Preact TSX app.
- Moved the shell/router, page renderers, reusable UI panels, mini preview, and playground layout into components.
- Kept CodeMirror editor behavior as an imperative island inside the `Playground` component.
- Moved injected style text into a normal `styles.css` import.

## Files Changed
- `radebe-web/package.json` and `package-lock.json`: added `preact`.
- `radebe-web/tsconfig.json`: enabled TSX with `jsxImportSource` set to `preact`.
- `radebe-web/index.html`: loads `src/main.tsx`.
- `radebe-web/src/main.tsx`: new Preact shell, hash routing, nav, sidebar state, and shared playground source-state ownership.
- `radebe-web/src/pages.tsx`: page components for Home, Try it, Syntax, Release Notes, Roadmap, integrations, and command reference pages.
- `radebe-web/src/ui.tsx`: reusable page components for heroes, lists, action links, code blocks, feature grids, and mini preview.
- `radebe-web/src/playground.tsx`: Preact-hosted playground layout with existing CodeMirror assists, diagnostics, color swatches, preview canvas, zoom, and smart edits preserved.
- `radebe-web/src/styles.css`: imported stylesheet for shell, page, editor, and playground styling.
- `radebe-web/src/vite-env.d.ts`: Vite client types for CSS imports.
- Removed old `main.ts`, `pages.ts`, `ui.ts`, `playground.ts`, and `styles.ts`.
- Updated `docs/project/task-board.md`, `docs/project/roadmap.md`, `docs/project/decisions.md`, `docs/project/codebase-map.md`, and `docs/project/main-thread-state.md`.

## Behavioral Impact
- Public web pages are now ordinary TSX component markup instead of page-level `document.createElement` assembly.
- Content modules under `radebe-web/src/content` remain the data source, so command docs and examples keep their existing ownership split.
- The Try it route and command examples preserve the CodeMirror editor, completion popup, argument help, diagnostics, color swatches, preview canvas, and source-state behavior.
- Styles are now edited as CSS classes rather than TypeScript-injected text.

## Tests / Verification
- Ran `npm run build`: passed. Vite still reports the existing CodeMirror-heavy chunk-size warning.
- Ran `npm test`: passed. Core 111 tests, CLI 3 tests, VS Code 7 tests, scripts SEA 1 smoke test.
- Started the dev server with `npm --prefix radebe-web run dev -- --host 127.0.0.1`.
- Verified HTTP 200 for `http://127.0.0.1:5173/`, `/src/main.tsx`, and `/src/styles.css`.

## Remaining Work
- Do a visual browser pass through Home, Try it, Syntax, Roadmap, and a few command pages.
- The assist popup and argument-help rows still render their tiny dynamic option lists imperatively because they sit inside CodeMirror-owned interaction logic; this is an acceptable editor-island boundary for now.
- The production bundle still has the pre-existing large chunk warning from CodeMirror.

## Risks / Blockers
- No blocker remains.
- Browser interaction should be manually checked because the repo does not yet have web screenshot or DOM interaction tests.

## Exact Next 3 Steps
1. Open `http://127.0.0.1:5173/` and visually review the Preact-rendered Home, Try it, Syntax, Roadmap, and command pages.
2. Exercise Try it editor basics: typing, completions, smart Enter, Tab indentation, diagnostics, zoom, and color swatch picker.
3. If the next task is web polish, consider lightweight browser smoke coverage before further component or layout work.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `<task-id>`.

Objective:
- Continue after T-085 converted `radebe-web` to Preact.

Current state:
- `radebe-web` now uses Vite + TypeScript + Preact TSX.
- `main.tsx` owns shell/router/sidebar/source-state wiring.
- `pages.tsx` owns page components.
- `ui.tsx` owns reusable page panels.
- `playground.tsx` hosts the CodeMirror editor island and preview layout.
- `styles.css` owns site/editor styling.
- `data.ts` and `content/**` remain the page-owned content source.
- Build, tests, and dev-server HTTP checks passed.

Done criteria:
- Implement the selected follow-up with focused validation.
- Update task-board, roadmap if affected, decisions if needed, session-log, codebase-map if paths change, and main-thread-state.
- Return an end-of-thread handoff using the repository contract.

Read order:
1) AGENTS.md
2) docs/project/task-board.md
3) docs/project/main-thread-state.md
4) docs/project/session-log/2026-05-22-web-preact-migration.md
5) radebe-web/src/main.tsx
6) radebe-web/src/pages.tsx
7) radebe-web/src/playground.tsx
8) radebe-web/src/styles.css
```

This is a good handoff point. Start a new worker thread.
