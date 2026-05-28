# M4 GitHub Migration

Milestone ID: `M4`
Title: `GitHub Migration`
Owner: `Main Thread`
Last updated: `2026-05-28`
Status: `Planned`

## Outcome
- Move Radebe's public code hosting, website hosting, release binary hosting, and CI/CD pipelines to GitHub after the refactor milestone is complete.

## Scope
- Prepare the repository for GitHub as the public source of truth.
- Replace Azure/Cloudflare release automation with GitHub Actions and GitHub-native release workflows where practical.
- Publish the website through the GitHub-hosted path.
- Host release binaries through GitHub Releases before restoring public CLI, VSIX, or Unity download surfaces.
- Retarget the parked `v0.1.0` publication work to the new GitHub release path.

## Gate Definitions
| Gate | Name | Required Evidence | Status | Notes |
| --- | --- | --- | --- | --- |
| Gate A | Repository Cutover Plan | GitHub repository, branch, visibility, secrets, and migration steps are defined without losing local history or required docs | Not Started | Seed task: T-135 |
| Gate B | GitHub Actions Pipeline | Build, test, website, and release-artifact workflows are implemented and validated on GitHub Actions | Not Started | Replaces the current Azure DevOps pipeline as the intended public pipeline path |
| Gate C | Website Hosting | The public website is deployed from GitHub-hosted automation and the previous Cloudflare Pages path is either retired or explicitly kept only as legacy context | Not Started | T-126 should publish through this path after Gate B is stable |
| Gate D | Release Assets | CLI, VSIX, Unity package, manifests, checksums, and release notes have a GitHub Releases hosting plan before public integration/download pages are restored | Not Started | Resolves the artifact-hosting part of T-135 |
| Gate E | Release Cutover | `v0.1.0` site/product tags and any matching GitHub release/page deploy are created from the accepted GitHub path | Not Started | Retargeted T-126 closeout |

Allowed status values: `Not Started`, `In Progress`, `Passed`, `Blocked`.
