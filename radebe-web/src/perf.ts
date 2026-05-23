import { useEffect, useState } from "preact/hooks";

export type PerfSample = {
  id: number;
  name: string;
  kind: "point" | "duration";
  timestamp: number;
  durationMs?: number;
  detail?: string;
};

const perfEnabled =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("perf") === "1";

const perfStartTime =
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

export function subscribePerfSamples(listener: () => void): () => void {
  perfListeners.add(listener);

  return () => {
    perfListeners.delete(listener);
  };
}

export function getPerfSamples(): PerfSample[] {
  return perfSamples;
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
