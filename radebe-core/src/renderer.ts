import { compileDocument } from "./compiler.js";
import {
  formatRadebeColor,
  parseRadebeColorToken,
  type RadebeRgbaColor
} from "./colors.js";
import { parseSource } from "./parser.js";

import type {
  CompiledDocument,
  CompiledDrawCommand,
  GlowAppearance,
  LinearGradientFill,
  PolygonPoint,
  RadialGradientFill,
  RectFill,
  PipelineResult,
  RenderArtifact,
  RenderResult,
  ShadowAppearance,
  SourceDocument,
  StrokeAppearance
} from "./types.js";

type RgbaColor = RadebeRgbaColor;

type RectBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type PixelGrid = (RgbaColor | null)[][];
type DrawnGrid = boolean[][];

type Layer = {
  pixels: PixelGrid;
  drawnPixels: DrawnGrid;
  width: number;
  height: number;
};

type AlphaMask = number[][];

type CoveragePredicate = (pointX: number, pointY: number) => boolean;
type PreparedGradientStop = {
  color: string;
  parsed: RgbaColor | null;
  position: number;
};

const ANTIALIAS_SAMPLE_GRID_SIZE = 4;
const ANTIALIAS_SAMPLE_COUNT =
  ANTIALIAS_SAMPLE_GRID_SIZE * ANTIALIAS_SAMPLE_GRID_SIZE;
const ANTIALIAS_SAMPLE_OFFSETS = Array.from(
  { length: ANTIALIAS_SAMPLE_COUNT },
  (_, index) => ({
    x:
      (index % ANTIALIAS_SAMPLE_GRID_SIZE + 0.5) /
      ANTIALIAS_SAMPLE_GRID_SIZE,
    y:
      (Math.floor(index / ANTIALIAS_SAMPLE_GRID_SIZE) + 0.5) /
      ANTIALIAS_SAMPLE_GRID_SIZE
  })
);
const parsedColorCache = new Map<string, RgbaColor | null>();
const gradientStopCache = new WeakMap<
  { color: string; position: number }[],
  PreparedGradientStop[]
>();

function clampUnit(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function parseColor(color: string): RgbaColor | null {
  if (!parsedColorCache.has(color)) {
    parsedColorCache.set(color, parseRadebeColorToken(color));
  }

  return parsedColorCache.get(color) ?? null;
}

function blendColors(
  destination: RgbaColor | null,
  source: RgbaColor
): RgbaColor {
  if (destination === null) {
    return { ...source };
  }

  const outputAlpha = source.a + destination.a * (1 - source.a);

  if (outputAlpha === 0) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  return {
    r:
      (source.r * source.a +
        destination.r * destination.a * (1 - source.a)) /
      outputAlpha,
    g:
      (source.g * source.a +
        destination.g * destination.a * (1 - source.a)) /
      outputAlpha,
    b:
      (source.b * source.a +
        destination.b * destination.a * (1 - source.a)) /
      outputAlpha,
    a: outputAlpha
  };
}

function formatColor(color: RgbaColor | null): string | null {
  if (color === null || color.a <= 0) {
    return null;
  }

  return formatRadebeColor(color);
}

function withOpacity(color: RgbaColor, opacity: number): RgbaColor {
  return {
    ...color,
    a: clampUnit(color.a * opacity)
  };
}

function createLayer(
  width: number,
  height: number,
  backgroundColor: RgbaColor | null = null
): Layer {
  return {
    width,
    height,
    pixels: Array.from({ length: height }, () =>
      Array.from({ length: width }, () =>
        backgroundColor === null ? null : { ...backgroundColor }
      )
    ),
    drawnPixels: Array.from({ length: height }, () =>
      Array.from({ length: width }, () => false)
    )
  };
}

function setPixel(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  x: number,
  y: number,
  color: string | RgbaColor,
  opacity = 1
): void {
  if (y < 0 || y >= pixels.length) {
    return;
  }

  if (x < 0 || x >= pixels[y]!.length) {
    return;
  }

  const parsed = typeof color === "string" ? parseColor(color) : color;

  if (parsed === null) {
    return;
  }

  pixels[y]![x] = blendColors(pixels[y]![x] ?? null, withOpacity(parsed, opacity));
  drawnPixels[y]![x] = true;
}

function compositeLayer(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  sourceLayer: Layer
): void {
  for (let y = 0; y < sourceLayer.height; y += 1) {
    for (let x = 0; x < sourceLayer.width; x += 1) {
      const color = sourceLayer.pixels[y]![x];

      if (color === null || color.a <= 0) {
        continue;
      }

      pixels[y]![x] = blendColors(pixels[y]![x] ?? null, color);
      drawnPixels[y]![x] = true;
    }
  }
}

function buildAlphaMask(pixels: PixelGrid): AlphaMask {
  return pixels.map((row) => row.map((pixel) => pixel?.a ?? 0));
}

function getMaskAlpha(mask: AlphaMask, x: number, y: number): number {
  if (y < 0 || y >= mask.length) {
    return 0;
  }

  const row = mask[y];

  if (!row || x < 0 || x >= row.length) {
    return 0;
  }

  return row[x] ?? 0;
}

function getAlphaMaskBounds(mask: AlphaMask): RectBounds | null {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  mask.forEach((row, y) => {
    row.forEach((alpha, x) => {
      if (alpha <= 0) {
        return;
      }

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });
  });

  if (!Number.isFinite(minX)) {
    return null;
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1
  };
}

function expandBounds(bounds: RectBounds, amount: number): RectBounds {
  return {
    x: bounds.x - amount,
    y: bounds.y - amount,
    width: bounds.width + amount * 2,
    height: bounds.height + amount * 2
  };
}

function offsetAndExpandBounds(
  bounds: RectBounds,
  offsetX: number,
  offsetY: number,
  expansion: number
): RectBounds {
  const minX = Math.floor(bounds.x + offsetX - expansion);
  const minY = Math.floor(bounds.y + offsetY - expansion);
  const maxX = Math.ceil(bounds.x + bounds.width - 1 + offsetX + expansion);
  const maxY = Math.ceil(bounds.y + bounds.height - 1 + offsetY + expansion);

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1
  };
}

function getShadowBlurRadius(shadow: ShadowAppearance): number {
  return Math.max(Math.round(shadow.blur ?? 0), 0);
}

function getGlowBlurRadius(glow: GlowAppearance): number {
  return Math.max(Math.round(glow.blur ?? 0), 0);
}

