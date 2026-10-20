# Session Log - Worker Thread - T-162 Site Honesty And Author Credit

Date: `2026-10-20`
Thread: `t162-site-honesty-and-credit`
Milestone: `M4`
Gate: `Gate C`
Task: `T-162`

## Summary
- Homepage "Key features" now lists only publicly available features: simple and readable syntax, the browser editor with live preview, and the deterministic in-house renderer.
- Node packages, CLI, Unity integration and the VS Code extension moved under "Coming soon", with a note linking to the roadmap.
- The top bar links to the GitHub repository next to the version pill.
- The sidebar ends with a credit: "Built by Jamie Healey" (LinkedIn) plus a Source link.
- Author and repository URLs live in one content module, `radebe-web/src/content/site-links.ts`.
- IR-003 resolved.

## Files Updated
- `radebe-web/src/content/site-links.ts` (new)
- `radebe-web/src/pages/home.tsx`
- `radebe-web/src/main.tsx`
- `radebe-web/src/styles/shell.css`
- `radebe-web/src/styles/pages.css`
- `docs/project/task-board.md`
- `docs/project/inconsistency-register.md`
- `docs/project/codebase-map.md`
- `docs/project/main-thread-state.md`
- `docs/project/session-log/2026-10-20-t162-site-honesty-and-credit.md`

## Verification
- `npm run build` passed (existing Vite chunk-size warning only).
- `npm test` passed: 124 core, 3 CLI, 7 VS Code, 4 script tests.
- Checked visually in the dev server at desktop and mobile widths: the homepage lists, top-bar GitHub link and sidebar credit render with existing tokens.

## Remaining Work
- The live site at radebe.pages.dev changes on the next deploy, through the current Pages path or the M4 GitHub Pages path.

## Next Step
- T-163: rewrite the root README for public GitHub readers.
