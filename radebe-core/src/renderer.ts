import { compileDocument } from "./compiler.js";
import { parseSource } from "./parser.js";

import type {
  CompiledDocument,
  CompiledDrawCommand,
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

type RgbaColor = {
  r: number;
  g: number;
  b: number;
  a: number;
};

const NAMED_COLORS: Record<string, RgbaColor> = {
  black: { r: 0, g: 0, b: 0, a: 1 },
  blue: { r: 0, g: 0, b: 255, a: 1 },
  green: { r: 0, g: 128, b: 0, a: 1 },
  red: { r: 255, g: 0, b: 0, a: 1 },
  transparent: { r: 0, g: 0, b: 0, a: 0 },
  white: { r: 255, g: 255, b: 255, a: 1 }
};

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function clampUnit(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function parseHexColor(color: string): RgbaColor | null {
  const hex = color.slice(1);

  if (hex.length === 3 || hex.length === 4) {
    const [r = "", g = "", b = "", a = "f"] = hex.split("");
    return {
      r: Number.parseInt(`${r}${r}`, 16),
      g: Number.parseInt(`${g}${g}`, 16),
      b: Number.parseInt(`${b}${b}`, 16),
      a: Number.parseInt(`${a}${a}`, 16) / 255
    };
  }

  if (hex.length === 6 || hex.length === 8) {
    const alpha = hex.length === 8 ? hex.slice(6, 8) : "ff";
    return {
      r: Number.parseInt(hex.slice(0, 2), 16),
      g: Number.parseInt(hex.slice(2, 4), 16),
      b: Number.parseInt(hex.slice(4, 6), 16),
      a: Number.parseInt(alpha, 16) / 255
    };
  }

  return null;
}

function parseColor(color: string): RgbaColor | null {
  const normalized = color.trim().toLowerCase();

  if (normalized.startsWith("#")) {
    return parseHexColor(normalized);
  }

  return NAMED_COLORS[normalized] ?? null;
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

  const r = clampByte(color.r).toString(16).padStart(2, "0");
  const g = clampByte(color.g).toString(16).padStart(2, "0");
  const b = clampByte(color.b).toString(16).padStart(2, "0");
  const alpha = clampByte(color.a * 255).toString(16).padStart(2, "0");

  return alpha === "ff" ? `#${r}${g}${b}` : `#${r}${g}${b}${alpha}`;
}

function withOpacity(color: RgbaColor, opacity: number): RgbaColor {
  return {
    ...color,
    a: clampUnit(color.a * opacity)
  };
}

function setPixel(
  pixels: (RgbaColor | null)[][],
  drawnPixels: boolean[][],
  x: number,
  y: number,
  color: string,
  opacity = 1
): void {
  if (y < 0 || y >= pixels.length) {
    return;
  }

  if (x < 0 || x >= pixels[y]!.length) {
    return;
  }

  const parsed = parseColor(color);

  if (parsed === null) {
    return;
  }

  pixels[y]![x] = blendColors(pixels[y]![x] ?? null, withOpacity(parsed, opacity));
  drawnPixels[y]![x] = true;
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

function sampleGradientStops(
  stops: { color: string; position: number }[],
  position: number
): string | null {
  const sortedStops = [...stops].sort((left, right) => left.position - right.position);
  const clampedPosition = clampUnit(position);

  if (clampedPosition <= sortedStops[0]!.position) {
    return sortedStops[0]!.color;
  }

  if (clampedPosition >= sortedStops[sortedStops.length - 1]!.position) {
    return sortedStops[sortedStops.length - 1]!.color;
  }

  for (let index = 0; index < sortedStops.length - 1; index += 1) {
    const current = sortedStops[index]!;
    const next = sortedStops[index + 1]!;

    if (
      clampedPosition >= current.position &&
      clampedPosition <= next.position
    ) {
      const currentColor = parseColor(current.color);
      const nextColor = parseColor(next.color);

      if (currentColor === null || nextColor === null) {
        return current.color;
      }

      const interval =
        next.position === current.position
          ? 0
          : (clampedPosition - current.position) /
            (next.position - current.position);
      const mixed: RgbaColor = {
        r: lerp(currentColor.r, nextColor.r, interval),
        g: lerp(currentColor.g, nextColor.g, interval),
        b: lerp(currentColor.b, nextColor.b, interval),
        a: lerp(currentColor.a, nextColor.a, interval)
      };

      return formatColor(mixed);
    }
  }

  return sortedStops[sortedStops.length - 1]!.color;
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
  fill: RectFill
): void {
  const polygon = buildCutPolygon(command);

  for (let y = command.y; y < command.y + command.height; y += 1) {
    for (let x = command.x; x < command.x + command.width; x += 1) {
      const pointX = x + 0.5;
      const pointY = y + 0.5;

      if (
        polygon !== null &&
        !isPointInsidePolygon(pointX, pointY, polygon)
      ) {
        continue;
      }

      if (!isPointInsideRoundedRect(pointX, pointY, command)) {
        continue;
      }

      const color =
        fill.kind === "solid"
          ? fill.color
          : fill.kind === "gradient-linear"
            ? sampleGradientStops(
                fill.stops,
                resolveLinearGradientPosition(fill, command, x, y)
              )
            : sampleGradientStops(
                fill.stops,
                resolveRadialGradientPosition(fill, command, x, y)
              );

      if (color !== null) {
        setPixel(pixels, drawnPixels, x, y, color, fill.alpha);
      }
    }
  }
}

function drawCircleFill(
  pixels: (RgbaColor | null)[][],
  drawnPixels: boolean[][],
  command: Pick<Extract<CompiledDrawCommand, { kind: "circle" }>, "x" | "y" | "radius">,
  fill: RectFill
): void {
  const bounds = {
    x: command.x - command.radius,
    y: command.y - command.radius,
    width: command.radius * 2 + 1,
    height: command.radius * 2 + 1
  };

  for (let y = bounds.y; y < bounds.y + bounds.height; y += 1) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x += 1) {
      const pointX = x + 0.5;
      const pointY = y + 0.5;
      const centerX = command.x + 0.5;
      const centerY = command.y + 0.5;

      if (Math.hypot(pointX - centerX, pointY - centerY) > command.radius) {
        continue;
      }

      const color =
        fill.kind === "solid"
          ? fill.color
          : fill.kind === "gradient-linear"
            ? sampleGradientStops(
                fill.stops,
                resolveLinearGradientPosition(fill, bounds, x, y)
              )
            : sampleGradientStops(
                fill.stops,
                resolveRadialGradientPosition(fill, bounds, x, y)
              );

      if (color !== null) {
        setPixel(pixels, drawnPixels, x, y, color, fill.alpha);
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
  fill: RectFill
): void {
  const bounds = getPolygonBounds(command.points);

  for (let y = bounds.y; y < bounds.y + bounds.height; y += 1) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x += 1) {
      const pointX = x + 0.5;
      const pointY = y + 0.5;

      if (!isPointInsidePolygon(pointX, pointY, command.points)) {
        continue;
      }

      const color =
        fill.kind === "solid"
          ? fill.color
          : fill.kind === "gradient-linear"
            ? sampleGradientStops(
                fill.stops,
                resolveLinearGradientPosition(fill, bounds, x, y)
              )
            : sampleGradientStops(
                fill.stops,
                resolveRadialGradientPosition(fill, bounds, x, y)
              );

      if (color !== null) {
        setPixel(pixels, drawnPixels, x, y, color, fill.alpha);
      }
    }
  }
}

function drawPolygonShadow(
  pixels: (RgbaColor | null)[][],
  drawnPixels: boolean[][],
  command: Pick<Extract<CompiledDrawCommand, { kind: "polygon" }>, "points">,
  shadow: ShadowAppearance
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

  for (let y = sampleBounds.y; y < sampleBounds.y + sampleBounds.height; y += 1) {
    for (let x = sampleBounds.x; x < sampleBounds.x + sampleBounds.width; x += 1) {
      const pointX = x + 0.5;
      const pointY = y + 0.5;
      const inside = isPointInsidePolygon(pointX, pointY, points);
      const closestEdge = getClosestPolygonEdgeSample(pointX, pointY, points);

      if (shadow.spread >= 0) {
        if (!inside && closestEdge.distance > shadow.spread) {
          continue;
        }
      } else {
        if (!inside || closestEdge.distance <= -shadow.spread) {
          continue;
        }
      }

      const color =
        shadow.fill.kind === "solid"
          ? shadow.fill.color
          : shadow.fill.kind === "gradient-linear"
            ? sampleGradientStops(
                shadow.fill.stops,
                resolveLinearGradientPosition(shadow.fill, sampleBounds, x, y)
              )
            : sampleGradientStops(
                shadow.fill.stops,
                resolveRadialGradientPosition(shadow.fill, sampleBounds, x, y)
              );

      if (color !== null) {
        setPixel(
          pixels,
          drawnPixels,
          x,
          y,
          color,
          shadow.alpha * shadow.fill.alpha
        );
      }
    }
  }
}

function drawPolygonStroke(
  pixels: (RgbaColor | null)[][],
  drawnPixels: boolean[][],
  command: Pick<Extract<CompiledDrawCommand, { kind: "polygon" }>, "points">,
  stroke: StrokeAppearance
): void {
  const bounds = getPolygonStrokeBounds(command.points, stroke);

  if (stroke.fill !== null) {
    for (let y = bounds.y; y < bounds.y + bounds.height; y += 1) {
      for (let x = bounds.x; x < bounds.x + bounds.width; x += 1) {
        const pointX = x + 0.5;
        const pointY = y + 0.5;
        const inside = isPointInsidePolygon(pointX, pointY, command.points);
        const closestEdge = getClosestPolygonEdgeSample(pointX, pointY, command.points);
        const inInnerBand = inside && bounds.inner > 0 && closestEdge.distance <= bounds.inner;
        const inOuterBand = !inside && bounds.outer > 0 && closestEdge.distance <= bounds.outer;

        if (!inInnerBand && !inOuterBand) {
          continue;
        }

        if (
          !getStrokePatternState(
            stroke.style,
            closestEdge.perimeterPosition,
            stroke.width,
            stroke.dashLength,
            stroke.gapLength,
            stroke.dotSpacing
          )
        ) {
          continue;
        }

        const color =
          stroke.fill.kind === "solid"
            ? stroke.fill.color
            : stroke.fill.kind === "gradient-linear"
              ? sampleGradientStops(
                  stroke.fill.stops,
                  resolveLinearGradientPosition(stroke.fill, bounds, x, y)
                )
              : sampleGradientStops(
                  stroke.fill.stops,
                  resolveRadialGradientPosition(stroke.fill, bounds, x, y)
                );

        if (color !== null) {
          setPixel(
            pixels,
            drawnPixels,
            x,
            y,
            color,
            stroke.alpha * stroke.fill.alpha
          );
        }
      }
    }
  }

  stroke.strokes.forEach((nestedStroke) => {
    drawPolygonStroke(pixels, drawnPixels, command, nestedStroke);
  });
}

function drawPathStroke(
  pixels: (RgbaColor | null)[][],
  drawnPixels: boolean[][],
  command: Pick<Extract<CompiledDrawCommand, { kind: "path" }>, "points">,
  stroke: StrokeAppearance
): void {
  const bounds = getPathStrokeBounds(command.points, stroke);

  if (stroke.fill !== null) {
    for (let y = bounds.y; y < bounds.y + bounds.height; y += 1) {
      for (let x = bounds.x; x < bounds.x + bounds.width; x += 1) {
        const pointX = x + 0.5;
        const pointY = y + 0.5;
        const closestSegment = getClosestPathSegmentSample(
          pointX,
          pointY,
          command.points
        );

        if (closestSegment.distance > bounds.radius) {
          continue;
        }

        if (
          !getStrokePatternState(
            stroke.style,
            closestSegment.perimeterPosition,
            stroke.width,
            stroke.dashLength,
            stroke.gapLength,
            stroke.dotSpacing
          )
        ) {
          continue;
        }

        const color =
          stroke.fill.kind === "solid"
            ? stroke.fill.color
            : stroke.fill.kind === "gradient-linear"
              ? sampleGradientStops(
                  stroke.fill.stops,
                  resolveLinearGradientPosition(stroke.fill, bounds, x, y)
                )
              : sampleGradientStops(
                  stroke.fill.stops,
                  resolveRadialGradientPosition(stroke.fill, bounds, x, y)
                );

        if (color !== null) {
          setPixel(
            pixels,
            drawnPixels,
            x,
            y,
            color,
            stroke.alpha * stroke.fill.alpha
          );
        }
      }
    }
  }

  stroke.strokes.forEach((nestedStroke) => {
    drawPathStroke(pixels, drawnPixels, command, nestedStroke);
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
  shadow: ShadowAppearance
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

  for (let y = bounds.y; y < bounds.y + bounds.height; y += 1) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x += 1) {
      const pointX = x + 0.5;
      const pointY = y + 0.5;
      const sampleCenterX = centerX + 0.5;
      const sampleCenterY = centerY + 0.5;

      if (Math.hypot(pointX - sampleCenterX, pointY - sampleCenterY) > radius) {
        continue;
      }

      const color =
        shadow.fill.kind === "solid"
          ? shadow.fill.color
          : shadow.fill.kind === "gradient-linear"
            ? sampleGradientStops(
                shadow.fill.stops,
                resolveLinearGradientPosition(shadow.fill, bounds, x, y)
              )
            : sampleGradientStops(
                shadow.fill.stops,
                resolveRadialGradientPosition(shadow.fill, bounds, x, y)
              );

      if (color !== null) {
        setPixel(
          pixels,
          drawnPixels,
          x,
          y,
          color,
          shadow.alpha * shadow.fill.alpha
        );
      }
    }
  }
}

function drawCircleStroke(
  pixels: (RgbaColor | null)[][],
  drawnPixels: boolean[][],
  command: Pick<Extract<CompiledDrawCommand, { kind: "circle" }>, "x" | "y" | "radius">,
  stroke: StrokeAppearance
): void {
  const bounds = getCircleStrokeBounds(command, stroke);
  const centerX = command.x + 0.5;
  const centerY = command.y + 0.5;
  const averageRadius = (bounds.innerRadius + bounds.outerRadius) / 2;
  const circumference = Math.max(1, Math.round(2 * Math.PI * averageRadius));

  if (stroke.fill !== null) {
    for (let y = bounds.y; y < bounds.y + bounds.height; y += 1) {
      for (let x = bounds.x; x < bounds.x + bounds.width; x += 1) {
        const pointX = x + 0.5;
        const pointY = y + 0.5;
        const distance = Math.hypot(pointX - centerX, pointY - centerY);

        if (distance > bounds.outerRadius || distance <= bounds.innerRadius) {
          continue;
        }

        const angle = Math.atan2(pointY - centerY, pointX - centerX);
        const normalizedAngle = angle < 0 ? angle + Math.PI * 2 : angle;
        const patternPosition = Math.round(
          (normalizedAngle / (Math.PI * 2)) * circumference
        );

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

        const color =
          stroke.fill.kind === "solid"
            ? stroke.fill.color
            : stroke.fill.kind === "gradient-linear"
              ? sampleGradientStops(
                  stroke.fill.stops,
                  resolveLinearGradientPosition(stroke.fill, bounds, x, y)
                )
              : sampleGradientStops(
                  stroke.fill.stops,
                  resolveRadialGradientPosition(stroke.fill, bounds, x, y)
                );

        if (color !== null) {
          setPixel(
            pixels,
            drawnPixels,
            x,
            y,
            color,
            stroke.alpha * stroke.fill.alpha
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
      nestedStroke
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
  shadow: ShadowAppearance
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

  for (let y = shadowContour.y; y < shadowContour.y + shadowContour.height; y += 1) {
    for (let x = shadowContour.x; x < shadowContour.x + shadowContour.width; x += 1) {
      const pointX = x + 0.5;
      const pointY = y + 0.5;

      if (!isPointInsideRectContour(pointX, pointY, shadowContour)) {
        continue;
      }

      const color =
        shadow.fill.kind === "solid"
          ? shadow.fill.color
          : shadow.fill.kind === "gradient-linear"
            ? sampleGradientStops(
                shadow.fill.stops,
                resolveLinearGradientPosition(shadow.fill, shadowContour, x, y)
              )
            : sampleGradientStops(
                shadow.fill.stops,
                resolveRadialGradientPosition(shadow.fill, shadowContour, x, y)
              );

      if (color !== null) {
        setPixel(
          pixels,
          drawnPixels,
          x,
          y,
          color,
          shadow.alpha * shadow.fill.alpha
        );
      }
    }
  }
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
  stroke: StrokeAppearance
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
        const pointX = x + 0.5;
        const pointY = y + 0.5;

        if (!isPointInsideRectContour(pointX, pointY, outerContour)) {
          continue;
        }

        if (
          innerContour !== null &&
          isPointInsideRectContour(pointX, pointY, innerContour)
        ) {
          continue;
        }

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

        const color =
          stroke.fill.kind === "solid"
            ? stroke.fill.color
            : stroke.fill.kind === "gradient-linear"
              ? sampleGradientStops(
                  stroke.fill.stops,
                  resolveLinearGradientPosition(stroke.fill, outerContour, x, y)
                )
              : sampleGradientStops(
                  stroke.fill.stops,
                  resolveRadialGradientPosition(stroke.fill, outerContour, x, y)
                );

        if (color !== null) {
          setPixel(
            pixels,
            drawnPixels,
            x,
            y,
            color,
            stroke.alpha * stroke.fill.alpha
          );
        }
      }
    }
  }

  stroke.strokes.forEach((nestedStroke) => {
    drawRectStroke(pixels, drawnPixels, outerContour, nestedStroke);
  });
}

function drawRectStroke(
  pixels: (RgbaColor | null)[][],
  drawnPixels: boolean[][],
  command: RectContour,
  stroke: StrokeAppearance
): void {
  if (!command.cut && !command.radius) {
    drawPlainRectStroke(pixels, drawnPixels, command, stroke);
    return;
  }

  drawContourAwareRectStroke(pixels, drawnPixels, command, stroke);
}

function drawCommand(
  pixels: (RgbaColor | null)[][],
  drawnPixels: boolean[][],
  command: CompiledDrawCommand
): void {
  if (command.kind === "plot") {
    setPixel(pixels, drawnPixels, command.x, command.y, command.color);
    return;
  }

  if (command.kind === "rect") {
    (command.shadows ?? []).forEach((shadow) => {
      drawRectShadow(pixels, drawnPixels, command, shadow);
    });
    command.fills.forEach((fill) => {
      drawRectFill(pixels, drawnPixels, command, fill);
    });
    command.strokes.forEach((stroke) => {
      drawRectStroke(pixels, drawnPixels, command, stroke);
    });
    return;
  }

  if (command.kind === "circle") {
    (command.shadows ?? []).forEach((shadow) => {
      drawCircleShadow(pixels, drawnPixels, command, shadow);
    });
    command.fills.forEach((fill) => {
      drawCircleFill(pixels, drawnPixels, command, fill);
    });
    command.strokes.forEach((stroke) => {
      drawCircleStroke(pixels, drawnPixels, command, stroke);
    });
    return;
  }

  if (command.kind === "polygon") {
    (command.shadows ?? []).forEach((shadow) => {
      drawPolygonShadow(pixels, drawnPixels, command, shadow);
    });
    command.fills.forEach((fill) => {
      drawPolygonFill(pixels, drawnPixels, command, fill);
    });
    command.strokes.forEach((stroke) => {
      drawPolygonStroke(pixels, drawnPixels, command, stroke);
    });
    return;
  }

  if (command.kind === "path") {
    command.strokes.forEach((stroke) => {
      drawPathStroke(pixels, drawnPixels, command, stroke);
    });
    return;
  }

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

function buildSpriteGridArtifact(document: CompiledDocument): RenderArtifact {
  const width = document.sprite?.width ?? 0;
  const height = document.sprite?.height ?? 0;
  const background = document.sprite?.background ?? "transparent";
  const backgroundColor = background === "transparent" ? null : parseColor(background);
  const pixels = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => backgroundColor)
  );
  const drawnPixels = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => false)
  );

  document.commands.forEach((command) => {
    drawCommand(pixels, drawnPixels, command);
  });

  const formattedPixels = pixels.map((row) => row.map((pixel) => formatColor(pixel)));
  const rows = formattedPixels.map((row, y) =>
    row
      .map((pixel, x) => {
        if (drawnPixels[y]![x]) {
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
