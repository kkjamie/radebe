import { fileURLToPath } from "node:url";

import { defineConfig } from "vite";

const workspaceRoot = fileURLToPath(new URL("..", import.meta.url));
const coreSourceRoot = fileURLToPath(
  new URL("../radebe-core/src", import.meta.url)
).replace(/\\/g, "/");

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@radebe\/core$/,
        replacement: `${coreSourceRoot}/index.ts`
      },
      {
        find: /^@radebe\/core\/(parser|compiler|renderer|types)$/,
        replacement: `${coreSourceRoot}/$1.ts`
      }
    ]
  },
  server: {
    fs: {
      allow: [workspaceRoot]
    }
  }
});
