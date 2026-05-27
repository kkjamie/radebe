import type { CompiledDrawCommand, RectFill } from "../../../types.js";
import {
  buildCutPolygon,
  getPixelCoverage,
  isPointInsidePolygon,
  isPointInsideRoundedRect,
  sampleFillColor,
  setPixel,
  type DrawnGrid,
  type PixelGrid
} from "../../shared.js";

export function drawRectFill(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  command: Pick<
    Extract<CompiledDrawCommand, { kind: "rect" }>,
    "x" | "y" | "width" | "height" | "cut" | "radius"
  >,
  fill: RectFill,
  antialias: boolean
): void {
  const polygon = buildCutPolygon(command);

  for (let y = command.y; y < command.y + command.height; y += 1) {
    for (let x = command.x; x < command.x + command.width; x += 1) {
      const coverage = getPixelCoverage(x, y, antialias, (pointX, pointY) => {
        if (polygon !== null && !isPointInsidePolygon(pointX, pointY, polygon)) {
          return false;
        }

        return isPointInsideRoundedRect(pointX, pointY, command);
      });

      if (coverage <= 0) {
        continue;
      }

      const color = sampleFillColor(fill, command, x, y);

      if (color !== null) {
        setPixel(pixels, drawnPixels, x, y, color, fill.alpha * coverage);
      }
    }
  }
}
