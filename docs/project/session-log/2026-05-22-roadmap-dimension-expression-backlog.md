# Session Log: Roadmap Dimension Expression Backlog

Date: `2026-05-22`
Thread: `codex-main`
Task: `T-087 / T-088 backlog capture`
Milestone/Gate: `M2 / Deferred`

## Scope Completed
- Added a backlog task for built-in sprite dimension variables such as `$WIDTH`, `$SPRITE_WIDTH`, or structured forms like `$sprite.width`.
- Added a backlog task for relative dimension units such as `0.5w`, `50%W`, or `25%H`.
- Added both ideas to the public Roadmap page under Language Expressiveness.
- Kept the user's roadmap card CSS tweak untouched.

## Files Changed
- `docs/project/task-board.md`: added T-087 and T-088 as deferred P1 backlog tasks.
- `docs/project/roadmap.md`: added built-in sprite variables and relative dimension units to the future backlog summary.
- `docs/project/main-thread-state.md`: recorded the new backlog items in current state and next-task guidance.
- `radebe-web/src/pages/roadmap.tsx`: added public roadmap cards and illustrative snippets for both ideas.

## Behavioral Impact
- No compiler/runtime language behavior changed.
- The public Roadmap page now advertises the two future language-expression ideas.

## Tests / Verification
- Ran `npm run build`: passed. Vite still reports the existing CodeMirror-heavy chunk-size warning.
- Ran `npm test`: passed. Core 111 tests, CLI 3 tests, VS Code 7 tests, scripts SEA 1 smoke test.

## Remaining Work
- No syntax decision has been locked. T-087 should choose between short built-ins, prefixed built-ins, or structured property-like names.
- T-088 should define rounding and parsing rules for width-relative and height-relative units before implementation.

## Risks / Blockers
- Built-in variable naming may conflict with user-authored `var` names unless the compiler reserves or namespaces these tokens.
- Relative units overlap with T-068 expressions, so implementation order should avoid inventing two incompatible value evaluators.

## Exact Next 3 Steps
1. Decide whether built-in sprite values use `$WIDTH`, `$SPRITE_WIDTH`, `$sprite.width`, or another canonical naming style.
2. Decide whether relative units use lowercase suffixes, uppercase suffixes, percentage forms, or a supported subset.
3. If implementation begins, fold T-087/T-088 into the same value-evaluation design as T-068.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `<task-id>`.

Objective:
- Continue from the new T-087/T-088 backlog items for built-in sprite variables and relative dimension units.

Current state:
- T-087 tracks built-in sprite dimension variables.
- T-088 tracks relative dimension units such as `0.5w`, `50%W`, and `25%H`.
- Public roadmap cards exist in `radebe-web/src/pages/roadmap.tsx`.
- No syntax decision has been locked yet.
- Build passed.

Done criteria:
- Implement or further scope the selected value-expression feature.
- Update task-board, roadmap if affected, decisions if syntax is chosen, session-log, and main-thread-state.
- Return an end-of-thread handoff using the repository contract.
```

This is a good handoff point. Start a new worker thread.
