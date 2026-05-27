import type { CompiledDrawCommand } from "../../../types.js";
import { type DrawnGrid, type PixelGrid } from "../../shared.js";
import { drawRectFill } from "./fill.js";
import { drawRectGlow } from "./glow.js";
import { drawRectShadow } from "./shadow.js";
import { drawRectStroke } from "./stroke.js";

export function drawRectCommand(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  command: Extract<CompiledDrawCommand, { kind: "rect" }>,
  defaultAntialias: boolean
): void {
  const antialias = command.antialias ?? defaultAntialias;

  (command.shadows ?? []).forEach((shadow) => {
    drawRectShadow(pixels, drawnPixels, command, shadow, antialias);
  });
  (command.glows ?? [])
    .filter((glow) => glow.mode === "outer")
    .forEach((glow) => {
      drawRectGlow(pixels, drawnPixels, command, glow, antialias);
    });
  command.fills.forEach((fill) => {
    drawRectFill(pixels, drawnPixels, command, fill, antialias);
  });
  (command.glows ?? [])
    .filter((glow) => glow.mode === "inner")
    .forEach((glow) => {
      drawRectGlow(pixels, drawnPixels, command, glow, antialias);
    });
  command.strokes.forEach((stroke) => {
    drawRectStroke(pixels, drawnPixels, command, stroke, antialias);
  });
}
