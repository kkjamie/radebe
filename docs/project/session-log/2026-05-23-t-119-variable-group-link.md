# T-119 Variable Group Link

Date: `2026-05-23`
Thread: `codex-main`
Task: `T-119`
Milestone/Gate: `M2 / Gate C`

## Scope
- Make the new Azure DevOps pipeline consume the Library variable group that was created for the new repo.

## Completed
- Updated `azure-pipelines.yml` to reference the Azure DevOps variable group `Radebe Variables` directly in YAML with:
  - `variables:`
  - `- group: Radebe Variables`
- Kept the repo-owned non-secret pipeline defaults in YAML alongside the group reference.
- Logged DEC-059 so the new repo pipeline's dependency on the Library variable group is explicit in project history.
- Updated project tracking docs to note that the remaining hosted risk is variable-group authorization or bad values rather than missing YAML linkage.

## Validation
- Validation in this thread is configuration-level only. The next Azure pipeline run needs to confirm the pipeline is authorized to use `Radebe Variables` and that the expected values resolve at runtime.

## Remaining
- Re-run the hosted pipeline.
- If Azure blocks access to the group, authorize the pipeline to use `Radebe Variables`.
- If deploy still fails, inspect the concrete variable values in the group, especially the Cloudflare credentials and any expected project/account identifiers.

## Risks / Blockers
- Azure DevOps may require explicit authorization for this pipeline to consume the variable group even though the YAML now references it correctly.
- If the variable group names do not exactly match the names expected by the deploy steps, the pipeline will fail later during the Cloudflare steps.

## Exact Next 3 Steps
1. Re-run the pipeline and check whether Azure prompts for or reports variable-group authorization.
2. If the build gets through packaging, verify the deploy steps can read `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` from `Radebe Variables`.
3. If it still fails, capture the next hosted error and continue from that concrete blocker rather than changing YAML blindly.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `t-119-release-ci-authorize-group`.

Objective:
- Verify the new Azure DevOps pipeline can use the `Radebe Variables` library group and continue past setup.

Done criteria:
- The pipeline is confirmed to be authorized for `Radebe Variables`.
- The next hosted run shows whether the remaining blocker is variable values, Cloudflare deploy config, or something else.
- Project docs are updated with the outcome.

Read order:
1) AGENTS.md
2) docs/project/task-board.md (item: T-119)
3) docs/project/roadmap.md (milestone: M2)
4) docs/project/decisions.md (DEC-057, DEC-058, DEC-059)
5) docs/project/session-log/2026-05-23-t-119-release-ci-pipeline.md
6) docs/project/session-log/2026-05-23-t-119-pipeline-npm-fix.md
7) docs/project/session-log/2026-05-23-t-119-variable-group-link.md
8) azure-pipelines.yml
```

This is a good handoff point. Start a new worker thread.
