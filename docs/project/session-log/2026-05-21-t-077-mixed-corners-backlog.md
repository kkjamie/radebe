# 2026-05-21 - T-077 Mixed Rectangle Corners Backlog

## Scope
- Add a backlog task for mixed per-corner rectangle treatments.
- Capture the design nuance that omitted corner treatments are not equivalent to explicit zero-valued treatments.

## Completed
- Added T-077 to `docs/project/task-board.md`.
- Updated `docs/project/product-spec.md` with a future mixed-corner example:

```text
rect 0 0 96 40 #101820
  cut top-left 8
  radius top-right 12
```

- Updated roadmap and main-thread state to include T-077 in the language/effects backlog.
- Added DEC-040 to record that the future model must distinguish absent corner treatment from explicit zero values.

## Behavioral Impact
- No runtime behavior changed.
- Current `cut` and `radius` behavior remains as-is: existing uniform and four-corner forms are supported, and mixed `cut` plus `radius` on one rectangle remains future work.

## Remaining Work
- Implement T-077 in a future language thread.
- Decide exact accepted syntax for targeted corners and whether existing child forms such as `top-left` remain only property-like values or become part of a richer corner-treatment parser.
- Update compiler, renderer, stroke contours, tests, web examples, and editor completions when T-077 is implemented.

## Risks / Blockers
- Mixed corner treatment touches fill silhouettes, stroke contours, diagnostics, and schema/editor help at the same time.
- The implementation should avoid lowering targeted corners into four values where `0` means absence.

## Exact Next 3 Steps
1. If T-077 is selected, inspect the current `RectCut`, `RectRadius`, and rectangle contour renderer code.
2. Design a per-corner treatment representation that can express absent, cut, and radius for each corner.
3. Add compiler tests before changing rendering so the syntax and zero-versus-absence behavior is locked down first.

## Paste-Ready Prompt
You are working in `d:\projects\personal\radebe`.

Read:
1. `docs/project/task-board.md`
2. `docs/project/product-spec.md`
3. `docs/project/decisions.md`
4. `docs/project/main-thread-state.md`
5. `docs/project/session-log/2026-05-21-t-077-mixed-corners-backlog.md`

Current state:
- T-077 is a backlog task.
- The desired feature is mixed per-corner rectangle treatment, such as `cut top-left 8` plus `radius top-right 12`.
- Important semantic rule: an omitted corner treatment is not the same as an explicit zero-valued cut or radius.
- Current implementation still rejects combined `cut` and `radius` on the same rectangle.

Recommended implementation shape:
- Preserve existing `cut 8` and `cut 0 8 0 8` behavior.
- Add targeted corner syntax.
- Introduce an internal per-corner treatment model instead of treating targeted syntax as four numeric values with zeros.
