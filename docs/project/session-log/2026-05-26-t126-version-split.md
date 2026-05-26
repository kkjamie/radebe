# Session Log: T-126 Product And Site Version Split

Date: `2026-05-26`
Thread: `codex`
Task: `T-126`
Milestone/Gate: `M2 / Gate D`

## Scope Completed
- Split the website version source into separate `productVersion` and `siteVersion` values.
- Kept the visible web UI on `productVersion` so the top bar and release notes still represent the main Radebe release.
- Updated the canonical release-process and decision docs so site-only deploys are now an expected first-class flow rather than an edge case.

## Files Changed
- `radebe-web/src/content/version.ts`
- `radebe-web/src/data.ts`
- `radebe-web/src/main.tsx`
- `radebe-web/src/pages/release-notes.tsx`
- `docs/project/release-process.md`
- `docs/project/decisions.md`
- `docs/project/main-thread-state.md`
- `docs/project/roadmap.md`
- `docs/project/session-log/2026-05-26-t126-version-split.md`

## Behavioral Impact
- The website code now has separate version fields for product and site concerns.
- The top bar still shows the product version, which avoids confusing users with a site-only build number.
- Future site-only deploys can bump `siteVersion` without forcing a package/product version change.

## Remaining Work
- Decide how the site version should be formatted over time, such as semver-with-build metadata or a date/build number.
- Optionally expose the site version in a subtle footer or diagnostics area later.
- Finish the hosted artifact path and end-to-end release validation for T-126.

## Risks / Blockers
- `siteVersion` and `productVersion` currently start at the same value; the operational benefit comes once future site-only deploys bump only the site version.
- The site version is not yet displayed anywhere, so deploy tracking still depends on repo state unless a footer/diagnostics surface is added later.
- T-126 still depends on external artifact hosting for large downloads.

## Exact Next 3 Steps
1. Choose the ongoing `siteVersion` format and start using it on the next website-only deploy.
2. Finish the hosted download path so the release checklist can be exercised end to end.
3. Optionally add a subtle footer or diagnostics readout for `siteVersion` once the team wants visible deploy tracing.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `t-126-release-hosting-closeout`.

Objective:
- Finish the remaining M2 release path by wiring hosted public downloads into the staged release flow and validating the documented release checklist end to end.

Current state:
- The website version source is now split into `productVersion` and `siteVersion` in `radebe-web/src/content/version.ts`.
- The top bar and release notes still use `productVersion`; `siteVersion` is reserved for traceable site-only deploys.
- `docs/project/release-process.md` now treats product releases and website-only deploys as distinct release shapes.
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
8) docs/project/session-log/2026-05-26-t126-version-split.md
9) docs/project/session-log/2026-05-23-t-119-pages-safe-download-disable.md
10) azure-pipelines.yml
```

This is a good handoff point. Start a new worker thread.
