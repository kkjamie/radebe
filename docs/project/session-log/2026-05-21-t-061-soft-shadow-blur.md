# 2026-05-21 - T-061 Soft Shadow Blur

## Scope
- Add soft shadow blur support to the existing `shadow` appearance/effect command.
- Preserve zero-blur output as the current hard-edged behavior.
- Cover shape shadows and composited group shadows through the shared renderer path.

## Completed
- Added `blur` to `ShadowAppearance`.
- Added `blur` as a non-negative integer `shadow` property, named argument, and child property command in the shared schema.
- Updated the compiler to default `blur` to `0` and emit it on compiled shadow passes.
- Added deterministic normalized box blur sampling over shadow alpha for rectangle, circle, polygon, and composited group shadows.
- Kept hard-edged shadow behavior for `blur 0`.
- Updated core render tests for compiled blur metadata, rectangle soft-shadow alpha output, and group soft-shadow alpha output.
- Updated the web `shadow` reference page with `blur` arguments, notes, and a live soft-shadow example.
- Updated product, roadmap, decision, task-board, and main-thread state docs.

## Behavioral Impact
- Authors can now write:

```text
rect 30 20 112 44
  shadow 8 8 #000000 alpha=0.45 spread=2 blur=4
  fill solid #203040
```

- `blur` is a pixel-radius integer. Omitted `blur` and `blur 0` both keep the existing crisp shadow output.
- Positive blur values soften shadow alpha after spread has been applied.
- Group-level `shadow` uses the same blur property against the composited child alpha mask.

## Validation
- `npm run build`
- `npm --prefix radebe-core test`
- `npm test` outside the sandbox because the default sandbox blocks Node from `lstat` on `C:\Users\Jamie.Healey`

## Remaining Work
- T-062 can evaluate outer glow as a colored soft-shadow-like pass and inner glow as clipped contour glow.
- T-060 masks remain a separate render-region feature.
- T-075 still needs broader child-phase ordering diagnostics.

## Risks / Blockers
- Large blur radii cost more because the current renderer samples a box kernel over each blurred shadow pixel.
- No active blocker remains for T-061.

## Exact Next 3 Steps
1. Start T-062 if the next visible effect should be glow built on the soft-shadow alpha pipeline.
2. Start T-060 if the next render-region capability should be explicit masks.
3. Start T-075 if the next language-coherence task should be child ordering diagnostics.

## Paste-Ready Prompt
You are working in `d:\projects\personal\radebe`.

Read:
1. `docs/project/README.md`
2. `docs/project/task-board.md`
3. `docs/project/roadmap.md`
4. `docs/project/decisions.md`
5. `docs/project/main-thread-state.md`
6. `docs/project/session-log/2026-05-21-t-061-soft-shadow-blur.md`

Current state:
- T-061 is complete.
- `shadow` now supports non-negative integer `blur`.
- `blur 0` preserves hard-edged shadow behavior.
- Positive blur values use a deterministic normalized box blur over the shadow alpha mask.
- Shape shadows and composited group shadows both support blur.
- `npm run build`, `npm --prefix radebe-core test`, and `npm test` passed. The full workspace test needed to run outside the sandbox due the known Node `C:\Users\Jamie.Healey` lstat restriction.

Recommended next task:
- Pick T-062 for glow if the goal is another visible effect.
- Pick T-060 for masks if the goal is clipping/render-region work.
- Pick T-075 for compiler ordering coherence.
