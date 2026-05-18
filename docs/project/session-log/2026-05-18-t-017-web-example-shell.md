# Session Log: T-017 Web Example Shell

Date: `2026-05-18`
Thread: `t-017-web-example-shell`

## Scope
- Reshape `radebe-web` into a small documentation and playground shell so each implemented command can have its own example page with live preview.

## Work Completed
- Replaced the one-off web preview page with a left-sidebar shell that routes between pages using hash links.
- Added an `Experimental` page for free-form language iteration.
- Added an `Examples` group with dedicated pages for the currently implemented command set: `sprite`, `plot`, `line`, and `rect`.
- Made each example page data-driven so it describes the command summary, arguments, allowed child commands, notes, and an editable live preview sample.
- Kept the shared rendering contract intact by reusing the same preview logic across every page instead of creating special-case demo renderers.

## Verification
- Ran `npm run build -w @radebe/web` successfully.

## Notes
- This should now be the pattern for new commands: add the feature in core, add tests, then add a web example page documenting the args and possible children.
- The next command thread should extend the examples registry when new behavior lands.

## Next Recommendation
- Implement `rect-inset` next and add it to the examples nav immediately when it lands.
