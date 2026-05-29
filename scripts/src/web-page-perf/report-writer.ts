import { writeFile } from "node:fs/promises";
import path from "node:path";

import { getSortMetric, roundMs } from "./metrics.js";

import type { RouteProbeResult } from "./types.js";

export type WrittenPerfReports = {
  reportJsonPath: string;
  reportMarkdownPath: string;
};

function formatResourceName(resourceUrl: string): string {
  try {
    const parsed = new URL(resourceUrl);
    const pathname = parsed.pathname === "/" ? parsed.origin : parsed.pathname;
    return `${pathname}${parsed.search}`;
  } catch {
    return resourceUrl;
  }
}

export function buildMarkdownReport(results: RouteProbeResult[]): string {
  const sortedResults = [...results].sort(
    (left, right) => getSortMetric(right) - getSortMetric(left)
  );
  const lines = [
    "# Web Page Performance Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Ranked Routes",
    "",
    "| Route | Page first frame | App first frame | Editor setup max | Startup total max | DOM content loaded | Load event | Dominant work |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |"
  ];

  for (const result of sortedResults) {
    lines.push(
      `| ${result.route.id} (${result.route.label}) | ${roundMs(result.metrics.pageFirstFrameMs)} | ${roundMs(result.metrics.appFirstFrameMs)} | ${roundMs(result.metrics.maxPlaygroundEditorSetupMs)} | ${roundMs(result.metrics.maxPlaygroundStartupTotalMs)} | ${roundMs(result.metrics.domContentLoadedMs)} | ${roundMs(result.metrics.loadEventEndMs)} | ${result.bottleneck} |`
    );
  }

  lines.push("", "## Details", "");

  for (const result of sortedResults) {
    lines.push(`### ${result.route.label} \`#/${result.route.id}\``);
    lines.push("");
    lines.push(`- URL: \`${result.url}\``);
    lines.push(`- Page first frame: ${roundMs(result.metrics.pageFirstFrameMs)}`);
    lines.push(`- App first frame: ${roundMs(result.metrics.appFirstFrameMs)}`);
    lines.push(
      `- Max editor setup duration: ${roundMs(result.metrics.maxPlaygroundEditorSetupMs)}`
    );
    lines.push(
      `- Max startup queue wait: ${roundMs(result.metrics.maxPlaygroundActivationWaitMs)}`
    );
    lines.push(
      `- Max startup active time: ${roundMs(result.metrics.maxPlaygroundStartupActiveMs)}`
    );
    lines.push(
      `- Max startup total time: ${roundMs(result.metrics.maxPlaygroundStartupTotalMs)}`
    );
    lines.push(`- DOM content loaded: ${roundMs(result.metrics.domContentLoadedMs)}`);
    lines.push(`- Load event end: ${roundMs(result.metrics.loadEventEndMs)}`);
    lines.push(`- Bottleneck summary: ${result.bottleneck}`);

    if (result.topDurations.length > 0) {
      lines.push("- Slowest timed work:");
      for (const duration of result.topDurations) {
        const detail = duration.detail ? ` (${duration.detail})` : "";
        lines.push(
          `  - ${duration.name}: ${Math.round(duration.durationMs)}ms${detail}`
        );
      }
    }

    if (result.notablePoints.length > 0) {
      lines.push("- Latest milestone points:");
      for (const point of result.notablePoints) {
        const detail = point.detail ? ` (${point.detail})` : "";
        lines.push(
          `  - ${point.name}: ${Math.round(point.timestampMs)}ms${detail}`
        );
      }
    }

    if (result.snapshot.resources.length > 0) {
      lines.push("- Slowest resources:");
      for (const resource of result.snapshot.resources.slice(0, 3)) {
        lines.push(
          `  - ${formatResourceName(resource.name)}: ${Math.round(resource.durationMs)}ms (${resource.initiatorType})`
        );
      }
    }

    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

export async function writePerfReports(
  reportOutputDir: string,
  sortedResults: RouteProbeResult[]
): Promise<WrittenPerfReports> {
  const reportJsonPath = path.join(reportOutputDir, "report.json");
  const reportMarkdownPath = path.join(reportOutputDir, "report.md");

  await writeFile(
    reportJsonPath,
    `${JSON.stringify(sortedResults, null, 2)}\n`,
    "utf8"
  );
  await writeFile(
    reportMarkdownPath,
    buildMarkdownReport(sortedResults),
    "utf8"
  );

  return {
    reportJsonPath,
    reportMarkdownPath
  };
}
