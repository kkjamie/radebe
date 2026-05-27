import type { CircleCommand, RectFill } from "../../../types.js";
import {
  getPixelCoverage,
  sampleFillColor,
  setPixel,
  type DrawnGrid,
  type PixelGrid
} from "../../shared.js";

export function drawCircleFill(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  command: Pick<CircleCommand, "x" | "y" | "radius">,
  fill: RectFill,
  antialias: boolean
): void {
  const bounds = {
    x: command.x - command.radius,
    y: command.y - command.radius,
    width: command.radius * 2 + 1,
    height: command.radius * 2 + 1
  };

  for (let y = bounds.y; y < bounds.y + bounds.height; y += 1) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x += 1) {
      const centerX = command.x + 0.5;
      const centerY = command.y + 0.5;
      const coverage = getPixelCoverage(x, y, antialias, (pointX, pointY) =>
        Math.hypot(pointX - centerX, pointY - centerY) <= command.radius
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
