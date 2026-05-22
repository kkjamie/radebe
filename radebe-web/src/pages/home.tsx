import type { PageDefinition } from "../types.js";
import { ActionLink, Hero, MiniPreview } from "../ui.js";

export const homePage: Extract<PageDefinition, { kind: "home" }> = {
  id: "home",
  kind: "home",
  title: "Radebe"
};

const homePreviewSource = [
  "sprite status-chip",
  "  size 128 48",
  "  background transparent",
  "",
  "rect-inset 6 #101820",
  "  cut 8",
  "  stroke 2 #70c8e8",
  "  glow #70c8e8 blur=4 alpha=0.5",
  "",
  "circle 28 24 8 #ffcc88",
  "line 44 24 106 24 #d8f8ff"
].join("\n");

export function HomePage() {
  return (
    <>
      <Hero
        title="Radebe"
        summary="A small indentation-based language for drawing procedural UI sprites as readable source files. It is built for crisp game and sci-fi interface pieces that compile through one shared TypeScript core into web previews, CLI output, VS Code tooling, and Unity imports."
      >
        <div className="hero-actions">
          <ActionLink link={{ label: "Try it", href: "#/try-it" }} />
          <ActionLink link={{ label: "Learn syntax", href: "#/syntax" }} />
        </div>
      </Hero>
      <MiniPreview source={homePreviewSource} />
    </>
  );
}
