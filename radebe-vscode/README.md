# Radebe VS Code Extension

VS Code language support for `.rdb` sprite source files.

## Current Features
- Registers the `radebe` language for `.rdb` files.
- Provides TextMate syntax highlighting for comments, command tokens, named arguments, variables, colors, and numbers.
- Uses `@radebe/core` for completions, signature help, diagnostics, smart shorthand cleanup, and Enter indentation.
- Uses `@radebe/core` color token metadata for named-color and hex-color decorations plus picker presentations.
- Adds `Radebe: Open Text Render Preview` for a quick text-grid render artifact view.

## Development
```sh
npm run build -w radebe-language-support
npm run test -w radebe-language-support
```

## Local Install
From the repository root:

```sh
npm run install:vscode
```

This builds the workspace, packages an installable VSIX into `Temp/`, and installs it into the normal VS Code profile with `code --install-extension`.

The extension consumes `@radebe/core` directly for this first slice. A shared LSP adapter can be introduced later if multiple editor hosts need a protocol boundary.
