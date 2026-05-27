import { productReleaseNotes } from "../content/release-notes.js";
import type { PageDefinition } from "../types.js";
import { Hero, PlainList } from "../ui.js";

export const releaseNotesPage: Extract<PageDefinition, { kind: "releases" }> = {
  id: "releases",
  kind: "releases",
  title: "Release Notes"
};

export function ReleaseNotesPage() {
  return (
    <>
      <Hero
        title="Release Notes"
        summary="Product release notes for the public Radebe web experience."
      />
      {productReleaseNotes.map((release) => (
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
