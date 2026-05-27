import type { ShadowAppearance } from "../../../types.js";
import {
  buildAdjustedRectContour,
  createBoxBlurredAlphaSampler,
  getPixelCoverage,
  getShadowBlurRadius,
  isPointInsideRectContour,
  offsetAndExpandBounds,
  sampleFillColor,
  setPixel,
  translateRectContour,
  type DrawnGrid,
  type PixelGrid,
  type RectContour
} from "../../shared.js";

export function drawRectShadow(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  command: RectContour,
  shadow: ShadowAppearance,
  antialias: boolean
): void {
  if (shadow.fill === null) {
    return;
  }

  const expandedContour = buildAdjustedRectContour(command, shadow.spread);

  if (expandedContour === null) {
    return;
  }

  const shadowContour = translateRectContour(
    expandedContour,
    shadow.offsetX,
    shadow.offsetY
  );
  const blurRadius = getShadowBlurRadius(shadow);
  const drawBounds =
    blurRadius === 0
      ? shadowContour
      : offsetAndExpandBounds(shadowContour, 0, 0, blurRadius);
  const sampleShadowAlpha = (sampleX: number, sampleY: number) =>
    getPixelCoverage(sampleX, sampleY, antialias, (pointX, pointY) =>
      isPointInsideRectContour(pointX, pointY, shadowContour)
    );
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

      const color = sampleFillColor(shadow.fill, shadowContour, x, y);

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
