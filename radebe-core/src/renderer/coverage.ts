import type {
  CircleCommand,
  PolygonCommand,
  StrokeAppearance
} from "../types.js";
import {
  buildAdjustedRectContour,
  buildSpreadMask,
  expandBounds,
  getClosestPolygonEdgeSample,
  getMaskAlpha,
  getPixelCoverage,
  getPolygonBounds,
  getRectContourPatternPosition,
  isPointInsidePolygon,
  isPointInsideRectContour,
  resolveStrokeExtents,
  sampleMaskAlpha,
  type AlphaMask,
  type RectBounds,
  type RectContour
} from "./shared.js";

export interface AlphaCoverageSource {
  bounds: RectBounds;
  sampleAlpha(x: number, y: number): number;
}

export interface CoverageSource extends AlphaCoverageSource {
  sampleSpreadAlpha(x: number, y: number, spread: number): number;
  createSpreadSource(spread: number): CoverageSource;
  getStrokePatternPosition?(
    x: number,
    y: number,
    strokeBounds: RectBounds,
    stroke: StrokeAppearance
  ): number;
}

function createEmptyCoverageSource(bounds: RectBounds): CoverageSource {
  const source: CoverageSource = {
    bounds,
    sampleAlpha: () => 0,
    sampleSpreadAlpha: () => 0,
    createSpreadSource: () => source
  };

  return source;
}

function sampleRectContourAlpha(
  contour: RectContour,
  antialias: boolean,
  x: number,
  y: number
): number {
  return getPixelCoverage(x, y, antialias, (pointX, pointY) =>
    isPointInsideRectContour(pointX, pointY, contour)
  );
}

function getPlainRectStrokePatternPosition(
  x: number,
  y: number,
  bounds: RectBounds
): number {
  const leftDistance = x - bounds.x;
  const topDistance = y - bounds.y;
  const rightDistance = bounds.x + bounds.width - 1 - x;
  const bottomDistance = bounds.y + bounds.height - 1 - y;
  const minimum = Math.min(
    leftDistance,
    topDistance,
    rightDistance,
    bottomDistance
  );

  return minimum === topDistance || minimum === bottomDistance
    ? x - bounds.x
    : y - bounds.y;
}

export function createRectCoverageSource(
  command: RectContour,
  antialias: boolean
): CoverageSource {
  const bounds = {
    x: command.x,
    y: command.y,
    width: command.width,
    height: command.height
  };
  const source: CoverageSource = {
    bounds,
    sampleAlpha: (x, y) => sampleRectContourAlpha(command, antialias, x, y),
    sampleSpreadAlpha: (x, y, spread) => {
      const contour = buildAdjustedRectContour(command, spread);

      return contour === null
        ? 0
        : sampleRectContourAlpha(contour, antialias, x, y);
    },
    createSpreadSource: (spread) => {
      if (spread === 0) {
        return source;
      }

      const contour = buildAdjustedRectContour(command, spread);

      return contour === null
        ? createEmptyCoverageSource(bounds)
        : createRectCoverageSource(contour, antialias);
    },
    getStrokePatternPosition: (x, y, strokeBounds) =>
      command.cut || command.radius
        ? getRectContourPatternPosition(x, y, strokeBounds)
        : getPlainRectStrokePatternPosition(x, y, strokeBounds)
  };

  return source;
}

function getCircleBounds(
  command: Pick<CircleCommand, "x" | "y">,
  radius: number
): RectBounds {
  return {
    x: command.x - radius,
    y: command.y - radius,
    width: radius * 2 + 1,
    height: radius * 2 + 1
  };
}

function sampleCircleAlpha(
  command: Pick<CircleCommand, "x" | "y">,
  radius: number,
  antialias: boolean,
  x: number,
  y: number
): number {
  if (radius < 0) {
    return 0;
  }

  const centerX = command.x + 0.5;
  const centerY = command.y + 0.5;

  return getPixelCoverage(x, y, antialias, (pointX, pointY) =>
    Math.hypot(pointX - centerX, pointY - centerY) <= radius
  );
}

