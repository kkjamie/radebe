import type { CompiledDrawCommand } from "../../../types.js";
import {
  drawCoverageAppearancePasses,
  normalizeCoverageAppearancePasses
} from "../../appearance.js";
import { createPolygonCoverageSource } from "../../coverage.js";
import { type DrawnGrid, type PixelGrid } from "../../shared.js";

export function drawPolygonCommand(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  command: Extract<CompiledDrawCommand, { kind: "polygon" }>,
  defaultAntialias: boolean
): void {
  const antialias = command.antialias ?? defaultAntialias;
  const coverage = createPolygonCoverageSource(command, antialias);
  const passes = normalizeCoverageAppearancePasses(command);

  drawCoverageAppearancePasses(pixels, drawnPixels, coverage, passes);
}
