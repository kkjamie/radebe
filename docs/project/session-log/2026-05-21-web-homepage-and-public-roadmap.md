# Session Log: Web Homepage And Public Roadmap

Date: `2026-05-21`
Thread: `codex-main`
Task: `T-081`
Milestone/Gate: `M2 / Gate B`

## Scope
- Convert `radebe-web` from an examples-first workbench into the main user-facing homepage and reference site.
- Replace the old Experimental route with a `Try it` editor/preview route.
- Add syntax, release notes, public roadmap, VS Code extension, and Unity plugin pages.
- Align the command sidebar sections with the author-facing vocabulary.

## Completed
- Added a homepage as the default route with a language introduction, calls to `Try it` and Syntax, and a rendered mini preview.
- Added a sticky top bar with the current `v0.1.0` version and a burger-style sidebar toggle.
- Renamed the playground route to `Try it` and made it a full-height split editor/preview workspace with a small starter example.
- Changed sidebar organization from Examples to Commands, removed link indentation, and grouped command pages by vocabulary: Header Commands, Drawable Commands, Appearance Passes, Effect Passes, Property Commands, Structural Containers, and Declarations.
- Added a Syntax page covering indentation children, auto/positional args, named args, child-property args, command vocabulary, and example draw/effect syntax.
- Added Release Notes and public Roadmap pages; the roadmap is filtered to user-facing future features from the task board and includes speculative syntax examples.
- Added VS Code Extension and Unity Plugin pages with local download links.
- Added a Vite dev-server middleware that serves known local release artifacts from `/downloads/...`.
- Generated `Temp/radebe-unity-plugin-0.1.0.zip` for the Unity download page.
- Logged DEC-044 for treating `radebe-web` as the public homepage/reference surface.

## Verification
- `npm run build` passed. Vite still reports the existing chunk-size warning for the CodeMirror-heavy bundle.
- `npm test` passed after the final Vite download-route change: core 111 tests, CLI 3 tests, VS Code 7 tests, scripts SEA smoke 1 test.
- Re-ran `npm run build` after the Vite config change; it passed.
- Started the dev server with `npm --prefix radebe-web run dev -- --host 127.0.0.1`.
- Verified HTTP 200 for:
  - `http://127.0.0.1:5173/`
  - `http://127.0.0.1:5173/downloads/radebe-language-support-0.1.0.vsix`
  - `http://127.0.0.1:5173/downloads/radebe-unity-plugin-0.1.0.zip`
  - `http://127.0.0.1:5173/downloads/radebe-cli-win32-x64.exe`

## Remaining
- T-074 still has follow-up scope for editor/autocomplete/help wording outside the web pages.
- The public download routes currently serve local ignored artifacts in dev; production publishing should copy or generate equivalent release assets deliberately.
- The public roadmap is static data in `radebe-web/src/main.ts`; future feature additions should evaluate whether they belong there when new task-board rows are created.

## Risks / Blockers
- The web bundle is still over Vite's default chunk-size warning threshold because CodeMirror and the editor surface ship in one entry chunk.
- The Unity Plugin page exposes local dev artifacts, not a formal release pipeline.

## Exact Next 3 Steps
1. Open `http://127.0.0.1:5173/` and click through Home, Try it, Syntax, Roadmap, VS Code Extension, and Unity Plugin for visual review.
2. If wording polish is next, continue T-074 by aligning autocomplete/detail text and VS Code help with the same vocabulary now used by the site sidebar.
3. If release packaging is next, decide whether `/downloads/...` should be backed by generated `radebe-web/public/downloads` files, GitHub Releases, or another release artifact host.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `<task-id>`.

Objective:
- Continue from T-081 after the web homepage/reference conversion.

Current state:
- `radebe-web` defaults to a homepage and includes top bar version display, collapsible sidebar, full-height `Try it`, Syntax, Release Notes, Roadmap, VS Code Extension, Unity Plugin, and Commands reference pages.
- Commands navigation uses the author-facing vocabulary sections.
- The public roadmap page pulls user-facing upcoming features from the task board and includes speculative syntax examples.
- `radebe-web/vite.config.ts` serves local dev downloads from `/downloads/...`; `Temp/radebe-unity-plugin-0.1.0.zip` was generated locally and is ignored.
- Build and tests pass after the final Vite download middleware change.

Done criteria:
- Implement the selected follow-up with focused code/docs/test coverage.
- Update task-board, roadmap if affected, decisions if a meaningful semantic/product choice changes, session-log, and main-thread-state.
- Return an end-of-thread handoff using the repository contract.

Read order:
1) AGENTS.md
2) docs/project/task-board.md
3) docs/project/main-thread-state.md
4) docs/project/session-log/2026-05-21-web-homepage-and-public-roadmap.md
5) radebe-web/src/main.ts
6) radebe-web/vite.config.ts
```

This is a good handoff point. Start a new worker thread.
