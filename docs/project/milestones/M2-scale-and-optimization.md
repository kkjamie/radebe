# M2 Website And Release Closeout

Milestone ID: `M2`
Title: `Website And Release Closeout`
Owner: `Main Thread`
Last updated: `2026-05-28`
Status: `Paused`

## Outcome
- Close out the first usable authoring loop with final public website polish, release-process validation, and consistent author-facing documentation after the core language loop and Unity-return baseline have already been proven.

## Scope
- Keep the already-passed language-loop and Unity-return evidence intact while focusing remaining effort on website/reference polish and release-path closeout.
- Finish final public-site QA passes across the homepage, syntax/reference pages, examples, navigation, and visible copy.
- Keep the web-only release candidate and release-process documentation intact, but do not continue the Azure/Cloudflare publication path now that public source, website hosting, release binaries, and pipelines are moving to GitHub.
- Keep author-facing vocabulary aligned across docs, the web editor, and the VS Code extension.

## Gate Definitions
| Gate | Name | Required Evidence | Status | Notes |
| --- | --- | --- | --- | --- |
| Gate A | Basic Operation | One or two rendering commands are implemented and verified through `radebe-core`, `radebe-cli`, and `radebe-web` | Passed | Historical gate retained as passed evidence from the first usable language loop. |
| Gate B | Feedback Loop | The first language commands have usable diagnostics and artifact presentation for iteration in the web and CLI surfaces | Passed | Historical gate retained as passed evidence from the web/docs/examples/editor-feedback work completed during M2. |
| Gate C | Unity Return | The packaged CLI path is exercised again from Unity after the basic command loop is stable | Passed | Historical gate retained as passed evidence from the Unity importer and packaged CLI validation baseline. |
| Gate D | Closeout Pass | Final website QA, release-path validation, cross-surface vocabulary polish, and a documented release process are complete | Blocked | T-125 website QA/polish and T-074 vocabulary polish are complete; `docs/project/release-process.md` captures the release checklist and version policy; publication through Azure/Cloudflare is parked by the 2026-05-28 GitHub migration decision, and T-126 is retargeted to the M4 GitHub cutover |

Allowed status values: `Not Started`, `In Progress`, `Passed`, `Blocked`.
