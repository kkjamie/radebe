import { productVersion, siteVersion } from "../content/version.js";
import type { PageDefinition } from "../types.js";
import { Hero, PlainList } from "../ui.js";

export const releaseNotesPage: Extract<PageDefinition, { kind: "releases" }> = {
  id: "releases",
  kind: "releases",
  title: "Release Notes"
};

const releases = [
  {
    version: productVersion,
    date: "2026-05-26",
    title: "First formal release",
    notes: [
      "This is the first formal Radebe release candidate, with the product version now treated as the public toolchain version instead of a generic development label.",
      "The shipped authoring surface includes the homepage, command reference navigation, Try it workspace, syntax guide, release notes, integration pages, and public roadmap.",
      "The implemented language surface includes sprite headers, variables, groups, masks, plot, line, rectangles, circles, polygons, regular and star polygons, paths, fills, strokes, shadows, glow, alpha, and antialiasing.",
      "Tooling now covers the CodeMirror web editor, VS Code language support, CLI SEA packaging, and the Unity importer baseline."
    ],
    siteVersion
  }
];

export function ReleaseNotesPage() {
  return (
    <>
      <Hero
        title="Release Notes"
        summary="A lightweight version history for the public site and local tooling builds."
      />
      {releases.map((release) => (
        <article className="release-card" key={release.version}>
          <h3 className="release-title">
            v{release.version} - {release.title}
          </h3>
          <p className="release-date">{release.date} - site build {release.siteVersion}</p>
          <PlainList title="Highlights" items={release.notes} />
        </article>
      ))}
    </>
  );
}
