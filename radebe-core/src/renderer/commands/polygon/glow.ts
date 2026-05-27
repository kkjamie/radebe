import type { GlowAppearance, PolygonCommand } from "../../../types.js";
import {
  drawGlowFromAlpha,
  expandBounds,
  getClosestPolygonEdgeSample,
  getGlowBlurRadius,
  getPixelCoverage,
  getPolygonBounds,
  isPointInsidePolygon,
  type DrawnGrid,
  type PixelGrid
} from "../../shared.js";

export function drawPolygonGlow(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  command: Pick<PolygonCommand, "points">,
  glow: GlowAppearance,
  antialias: boolean
): void {
  if (glow.fill === null) {
    return;
  }

  const sourceBounds = getPolygonBounds(command.points);
  const spread = Math.max(glow.spread, 0);
  const blurRadius = getGlowBlurRadius(glow);
  const glowBounds =
    glow.mode === "outer" ? expandBounds(sourceBounds, spread) : sourceBounds;
  const drawBounds =
    glow.mode === "outer" ? expandBounds(glowBounds, blurRadius) : sourceBounds;

  const sampleSourceAlpha = (sampleX: number, sampleY: number) =>
    getPixelCoverage(sampleX, sampleY, antialias, (pointX, pointY) =>
      isPointInsidePolygon(pointX, pointY, command.points)
    );
  const sampleGlowBaseAlpha = (sampleX: number, sampleY: number) =>
    getPixelCoverage(sampleX, sampleY, antialias, (pointX, pointY) => {
      const inside = isPointInsidePolygon(pointX, pointY, command.points);
      const closestEdge = getClosestPolygonEdgeSample(
        pointX,
        pointY,
        command.points
      );

      if (glow.mode === "outer") {
        return inside || closestEdge.distance <= spread;
      }

      return inside && closestEdge.distance > spread;
    });

  drawGlowFromAlpha(
    pixels,
    drawnPixels,
    glow,
    drawBounds,
    glowBounds,
    sampleSourceAlpha,
    sampleGlowBaseAlpha
  );
}
