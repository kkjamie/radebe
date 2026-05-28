# 2026-05-28 OO Architecture Direction

## Scope Completed
- Captured the preferred object-oriented direction for the maintainability refactor backlog.
- Added T-147 to make the class-owned compiler and renderer conversion explicit instead of leaving it implicit inside T-140 and T-133.
- Added DEC-078 to record the architecture boundary: class-owned internals, public function facades, and plain-data render instructions.
- Added TD-009 so the current function-heavy ownership model is tracked as durable maintainability debt.

## Files Changed
- `docs/project/task-board.md`
- `docs/project/technical-debt-register.md`
- `docs/project/roadmap.md`
- `docs/project/main-thread-state.md`
- `docs/project/decisions.md`
- `docs/project/session-log/2026-05-28-oo-architecture-direction.md`

## Behavioral Impact
- No runtime code changed.
- Future refactor threads now have explicit guidance to move toward classes where they clarify ownership, while preserving simple public function entrypoints and serializable data boundaries.

## Architecture Captured
- The pipeline remains staged: source text parses into an AST, the compiler converts the AST into a compiled document/render-instruction model, and the renderer interprets that model into pixels.
- Render instructions should describe intent rather than execute rendering behavior. For example, a rectangle instruction should carry geometry, fill/stroke/shadow/glow data, and ordering, but should not own a `render()` method in the default architecture.
- Renderer behavior should live in renderer-owned classes or handler registries, such as `DocumentRenderer`, `RenderContext`, `RectRenderer`, `CircleRenderer`, `PolygonRenderer`, `FillPass`, `StrokePass`, `ShadowPass`, `GlowPass`, sampler objects, layer objects, mask objects, and compositing helpers.
- Compiler behavior should move toward classes such as `Compiler`, `CompilerContext`, command compilers, appearance compilers, group/mask compilers, and shared argument/value binding helpers.
- Public APIs such as `compileDocument`, `renderDocument`, and `renderSource` should remain as simple facades over the class-owned internals unless there is a deliberate API decision later.
- AST nodes, diagnostics, compiled documents, worker messages, and render instructions should remain easy to serialize, inspect, snapshot in tests, and pass across worker/package boundaries.
- Lightweight immutable instruction classes are allowed only if they preserve those plain-data benefits and do not make instructions responsible for rendering themselves.
- Renderer performance should be protected by dispatching at document, command, shape, or appearance-pass level. Inner pixel loops should remain allocation-light, numeric/array-oriented, and free from per-pixel object construction or object-heavy polymorphism.

## Remaining Work
- Do not start this broad conversion before T-126 release closeout unless a concrete bug requires related code movement.
- Use T-143 to improve the safety net before heavy compiler/renderer class extraction if practical.
- Coordinate T-147 with T-140, T-141, and T-133 so class extraction follows shared argument-binding and renderer capability boundaries rather than producing a mechanical rewrite.

## Risks Or Blockers
- A blanket conversion from functions to classes could create churn without reducing complexity.
- Putting render behavior directly on instruction objects would couple the compiler IR to one renderer backend and weaken worker/test serialization boundaries.
- Class dispatch and allocation inside per-pixel renderer loops could regress performance if not kept at command/pass setup level.

## Exact Next 3 Steps
1. Finish T-126 release closeout before non-urgent architecture work.
2. Start T-143 or T-141 first if the next thread wants safety net or argument-binding groundwork before class extraction.
3. Start T-147 as the architecture conversion thread once the first concrete compiler or renderer extraction target is chosen.

## Paste-Ready Prompt For Next Thread
```md
You are working in worker thread `t-147-class-owned-core-architecture`.

Objective:
- Convert the first safe slice of `radebe-core` compiler/renderer internals toward the DEC-078 architecture: class-owned internals, public function facades, and plain-data render instructions.

Done criteria:
- Read DEC-078, T-147, and the maintainability audit notes before editing code.
- Pick one narrow compiler or renderer slice rather than doing a broad mechanical rewrite.
- Preserve public entrypoints such as `compileDocument`, `renderDocument`, and `renderSource`.
- Keep AST, diagnostics, compiled documents, and render instructions descriptive and serializable.
- Do not move rendering behavior onto instruction objects unless a new decision explicitly changes that boundary.
- Keep renderer dispatch at document/command/pass level and avoid per-pixel object allocation.
- Add or preserve focused tests around the touched behavior.
- Run the closest practical validation command.

Read order:
1) AGENTS.md
2) docs/project/task-board.md (T-147, T-140, T-141, T-143, T-133)
3) docs/project/decisions.md (DEC-078, DEC-005, DEC-075)
4) docs/project/session-log/2026-05-28-codebase-maintainability-audit.md
5) docs/project/session-log/2026-05-28-oo-architecture-direction.md
6) radebe-core/src/compiler.ts
7) radebe-core/src/renderer.ts
8) radebe-core/src/renderer/shared.ts
```

This is a good handoff point. Start a new worker thread.
