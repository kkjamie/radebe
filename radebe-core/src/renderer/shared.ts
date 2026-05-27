import {
  formatRadebeColor,
  parseRadebeColorToken,
  type RadebeRgbaColor
} from "../colors.js";

import type {
  CompiledDrawCommand,
  GlowAppearance,
  LinearGradientFill,
  PolygonPoint,
  RadialGradientFill,
  RectFill,
  ShadowAppearance,
  StrokeAppearance
} from "../types.js";

export type RgbaColor = RadebeRgbaColor;

export type RectBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PixelGrid = (RgbaColor | null)[][];
export type DrawnGrid = boolean[][];

export type Layer = {
  pixels: PixelGrid;
  drawnPixels: DrawnGrid;
  width: number;
  height: number;
};

export type AlphaMask = number[][];

export type CoveragePredicate = (pointX: number, pointY: number) => boolean;

type PreparedGradientStop = {
  color: string;
  parsed: RgbaColor | null;
  position: number;
};

export type RectContour = Pick<
  Extract<CompiledDrawCommand, { kind: "rect" }>,
  "x" | "y" | "width" | "height" | "cut" | "radius"
>;

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

export function clampUnit(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function parseColor(color: string): RgbaColor | null {
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

export function formatColor(color: RgbaColor | null): string | null {
  if (color === null || color.a <= 0) {
    return null;
  }

  return formatRadebeColor(color);
}

export function withOpacity(color: RgbaColor, opacity: number): RgbaColor {
  return {
    ...color,
    a: clampUnit(color.a * opacity)
  };
}

export function createLayer(
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

export function setPixel(
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

export function compositeLayer(
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

export function buildAlphaMask(pixels: PixelGrid): AlphaMask {
  return pixels.map((row) => row.map((pixel) => pixel?.a ?? 0));
}

export function getMaskAlpha(mask: AlphaMask, x: number, y: number): number {
  if (y < 0 || y >= mask.length) {
    return 0;
  }

  const row = mask[y];

  if (!row || x < 0 || x >= row.length) {
    return 0;
  }

  return row[x] ?? 0;
}

export function getAlphaMaskBounds(mask: AlphaMask): RectBounds | null {
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

export function expandBounds(bounds: RectBounds, amount: number): RectBounds {
  return {
    x: bounds.x - amount,
    y: bounds.y - amount,
    width: bounds.width + amount * 2,
    height: bounds.height + amount * 2
  };
}

export function offsetAndExpandBounds(
  bounds: RectBounds,
  offsetX: number,
  offsetY: number,
  expansion: number
): RectBounds {
  const minX = Math.floor(bounds.x + offsetX - expansion);
  const minY = Math.floor(bounds.y + offsetY - expansion);
  const maxX = Math.ceil(
    bounds.x + bounds.width - 1 + offsetX + expansion
  );
  const maxY = Math.ceil(
    bounds.y + bounds.height - 1 + offsetY + expansion
  );

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1
  };
}

export function getShadowBlurRadius(shadow: ShadowAppearance): number {
  return Math.max(Math.ceil(shadow.blur), 0);
}

export function getGlowBlurRadius(glow: GlowAppearance): number {
  return Math.max(Math.ceil(glow.blur), 0);
}

export function createBoxBlurredAlphaSampler(
  drawBounds: RectBounds,
  blurRadius: number,
  sampleAlpha: (sampleX: number, sampleY: number) => number
): (x: number, y: number) => number {
  if (blurRadius <= 0) {
    return sampleAlpha;
  }

  const kernelSize = blurRadius * 2 + 1;
  const kernelArea = kernelSize * kernelSize;
  const sampleBounds = expandBounds(drawBounds, blurRadius);
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

  return (x: number, y: number) => {
    const left = x - blurRadius - sampleBounds.x;
    const top = y - blurRadius - sampleBounds.y;
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

export function drawGlowFromAlpha(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  glow: GlowAppearance,
  drawBounds: RectBounds,
  sampleBounds: RectBounds,
  sampleSourceAlpha: (sampleX: number, sampleY: number) => number,
  sampleGlowBaseAlpha: (sampleX: number, sampleY: number) => number
): void {
  if (glow.fill === null) {
    return;
  }

  const blurRadius = getGlowBlurRadius(glow);
  const sampleGlowCoverage = createBoxBlurredAlphaSampler(
    drawBounds,
    blurRadius,
    sampleGlowBaseAlpha
  );

  for (let y = drawBounds.y; y < drawBounds.y + drawBounds.height; y += 1) {
    for (let x = drawBounds.x; x < drawBounds.x + drawBounds.width; x += 1) {
      const sourceAlpha = sampleSourceAlpha(x, y);
      const blurredAlpha = sampleGlowCoverage(x, y);
      const coverage =
        glow.mode === "outer"
          ? Math.max(blurredAlpha - sourceAlpha, 0)
          : Math.max(sourceAlpha - blurredAlpha, 0);

      if (coverage <= 0) {
        continue;
      }

      const color = sampleFillColor(glow.fill, sampleBounds, x, y);

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

export function sampleMaskAlpha(
  mask: AlphaMask,
  x: number,
  y: number,
  spread: number
): number {
  if (spread === 0) {
    return getMaskAlpha(mask, x, y);
  }

  let alpha = spread > 0 ? 0 : 1;
  const radius = Math.ceil(Math.abs(spread));

  for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
    for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
      const sample = getMaskAlpha(mask, x + offsetX, y + offsetY);

      if (spread > 0) {
        alpha = Math.max(alpha, sample);
      } else {
        alpha = Math.min(alpha, sample);
      }
    }
  }

  return alpha;
}

export function buildSpreadMask(mask: AlphaMask, spread: number): AlphaMask {
  return mask.map((row, y) =>
    row.map((_, x) => sampleMaskAlpha(mask, x, y, spread))
  );
}

export function getPixelCoverage(
  x: number,
  y: number,
  antialias: boolean,
  predicate: CoveragePredicate
): number {
  if (!antialias) {
    return predicate(x + 0.5, y + 0.5) ? 1 : 0;
  }

  let coveredSamples = 0;

  for (const offset of ANTIALIAS_SAMPLE_OFFSETS) {
    if (predicate(x + offset.x, y + offset.y)) {
      coveredSamples += 1;
    }
  }

  return coveredSamples / ANTIALIAS_SAMPLE_COUNT;
}

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
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

export function sampleGradientStops(
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

export function resolveLinearGradientPosition(
  fill: LinearGradientFill,
  command: Pick<
    Extract<CompiledDrawCommand, { kind: "rect" }>,
    "x" | "y" | "width" | "height"
  >,
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

export function resolveRadialGradientPosition(
  fill: RadialGradientFill,
  command: Pick<
    Extract<CompiledDrawCommand, { kind: "rect" }>,
    "x" | "y" | "width" | "height"
  >,
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

export function sampleFillColor(
  fill: RectFill,
  bounds: Pick<RectBounds, "x" | "y" | "width" | "height">,
  x: number,
  y: number
): RgbaColor | string | null {
  if (fill.kind === "solid") {
    return fill.color;
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

export function isPointInsidePolygon(
  pointX: number,
  pointY: number,
  polygon: Array<{ x: number; y: number }>
): boolean {
  let inside = false;

  for (
    let index = 0, previous = polygon.length - 1;
    index < polygon.length;
    previous = index, index += 1
  ) {
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

export function buildCutPolygon(
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

export function isPointInsideRoundedRect(
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

export function isPointInsideRectContour(
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
  let bottomRight = Math.max(
    0,
    Math.min(cut.bottomRight, width - 1, height - 1)
  );
  let bottomLeft = Math.max(
    0,
    Math.min(cut.bottomLeft, width - 1, height - 1)
  );

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

export function buildAdjustedRectContour(
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

export function getRectContourPatternPosition(
  x: number,
  y: number,
  rect: Pick<RectContour, "x" | "y" | "width" | "height">
): number {
  const leftDistance = x - rect.x;
  const topDistance = y - rect.y;
  const rightDistance = rect.x + rect.width - 1 - x;
  const bottomDistance = rect.y + rect.height - 1 - y;
  const minimum = Math.min(
    leftDistance,
    topDistance,
    rightDistance,
    bottomDistance
  );

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

export function getPolygonBounds(points: PolygonPoint[]): RectBounds {
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

export function getPathStrokeBounds(
  points: PolygonPoint[],
  stroke: StrokeAppearance
): {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
} {
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

export function getDistanceToSegment(
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

export function getClosestPolygonEdgeSample(
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

export function getClosestPathSegmentSample(
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

function getPolygonStrokeBounds(
  points: PolygonPoint[],
  stroke: StrokeAppearance,
  baseOuterOffset = 0
): PolygonStrokeBounds {
  const bounds = getPolygonBounds(points);
  const { inner, outer } = resolveStrokeExtents(stroke.width, stroke.align);
  const outsideExtent = baseOuterOffset + outer;

  return {
    x: bounds.x - outsideExtent,
    y: bounds.y - outsideExtent,
    width: bounds.width + outsideExtent * 2,
    height: bounds.height + outsideExtent * 2,
    inner,
    outer
  };
}

export function getCircleStrokeBounds(
  command: Pick<Extract<CompiledDrawCommand, { kind: "circle" }>, "x" | "y" | "radius">,
  stroke: StrokeAppearance
): {
  x: number;
  y: number;
  width: number;
  height: number;
  innerRadius: number;
  outerRadius: number;
} {
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

export function getPolygonStrokeEnvelope(
  points: PolygonPoint[],
  stroke: StrokeAppearance,
  baseOuterOffset = 0
): PolygonStrokeBounds {
  return getPolygonStrokeBounds(points, stroke, baseOuterOffset);
}

export function resolveStrokeExtents(
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

export function getStrokePatternState(
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

export function drawStrokeRectBand(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
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

      const color = sampleFillColor(fill, sampleRect, x, y);

      if (color !== null) {
        setPixel(pixels, drawnPixels, x, y, color, opacity);
      }
    }
  }
}

export function buildStrokeEnvelopeRect(
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

export function translateRectContour(
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
