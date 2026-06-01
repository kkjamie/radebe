import type { StrokeAppearance } from "../../types.js";
import type { CoverageSource } from "../coverage.js";
import {
  expandBounds,
  getStrokePatternState,
  resolveStrokeExtents,
  sampleFillColor,
  setPixel,
  type DrawnGrid,
  type PixelGrid,
  type RectBounds
} from "../shared.js";

export function drawCoverageStroke(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  source: CoverageSource,
  stroke: StrokeAppearance
): void {
  const { inner, outer } = resolveStrokeExtents(stroke.width, stroke.align);
  const strokeBounds = expandBounds(source.bounds, outer);

  if (stroke.fill !== null) {
    drawCoverageStrokeFill(
      pixels,
      drawnPixels,
      source,
      stroke,
      strokeBounds,
      inner,
      outer
    );
  }

  const nestedSource: CoverageSource = source.createSpreadSource(outer);

  stroke.strokes.forEach((nestedStroke) => {
    drawCoverageStroke(pixels, drawnPixels, nestedSource, nestedStroke);
  });
}

function drawCoverageStrokeFill(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  source: CoverageSource,
  stroke: StrokeAppearance,
  strokeBounds: RectBounds,
  inner: number,
  outer: number
): void {
  const fill = stroke.fill!;

  for (let y = strokeBounds.y; y < strokeBounds.y + strokeBounds.height; y += 1) {
    for (let x = strokeBounds.x; x < strokeBounds.x + strokeBounds.width; x += 1) {
      const patternPosition =
        source.getStrokePatternPosition?.(x, y, strokeBounds, stroke) ?? 0;

      if (
        !getStrokePatternState(
          stroke.style,
          patternPosition,
          stroke.width,
          stroke.dashLength,
          stroke.gapLength,
          stroke.dotSpacing
        )
      ) {
        continue;
      }

      const outerAlpha =
        outer > 0 ? source.sampleSpreadAlpha(x, y, outer) : source.sampleAlpha(x, y);
      const innerAlpha =
        inner > 0 ? source.sampleSpreadAlpha(x, y, -inner) : source.sampleAlpha(x, y);
      const coverage = Math.max(outerAlpha - innerAlpha, 0);

      if (coverage <= 0) {
        continue;
      }

      const color = sampleFillColor(fill, strokeBounds, x, y);

      if (color !== null) {
        setPixel(
          pixels,
          drawnPixels,
          x,
          y,
          color,
          stroke.alpha * fill.alpha * coverage
        );
      }
    }
  }
}
