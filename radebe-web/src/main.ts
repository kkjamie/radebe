import { renderSource } from "@radebe/core";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Expected #app container");
}

const result = renderSource({
  source: "Radebe workspace scaffold\nAPI boundaries ready"
});

app.innerHTML = `
  <main>
    <h1>Radebe</h1>
    <p>Core pipeline boundaries are wired through the web shell.</p>
    <p>Parsed lines: ${result.parsed.lines.length}</p>
    <pre>${result.output}</pre>
  </main>
`;
