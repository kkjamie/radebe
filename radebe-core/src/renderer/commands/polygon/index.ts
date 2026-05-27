import type { CompiledDrawCommand } from "../../../types.js";
import { type DrawnGrid, type PixelGrid } from "../../shared.js";
import { drawPolygonFill } from "./fill.js";
import { drawPolygonGlow } from "./glow.js";
import { drawPolygonShadow } from "./shadow.js";
import { drawPolygonStroke } from "./stroke.js";

export function drawPolygonCommand(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  command: Extract<CompiledDrawCommand, { kind: "polygon" }>,
  defaultAntialias: boolean
): void {
  const antialias = command.antialias ?? defaultAntialias;

  (command.shadows ?? []).forEach((shadow) => {
    drawPolygonShadow(pixels, drawnPixels, command, shadow, antialias);
  });
  (command.glows ?? [])
    .filter((glow) => glow.mode === "outer")
    .forEach((glow) => {
      drawPolygonGlow(pixels, drawnPixels, command, glow, antialias);
    });
  command.fills.forEach((fill) => {
    drawPolygonFill(pixels, drawnPixels, command, fill, antialias);
  });
  (command.glows ?? [])
    .filter((glow) => glow.mode === "inner")
    .forEach((glow) => {
      drawPolygonGlow(pixels, drawnPixels, command, glow, antialias);
    });
  command.strokes.forEach((stroke) => {
    drawPolygonStroke(pixels, drawnPixels, command, stroke, antialias);
  });
}
