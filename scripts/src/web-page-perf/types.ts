export type PerfSample = {
  id: number;
  name: string;
  kind: "point" | "duration";
  timestamp: number;
  durationMs?: number;
  detail?: string;
};

export type PerfSnapshot = {
  capturedAt: number;
  enabled: boolean;
  navigation: {
    url: string;
    type: string;
    responseEndMs: number;
    domContentLoadedMs: number;
    loadEventEndMs: number;
    transferSize?: number;
    encodedBodySize?: number;
    decodedBodySize?: number;
  } | null;
  resources: Array<{
    name: string;
    initiatorType: string;
    durationMs: number;
    transferSize?: number;
    encodedBodySize?: number;
    decodedBodySize?: number;
  }>;
  samples: PerfSample[];
};

export type RouteLink = {
  id: string;
  label: string;
};

export type PerfSuiteReport = {
  generatedAt: string;
  pages: Array<{
    pageId: string;
    pageKind: string;
    snapshot: PerfSnapshot;
    title: string;
  }>;
};

export type PerfSuiteProgress = {
  capturedAt: string;
  nextPageId: string | null;
  page: PerfSuiteReport["pages"][number];
  pageIndex: number;
  totalPages: number;
};

export type RouteProbeResult = {
  route: RouteLink;
  url: string;
  snapshot: PerfSnapshot;
  metrics: {
    appFirstFrameMs: number | null;
    pageFirstFrameMs: number | null;
    loadEventEndMs: number | null;
    domContentLoadedMs: number | null;
    maxPlaygroundActivationWaitMs: number | null;
    maxPlaygroundEditorSetupMs: number | null;
    maxPlaygroundStartupActiveMs: number | null;
    maxPlaygroundStartupTotalMs: number | null;
  };
  topDurations: Array<{
    name: string;
    durationMs: number;
    detail?: string;
  }>;
  notablePoints: Array<{
    name: string;
    timestampMs: number;
    detail?: string;
  }>;
  bottleneck: string;
};