function createBoxBlurredAlphaSampler(
  drawBounds: RectBounds,
  radius: number,
  sampleAlpha: (sampleX: number, sampleY: number) => number
): (x: number, y: number) => number {
  if (radius <= 0) {
    return sampleAlpha;
  }

  const kernelSize = radius * 2 + 1;
  const kernelArea = kernelSize * kernelSize;
  const sampleBounds = expandBounds(drawBounds, radius);
  const integralStride = sampleBounds.width + 1;
  const integral = Array.from(
    { length: (sampleBounds.height + 1) * integralStride },
    () => 0
  );

  for (let sampleY = 0; sampleY < sampleBounds.height; sampleY += 1) {
    let rowAlpha = 0;
    const integralY = sampleY + 1;

    for (let sampleX = 0; sampleX < sampleBounds.width; sampleX += 1) {
      const integralX = sampleX + 1;

      rowAlpha += sampleAlpha(
        sampleBounds.x + sampleX,
        sampleBounds.y + sampleY
      );
      integral[integralY * integralStride + integralX] =
        integral[(integralY - 1) * integralStride + integralX]! + rowAlpha;
    }
  }

  return (x, y) => {
    const left = x - radius - sampleBounds.x;
    const top = y - radius - sampleBounds.y;
    const right = left + kernelSize;
    const bottom = top + kernelSize;
    const alpha =
      integral[bottom * integralStride + right]! -
      integral[top * integralStride + right]! -
      integral[bottom * integralStride + left]! +
      integral[top * integralStride + left]!;

    return alpha / kernelArea;
  };
}

function drawGlowFromAlpha(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  glow: GlowAppearance,
  drawBounds: RectBounds,
  fillBounds: RectBounds,
  sampleSourceAlpha: (sampleX: number, sampleY: number) => number,
  sampleGlowBaseAlpha: (sampleX: number, sampleY: number) => number
): void {
  if (glow.fill === null) {
    return;
  }

  const blurRadius = getGlowBlurRadius(glow);
  const sampleSoftenedAlpha = createBoxBlurredAlphaSampler(
    drawBounds,
    blurRadius,
    sampleGlowBaseAlpha
  );

  for (let y = drawBounds.y; y < drawBounds.y + drawBounds.height; y += 1) {
    for (let x = drawBounds.x; x < drawBounds.x + drawBounds.width; x += 1) {
      const sourceAlpha = sampleSourceAlpha(x, y);
      const softenedAlpha = sampleSoftenedAlpha(x, y);
      const coverage =
        glow.mode === "outer"
          ? Math.max(softenedAlpha - sourceAlpha, 0)
          : Math.max(sourceAlpha - softenedAlpha, 0);

      if (coverage <= 0) {
        continue;
      }

      const color = sampleFillColor(glow.fill, fillBounds, x, y);

      if (color !== null) {
        setPixel(
          pixels,
          drawnPixels,
          x,
          y,
          color,
          glow.alpha * glow.fill.alpha * coverage
        );
      }
    }
  }
}

function sampleMaskAlpha(mask: AlphaMask, x: number, y: number, spread: number): number {
  if (spread === 0) {
    return getMaskAlpha(mask, x, y);
  }

  const radius = Math.ceil(Math.abs(spread));

  if (spread > 0) {
    let alpha = 0;

    for (let sampleY = y - radius; sampleY <= y + radius; sampleY += 1) {
      for (let sampleX = x - radius; sampleX <= x + radius; sampleX += 1) {
        alpha = Math.max(alpha, getMaskAlpha(mask, sampleX, sampleY));
      }
    }

    return alpha;
  }

  let alpha = 1;

  for (let sampleY = y - radius; sampleY <= y + radius; sampleY += 1) {
    for (let sampleX = x - radius; sampleX <= x + radius; sampleX += 1) {
      alpha = Math.min(alpha, getMaskAlpha(mask, sampleX, sampleY));

      if (alpha <= 0) {
        return 0;
      }
    }
  }

  return alpha;
}

function buildSpreadMask(mask: AlphaMask, spread: number): AlphaMask {
  if (spread <= 0) {
    return mask;
  }

  return mask.map((row, y) =>
    row.map((_, x) => sampleMaskAlpha(mask, x, y, spread))
  );
}

function getPixelCoverage(
  x: number,
  y: number,
  antialias: boolean,
  isCovered: CoveragePredicate
): number {
  if (!antialias) {
    return isCovered(x + 0.5, y + 0.5) ? 1 : 0;
  }

  let coveredSamples = 0;

  for (const offset of ANTIALIAS_SAMPLE_OFFSETS) {
    if (isCovered(x + offset.x, y + offset.y)) {
      coveredSamples += 1;
    }
  }

  return coveredSamples / ANTIALIAS_SAMPLE_COUNT;
}

function sampleFillColor(
  fill: RectFill,
  bounds: RectBounds,
  x: number,
  y: number
): RgbaColor | null {
  if (fill.kind === "solid") {
    return parseColor(fill.color);
  }

  if (fill.kind === "gradient-linear") {
    return sampleGradientStops(
      fill.stops,
      resolveLinearGradientPosition(fill, bounds, x, y)
    );
  }

  return sampleGradientStops(
    fill.stops,
    resolveRadialGradientPosition(fill, bounds, x, y)
  );
}

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

