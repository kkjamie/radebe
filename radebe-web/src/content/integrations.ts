import type { PageDefinition } from "../types.js";

export const integrationPages: Extract<PageDefinition, { kind: "integration" }>[] = [
  {
    id: "vscode-extension",
    kind: "integration",
    title: "VS Code Extension",
    summary:
      "Language support for `.rdb` files with syntax highlighting, completions, diagnostics, color swatches, smart indentation, and a text render preview.",
    downloads: [
      {
        label: "Download VSIX",
        href: "/downloads/radebe-language-support-0.1.0.vsix",
        download: true
      }
    ],
    commands: ["npm run package:vscode", "npm run install:vscode"],
    details: [
      "Local packaging writes `Temp/radebe-language-support-0.1.0.vsix`.",
      "Marketplace publishing is intentionally out of scope for this local development release.",
      "The extension consumes the shared core language service directly, so completions and diagnostics match the web editor."
    ]
  },
  {
    id: "unity-plugin",
    kind: "integration",
    title: "Unity Plugin",
    summary:
      "A Unity bridge that imports `.rdb` files by invoking the packaged Radebe CLI and creating generated Texture2D and Sprite assets.",
    downloads: [
      {
        label: "Download Bridge Manifest",
        href: "/downloads/radebe-unity-bridge.manifest.json",
        download: true
      },
      {
        label: "Download Unity Plugin ZIP",
        href: "/downloads/radebe-unity-plugin-0.1.0.zip",
        download: true
      },
      {
        label: "Download Windows CLI Payload",
        href: "/downloads/radebe-cli-win32-x64.exe",
        download: true
      }
    ],
    commands: ["npm run package:cli:sea", "npm run deploy:unity"],
    details: [
      "The Unity bridge consumes `radebe-cli`; it does not reimplement the renderer in C#.",
      "Repo automation deploys `radebe-unity/Assets` plus the packaged CLI payload into a configured Unity project.",
      "The importer handles `.rdb` source assets and produces generated Sprite main assets."
    ]
  }
];
