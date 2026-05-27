import type { CircleCommand, StrokeAppearance } from "../../../types.js";
import {
  getCircleStrokeBounds,
  getPixelCoverage,
  getStrokePatternState,
  sampleFillColor,
  setPixel,
  type DrawnGrid,
  type PixelGrid
} from "../../shared.js";

export function drawCircleStroke(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  command: Pick<CircleCommand, "x" | "y" | "radius">,
  stroke: StrokeAppearance,
  antialias: boolean
): void {
  const bounds = getCircleStrokeBounds(command, stroke);
  const centerX = command.x + 0.5;
  const centerY = command.y + 0.5;
  const averageRadius = (bounds.innerRadius + bounds.outerRadius) / 2;
  const circumference = Math.max(1, Math.round(2 * Math.PI * averageRadius));

  if (stroke.fill !== null) {
    for (let y = bounds.y; y < bounds.y + bounds.height; y += 1) {
      for (let x = bounds.x; x < bounds.x + bounds.width; x += 1) {
        const coverage = getPixelCoverage(x, y, antialias, (pointX, pointY) => {
          const distance = Math.hypot(pointX - centerX, pointY - centerY);

          if (distance > bounds.outerRadius || distance <= bounds.innerRadius) {
            return false;
          }

          const angle = Math.atan2(pointY - centerY, pointX - centerX);
          const normalizedAngle = angle < 0 ? angle + Math.PI * 2 : angle;
          const patternPosition = Math.round(
            (normalizedAngle / (Math.PI * 2)) * circumference
          );

          return getStrokePatternState(
            stroke.style,
            patternPosition,
            stroke.width,
            stroke.dashLength,
            stroke.gapLength,
            stroke.dotSpacing
          );
        });

        if (coverage <= 0) {
          continue;
        }

        const color = sampleFillColor(stroke.fill, bounds, x, y);

        if (color !== null) {
          setPixel(
            pixels,
            drawnPixels,
            x,
            y,
            color,
            stroke.alpha * stroke.fill.alpha * coverage
          );
        }
      }
    }
  }

  stroke.strokes.forEach((nestedStroke) => {
    drawCircleStroke(
      pixels,
      drawnPixels,
      {
        x: command.x,
        y: command.y,
        radius: bounds.outerRadius
      },
      nestedStroke,
      antialias
    );
  });
}
