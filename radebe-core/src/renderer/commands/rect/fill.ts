import type { CompiledDrawCommand, RectFill } from "../../../types.js";
import { drawCoveredFill } from "../../appearance.js";
import {
  buildCutPolygon,
  getPixelCoverage,
  isPointInsidePolygon,
  isPointInsideRoundedRect,
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

  drawCoveredFill(pixels, drawnPixels, command, fill, (x, y) =>
    getPixelCoverage(x, y, antialias, (pointX, pointY) => {
      if (polygon !== null && !isPointInsidePolygon(pointX, pointY, polygon)) {
        return false;
      }

      return isPointInsideRoundedRect(pointX, pointY, command);
    })
  );
}
