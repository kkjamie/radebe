import { useEffect, useState } from "preact/hooks";

export type PerfSample = {
  id: number;
  name: string;
  kind: "point" | "duration";
  timestamp: number;
  durationMs?: number;
  detail?: string;
};

export type PerfResourceTimingSummary = {
  name: string;
  initiatorType: string;
  durationMs: number;
  transferSize?: number;
  encodedBodySize?: number;
  decodedBodySize?: number;
};

export type PerfNavigationTimingSummary = {
  url: string;
  type: string;
  responseEndMs: number;
  domContentLoadedMs: number;
  loadEventEndMs: number;
  transferSize?: number;
  encodedBodySize?: number;
  decodedBodySize?: number;
};

export type PerfSnapshot = {
  capturedAt: number;
  enabled: boolean;
  navigation: PerfNavigationTimingSummary | null;
  resources: PerfResourceTimingSummary[];
  samples: PerfSample[];
};

const perfEnabled =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("perf") === "1";

let perfStartTime =
  typeof performance !== "undefined" ? performance.now() : Date.now();

const perfSamples: PerfSample[] = [];
const perfListeners = new Set<() => void>();
let perfSampleId = 0;

function emitPerfSample(sample: Omit<PerfSample, "id">): void {
  if (!perfEnabled) {
    return;
  }

  const nextSample: PerfSample = {
    id: perfSampleId,
    ...sample
  };

  perfSampleId += 1;
  perfSamples.push(nextSample);
  perfListeners.forEach((listener) => {
    listener();
  });

  const relativeTimestamp = Math.round(nextSample.timestamp - perfStartTime);

  if (nextSample.kind === "duration") {
    console.info(
      `[perf +${relativeTimestamp}ms] ${nextSample.name}: ${nextSample.durationMs?.toFixed(1)}ms${
        nextSample.detail ? ` (${nextSample.detail})` : ""
      }`
    );
    return;
  }

  console.info(
    `[perf +${relativeTimestamp}ms] ${nextSample.name}${
      nextSample.detail ? ` (${nextSample.detail})` : ""
    }`
  );
}

export function isPerfDebugEnabled(): boolean {
  return perfEnabled;
}

export function markPerfPoint(name: string, detail?: string): void {
  emitPerfSample({
    detail,
    kind: "point",
    name,
    timestamp:
      typeof performance !== "undefined" ? performance.now() : Date.now()
  });
}

export function timePerfSync<T>(name: string, work: () => T, detail?: string): T {
  const start =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  const result = work();
  const end = typeof performance !== "undefined" ? performance.now() : Date.now();

  emitPerfSample({
    detail,
    durationMs: end - start,
    kind: "duration",
    name,
    timestamp: end
  });

  return result;
}

export function markPerfDuration(
  name: string,
  durationMs: number,
  detail?: string
): void {
  emitPerfSample({
    detail,
    durationMs,
    kind: "duration",
    name,
    timestamp:
      typeof performance !== "undefined" ? performance.now() : Date.now()
  });
}

export function subscribePerfSamples(listener: () => void): () => void {
  perfListeners.add(listener);

  return () => {
    perfListeners.delete(listener);
  };
}

export function getPerfSamples(): PerfSample[] {
  return perfSamples;
}

export function resetPerfSamples(): void {
  perfSamples.length = 0;
  perfSampleId = 0;
  perfStartTime =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  perfListeners.forEach((listener) => {
    listener();
  });
}

function getNavigationTimingSummary(): PerfNavigationTimingSummary | null {
  if (typeof performance === "undefined") {
    return null;
  }

  const entry = performance
    .getEntriesByType("navigation")
    .find(
      (candidate): candidate is PerformanceNavigationTiming =>
        candidate instanceof PerformanceNavigationTiming
    );

  if (!entry) {
    return null;
  }

  return {
    decodedBodySize: entry.decodedBodySize,
    domContentLoadedMs: entry.domContentLoadedEventEnd,
    encodedBodySize: entry.encodedBodySize,
    loadEventEndMs: entry.loadEventEnd,
    responseEndMs: entry.responseEnd,
    transferSize: entry.transferSize,
    type: entry.type,
    url: entry.name
  };
}

function getResourceTimingSummaries(): PerfResourceTimingSummary[] {
  if (typeof performance === "undefined") {
    return [];
  }

  return performance
    .getEntriesByType("resource")
    .map((entry): PerfResourceTimingSummary => {
      const resourceEntry = entry as PerformanceResourceTiming;

      return {
        decodedBodySize: resourceEntry.decodedBodySize,
        durationMs: resourceEntry.duration,
        encodedBodySize: resourceEntry.encodedBodySize,
        initiatorType: resourceEntry.initiatorType,
        name: resourceEntry.name,
        transferSize: resourceEntry.transferSize
      };
    })
    .sort((left, right) => right.durationMs - left.durationMs)
    .slice(0, 12);
}

export function getPerfSnapshot(): PerfSnapshot {
  return {
    capturedAt:
      typeof performance !== "undefined" ? performance.now() : Date.now(),
    enabled: perfEnabled,
    navigation: getNavigationTimingSummary(),
    resources: getResourceTimingSummaries(),
    samples: [...perfSamples]
  };
}

export function usePerfSamples(): PerfSample[] {
  const [samples, setSamples] = useState(() => getPerfSamples());

  useEffect(() => {
    return subscribePerfSamples(() => {
      setSamples([...getPerfSamples()]);
    });
  }, []);

  return samples;
}

markPerfPoint("module-eval-start");
