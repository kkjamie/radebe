# Session Log: Web Page Perf Suite Automation

Date: `2026-05-24`
Thread: `codex-main`
Task: `T-123`
Milestone/Gate: `M2 / Gate B`

## Scope Completed
- Added machine-readable perf snapshot output to the web app so browser runs can export timing data without scraping visible text.
- Added broader route timing instrumentation, including page-level first-frame markers and timed highlighted-code rendering.
- Built a new `scripts/src/web-page-perf.ts` automation entrypoint plus root `npm run diagnose:web:pages` command surface.
- Iterated through multiple browser-driving approaches:
  - direct headless DOM dump
  - PowerShell CDP probing
  - a dependency-free Node websocket CDP client
  - a browser self-runner mode that posts page snapshots back to the local server
- Kept the workspace buildable after the iterations.

## Files Changed
- `radebe-web/src/perf.ts`
- `radebe-web/src/main.tsx`
- `radebe-web/src/ui.tsx`
- `scripts/src/web-page-perf.ts`
- `scripts/web-page-perf-probe.ps1`
- `scripts/package.json`
- `package.json`
- `docs/project/task-board.md`
- `docs/project/main-thread-state.md`

## Behavioral Impact
- Visiting the web app with `?perf=1` now exposes a machine-readable `#radebe-perf-snapshot` payload alongside the visible perf panel.
- The app now has the first pass of a `perf-suite` mode intended to auto-walk routes and POST per-page snapshots back to the local report collector.
- The repo now has a dedicated page-perf automation entrypoint intended to emit JSON and Markdown route reports under `Temp/web-page-perf/`.

## Tests / Verification
- Ran `npm run build -w @radebe/web`: passed after the instrumentation and suite wiring changes.
- Ran `npm run build -w @radebe/scripts`: passed after the automation changes.
- Repeatedly ran `node .\\scripts\\dist\\src\\web-page-perf.js` with varying ports/timeouts while iterating on the browser-driving strategy.
- Verified multiple browser launch paths and confirmed local Chrome can expose a DevTools endpoint, but the route-collection automation still fails to produce the final posted report.

## Current Findings
- The original `--dump-dom` and raw CDP approaches were unreliable in this Windows session, but the browser self-runner plus local POST-back collector worked once the route walker started posting incremental progress and the probe switched to a normal Chrome window.
- The latest successful full run wrote:
  - `Temp/web-page-perf/20260524-171610/report.json`
  - `Temp/web-page-perf/20260524-171610/report.md`
- The automation captured all `27` public routes.
- The strongest outliers from the corrected route-relative timings are:
  - `polygon-star`: about `26798ms` first frame, dominated by `playground-render-source` on `polygon-star-many-points` at about `16247ms`
  - `polygon-regular`: about `2879ms` first frame, dominated by `playground-render-source` on `polygon-regular-fill` at about `2714ms`
  - `glow`: about `382ms`, dominated by `glow-panel` render about `230ms`
  - `shadow`: about `260ms`, dominated by `shadow-soft-blur` render about `136ms`
  - `gradient-radial`: about `217ms`, dominated by `gradient-radial-transparent` render about `64ms`
  - `gradient-linear`: about `215ms`, dominated by `gradient-linear-angle` render about `66ms`
  - `stroke`: about `190ms`, dominated by `stroke-shape-showcase` render about `69ms`
  - `try-it`: about `171ms`, dominated by the main live preview render about `101ms`

## Follow-Up Optimization
- Added command-reference cached preview metadata for the heaviest `polygon-regular` and `polygon-star` examples and generated matching preview PNGs under `public/generated/command-previews/`.
- Fixed the real root cause in `radebe-web/src/main.tsx`: `sourceState` had been initialized with every playground's default source, which meant the UI treated every command-reference example as already edited and always bypassed the cached preview path.
- Changed `sourceState` to track edited source only, so first-load command-reference pages can stay on the static preview image until the user actually changes source.
- Rebuilt the web and scripts packages and reran the route sweep on a free local port with:
  - `node scripts/dist/src/web-page-perf.js --port 4191 --virtual-time-budget 90000`
- The follow-up optimized run wrote:
  - `Temp/web-page-perf/20260524-173137/report.json`
  - `Temp/web-page-perf/20260524-173137/report.md`
- The polygon-heavy route regression is resolved in the corrected route-relative rankings:
  - `polygon-star`: down from about `26798ms` to about `22ms`
  - `polygon-regular`: down from about `2879ms` to about `21ms`
- The current slowest route tier is now:
  - `glow`: about `367ms`, dominated by `glow-panel` render about `217ms`
  - `gradient-radial`: about `231ms`, dominated by `gradient-radial-transparent` render about `63ms`
  - `shadow`: about `210ms`, dominated by `shadow-soft-blur` render about `102ms`
  - `gradient-linear`: about `197ms`, dominated by `gradient-linear-angle` render about `64ms`
  - `stroke`: about `174ms`, dominated by `stroke-shape-showcase` render about `65ms`
  - `try-it`: about `149ms`, dominated by the main live preview render about `92ms`

## Remaining Work
- Use the optimized report to choose the next target from the new top tier: `glow`, `gradient-radial`, `shadow`, `gradient-linear`, `stroke`, or `try-it`.
- Consider tightening the report's "dominant work" summary so it does not surface absolute timeline `page-first-frame` milestones as bottleneck labels on pages whose route-relative timings are already healthy.

## Risks / Blockers
- The current reliable browser mode is a normal Chrome window rather than headless mode in this environment.
- The Markdown report's detail sections still mix absolute perf milestones with route-relative ranking data, which can make healthy pages like `polygon-star` look suspicious if the summary row is read without the ranked timings.

## Exact Next 3 Steps
1. Inspect the `glow` and `shadow` command pages because they now dominate the route ranking and both point at blur-heavy effect rendering.
2. Decide whether to extend cached previews to more command-reference pages or optimize the underlying blur/effect render path directly.
3. Re-run `npm run diagnose:web:pages` after the next optimization and compare against `Temp/web-page-perf/20260524-173137/report.md`.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `T-123-follow-up`.

Objective:
- Use the new page-perf baseline to reduce the next tier of slow web routes now that the polygon-heavy command pages are fixed.

Current state:
- `radebe-web` exposes a machine-readable `#radebe-perf-snapshot` payload behind `?perf=1`.
- `perf-suite=1` auto-walks all public routes and posts page snapshots back to the local collector.
- `scripts/src/web-page-perf.ts` writes route reports under `Temp/web-page-perf/`.
- The earlier outlier report was `Temp/web-page-perf/20260524-171610/`.
- The latest optimized report is `Temp/web-page-perf/20260524-173137/` and confirms `polygon-star` and `polygon-regular` are fixed after the cached-preview first-load correction.
- The current slowest tier is `glow`, `gradient-radial`, `shadow`, `gradient-linear`, `stroke`, and `try-it`.

Done criteria:
- Identify and improve at least one of the current top-tier slow routes.
- Re-run the suite and compare against `Temp/web-page-perf/20260524-173137/report.md`.

Read order:
1) AGENTS.md
2) docs/project/task-board.md
3) docs/project/session-log/2026-05-24-web-page-perf-suite.md
4) docs/project/main-thread-state.md
5) Temp/web-page-perf/20260524-171610/report.md
6) Temp/web-page-perf/20260524-173137/report.md
7) radebe-web/src/main.tsx
8) radebe-web/src/playground.tsx
```

This is a good handoff point. Start a new worker thread.
