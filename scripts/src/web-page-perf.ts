import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { existsSync } from "node:fs";
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  stat,
  writeFile
} from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

type PerfSample = {
  id: number;
  name: string;
  kind: "point" | "duration";
  timestamp: number;
  durationMs?: number;
  detail?: string;
};

type PerfSnapshot = {
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

type RouteLink = {
  id: string;
  label: string;
};

type BrowserProbeResult = {
  routeLinks: RouteLink[];
  snapshotText: string;
};

type PerfSuiteReport = {
  generatedAt: string;
  pages: Array<{
    pageId: string;
    pageKind: string;
    snapshot: PerfSnapshot;
    title: string;
  }>;
};

type PerfSuiteProgress = {
  capturedAt: string;
  nextPageId: string | null;
  page: PerfSuiteReport["pages"][number];
  pageIndex: number;
  totalPages: number;
};

type WebSocketConnection = {
  handshakeBuffer: Buffer;
  messageQueue: string[];
  partialTextFrames: Buffer[];
  socket: net.Socket;
  waitingResolvers: Array<(message: string) => void>;
};

type RouteProbeResult = {
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

const DEFAULT_PORT = 4173;
const DEFAULT_VIRTUAL_TIME_BUDGET_MS = 12000;

function getCurrentDirectory(): string {
  return path.dirname(fileURLToPath(import.meta.url));
}

function findRepoRoot(startDir = getCurrentDirectory()): string {
  let currentDir = path.resolve(startDir);

  while (true) {
    if (
      existsSync(path.join(currentDir, "AGENTS.md")) &&
      existsSync(path.join(currentDir, "package.json"))
    ) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      throw new Error(`Unable to locate the workspace root from ${startDir}.`);
    }

    currentDir = parentDir;
  }
}

function getWebDistDir(rootDir: string): string {
  return path.join(rootDir, "radebe-web", "dist");
}

function getReportOutputDir(rootDir: string): string {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    "-",
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0")
  ].join("");

  return path.join(rootDir, "Temp", "web-page-perf", stamp);
}

function getContentType(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();

  switch (extension) {
    case ".css":
      return "text/css; charset=utf-8";
    case ".html":
      return "text/html; charset=utf-8";
    case ".js":
      return "text/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".png":
      return "image/png";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

function isSafeRelativePath(relativePath: string): boolean {
  return !relativePath.split("/").some((segment) => segment === "..");
}

async function serveStaticFile(
  distDir: string,
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
  const relativePath = requestUrl.pathname === "/"
    ? "index.html"
    : requestUrl.pathname.slice(1);
  const normalizedPath = relativePath.replace(/\\/g, "/");

  if (!isSafeRelativePath(normalizedPath)) {
    response.statusCode = 400;
    response.end("Invalid path.");
    return;
  }

  const targetPath = path.join(distDir, normalizedPath);
  const fallbackPath = path.join(distDir, "index.html");
  const filePath = existsSync(targetPath) ? targetPath : fallbackPath;
  const fileStat = await stat(filePath);

  response.statusCode = 200;
  response.setHeader("Content-Length", fileStat.size);
  response.setHeader("Content-Type", getContentType(filePath));
  response.end(await readFile(filePath));
}

async function startStaticServer(distDir: string, port: number): Promise<{
  close: () => Promise<void>;
  getProgress: (token: string) => PerfSuiteProgress[];
  origin: string;
  progressFilePath: (token: string) => string;
  waitForReport: (token: string, timeoutMs: number) => Promise<string>;
}> {
  const progressBodies = new Map<string, PerfSuiteProgress[]>();
  const reportBodies = new Map<string, string>();
  const reportWaiters = new Map<
    string,
    {
      resolve: (body: string) => void;
      timeout: NodeJS.Timeout;
    }
  >();
  const server = createServer((request, response) => {
    const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");

    if (request.method === "POST" && requestUrl.pathname === "/__perf-report") {
      const token = requestUrl.searchParams.get("token") ?? "";
      let body = "";
      request.setEncoding("utf8");
      request.on("data", (chunk: string) => {
        body += chunk;
      });
      request.on("end", () => {
        const waiter = reportWaiters.get(token);

        if (waiter) {
          clearTimeout(waiter.timeout);
          reportWaiters.delete(token);
          waiter.resolve(body);
        } else {
          reportBodies.set(token, body);
        }

        response.statusCode = 200;
        response.end("ok");
      });
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/__perf-progress") {
      const token = requestUrl.searchParams.get("token") ?? "";
      let body = "";
      request.setEncoding("utf8");
      request.on("data", (chunk: string) => {
        body += chunk;
      });
      request.on("end", () => {
        const payload = JSON.parse(body) as PerfSuiteProgress;
        const progress = progressBodies.get(token) ?? [];
        progress.push(payload);
        progressBodies.set(token, progress);
        void writeFile(
          path.join(os.tmpdir(), `radebe-web-page-perf-progress-${token}.json`),
          `${JSON.stringify(progress, null, 2)}\n`,
          "utf8"
        );
        response.statusCode = 200;
        response.end("ok");
      });
      return;
    }

    void serveStaticFile(distDir, request, response).catch((error) => {
      response.statusCode = 500;
      response.end(
        error instanceof Error ? error.message : "Unexpected server error."
      );
    });
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      resolve();
    });
  });

  return {
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    },
    getProgress: (token: string) => {
      return progressBodies.get(token) ?? [];
    },
    origin: `http://127.0.0.1:${port}`,
    progressFilePath: (token: string) => {
      return path.join(os.tmpdir(), `radebe-web-page-perf-progress-${token}.json`);
    },
    waitForReport: async (token: string, timeoutMs: number) => {
      const existingBody = reportBodies.get(token);

      if (existingBody !== undefined) {
        reportBodies.delete(token);
        return existingBody;
      }

      return await new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reportWaiters.delete(token);
          reject(new Error(`Timed out waiting for perf report token ${token}.`));
        }, timeoutMs);

        reportWaiters.set(token, {
          resolve,
          timeout
        });
      });
    }
  };
}