function isPointInsidePolygon(
  pointX: number,
  pointY: number,
  polygon: Array<{ x: number; y: number }>
): boolean {
  let inside = false;

  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const currentPoint = polygon[index]!;
    const previousPoint = polygon[previous]!;
    const intersects =
      currentPoint.y > pointY !== previousPoint.y > pointY &&
      pointX <
        ((previousPoint.x - currentPoint.x) * (pointY - currentPoint.y)) /
          (previousPoint.y - currentPoint.y) +
          currentPoint.x;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function buildCutPolygon(
  rect: Pick<
    Extract<CompiledDrawCommand, { kind: "rect" }>,
    "x" | "y" | "width" | "height" | "cut"
  >
): Array<{ x: number; y: number }> | null {
  if (!rect.cut) {
    return null;
  }

  return [
    { x: rect.x + rect.cut.topLeft, y: rect.y },
    { x: rect.x + rect.width - rect.cut.topRight, y: rect.y },
    { x: rect.x + rect.width, y: rect.y + rect.cut.topRight },
    { x: rect.x + rect.width, y: rect.y + rect.height - rect.cut.bottomRight },
    { x: rect.x + rect.width - rect.cut.bottomRight, y: rect.y + rect.height },
    { x: rect.x + rect.cut.bottomLeft, y: rect.y + rect.height },
    { x: rect.x, y: rect.y + rect.height - rect.cut.bottomLeft },
    { x: rect.x, y: rect.y + rect.cut.topLeft }
  ];
}

type RectContour = Pick<
  Extract<CompiledDrawCommand, { kind: "rect" }>,
  "x" | "y" | "width" | "height" | "cut" | "radius"
>;

function isPointInsideRoundedRect(
  pointX: number,
  pointY: number,
  rect: Pick<RectContour, "x" | "y" | "width" | "height" | "radius">
): boolean {
  const right = rect.x + rect.width;
  const bottom = rect.y + rect.height;

  if (
    pointX < rect.x ||
    pointX > right ||
    pointY < rect.y ||
    pointY > bottom
  ) {
    return false;
  }

  const radius = rect.radius?.value ?? 0;

  if (radius <= 0) {
    return true;
  }

  const innerLeft = rect.x + radius;
  const innerRight = rect.x + rect.width - radius;
  const innerTop = rect.y + radius;
  const innerBottom = rect.y + rect.height - radius;

  if (pointX >= innerLeft && pointX <= innerRight) {
    return true;
  }

  if (pointY >= innerTop && pointY <= innerBottom) {
    return true;
  }

  const cornerCenterX = pointX < innerLeft ? innerLeft : innerRight;
  const cornerCenterY = pointY < innerTop ? innerTop : innerBottom;

  return Math.hypot(pointX - cornerCenterX, pointY - cornerCenterY) <= radius;
}

function isPointInsideRectContour(
  pointX: number,
  pointY: number,
  rect: RectContour
): boolean {
  const polygon = buildCutPolygon(rect);

  if (polygon !== null && !isPointInsidePolygon(pointX, pointY, polygon)) {
    return false;
  }

  return isPointInsideRoundedRect(pointX, pointY, rect);
}

function normalizeRectCut(
  cut: NonNullable<RectContour["cut"]>,
  width: number,
  height: number
): NonNullable<RectContour["cut"]> {
  let topLeft = Math.max(0, Math.min(cut.topLeft, width - 1, height - 1));
  let topRight = Math.max(0, Math.min(cut.topRight, width - 1, height - 1));
  let bottomRight = Math.max(0, Math.min(cut.bottomRight, width - 1, height - 1));
  let bottomLeft = Math.max(0, Math.min(cut.bottomLeft, width - 1, height - 1));

  const horizontalLimit = Math.max(width - 1, 0);
  const verticalLimit = Math.max(height - 1, 0);

  const topSum = topLeft + topRight;
  if (topSum > horizontalLimit && topSum > 0) {
    const scale = horizontalLimit / topSum;
    topLeft = Math.floor(topLeft * scale);
    topRight = Math.floor(topRight * scale);
  }

  const bottomSum = bottomLeft + bottomRight;
  if (bottomSum > horizontalLimit && bottomSum > 0) {
    const scale = horizontalLimit / bottomSum;
    bottomLeft = Math.floor(bottomLeft * scale);
    bottomRight = Math.floor(bottomRight * scale);
  }

  const leftSum = topLeft + bottomLeft;
  if (leftSum > verticalLimit && leftSum > 0) {
    const scale = verticalLimit / leftSum;
    topLeft = Math.floor(topLeft * scale);
    bottomLeft = Math.floor(bottomLeft * scale);
  }

  const rightSum = topRight + bottomRight;
  if (rightSum > verticalLimit && rightSum > 0) {
    const scale = verticalLimit / rightSum;
    topRight = Math.floor(topRight * scale);
    bottomRight = Math.floor(bottomRight * scale);
  }

  return {
    topLeft,
    topRight,
    bottomRight,
    bottomLeft
  };
}

function buildAdjustedRectContour(
  rect: RectContour,
  delta: number
): RectContour | null {
  const x = rect.x - delta;
  const y = rect.y - delta;
  const width = rect.width + delta * 2;
  const height = rect.height + delta * 2;

  if (width < 1 || height < 1) {
    return null;
  }

  let cut: RectContour["cut"] | undefined;
  if (rect.cut) {
    cut = normalizeRectCut(
      {
        topLeft: Math.max(rect.cut.topLeft + delta, 0),
        topRight: Math.max(rect.cut.topRight + delta, 0),
        bottomRight: Math.max(rect.cut.bottomRight + delta, 0),
        bottomLeft: Math.max(rect.cut.bottomLeft + delta, 0)
      },
      width,
      height
    );
  }

  let radius: RectContour["radius"] | undefined;
  if (rect.radius) {
    radius = {
      value: Math.max(
        0,
        Math.min(rect.radius.value + delta, Math.floor(Math.min(width, height) / 2))
      )
    };
  }

  return {
    x,
    y,
    width,
    height,
    ...(cut ? { cut } : {}),
    ...(radius && radius.value > 0 ? { radius } : {})
  };
}

function getRectContourPatternPosition(
  x: number,
  y: number,
  rect: Pick<RectContour, "x" | "y" | "width" | "height">
): number {
  const leftDistance = x - rect.x;
  const topDistance = y - rect.y;
  const rightDistance = rect.x + rect.width - 1 - x;
  const bottomDistance = rect.y + rect.height - 1 - y;
  const minimum = Math.min(leftDistance, topDistance, rightDistance, bottomDistance);

  if (minimum === topDistance) {
    return x - rect.x;
  }

  if (minimum === rightDistance) {
    return rect.width + (y - rect.y);
  }

  if (minimum === bottomDistance) {
    return rect.width + rect.height + (rect.x + rect.width - 1 - x);
  }

  return rect.width * 2 + rect.height + (rect.y + rect.height - 1 - y);
}

function getPreparedGradientStops(
  stops: { color: string; position: number }[]
): PreparedGradientStop[] {
  const cachedStops = gradientStopCache.get(stops);

  if (cachedStops) {
    return cachedStops;
  }

  const preparedStops = [...stops]
    .sort((left, right) => left.position - right.position)
    .map((stop) => ({
      ...stop,
      parsed: parseColor(stop.color)
    }));

  gradientStopCache.set(stops, preparedStops);
  return preparedStops;
}

function sampleGradientStops(
  stops: { color: string; position: number }[],
  position: number
): RgbaColor | null {
  const sortedStops = getPreparedGradientStops(stops);
  const clampedPosition = clampUnit(position);

  if (clampedPosition <= sortedStops[0]!.position) {
    return sortedStops[0]!.parsed;
  }

  if (clampedPosition >= sortedStops[sortedStops.length - 1]!.position) {
    return sortedStops[sortedStops.length - 1]!.parsed;
  }

  for (let index = 0; index < sortedStops.length - 1; index += 1) {
    const current = sortedStops[index]!;
    const next = sortedStops[index + 1]!;

    if (
      clampedPosition >= current.position &&
      clampedPosition <= next.position
    ) {
      if (current.parsed === null || next.parsed === null) {
        return current.parsed;
      }

      const interval =
        next.position === current.position
          ? 0
          : (clampedPosition - current.position) /
            (next.position - current.position);
      return {
        r: lerp(current.parsed.r, next.parsed.r, interval),
        g: lerp(current.parsed.g, next.parsed.g, interval),
        b: lerp(current.parsed.b, next.parsed.b, interval),
        a: lerp(current.parsed.a, next.parsed.a, interval)
      };
    }
  }

  return sortedStops[sortedStops.length - 1]!.parsed;
}

function resolveLinearGradientPosition(
  fill: LinearGradientFill,
  command: Pick<Extract<CompiledDrawCommand, { kind: "rect" }>, "x" | "y" | "width" | "height">,
  x: number,
  y: number
): number {
  const normalizedX =
    command.width <= 1 ? 0.5 : (x - command.x) / (command.width - 1);
  const normalizedY =
    command.height <= 1 ? 0.5 : (y - command.y) / (command.height - 1);
  const angleRadians =
    fill.angle === null
      ? fill.direction === "vertical"
        ? Math.PI / 2
        : 0
      : (fill.angle * Math.PI) / 180;
  const directionX = Math.cos(angleRadians);
  const directionY = Math.sin(angleRadians);
  const corners = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 }
  ];
  const cornerProjections = corners.map(
    (corner) => corner.x * directionX + corner.y * directionY
  );
  const minProjection = Math.min(...cornerProjections);
  const maxProjection = Math.max(...cornerProjections);
  const projection = normalizedX * directionX + normalizedY * directionY;

  if (maxProjection === minProjection) {
    return 0;
  }

  return (projection - minProjection) / (maxProjection - minProjection);
}

