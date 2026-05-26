# 2026-05-26 First Formal Release Prep

## Scope
- Prepare the first formal Radebe release candidate with real release notes, explicit version markers, and version-safe release artifact naming before the user smoke tests and pushes.

## Changes
- Kept the public product version at `0.1.0` and moved the website deploy marker to `siteVersion` `2026-05-26.1` in `radebe-web/src/content/version.ts`.
- Reworked `radebe-web/src/pages/release-notes.tsx` so the site now presents `v0.1.0` as the first formal release instead of a generic development build, and shows the site build marker alongside the dated entry.
- Updated `scripts/src/unity-package-native-poc.ts` so the default `.unitypackage` filename derives from the root workspace version rather than a hardcoded `0.1.0` string.
- Updated `scripts/install-vscode-extension.mjs` to package the staged VSIX with `--no-dependencies`, which avoids unnecessary dependency probing during local VSIX packaging.
- Flattened the release-related root scripts in `package.json` away from nested `npm run` hops toward direct tool invocations so the formal release path is less dependent on npm wrapper behavior.
- Updated release-facing docs in `README.md`, `radebe-unity/README.md`, and `docs/project/release-process.md` to reflect the formal release setup and the concrete `siteVersion` format.
- Recorded DEC-071 to make `YYYY-MM-DD.N` the canonical `siteVersion` format.

## Validation
- `npm run typecheck` passed.
- `npm test` passed.
- `node scripts/install-vscode-extension.mjs` passed and produced `Temp/radebe-language-support-0.1.0.vsix`.
- `node scripts/dist/src/sea.js build` passed and produced `artifacts/radebe-cli/sea/win32-x64/radebe.exe`.
- `node scripts/dist/src/sea.js smoke` passed.
- `node scripts/dist/src/unity-package-native-poc.js` passed and produced `Temp/radebe-unity-plugin-0.1.0.unitypackage`.
- `node radebe-web/scripts/generate-example-previews.mjs` passed.
- `node ./node_modules/typescript/bin/tsc -b radebe-web` passed.
- `node ../node_modules/vite/bin/vite.js build` from `radebe-web/` passed.

## Notes
- In this Codex shell, `npm run build:release:web` still fails before script execution because the local npm wrapper trips over a Windows short-path `EPERM` on `C:\Users\JamieH~1`. The equivalent direct release-build steps above did pass, so the prepared release candidate itself looks healthy even though that one wrapper command needs separate environment follow-up.
- T-126 remains open because external artifact hosting plus the final public push/tag path are still pending.

## End-of-Thread Handoff
1. Scope completed
- Prepared the first formal `v0.1.0` release candidate, updated the public release notes/version markers, removed hardcoded Unity package versioning, and validated the release candidate locally through direct build/smoke steps.

2. Files changed
- `README.md`
- `docs/project/task-board.md`
- `docs/project/roadmap.md`
- `docs/project/decisions.md`
- `docs/project/main-thread-state.md`
- `docs/project/release-process.md`
- `docs/project/session-log/2026-05-26-first-formal-release-prep.md`
- `package.json`
- `radebe-unity/README.md`
- `radebe-web/src/content/version.ts`
- `radebe-web/src/pages/release-notes.tsx`
- `scripts/install-vscode-extension.mjs`
- `scripts/src/unity-package-native-poc.ts`

3. Behavioral impact
- The site now presents a real first-release entry for `v0.1.0`.
- The website has a concrete deploy marker format via `siteVersion` `YYYY-MM-DD.N`.
- Native Unity package output names now follow the canonical workspace version automatically.
- VSIX packaging skips unnecessary dependency probing during local packaging.

4. Remaining work
- User smoke test of the prepared release candidate.
- External artifact hosting for large public downloads.
- Final push/tag/hosted deploy validation for T-126.

5. Risks or blockers
- `npm run build:release:web` still fails in this Codex shell before script execution because of a Windows short-path `EPERM` in the local npm wrapper environment, even though the equivalent direct release-build steps passed.
- Cloudflare Pages still cannot host the large CLI and Unity downloads directly, so T-126 remains open until external artifact hosting lands.

6. Exact next 3 steps
1. Smoke test the prepared `v0.1.0` / `site 2026-05-26.1` release candidate locally.
2. Wire the external artifact host into the release flow and restore the public integration/download pages.
3. Push the prepared release, create the matching `product/v0.1.0` tag, and verify CI, deployment, and hosted artifacts.

7. Paste-ready prompt for the next thread
```md
You are working in worker thread `t-126-release-candidate-smoke-and-push`.

Objective:
- Smoke test the prepared `v0.1.0` / `site 2026-05-26.1` release candidate, then continue T-126 toward the real push/tag/deploy path.

Done criteria:
- The current release candidate is manually smoke tested.
- Any release-blocking issues found during smoke testing are fixed or explicitly logged.
- The next concrete action for external artifact hosting and final push/tag validation is updated in the project docs.

Constraints:
- Do not redefine roadmap priorities.
- Keep the public product version at `0.1.0` unless smoke testing uncovers a reason to cut a different release.
- Remember that `npm run build:release:web` is currently failing in this Codex shell because of a local npm wrapper `EPERM`; use the validated direct release-build steps if needed.

Read order:
1) AGENTS.md
2) docs/project/task-board.md (item: T-126)
3) docs/project/roadmap.md
4) docs/project/milestones/M2-scale-and-optimization.md
5) docs/project/release-process.md
6) docs/project/session-log/2026-05-26-first-formal-release-prep.md
7) docs/project/main-thread-state.md

At completion:
- Update task-board, roadmap (if affected), decisions (if needed), and session-log.
- Update docs/project/main-thread-state.md.
- Return a handoff using docs/agent/handoff-template.md.
- If checkpoint reached, say: "This is a good handoff point. Start a new worker thread."
```
