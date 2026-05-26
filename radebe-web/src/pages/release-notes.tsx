import { productVersion } from "../content/version.js";
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
    date: "2026-05-21",
    title: "Current development build",
    notes: [
      "Homepage, command reference navigation, Try it workspace, syntax guide, release notes, integration pages, and public roadmap.",
      "Implemented language surface includes sprite headers, variables, groups, masks, plot, line, rectangles, circles, polygons, regular/star polygons, paths, fills, strokes, shadows, glow, alpha, and antialiasing.",
      "Tooling includes the CodeMirror web editor, VS Code language support, CLI packaging, and the Unity importer baseline."
    ]
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
          <p className="release-date">{release.date}</p>
          <PlainList title="Highlights" items={release.notes} />
        </article>
      ))}
    </>
  );
}
