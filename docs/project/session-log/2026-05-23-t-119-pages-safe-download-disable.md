# T-119 Pages-Safe Download Disable

Date: `2026-05-23`
Thread: `codex-main`
Task: `T-119`
Milestone/Gate: `M2 / Gate C`

## Scope
- Temporarily remove the oversized public downloads from the deployed website so Cloudflare Pages can accept the site output.
- Hide the public site pages that currently advertise those blocked downloads.

## Completed
- Investigated the hosted Linux deploy log and confirmed the real Cloudflare failure:
  - `wrangler pages deploy` reported `Pages only supports files up to 25 MiB in size`
  - `downloads/radebe-cli-win32-x64.exe` was `66.9 MiB`
- Updated `radebe-web/vite.config.ts` so the web build no longer copies:
  - the VSIX
  - the Unity package
  - the Windows CLI executable
  into `dist/downloads/`
- Kept only the small `radebe-unity-bridge.manifest.json` web-served download asset.
- Emptied the public `integrationPages` list so the VS Code and Unity integration pages are temporarily removed from routing/nav.
- Updated the sidebar rendering so the Integrations section disappears cleanly when no integration pages are published.
- Logged DEC-062 for the temporary decision to keep large release binaries out of Cloudflare Pages.

## Validation
- `npm run build:release:web` passed outside the sandbox after the change.
- Confirmed `radebe-web/dist/downloads/` now contains only:
  - `radebe-unity-bridge.manifest.json`

## Remaining
- Re-run the hosted Azure DevOps pipeline and confirm Cloudflare Pages now accepts the site deploy.
- Add external public artifact hosting for the large release binaries, likely Cloudflare R2.
- Reintroduce public integration/download pages once those links point to the external host instead of Pages-served assets.

## Risks / Blockers
- The site will now deploy, but the public download surface is intentionally incomplete until external hosting is added.
- Any old documentation or expectations that the site directly serves the VSIX, Unity package, or Windows CLI are temporarily stale until the R2 follow-up lands.

## Exact Next 3 Steps
1. Re-run the `master` pipeline and confirm the Pages deploy succeeds with only the small manifest under `dist/downloads/`.
2. Set up Cloudflare R2 for release binaries and prepare stable external download URLs.
3. Switch the website integration pages to config-driven external download links, then republish those pages.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `t-119-r2-download-hosting`.

Objective:
- Move the large public release downloads off Cloudflare Pages and onto external hosting, likely Cloudflare R2.

Done criteria:
- The hosted site deploy succeeds without oversized binaries in `dist`.
- A concrete external hosting path for the VSIX, Unity package, and Windows CLI is implemented or fully scaffolded.
- The website is ready to point its public download links at the external host.

Read order:
1) AGENTS.md
2) docs/project/task-board.md (item: T-119)
3) docs/project/roadmap.md (milestone: M2)
4) docs/project/decisions.md (DEC-061, DEC-062)
5) docs/project/session-log/2026-05-23-t-119-linux-deploy-stage.md
6) docs/project/session-log/2026-05-23-t-119-pages-safe-download-disable.md
7) azure-pipelines.yml
8) radebe-web/vite.config.ts
9) radebe-web/src/pages/integrations.tsx
```

This is a good handoff point. Start a new worker thread.
