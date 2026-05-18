import { renderSource } from "@radebe/core";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Expected #app container");
}

const initialSource = "Radebe workspace scaffold\nAPI boundaries ready";

const shell = document.createElement("main");
const heading = document.createElement("h1");
const intro = document.createElement("p");
const layout = document.createElement("section");
const editorPanel = document.createElement("article");
const previewPanel = document.createElement("article");
const sourceLabel = document.createElement("label");
const sourceInput = document.createElement("textarea");
const status = document.createElement("p");
const previewLabel = document.createElement("h2");
const previewMeta = document.createElement("p");
const previewOutput = document.createElement("pre");

shell.style.cssText =
  "font-family: Consolas, 'Courier New', monospace; max-width: 1100px; margin: 0 auto; padding: 32px 20px 48px; color: #f4efe6;";
document.body.style.cssText =
  "margin: 0; background: linear-gradient(180deg, #171513 0%, #22201d 100%); min-height: 100vh;";
heading.textContent = "Radebe";
heading.style.marginBottom = "8px";
intro.textContent =
  "The web shell now renders the shared core artifact directly for quick preview feedback.";
intro.style.color = "#d2c7b4";
intro.style.marginBottom = "24px";
layout.style.cssText =
  "display: grid; gap: 20px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));";
editorPanel.style.cssText =
  "background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 16px;";
previewPanel.style.cssText =
  "background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 16px;";
sourceLabel.textContent = "Source";
sourceLabel.style.display = "block";
sourceLabel.style.marginBottom = "12px";
sourceInput.value = initialSource;
sourceInput.setAttribute("spellcheck", "false");
sourceInput.style.cssText =
  "width: 100%; min-height: 320px; resize: vertical; box-sizing: border-box; border-radius: 12px; border: 1px solid rgba(255,255,255,0.12); background: #12110f; color: #f8f4ec; padding: 14px; font: inherit;";
status.style.marginBottom = "0";
status.style.color = "#d2c7b4";
previewLabel.textContent = "Preview";
previewLabel.style.marginTop = "0";
previewMeta.style.color = "#d2c7b4";
previewOutput.style.cssText =
  "margin: 0; min-height: 320px; white-space: pre-wrap; border-radius: 12px; background: #12110f; color: #d8f3d0; padding: 14px; overflow: auto;";

sourceLabel.append(sourceInput);
editorPanel.append(sourceLabel, status);
previewPanel.append(previewLabel, previewMeta, previewOutput);
layout.append(editorPanel, previewPanel);
shell.append(heading, intro, layout);
app.append(shell);

function updatePreview(source: string): void {
  const result = renderSource({ source });
  const previewText = result.artifact.rows.join("\n");

  status.textContent = `Parsed ${result.parsed.lines.length} line(s), compiled ${result.compiled.segments.length} segment(s).`;
  previewMeta.textContent = `Artifact: ${result.artifact.kind} ${result.artifact.width}x${result.artifact.height}`;
  previewOutput.textContent =
    previewText === "" ? "(no rendered rows yet)" : previewText;
}

sourceInput.addEventListener("input", () => {
  updatePreview(sourceInput.value);
});

updatePreview(initialSource);
