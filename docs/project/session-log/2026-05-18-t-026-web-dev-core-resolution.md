# Session Log: T-026 Web Dev Core Resolution

Date: `2026-05-18`
Thread: `t-026-web-dev-core-resolution`

## Scope
- Fix `npm run dev:web` failing during Vite dependency scanning when `@radebe/core` has not already been built to `dist`.

## Work Completed
- Added `radebe-web/vite.config.ts`.
- Configured Vite aliases for `@radebe/core` and its exported subpaths to resolve to `radebe-core/src`.
- Allowed the workspace root through Vite's dev-server file-system guard so the web package can serve the linked core source cleanly.

## Verification
- Confirmed Vite's resolver maps `@radebe/core` to `D:/projects/personal/radebe/radebe-core/src/index.ts`.
- Ran `npm run dev:web`; Vite reached ready state without the prior dependency-scan failure.
- Ran `npm run build` successfully.
- Ran `npm run test` successfully after the full build produced all workspace `dist/test` outputs.

## Notes
- The package manifest for `@radebe/core` still points published/runtime consumers at `dist`.
- The web package now has a source-level development path, which preserves fast iteration without requiring a prebuild.
- The first sandboxed `npm run test` attempt failed with an environment `EPERM` against `C:\Users\Jamie.Healey`; rerunning outside the sandbox succeeded.

## Next Recommendation
- Continue with the planned M2 Gate C / language-slice work now that the web authoring loop starts from a fresh workspace.
