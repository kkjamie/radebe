import type { CompiledDrawCommand } from "../../../types.js";
import { type DrawnGrid, type PixelGrid } from "../../shared.js";
import { drawCircleFill } from "./fill.js";
import { drawCircleGlow } from "./glow.js";
import { drawCircleShadow } from "./shadow.js";
import { drawCircleStroke } from "./stroke.js";

export function drawCircleCommand(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  command: Extract<CompiledDrawCommand, { kind: "circle" }>,
  defaultAntialias: boolean
): void {
  const antialias = command.antialias ?? defaultAntialias;

  (command.shadows ?? []).forEach((shadow) => {
    drawCircleShadow(pixels, drawnPixels, command, shadow, antialias);
  });
  (command.glows ?? [])
    .filter((glow) => glow.mode === "outer")
    .forEach((glow) => {
      drawCircleGlow(pixels, drawnPixels, command, glow, antialias);
    });
  command.fills.forEach((fill) => {
    drawCircleFill(pixels, drawnPixels, command, fill, antialias);
  });
  (command.glows ?? [])
    .filter((glow) => glow.mode === "inner")
    .forEach((glow) => {
      drawCircleGlow(pixels, drawnPixels, command, glow, antialias);
    });
  command.strokes.forEach((stroke) => {
    drawCircleStroke(pixels, drawnPixels, command, stroke, antialias);
  });
}
