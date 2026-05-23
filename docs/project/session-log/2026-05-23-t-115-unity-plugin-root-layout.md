# T-115 Unity Plugin Root Layout

Date: `2026-05-23`
Thread: `codex-main`
Task: `T-115`
Milestone/Gate: `M2 / Gate C`

## Scope
- Reshape the Unity bridge toward a single plugin-root layout under `Assets/Plugins/Radebe`.
- Keep `.unitypackage` distribution out of scope for now while making the on-disk Unity shape match that future direction.

## Completed
- Changed the Unity deploy default from `Assets/Radebe` to `Assets/Plugins/Radebe`.
- Moved the packaged CLI payload target from `Assets/StreamingAssets/Radebe/radebe-cli/<platform>-<arch>/` to `Assets/Plugins/Radebe/Tools/radebe-cli/<platform>-<arch>/`.
- Updated `RadebeCliBridgeHelper` so install validation and payload install/update now resolve the plugin-local payload directory under `Assets/Plugins/Radebe/Tools/radebe-cli/`.
- Updated the Unity bridge README, bridge manifest, CLI bridge contract, `.env.example`, and project source-of-truth docs to treat `Assets/Plugins/Radebe` as the canonical Unity install root.
- Recorded the install-root decision as DEC-052.

## Validation
- Searched repo references to confirm the live code/docs now point at `Assets/Plugins/Radebe` for the canonical Unity plugin layout.
- Not run: Unity editor import verification after the path migration. This thread reshaped paths and docs only.
- Not run: `npm` build/typecheck/test commands in this thread.

## Remaining
- Re-deploy the Unity bridge into a configured Unity project using the new `Assets/Plugins/Radebe` layout.
- Re-run the importer verification flow so the new install root is validated end to end in-editor or batchmode.
- Decide whether the next Unity packaging step is a repo-generated ZIP, `.unitypackage`, or both.

## Risks / Blockers
- The previous Eddie validation was captured against the older split layout, so the new plugin-root shape still needs a fresh Unity verification pass.
- Historical session logs still mention the previous `Assets/Radebe` and `StreamingAssets` layout; canonical docs now supersede those older notes.

## Exact Next 3 Steps
1. Run `npm run deploy:unity` against the configured Unity test project with the new default `Assets/Plugins/Radebe` target.
2. Verify a smoke `.rdb` asset still imports as a generated Sprite when the CLI payload lives under `Assets/Plugins/Radebe/Tools/radebe-cli/<platform>-<arch>/`.
3. If validation passes, scope the first actual distributable packaging step around one coherent `Assets/Plugins/Radebe` plugin artifact.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `t-115-unity-plugin-root-verify`.

Objective:
- Validate the Unity bridge after the install-root migration to `Assets/Plugins/Radebe`.

Done criteria:
- `npm run deploy:unity` installs the bridge into a configured Unity project under `Assets/Plugins/Radebe`.
- The packaged CLI payload is present under `Assets/Plugins/Radebe/Tools/radebe-cli/<platform>-<arch>/`.
- A smoke `.rdb` asset imports successfully and produces a generated Sprite main asset.
- Docs are updated if the verification uncovers any path or packaging issues.

Constraints:
- Keep Unity consuming the packaged `radebe-cli`; do not add a C# renderer.
- Keep the deliverable packaging format itself out of scope unless verification forces a structural change.
- Preserve `artifacts/...` as internal build staging rather than a user-facing Unity concept.

Read order:
1) AGENTS.md
2) docs/project/task-board.md (item: T-115)
3) docs/project/roadmap.md (milestone: M2)
4) docs/project/session-log/2026-05-23-t-115-unity-plugin-root-layout.md
5) radebe-unity/docs/cli-bridge-contract.md
6) scripts/src/unity-deploy.ts
7) radebe-unity/Assets/Editor/RadebeCliBridgeHelper.cs

At completion:
- Update task-board, roadmap if needed, decisions if needed, session-log, and main-thread-state.
- Return a handoff using docs/agent/handoff-template.md.
```

This is a good handoff point. Start a new worker thread.
