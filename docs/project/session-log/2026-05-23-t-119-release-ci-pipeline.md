# T-119 Release CI Pipeline

Date: `2026-05-23`
Thread: `codex-main`
Task: `T-119`
Milestone/Gate: `M2 / Gate C`

## Scope
- Add the first CI pipeline that builds the Unity package, VS Code extension, and website in the dependency order the website release needs.
- Reuse the existing `radebe-legacy` deploy shape and environment assumptions where possible.
- Make the website build emit its downloadable artifacts into the static output instead of depending on dev-server middleware only.

## Completed
- Added `azure-pipelines.yml` for Azure DevOps with:
  - `master` trigger and PR validation
  - `windows-latest` agent so CI produces the site-linked `win32-x64` SEA executable
  - `npm ci`
  - `npm run build:release:web`
  - published pipeline artifacts for `radebe-web/dist`, `Temp`, and `artifacts/radebe-cli/sea/win32-x64`
  - Cloudflare Pages deploy steps patterned after `radebe-legacy`
- Added root `npm run build:release:web`, which packages the VS Code extension and Unity plugin before building `radebe-web`.
- Narrowed `package:vscode` and `install:vscode` so they only build `@radebe/core` and the VS Code extension instead of rebuilding the full workspace.
- Updated the web Vite config so production builds copy:
  - `Temp/radebe-language-support-0.1.0.vsix`
  - `Temp/radebe-unity-plugin-0.1.0.unitypackage`
  - `radebe-unity/bridge.manifest.json`
  - `artifacts/radebe-cli/sea/win32-x64/radebe.exe`
  into `radebe-web/dist/downloads/`
- Renamed the default Unity package output from `...-poc.unitypackage` to `Temp/radebe-unity-plugin-0.1.0.unitypackage` so the packaging output, website links, and static copy step all share one canonical artifact name.
- Updated README and Unity README instructions to match the new release-build flow.
- Logged DEC-057 for the Windows-based release build chain and static-download copy contract.

## Validation
- `npm run build:release:web` passed outside the sandbox.
- The resulting static download folder contained:
  - `radebe-web/dist/downloads/radebe-language-support-0.1.0.vsix`
  - `radebe-web/dist/downloads/radebe-unity-plugin-0.1.0.unitypackage`
  - `radebe-web/dist/downloads/radebe-unity-bridge.manifest.json`
  - `radebe-web/dist/downloads/radebe-cli-win32-x64.exe`
- Local in-sandbox npm validation was blocked by a Windows sandbox path-permission issue when Node tried to `lstat` the user profile temp path; the release build was re-run successfully outside the sandbox.

## Remaining
- Create or wire up the Azure DevOps pipeline in the project UI if it is not already auto-detected from `azure-pipelines.yml`.
- Configure or verify the Cloudflare secrets and any pipeline variables in Azure DevOps.
- Run the first hosted CI build and check the deployed site download links in the real environment.

## Risks / Blockers
- The Azure pipeline has not yet been exercised in the hosted Azure DevOps environment, so any organization-specific service connection or secret naming mismatch is still possible.
- The current website download contract is explicitly Windows-focused for the CLI payload because the site links `radebe-cli-win32-x64.exe`; additional platform artifacts would need separate release and UI decisions.

## Exact Next 3 Steps
1. Create or select the Azure DevOps pipeline for `azure-pipelines.yml` and set the Cloudflare secret variables it expects.
2. Run the first hosted pipeline on `master` and confirm that `radebe-web-dist`, `radebe-release-downloads`, and `radebe-cli-win32-x64` publish correctly.
3. Open the deployed site and verify that the VSIX, Unity package, manifest, and Windows CLI download links all return the hosted files.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `t-119-release-ci-verify`.

Objective:
- Verify and finish the first hosted Azure DevOps release pipeline for Radebe.

Done criteria:
- The Azure DevOps pipeline from `azure-pipelines.yml` has been run or inspected in the hosted environment.
- Any variable, secret, or path mismatches blocking deployment are identified or fixed.
- The deployed website download links are checked against the hosted outputs.

Read order:
1) AGENTS.md
2) docs/project/task-board.md (item: T-119)
3) docs/project/roadmap.md (milestone: M2)
4) docs/project/decisions.md (DEC-056, DEC-057)
5) docs/project/session-log/2026-05-23-t-118-promote-native-unity-packaging.md
6) docs/project/session-log/2026-05-23-t-119-release-ci-pipeline.md
7) azure-pipelines.yml
8) package.json
9) radebe-web/vite.config.ts
```

This is a good handoff point. Start a new worker thread.
