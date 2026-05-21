# Session Log: Web Route Scroll Reset

Date: `2026-05-21`
Thread: `codex-main`
Task: `T-081 follow-up`
Milestone/Gate: `M2 / Gate B`

## Scope
- Fix hash-route navigation preserving the previous document scroll position.

## Completed
- Set browser history scroll restoration to `manual` for the web app.
- Added a route-render scroll reset so clicking any site/sidebar link renders the next page from the top.
- Kept the existing sidebar layout instead of introducing a separate main-content scroll container.

## Verification
- `npm run build` passed.
- Vite still reports the existing large chunk warning for the CodeMirror-heavy bundle.

## Remaining
- None for this follow-up.

## Risks / Blockers
- No blocker.
- If the site later needs browser back/forward scroll restoration, this manual reset policy should be revisited deliberately.

## Exact Next 3 Steps
1. Click a sidebar link near the bottom and confirm the target page starts at the top.
2. Continue visual polish if any remaining navigation layout issue appears.
3. Continue T-074 if the next work is vocabulary consistency in editor help and autocomplete details.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `<task-id>`.

Objective:
- Continue after the T-081 web homepage/reference conversion and route scroll reset.

Current state:
- `radebe-web` route changes reset the document scroll to the top.
- The site includes homepage, Try it, Syntax, Release Notes, Roadmap, Commands, VS Code Extension, and Unity Plugin pages.
- Build passes with the existing Vite chunk-size warning.

Done criteria:
- Implement the selected follow-up with focused code/docs/test coverage.
- Update task-board, roadmap if affected, decisions if a meaningful semantic/product choice changes, session-log, and main-thread-state.
- Return an end-of-thread handoff using the repository contract.
```

This is a good handoff point. Start a new worker thread.
