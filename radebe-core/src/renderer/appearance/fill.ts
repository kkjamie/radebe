import type { RectFill } from "../../types.js";
import type { AlphaCoverageSource } from "../coverage.js";
import {
  sampleFillColor,
  setPixel,
  type DrawnGrid,
  type PixelGrid
} from "../shared.js";

export function drawCoverageFill(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  source: AlphaCoverageSource,
  fill: RectFill
): void {
  const { bounds } = source;

  for (let y = bounds.y; y < bounds.y + bounds.height; y += 1) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x += 1) {
      const coverage = source.sampleAlpha(x, y);

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
