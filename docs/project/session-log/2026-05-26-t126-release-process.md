# Session Log: T-126 Release Process Formalization

Date: `2026-05-26`
Thread: `codex`
Task: `T-126`
Milestone/Gate: `M2 / Gate D`

## Scope Completed
- Added `docs/project/release-process.md` as the canonical release checklist for Radebe.
- Formalized the distinction between "push to `master` triggers CI/deploy" and "a release commit already contains the intended version bump, release notes, and public download/copy updates".
- Documented the versioning policy for M2 closeout and established the release-process baseline that was later refined into the explicit product/site split.
- Updated M2/T-126 tracking so the remaining closeout work now explicitly includes the documented release checklist as part of the release-path story rather than treating T-126 as artifact hosting alone.

## Files Changed
- `docs/project/README.md`
- `docs/project/release-process.md`
- `docs/project/task-board.md`
- `docs/project/roadmap.md`
- `docs/project/milestones/M2-scale-and-optimization.md`
- `docs/project/decisions.md`
- `docs/project/main-thread-state.md`
- `docs/project/session-log/2026-05-26-t126-release-process.md`

## Behavioral Impact
- No runtime behavior changed.
- The repo now has an explicit release-prep checklist covering version bumps, release notes, artifact/public-copy review, validation commands, CI/deploy, and post-deploy verification.
- The version-display question now has a documented answer: the top bar should keep showing the product/toolchain version rather than a site-only build identifier.

## Remaining Work
- Finish the external artifact hosting path for large public downloads.
- Restore the public integration/download pages once hosted artifacts are available again.
- Validate the new release checklist against the real staged `master` pipeline and close T-126 only after hosted deploy verification is complete.

## Risks / Blockers
- Cloudflare Pages still cannot host the large CLI and Unity downloads directly inside the static site bundle.
- The repo now has the release checklist, but the hosted artifact path and final end-to-end release validation are still outstanding.
- If website-only deploys become frequent, the project may still want a subtle site/build identifier later, but that is intentionally not a second public version stream yet.

## Exact Next 3 Steps
1. Wire the external artifact host into the Azure/Cloudflare release flow and restore the public download surfaces.
2. Run the real release checklist against a prepared `master` release commit and verify the hosted pipeline output.
3. Mark T-126 complete and pass M2 Gate D only after hosted downloads, deployment, and release docs all agree.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `t-126-release-hosting-closeout`.

Objective:
- Finish the remaining M2 release path by wiring hosted public downloads into the staged release flow and validating the documented release checklist end to end.

Current state:
- `docs/project/release-process.md` now defines the canonical release checklist, including version bumps, release notes, validation commands, CI/deploy, and post-deploy verification.
- DEC-070 now records the split public versioning policy: keep one aligned product version across the workspace, keep that version in the website top bar and release notes, and use a separate site/build version for traceable website-only deploys.
- T-126 is still open because Cloudflare Pages cannot host the large CLI and Unity downloads directly inside the site bundle.

Done criteria:
- Choose and wire the external artifact host.
- Restore the public integration/download pages with validated hosted URLs.
- Prove the staged Azure/Cloudflare release path end to end using the documented release checklist.
- Update task-board, roadmap if needed, decisions if a new infrastructure choice is made, session-log, and main-thread-state.

Read order:
1) AGENTS.md
2) docs/project/task-board.md
3) docs/project/roadmap.md
4) docs/project/milestones/M2-scale-and-optimization.md
5) docs/project/release-process.md
6) docs/project/main-thread-state.md
7) docs/project/session-log/2026-05-26-t126-release-process.md
8) docs/project/session-log/2026-05-26-t074-closeout.md
9) docs/project/session-log/2026-05-23-t-119-pages-safe-download-disable.md
10) azure-pipelines.yml
```

This is a good handoff point. Start a new worker thread.
