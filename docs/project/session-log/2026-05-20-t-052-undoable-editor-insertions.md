# Session Log: T-052 Undoable Editor Insertions

Date: `2026-05-20`
Thread: `codex-main`
Task: `T-052`
Milestone/Gate: `M2 / Gate B`

## Scope
- Fix undo behavior for autocomplete and other programmatic editor insertions.
- Keep the current textarea editor shell.

## Completed
- Replaced direct `textarea.value` mutation in the shared source-range replacement helper with an undo-aware edit path when the textarea is focused.
- Routed autocomplete acceptance through the same edit command path as smart-edit cleanup.
- Routed Tab indentation and smart Enter newline insertion through the same edit command path.
- Kept a direct mutation fallback for non-focused or unsupported browser contexts.
- Suppressed nested programmatic input handling so preview and assist refresh still run once through the existing source-change flow.

## Verification
- Ran `npm run build` successfully across the workspace.
- Initial sandboxed `npm test` hit the known Windows `EPERM` lstat issue for `C:\Users\Jamie.Healey`; reran with escalation.
- Ran `npm test` successfully with the core suite, CLI suite, and SEA smoke test passing.
- Confirmed the running dev server at `http://127.0.0.1:5173/` returns HTTP 200.

## Notes
- Browser undo behavior is still native-browser behavior because the current editor host is a textarea. This change ensures autocomplete and editor insertions reach the same undo-aware browser edit path as smart-edit removals.

## Remaining
- Manually confirm the complete undo sequence in the browser: accept autocomplete for `fill`, observe shorthand cleanup, then press `Ctrl+Z` repeatedly to restore shorthand and remove the inserted completion.
- Continue to T-050 for the editor-host decision.

## Risks / Blockers
- `document.execCommand` is deprecated but remains the practical undo-aware route for a native textarea. This is another point in favor of considering CodeMirror 6 before the editor grows much more.

## Exact Next 3 Steps
1. Manually test autocomplete undo in the web editor.
2. Start T-050 and decide CodeMirror 6 versus staying on the textarea shell.
3. If CodeMirror is chosen, define the smallest migration that preserves live preview and all existing language-service behaviors.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `t-050-editor-host-decision`.

Objective:
- Decide the next editor-host step after schema-backed completions, argument help, indentation, smart edits, and undo-aware editor insertions.

Done criteria:
- Compare staying with the current textarea/highlight shell against migrating to CodeMirror 6.
- If migration is chosen, define the smallest CodeMirror-backed slice preserving live preview and language-service behavior.
- If staying on textarea, choose the next small language-service-backed assist.

Read order:
1) AGENTS.md
2) docs/project/task-board.md
3) docs/project/session-log/2026-05-20-t-047-editor-smart-edits.md
4) docs/project/session-log/2026-05-20-t-051-smart-edit-trigger-undo.md
5) docs/project/session-log/2026-05-20-t-052-undoable-editor-insertions.md
6) radebe-web/src/main.ts
7) radebe-core/src/language-service.ts
```
