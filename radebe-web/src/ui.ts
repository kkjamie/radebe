import { renderSource } from "@radebe/core";

import { highlightSource } from "./syntax-highlight.js";
import type { HighlightSourceOptions } from "./syntax-highlight.js";
import type { DownloadLink } from "./types.js";

const codeBlockStyle =
  "margin: 0; overflow: auto; background: #111416; border: 1px solid rgba(255,255,255,0.1); color: #e9dfd0; padding: 16px; line-height: 1.55;";

export function createInfoList(title: string, items: string[]): HTMLElement {
  const section = document.createElement("section");
  const heading = document.createElement("h3");
  const list = document.createElement("ul");

  section.style.cssText =
    "border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); padding: 16px;";
  heading.textContent = title;
  heading.style.cssText = "margin: 0 0 12px; font-size: 1rem;";
  list.style.cssText = "margin: 0; padding-left: 18px; color: #d9cfbf;";

  items.forEach((item) => {
    const line = document.createElement("li");
    line.textContent = item;
    line.style.marginBottom = "8px";
    list.append(line);
  });

  section.append(heading, list);
  return section;
}

export function createPlainList(title: string, items: string[]): HTMLElement {
  const section = document.createElement("section");
  const heading = document.createElement("h4");
  const list = document.createElement("ul");

  heading.textContent = title;
  heading.style.cssText = "margin: 0 0 10px; font-size: 1rem;";
  list.style.cssText = "margin: 0; padding-left: 18px; color: #d9cfbf; line-height: 1.55;";
  items.forEach((item) => {
    const line = document.createElement("li");
    line.textContent = item;
    line.style.marginBottom = "6px";
    list.append(line);
  });
  section.append(heading, list);
  return section;
}


export function createCodeBlock(source: string): HTMLElement {
  const pre = document.createElement("pre");
  const code = document.createElement("code");

  pre.style.cssText = codeBlockStyle;
  code.textContent = source;
  pre.append(code);
  return pre;
}

export function createHighlightedCodeBlock(
  source: string,
  options: HighlightSourceOptions = {}
): HTMLElement {
  const pre = document.createElement("pre");
  const code = document.createElement("code");

  pre.style.cssText = codeBlockStyle;
  code.innerHTML = highlightSource(source, options);
  pre.append(code);
  return pre;
}

export function createActionLink(link: DownloadLink): HTMLAnchorElement {
  const anchor = document.createElement("a");

  anchor.href = link.href;
  anchor.textContent = link.label;
  anchor.style.cssText =
    "display: inline-flex; align-items: center; justify-content: center; min-height: 36px; border: 1px solid rgba(125,211,252,0.32); background: rgba(125,211,252,0.1); color: #d8f8ff; padding: 0 12px; text-decoration: none;";

  if (link.download) {
    anchor.download = "";
  }

  return anchor;
}

export function createHero(title: string, summary: string): HTMLElement {
  const hero = document.createElement("section");
  const heading = document.createElement("h2");
  const text = document.createElement("p");

  hero.style.cssText = "margin-bottom: 24px;";
  heading.textContent = title;
  heading.style.cssText = "margin: 0 0 12px; font-size: clamp(2rem, 7vw, 4.8rem); line-height: 0.95; letter-spacing: 0;";
  text.textContent = summary;
  text.style.cssText =
    "margin: 0; max-width: 74ch; color: #d8cdbf; line-height: 1.65; font-size: 1.02rem;";
  hero.append(heading, text);
  return hero;
}

export function createMiniPreview(source: string): HTMLElement {
  const frame = document.createElement("section");
  const codePanel = document.createElement("div");
  const previewPanel = document.createElement("div");
  const previewLabel = document.createElement("p");
  const canvasWrap = document.createElement("div");
  const canvas = document.createElement("canvas");
  const result = renderSource({ source });
  const scale = 3;

  frame.style.cssText =
    "display: grid; gap: 18px; grid-template-columns: minmax(0, 1fr) minmax(260px, 0.85fr); align-items: stretch; margin: 0 0 26px;";
  codePanel.append(createHighlightedCodeBlock(source));
  previewPanel.style.cssText =
    "display: grid; grid-template-rows: auto 1fr; gap: 12px; border: 1px solid rgba(255,255,255,0.1); background: #151819; padding: 16px; min-width: 0;";
  previewLabel.textContent = "Rendered artifact";
  previewLabel.style.cssText = "margin: 0; color: #bdefff;";
  canvasWrap.style.cssText =
    "display: flex; align-items: center; justify-content: center; min-height: 180px; background: linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.1) 75%), linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.1) 75%), #0d1011; background-size: 16px 16px; background-position: 0 0, 8px 8px; overflow: hidden;";
  canvas.width = Math.max(result.artifact.width, 1);
  canvas.height = Math.max(result.artifact.height, 1);
  canvas.style.cssText = `width: ${canvas.width * scale}px; height: ${canvas.height * scale}px; image-rendering: pixelated; image-rendering: crisp-edges;`;

  const context = canvas.getContext("2d");

  if (context) {
    if (result.artifact.background !== "transparent") {
      context.fillStyle = result.artifact.background;
      context.fillRect(0, 0, result.artifact.width, result.artifact.height);
    }

    result.artifact.pixels.forEach((row, y) => {
      row.forEach((pixel, x) => {
        if (pixel !== null) {
          context.fillStyle = pixel;
          context.fillRect(x, y, 1, 1);
        }
      });
    });
  }

  canvasWrap.append(canvas);
  previewPanel.append(previewLabel, canvasWrap);
  frame.append(codePanel, previewPanel);
  return frame;
}

export function createFeatureGrid(items: { title: string; body: string }[]): HTMLElement {
  const grid = document.createElement("section");

  grid.style.cssText =
    "display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin: 0 0 28px;";

  items.forEach((item) => {
    const panel = document.createElement("article");
    const heading = document.createElement("h3");
    const body = document.createElement("p");

    panel.style.cssText =
      "border: 1px solid rgba(255,255,255,0.09); background: rgba(255,255,255,0.035); padding: 16px;";
    heading.textContent = item.title;
    heading.style.cssText = "margin: 0 0 8px; font-size: 1.05rem; color: #fff3e1;";
    body.textContent = item.body;
    body.style.cssText = "margin: 0; color: #d2c7b4; line-height: 1.55;";
    panel.append(heading, body);
    grid.append(panel);
  });

  return grid;
}
