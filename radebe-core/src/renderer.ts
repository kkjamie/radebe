import { compileDocument } from "./compiler.js";
import { parseSource } from "./parser.js";

import type {
  CompiledDocument,
  CompiledDrawCommand,
  PipelineResult,
  RenderArtifact,
  RenderResult,
  SourceDocument
} from "./types.js";

function setPixel(
  pixels: (string | null)[][],
  drawnPixels: boolean[][],
  x: number,
  y: number,
  color: string
): void {
  if (y < 0 || y >= pixels.length) {
    return;
  }

  if (x < 0 || x >= pixels[y]!.length) {
    return;
  }

  pixels[y]![x] = color;
  drawnPixels[y]![x] = true;
}

function drawCommand(
  pixels: (string | null)[][],
  drawnPixels: boolean[][],
  command: CompiledDrawCommand
): void {
  if (command.kind === "plot") {
    setPixel(pixels, drawnPixels, command.x, command.y, command.color);
    return;
  }

  let currentX = command.x1;
  let currentY = command.y1;
  const deltaX = Math.abs(command.x2 - command.x1);
  const deltaY = Math.abs(command.y2 - command.y1);
  const stepX = command.x1 < command.x2 ? 1 : -1;
  const stepY = command.y1 < command.y2 ? 1 : -1;
  let error = deltaX - deltaY;

  while (true) {
    setPixel(pixels, drawnPixels, currentX, currentY, command.color);

    if (currentX === command.x2 && currentY === command.y2) {
      break;
    }

    const doubleError = error * 2;

    if (doubleError > -deltaY) {
      error -= deltaY;
      currentX += stepX;
    }

    if (doubleError < deltaX) {
      error += deltaX;
      currentY += stepY;
    }
  }
}

function buildSpriteGridArtifact(document: CompiledDocument): RenderArtifact {
  const width = document.sprite?.width ?? 0;
  const height = document.sprite?.height ?? 0;
  const background = document.sprite?.background ?? "transparent";
  const backgroundColor = background === "transparent" ? null : background;
  const pixels = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => backgroundColor)
  );
  const drawnPixels = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => false)
  );

  document.commands.forEach((command) => {
    drawCommand(pixels, drawnPixels, command);
  });

  const rows = pixels.map((row, y) =>
    row
      .map((pixel, x) => {
        if (drawnPixels[y]![x]) {
          return "#";
        }

        return pixel === null ? "." : ":";
      })
      .join("")
  );

  return {
    kind: "sprite-grid",
    width,
    height,
    background,
    rows,
    pixels
  };
}

export function renderDocument(document: CompiledDocument): RenderResult {
  return {
    artifact: buildSpriteGridArtifact(document),
    diagnostics: []
  };
}

export function renderSource(request: SourceDocument): PipelineResult {
  const parsed = parseSource(request);
  const compiled = compileDocument(parsed.document);
  const rendered = renderDocument(compiled.document);

  return {
    parsed: parsed.document,
    compiled: compiled.document,
    artifact: rendered.artifact,
    diagnostics: [
      ...parsed.diagnostics,
      ...compiled.diagnostics,
      ...rendered.diagnostics
    ]
  };
}
