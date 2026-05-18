# Session Log: T-010 M2 Basic Language Priority

Date: `2026-05-18`
Thread: `t-010-m2-basic-language-priority`

## Scope
- Rewrite the project docs to make the next priority explicit after M1.
- Defer deeper Unity vertical integration until the language has one or two concrete rendering commands working through the shared TypeScript surfaces first.

## Work Completed
- Updated the roadmap to state that M2 prioritizes the first usable language loop through `radebe-core`, `radebe-cli`, and `radebe-web` before returning to Unity.
- Rewrote the M2 milestone file around three gates: basic operation, feedback loop, and Unity return.
- Updated the task board so the next ready task is implementing one or two minimal rendering commands rather than continuing Unity follow-on work.
- Updated the main-thread state to reflect that Unity is intentionally deferred for now.
- Logged a new decision capturing the priority order change.

## Verification
- Documentation-only update; no code or test commands were run for this thread.

## Notes
- This reprioritization does not remove Unity from scope. It sequences Unity after the language has enough concrete behavior to validate meaningful end-to-end integration.

## Next Recommendation
- Start the next worker on the first one or two rendering commands and keep the shared render contract as small as possible unless command behavior forces it to grow.
