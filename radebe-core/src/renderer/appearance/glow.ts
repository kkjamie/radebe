import type { GlowAppearance } from "../../types.js";
import type { CoverageSource } from "../coverage.js";
import {
  drawGlowFromAlpha,
  expandBounds,
  getGlowBlurRadius,
  type DrawnGrid,
  type PixelGrid
} from "../shared.js";

export function drawCoverageGlow(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  source: CoverageSource,
  glow: GlowAppearance
): void {
  if (glow.fill === null) {
    return;
  }

  const spread = Math.max(glow.spread, 0);
  const blurRadius = getGlowBlurRadius(glow);
  const glowSource = source.createSpreadSource(
    glow.mode === "outer" ? spread : -spread
  );
  const glowBounds = glowSource.bounds;
  const drawBounds =
    glow.mode === "outer" ? expandBounds(glowBounds, blurRadius) : source.bounds;
  const sampleSourceAlpha = (sampleX: number, sampleY: number) =>
    source.sampleAlpha(Math.round(sampleX), Math.round(sampleY));
  const sampleGlowBaseAlpha = (sampleX: number, sampleY: number) =>
    glowSource.sampleAlpha(Math.round(sampleX), Math.round(sampleY));

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
