import type { PolygonCommand, RectFill } from "../../../types.js";
import {
  getPixelCoverage,
  getPolygonBounds,
  isPointInsidePolygon,
  sampleFillColor,
  setPixel,
  type DrawnGrid,
  type PixelGrid
} from "../../shared.js";

export function drawPolygonFill(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  command: Pick<PolygonCommand, "points">,
  fill: RectFill,
  antialias: boolean
): void {
  const bounds = getPolygonBounds(command.points);

  for (let y = bounds.y; y < bounds.y + bounds.height; y += 1) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x += 1) {
      const coverage = getPixelCoverage(x, y, antialias, (pointX, pointY) =>
        isPointInsidePolygon(pointX, pointY, command.points)
      );

      if (coverage <= 0) {
        continue;
      }

      const color = sampleFillColor(fill, bounds, x, y);

      if (color !== null) {
        setPixel(pixels, drawnPixels, x, y, color, fill.alpha * coverage);
      }
    }
  }
}
