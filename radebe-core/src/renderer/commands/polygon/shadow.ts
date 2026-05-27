import type { PolygonCommand, ShadowAppearance } from "../../../types.js";
import {
  createBoxBlurredAlphaSampler,
  expandBounds,
  getClosestPolygonEdgeSample,
  getPixelCoverage,
  getPolygonBounds,
  getShadowBlurRadius,
  isPointInsidePolygon,
  sampleFillColor,
  setPixel,
  type DrawnGrid,
  type PixelGrid
} from "../../shared.js";

export function drawPolygonShadow(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  command: Pick<PolygonCommand, "points">,
  shadow: ShadowAppearance,
  antialias: boolean
): void {
  if (shadow.fill === null) {
    return;
  }

  const points = command.points.map((point) => ({
    x: point.x + shadow.offsetX,
    y: point.y + shadow.offsetY
  }));
  const baseBounds = getPolygonBounds(points);
  const expansion = Math.max(shadow.spread, 0);
  const sampleBounds = {
    x: baseBounds.x - expansion,
    y: baseBounds.y - expansion,
    width: baseBounds.width + expansion * 2,
    height: baseBounds.height + expansion * 2
  };
  const blurRadius = getShadowBlurRadius(shadow);
  const drawBounds =
    blurRadius === 0 ? sampleBounds : expandBounds(sampleBounds, blurRadius);

  const sampleShadowAlpha = (sampleX: number, sampleY: number) =>
    getPixelCoverage(sampleX, sampleY, antialias, (pointX, pointY) => {
      const inside = isPointInsidePolygon(pointX, pointY, points);
      const closestEdge = getClosestPolygonEdgeSample(pointX, pointY, points);

      if (shadow.spread >= 0) {
        return inside || closestEdge.distance <= shadow.spread;
      }

      return inside && closestEdge.distance > -shadow.spread;
    });
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

      const color = sampleFillColor(shadow.fill, sampleBounds, x, y);

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
