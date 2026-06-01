import type { CompiledDrawCommand } from "../../../types.js";
import {
  drawCoverageAppearancePasses,
  normalizeCoverageAppearancePasses,
  type CoverageAppearancePasses
} from "../../appearance.js";
import {
  createCircleCoverageSource,
  type CoverageSource
} from "../../coverage.js";
import { type DrawnGrid, type PixelGrid } from "../../shared.js";

export function drawCircleCommand(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  command: Extract<CompiledDrawCommand, { kind: "circle" }>,
  defaultAntialias: boolean
): void {
  const antialias = command.antialias ?? defaultAntialias;
  const coverage: CoverageSource = createCircleCoverageSource(
    command,
    antialias
  );
  const passes: CoverageAppearancePasses =
    normalizeCoverageAppearancePasses(command);

  drawCoverageAppearancePasses(pixels, drawnPixels, coverage, passes);
}
