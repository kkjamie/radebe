# Session Log: Playground Preview Worker Queue

Date: `2026-05-26`
Thread: `codex-main`
Task: `T-129`
Milestone/Gate: `M2 / Gate D`

## Scope Completed
- Moved web playground preview rendering out of the CodeMirror transaction path and into a shared module-worker queue.
- Added per-playground coalescing so rapid edits keep only the newest pending source instead of building a render backlog.
- Removed the synchronous first-edit render for cached-preview rows; cached previews now remain visible while the edited live preview catches up.
- Added a preview toolbar state badge for queued, dirty, refreshing, cached, rendered, and error states.
- Switched web editor imports from the broad `@radebe/core` barrel to focused core subpaths so the renderer is isolated to the worker/fallback render path.

## Files Changed
- `radebe-web/src/playground.tsx`
- `radebe-web/src/playground-preview-queue.ts`
- `radebe-web/src/playground-preview-worker.ts`
- `radebe-web/src/playground-preview-worker-types.ts`
- `radebe-web/src/styles.css`
- `radebe-web/src/syntax-highlight.ts`
- `radebe-web/vite.config.ts`
- `docs/project/task-board.md`
- `docs/project/decisions.md`
- `docs/project/main-thread-state.md`
- `docs/project/session-log/2026-05-26-playground-preview-worker-queue.md`

## Behavioral Impact
- Keystrokes no longer synchronously call `renderSource`, including the first edit in cached Examples or command-reference rows.
- Preview work uses a `120ms` edit cooldown, then runs through one background queue; if more typing happens while a render is queued or running, stale results are discarded and the latest source is scheduled.
- Multi-example pages should feel less blocked because heavy preview compilation/rendering no longer runs on the main typing path.
- Users can now see whether the preview is cached, queued, dirty, refreshing, rendered, or failed.

## Tests / Verification
- Ran `npm run build -w @radebe/web`: passed.

## Remaining Work
- Manually exercise fast typing on `#/examples` and one heavy command-reference page such as `#/glow` or `#/gradient-radial` in the browser.
- Consider optimizing canvas painting itself if very large sprites still cause a visible hitch when a worker result is applied.
- Re-run the route perf suite if this becomes part of a larger web performance closeout pass.

## Risks / Blockers
- Render computation is off the main thread, but applying the final canvas pixels and diagnostic decorations still happens on the main thread.
- The fallback path can still render on the main thread if module workers are unavailable, though modern target browsers should use the worker path.

## Exact Next 3 Steps
1. Start `npm run dev:web` and type quickly in several `#/examples` editors to confirm the preview badge moves from Dirty or Queued to Refreshing to Rendered without blocking input.
2. Repeat on an effect-heavy command page such as `#/glow` to check the worker queue behavior under slower render jobs.
3. If canvas application still hitches, profile `drawSprite` and consider switching to an `ImageData` path.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `t-129-preview-worker-validation`.

Objective:
- Validate the new background preview worker queue in the browser and capture any remaining typing or canvas-application performance issues.

Current state:
- `Playground` no longer calls `renderSource` directly.
- `radebe-web/src/playground-preview-queue.ts` owns one shared queue and coalesces pending render work per playground.
- `radebe-web/src/playground-preview-worker.ts` runs `renderSource` in a module worker.
- Preview state badges now show queued, dirty, refreshing, cached, rendered, or error.
- `npm run build -w @radebe/web` passed.

Done criteria:
- Manually exercise fast typing on `#/examples` and at least one heavy command page.
- Record whether typing stays responsive and whether applying rendered pixels still hitches.
- If a real hitch remains, identify the next narrow target such as `drawSprite`/canvas application.

Read order:
1) AGENTS.md
2) docs/project/task-board.md
3) docs/project/session-log/2026-05-26-playground-preview-worker-queue.md
4) radebe-web/src/playground.tsx
5) radebe-web/src/playground-preview-queue.ts
6) radebe-web/src/playground-preview-worker.ts
```

This is a good handoff point. Start a new worker thread.
