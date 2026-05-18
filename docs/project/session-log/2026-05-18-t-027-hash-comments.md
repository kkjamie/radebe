# Session Log: T-027 Hash Comments

Date: `2026-05-18`
Thread: `t-027-hash-comments`

## Scope
- Make Radebe source comments use `#` instead of `//`.

## Work Completed
- Changed the parser so only lines whose trimmed text starts with `#` are ignored as comments.
- Added parser regression coverage proving hash comments are ignored and legacy `//` lines are parsed as ordinary source.
- Updated the product spec comment rule to name `#` as the only source comment prefix.
- Updated all live `radebe-web` example source strings from `//` comments to `#` comments.
- Recorded the syntax decision as DEC-015.

## Verification
- Ran `npm run build` successfully.
- Ran `npm test` successfully outside the sandbox after the sandboxed run hit the known `EPERM` lstat issue for `C:\Users\Jamie.Healey`.

## Notes
- This is an intentional compatibility break for source files using `//` comment lines.
- Existing color tokens such as `#ffffff` are unaffected because only the first trimmed character of a line determines comment handling.

## Next Recommendation
- Continue with the next M2 language increment, preferably making rectangle-backed `stroke` respect cut-modified silhouettes.
