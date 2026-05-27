# M2 Website And Release Closeout

Milestone ID: `M2`
Title: `Website And Release Closeout`
Owner: `Main Thread`
Last updated: `2026-05-27`
Status: `In Progress`

## Outcome
- Close out the first usable authoring loop with final public website polish, release-process validation, and consistent author-facing documentation after the core language loop and Unity-return baseline have already been proven.

## Scope
- Keep the already-passed language-loop and Unity-return evidence intact while focusing remaining effort on website/reference polish and release-path closeout.
- Finish final public-site QA passes across the homepage, syntax/reference pages, examples, navigation, and visible copy.
- Finish the release path by proving the Azure/Cloudflare web-only flow, keeping unavailable public downloads hidden, and formalizing the release checklist for version bumps, release notes, web-only releases, and future artifact releases.
- Keep author-facing vocabulary aligned across docs, the web editor, and the VS Code extension.

## Gate Definitions
| Gate | Name | Required Evidence | Status | Notes |
| --- | --- | --- | --- | --- |
| Gate A | Basic Operation | One or two rendering commands are implemented and verified through `radebe-core`, `radebe-cli`, and `radebe-web` | Passed | Historical gate retained as passed evidence from the first usable language loop. |
| Gate B | Feedback Loop | The first language commands have usable diagnostics and artifact presentation for iteration in the web and CLI surfaces | Passed | Historical gate retained as passed evidence from the web/docs/examples/editor-feedback work completed during M2. |
| Gate C | Unity Return | The packaged CLI path is exercised again from Unity after the basic command loop is stable | Passed | Historical gate retained as passed evidence from the Unity importer and packaged CLI validation baseline. |
| Gate D | Closeout Pass | Final website QA, release-path validation, cross-surface vocabulary polish, and a documented release process are complete | In Progress | T-125 website QA/polish and T-074 vocabulary polish are complete; `docs/project/release-process.md` now captures the release checklist and version policy; T-126 now publishes `v0.1.0` as a web-only release, with binary artifact hosting deferred to T-135 |

Allowed status values: `Not Started`, `In Progress`, `Passed`, `Blocked`.
