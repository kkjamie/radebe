# Session Log: T-126 Web-Only Release

Date: `2026-05-27`
Thread: `codex`
Task: `T-126`
Milestone/Gate: `M2 / Gate D`

## Scope Completed
- Re-scoped the `v0.1.0` public release to a web-only site publish with no CLI, VSIX, or Unity package downloads.
- Updated public website copy so the home page and release notes no longer advertise unavailable CLI, Unity, or VS Code downloads.
- Updated `siteVersion` to `2026-05-27.1` for the web-only publish.
- Simplified `npm run build:release:web` so it builds only `@radebe/web`.
- Simplified `azure-pipelines.yml` so the build stage runs on hosted Linux, publishes only `radebe-web/dist`, and no longer publishes packaged download artifacts.
- Updated release process and planning docs so M2 can close around the web-only release while the public source/artifact-hosting decision moves to T-135.

## Files Changed
- `README.md`
- `azure-pipelines.yml`
- `docs/project/decisions.md`
- `docs/project/main-thread-state.md`
- `docs/project/milestones/M2-scale-and-optimization.md`
- `docs/project/release-process.md`
- `docs/project/roadmap.md`
- `docs/project/session-log/2026-05-27-t126-web-only-release.md`
- `docs/project/task-board.md`
- `package.json`
- `radebe-web/src/content/release-notes.ts`
- `radebe-web/src/content/version.ts`
- `radebe-web/src/pages/home.tsx`
- `radebe-web/src/pages/release-notes.tsx`

## Behavioral Impact
- The public site presents `v0.1.0` as the first public web release.
- Public integration/download pages remain hidden.
- The release build no longer spends CI time producing artifacts that are not being published.
- Cloudflare Pages deploy output remains under the single-file limit because no large binaries are copied into `dist`.

## Validation
- `npm run typecheck` passed outside the sandbox after the known local Windows user-profile `EPERM`.
- `npm test` passed.
- `npm run build:release:web` passed outside the sandbox.
- Confirmed `radebe-web/dist/downloads/` contains only `radebe-unity-bridge.manifest.json`; no `.exe`, `.vsix`, or `.unitypackage` is emitted.

## Remaining Work
- Commit, merge/push the web-only release to `master`, and verify the Cloudflare Pages deploy.
- Create the matching `product/v0.1.0` and `site/2026-05-27.1` tags after hosted verification if the release is good.
- Later run T-135 to decide whether public source/artifact hosting moves to GitHub or stays split across Azure/Cloudflare plus a separate artifact host.

## Risks / Blockers
- Hosted Azure/Cloudflare verification is still pending until the release commit reaches `master`.
- The Azure DevOps variable group `Radebe Variables` must still be authorized and correctly populated for the Cloudflare deploy stage.
- The future CLI, VSIX, and Unity public download story remains intentionally deferred.

## Exact Next 3 Steps
1. Commit the web-only release changes and merge/push them to `master`.
2. Verify the hosted Azure/Cloudflare Pages deployment and check the public site copy.
3. Tag the verified release as `product/v0.1.0` and `site/2026-05-27.1`, then close T-126 if the hosted deploy is good.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `t-126-web-only-release-push-and-verify`.

Objective:
- Finish publishing the web-only `v0.1.0` public release.

Current state:
- The release has been re-scoped to web-only by DEC-074.
- Public integration/download pages are hidden.
- `siteVersion` is `2026-05-27.1`.
- `npm run build:release:web` now builds only `@radebe/web`.
- Azure builds and publishes only the website artifact before the Cloudflare Pages deploy stage.
- Local validation passed: typecheck, tests, web-only release build, and dist download audit.

Done criteria:
- The web-only release commit is on `master`.
- The Azure/Cloudflare Pages deploy succeeds.
- The public site no longer advertises CLI, VSIX, or Unity downloads.
- Matching `product/v0.1.0` and `site/2026-05-27.1` tags are created after hosted verification if the release is good.
- T-126 and M2 Gate D are updated to Done/Passed only after hosted deployment is verified.

Read order:
1) AGENTS.md
2) docs/project/task-board.md
3) docs/project/roadmap.md
4) docs/project/milestones/M2-scale-and-optimization.md
5) docs/project/release-process.md
6) docs/project/decisions.md (DEC-074)
7) docs/project/session-log/2026-05-27-t126-web-only-release.md
8) docs/project/main-thread-state.md
9) azure-pipelines.yml
```
 
This is a good handoff point. Start a new worker thread.
