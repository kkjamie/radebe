# 2026-06-01 T-158 Rendered Image Output

## Scope Completed
- Completed T-158 for M3 Gate D by renaming the main public render output type from `SpriteGridRenderArtifact` to `RenderedImage`.
- Changed the runtime render output `kind` from `sprite-grid` to `rendered-image`.
- Kept `RenderArtifact` as the result property type alias and kept `SpriteGridRenderArtifact` as a deprecated alias for compatibility.
- Updated core, VS Code, and web preview tests/labels to use rendered-image wording.
- Recorded DEC-085 for the output naming decision.

## Files Changed
- `radebe-core/src/types.ts`
- `radebe-core/src/index.ts`
- `radebe-core/src/renderer.ts`
- `radebe-core/src/renderer/renderer.ts`
- `radebe-core/test/render.test.ts`
- `radebe-vscode/src/language-adapter.ts`
- `radebe-vscode/test/language-adapter.test.ts`
- `radebe-web/src/playground/preview-presenter.ts`
- `docs/project/task-board.md`
- `docs/project/roadmap.md`
- `docs/project/milestones/M3-refactoring-stabilization.md`
- `docs/project/codebase-map.md`
- `docs/project/decisions.md`
- `docs/project/main-thread-state.md`
- `docs/project/session-log/2026-06-01-t158-rendered-image-output.md`

## Behavioral Impact
- The public render output kind is now `rendered-image`.
- The output still contains `width`, `height`, `background`, `rows`, and `pixels`.
- Core rendering remains hand-rasterized into an in-memory pixel buffer; no rendering library was introduced.

## Verification
- `npm run build -w @radebe/core`
- `npm run build`
- `npm test`
- `git diff --check`
- Git reported only line-ending normalization warnings for edited Markdown and TypeScript files.

## Remaining Work
- T-150 should run final M3 Gate D consolidation, verify the whole refactor story, and close or narrowly re-scope TD-003 and TD-009.

## Risks Or Blockers
- No known blocker.
- Consumers that branch directly on `artifact.kind === "sprite-grid"` must update to `artifact.kind === "rendered-image"`.

## Exact Next 3 Steps
1. Start T-150 and review M3 Gate D evidence, including T-151 through T-158.
2. Decide whether TD-003 can close after the renderer coverage-source, appearance module, normalization, API documentation, and render-output naming work.
3. If Gate D passes, prepare the M4 GitHub migration handoff.

## Paste-Ready Prompt For Next Thread
Continue M3 Gate D with T-150. Read `docs/project/README.md`, `docs/project/task-board.md`, `docs/project/roadmap.md`, `docs/project/decisions.md`, `docs/agent/source-of-truth.md`, `docs/project/milestones/M3-refactoring-stabilization.md`, the latest `docs/project/session-log/*.md`, and `docs/project/main-thread-state.md`. T-151 through T-158 are complete: renderer appearance passes use coverage sources, redundant primitive appearance adapters are removed, `renderer/appearance.ts` is a stable barrel over focused modules, pass bundles normalize at the renderer boundary, public renderer APIs are documented, and the main render output is now `RenderedImage` with runtime kind `rendered-image`. Review completed M3 refactors, verify the final safety net, close or re-scope TD-003 and TD-009, update required docs, and prepare the M4 GitHub migration handoff.

This is a good handoff point. Start a new worker thread.
