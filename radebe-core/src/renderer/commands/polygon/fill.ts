import type { PolygonCommand, RectFill } from "../../../types.js";
import { drawCoveredFill } from "../../appearance.js";
import {
  getPixelCoverage,
  getPolygonBounds,
  isPointInsidePolygon,
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

  drawCoveredFill(pixels, drawnPixels, bounds, fill, (x, y) =>
    getPixelCoverage(x, y, antialias, (pointX, pointY) =>
      isPointInsidePolygon(pointX, pointY, command.points)
    )
  );
}
