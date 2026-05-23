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
        summary="A language for authoring procedural images."
      >
        <section className="home-features">
          <h3 className="plain-list-title">Key features</h3>
          <ul className="plain-list-items">
            <li>Simple &amp; readable</li>
            <li>Consumable as a Node package</li>
            <li>CLI support</li>
            <li>Unity integration</li>
            <li>VS Code extension</li>
          </ul>
        </section>
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
