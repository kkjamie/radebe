import type { GlowAppearance } from "../../../types.js";
import {
  buildAdjustedRectContour,
  drawGlowFromAlpha,
  expandBounds,
  getGlowBlurRadius,
  getPixelCoverage,
  isPointInsideRectContour,
  type DrawnGrid,
  type PixelGrid,
  type RectContour
} from "../../shared.js";

export function drawRectGlow(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  command: RectContour,
  glow: GlowAppearance,
  antialias: boolean
): void {
  if (glow.fill === null) {
    return;
  }

  const spread = Math.max(glow.spread, 0);
  const blurRadius = getGlowBlurRadius(glow);
  const glowContour = buildAdjustedRectContour(
    command,
    glow.mode === "outer" ? spread : -spread
  );

  if (glow.mode === "outer" && glowContour === null) {
    return;
  }

  const sourceBounds = {
    x: command.x,
    y: command.y,
    width: command.width,
    height: command.height
  };
  const glowBounds = glowContour ?? sourceBounds;
  const drawBounds =
    glow.mode === "outer" ? expandBounds(glowBounds, blurRadius) : sourceBounds;
  const sampleSourceAlpha = (sampleX: number, sampleY: number) =>
    getPixelCoverage(sampleX, sampleY, antialias, (pointX, pointY) =>
      isPointInsideRectContour(pointX, pointY, command)
    );
  const sampleGlowBaseAlpha = (sampleX: number, sampleY: number) => {
    if (glowContour === null) {
      return 0;
    }

    return getPixelCoverage(sampleX, sampleY, antialias, (pointX, pointY) =>
      isPointInsideRectContour(pointX, pointY, glowContour)
    );
  };

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
