import type { CircleCommand, ShadowAppearance } from "../../../types.js";
import {
  createBoxBlurredAlphaSampler,
  getPixelCoverage,
  getShadowBlurRadius,
  offsetAndExpandBounds,
  sampleFillColor,
  setPixel,
  type DrawnGrid,
  type PixelGrid
} from "../../shared.js";

export function drawCircleShadow(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  command: Pick<CircleCommand, "x" | "y" | "radius">,
  shadow: ShadowAppearance,
  antialias: boolean
): void {
  if (shadow.fill === null) {
    return;
  }

  const radius = command.radius + shadow.spread;

  if (radius < 0) {
    return;
  }

  const centerX = command.x + shadow.offsetX;
  const centerY = command.y + shadow.offsetY;
  const bounds = {
    x: centerX - radius,
    y: centerY - radius,
    width: radius * 2 + 1,
    height: radius * 2 + 1
  };
  const blurRadius = getShadowBlurRadius(shadow);
  const drawBounds =
    blurRadius === 0 ? bounds : offsetAndExpandBounds(bounds, 0, 0, blurRadius);
  const sampleCenterX = centerX + 0.5;
  const sampleCenterY = centerY + 0.5;
  const sampleShadowAlpha = (sampleX: number, sampleY: number) =>
    getPixelCoverage(sampleX, sampleY, antialias, (pointX, pointY) =>
      Math.hypot(pointX - sampleCenterX, pointY - sampleCenterY) <= radius
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

      const color = sampleFillColor(shadow.fill, bounds, x, y);

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
