import type { CompiledDrawCommand } from "../../../types.js";
import {
  drawCoverageAppearancePasses,
  normalizeCoverageAppearancePasses,
  type CoverageAppearancePasses
} from "../../appearance.js";
import {
  createPolygonCoverageSource,
  type CoverageSource
} from "../../coverage.js";
import { type DrawnGrid, type PixelGrid } from "../../shared.js";

export function drawPolygonCommand(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  command: Extract<CompiledDrawCommand, { kind: "polygon" }>,
  defaultAntialias: boolean
): void {
  const antialias = command.antialias ?? defaultAntialias;
  const coverage: CoverageSource = createPolygonCoverageSource(
    command,
    antialias
  );
  const passes: CoverageAppearancePasses =
    normalizeCoverageAppearancePasses(command);

  drawCoverageAppearancePasses(pixels, drawnPixels, coverage, passes);
}
