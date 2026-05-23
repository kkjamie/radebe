# T-117 Native Unitypackage Import Check

Date: `2026-05-23`
Thread: `codex-main`
Task: `T-117`
Milestone/Gate: `M2 / Gate C`

## Scope
- Verify that the native `.unitypackage` POC can be imported by Unity, not just generated as an archive.

## Completed
- Confirmed the previously used Eddie project still exists, but it remains unsuitable as the primary signal because its own package resolution is broken.
- Attempted package import into Eddie with Unity batchmode:
  - Unity reached package resolution and then stopped on the existing Eddie dependency problem
  - the POC package was not imported there
- Created a fresh temporary Unity project at `Temp/unitypackage-poc-import-check` using Unity batchmode `-createProject`.
- Imported `Temp/radebe-unity-plugin-0.1.0-poc.unitypackage` into that clean project with Unity batchmode `-importPackage`.
- Verified the imported tree now exists under `Assets/Plugins/Radebe`, including:
  - `Editor/*.cs`
  - `bridge.manifest.json`
  - `Tools/radebe-cli/win32-x64/`
  - `artifact-manifest.json`
  - `radebe.exe`
  - `radebe.bundle.cjs`
  - `radebe.sea.blob`
  - `sea-config.json`
- Harvested the Unity-generated `.meta` files from the clean verification project back into the repo:
  - `radebe-unity/Assets/*.meta` for the editor-script side
  - `radebe-unity/PackageRoot.meta`
  - `radebe-unity/PackageRoot/**/*.meta` for bridge manifest and payload mirror entries
- Updated the native packer to prefer those checked-in `.meta` files and rebuilt the POC package.
- Imported the rebuilt metadata-backed package into a second fresh temp Unity project at `Temp/unitypackage-meta-import-check`.

## Validation
- Unity import into Eddie did not complete because Eddie still has the existing dependency issue:
  - `com.unity.test-framework: Package [com.unity.test-framework@1.6.0] cannot be found`
- Unity import into the fresh temp project completed successfully.
- Unity import of the rebuilt metadata-backed package into the second fresh temp project also completed successfully.
- `Temp/unity-import-package-clean.log` shows:
  - `Import package from :D:/projects/personal/radebe/Temp/radebe-unity-plugin-0.1.0-poc.unitypackage !`
  - imports of `Assets/Plugins/Radebe`, `Assets/Plugins/Radebe/Editor`, `Assets/Plugins/Radebe/Tools`, and the CLI payload files
  - `Exiting batchmode successfully now!`
- `Temp/unity-import-package-meta.log` shows the rebuilt package import succeeded and exited cleanly, though Unity logged transient refresh warnings that some `.meta` files appeared before their matching files during the synchronous import pass.

## Remaining
- Decide whether to promote the native packer beyond POC status now that it has repo-owned Unity metadata.
- Optionally eliminate synthetic metadata fallback entirely once the project is comfortable that the checked-in `.meta` coverage is complete.
- Test a deeper behavior path such as compiling/importing a smoke `.rdb` asset from the native package install.

## Risks / Blockers
- Eddie is still not a reliable automation target because of its unrelated package-resolution issue.
- The import succeeded in clean projects, but Unity still logged transient refresh warnings during the metadata-backed import because some `.meta` entries were observed before their corresponding files settled during batch import.

## Exact Next 3 Steps
1. Decide whether to remove synthetic metadata fallback entirely now that the repo owns harvested `.meta` files.
2. If native packaging is the likely CI path, test the imported package by actually importing a smoke `.rdb` asset in the clean project.
3. If the transient refresh warnings matter, experiment with package entry ordering or more exact Unity metadata coverage to reduce them.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `t-117-native-unitypackage-promote-or-discard`.

Objective:
- Decide whether to promote the native `.unitypackage` packer beyond proof-of-concept status.

Done criteria:
- The tradeoff between synthetic metadata and real committed Unity `.meta` files is evaluated.
- A recommendation is made on whether the native packer should stay POC-only, become the CI path, or coexist with the Unity-driven exporter.
- Docs are updated with the chosen direction and any follow-up tasks.

Read order:
1) AGENTS.md
2) docs/project/task-board.md (item: T-117)
3) docs/project/roadmap.md (milestone: M2)
4) docs/project/session-log/2026-05-23-t-117-native-unitypackage-poc.md
5) docs/project/session-log/2026-05-23-t-117-native-unitypackage-import-check.md
6) scripts/src/unity-package-native-poc.ts
7) docs/project/decisions.md
```

This is a good handoff point. Start a new worker thread.
