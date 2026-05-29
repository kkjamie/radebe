import type {
  PerfSample,
  PerfSnapshot,
  PerfSuiteProgress,
  PerfSuiteReport,
  RouteLink,
  RouteProbeResult
} from "./types.js";

function getPointTimestamp(
  samples: PerfSample[],
  name: string
): number | null {
  return (
    samples.find((sample) => sample.kind === "point" && sample.name === name)
      ?.timestamp ?? null
  );
}

function getRelativePointTimestamp(
  samples: PerfSample[],
  name: string
): number | null {
  const pointTimestamp = getPointTimestamp(samples, name);

  if (pointTimestamp === null) {
    return null;
  }

  const firstTimestamp = samples.reduce<number | null>((minimum, sample) => {
    if (minimum === null || sample.timestamp < minimum) {
      return sample.timestamp;
    }

    return minimum;
  }, null);

  if (firstTimestamp === null) {
    return null;
  }

  return pointTimestamp - firstTimestamp;
}

function getTopDurations(samples: PerfSample[]): RouteProbeResult["topDurations"] {
  return samples
    .filter(
      (sample): sample is PerfSample & { durationMs: number } =>
        sample.kind === "duration" && typeof sample.durationMs === "number"
    )
    .sort((left, right) => right.durationMs - left.durationMs)
    .slice(0, 5)
    .map((sample) => ({
      detail: sample.detail,
      durationMs: sample.durationMs,
      name: sample.name
    }));
}

function getMaxDuration(samples: PerfSample[], name: string): number | null {
  const matches = samples.filter(
    (sample): sample is PerfSample & { durationMs: number } =>
      sample.kind === "duration" &&
      sample.name === name &&
      typeof sample.durationMs === "number"
  );

  if (matches.length === 0) {
    return null;
  }

  return Math.max(...matches.map((sample) => sample.durationMs));
}

function getNotablePoints(samples: PerfSample[]): RouteProbeResult["notablePoints"] {
  return samples
    .filter((sample) => sample.kind === "point")
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, 5)
    .map((sample) => ({
      detail: sample.detail,
      name: sample.name,
      timestampMs: sample.timestamp
    }));
}

export function roundMs(value: number | null): string {
  return value === null ? "-" : `${Math.round(value)}ms`;
}

function summarizeBottleneck(result: {
  metrics: RouteProbeResult["metrics"];
  topDurations: RouteProbeResult["topDurations"];
  notablePoints: RouteProbeResult["notablePoints"];
}): string {
  const topDuration = result.topDurations[0];

  if (topDuration) {
    const detail = topDuration.detail ? ` ${topDuration.detail}` : "";
    return `${topDuration.name}${detail} ${Math.round(topDuration.durationMs)}ms`;
  }

  const latePoint = result.notablePoints[0];
  if (latePoint) {
    const detail = latePoint.detail ? ` ${latePoint.detail}` : "";
    return `${latePoint.name}${detail} ${Math.round(latePoint.timestampMs)}ms`;
  }

  if (result.metrics.loadEventEndMs !== null) {
    return `navigation load event ${Math.round(result.metrics.loadEventEndMs)}ms`;
  }

  return "No perf samples captured";
}

export function toRouteProbeResult(
  route: RouteLink,
  url: string,
  snapshot: PerfSnapshot
): RouteProbeResult {
  const topDurations = getTopDurations(snapshot.samples);
  const notablePoints = getNotablePoints(snapshot.samples);
  const metrics = {
    appFirstFrameMs: getRelativePointTimestamp(snapshot.samples, "app-first-frame"),
    domContentLoadedMs: snapshot.navigation?.domContentLoadedMs ?? null,
    loadEventEndMs: snapshot.navigation?.loadEventEndMs ?? null,
    maxPlaygroundActivationWaitMs: getMaxDuration(
      snapshot.samples,
      "playground-activation-wait"
    ),
    maxPlaygroundEditorSetupMs: getMaxDuration(
      snapshot.samples,
      "playground-editor-setup"
    ),
    maxPlaygroundStartupActiveMs: getMaxDuration(
      snapshot.samples,
      "playground-startup-active"
    ),
    maxPlaygroundStartupTotalMs: getMaxDuration(
      snapshot.samples,
      "playground-startup-total"
    ),
    pageFirstFrameMs: getRelativePointTimestamp(snapshot.samples, "page-first-frame")
  };

  return {
    bottleneck: summarizeBottleneck({
      metrics,
      notablePoints,
      topDurations
    }),
    metrics,
    notablePoints,
    route,
    snapshot,
    topDurations,
    url
  };
}

export function getSortMetric(result: RouteProbeResult): number {
  return (
    result.metrics.pageFirstFrameMs ??
    result.metrics.appFirstFrameMs ??
    result.metrics.loadEventEndMs ??
    0
  );
}

export function sortRouteProbeResults(
  results: RouteProbeResult[]
): RouteProbeResult[] {
  return [...results].sort((left, right) => getSortMetric(right) - getSortMetric(left));
}

export function reportFromProgress(progress: PerfSuiteProgress[]): PerfSuiteReport {
  const pagesById = new Map<string, PerfSuiteReport["pages"][number]>();

  for (const item of progress) {
    pagesById.set(item.page.pageId, item.page);
  }

  return {
    generatedAt: new Date().toISOString(),
    pages: [...pagesById.values()]
  };
}
