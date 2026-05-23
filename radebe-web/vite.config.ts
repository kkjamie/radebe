import { fileURLToPath } from "node:url";
import { createReadStream, existsSync, statSync } from "node:fs";

import preact from "@preact/preset-vite";
import { defineConfig } from "vite";

const workspaceRoot = fileURLToPath(new URL("..", import.meta.url));
const coreSourceRoot = fileURLToPath(
  new URL("../radebe-core/src", import.meta.url)
).replace(/\\/g, "/");
const localDownloads = new Map(
  [
    [
      "/downloads/radebe-language-support-0.1.0.vsix",
      new URL("../Temp/radebe-language-support-0.1.0.vsix", import.meta.url)
    ],
    [
      "/downloads/radebe-unity-bridge.manifest.json",
      new URL("../radebe-unity/bridge.manifest.json", import.meta.url)
    ],
    [
      "/downloads/radebe-unity-plugin-0.1.0.unitypackage",
      new URL("../Temp/radebe-unity-plugin-0.1.0.unitypackage", import.meta.url)
    ],
    [
      "/downloads/radebe-cli-win32-x64.exe",
      new URL("../artifacts/radebe-cli/sea/win32-x64/radebe.exe", import.meta.url)
    ]
  ].map(([route, url]) => [route, fileURLToPath(url as URL)])
);

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
    {
      name: "radebe-local-downloads",
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
      }
    }
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
