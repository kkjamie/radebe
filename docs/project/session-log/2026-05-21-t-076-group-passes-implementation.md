# 2026-05-21 - T-076 Group Passes Implementation

## Scope
- Implement the first composited group appearance/effect pass slice.
- Preserve transparent group behavior when a group has no group-level passes.
- Support group-level `fill`, `stroke`, and hard-edged `shadow`.
- Add group-specific ordering diagnostics so child content comes before group-level passes.

## Completed
- Added schema support for `fill`, `shadow`, and `stroke` children under `group` through the shared `shape-appearance` capability.
- Changed compilation so `group` is retained as a compiled draw command with nested child commands instead of always flattening children.
- Added compiler diagnostics for group passes before content, group content after passes, and group property children after content/passes.
- Added renderer layer support for transparent offscreen group rendering, alpha-mask extraction, group-level fills over the combined child alpha, group-level shadows behind the child layer, and group-level strokes around the combined contour.
- Kept groups with no passes transparent by drawing their children directly into the parent target.
- Updated core and language-service tests for schema completions, compiled group structure, ordering diagnostics, and rendered group fill/stroke/shadow output.
- Updated the web `group` reference page with composited pass behavior and a live example.
- Updated project docs and decisions for the retained compiled group node and conditional compositing model.

## Behavioral Impact
- `group` can now be used like a Photoshop folder for the first supported pass set:

```text
group badge
  rect 8 8 80 32 #101820
  circle 24 24 10 #18242c
  shadow 2 2 black
  fill solid #70c8e8 alpha=0.25
  stroke 2 white
```

- Group-level passes apply to the composited child layer, not as inherited defaults on each child.
- Transparent groups still preserve existing render output when they have no group-level passes.
- Authors must place child draw commands and nested groups before group-level appearance/effect passes.

## Validation
- `npm run build`
- `npm test` outside the sandbox because the default sandbox blocks Node from `lstat` on `C:\Users\Jamie.Healey`

## Remaining Work
- T-075 still needs broader ordering restrictions for shape child phases, especially geometry modifiers/properties after appearance/effect passes.
- T-074 still needs the vocabulary folded deeper into web reference docs, completion/help metadata, and VS Code/web editor assistance.
- Group alpha, blend modes, masks, filters, blur, soft shadows, and transforms remain separate future work.

## Risks / Blockers
- Group stroke contouring is alpha-mask based and intentionally hard-edged for this slice; more advanced antialiasing, joins, blur, and blend behavior should be designed deliberately before extending it.
- No active blocker remains for T-076.

## Exact Next 3 Steps
1. Start T-075 to tune compiler child-phase ordering beyond the group-specific rule that landed here.
2. Start T-074 to fold the vocabulary into the web reference docs and editor assistance text.
3. If visible capability is preferred, start T-060 `mask` using the new retained group/layer model as context.

## Paste-Ready Prompt
You are working in `d:\projects\personal\radebe`.

Read:
1. `docs/project/README.md`
2. `docs/project/task-board.md`
3. `docs/project/roadmap.md`
4. `docs/project/decisions.md`
5. `docs/project/main-thread-state.md`
6. `docs/project/session-log/2026-05-21-t-076-group-passes-implementation.md`

Current state:
- T-076 is complete.
- `group` is now retained as a compiled draw command.
- Groups without group-level passes render transparently.
- Groups with `fill`, `stroke`, or hard-edged `shadow` render children into an offscreen layer, apply passes to the combined alpha/pixels, and composite back into the parent.
- Group content must come before group-level passes.
- `npm run build` and `npm test` passed.

Recommended next task:
- Pick T-075 if the goal is compiler ordering coherence.
- Pick T-074 if the goal is docs/editor vocabulary coherence.
- Pick T-060 if the goal is visible mask capability.
