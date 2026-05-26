# Session Log: Public Roadmap Feature Sweep

Date: `2026-05-26`
Thread: `codex-main`
Task: `T-128`
Milestone/Gate: `M2 / Gate D`

## Scope Completed
- Swept the public Roadmap page against the task-board backlog.
- Added the new `outputscale` idea to the public Roadmap page.
- Split the broad procedural-fills card into player-facing planned fill families: noise, cloud/fractal, Voronoi/cell, and tileable patterns.
- Added command ordering diagnostics as an author-facing language/tooling feature.
- Updated the corner-control card to match the current T-077 direction for selectors across `rect`, `polygon`, `polygon-regular`, and `polygon-star`.
- Kept internal release process, optimization, and polish tasks off the public Roadmap page.

## Files Changed
- `radebe-web/src/pages/roadmap.tsx`: updated public roadmap cards and snippets.
- `docs/project/task-board.md`: recorded T-128 as complete.
- `docs/project/roadmap.md`: recorded that the public roadmap was swept against the player-facing backlog.
- `docs/project/main-thread-state.md`: recorded the updated public-roadmap state.

## Behavioral Impact
- The public Roadmap page now advertises the current planned player-facing language and tooling backlog more completely.
- No compiler, renderer, CLI, Unity, or editor runtime behavior changed.

## Tests / Verification
- Ran `npm run build -w @radebe/web`: passed.
- Vite still reports the existing large chunk warning for the web bundle.

## Remaining Work
- Planned roadmap snippets remain illustrative until the corresponding features are implemented.
- Future backlog additions should continue deciding whether they are player-facing enough for the public page.

## Risks / Blockers
- Some planned syntax, especially procedural fills, symbols, transforms, and `outputscale`, may change before implementation.

## Exact Next 3 Steps
1. Continue T-125 for a broader public website QA pass.
2. Review Roadmap page rendering in the browser during that QA pass.
3. Keep new internal release or optimization tasks out of the public roadmap unless they materially change the author workflow.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `t-125-public-website-qa`.

Objective:
- Run the final public website QA and polish pass.

Current state:
- T-128 swept the public Roadmap page so planned player-facing language/tooling features are represented.
- Internal release, optimization, and polish tasks should stay off the public Roadmap page unless they change the author workflow.
- The public roadmap snippets are illustrative for planned syntax.

Done criteria:
- Review homepage, syntax/reference pages, examples, navigation, Roadmap, and visible copy.
- Fix focused issues found during QA without broad redesign.
- Update task-board, roadmap if affected, decisions if needed, session-log, and main-thread-state.
```
