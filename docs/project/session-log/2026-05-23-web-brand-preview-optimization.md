# Session Log: Web Brand Preview Optimization

Date: `2026-05-23`
Thread: `codex-main`
Task: `T-114`
Milestone/Gate: `M2 / Gate B`

## Scope Completed
- Removed runtime brand-icon compilation from the initial render path.
- Switched the top-bar brand icon and Home mini preview to use the generated PNG asset that already existed in `public/generated/brand/`.
- Re-ran the same headless Edge `?perf=1` probe on `#/home` and `#/try-it` to compare before and after timings.

## Files Changed
- `radebe-web/src/brand-icon.tsx`: replaced runtime `renderSource(...)` plus canvas painting with a static image element backed by the generated brand preview.
- `radebe-web/src/ui.tsx`: changed `MiniPreview` to render highlighted source plus a provided preview image instead of compiling source at runtime.
- `radebe-web/src/pages/home.tsx`: passed the generated brand preview path and dimensions into `MiniPreview`.
- `radebe-web/src/content/brand-icon.ts`: exported the generated preview dimensions alongside the preview path and source text.
- `radebe-web/src/styles.css`: let the brand image reuse the existing brand-icon visual styling.
- `docs/project/task-board.md`: recorded T-114 completion.
- `docs/project/main-thread-state.md`: summarized the optimization result and residual cost.

## Behavioral Impact
- The site header and Home page now display the same visual brand mark without synchronously compiling the Radebe icon source during first render.
- The Home page still shows the source text example, but its rendered artifact is now the generated preview image rather than a live initial render.

## Tests / Verification
- Ran `npm run build -w @radebe/web`: passed.
- Re-ran the real headless Edge `?perf=1` probe on:
  - `http://localhost:5173/?perf=1#/home`
  - `http://localhost:5173/?perf=1#/try-it`

## Before / After
- `#/home`
  - Before:
    - `brand-icon-render-source`: about `2275ms`
    - `mini-preview-render-source`: about `2222ms`
    - `app-first-frame`: about `4739ms`
  - After:
    - `mini-preview-highlight-source`: about `2.7ms`
    - image load/frame events around `319ms` to `324ms`
    - `app-first-frame`: about `324ms`
- `#/try-it`
  - Before:
    - `brand-icon-render-source`: about `2239.8ms`
    - `playground-render-source`: about `45.3ms`
    - `app-first-frame`: about `2520ms`
  - After:
    - `playground-render-source`: about `57.9ms`
    - brand image load/frame events around `500ms` to `603ms`
    - `app-first-frame`: about `603ms`

## Interpretation
- The first fix removed the dominant blocker exactly as expected.
- Home improved by about `4415ms`, roughly a `93%` reduction in first-frame time.
- Try it improved by about `1917ms`, roughly a `76%` reduction in first-frame time.
- The remaining Try it startup cost is now much closer to the real editor/preview work rather than wasted brand-icon compilation.

## Remaining Work
- Consider whether the Home page should eventually use a more explicitly “static preview” presentation so it is visually clear the preview is pre-rendered rather than live.
- Consider route-level code splitting or deferring `Playground` only after re-evaluating whether the remaining `~603ms` Try it first frame is acceptable.

## Risks / Blockers
- The Home preview is no longer a live first render of the source text; it now depends on the generated preview artifact staying in sync, which the existing web preview generation step already handles.

## Exact Next 3 Steps
1. Decide whether the remaining Try it first-frame time justifies route-level code splitting or whether current performance is acceptable after the main fix.
2. If further work is desired, measure a production preview build in the same headless Edge flow and compare it to the dev-server timings.
3. Keep using the `?perf=1` overlay for any future web performance work so fixes stay tied to measured bottlenecks.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `T-114-follow-up`.

Objective:
- Decide whether additional web startup optimization is still needed after removing runtime brand-icon compilation from the initial render path.

Current state:
- The top bar and Home mini preview now use the generated brand PNG instead of calling `renderSource(...)` during first render.
- Headless Edge `?perf=1` reruns improved Home first frame from about `4739ms` to `324ms`.
- The same reruns improved Try it first frame from about `2520ms` to `603ms`.
- The remaining Try it startup cost is now mainly the actual playground preview render and normal app boot rather than wasted duplicate icon compilation.

Done criteria:
- Recommend or implement the next optimization only if the remaining measured cost justifies it, and validate with the same perf probe.

Read order:
1) AGENTS.md
2) docs/project/task-board.md
3) docs/project/main-thread-state.md
4) docs/project/session-log/2026-05-23-web-brand-preview-optimization.md
5) docs/project/session-log/2026-05-23-web-first-render-diagnosis.md
6) radebe-web/src/brand-icon.tsx
7) radebe-web/src/ui.tsx
```

This is a good handoff point. Start a new worker thread.
