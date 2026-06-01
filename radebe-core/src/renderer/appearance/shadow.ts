import type { ShadowAppearance } from "../../types.js";
import type { CoverageSource } from "../coverage.js";
import {
  createBoxBlurredAlphaSampler,
  expandBounds,
  getShadowBlurRadius,
  offsetAndExpandBounds,
  sampleFillColor,
  setPixel,
  type DrawnGrid,
  type PixelGrid
} from "../shared.js";

export function drawCoverageShadow(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  source: CoverageSource,
  shadow: ShadowAppearance
): void {
  if (shadow.fill === null) {
    return;
  }

  const blurRadius = getShadowBlurRadius(shadow);
  const shadowSource = source.createSpreadSource(shadow.spread);
  const shadowBounds = offsetAndExpandBounds(
    shadowSource.bounds,
    shadow.offsetX,
    shadow.offsetY,
    0
  );
  const drawBounds =
    blurRadius === 0 ? shadowBounds : expandBounds(shadowBounds, blurRadius);
  const sampleShadowAlpha = (sampleX: number, sampleY: number) => {
    const sourceX = Math.round(sampleX - shadow.offsetX);
    const sourceY = Math.round(sampleY - shadow.offsetY);

    return shadowSource.sampleAlpha(sourceX, sourceY);
  };
  const sampleShadowCoverage = createBoxBlurredAlphaSampler(
    drawBounds,
    blurRadius,
    sampleShadowAlpha
  );

  for (let y = drawBounds.y; y < drawBounds.y + drawBounds.height; y += 1) {
    for (let x = drawBounds.x; x < drawBounds.x + drawBounds.width; x += 1) {
      const coverage = sampleShadowCoverage(x, y);

      if (coverage <= 0) {
        continue;
      }

      const color = sampleFillColor(shadow.fill, shadowBounds, x, y);

      if (color !== null) {
        setPixel(
          pixels,
          drawnPixels,
          x,
          y,
          color,
          shadow.alpha * shadow.fill.alpha * coverage
        );
      }
    }
  }
}
