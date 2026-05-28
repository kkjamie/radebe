# 2026-05-28 VS Code Local Extension Refresh

## Scope
- Rebuild and install the latest local Radebe VS Code extension into the normal VS Code profile before investigating the Enter/autocomplete behavior.

## Completed
- Ran the repo-owned local install path: `npm run install:vscode`.
- Rebuilt `radebe-core` and `radebe-vscode` through the root `build:vscode` script.
- Repackaged `Temp/radebe-language-support-0.1.0.vsix`.
- Installed the VSIX into the normal VS Code profile with VS Code's CLI and `--force`.

## Verification
- `npm run install:vscode` passed outside the sandbox after the known Windows npm user-profile `EPERM` issue appeared inside the sandbox.
- VS Code reported: `Extension 'radebe-language-support-0.1.0.vsix' was successfully installed.`
- `code --list-extensions --show-versions` listed `radebe.radebe-language-support@0.1.0`.
- The rebuilt VSIX exists at `Temp/radebe-language-support-0.1.0.vsix`.

## Notes
- `code --list-extensions --show-versions` emitted sandbox permission warnings while trying to create normal VS Code logs, but still returned the installed extension list.
- The current packaged extension manifest still binds `enter` to `radebe.insertSmartNewline` when `editorTextFocus && editorLangId == radebe`; live testing should confirm whether this still prevents accepting autocomplete with Enter.

## Remaining
- Reload or restart VS Code so the normal window picks up the refreshed extension.
- Reproduce completion acceptance in a `.rdb` file.
- If Enter still inserts a newline while the suggest widget is visible, adjust the keybinding `when` clause so smart newline does not run during suggestion acceptance.

## Risks / Blockers
- No deploy blocker.
- The extension version remains `0.1.0`, so confirmation relies on the fresh VSIX timestamp and forced reinstall rather than a visible version bump.

## End-of-Thread Handoff
1. Scope completed
- Latest local VS Code extension was rebuilt, packaged, installed into the normal VS Code profile, and confirmed in the installed extension list.

2. Files changed
- `docs/project/task-board.md`
- `docs/project/session-log/2026-05-28-vscode-local-extension-refresh.md`
- `docs/project/main-thread-state.md`

3. Behavioral impact
- The live VS Code profile now has the current local `radebe-language-support` VSIX installed.

4. Remaining work
- User should reload VS Code and retest Enter autocomplete acceptance in a `.rdb` file.
- If the issue persists, fix the Radebe Enter keybinding so it yields while suggestions are visible.

5. Risks or blockers
- No active blocker.
- Because the package version did not change, stale-window behavior is still possible until VS Code reloads.

6. Exact next 3 steps
1. Reload or restart VS Code.
2. Open a `.rdb` file and trigger a Radebe completion.
3. If Enter still inserts a newline instead of accepting the completion, patch `radebe-vscode/package.json` keybinding conditions and reinstall the VSIX.

7. Paste-ready prompt for the next thread
```md
You are working in worker thread `t-139-vscode-enter-completion-keybinding`.

Objective:
- Fix the Radebe VS Code extension so Enter accepts visible autocomplete suggestions instead of always running the smart-newline command.

Done criteria:
- The `enter` keybinding for `radebe.insertSmartNewline` does not fire while the VS Code suggest widget can accept a suggestion.
- Smart newline indentation still works in normal Radebe editing.
- The VS Code extension builds and is reinstalled into the normal VS Code profile.
- Update task-board, session-log, and main-thread-state.

Read order:
1) AGENTS.md
2) docs/project/task-board.md
3) docs/project/session-log/2026-05-28-vscode-local-extension-refresh.md
4) docs/project/session-log/2026-05-20-t-058-vscode-local-install.md
5) radebe-vscode/package.json
6) radebe-vscode/src/extension.ts
```
