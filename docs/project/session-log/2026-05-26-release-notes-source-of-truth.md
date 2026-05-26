# 2026-05-26 Release Notes Source Of Truth

## Scope
- Make release-note review an explicit part of release prep, and ensure the public site renders one canonical product release-notes source rather than maintaining separate site/page copy.

## Changes
- Added `radebe-web/src/content/release-notes.ts` as the canonical product release-notes content module.
- Simplified `radebe-web/src/pages/release-notes.tsx` so it now renders the canonical content instead of owning its own release-note data.
- Removed `siteVersion` display from the public release-notes page so the page stays product-release focused instead of mixing in website deploy history.
- Tightened the `v0.1.0` entry copy so it reads like the main public product release notes, without drifting into website-surface inventory.
- Updated `docs/project/release-process.md` so requests to "setup a release" or "prepare a release" explicitly include finalizing the public product release notes.
- Recorded DEC-072 to keep one canonical product release-notes source rendered by the site.

## Behavioral Impact
- The site release-notes page is now product-only.
- Website-only deploys should update `siteVersion`, not the product release notes.
- Release-note wording review is now an explicit release-prep responsibility instead of an implicit polish task.

## Remaining Work
- User smoke test of the prepared `v0.1.0` release candidate and final release-note wording.
- External artifact hosting and final push/tag validation for T-126.

## Paste-Ready Prompt
```md
You are working in worker thread `t-126-release-candidate-smoke-and-push`.

Objective:
- Smoke test the prepared `v0.1.0` release candidate, including the final site-rendered product release notes, then continue T-126 toward the real push/tag/deploy path.

Done criteria:
- The current release candidate is manually smoke tested.
- The site-rendered product release notes are approved or updated.
- Any release-blocking issues found during smoke testing are fixed or explicitly logged.

Constraints:
- Keep product release notes in the canonical `radebe-web/src/content/release-notes.ts` source.
- Do not use the release-notes page for website-only deploy history.
- Remember that `npm run build:release:web` is currently failing in this Codex shell because of a local npm wrapper `EPERM`; use the validated direct release-build steps if needed.
```