function resolveRadialGradientPosition(
  fill: RadialGradientFill,
  command: Pick<Extract<CompiledDrawCommand, { kind: "rect" }>, "x" | "y" | "width" | "height">,
  x: number,
  y: number
): number {
  const normalizedX =
    command.width <= 1 ? 0.5 : (x - command.x) / (command.width - 1);
  const normalizedY =
    command.height <= 1 ? 0.5 : (y - command.y) / (command.height - 1);
  const deltaX = normalizedX - fill.centerX;
  const deltaY = normalizedY - fill.centerY;
  const corners = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 }
  ];
  const maxCornerDistance = Math.max(
    ...corners.map((corner) =>
      Math.hypot(corner.x - fill.centerX, corner.y - fill.centerY)
    )
  );

  if (maxCornerDistance === 0) {
    return 0;
  }

  return Math.hypot(deltaX, deltaY) / (maxCornerDistance * fill.radius);
}

function drawRectFill(
  pixels: (RgbaColor | null)[][],
  drawnPixels: boolean[][],
  command: Pick<
    Extract<CompiledDrawCommand, { kind: "rect" }>,
    "x" | "y" | "width" | "height" | "cut" | "radius"
  >,
  fill: RectFill,
  antialias: boolean
): void {
  const polygon = buildCutPolygon(command);

  for (let y = command.y; y < command.y + command.height; y += 1) {
    for (let x = command.x; x < command.x + command.width; x += 1) {
      const coverage = getPixelCoverage(x, y, antialias, (pointX, pointY) => {
        if (polygon !== null && !isPointInsidePolygon(pointX, pointY, polygon)) {
          return false;
        }

        return isPointInsideRoundedRect(pointX, pointY, command);
      });

      if (coverage <= 0) {
        continue;
      }

      const color = sampleFillColor(fill, command, x, y);

      if (color !== null) {
        setPixel(pixels, drawnPixels, x, y, color, fill.alpha * coverage);
      }
    }
  }
}

function drawCircleFill(
  pixels: (RgbaColor | null)[][],
  drawnPixels: boolean[][],
  command: Pick<Extract<CompiledDrawCommand, { kind: "circle" }>, "x" | "y" | "radius">,
  fill: RectFill,
  antialias: boolean
): void {
  const bounds = {
    x: command.x - command.radius,
    y: command.y - command.radius,
    width: command.radius * 2 + 1,
    height: command.radius * 2 + 1
  };

  for (let y = bounds.y; y < bounds.y + bounds.height; y += 1) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x += 1) {
      const centerX = command.x + 0.5;
      const centerY = command.y + 0.5;
      const coverage = getPixelCoverage(x, y, antialias, (pointX, pointY) =>
        Math.hypot(pointX - centerX, pointY - centerY) <= command.radius
      );

      if (coverage <= 0) {
        continue;
      }

      const color = sampleFillColor(fill, bounds, x, y);

      if (color !== null) {
        setPixel(pixels, drawnPixels, x, y, color, fill.alpha * coverage);
      }
    }
  }
}

function getPolygonBounds(
  points: PolygonPoint[]
): { x: number; y: number; width: number; height: number } {
  const xValues = points.map((point) => point.x);
  const yValues = points.map((point) => point.y);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);

  return {
    x: minX,
    y: minY,
    width: Math.max(maxX - minX, 1),
    height: Math.max(maxY - minY, 1)
  };
}

type PolygonStrokeBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
  inner: number;
  outer: number;
};

type ClosestPolygonEdgeSample = {
  distance: number;
  perimeterPosition: number;
};

function getPolygonStrokeBounds(
  points: PolygonPoint[],
  stroke: StrokeAppearance
): PolygonStrokeBounds {
  const bounds = getPolygonBounds(points);
  const { inner, outer } = resolveStrokeExtents(stroke.width, stroke.align);

  return {
    x: bounds.x - outer,
    y: bounds.y - outer,
    width: bounds.width + outer * 2,
    height: bounds.height + outer * 2,
    inner,
    outer
  };
}

function getPathStrokeBounds(
  points: PolygonPoint[],
  stroke: StrokeAppearance
): { x: number; y: number; width: number; height: number; radius: number } {
  const bounds = getPolygonBounds(points);
  const radius = Math.max(stroke.width / 2, 0.5);
  const margin = Math.ceil(radius);

  return {
    x: bounds.x - margin,
    y: bounds.y - margin,
    width: bounds.width + margin * 2,
    height: bounds.height + margin * 2,
    radius
  };
}

function getDistanceToSegment(
  pointX: number,
  pointY: number,
  start: PolygonPoint,
  end: PolygonPoint
): { distance: number; projection: number } {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const lengthSquared = deltaX * deltaX + deltaY * deltaY;

  if (lengthSquared === 0) {
    return {
      distance: Math.hypot(pointX - start.x, pointY - start.y),
      projection: 0
    };
  }

  const projection = clampUnit(
    ((pointX - start.x) * deltaX + (pointY - start.y) * deltaY) / lengthSquared
  );
  const closestX = start.x + deltaX * projection;
  const closestY = start.y + deltaY * projection;

  return {
    distance: Math.hypot(pointX - closestX, pointY - closestY),
    projection
  };
}

function getClosestPolygonEdgeSample(
  pointX: number,
  pointY: number,
  points: PolygonPoint[]
): ClosestPolygonEdgeSample {
  let bestDistance = Number.POSITIVE_INFINITY;
  let bestPerimeterPosition = 0;
  let traversedLength = 0;

  for (let index = 0; index < points.length; index += 1) {
    const start = points[index]!;
    const end = points[(index + 1) % points.length]!;
    const segmentLength = Math.hypot(end.x - start.x, end.y - start.y);
    const sample = getDistanceToSegment(pointX, pointY, start, end);

    if (sample.distance < bestDistance) {
      bestDistance = sample.distance;
      bestPerimeterPosition = traversedLength + segmentLength * sample.projection;
    }

    traversedLength += segmentLength;
  }

  return {
    distance: bestDistance,
    perimeterPosition: Math.round(bestPerimeterPosition)
  };
}

