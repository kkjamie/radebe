import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import {
  getAvailableBrowserPaths,
  runBrowserProbe
} from "./browser-probe.js";
import {
  reportFromProgress,
  roundMs,
  sortRouteProbeResults,
  toRouteProbeResult
} from "./metrics.js";
import {
  findRepoRoot,
  getReportOutputDir,
  getWebDistDir
} from "./paths.js";
import { writePerfReports } from "./report-writer.js";
import { startStaticServer } from "./static-server.js";

import type { PerfSuiteReport, RouteProbeResult } from "./types.js";

const DEFAULT_PORT = 4173;
const DEFAULT_VIRTUAL_TIME_BUDGET_MS = 12000;

type CommandLineOptions = {
  port: number;
  virtualTimeBudgetMs: number;
};

type NumericOptionRange = {
  max?: number;
  min: number;
};

function parseIntegerOption(
  optionName: string,
  rawValue: string | undefined,
  range: NumericOptionRange
): number {
  if (rawValue === undefined || rawValue.startsWith("--")) {
    throw new Error(`Missing value for ${optionName}.`);
  }

  if (!/^\d+$/.test(rawValue)) {
    throw new Error(`${optionName} must be a base-10 integer. Received: ${rawValue}`);
  }

  const value = Number.parseInt(rawValue, 10);

  if (!Number.isSafeInteger(value)) {
    throw new Error(`${optionName} must be a safe integer. Received: ${rawValue}`);
  }

  if (value < range.min) {
    throw new Error(`${optionName} must be at least ${range.min}. Received: ${value}`);
  }

  if (range.max !== undefined && value > range.max) {
    throw new Error(`${optionName} must be at most ${range.max}. Received: ${value}`);
  }

  return value;
}

function writeHelp(): void {
  process.stdout.write(
    [
      "Usage: node ./scripts/dist/src/web-page-perf.js [options]",
      "",
      "Options:",
      "  --port <number>                  Override the local static server port.",
      "  --virtual-time-budget <number>   Override the browser suite timeout in milliseconds."
    ].join("\n")
  );
  process.stdout.write("\n");
}

export function parseCommandLine(argv: string[]): CommandLineOptions {
  let port = DEFAULT_PORT;
  let virtualTimeBudgetMs = DEFAULT_VIRTUAL_TIME_BUDGET_MS;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const value = argv[index + 1];

    switch (token) {
      case "--port":
        port = parseIntegerOption("--port", value, {
          max: 65535,
          min: 1
        });
        index += 1;
        break;
      case "--virtual-time-budget":
        virtualTimeBudgetMs = parseIntegerOption("--virtual-time-budget", value, {
          min: 1
        });
        index += 1;
        break;
      case "--help":
      case "-h":
      case "help":
        writeHelp();
        process.exit(0);
      default:
        if (token.startsWith("--")) {
          throw new Error(`Unknown argument: ${token}`);
        }

        throw new Error(`Unexpected positional argument: ${token}`);
    }
  }

  return {
    port,
    virtualTimeBudgetMs
  };
}

export async function main(argv: string[]): Promise<number> {
  try {
    const options = parseCommandLine(argv);
    const rootDir = findRepoRoot(process.cwd());
    const distDir = getWebDistDir(rootDir);

    if (!existsSync(path.join(distDir, "index.html"))) {
      throw new Error(
        `Missing web build output at ${distDir}. Run "npm run build -w @radebe/web" first.`
      );
    }

    const browserPaths = getAvailableBrowserPaths();
    const reportOutputDir = getReportOutputDir(rootDir);
    await mkdir(reportOutputDir, { recursive: true });

    const server = await startStaticServer(distDir, options.port);

    try {
      const reportToken = randomBytes(8).toString("hex");
      const homeUrl = `${server.origin}/?perf=1&perf-suite=1&perf-suite-token=${reportToken}#/home`;
      const progressFilePath = server.progressFilePath(reportToken);
      let activeBrowserPath = "";
      let suiteReport: PerfSuiteReport | null = null;
      let browserProbeError = "";

      for (const browserPath of browserPaths) {
        try {
          suiteReport = await runBrowserProbe(
            browserPath,
            homeUrl,
            options.virtualTimeBudgetMs,
            server.waitForReport(reportToken, options.virtualTimeBudgetMs)
          );
          activeBrowserPath = browserPath;
          browserProbeError = "";
          break;
        } catch (error) {
          browserProbeError = error instanceof Error ? error.message : String(error);
          const progress = server.getProgress(reportToken);

          if (progress.length > 0) {
            suiteReport = reportFromProgress(progress);
            activeBrowserPath = browserPath;
            browserProbeError = "";
            break;
          }
        }
      }

      if (activeBrowserPath === "" || suiteReport === null) {
        throw new Error(browserProbeError || "No browser succeeded.");
      }

      const results: RouteProbeResult[] = [];

      for (const pageResult of suiteReport.pages) {
        process.stdout.write(`Captured ${pageResult.pageId}.\n`);
        results.push(
          toRouteProbeResult(
            {
              id: pageResult.pageId,
              label: pageResult.title
            },
            `${server.origin}/#/${pageResult.pageId}`,
            pageResult.snapshot
          )
        );
      }

      const sortedResults = sortRouteProbeResults(results);
      const { reportJsonPath, reportMarkdownPath } = await writePerfReports(
        reportOutputDir,
        sortedResults
      );

      process.stdout.write(
        [
          "",
          "Slowest routes:",
          ...sortedResults.slice(0, 10).map((result, index) => {
            return `${index + 1}. ${result.route.id} ${roundMs(result.metrics.pageFirstFrameMs)} ${result.bottleneck}`;
          }),
          "",
          `Captured pages: ${suiteReport.pages.length}`,
          `Browser: ${activeBrowserPath}`,
          `Progress file: ${progressFilePath}`,
          `JSON report: ${reportJsonPath}`,
          `Markdown report: ${reportMarkdownPath}`
        ].join("\n")
      );
      process.stdout.write("\n");
    } finally {
      await server.close();
    }

    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    return 1;
  }
}
