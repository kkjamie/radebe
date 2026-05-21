# Session Log: Vocabulary And Ordering Backlog

Date: `2026-05-21`
Thread: `codex-main`
Task: `planning`
Milestone/Gate: `M2 / Deferred`

## Scope
- Capture the agreed author-facing language vocabulary.
- Add follow-up tasks for web reference docs/editor help and compiler ordering restrictions.
- Record the mask naming direction as `shape` plus `content`.

## Completed
- Added T-074 to standardize vocabulary across web reference docs, examples, autocomplete details, and VS Code/web editor help.
- Added T-075 to add compiler ordering restrictions for command child phases.
- Documented the vocabulary in `docs/project/product-spec.md`, including drawable commands, pixel primitives, shape drawables, path drawables, geometry modifiers, property commands, appearance passes, effect passes, structural containers, mask shape, and masked content.
- Added the planned ordering model: preserve source-order intuition and reject confusing phase ordering rather than silently moving child commands.
- Updated the mask model example to use `mask` with `shape` and `content` child containers.
- Logged DEC-037 for the vocabulary and no-silent-reordering direction.
- Updated roadmap and main-thread state so the two new tasks are visible.

## Verification
- Documentation and planning-only change; no build or test run was needed.

## Remaining
- T-074 should fold the vocabulary into the web reference docs and into schema-driven completion/help metadata.
- T-075 should implement and tune compiler diagnostics for ordering rules.
- Future `mask` work should use the `shape` / `content` container names.

## Risks / Blockers
- The exact strictness for existing shape children such as `fill` before `cut` still needs tuning in T-075.
- Editor help needs a shared metadata shape so web and VS Code do not drift.

## Exact Next 3 Steps
1. If documentation coherence is next, start T-074 and make the web reference docs the visible vocabulary source.
2. If compiler behavior is next, start T-075 and add focused diagnostics plus tests for child-phase ordering.
3. If visible language capability is next, start T-060 with `mask`, `shape`, and `content` naming.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `<task-id>`.

Objective:
- Implement one selected follow-up from the vocabulary/ordering planning pass.

Current state:
- T-074 tracks standardizing author-facing language vocabulary across web reference docs, examples, autocomplete details, and VS Code/web editor help.
- T-075 tracks compiler ordering restrictions for command child phases.
- Product spec now defines vocabulary: drawable commands, pixel primitives, shape drawables, path drawables, geometry modifiers, property commands, appearance passes, effect passes, structural containers, mask shape, and masked content.
- Product spec also records the ordering direction: reject confusing child ordering rather than silently reordering across phases.
- Planned mask containers are named `shape` and `content`.

Done criteria:
- Implement the selected task with focused docs/code/test coverage.
- Update task-board, roadmap if affected, decisions if a meaningful semantic choice changes, session-log, and main-thread-state.
- Return an end-of-thread handoff using the repository contract.

Read order:
1) AGENTS.md
2) docs/project/task-board.md
3) docs/project/product-spec.md
4) docs/project/decisions.md
5) docs/project/main-thread-state.md
6) docs/project/session-log/2026-05-21-vocab-and-ordering-backlog.md
```

This is a good handoff point. Start a new worker thread.
