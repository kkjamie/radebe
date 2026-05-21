import type { ExampleDoc, PageDefinition } from "./types.js";
import { commandDocs } from "./content/commands/index.js";
import { homePage } from "./content/home.js";
import { integrationPages } from "./content/integrations.js";
import { tryItPage } from "./content/try-it.js";
import { appVersion } from "./content/version.js";

export { appVersion, integrationPages };

export const exampleDocs: ExampleDoc[] = commandDocs;

export const pages: PageDefinition[] = [
  homePage,
  tryItPage,
  {
    id: "syntax",
    kind: "syntax",
    title: "Syntax"
  },
  {
    id: "releases",
    kind: "releases",
    title: "Release Notes"
  },
  {
    id: "roadmap",
    kind: "roadmap",
    title: "Roadmap"
  },
  ...exampleDocs.map((doc) => ({
    id: doc.id,
    kind: "example" as const,
    doc
  })),
  ...integrationPages
];
