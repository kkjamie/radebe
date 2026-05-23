# T-119 Node Baseline Bump

Date: `2026-05-23`
Thread: `codex-main`
Task: `T-119`
Milestone/Gate: `M2 / Gate C`

## Scope
- Fix the second hosted Azure DevOps install failure after the npm pin was already corrected.
- Choose between pinning a transitive tooling dependency and advancing the repo's Node baseline.

## Completed
- Investigated the new hosted failure and confirmed:
  - npm was now correct at `10.9.2`
  - the install still failed because `@vscode/vsce@3.9.1` resolves `cheerio@1.2.0`
  - `cheerio@1.2.0` declares `engines.node >=20.18.1`
- Chose to advance the repo baseline instead of fighting the transitive dependency graph.
- Updated the runtime baseline from Node `20.9.0` to `20.18.1` in:
  - root `package.json` `engines`
  - `.nvmrc`
  - `README.md`
  - `azure-pipelines.yml`
- Logged DEC-060 for the Node baseline advance.
- Updated project tracking docs so the current expected runtime is clear.

## Validation
- Validation in this thread is configuration-level only. The next hosted Azure pipeline run should confirm that `npm ci` now gets past the `cheerio` engine check.

## Remaining
- Re-run the hosted pipeline with Node `20.18.1`.
- If install passes, continue to the next hosted blocker, likely variable-group authorization, Cloudflare credentials, or deploy configuration.
- Update local developer machines to Node `20.18.1` when resuming local npm work.

## Risks / Blockers
- Contributors still on Node `20.9.0` will now fail the root engine check locally until they switch to `20.18.1`.
- The hosted pipeline may still expose later deploy-environment issues after install succeeds.

## Exact Next 3 Steps
1. Re-run the Azure pipeline and confirm the Node step now installs `20.18.1`.
2. Verify that `npm ci` gets past the previous `cheerio` engine failure.
3. If the run fails later, use that next concrete hosted error to finish the Azure/Cloudflare wiring.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `t-119-release-ci-node-verify`.

Objective:
- Verify the Azure DevOps release pipeline after advancing the repo Node baseline to 20.18.1.

Done criteria:
- The hosted pipeline gets past the previous `cheerio` / Node engine failure.
- Any next blocker is identified precisely.
- Project docs are updated with the hosted outcome.

Read order:
1) AGENTS.md
2) docs/project/task-board.md (item: T-119)
3) docs/project/roadmap.md (milestone: M2)
4) docs/project/decisions.md (DEC-058, DEC-059, DEC-060)
5) docs/project/session-log/2026-05-23-t-119-pipeline-npm-fix.md
6) docs/project/session-log/2026-05-23-t-119-variable-group-link.md
7) docs/project/session-log/2026-05-23-t-119-node-baseline-bump.md
8) azure-pipelines.yml
9) package.json
```

This is a good handoff point. Start a new worker thread.
