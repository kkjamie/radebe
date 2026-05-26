# Release Process

Owner: `Main Thread`
Last updated: `2026-05-26`

Purpose: define the release checklist for Radebe so "push to `master` deploys" does not become the whole release process by accident.

## Release Model
- Pushing to `master` triggers CI and website deploy.
- A real release starts before that push. The release commit should already contain the intended version bump, release notes, download metadata, and any public copy changes.
- CI should build, package, publish, and verify the prepared release; it should not be responsible for deciding what the release is called.

## Release Checklist
1. Confirm the scope of the release and which public surfaces changed: language/runtime, CLI, VS Code extension, Unity plugin, website, or docs-only.
2. Decide whether the change is a product release, a site release, or both.
3. Update the public product version when the release changes the shipped Radebe toolchain or user-facing capability set.
4. Keep the workspace package versions aligned when the public product version changes.
5. Update the website site/build version in `radebe-web/src/content/version.ts` for every website deploy that should remain traceable.
6. Update `radebe-web/src/pages/release-notes.tsx` with a dated entry when the product release story changed in user terms.
7. Update any download labels, integration copy, or artifact filenames if the release changes what users install.
8. Run the validation commands required for the release:
   - `npm run typecheck`
   - `npm test`
   - `npm run build:release:web`
   - `npm run smoke:cli:sea`
9. Merge or push the prepared release commit to `master` so Azure DevOps can run the staged build/deploy flow.
10. Verify the hosted pipeline result, website deployment, and release artifact availability after CI completes.
11. If the release introduces a process or packaging change, update this file and the relevant project tracking docs in the same thread.

## Version Sources
- Root workspace version: `package.json`
- Package versions: `radebe-core/package.json`, `radebe-cli/package.json`, `radebe-web/package.json`, `scripts/package.json`
- Public website product version: `radebe-web/src/content/version.ts` -> `productVersion`
- Public website site/build version: `radebe-web/src/content/version.ts` -> `siteVersion`
- Public release history: `radebe-web/src/pages/release-notes.tsx`

## Version Policy

### Product Version
- The product version is the main public version for Radebe.
- It should represent the shipped toolchain and authoring experience, not just the static site shell.
- The website top bar should continue to display the product version.
- Release notes should be organized around the product version.

### Site Version
- The website now has a separate site/build version for deploy tracking and site-only iteration.
- That site/build version stays secondary and should not replace the product version in the top bar.
- Site-only tweaks should normally update the site/build version without forcing a public product version bump.
- The site/build version is suitable for a subtle footer or diagnostics surface when the UI chooses to expose it.
- Prefer a date-based or build-oriented format that reads as a deploy marker rather than a second product semver stream, such as `2026-05-26.1`.

### Per-Package Versions
- Do not split `unity`, `vscode`, `web`, and `core` into separate public version streams yet.
- For M2, keep one aligned product version across the workspace and a separate site/build version for the website.
- Revisit independent per-surface versions only when the project is actually shipping those surfaces on meaningfully different cadences.

## Recommended Release Shapes
- Toolchain release: bump the public product version, align package versions, update release notes, update the site/build version if the website deploy also changed, then push to `master`.
- Website-only deploy: keep the current product version, bump the site/build version, and skip release-note changes unless the website change is part of a broader product release story.
- Docs-only deploy: normally no product version bump; update release notes only if the docs change is part of a broader release announcement.

## Git Tags

### Product Tags
- Product releases should use the `product/*` namespace.
- Format: `product/vX.Y.Z`
- Example: `product/v0.2.0`
- Product tags represent the public Radebe release and should line up with the workspace/package `productVersion`.

### Site Tags
- Website-only deploys should use the `site/*` namespace.
- Format: `site/YYYY-MM-DD.N`
- Example: `site/2026-05-26.1`
- Site tags represent deploy/build history for the website and should line up with `siteVersion`.
- Prefer date-based site tags over a second semver stream so they are clearly operational deploy markers rather than user-facing product releases.

### Tagging Rules
- Do not use bare tags such as `v0.1.0` once the product/site split is active; they are ambiguous.
- Only `product/*` tags should be treated as release-note milestones.
- `site/*` tags are operational deploy history and should not imply a public product release by themselves.
- A product release may also include a site-version bump if the website changed as part of that release.

## Tagging Flow
1. Prepare the release commit with the correct `productVersion`, `siteVersion`, release notes, and public artifact/copy updates.
2. Merge or push that commit to `master`.
3. Create the matching git tag:
   - product release: `product/vX.Y.Z`
   - site-only deploy: `site/YYYY-MM-DD.N`
4. Push the tag along with the branch state used for the deploy.
5. Verify that CI, deployment, and hosted artifacts match the tagged release shape.

## Release Gate For M2
- T-126 is not complete until the project has both:
  - a working hosted artifact/deploy path for large public downloads
  - a documented release checklist covering version bumps, release notes, and public artifact updates
