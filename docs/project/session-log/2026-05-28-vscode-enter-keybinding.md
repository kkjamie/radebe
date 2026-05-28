# 2026-05-28 VS Code Enter Keybinding Fix

## Scope
- Fix the installed VS Code extension behavior where pressing Enter in a Radebe editor reported `command 'radebe.insertSmartNewline' not found`.
- Restore normal VS Code completion acceptance with Enter while keeping Radebe smart newline indentation for ordinary editing.

## Completed
- Added `onCommand:radebe.insertSmartNewline` to the VS Code extension activation events so the keybinding can activate the extension before invoking the registered text-editor command.
- Narrowed the Radebe Enter keybinding to `editorTextFocus && editorLangId == radebe && !suggestWidgetVisible`, allowing VS Code's built-in suggestion acceptance binding to handle Enter while completions are visible.
- Removed the `--no-dependencies` VSIX packaging flag so `vsce` includes the staged `node_modules/@radebe/core` runtime that `language-adapter.js` imports at activation time.
- Rebuilt, repackaged, and installed `Temp/radebe-language-support-0.1.0.vsix` into the normal VS Code profile with `npm run install:vscode`.

## Verification
- VS Code's extension-host log showed activation failing with `ERR_MODULE_NOT_FOUND` for `@radebe/core` from the installed extension's `dist/src/language-adapter.js`.
- `npm run build:vscode` passed outside the sandbox after the known Windows profile `EPERM` occurred in the sandbox.
- `npm run test -w radebe-language-support` passed with 7 tests.
- `npm run install:vscode` passed outside the sandbox and VS Code reported `Extension 'radebe-language-support-0.1.0.vsix' was successfully installed.`
- Confirmed the staged VSIX manifest includes `onCommand:radebe.insertSmartNewline` and the `!suggestWidgetVisible` Enter keybinding guard.
- Confirmed the packaged and installed VSIX now include `node_modules/@radebe/core/dist/src`.

## Remaining
- Reload or restart VS Code so the current window picks up the freshly installed VSIX.
- In a `.rdb` file, verify Ctrl+Space shows contextual Radebe suggestions, Enter accepts a visible completion, and Enter inserts a smart-indented newline when no suggestion widget is visible.

## Risks / Blockers
- No active blocker.
- The VSIX version remains `0.1.0`, so stale-window behavior is still possible until VS Code reloads.

## End-of-Thread Handoff
1. Scope completed
- VS Code Enter handling was fixed for both smart newline activation and completion acceptance.

2. Files changed
- `radebe-vscode/package.json`
- `scripts/install-vscode-extension.mjs`
- `docs/project/task-board.md`
- `docs/project/session-log/2026-05-28-vscode-enter-keybinding.md`
- `docs/project/main-thread-state.md`

3. Behavioral impact
- Pressing Enter in Radebe files should no longer report a missing `radebe.insertSmartNewline` command.
- Enter should accept visible autocomplete suggestions because the Radebe smart-newline keybinding now yields while the suggest widget is visible.
- Ctrl+Space in Radebe files should show contextual schema-driven Radebe suggestions because the extension can now load `@radebe/core`.
- Plain Enter in Radebe files should continue to use shared smart indentation.

4. Remaining work
- Reload VS Code and perform live editor validation in a normal `.rdb` file.

5. Risks or blockers
- No known blocker.
- The local install reuses the same extension version number, so reload is required to avoid testing the old extension host state.

6. Exact next 3 steps
1. Reload or restart VS Code.
2. Open a `.rdb` file and trigger a Radebe completion.
3. Confirm Enter accepts the completion, then press Enter without suggestions visible to confirm smart indentation still works.

7. Paste-ready prompt for the next thread
```md
You are working in worker thread `post-t-139-vscode-enter-live-validation`.

Objective:
- Live-validate the freshly installed Radebe VS Code extension Enter and completion behavior in a normal VS Code window.

Done criteria:
- Reload or restart VS Code so the installed VSIX is active.
- Confirm Ctrl+Space in a `.rdb` file shows contextual Radebe command/property suggestions, not only document-word suggestions.
- In a `.rdb` file, confirm Enter accepts a visible autocomplete suggestion.
- Confirm Enter inserts the shared smart-indented newline when no suggestion widget is visible.
- Record any remaining VS Code host issue in docs/project/session-log and update docs/project/main-thread-state.

Read order:
1) AGENTS.md
2) docs/project/task-board.md
3) docs/project/session-log/2026-05-28-vscode-enter-keybinding.md
4) radebe-vscode/package.json
5) radebe-vscode/src/extension.ts
```