function getClosestPathSegmentSample(
  pointX: number,
  pointY: number,
  points: PolygonPoint[]
): ClosestPolygonEdgeSample {
  let bestDistance = Number.POSITIVE_INFINITY;
  let bestPerimeterPosition = 0;
  let traversedLength = 0;

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index]!;
    const end = points[index + 1]!;
    const segmentLength = Math.hypot(end.x - start.x, end.y - start.y);
    const sample = getDistanceToSegment(pointX, pointY, start, end);

    if (sample.distance < bestDistance) {
      bestDistance = sample.distance;
      bestPerimeterPosition = traversedLength + segmentLength * sample.projection;
    }

    traversedLength += segmentLength;
  }

  return {
    distance: bestDistance,
    perimeterPosition: Math.round(bestPerimeterPosition)
  };
}

function drawPolygonFill(
  pixels: (RgbaColor | null)[][],
  drawnPixels: boolean[][],
  command: Pick<Extract<CompiledDrawCommand, { kind: "polygon" }>, "points">,
  fill: RectFill,
  antialias: boolean
): void {
  const bounds = getPolygonBounds(command.points);

  for (let y = bounds.y; y < bounds.y + bounds.height; y += 1) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x += 1) {
      const coverage = getPixelCoverage(x, y, antialias, (pointX, pointY) =>
        isPointInsidePolygon(pointX, pointY, command.points)
      );

      if (coverage <= 0) {
        continue;
      }

      const color = sampleFillColor(fill, bounds, x, y);

      if (color !== null) {
        setPixel(pixels, drawnPixels, x, y, color, fill.alpha * coverage);
      }
    }
  }
}

function drawPolygonShadow(
  pixels: (RgbaColor | null)[][],
  drawnPixels: boolean[][],
  command: Pick<Extract<CompiledDrawCommand, { kind: "polygon" }>, "points">,
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

function drawPolygonGlow(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  command: Pick<Extract<CompiledDrawCommand, { kind: "polygon" }>, "points">,
  glow: GlowAppearance,
  antialias: boolean
): void {
  if (glow.fill === null) {
    return;
  }

  const sourceBounds = getPolygonBounds(command.points);
  const spread = Math.max(glow.spread, 0);
  const blurRadius = getGlowBlurRadius(glow);
  const glowBounds =
    glow.mode === "outer" ? expandBounds(sourceBounds, spread) : sourceBounds;
  const drawBounds =
    glow.mode === "outer" ? expandBounds(glowBounds, blurRadius) : sourceBounds;

  const sampleSourceAlpha = (sampleX: number, sampleY: number) =>
    getPixelCoverage(sampleX, sampleY, antialias, (pointX, pointY) =>
      isPointInsidePolygon(pointX, pointY, command.points)
    );
  const sampleGlowBaseAlpha = (sampleX: number, sampleY: number) =>
    getPixelCoverage(sampleX, sampleY, antialias, (pointX, pointY) => {
      const inside = isPointInsidePolygon(pointX, pointY, command.points);
      const closestEdge = getClosestPolygonEdgeSample(
        pointX,
        pointY,
        command.points
      );

      if (glow.mode === "outer") {
        return inside || closestEdge.distance <= spread;
      }

      return inside && closestEdge.distance > spread;
    });

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

function drawPolygonStroke(
  pixels: (RgbaColor | null)[][],
  drawnPixels: boolean[][],
  command: Pick<Extract<CompiledDrawCommand, { kind: "polygon" }>, "points">,
  stroke: StrokeAppearance,
  antialias: boolean
): void {
  const bounds = getPolygonStrokeBounds(command.points, stroke);

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
          const inInnerBand =
            inside && bounds.inner > 0 && closestEdge.distance <= bounds.inner;
          const inOuterBand =
            !inside && bounds.outer > 0 && closestEdge.distance <= bounds.outer;

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
    drawPolygonStroke(pixels, drawnPixels, command, nestedStroke, antialias);
  });
}

