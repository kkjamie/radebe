import { renderDocument } from "@radebe/core";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Expected #app container");
}

const result = renderDocument({ source: "Radebe workspace scaffold" });

app.innerHTML = `
  <main>
    <h1>Radebe</h1>
    <p>Workspace scaffold ready.</p>
    <pre>${result.output}</pre>
  </main>
`;
