# Session Log: Runtime Version Pinning

Date: `2026-05-22`
Thread: `codex-main`
Task: `T-111`
Milestone/Gate: `M2 / Gate B`

## Scope Completed
- Added an explicit local runtime policy for the workspace instead of relying on whatever Node.js version happens to be installed on each developer machine.
- Pinned Node.js `20.9.0` and npm `10.9.2` in root workspace metadata and local setup docs.
- Enabled npm engine enforcement so mismatched runtimes fail early.

## Files Changed
- `package.json`: added root `engines` for Node.js `20.9.0` and npm `10.9.2`.
- `.npmrc`: enabled `engine-strict=true`.
- `.nvmrc`: added the pinned Node.js version for version-manager workflows.
- `README.md`: documented the required runtime and local setup flow.
- `docs/project/codebase-map.md`: noted the new runtime-version files in the top-level layout.
- `docs/project/task-board.md`: recorded T-111 completion.
- `docs/project/decisions.md`: logged the accepted runtime-pinning decision.
- `docs/project/main-thread-state.md`: summarized the pinned-runtime baseline for future threads.

## Behavioral Impact
- The repo now communicates one expected local Node/npm baseline instead of silently accepting runtime drift across machines.
- `npm install` and similar npm operations will now fail early on unsupported Node/npm versions because root `engine-strict` enforces the declared `engines`.
- Contributors using `nvm`-style tooling can switch directly to the pinned Node version from `.nvmrc`.

## Tests / Verification
- Verified local machine runtime with `node -v`: `v20.9.0`.
- Not run: full build/test suite, because this task only changed runtime policy metadata and docs rather than executable source behavior.

## Remaining Work
- Optionally add a second version-manager file such as `.node-version` later if the team standardizes on tools that prefer it over `.nvmrc`.
- Revisit the pinned baseline when the project intentionally upgrades Node or npm.

## Risks / Blockers
- Exact pinning is intentionally strict; contributors on a different patch release will need to switch versions before using npm in this repo.

## Exact Next 3 Steps
1. Run `npm install` or the normal dev command on another machine to confirm the engine enforcement message is clear.
2. If the team wants a looser policy later, decide whether to widen `engines` to a bounded range instead of one exact patch version.
3. When the project upgrades runtime requirements, update `package.json`, `.nvmrc`, README, and the decision log together.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `T-111-follow-up`.

Objective:
- Validate the new runtime-pinning policy from a contributor experience perspective and decide whether exact patch pinning should remain strict or be widened to a bounded Node 20 range.

Current state:
- The repo now pins Node.js `20.9.0` and npm `10.9.2` in root `package.json` `engines`.
- Root `.npmrc` enables `engine-strict=true`.
- Root `.nvmrc` and README setup instructions now document the same baseline.

Done criteria:
- Confirm the policy is the right strictness level or adjust it with focused validation and matching doc updates.
- Update task-board, roadmap if affected, decisions if needed, session-log, and main-thread-state.

Read order:
1) AGENTS.md
2) docs/project/task-board.md
3) docs/project/main-thread-state.md
4) docs/project/session-log/2026-05-22-runtime-version-pinning.md
5) package.json
6) .npmrc
7) README.md
```

This is a good handoff point. Start a new worker thread.
