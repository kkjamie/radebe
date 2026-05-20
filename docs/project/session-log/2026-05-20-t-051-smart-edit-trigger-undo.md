# Session Log: T-051 Smart Edit Trigger And Undo Tune

Date: `2026-05-20`
Thread: `codex-main`
Task: `T-051`
Milestone/Gate: `M2 / Gate B`

## Scope
- Correct the first smart-edit interaction after hands-on editor use.
- Keep the schema-driven smart-edit model from T-047.

## Completed
- Changed shorthand cleanup to require an exact child command match, so typing `f`, `fi`, or `fil` no longer removes parent color shorthand.
- Kept cleanup active when the full command token is typed, such as `fill`.
- Updated language-service tests to cover the partial-prefix case.
- Changed the web textarea adapter to apply smart-edit removals through the browser edit command path when the textarea is focused.
- Kept a direct-value fallback for environments where browser edit commands are unavailable.
- Suppressed nested input handling from the programmatic smart-edit operation so preview and assist refresh happen once through the normal source-change path.

## Verification
- Ran `npm run build` successfully across the workspace.
- Initial sandboxed `npm test` hit the known Windows `EPERM` lstat issue for `C:\Users\Jamie.Healey`; reran with escalation.
- Ran `npm test` successfully with the core suite, CLI suite, and SEA smoke test passing.

## Notes
- The undo path relies on browser textarea editing commands when available. This should make the shorthand removal a normal undoable edit in the live web editor, with the existing direct mutation path retained only as a fallback.

## Remaining
- Try the browser undo behavior manually in the dev editor after typing `fill`.
- Continue to T-050 for the editor-host decision.

## Risks / Blockers
- Browser undo behavior for `document.execCommand` is implementation-dependent, though it is the practical undo-aware route for the current textarea shell.

## Exact Next 3 Steps
1. Manually confirm `f` does not remove shorthand but `fill` does.
2. Manually confirm `Ctrl+Z` restores the removed shorthand in the web editor.
3. Start T-050 to decide whether CodeMirror 6 should replace the textarea shell before more editor behavior accumulates.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `t-050-editor-host-decision`.

Objective:
- Decide the next editor-host step after schema-backed completions, argument help, indentation, smart edits, and the smart-edit undo/timing tune.

Done criteria:
- Compare staying with the current textarea/highlight shell against migrating to CodeMirror 6.
- If migration is chosen, define the smallest CodeMirror-backed slice preserving live preview and language-service behavior.
- If staying on textarea, choose the next small language-service-backed assist.

Read order:
1) AGENTS.md
2) docs/project/task-board.md
3) docs/project/session-log/2026-05-20-t-047-editor-smart-edits.md
4) docs/project/session-log/2026-05-20-t-051-smart-edit-trigger-undo.md
5) radebe-web/src/main.ts
6) radebe-core/src/language-service.ts
```
