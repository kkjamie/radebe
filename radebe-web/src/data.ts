import type { ExampleDoc, PageDefinition } from "./types.js";
import { commandDocs } from "./content/commands/index.js";
import { appVersion } from "./content/version.js";
import {
  examplesPage,
  homePage,
  integrationPages,
  releaseNotesPage,
  roadmapPage,
  syntaxPage,
  tryItPage
} from "./pages/index.js";

export { appVersion, integrationPages };

export const exampleDocs: ExampleDoc[] = commandDocs;

export const pages: PageDefinition[] = [
  homePage,
  tryItPage,
  examplesPage,
  syntaxPage,
  releaseNotesPage,
  roadmapPage,
  ...exampleDocs.map((doc) => ({
    id: doc.id,
    kind: "example" as const,
    doc
  })),
  ...integrationPages
];
