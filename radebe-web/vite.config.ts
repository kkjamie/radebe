import { fileURLToPath } from "node:url";
import {
  copyFileSync,
  createReadStream,
  existsSync,
  mkdirSync,
  statSync
} from "node:fs";
import path from "node:path";

import preact from "@preact/preset-vite";
import { defineConfig } from "vite";

const workspaceRoot = fileURLToPath(new URL("..", import.meta.url));
const coreSourceRoot = fileURLToPath(
  new URL("../radebe-core/src", import.meta.url)
).replace(/\\/g, "/");
const localDownloads = new Map(
  [
    [
      "/downloads/radebe-unity-bridge.manifest.json",
      new URL("../radebe-unity/bridge.manifest.json", import.meta.url)
    ]
  ].map(([route, url]) => [route, fileURLToPath(url as URL)])
);

function writeDownloadAssets(outDir: string): void {
  for (const [route, filePath] of localDownloads) {
    if (!existsSync(filePath)) {
      // Keep local web builds usable even when packaging artifacts have not been generated yet.
      console.warn(`[radebe-local-downloads] Skipping missing asset for ${route}: ${filePath}`);
      continue;
    }

    const outputPath = path.join(outDir, ...route.slice(1).split("/"));
    mkdirSync(path.dirname(outputPath), { recursive: true });
    copyFileSync(filePath, outputPath);
  }
}

function getDownloadContentType(route: string): string {
  if (route.endsWith(".json")) {
    return "application/json";
  }

  if (
    route.endsWith(".unitypackage") ||
    route.endsWith(".zip") ||
    route.endsWith(".vsix")
  ) {
    return "application/zip";
  }

  if (route.endsWith(".exe")) {
    return "application/octet-stream";
  }

  return "application/octet-stream";
}

export default defineConfig({
  plugins: [
    preact(),
    (() => {
      let outDir = "";

      return {
        name: "radebe-local-downloads",
        configResolved(config) {
          outDir = path.resolve(config.root, config.build.outDir);
        },
        configureServer(server) {
          server.middlewares.use((request, response, next) => {
            const route = request.url?.split("?")[0] ?? "";
            const filePath = localDownloads.get(route);

            if (!filePath || !existsSync(filePath)) {
              next();
              return;
            }

            const stat = statSync(filePath);

            response.statusCode = 200;
            response.setHeader("Content-Type", getDownloadContentType(route));
            response.setHeader("Content-Length", stat.size);
            response.setHeader(
              "Content-Disposition",
              `attachment; filename="${route.split("/").at(-1) ?? "download"}"`
            );
            createReadStream(filePath).pipe(response);
          });
        },
        closeBundle() {
          if (outDir === "") {
            return;
          }

          writeDownloadAssets(outDir);
        }
      };
    })()
  ],
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
