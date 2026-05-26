# Session Log: Corner Targeting Direction

- Date: `2026-05-26`
- Thread: `codex-main`
- Scope: Expand the existing mixed-corner rectangle backlog item into a unified corner-targeting task for `rect` and polygon-family shapes.

## What Changed
- Updated T-077 in `docs/project/task-board.md` from rectangle-only mixed-corner treatment work to a broader corner-targeting task covering `rect`, `polygon`, `polygon-regular`, and `polygon-star`.
- Updated roadmap and main-thread-state references so they describe T-077 as a shared index/tag selector system rather than only `cut top-left 8` style rectangle syntax.
- Added DEC-067 to record the accepted direction: selectors by index or semantic tag, overlapping tags allowed, and `path` explicitly left out for now.

## Direction
- Keep existing uniform and shorthand corner forms.
- Add targeted selectors by index for all cornerable shapes.
- Add semantic tags that can target one or many corners, such as rect `top-left`, `top`, and `left`, or star `inner` and `outer`.
- Keep omitted corner treatment semantically distinct from an explicit zero-valued `cut` or `radius`.
- Do not pull `path` into this system yet.

## Follow-Up
- T-077 should now define selector syntax, overlap/conflict rules, and how selectors map onto each supported shape family.
