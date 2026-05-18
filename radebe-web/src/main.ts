import { renderSource } from "@radebe/core";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Expected #app container");
}

const initialSource =
  "sprite sci-fi-button\n  size 16 8\n  background transparent\n\nplot 2 2 #d8f8ff\nline 3 5 12 5 #70c8e8";

const shell = document.createElement("main");
const heading = document.createElement("h1");
const intro = document.createElement("p");
const layout = document.createElement("section");
const editorPanel = document.createElement("article");
const previewPanel = document.createElement("article");
const sourceLabel = document.createElement("label");
const sourceInput = document.createElement("textarea");
const status = document.createElement("p");
const commandHelp = document.createElement("p");
const previewLabel = document.createElement("h2");
const previewMeta = document.createElement("p");
const diagnosticsLabel = document.createElement("h3");
const diagnosticsOutput = document.createElement("pre");
const pixelPreview = document.createElement("div");
const asciiLabel = document.createElement("h3");
const previewOutput = document.createElement("pre");

shell.style.cssText =
  "font-family: Consolas, 'Courier New', monospace; max-width: 1100px; margin: 0 auto; padding: 32px 20px 48px; color: #f4efe6;";
document.body.style.cssText =
  "margin: 0; background: linear-gradient(180deg, #171513 0%, #22201d 100%); min-height: 100vh;";
heading.textContent = "Radebe";
heading.style.marginBottom = "8px";
intro.textContent =
  "The web shell renders the shared core artifact directly and now previews the spec-aligned sprite header plus root-level plot and line commands.";
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
commandHelp.textContent =
  "Commands: sprite <name> with nested size/background, then root-level plot x y color and line x1 y1 x2 y2 color.";
commandHelp.style.color = "#d2c7b4";
previewLabel.textContent = "Preview";
previewLabel.style.marginTop = "0";
previewMeta.style.color = "#d2c7b4";
diagnosticsLabel.textContent = "Diagnostics";
diagnosticsLabel.style.marginBottom = "8px";
diagnosticsOutput.style.cssText =
  "margin: 0 0 16px; min-height: 72px; white-space: pre-wrap; border-radius: 12px; background: #191613; color: #ffcf99; padding: 14px; overflow: auto;";
pixelPreview.style.cssText =
  "display: grid; gap: 2px; margin: 0 0 16px; min-height: 80px; align-content: start;";
asciiLabel.textContent = "ASCII Grid";
asciiLabel.style.marginBottom = "8px";
previewOutput.style.cssText =
  "margin: 0; min-height: 320px; white-space: pre-wrap; border-radius: 12px; background: #12110f; color: #d8f3d0; padding: 14px; overflow: auto;";

sourceLabel.append(sourceInput);
editorPanel.append(sourceLabel, status, commandHelp);
previewPanel.append(
  previewLabel,
  previewMeta,
  diagnosticsLabel,
  diagnosticsOutput,
  pixelPreview,
  asciiLabel,
  previewOutput
);
layout.append(editorPanel, previewPanel);
shell.append(heading, intro, layout);
app.append(shell);

function updatePreview(source: string): void {
  const result = renderSource({ source });
  const previewText = result.artifact.rows.join("\n");
  const diagnosticsText = result.diagnostics
    .map((diagnostic) => {
      const location =
        diagnostic.line === undefined
          ? diagnostic.stage
          : `${diagnostic.stage}:${diagnostic.line}:${diagnostic.column ?? 1}`;

      return `${location} ${diagnostic.message}`;
    })
    .join("\n");

  status.textContent = `Parsed ${result.parsed.commands.length} root command(s), compiled ${result.compiled.commands.length} draw command(s).`;
  previewMeta.textContent = `Artifact: ${result.artifact.kind} ${result.artifact.width}x${result.artifact.height} background=${result.artifact.background}`;
  diagnosticsOutput.textContent =
    diagnosticsText === "" ? "(no diagnostics)" : diagnosticsText;
  pixelPreview.replaceChildren();
  pixelPreview.style.gridTemplateColumns = `repeat(${Math.max(result.artifact.width, 1)}, 18px)`;

  result.artifact.pixels.forEach((row) => {
    row.forEach((pixel) => {
      const cell = document.createElement("span");
      cell.style.cssText =
        "width: 18px; height: 18px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.08); display: inline-block; box-sizing: border-box; background: #0d0c0b;";

      if (pixel !== null) {
        cell.style.background = pixel;
      }

      pixelPreview.append(cell);
    });
  });
  previewOutput.textContent =
    previewText === "" ? "(no raster rows yet)" : previewText;
}

sourceInput.addEventListener("input", () => {
  updatePreview(sourceInput.value);
});

updatePreview(initialSource);
