# Session Log: Web First Render Instrumentation

Date: `2026-05-22`
Thread: `codex-main`
Task: `T-112`
Milestone/Gate: `M2 / Gate B`

## Scope Completed
- Added lightweight browser-side timing instrumentation to the web app so initial white-screen delays can be measured from inside the app instead of inferred from bundle size alone.
- Added an on-page perf overlay behind `?perf=1` that lists boot and render samples as they occur.
- Instrumented home mini-preview rendering, app boot, playground editor setup, cached-preview display, and first live preview milestones.

## Files Changed
- `radebe-web/src/perf.ts`: added the shared perf sample store, console logging, `?perf=1` gating, and Preact hook helpers.
- `radebe-web/src/main.tsx`: records app boot milestones and renders the fixed perf overlay.
- `radebe-web/src/ui.tsx`: times the home-page `MiniPreview` `renderSource(...)` work and marks when its frame is ready.
- `radebe-web/src/playground.tsx`: records playground effect start, editor-ready time, cached-preview display, and first live preview completion/frame milestones, plus times `renderSource(...)` during preview updates.
- `radebe-web/src/styles.css`: styles the fixed overlay panel.
- `docs/project/task-board.md`: recorded T-112 completion.
- `docs/project/main-thread-state.md`: summarized the new profiling capability for follow-up threads.

## Behavioral Impact
- Visiting the web app with `?perf=1` now shows a live timing panel in the bottom-right corner.
- Normal users without `?perf=1` do not get the overlay or console perf logging.
- The repo now has a repeatable way to compare whether the white gap happens before app mount, during home-page render, or inside playground/editor setup.

## Tests / Verification
- Ran `npm run build -w @radebe/web`: passed.
- Build output still shows the existing large initial JS chunk warning (`dist/assets/index-BayfsyPL.js` about `556.13 kB` minified, `174.24 kB` gzip), but the instrumentation change itself compiled successfully.

## Remaining Work
- Collect timings from a real browser session on the target page(s), especially `#/home` and `#/try-it`.
- Use the new samples to decide whether the first optimization target is home-page synchronous render work, route-level code splitting, or playground/editor boot.

## Risks / Blockers
- I could not use a full browser profiler from the currently exposed tools in this session, so the next round of evidence still needs a real browser open with `?perf=1`.

## Exact Next 3 Steps
1. Run `npm run dev:web` and open `http://127.0.0.1:5173/?perf=1#/home`.
2. Reload on `#/home`, then repeat on `#/try-it`, and capture the overlay timings for the first white-to-content transition.
3. Compare whether the biggest gap is before `app-mounted`, inside `mini-preview-render-source`, or around `playground-editor-ready` / `playground-first-preview-complete`.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `T-112-follow-up`.

Objective:
- Gather and interpret first-render timing data from the new `?perf=1` overlay on the web app.

Current state:
- `radebe-web` now records app boot milestones, home mini-preview render time, playground editor setup time, cached-preview display, and first live preview completion/frame milestones.
- The overlay appears only when the URL includes `?perf=1`.
- `npm run build -w @radebe/web` passed after the instrumentation was added.

Done criteria:
- Capture timing evidence from the relevant routes and identify the highest-value first optimization target without implementing the fix yet unless explicitly requested.
- Update task-board, roadmap if affected, decisions if needed, session-log, and main-thread-state.

Read order:
1) AGENTS.md
2) docs/project/task-board.md
3) docs/project/main-thread-state.md
4) docs/project/session-log/2026-05-22-web-first-render-instrumentation.md
5) radebe-web/src/perf.ts
6) radebe-web/src/main.tsx
7) radebe-web/src/playground.tsx
```

This is a good handoff point. Start a new worker thread.
