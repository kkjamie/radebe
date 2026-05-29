import type { RectFill } from "../types.js";
import {
  sampleFillColor,
  setPixel,
  type DrawnGrid,
  type PixelGrid,
  type RectBounds
} from "./shared.js";

export type CoverageSampler = (x: number, y: number) => number;

export function drawCoveredFill(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  bounds: RectBounds,
  fill: RectFill,
  sampleCoverage: CoverageSampler
): void {
  for (let y = bounds.y; y < bounds.y + bounds.height; y += 1) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x += 1) {
      const coverage = sampleCoverage(x, y);

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
