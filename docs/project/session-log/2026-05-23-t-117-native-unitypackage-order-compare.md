# T-117 Native Unitypackage Order Compare

Date: `2026-05-23`
Thread: `codex-main`
Task: `T-117`
Milestone/Gate: `M2 / Gate C`

## Scope
- Compare the native `.unitypackage` structure against a Unity-authored export and remove the remaining import warnings.

## Completed
- Exported a Unity-authored comparison package from the clean temp project to `Temp/radebe-unity-plugin-via-unity.unitypackage`.
- Inspected both archive layouts and found two important differences:
  - Unity writes a plain tar archive rather than the gzipped tar the native packer had been producing.
  - Unity includes a GUID directory entry and orders each asset group as `asset` then `asset.meta` then `pathname`.
- Updated `scripts/src/unity-package-native-poc.ts` to:
  - emit a plain tar archive
  - add GUID directory entries
  - order entries like Unity's exporter
  - exclude checked-in `.meta` files from ordinary asset collection so they are not packaged twice
- Rebuilt `Temp/radebe-unity-plugin-0.1.0-poc.unitypackage`.
- Imported the rebuilt package into a fresh temp Unity project at `Temp/unitypackage-final-import-check`.

## Validation
- `Temp/unity-import-package-order.log` showed the duplicate-`.meta` bug clearly: Unity warned that paths like `Assets/Plugins/Radebe/Editor.meta` could not be found because the native packer was incorrectly packaging `.meta` files as standalone assets.
- After excluding `.meta` files from asset collection and rebuilding, `Temp/unity-import-package-final.log` showed:
  - `Import package from :D:/projects/personal/radebe/Temp/radebe-unity-plugin-0.1.0-poc.unitypackage !`
  - no `.meta data file (.meta) exists but its asset ... can't be found` warnings
  - `Exiting batchmode successfully now!`
- The final imported tree exists under `Temp/unitypackage-final-import-check/Assets/Plugins/Radebe`.

## Remaining
- Decide whether the native packer should now replace the Unity-driven path as the default `package:unity` command.
- Decide whether synthetic metadata fallback should be kept or removed once coverage is considered complete.
- Optionally run one more behavior-level check in the imported temp project, such as creating a smoke `.rdb` asset and confirming the importer bridge works end to end.

## Risks / Blockers
- Eddie still has its own package-resolution blocker and remains a poor automation target.
- The native packer is now clean on import, but the project still needs a product choice on whether this POC becomes the primary release path.

## Exact Next 3 Steps
1. Decide whether to promote `package:unity:native-poc` into the default `package:unity` path.
2. If promoting it, rename the Unity-driven exporter path to something explicit like `package:unity:via-unity`.
3. Run a behavior-level smoke check on the imported package, not just an import/layout check.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `t-117-native-unitypackage-promote-default`.

Objective:
- Decide whether the cleaned-up native Unity package path should become the default packaging command.

Done criteria:
- The tradeoff between the native package path and the Unity-driven package path is evaluated.
- Command naming and docs are updated to match the chosen default.
- Any follow-up behavior-level validation task is clearly scoped.

Read order:
1) AGENTS.md
2) docs/project/task-board.md (item: T-117)
3) docs/project/roadmap.md (milestone: M2)
4) docs/project/session-log/2026-05-23-t-117-native-unitypackage-poc.md
5) docs/project/session-log/2026-05-23-t-117-native-unitypackage-import-check.md
6) docs/project/session-log/2026-05-23-t-117-native-unitypackage-order-compare.md
7) scripts/src/unity-package-native-poc.ts
8) package.json
```

This is a good handoff point. Start a new worker thread.