async function getFreePort(): Promise<number> {
  return await new Promise<number>((resolve, reject) => {
    const server = createServer();

    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();

      if (!address || typeof address === "string") {
        reject(new Error("Unable to allocate a free local port."));
        return;
      }

      const port = address.port;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(port);
      });
    });
  });
}

function decodeWebSocketFrames(connection: WebSocketConnection): void {
  while (connection.handshakeBuffer.length >= 2) {
    const firstByte = connection.handshakeBuffer[0];
    const secondByte = connection.handshakeBuffer[1];
    const fin = (firstByte & 0x80) !== 0;
    const opcode = firstByte & 0x0f;
    let offset = 2;
    let payloadLength = secondByte & 0x7f;

    if (payloadLength === 126) {
      if (connection.handshakeBuffer.length < offset + 2) {
        return;
      }

      payloadLength = connection.handshakeBuffer.readUInt16BE(offset);
      offset += 2;
    } else if (payloadLength === 127) {
      if (connection.handshakeBuffer.length < offset + 8) {
        return;
      }

      const payloadLengthBigInt = connection.handshakeBuffer.readBigUInt64BE(offset);
      payloadLength = Number(payloadLengthBigInt);
      offset += 8;
    }

    const masked = (secondByte & 0x80) !== 0;
    const maskLength = masked ? 4 : 0;

    if (connection.handshakeBuffer.length < offset + maskLength + payloadLength) {
      return;
    }

    let mask: Buffer | undefined;
    if (masked) {
      mask = connection.handshakeBuffer.subarray(offset, offset + 4);
      offset += 4;
    }

    const payload = Buffer.from(
      connection.handshakeBuffer.subarray(offset, offset + payloadLength)
    );
    connection.handshakeBuffer = connection.handshakeBuffer.subarray(
      offset + payloadLength
    );

    if (mask) {
      for (let index = 0; index < payload.length; index += 1) {
        payload[index] = payload[index]! ^ mask[index % 4]!;
      }
    }

    if (opcode === 0x8) {
      connection.socket.end();
      return;
    }

    if (opcode === 0x9) {
      sendWebSocketFrame(connection.socket, payload, 0x0a);
      continue;
    }

    if (opcode === 0x1) {
      if (!fin) {
        connection.partialTextFrames = [payload];
        continue;
      }

      const message = payload.toString("utf8");
      const resolver = connection.waitingResolvers.shift();

      if (resolver) {
        resolver(message);
        continue;
      }

      connection.messageQueue.push(message);
      continue;
    }

    if (opcode === 0x0 && connection.partialTextFrames.length > 0) {
      connection.partialTextFrames.push(payload);

      if (!fin) {
        continue;
      }

      const message = Buffer.concat(connection.partialTextFrames).toString("utf8");
      connection.partialTextFrames = [];
      const resolver = connection.waitingResolvers.shift();

      if (resolver) {
        resolver(message);
        continue;
      }

      connection.messageQueue.push(message);
      continue;
    }

    if (opcode !== 0x1 && opcode !== 0x0) {
      continue;
    }
  }
}