function drawPathStroke(
  pixels: (RgbaColor | null)[][],
  drawnPixels: boolean[][],
  command: Pick<Extract<CompiledDrawCommand, { kind: "path" }>, "points">,
  stroke: StrokeAppearance,
  antialias: boolean
): void {
  const bounds = getPathStrokeBounds(command.points, stroke);

  if (stroke.fill !== null) {
    for (let y = bounds.y; y < bounds.y + bounds.height; y += 1) {
      for (let x = bounds.x; x < bounds.x + bounds.width; x += 1) {
        const coverage = getPixelCoverage(x, y, antialias, (pointX, pointY) => {
          const closestSegment = getClosestPathSegmentSample(
            pointX,
            pointY,
            command.points
          );

          return (
            closestSegment.distance <= bounds.radius &&
            getStrokePatternState(
              stroke.style,
              closestSegment.perimeterPosition,
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
    drawPathStroke(pixels, drawnPixels, command, nestedStroke, antialias);
  });
}

function getCircleStrokeBounds(
  command: Pick<Extract<CompiledDrawCommand, { kind: "circle" }>, "x" | "y" | "radius">,
  stroke: StrokeAppearance
): { x: number; y: number; width: number; height: number; innerRadius: number; outerRadius: number } {
  const { inner, outer } = resolveStrokeExtents(stroke.width, stroke.align);

  return {
    x: command.x - command.radius - outer,
    y: command.y - command.radius - outer,
    width: (command.radius + outer) * 2 + 1,
    height: (command.radius + outer) * 2 + 1,
    innerRadius: Math.max(command.radius - inner, 0),
    outerRadius: command.radius + outer
  };
}

function drawCircleShadow(
  pixels: (RgbaColor | null)[][],
  drawnPixels: boolean[][],
  command: Pick<Extract<CompiledDrawCommand, { kind: "circle" }>, "x" | "y" | "radius">,
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

function drawCircleGlow(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  command: Pick<Extract<CompiledDrawCommand, { kind: "circle" }>, "x" | "y" | "radius">,
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

function drawCircleStroke(
  pixels: (RgbaColor | null)[][],
  drawnPixels: boolean[][],
  command: Pick<Extract<CompiledDrawCommand, { kind: "circle" }>, "x" | "y" | "radius">,
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

function resolveStrokeExtents(
  width: number,
  align: "inside" | "center" | "outside"
): { inner: number; outer: number } {
  if (align === "inside") {
    return { inner: width, outer: 0 };
  }

  if (align === "outside") {
    return { inner: 0, outer: width };
  }

  const inside = Math.ceil(width / 2);
  const outside = Math.floor(width / 2);

  return {
    inner: inside,
    outer: outside
  };
}

function getStrokePatternState(
  style: "solid" | "dashed" | "dotted",
  position: number,
  strokeWidth: number,
  dashLength: number | null,
  gapLength: number | null,
  dotSpacing: number | null
): boolean {
  if (style === "solid") {
    return true;
  }

  if (style === "dashed") {
    const dash = Math.max(Math.round(dashLength ?? strokeWidth * 3), 1);
    const gap = Math.max(Math.round(gapLength ?? strokeWidth * 2), 0);
    const cycle = dash + gap;

    if (cycle <= 0) {
      return true;
    }

    return position % cycle < dash;
  }

  const dot = Math.max(strokeWidth, 1);
  const gap = Math.max(Math.round(dotSpacing ?? strokeWidth * 2), 0);
  const cycle = dot + gap;

  if (cycle <= 0) {
    return true;
  }

  return position % cycle < dot;
}

function drawStrokeRectBand(
  pixels: (RgbaColor | null)[][],
  drawnPixels: boolean[][],
  rect: { x: number; y: number; width: number; height: number },
  sampleRect: { x: number; y: number; width: number; height: number },
  fill: RectFill,
  style: "solid" | "dashed" | "dotted",
  strokeWidth: number,
  dashLength: number | null,
  gapLength: number | null,
  dotSpacing: number | null,
  opacity: number,
  axis: "x" | "y"
): void {
  for (let y = rect.y; y < rect.y + rect.height; y += 1) {
    for (let x = rect.x; x < rect.x + rect.width; x += 1) {
      const patternPosition = axis === "x" ? x - rect.x : y - rect.y;

      if (
        !getStrokePatternState(
          style,
          patternPosition,
          strokeWidth,
          dashLength,
          gapLength,
          dotSpacing
        )
      ) {
        continue;
      }

      const color =
        fill.kind === "solid"
          ? fill.color
          : fill.kind === "gradient-linear"
            ? sampleGradientStops(
                fill.stops,
                resolveLinearGradientPosition(fill, sampleRect, x, y)
              )
            : sampleGradientStops(
                fill.stops,
                resolveRadialGradientPosition(fill, sampleRect, x, y)
              );

      if (color !== null) {
        setPixel(pixels, drawnPixels, x, y, color, opacity);
      }
    }
  }
}

function buildStrokeEnvelopeRect(
  rect: Pick<RectContour, "x" | "y" | "width" | "height">,
  stroke: StrokeAppearance
): { x: number; y: number; width: number; height: number; inner: number; outer: number } {
  const { inner, outer } = resolveStrokeExtents(stroke.width, stroke.align);

  return {
    x: rect.x - outer,
    y: rect.y - outer,
    width: rect.width + outer * 2,
    height: rect.height + outer * 2,
    inner,
    outer
  };
}

function translateRectContour(
  rect: RectContour,
  offsetX: number,
  offsetY: number
): RectContour {
  return {
    ...rect,
    x: rect.x + offsetX,
    y: rect.y + offsetY
  };
}

function drawRectShadow(
  pixels: (RgbaColor | null)[][],
  drawnPixels: boolean[][],
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

function drawRectGlow(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  command: RectContour,
  glow: GlowAppearance,
  antialias: boolean
): void {
  if (glow.fill === null) {
    return;
  }

  const spread = Math.max(glow.spread, 0);
  const blurRadius = getGlowBlurRadius(glow);
  const glowContour = buildAdjustedRectContour(
    command,
    glow.mode === "outer" ? spread : -spread
  );

  if (glow.mode === "outer" && glowContour === null) {
    return;
  }

  const sourceBounds = {
    x: command.x,
    y: command.y,
    width: command.width,
    height: command.height
  };
  const glowBounds = glowContour ?? sourceBounds;
  const drawBounds =
    glow.mode === "outer" ? expandBounds(glowBounds, blurRadius) : sourceBounds;
  const sampleSourceAlpha = (sampleX: number, sampleY: number) =>
    getPixelCoverage(sampleX, sampleY, antialias, (pointX, pointY) =>
      isPointInsideRectContour(pointX, pointY, command)
    );
  const sampleGlowBaseAlpha = (sampleX: number, sampleY: number) => {
    if (glowContour === null) {
      return 0;
    }

    return getPixelCoverage(sampleX, sampleY, antialias, (pointX, pointY) =>
      isPointInsideRectContour(pointX, pointY, glowContour)
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

function drawPlainRectStroke(
  pixels: (RgbaColor | null)[][],
  drawnPixels: boolean[][],
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
  pixels: (RgbaColor | null)[][],
  drawnPixels: boolean[][],
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

function drawRectStroke(
  pixels: (RgbaColor | null)[][],
  drawnPixels: boolean[][],
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

function drawMaskFill(
  layer: Layer,
  mask: AlphaMask,
  bounds: RectBounds,
  fill: RectFill
): void {
  for (let y = bounds.y; y < bounds.y + bounds.height; y += 1) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x += 1) {
      const coverage = getMaskAlpha(mask, x, y);

      if (coverage <= 0) {
        continue;
      }

      const color = sampleFillColor(fill, bounds, x, y);

      if (color !== null) {
        setPixel(layer.pixels, layer.drawnPixels, x, y, color, fill.alpha * coverage);
      }
    }
  }
}

function drawMaskShadow(
  layer: Layer,
  mask: AlphaMask,
  bounds: RectBounds,
  shadow: ShadowAppearance
): void {
  if (shadow.fill === null) {
    return;
  }

  const blurRadius = getShadowBlurRadius(shadow);
  const expansion = Math.max(Math.ceil(Math.abs(shadow.spread)), 0);
  const shadowBounds = offsetAndExpandBounds(
    bounds,
    shadow.offsetX,
    shadow.offsetY,
    expansion
  );
  const drawBounds =
    blurRadius === 0 ? shadowBounds : expandBounds(shadowBounds, blurRadius);
  const sampleShadowAlpha = (sampleX: number, sampleY: number) => {
    const sourceX = Math.round(sampleX - shadow.offsetX);
    const sourceY = Math.round(sampleY - shadow.offsetY);

    return sampleMaskAlpha(mask, sourceX, sourceY, shadow.spread);
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
          layer.pixels,
          layer.drawnPixels,
          x,
          y,
          color,
          shadow.alpha * shadow.fill.alpha * coverage
        );
      }
    }
  }
}

function drawMaskGlow(
  layer: Layer,
  mask: AlphaMask,
  bounds: RectBounds,
  glow: GlowAppearance
): void {
  if (glow.fill === null) {
    return;
  }

  const spread = Math.max(glow.spread, 0);
  const blurRadius = getGlowBlurRadius(glow);
  const glowBounds =
    glow.mode === "outer" ? expandBounds(bounds, spread) : bounds;
  const drawBounds =
    glow.mode === "outer" ? expandBounds(glowBounds, blurRadius) : bounds;
  const sampleSourceAlpha = (sampleX: number, sampleY: number) =>
    getMaskAlpha(mask, Math.round(sampleX), Math.round(sampleY));
  const sampleGlowBaseAlpha = (sampleX: number, sampleY: number) =>
    sampleMaskAlpha(
      mask,
      Math.round(sampleX),
      Math.round(sampleY),
      glow.mode === "outer" ? spread : -spread
    );

  drawGlowFromAlpha(
    layer.pixels,
    layer.drawnPixels,
    glow,
    drawBounds,
    glowBounds,
    sampleSourceAlpha,
    sampleGlowBaseAlpha
  );
}

function drawMaskStroke(
  layer: Layer,
  mask: AlphaMask,
  bounds: RectBounds,
  stroke: StrokeAppearance
): void {
  const { inner, outer } = resolveStrokeExtents(stroke.width, stroke.align);
  const strokeBounds = expandBounds(bounds, outer);

  if (stroke.fill !== null) {
    for (let y = strokeBounds.y; y < strokeBounds.y + strokeBounds.height; y += 1) {
      for (let x = strokeBounds.x; x < strokeBounds.x + strokeBounds.width; x += 1) {
        const patternPosition = x - strokeBounds.x + (y - strokeBounds.y);

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
          outer > 0 ? sampleMaskAlpha(mask, x, y, outer) : getMaskAlpha(mask, x, y);
        const innerAlpha =
          inner > 0 ? sampleMaskAlpha(mask, x, y, -inner) : getMaskAlpha(mask, x, y);
        const coverage = Math.max(outerAlpha - innerAlpha, 0);

        if (coverage <= 0) {
          continue;
        }

        const color = sampleFillColor(stroke.fill, strokeBounds, x, y);

        if (color !== null) {
          setPixel(
            layer.pixels,
            layer.drawnPixels,
            x,
            y,
            color,
            stroke.alpha * stroke.fill.alpha * coverage
          );
        }
      }
    }
  }

  const nestedMask = buildSpreadMask(mask, outer);
  const nestedBounds = outer > 0 ? strokeBounds : bounds;

  stroke.strokes.forEach((nestedStroke) => {
    drawMaskStroke(layer, nestedMask, nestedBounds, nestedStroke);
  });
}

function groupHasPasses(command: Extract<CompiledDrawCommand, { kind: "group" }>): boolean {
  return (
    command.fills.length > 0 ||
    (command.glows?.length ?? 0) > 0 ||
    (command.shadows?.length ?? 0) > 0 ||
    command.strokes.length > 0
  );
}

function drawGroup(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  command: Extract<CompiledDrawCommand, { kind: "group" }>,
  defaultAntialias: boolean
): void {
  if (!groupHasPasses(command)) {
    command.commands.forEach((childCommand) => {
      drawCommand(pixels, drawnPixels, childCommand, defaultAntialias);
    });
    return;
  }

  const height = pixels.length;
  const width = pixels[0]?.length ?? 0;
  const childLayer = createLayer(width, height);

  command.commands.forEach((childCommand) => {
    drawCommand(
      childLayer.pixels,
      childLayer.drawnPixels,
      childCommand,
      defaultAntialias
    );
  });

  const mask = buildAlphaMask(childLayer.pixels);
  const bounds = getAlphaMaskBounds(mask);

  if (bounds === null) {
    return;
  }

  const finalLayer = createLayer(width, height);

  (command.shadows ?? []).forEach((shadow) => {
    drawMaskShadow(finalLayer, mask, bounds, shadow);
  });
  (command.glows ?? [])
    .filter((glow) => glow.mode === "outer")
    .forEach((glow) => {
      drawMaskGlow(finalLayer, mask, bounds, glow);
    });
  compositeLayer(finalLayer.pixels, finalLayer.drawnPixels, childLayer);
  command.fills.forEach((fill) => {
    drawMaskFill(finalLayer, mask, bounds, fill);
  });
  (command.glows ?? [])
    .filter((glow) => glow.mode === "inner")
    .forEach((glow) => {
      drawMaskGlow(finalLayer, mask, bounds, glow);
    });
  command.strokes.forEach((stroke) => {
    drawMaskStroke(finalLayer, mask, bounds, stroke);
  });

  compositeLayer(pixels, drawnPixels, finalLayer);
}

function applyAlphaMaskToLayer(layer: Layer, mask: AlphaMask, invert: boolean): void {
  for (let y = 0; y < layer.height; y += 1) {
    for (let x = 0; x < layer.width; x += 1) {
      const color = layer.pixels[y]![x];

      if (color === null || color.a <= 0) {
        layer.pixels[y]![x] = null;
        layer.drawnPixels[y]![x] = false;
        continue;
      }

      const maskAlpha = getMaskAlpha(mask, x, y);
      const coverage = invert ? 1 - maskAlpha : maskAlpha;

      if (coverage <= 0) {
        layer.pixels[y]![x] = null;
        layer.drawnPixels[y]![x] = false;
        continue;
      }

      layer.pixels[y]![x] = withOpacity(color, coverage);
      layer.drawnPixels[y]![x] = true;
    }
  }
}

function drawMask(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  command: Extract<CompiledDrawCommand, { kind: "mask" }>,
  defaultAntialias: boolean
): void {
  const height = pixels.length;
  const width = pixels[0]?.length ?? 0;
  const shapeLayer = createLayer(width, height);
  const contentLayer = createLayer(width, height);

  command.shapeCommands.forEach((shapeCommand) => {
    drawCommand(
      shapeLayer.pixels,
      shapeLayer.drawnPixels,
      shapeCommand,
      defaultAntialias
    );
  });

  command.contentCommands.forEach((contentCommand) => {
    drawCommand(
      contentLayer.pixels,
      contentLayer.drawnPixels,
      contentCommand,
      defaultAntialias
    );
  });

  if (command.show === "shape-only") {
    compositeLayer(pixels, drawnPixels, shapeLayer);
    return;
  }

  if (command.show === "content-only") {
    compositeLayer(pixels, drawnPixels, contentLayer);
    return;
  }

  applyAlphaMaskToLayer(contentLayer, buildAlphaMask(shapeLayer.pixels), command.invert);
  compositeLayer(pixels, drawnPixels, contentLayer);
}

function drawPixelLine(
  pixels: (RgbaColor | null)[][],
  drawnPixels: boolean[][],
  command: Pick<
    Extract<CompiledDrawCommand, { kind: "line" }>,
    "x1" | "y1" | "x2" | "y2" | "color"
  >
): void {
  let currentX = command.x1;
  let currentY = command.y1;
  const deltaX = Math.abs(command.x2 - command.x1);
  const deltaY = Math.abs(command.y2 - command.y1);
  const stepX = command.x1 < command.x2 ? 1 : -1;
  const stepY = command.y1 < command.y2 ? 1 : -1;
  let error = deltaX - deltaY;

  while (true) {
    setPixel(pixels, drawnPixels, currentX, currentY, command.color);

    if (currentX === command.x2 && currentY === command.y2) {
      break;
    }

    const doubleError = error * 2;

    if (doubleError > -deltaY) {
      error -= deltaY;
      currentX += stepX;
    }

    if (doubleError < deltaX) {
      error += deltaX;
      currentY += stepY;
    }
  }
}

function drawAntialiasedLine(
  pixels: (RgbaColor | null)[][],
  drawnPixels: boolean[][],
  command: Pick<
    Extract<CompiledDrawCommand, { kind: "line" }>,
    "x1" | "y1" | "x2" | "y2" | "color"
  >
): void {
  const bounds = {
    x: Math.min(command.x1, command.x2) - 1,
    y: Math.min(command.y1, command.y2) - 1,
    width: Math.abs(command.x2 - command.x1) + 3,
    height: Math.abs(command.y2 - command.y1) + 3
  };
  const start = { x: command.x1 + 0.5, y: command.y1 + 0.5 };
  const end = { x: command.x2 + 0.5, y: command.y2 + 0.5 };

  for (let y = bounds.y; y < bounds.y + bounds.height; y += 1) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x += 1) {
      const coverage = getPixelCoverage(x, y, true, (pointX, pointY) =>
        getDistanceToSegment(pointX, pointY, start, end).distance <= 0.5
      );

      if (coverage <= 0) {
        continue;
      }

      setPixel(pixels, drawnPixels, x, y, command.color, coverage);
    }
  }
}

function drawCommand(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  command: CompiledDrawCommand,
  defaultAntialias: boolean
): void {
  if (command.kind === "plot") {
    setPixel(pixels, drawnPixels, command.x, command.y, command.color);
    return;
  }

  if (command.kind === "rect") {
    const antialias = command.antialias ?? defaultAntialias;
    (command.shadows ?? []).forEach((shadow) => {
      drawRectShadow(pixels, drawnPixels, command, shadow, antialias);
    });
    (command.glows ?? [])
      .filter((glow) => glow.mode === "outer")
      .forEach((glow) => {
        drawRectGlow(pixels, drawnPixels, command, glow, antialias);
      });
    command.fills.forEach((fill) => {
      drawRectFill(pixels, drawnPixels, command, fill, antialias);
    });
    (command.glows ?? [])
      .filter((glow) => glow.mode === "inner")
      .forEach((glow) => {
        drawRectGlow(pixels, drawnPixels, command, glow, antialias);
      });
    command.strokes.forEach((stroke) => {
      drawRectStroke(pixels, drawnPixels, command, stroke, antialias);
    });
    return;
  }

  if (command.kind === "circle") {
    const antialias = command.antialias ?? defaultAntialias;
    (command.shadows ?? []).forEach((shadow) => {
      drawCircleShadow(pixels, drawnPixels, command, shadow, antialias);
    });
    (command.glows ?? [])
      .filter((glow) => glow.mode === "outer")
      .forEach((glow) => {
        drawCircleGlow(pixels, drawnPixels, command, glow, antialias);
      });
    command.fills.forEach((fill) => {
      drawCircleFill(pixels, drawnPixels, command, fill, antialias);
    });
    (command.glows ?? [])
      .filter((glow) => glow.mode === "inner")
      .forEach((glow) => {
        drawCircleGlow(pixels, drawnPixels, command, glow, antialias);
      });
    command.strokes.forEach((stroke) => {
      drawCircleStroke(pixels, drawnPixels, command, stroke, antialias);
    });
    return;
  }

  if (command.kind === "polygon") {
    const antialias = command.antialias ?? defaultAntialias;
    (command.shadows ?? []).forEach((shadow) => {
      drawPolygonShadow(pixels, drawnPixels, command, shadow, antialias);
    });
    (command.glows ?? [])
      .filter((glow) => glow.mode === "outer")
      .forEach((glow) => {
        drawPolygonGlow(pixels, drawnPixels, command, glow, antialias);
      });
    command.fills.forEach((fill) => {
      drawPolygonFill(pixels, drawnPixels, command, fill, antialias);
    });
    (command.glows ?? [])
      .filter((glow) => glow.mode === "inner")
      .forEach((glow) => {
        drawPolygonGlow(pixels, drawnPixels, command, glow, antialias);
      });
    command.strokes.forEach((stroke) => {
      drawPolygonStroke(pixels, drawnPixels, command, stroke, antialias);
    });
    return;
  }

  if (command.kind === "path") {
    const antialias = command.antialias ?? defaultAntialias;
    command.strokes.forEach((stroke) => {
      drawPathStroke(pixels, drawnPixels, command, stroke, antialias);
    });
    return;
  }

  if (command.kind === "group") {
    drawGroup(pixels, drawnPixels, command, defaultAntialias);
    return;
  }

  if (command.kind === "mask") {
    drawMask(pixels, drawnPixels, command, defaultAntialias);
    return;
  }

  if (command.antialias ?? defaultAntialias) {
    drawAntialiasedLine(pixels, drawnPixels, command);
    return;
  }

  drawPixelLine(pixels, drawnPixels, command);
}

function buildSpriteGridArtifact(document: CompiledDocument): RenderArtifact {
  const width = document.sprite?.width ?? 0;
  const height = document.sprite?.height ?? 0;
  const background = document.sprite?.background ?? "transparent";
  const backgroundColor = background === "transparent" ? null : parseColor(background);
  const layer = createLayer(width, height, backgroundColor);

  document.commands.forEach((command) => {
    drawCommand(
      layer.pixels,
      layer.drawnPixels,
      command,
      document.sprite?.antialias ?? false
    );
  });

  const formattedPixels = layer.pixels.map((row) =>
    row.map((pixel) => formatColor(pixel))
  );
  const rows = formattedPixels.map((row, y) =>
    row
      .map((pixel, x) => {
        if (layer.drawnPixels[y]![x]) {
          return "#";
        }

        return pixel === null ? "." : ":";
      })
      .join("")
  );

  return {
    kind: "sprite-grid",
    width,
    height,
    background,
    rows,
    pixels: formattedPixels
  };
}

export function renderDocument(document: CompiledDocument): RenderResult {
  return {
    artifact: buildSpriteGridArtifact(document),
    diagnostics: []
  };
}

export function renderSource(request: SourceDocument): PipelineResult {
  const parsed = parseSource(request);
  const compiled = compileDocument(parsed.document);
  const rendered = renderDocument(compiled.document);

  return {
    parsed: parsed.document,
    compiled: compiled.document,
    artifact: rendered.artifact,
    diagnostics: [
      ...parsed.diagnostics,
      ...compiled.diagnostics,
      ...rendered.diagnostics
    ]
  };
}
