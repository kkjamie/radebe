import type { CircleCommand, RectFill } from "../../../types.js";
import { drawCoveredFill } from "../../appearance.js";
import {
  getPixelCoverage,
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
  const centerX = command.x + 0.5;
  const centerY = command.y + 0.5;

  drawCoveredFill(pixels, drawnPixels, bounds, fill, (x, y) =>
    getPixelCoverage(x, y, antialias, (pointX, pointY) =>
      Math.hypot(pointX - centerX, pointY - centerY) <= command.radius
    )
  );
}
