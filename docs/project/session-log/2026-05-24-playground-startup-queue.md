# Session Log: Playground Startup Queue And Profiling

Date: `2026-05-24`
Thread: `codex-main`
Task: `T-124`
Milestone/Gate: `M2 / Gate B`

## Scope Completed
- Added explicit playground startup profiling for queue wait, editor setup, active startup time, and total startup time.
- Added a viewport-priority startup queue for non-immersive `Playground` instances so only one row performs initial editor/preview startup at a time.
- Kept `Try it` immersive startup immediate while deferring command-reference and examples rows behind the queue.
- Extended the route perf report so startup timings appear directly in the ranked and per-route sections.

## Files Changed
- `radebe-web/src/perf.ts`
- `radebe-web/src/playground.tsx`
- `radebe-web/src/styles.css`
- `scripts/src/web-page-perf.ts`
- `docs/project/task-board.md`
- `docs/project/decisions.md`
- `docs/project/main-thread-state.md`

## Behavioral Impact
- Non-immersive playground rows now show a queued startup state until their turn arrives.
- The nearest visible row activates first, then later rows follow one at a time instead of all mounting CodeMirror and live preview work together.
- The perf suite now reports editor/preview startup costs separately from page frame timings.

## Tests / Verification
- Ran `npm run build -w @radebe/web`: passed.
- Ran `npm run build -w @radebe/scripts`: passed.
- Ran `node scripts/dist/src/web-page-perf.js --port 4192 --virtual-time-budget 90000`: passed and wrote:
  - `Temp/web-page-perf/20260524-174610/report.json`
  - `Temp/web-page-perf/20260524-174610/report.md`

## Current Findings
- Page frame timings are now tiny on most command-reference routes because startup work is deferred behind the queue.
- The new report shows CodeMirror/editor setup itself is usually cheap:
  - most routes: about `5-10ms`
  - `try-it`: about `31ms`
  - `examples`: about `15ms`
- The heavier cost is preview startup and queued multi-row activation:
  - `try-it`: startup total about `132ms`
  - `examples`: startup total about `143ms`, max queue wait about `125ms`
  - `stroke`: startup total about `208ms`, max queue wait about `184ms`
  - `shadow`: startup total about `215ms`, max queue wait about `181ms`
  - `gradient-linear`: startup total about `213ms`, max queue wait about `122ms`
  - `gradient-radial`: startup total about `300ms`, max queue wait about `192ms`
  - `glow`: startup total about `371ms`, max queue wait about `290ms`
- This confirms the remaining bottleneck is not raw editor creation; it is initial preview/render cost plus serialized waits on routes with several heavy examples.

## Remaining Work
- Optimize the heaviest preview render paths, especially `glow`, `gradient-radial`, `shadow`, `gradient-linear`, and `stroke`.
- Consider whether queue concurrency should stay at `1` or rise to `2` once the heaviest preview paths are cheaper.
- Consider extending cached previews to more command-reference examples if that is cheaper than renderer work.

## Risks / Blockers
- The report now exposes queue cost clearly, but a strict one-at-a-time queue can increase total time for lower rows even while improving top-of-page responsiveness.
- The current reliable profiler path is still a normal Chrome window rather than headless mode in this environment.

## Exact Next 3 Steps
1. Inspect the `glow` and `shadow` render paths because they still dominate startup total time even after queueing.
2. Compare the effect-heavy pages against gradient/stroke pages to decide whether renderer optimization or more cached previews will buy the larger win.
3. Re-run `node scripts/dist/src/web-page-perf.js --port 4192 --virtual-time-budget 90000` after the next change and compare against `Temp/web-page-perf/20260524-174610/report.md`.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `T-124-follow-up`.

Objective:
- Reduce the remaining editor/preview startup cost now that non-immersive playground rows are queued and profiled.

Current state:
- `Playground` now records:
  - `playground-activation-wait`
  - `playground-editor-setup`
  - `playground-startup-active`
  - `playground-startup-total`
- Non-immersive rows initialize in viewport-priority order with one active startup at a time.
- Latest report: `Temp/web-page-perf/20260524-174610/report.md`
- Main findings from that report:
  - editor setup is usually only `5-15ms`
  - the heavier remaining cost is preview startup:
    - `glow` ~`371ms`
    - `gradient-radial` ~`300ms`
    - `shadow` ~`215ms`
    - `gradient-linear` ~`213ms`
    - `stroke` ~`208ms`
    - `examples` ~`143ms`
    - `try-it` ~`132ms`

Done criteria:
- Improve at least one of the heavy preview-startup routes.
- Re-run the profiler and compare against `Temp/web-page-perf/20260524-174610/report.md`.

Read order:
1) AGENTS.md
2) docs/project/task-board.md
3) docs/project/session-log/2026-05-24-playground-startup-queue.md
4) docs/project/main-thread-state.md
5) Temp/web-page-perf/20260524-174610/report.md
6) radebe-web/src/playground.tsx
7) scripts/src/web-page-perf.ts
8) radebe-web/src/content/commands/glow.ts
9) radebe-web/src/content/commands/shadow.ts
```

This is a good handoff point. Start a new worker thread.