export function createCircleCoverageSource(
  command: Pick<CircleCommand, "x" | "y" | "radius">,
  antialias: boolean
): CoverageSource {
  const bounds = getCircleBounds(command, command.radius);
  const source: CoverageSource = {
    bounds,
    sampleAlpha: (x, y) =>
      sampleCircleAlpha(command, command.radius, antialias, x, y),
    sampleSpreadAlpha: (x, y, spread) =>
      sampleCircleAlpha(command, command.radius + spread, antialias, x, y),
    createSpreadSource: (spread) => {
      if (spread === 0) {
        return source;
      }

      const radius = command.radius + spread;

      return radius < 0
        ? createEmptyCoverageSource(bounds)
        : createCircleCoverageSource({ ...command, radius }, antialias);
    },
    getStrokePatternPosition: (x, y, _strokeBounds, stroke) => {
      const { inner, outer } = resolveStrokeExtents(stroke.width, stroke.align);
      const innerRadius = Math.max(command.radius - inner, 0);
      const outerRadius = command.radius + outer;
      const averageRadius = (innerRadius + outerRadius) / 2;
      const circumference = Math.max(1, Math.round(2 * Math.PI * averageRadius));
      const angle = Math.atan2(
        y + 0.5 - (command.y + 0.5),
        x + 0.5 - (command.x + 0.5)
      );
      const normalizedAngle = angle < 0 ? angle + Math.PI * 2 : angle;

      return Math.round((normalizedAngle / (Math.PI * 2)) * circumference);
    }
  };

  return source;
}

function getPolygonCoverageBounds(
  command: Pick<PolygonCommand, "points">,
  spread: number
): RectBounds {
  const bounds = getPolygonBounds(command.points);
  const expansion = Math.max(Math.ceil(spread), 0);

  return expansion > 0 ? expandBounds(bounds, expansion) : bounds;
}

function samplePolygonSpreadAlpha(
  command: Pick<PolygonCommand, "points">,
  spread: number,
  antialias: boolean,
  x: number,
  y: number
): number {
  return getPixelCoverage(x, y, antialias, (pointX, pointY) => {
    const inside = isPointInsidePolygon(pointX, pointY, command.points);

    if (spread === 0) {
      return inside;
    }

    const closestEdge = getClosestPolygonEdgeSample(
      pointX,
      pointY,
      command.points
    );

    if (spread > 0) {
      return inside || closestEdge.distance <= spread;
    }

    return inside && closestEdge.distance > -spread;
  });
}

export function createPolygonCoverageSource(
  command: Pick<PolygonCommand, "points">,
  antialias: boolean,
  spread = 0
): CoverageSource {
  const bounds = getPolygonCoverageBounds(command, spread);
  const source: CoverageSource = {
    bounds,
    sampleAlpha: (x, y) =>
      samplePolygonSpreadAlpha(command, spread, antialias, x, y),
    sampleSpreadAlpha: (x, y, nextSpread) =>
      samplePolygonSpreadAlpha(command, spread + nextSpread, antialias, x, y),
    createSpreadSource: (nextSpread) => {
      if (nextSpread === 0) {
        return source;
      }

      return createPolygonCoverageSource(
        command,
        antialias,
        spread + nextSpread
      );
    },
    getStrokePatternPosition: (x, y) =>
      getClosestPolygonEdgeSample(x + 0.5, y + 0.5, command.points)
        .perimeterPosition
  };

  return source;
}

export function createAlphaMaskCoverageSource(
  mask: AlphaMask,
  bounds: RectBounds
): CoverageSource {
  const source: CoverageSource = {
    bounds,
    sampleAlpha: (x, y) => getMaskAlpha(mask, x, y),
    sampleSpreadAlpha: (x, y, spread) => sampleMaskAlpha(mask, x, y, spread),
    createSpreadSource: (spread) => {
      if (spread === 0) {
        return source;
      }

      return createAlphaMaskCoverageSource(
        buildSpreadMask(mask, spread),
        spread > 0 ? expandBounds(bounds, Math.ceil(spread)) : bounds
      );
    },
    getStrokePatternPosition: (x, y, strokeBounds) =>
      x - strokeBounds.x + (y - strokeBounds.y)
  };

  return source;
}
