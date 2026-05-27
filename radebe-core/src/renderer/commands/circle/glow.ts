import type { CircleCommand, GlowAppearance } from "../../../types.js";
import {
  drawGlowFromAlpha,
  expandBounds,
  getGlowBlurRadius,
  getPixelCoverage,
  type DrawnGrid,
  type PixelGrid
} from "../../shared.js";

export function drawCircleGlow(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  command: Pick<CircleCommand, "x" | "y" | "radius">,
  glow: GlowAppearance,
  antialias: boolean
): void {
  if (glow.fill === null) {
    return;
  }

  const spread = Math.max(glow.spread, 0);
  const blurRadius = getGlowBlurRadius(glow);
  const sourceRadius = command.radius;
  const glowRadius =
    glow.mode === "outer" ? sourceRadius + spread : sourceRadius - spread;
  const sourceBounds = {
    x: command.x - sourceRadius,
    y: command.y - sourceRadius,
    width: sourceRadius * 2 + 1,
    height: sourceRadius * 2 + 1
  };
  const glowBounds =
    glowRadius >= 0
      ? {
          x: command.x - glowRadius,
          y: command.y - glowRadius,
          width: glowRadius * 2 + 1,
          height: glowRadius * 2 + 1
        }
      : sourceBounds;
  const drawBounds =
    glow.mode === "outer" ? expandBounds(glowBounds, blurRadius) : sourceBounds;
  const sourceCenterX = command.x + 0.5;
  const sourceCenterY = command.y + 0.5;

  const sampleSourceAlpha = (sampleX: number, sampleY: number) =>
    getPixelCoverage(sampleX, sampleY, antialias, (pointX, pointY) =>
      Math.hypot(pointX - sourceCenterX, pointY - sourceCenterY) <= sourceRadius
    );
  const sampleGlowBaseAlpha = (sampleX: number, sampleY: number) => {
    if (glowRadius < 0) {
      return 0;
    }

    return getPixelCoverage(sampleX, sampleY, antialias, (pointX, pointY) =>
      Math.hypot(pointX - sourceCenterX, pointY - sourceCenterY) <= glowRadius
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
