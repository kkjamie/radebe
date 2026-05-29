import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import type { PerfSuiteReport } from "./types.js";

type WebSocketConnection = {
  handshakeBuffer: Buffer;
  messageQueue: string[];
  partialTextFrames: Buffer[];
  socket: net.Socket;
  waitingResolvers: Array<(message: string) => void>;
};

export async function getFreePort(): Promise<number> {
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

export async function connectWebSocket(
  endpoint: string
): Promise<WebSocketConnection> {
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

export function waitForWebSocketMessage(
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

export function sendWebSocketText(
  connection: WebSocketConnection,
  text: string
): void {
  sendWebSocketFrame(connection.socket, Buffer.from(text, "utf8"), 0x1);
}

function getBrowserCandidates(): string[] {
  return [
    process.env.RADEBE_BROWSER_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
  ].filter((candidate): candidate is string => Boolean(candidate));
}

export function getAvailableBrowserPaths(): string[] {
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

export async function runBrowserProbe(
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
