import type { StrokeAppearance } from "../../../types.js";
import {
  buildAdjustedRectContour,
  buildStrokeEnvelopeRect,
  drawStrokeRectBand,
  getPixelCoverage,
  getRectContourPatternPosition,
  getStrokePatternState,
  isPointInsideRectContour,
  resolveStrokeExtents,
  sampleFillColor,
  setPixel,
  type DrawnGrid,
  type PixelGrid,
  type RectContour
} from "../../shared.js";

function drawPlainRectStroke(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  command: Pick<RectContour, "x" | "y" | "width" | "height">,
  stroke: StrokeAppearance
): void {
  const outerRect = buildStrokeEnvelopeRect(command, stroke);
  const inner = outerRect.inner;
  const topBand = {
    x: outerRect.x,
    y: outerRect.y,
    width: outerRect.width,
    height: stroke.width
  };
  const bottomBand = {
    x: outerRect.x,
    y: command.y + command.height - inner,
    width: outerRect.width,
    height: stroke.width
  };
  const middleHeight = command.height - inner - inner;
  const leftBand = {
    x: outerRect.x,
    y: command.y + inner,
    width: stroke.width,
    height: Math.max(middleHeight, 0)
  };
  const rightBand = {
    x: command.x + command.width - inner,
    y: command.y + inner,
    width: stroke.width,
    height: Math.max(middleHeight, 0)
  };

  if (stroke.fill !== null) {
    drawStrokeRectBand(
      pixels,
      drawnPixels,
      topBand,
      outerRect,
      stroke.fill,
      stroke.style,
      stroke.width,
      stroke.dashLength,
      stroke.gapLength,
      stroke.dotSpacing,
      stroke.alpha * stroke.fill.alpha,
      "x"
    );
    drawStrokeRectBand(
      pixels,
      drawnPixels,
      bottomBand,
      outerRect,
      stroke.fill,
      stroke.style,
      stroke.width,
      stroke.dashLength,
      stroke.gapLength,
      stroke.dotSpacing,
      stroke.alpha * stroke.fill.alpha,
      "x"
    );

    if (leftBand.height > 0) {
      drawStrokeRectBand(
        pixels,
        drawnPixels,
        leftBand,
        outerRect,
        stroke.fill,
        stroke.style,
        stroke.width,
        stroke.dashLength,
        stroke.gapLength,
        stroke.dotSpacing,
        stroke.alpha * stroke.fill.alpha,
        "y"
      );
    }

    if (rightBand.height > 0) {
      drawStrokeRectBand(
        pixels,
        drawnPixels,
        rightBand,
        outerRect,
        stroke.fill,
        stroke.style,
        stroke.width,
        stroke.dashLength,
        stroke.gapLength,
        stroke.dotSpacing,
        stroke.alpha * stroke.fill.alpha,
        "y"
      );
    }
  }

  stroke.strokes.forEach((nestedStroke) => {
    drawPlainRectStroke(pixels, drawnPixels, outerRect, nestedStroke);
  });
}

function drawContourAwareRectStroke(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  command: RectContour,
  stroke: StrokeAppearance,
  antialias: boolean
): void {
  const { inner, outer } = resolveStrokeExtents(stroke.width, stroke.align);
  const outerContour = buildAdjustedRectContour(command, outer);
  const innerContour = buildAdjustedRectContour(command, -inner);

  if (outerContour === null) {
    return;
  }

  if (stroke.fill !== null) {
    for (let y = outerContour.y; y < outerContour.y + outerContour.height; y += 1) {
      for (let x = outerContour.x; x < outerContour.x + outerContour.width; x += 1) {
        const patternPosition = getRectContourPatternPosition(x, y, outerContour);

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

        const coverage = getPixelCoverage(x, y, antialias, (pointX, pointY) => {
          if (!isPointInsideRectContour(pointX, pointY, outerContour)) {
            return false;
          }

          return (
            innerContour === null ||
            !isPointInsideRectContour(pointX, pointY, innerContour)
          );
        });

        if (coverage <= 0) {
          continue;
        }

        const color = sampleFillColor(stroke.fill, outerContour, x, y);

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
    drawRectStroke(pixels, drawnPixels, outerContour, nestedStroke, antialias);
  });
}

export function drawRectStroke(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  command: RectContour,
  stroke: StrokeAppearance,
  antialias: boolean
): void {
  if (!command.cut && !command.radius) {
    drawPlainRectStroke(pixels, drawnPixels, command, stroke);
    return;
  }

  drawContourAwareRectStroke(pixels, drawnPixels, command, stroke, antialias);
}
