import { homePreviewSource } from "./content/home.js";
import { releases } from "./content/releases.js";
import { roadmapSections } from "./content/roadmap.js";
import {
  argumentFormNotes,
  argsExample,
  commandExample,
  commandVocabularyNotes,
  indentationExample,
  indentationNotes,
  syntaxFeatureCards
} from "./content/syntax.js";
import { createPlayground } from "./playground.js";
import type { PageDefinition } from "./types.js";
import {
  createActionLink,
  createCodeBlock,
  createFeatureGrid,
  createHero,
  createHighlightedCodeBlock,
  createInfoList,
  createMiniPreview,
  createPlainList
} from "./ui.js";

export function renderHomePage(content: HTMLElement): void {
  const hero = createHero(
    "Radebe",
    "A small indentation-based language for drawing procedural UI sprites as readable source files. It is built for crisp game and sci-fi interface pieces that compile through one shared TypeScript core into web previews, CLI output, VS Code tooling, and Unity imports."
  );
  const actions = document.createElement("div");

  actions.style.cssText = "display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px;";
  actions.append(
    createActionLink({ label: "Try it", href: "#/try-it" }),
    createActionLink({ label: "Learn syntax", href: "#/syntax" })
  );
  hero.append(actions);

  content.append(
    hero,
    createMiniPreview(homePreviewSource)
  );
}

export function renderTryItPage(
  content: HTMLElement,
  sourceState: Map<string, string>,
  page: Extract<PageDefinition, { kind: "playground" }>
): void {
  content.append(...page.examples.map((example) => createPlayground(example, sourceState, { immersive: true })));
}

export function renderSyntaxPage(content: HTMLElement): void {
  content.append(
    createHero(
      "Syntax",
      "Radebe source is a command tree. Lines create commands, indentation creates children, and arguments configure the current command either compactly or explicitly."
    ),
    createFeatureGrid(syntaxFeatureCards),
    createInfoList("Indentation Creates Children", indentationNotes),
    createHighlightedCodeBlock(indentationExample),
    createInfoList("Three Argument Forms", argumentFormNotes),
    createHighlightedCodeBlock(argsExample),
    createInfoList("Command Vocabulary", commandVocabularyNotes),
    createHighlightedCodeBlock(commandExample)
  );
}

export function renderReleaseNotesPage(content: HTMLElement): void {
  content.append(
    createHero(
      "Release Notes",
      "A lightweight version history for the public site and local tooling builds."
    )
  );

  releases.forEach((release) => {
    const article = document.createElement("article");
    const heading = document.createElement("h3");
    const meta = document.createElement("p");

    article.style.cssText =
      "border: 1px solid rgba(255,255,255,0.09); background: rgba(255,255,255,0.035); padding: 18px; margin-bottom: 16px;";
    heading.textContent = `v${release.version} - ${release.title}`;
    heading.style.cssText = "margin: 0 0 6px; font-size: 1.2rem;";
    meta.textContent = release.date;
    meta.style.cssText = "margin: 0 0 14px; color: #aab7b3;";
    article.append(heading, meta, createPlainList("Highlights", release.notes));
    content.append(article);
  });
}

export function renderRoadmapPage(content: HTMLElement): void {
  content.append(
    createHero(
      "Roadmap",
      "This page tracks user-facing capabilities from the project task board. New language, rendering, editor, and integration features belong here; internal fixes generally stay off the public roadmap unless they change the author workflow."
    )
  );

  roadmapSections.forEach((section) => {
    const sectionElement = document.createElement("section");
    const heading = document.createElement("h3");
    const summary = document.createElement("p");
    const grid = document.createElement("div");

    sectionElement.style.cssText = "margin: 0 0 34px;";
    heading.textContent = section.title;
    heading.style.cssText = "margin: 0 0 8px; font-size: 1.45rem; color: #fff3e1;";
    summary.textContent = section.summary;
    summary.style.cssText =
      "margin: 0 0 16px; color: #d8cdbf; line-height: 1.6; max-width: 78ch;";
    grid.style.cssText =
      "display: grid; align-items: start; gap: 24px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 560px), 1fr));";

    section.features.forEach((feature) => {
      const article = document.createElement("article");
      const featureHeading = document.createElement("h4");
      const body = document.createElement("p");

      article.style.cssText =
        "display: grid; gap: 16px; align-content: start; border: 1px solid rgba(255,255,255,0.09); background: rgba(255,255,255,0.035); padding: 28px; min-width: 0;";
      featureHeading.textContent = feature.title;
      featureHeading.style.cssText = "margin: 0; font-size: 1.14rem; color: #fff3e1;";
      body.textContent = feature.body;
      body.style.cssText = "margin: 0; color: #d2c7b4; line-height: 1.55;";
      article.append(
        featureHeading,
        body,
        createHighlightedCodeBlock(feature.syntax, { strictCommands: false })
      );
      grid.append(article);
    });

    sectionElement.append(heading, summary, grid);
    content.append(sectionElement);
  });
}

export function renderIntegrationPage(
  content: HTMLElement,
  page: Extract<PageDefinition, { kind: "integration" }>
): void {
  const actions = document.createElement("div");
  const commandList = document.createElement("section");

  actions.style.cssText = "display: flex; flex-wrap: wrap; gap: 10px; margin: 0 0 22px;";
  page.downloads.forEach((download) => {
    actions.append(createActionLink(download));
  });

  commandList.style.cssText =
    "display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); margin-bottom: 22px;";
  page.commands.forEach((command) => {
    commandList.append(createCodeBlock(command));
  });

  content.append(
    createHero(page.title, page.summary),
    actions,
    createInfoList("Notes", page.details),
    commandList
  );
}

export function renderExamplePage(
  content: HTMLElement,
  sourceState: Map<string, string>,
  page: Extract<PageDefinition, { kind: "example" }>
): void {
  const hero = document.createElement("section");
  const title = document.createElement("h2");
  const summary = document.createElement("p");
  const infoGrid = document.createElement("section");

  hero.style.cssText = "margin-bottom: 24px;";
  title.textContent = page.doc.title;
  title.style.cssText = "margin: 0 0 12px; font-size: 2rem;";
  summary.textContent = page.doc.summary;
  summary.style.cssText =
    "margin: 0; max-width: 72ch; color: #d8cdbf; line-height: 1.6;";
  infoGrid.style.cssText =
    "display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin: 0 0 24px;";

  hero.append(title, summary);
  infoGrid.append(
    createInfoList("Arguments", page.doc.args),
    createInfoList(
      "Child Commands",
      page.doc.childCommands.length === 0
        ? ["No structural child commands."]
        : page.doc.childCommands
    ),
    createInfoList("Notes", page.doc.notes)
  );

  if (page.doc.comingSoon) {
    const placeholder = document.createElement("section");
    const label = document.createElement("p");
    const body = document.createElement("p");

    placeholder.style.cssText =
      "border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); padding: 20px;";
    label.textContent = "Coming Soon";
    label.style.cssText =
      "margin: 0 0 10px; color: #fff3e1; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 0.08em;";
    body.textContent =
      "This reference page is reserved for a planned command. Once the command is part of the public language, this page will include syntax, arguments, and live editable examples.";
    body.style.cssText = "margin: 0; color: #d2c7b4; line-height: 1.6; max-width: 72ch;";

    placeholder.append(label, body);
    content.append(hero, infoGrid, placeholder);
    return;
  }

  content.append(
    hero,
    infoGrid,
    ...(page.doc.examples ?? []).map((example) => createPlayground(example, sourceState))
  );
}

