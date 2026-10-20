# Session Log - Worker Thread - T-135 GitHub Actions Pipeline

Date: `2026-10-20`
Thread: `t135-github-actions`
Milestone: `M4`
Gate: `Gate B`
Task: `T-135`

## Summary
- Published the repository at https://github.com/kkjamie/radebe; local `development` history was pushed as `main`.
- Replaced the Azure DevOps pipeline (website build plus Cloudflare Pages deploy only, no tests) with `.github/workflows/ci.yml`:
    - **test job:** `npm ci`, `npm run build`, `npm run typecheck`, `npm test` on Ubuntu and Windows, with Node from `.nvmrc` and npm pinned to 10.9.2 for `engine-strict`. Runs on every push and pull request to `main`.
    - **deploy-site job:** only on `main` after tests pass. Builds `build:release:web`, sets the Cloudflare Pages production branch to `main`, and deploys `radebe-web/dist` with `cloudflare/wrangler-action`.
- DEC-089: keep Cloudflare Pages hosting (stable URL, no `/radebe/` base-path changes), deployed from GitHub Actions. Supersedes the GitHub Pages part of DEC-079.
- Secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` were added to the GitHub repository by Jamie.

## Files Updated
- `.github/workflows/ci.yml` (new)
- `docs/project/decisions.md`
- `docs/project/milestones/M4-github-migration.md`
- `docs/project/task-board.md`
- `docs/project/release-process.md`
- `docs/project/main-thread-state.md`
- `docs/project/session-log/2026-10-20-t135-github-actions.md`

## Verification
- Locally, the same commands passed before this change: `npm run build`, `npm test` (138 tests).
- The first GitHub Actions run follows this push; record its result in the next session log.

## Remaining Work
- Confirm the first run is green and the site deploys to radebe.pages.dev.
- Disable the Azure DevOps pipeline, revoke its Cloudflare token, then delete `azure-pipelines.yml`.
- Optional: branch protection on `main` requiring the test checks.
- Gate D: a release workflow on `v*` tags for CLI SEA executables (per-platform matrix), the VSIX and the Unity package, with SHA-256 checksums attached to a GitHub Release.

## Next Step
- Watch the first workflow run, then retire the Azure pipeline.
