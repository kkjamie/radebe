import type { PolygonCommand, StrokeAppearance } from "../../../types.js";
import {
  getClosestPolygonEdgeSample,
  getPixelCoverage,
  getPolygonStrokeEnvelope,
  getStrokePatternState,
  isPointInsidePolygon,
  sampleFillColor,
  setPixel,
  type DrawnGrid,
  type PixelGrid
} from "../../shared.js";

export function drawPolygonStroke(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  command: Pick<PolygonCommand, "points">,
  stroke: StrokeAppearance,
  antialias: boolean,
  baseOuterOffset = 0
): void {
  const bounds = getPolygonStrokeEnvelope(command.points, stroke, baseOuterOffset);

  if (stroke.fill !== null) {
    for (let y = bounds.y; y < bounds.y + bounds.height; y += 1) {
      for (let x = bounds.x; x < bounds.x + bounds.width; x += 1) {
        const coverage = getPixelCoverage(x, y, antialias, (pointX, pointY) => {
          const inside = isPointInsidePolygon(pointX, pointY, command.points);
          const closestEdge = getClosestPolygonEdgeSample(
            pointX,
            pointY,
            command.points
          );
          const hostInside =
            inside || closestEdge.distance <= baseOuterOffset;
          const distanceToHostEdge = inside
            ? baseOuterOffset + closestEdge.distance
            : Math.abs(baseOuterOffset - closestEdge.distance);
          const inInnerBand =
            hostInside &&
            bounds.inner > 0 &&
            distanceToHostEdge <= bounds.inner;
          const inOuterBand =
            !hostInside &&
            bounds.outer > 0 &&
            distanceToHostEdge <= bounds.outer;

          return (
            (inInnerBand || inOuterBand) &&
            getStrokePatternState(
              stroke.style,
              closestEdge.perimeterPosition,
              stroke.width,
              stroke.dashLength,
              stroke.gapLength,
              stroke.dotSpacing
            )
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
    drawPolygonStroke(
      pixels,
      drawnPixels,
      command,
      nestedStroke,
      antialias,
      baseOuterOffset + bounds.outer
    );
  });
}
