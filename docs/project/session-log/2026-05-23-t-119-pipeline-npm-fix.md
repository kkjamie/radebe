# T-119 Pipeline npm Fix

Date: `2026-05-23`
Thread: `codex-main`
Task: `T-119`
Milestone/Gate: `M2 / Gate C`

## Scope
- Fix the first hosted Azure DevOps failure from the new release pipeline.
- Keep the strict repo engine contract instead of weakening it to match the hosted agent default tooling.

## Completed
- Investigated the Azure DevOps failure log and confirmed the issue was:
  - Node matched the repo requirement: `v20.9.0`
  - npm did not: hosted agent provided `10.1.0` instead of the required `10.9.2`
- Updated `azure-pipelines.yml` to:
  - add `npmVersion: "10.9.2"`
  - install that npm version globally before `npm ci`
  - print `node --version` and `npm --version` after the pin step for easier future diagnosis
- Logged DEC-058 for explicitly pinning npm in Azure DevOps rather than weakening engine enforcement.
- Updated project tracking docs to record that the engine mismatch is fixed in repo config and that remaining pipeline risk is Azure-side environment setup.

## Validation
- Validation in this thread is configuration-level only; the hosted pipeline needs to be re-run in Azure DevOps to confirm the agent now installs with npm `10.9.2`.

## Remaining
- Re-run the hosted pipeline.
- Configure or verify the Azure DevOps variables and Cloudflare secrets in the new repo/pipeline context.
- Confirm whether the new repo needs fresh service connections, variable groups, or manually recreated secret variables because the old pipeline could not be retargeted cleanly.

## Risks / Blockers
- The pipeline may still fail later if the new Azure pipeline does not yet have `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, or any other environment wiring from the legacy setup.
- If the old pipeline could not be retargeted, the new pipeline likely needs its own secret variable setup even if the YAML matches the legacy deploy flow.

## Exact Next 3 Steps
1. Re-run the Azure pipeline and confirm the new `Pin npm` step reports npm `10.9.2`.
2. If the build gets past `npm ci`, check the next failure point and verify the new pipeline has the required Cloudflare secret variables.
3. If deploy wiring is still blocked, recreate the needed Azure DevOps variables or variable group bindings in the new repo/pipeline rather than trying to retarget the legacy pipeline.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `t-119-release-ci-env-verify`.

Objective:
- Re-run the hosted Azure DevOps release pipeline after the npm pin fix and finish the environment wiring for the new repo.

Done criteria:
- The pipeline gets past the previous npm engine failure.
- Any missing Azure DevOps variables, secret bindings, or Cloudflare deploy settings are identified or fixed.
- The next real hosted blocker, if any, is documented clearly.

Read order:
1) AGENTS.md
2) docs/project/task-board.md (item: T-119)
3) docs/project/roadmap.md (milestone: M2)
4) docs/project/decisions.md (DEC-057, DEC-058)
5) docs/project/session-log/2026-05-23-t-119-release-ci-pipeline.md
6) docs/project/session-log/2026-05-23-t-119-pipeline-npm-fix.md
7) azure-pipelines.yml
```

This is a good handoff point. Start a new worker thread.
