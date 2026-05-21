# 2026-05-21 - Rect Inset Four-Side Shorthand

## Scope
- Make `rect-inset` less awkward for side-specific inset authoring.
- Preserve existing uniform inset, expanded side-property, color shorthand, and appearance-child behavior.

## Completed
- Added four-side `top right bottom left` parsing for command shorthand, including optional trailing color:

```text
rect-inset 4 4 8 8 #18242c
```

- Added the same one-or-four-value support to the child `inset` property:

```text
rect-inset
  inset 4 4 8 8
  fill solid #18242c
```

- Kept expanded overrides such as `top`, `right`, `bottom`, and `left` working with uniform `inset`.
- Updated color-token detection and smart shorthand cleanup so a trailing color after four inset values is treated as the color token.
- Updated the web `rect-inset` docs/example and the product spec command list.
- Added compile, render, color-token, and language-service smart-edit test coverage.

## Behavioral Impact
- Authors can now use `rect-inset 4 4 8 8` instead of expanding each side into separate child properties.
- The four-value order is `top right bottom left`.
- `rect-inset 4 4 8 8 #70c8e8` still lowers the trailing color into a solid fill.
- `inset 4 4 8 8` works inside a `rect-inset` block when appearance children are preferred.

## Validation
- `npm run build`
- `npm --prefix radebe-core test`
- `npm test`

## Remaining Work
- Broader CSS-style two-value or three-value inset shorthands are not implemented.
- T-077 mixed per-corner rectangle treatments remains separate from rectangle inset ergonomics.

## Risks / Blockers
- No active blocker remains.
- The only semantic ambiguity preserved is existing `rect-inset <inset> <color>`; four numeric inset values are interpreted as sides.

## Exact Next 3 Steps
1. Start T-075 if the next priority is child-phase ordering diagnostics.
2. Start T-074 if the next priority is vocabulary and reference-doc consistency.
3. Start T-060, T-068, or T-077 if the next priority is another visible language capability.

## Paste-Ready Prompt
You are working in `d:\projects\personal\radebe`.

Read:
1. `docs/project/README.md`
2. `docs/project/task-board.md`
3. `docs/project/roadmap.md`
4. `docs/project/decisions.md`
5. `docs/project/main-thread-state.md`
6. `docs/project/session-log/2026-05-21-rect-inset-four-side-shorthand.md`

Current state:
- T-078 is complete.
- `rect-inset` now supports `rect-inset <inset> [color]`.
- `rect-inset` also supports `rect-inset <top> <right> <bottom> <left> [color]`.
- The child `inset` property supports either one value or four values in `top right bottom left` order.
- Color-token detection and smart shorthand cleanup understand the new trailing color position.
- `npm run build`, `npm --prefix radebe-core test`, and `npm test` passed.

Recommended next task:
- Pick T-075 for compiler ordering coherence.
- Pick T-074 for vocabulary/reference-doc standardization.
- Pick T-060, T-068, or T-077 for another language capability.
