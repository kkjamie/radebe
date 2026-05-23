# T-119 Linux Deploy Stage

Date: `2026-05-23`
Thread: `codex-main`
Task: `T-119`
Milestone/Gate: `M2 / Gate C`

## Scope
- Investigate why the new pipeline did not create a visible Cloudflare Pages deployment after being merged to `master`.
- Reduce drift from the known-good legacy deploy environment without giving up the Windows build requirement.

## Completed
- Compared the current repo pipeline against `radebe-legacy`.
- Confirmed the main remaining environment difference in the deploy path was that the new repo was running `wrangler pages deploy` on Windows, while the legacy project used `ubuntu-latest`.
- Reshaped `azure-pipelines.yml` into two stages:
  - `Build` stage on `windows-latest`
  - `Deploy` stage on `ubuntu-latest`
- Kept the Windows stage responsible for:
  - `npm ci`
  - `npm run build:release:web`
  - publishing `radebe-web-dist`
  - publishing packaged download artifacts
  - publishing the Windows CLI payload
- Moved the Cloudflare steps to Linux:
  - download the published `radebe-web-dist` artifact
  - run the project `PATCH` call for production branch alignment
  - run `wrangler pages deploy` from Ubuntu using the downloaded static output
- Logged DEC-061 for the Windows-build/Linux-deploy split.

## Validation
- Validation in this thread is structural only. The next hosted Azure run needs to confirm that Cloudflare now records a real Pages deployment event when the Linux deploy stage runs.

## Remaining
- Re-run the pipeline from `master`.
- Check that the `Deploy Website` stage actually runs and that `Download website artifact` contains the built static files.
- If Cloudflare still shows no deployment, capture the exact deploy-stage log from `wrangler pages deploy`.

## Risks / Blockers
- The root issue may still be Cloudflare credentials, project naming, or variable values rather than Windows-vs-Linux behavior.
- If the artifact download path is wrong, the Linux deploy stage could still succeed at setup but fail to upload the intended folder.

## Exact Next 3 Steps
1. Re-run the `master` pipeline and confirm the new `Deploy Website` stage appears after the Windows build stage.
2. Check the `Deploy to Cloudflare Pages` log output for an actual deployment URL or explicit Cloudflare error.
3. Compare the resulting Cloudflare Pages deployment list against the run timestamp to confirm the deploy event is finally being created.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `t-119-release-ci-deploy-verify`.

Objective:
- Verify the split Windows-build/Linux-deploy Azure pipeline creates a real Cloudflare Pages deployment.

Done criteria:
- The hosted pipeline runs the Linux deploy stage.
- Cloudflare shows a corresponding deployment event, or the next deploy blocker is identified precisely from the wrangler output.
- Project docs are updated with the result.

Read order:
1) AGENTS.md
2) docs/project/task-board.md (item: T-119)
3) docs/project/roadmap.md (milestone: M2)
4) docs/project/decisions.md (DEC-059, DEC-060, DEC-061)
5) docs/project/session-log/2026-05-23-t-119-variable-group-link.md
6) docs/project/session-log/2026-05-23-t-119-node-baseline-bump.md
7) docs/project/session-log/2026-05-23-t-119-linux-deploy-stage.md
8) azure-pipelines.yml
```

This is a good handoff point. Start a new worker thread.
