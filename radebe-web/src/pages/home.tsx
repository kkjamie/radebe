import type { PageDefinition } from "../types.js";
import { ActionLink, Hero, MiniPreview } from "../ui.js";
import {
  radebeIconPreview,
  radebeIconPreviewHeight,
  radebeIconPreviewWidth,
  radebeIconSource
} from "../content/brand-icon.js";

export const homePage: Extract<PageDefinition, { kind: "home" }> = {
  id: "home",
  kind: "home",
  title: "Radebe"
};

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
      <MiniPreview
        previewHeight={radebeIconPreviewHeight}
        previewSrc={radebeIconPreview}
        previewWidth={radebeIconPreviewWidth}
        source={radebeIconSource}
      />
    </>
  );
}