function sendWebSocketFrame(
  socket: net.Socket,
  payload: Buffer,
  opcode: number
): void {
  const mask = randomBytes(4);
  const payloadLength = payload.length;
  let header: Buffer;

  if (payloadLength < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x80 | opcode;
    header[1] = 0x80 | payloadLength;
  } else if (payloadLength < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x80 | opcode;
    header[1] = 0x80 | 126;
    header.writeUInt16BE(payloadLength, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x80 | opcode;
    header[1] = 0x80 | 127;
    header.writeBigUInt64BE(BigInt(payloadLength), 2);
  }

  const maskedPayload = Buffer.from(payload);
  for (let index = 0; index < maskedPayload.length; index += 1) {
    maskedPayload[index] = maskedPayload[index]! ^ mask[index % 4]!;
  }

  socket.write(Buffer.concat([header, mask, maskedPayload]));
}

async function connectWebSocket(endpoint: string): Promise<WebSocketConnection> {
  const url = new URL(endpoint);
  const port = url.port === "" ? 80 : Number.parseInt(url.port, 10);
  const key = randomBytes(16).toString("base64");

  return await new Promise<WebSocketConnection>((resolve, reject) => {
    const socket = net.createConnection({ host: url.hostname, port });
    const connection: WebSocketConnection = {
      handshakeBuffer: Buffer.alloc(0),
      messageQueue: [],
      partialTextFrames: [],
      socket,
      waitingResolvers: []
    };

    let resolved = false;
    let handshakeComplete = false;

    socket.once("error", reject);
    socket.once("connect", () => {
      socket.write(
        [
          `GET ${url.pathname}${url.search} HTTP/1.1`,
          `Host: ${url.host}`,
          "Upgrade: websocket",
          "Connection: Upgrade",
          `Sec-WebSocket-Key: ${key}`,
          "Sec-WebSocket-Version: 13",
          "",
          ""
        ].join("\r\n")
      );
    });
    socket.on("data", (chunk: Buffer) => {
      connection.handshakeBuffer = Buffer.concat([connection.handshakeBuffer, chunk]);

      if (!handshakeComplete) {
        const separatorIndex = connection.handshakeBuffer.indexOf("\r\n\r\n");

        if (separatorIndex === -1) {
          return;
        }

        const headerText = connection.handshakeBuffer
          .subarray(0, separatorIndex)
          .toString("utf8");

        if (!headerText.includes("101")) {
          reject(new Error(`WebSocket handshake failed.\n${headerText}`));
          socket.destroy();
          return;
        }

        handshakeComplete = true;
        connection.handshakeBuffer = connection.handshakeBuffer.subarray(
          separatorIndex + 4
        );

        if (!resolved) {
          resolved = true;
          resolve(connection);
        }
      }

      decodeWebSocketFrames(connection);
    });
    socket.once("close", () => {
      if (!resolved) {
        reject(new Error(`WebSocket closed before the handshake completed: ${endpoint}`));
      }
    });
  });
}

function waitForWebSocketMessage(
  connection: WebSocketConnection,
  timeoutMs: number
): Promise<string> {
  if (connection.messageQueue.length > 0) {
    return Promise.resolve(connection.messageQueue.shift()!);
  }

  return new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timed out waiting for a DevTools websocket message after ${timeoutMs}ms.`));
    }, timeoutMs);

    connection.waitingResolvers.push((message) => {
      clearTimeout(timeout);
      resolve(message);
    });
  });
}

function sendWebSocketText(connection: WebSocketConnection, text: string): void {
  sendWebSocketFrame(connection.socket, Buffer.from(text, "utf8"), 0x1);
}

function getBrowserCandidates(): string[] {
  return [
    process.env.RADEBE_BROWSER_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
  ].filter((candidate): candidate is string => Boolean(candidate));
}

function getAvailableBrowserPaths(): string[] {
  const browserPaths = getBrowserCandidates().filter((candidate) =>
    existsSync(candidate)
  );

  if (browserPaths.length === 0) {
    throw new Error(
      "Unable to find a local Edge or Chrome executable. Set RADEBE_BROWSER_PATH if needed."
    );
  }

  return browserPaths;
}

async function runBrowserProbe(
  browserPath: string,
  url: string,
  timeoutMs: number,
  reportPromise: Promise<string>
): Promise<PerfSuiteReport> {
  const userDataDir = await mkdtemp(
    path.join(os.tmpdir(), "radebe-web-page-perf-")
  );
  const headlessEnabled = process.env.RADEBE_BROWSER_HEADLESS === "1";
  const browser = spawn(
    browserPath,
    [
      ...(headlessEnabled ? ["--headless=new"] : []),
      "--hide-scrollbars",
      "--mute-audio",
      "--no-default-browser-check",
      "--no-first-run",
      `--user-data-dir=${userDataDir}`,
      url
    ],
    {
      stdio: ["ignore", "pipe", "pipe"]
    }
  );

  let stderr = "";
  browser.stderr.setEncoding("utf8");
  browser.stderr.on("data", (chunk: string) => {
    stderr += chunk;
  });

  try {
    const reportBody = await Promise.race([
      reportPromise,
      new Promise<string>((_resolve, reject) => {
        setTimeout(() => {
          reject(new Error(`Timed out waiting for the browser perf suite report.\n${stderr}`));
        }, timeoutMs);
      })
    ]);

    return JSON.parse(reportBody) as PerfSuiteReport;
  } finally {
    browser.kill();
    await rm(userDataDir, { force: true, recursive: true }).catch(() => {
      // Best-effort cleanup for the temporary Chrome profile.
    });
  }
}

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

function roundMs(value: number | null): string {
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

function toRouteProbeResult(
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

function getSortMetric(result: RouteProbeResult): number {
  return (
    result.metrics.pageFirstFrameMs ??
    result.metrics.appFirstFrameMs ??
    result.metrics.loadEventEndMs ??
    0
  );
}

function formatResourceName(resourceUrl: string): string {
  try {
    const parsed = new URL(resourceUrl);
    const pathname = parsed.pathname === "/" ? parsed.origin : parsed.pathname;
    return `${pathname}${parsed.search}`;
  } catch {
    return resourceUrl;
  }
}

function buildMarkdownReport(results: RouteProbeResult[]): string {
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

function reportFromProgress(progress: PerfSuiteProgress[]): PerfSuiteReport {
  const pagesById = new Map<string, PerfSuiteReport["pages"][number]>();

  for (const item of progress) {
    pagesById.set(item.page.pageId, item.page);
  }

  return {
    generatedAt: new Date().toISOString(),
    pages: [...pagesById.values()]
  };
}

function parseCommandLine(argv: string[]): {
  port: number;
  virtualTimeBudgetMs: number;
} {
  let port = DEFAULT_PORT;
  let virtualTimeBudgetMs = DEFAULT_VIRTUAL_TIME_BUDGET_MS;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const value = argv[index + 1];

    switch (token) {
      case "--port":
        port = Number.parseInt(value ?? "", 10);
        index += 1;
        break;
      case "--virtual-time-budget":
        virtualTimeBudgetMs = Number.parseInt(value ?? "", 10);
        index += 1;
        break;
      case "--help":
      case "-h":
      case "help":
        process.stdout.write(
          [
            "Usage: node ./scripts/dist/src/web-page-perf.js [options]",
            "",
            "Options:",
            "  --port <number>                  Override the local static server port.",
            "  --virtual-time-budget <number>   Override the headless browser virtual time budget in milliseconds."
          ].join("\n")
        );
        process.stdout.write("\n");
        process.exit(0);
      default:
        if (token.startsWith("--")) {
          throw new Error(`Unknown argument: ${token}`);
        }
    }
  }

  return {
    port,
    virtualTimeBudgetMs
  };
}

async function main(argv: string[]): Promise<number> {
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

      const sortedResults = [...results].sort(
        (left, right) => getSortMetric(right) - getSortMetric(left)
      );
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

const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (entryPath === fileURLToPath(import.meta.url)) {
  process.exit(await main(process.argv.slice(2)));
}
