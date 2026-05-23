# Session Log: Web First Render Diagnosis

Date: `2026-05-23`
Thread: `codex-main`
Task: `T-113`
Milestone/Gate: `M2 / Gate B`

## Scope Completed
- Drove the `radebe-web` app in a real headless Edge browser against the `?perf=1` overlay instead of relying on bundle-size guesses.
- Iterated on the instrumentation to split the Home-route stall into brand icon rendering, mini-preview rendering, and syntax highlighting.
- Confirmed the white-screen delay is dominated by synchronous `renderSource(...)` calls during initial render, not by CodeMirror startup or static syntax highlighting.

## Files Changed
- `radebe-web/src/brand-icon.tsx`: added timing marks around the top-bar brand icon `renderSource(...)` work and first painted frame.
- `radebe-web/src/syntax-highlight.ts`: added timing around static highlighted-code generation.
- `docs/project/task-board.md`: recorded T-113 completion.
- `docs/project/main-thread-state.md`: summarized the measured bottleneck and comparative timings.

## Behavioral Impact
- The perf overlay now reports separate timings for the top-bar brand icon render and the static source highlighter, which makes Home-route diagnosis more precise.
- Measured browser timings now show the current primary bottleneck is synchronous sprite compilation during initial render.

## Tests / Verification
- Ran `npm run dev:web`: passed and served `http://localhost:5173/`.
- Verified the Vite dev server listened on IPv6 loopback (`[::1]:5173`), which explained why `127.0.0.1` requests failed while `localhost` worked.
- Launched headless Edge with remote debugging and captured `?perf=1` overlay samples on:
  - `http://localhost:5173/?perf=1#/home`
  - `http://localhost:5173/?perf=1#/try-it`
- Rebuilt after the finer-grained probes with `npm run build -w @radebe/web`: passed.

## Measured Findings
- `#/home`
  - `brand-icon-render-source`: about `2275ms`
  - `mini-preview-render-source`: about `2222ms`
  - `highlight-source`: about `0.6ms`
  - First frame: about `4739ms`
- `#/try-it`
  - `brand-icon-render-source`: about `2239.8ms`
  - `playground-editor-ready`: about `15.3ms`
  - `playground-render-source`: about `45.3ms`
  - First frame: about `2520ms`

## Interpretation
- The top-bar `BrandIcon` is the first major blocker on both routes.
- The Home route is much worse because it pays a second expensive synchronous `renderSource(...)` for the same `radebeIconSource` inside `MiniPreview`.
- Static syntax highlighting is negligible in comparison.
- CodeMirror/editor startup is also negligible relative to the white-screen delay.

## Remaining Work
- Choose and implement the first fix, likely eliminating runtime `renderSource(...)` for the top-bar icon and Home mini preview.
- Re-measure after the first fix before changing broader bundle or route-loading behavior.

## Risks / Blockers
- The measurements were taken in a dev-server session, but the dominant timings are from in-page `performance.now()` around synchronous render work, so the relative bottleneck should carry into production even if network timings differ.

## Exact Next 3 Steps
1. Replace runtime `renderSource(...)` in `BrandIcon` with a generated static asset or a precomputed artifact object.
2. Stop rendering the same icon source a second time on Home; reuse the same precomputed artifact or a cached preview image there.
3. Re-run the headless Edge `?perf=1` probe on `#/home` and `#/try-it` before considering secondary work such as route-level code splitting.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `T-113-follow-up`.

Objective:
- Implement the first high-confidence fix for the web app white-screen delay using the measured browser timings.

Current state:
- Real headless Edge runs against `?perf=1` show the dominant delay is synchronous `renderSource(...)` work during initial render.
- The top-bar `BrandIcon` costs about `2.24s` on both `#/home` and `#/try-it`.
- The Home route then pays a second `~2.22s` `renderSource(...)` for the same icon source inside `MiniPreview`.
- `highlightSource` was negligible, CodeMirror setup was about `15ms`, and the first Try it preview render was about `45ms`.

Done criteria:
- Remove or defer the measured primary bottleneck, validate with the same headless-browser perf probe, and update project docs.

Read order:
1) AGENTS.md
2) docs/project/task-board.md
3) docs/project/main-thread-state.md
4) docs/project/session-log/2026-05-23-web-first-render-diagnosis.md
5) radebe-web/src/brand-icon.tsx
6) radebe-web/src/ui.tsx
7) radebe-web/src/content/brand-icon.ts
```

This is a good handoff point. Start a new worker thread.
