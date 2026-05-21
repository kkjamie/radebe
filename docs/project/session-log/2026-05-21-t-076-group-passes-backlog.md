# Session Log: T-076 Group Passes Backlog

Date: `2026-05-21`
Thread: `codex-main`
Task: `planning`
Milestone/Gate: `M2 / Deferred`

## Scope
- Add a task for applying appearance and effect passes to groups.
- Record the intended Photoshop-folder semantics so this does not get confused with inherited child defaults.

## Completed
- Added T-076 to the backlog for composited group appearance/effect passes.
- Updated `docs/project/product-spec.md` to state that future group passes should render child drawables into an offscreen layer, apply group-level passes to the combined alpha/pixels, then composite the result back into the parent.
- Logged DEC-038 for the composited layer decision.
- Updated roadmap and main-thread state so the follow-up is visible with the rest of the language/effects backlog.

## Verification
- Documentation and planning-only change; no build or test run was needed.

## Remaining
- T-076 needs an implementation slice with a real offscreen layer model.
- T-075 should coordinate ordering diagnostics so group content comes before group-level appearance/effect passes.
- T-067 blend/compositing and T-069 transforms may share renderer concepts with T-076.

## Risks / Blockers
- Group-level strokes/effects need combined alpha/contour semantics; treating them as child defaults would violate the accepted direction.
- Offscreen rendering must stay deterministic across CLI, web, and Unity artifact paths.

## Exact Next 3 Steps
1. If group semantics are next, start T-075 or T-076 depending on whether ordering diagnostics or composited rendering should land first.
2. When implementing T-076, define the minimum supported group passes, likely `stroke` and `shadow`, before adding broader blend/effect behavior.
3. Keep T-074 in mind so the web reference docs explain transparent groups versus composited group passes clearly.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `t-076-group-passes`.

Objective:
- Implement the first composited group appearance/effect pass slice.

Current state:
- T-059 implemented transparent `group` containers.
- DEC-038 records future group pass semantics: render all group children into an offscreen layer in source order, use the combined alpha/pixels as the group drawable, apply group-level passes to that composited result, then composite the final group back into the parent.
- Group passes are not inherited defaults for child shapes.
- T-075 tracks ordering diagnostics and should coordinate with this work.

Done criteria:
- Define the smallest supported group pass set and syntax.
- Implement schema/compiler/renderer behavior with deterministic output.
- Add focused core tests plus web reference examples.
- Update task-board, roadmap if affected, decisions if semantics change, session-log, and main-thread-state.

Read order:
1) AGENTS.md
2) docs/project/task-board.md
3) docs/project/product-spec.md
4) docs/project/decisions.md
5) docs/project/main-thread-state.md
6) docs/project/session-log/2026-05-21-t-076-group-passes-backlog.md
```

This is a good handoff point. Start a new worker thread.
