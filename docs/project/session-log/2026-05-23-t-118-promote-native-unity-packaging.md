# T-118 Promote Native Unity Packaging

Date: `2026-05-23`
Thread: `codex-main`
Task: `T-118`
Milestone/Gate: `M2 / Gate C`

## Scope
- Promote the cleaned-up native Unity package builder to the default export path.
- Keep the Unity-driven exporter available under an explicit fallback name.

## Completed
- Changed the scripts so:
  - `npm run package:unity` now uses the native repo-side `.unitypackage` builder
- Removed the Unity-driven exporter from the supported command surface instead of keeping it under a second name.
- Updated root README, Unity README, bridge contract, integration page command examples, and project source-of-truth docs to reflect the new default.
- Logged DEC-056 for the packaging-path promotion.

## Validation
- The underlying native packer had already been validated immediately before this promotion:
  - package imports cleanly into a fresh temp Unity project
  - earlier `.meta` warnings were removed
- Additional validation in this thread: script names and doc references were updated coherently across the repo.

## Remaining
- Optionally rename the native output file away from the `-poc` suffix now that it is the default path.
- Optionally run one deeper behavior-level test on the imported package, such as importing a smoke `.rdb` asset from the packaged plugin install.

## Risks / Blockers
- The native packer is now the default path, but its output filename still carries the historical `-poc` suffix.
- The native packer is now the only supported packaging path, so any remaining Unity-driven export references in historical logs are archival context only.

## Exact Next 3 Steps
1. Decide whether to rename `Temp/radebe-unity-plugin-0.1.0-poc.unitypackage` to a non-POC default artifact name.
2. If Unity behavior verification is next, test the packaged plugin by importing or creating a smoke `.rdb` asset in the clean temp project.
3. If release automation is next, align any download/publish steps to the promoted default `npm run package:unity` command.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `t-118-native-unity-package-polish`.

Objective:
- Polish the promoted native Unity package path after it became the default export command.

Done criteria:
- The selected polish step is completed, such as output naming cleanup or deeper behavior-level validation.
- Docs stay aligned with `npm run package:unity` as the single supported packaging path.
- Project tracking docs are updated with the outcome.

Read order:
1) AGENTS.md
2) docs/project/task-board.md (items: T-117, T-118)
3) docs/project/roadmap.md (milestone: M2)
4) docs/project/session-log/2026-05-23-t-117-native-unitypackage-order-compare.md
5) docs/project/session-log/2026-05-23-t-118-promote-native-unity-packaging.md
6) scripts/src/unity-package-native-poc.ts
7) package.json
```

This is a good handoff point. Start a new worker thread.
