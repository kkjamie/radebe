# 2026-05-29 T-140 Compiler Module Split

## Scope Completed
- Split `radebe-core/src/compiler.ts` from a 3k-plus-line implementation module into a stable public compile facade and focused internal compiler modules.
- Added shared compiler utilities under `radebe-core/src/compiler/shared.ts` for compiler diagnostics, child validation, strict numeric readers, property resolution, and common draw options.
- Moved variable handling, sprite header compilation, appearance-pass compilation, rectangle modifiers, primitive commands, rect/circle/polygon/path command compilation, and structural group/mask compilation into focused modules under `radebe-core/src/compiler/`.
- Preserved the public `compileDocument` export and the existing compiled-document/render-instruction data shapes.

## Files Changed
- `radebe-core/src/compiler.ts`
- `radebe-core/src/compiler/shared.ts`
- `radebe-core/src/compiler/variables.ts`
- `radebe-core/src/compiler/sprite.ts`
- `radebe-core/src/compiler/appearance.ts`
- `radebe-core/src/compiler/rect-modifiers.ts`
- `radebe-core/src/compiler/commands/primitives.ts`
- `radebe-core/src/compiler/commands/rect.ts`
- `radebe-core/src/compiler/commands/circle.ts`
- `radebe-core/src/compiler/commands/polygon.ts`
- `radebe-core/src/compiler/commands/path.ts`
- `radebe-core/src/compiler/commands/structural.ts`
- `docs/project/task-board.md`
- `docs/project/roadmap.md`
- `docs/project/milestones/M3-refactoring-stabilization.md`
- `docs/project/main-thread-state.md`
- `docs/project/technical-debt-register.md`
- `docs/project/session-log/2026-05-29-t140-compiler-module-split.md`

## Behavioral Impact
- No public `@radebe/core` API changed.
- Compiler behavior is intended to be unchanged; this was a module-ownership refactor, not a language or render-output change.
- M3 Gate A is now complete because the split test safety net, shared high-risk argument binding, and compiler module boundary work have all landed.

## Verification
- `npm run build -w @radebe/core`
- `node --test dist/test/colors.test.js dist/test/compiler.test.js dist/test/language-service.test.js dist/test/render.test.js dist/test/schema.test.js` in `radebe-core`
- `npm run build`
- Note: the root web build still emits the existing Vite large-chunk warning for the main bundle; the build completed successfully.

## Remaining Work
- M3 Gate B is next.
- T-147 should introduce the first class-owned compiler or renderer subsystem slice behind the existing public function facades.
- T-133 should reduce renderer appearance-pass duplication where practical without collapsing the command renderer boundaries from T-132.

## Risks Or Blockers
- The extraction was broad but behavior-preserving, so the main residual risk is accidental module drift during future edits rather than an intentional semantic change.
- The compiler is now easier to navigate, but it is not yet the class-owned architecture described in DEC-078; that remains T-147.

## Exact Next 3 Steps
1. Start T-147 and choose a narrow class-owned subsystem slice, likely a compiler context or renderer document orchestration object.
2. Keep public function facades such as `compileDocument`, `renderDocument`, and `renderSource` stable while introducing the internal owner.
3. Re-run the core build and split core test suite after the T-147 slice, then decide whether T-133 should follow immediately or pair with another ownership cleanup.

## Paste-Ready Prompt For Next Thread
```md
You are working in worker thread `t-147-class-owned-core-slice`.

Objective:
- Continue M3 Gate B by introducing the first class-owned compiler or renderer subsystem slice behind existing public function facades, following DEC-078.

Done criteria:
- Preserve public APIs such as `compileDocument`, `renderDocument`, and `renderSource`.
- Keep AST nodes, diagnostics, compiled documents, and render instructions as descriptive plain data at package/worker/test boundaries.
- Avoid moving rendering behavior onto render-instruction data objects.
- Avoid per-pixel object churn or object-heavy polymorphism inside renderer hot loops.
- Run the closest practical core verification.

Read order:
1) AGENTS.md
2) docs/project/task-board.md (item: T-147, plus T-133)
3) docs/project/milestones/M3-refactoring-stabilization.md (Gate B)
4) docs/project/decisions.md (DEC-078)
5) docs/project/session-log/2026-05-29-t140-compiler-module-split.md
6) radebe-core/src/compiler.ts
7) radebe-core/src/compiler/
8) radebe-core/src/renderer.ts
9) radebe-core/src/renderer/
```

This is a good handoff point. Start a new worker thread.
