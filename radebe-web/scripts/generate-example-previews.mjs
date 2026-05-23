import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

import {
  parseRadebeColorToken,
  renderSource
} from "../../radebe-core/dist/src/index.js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(scriptDir, "..");
const publicRoot = path.join(webRoot, "public");
const generatedBrandRoot = path.join(publicRoot, "generated", "brand");
const generatedRoot = path.join(publicRoot, "generated", "examples");
const brandIconPath = path.join(webRoot, "src", "content", "brand-icon.json");
const examplesPath = path.join(webRoot, "src", "content", "examples.json");

const pngSignature = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
]);

function createCrcTable() {
  const table = new Uint32Array(256);

  for (let index = 0; index < table.length; index += 1) {
    let value = index;

    for (let bit = 0; bit < 8; bit += 1) {
      value =
        value & 1
          ? 0xedb88320 ^ (value >>> 1)
          : value >>> 1;
    }

    table[index] = value >>> 0;
  }

  return table;
}

const crcTable = createCrcTable();

function crc32(buffers) {
  let crc = 0xffffffff;

  buffers.forEach((buffer) => {
    for (const byte of buffer) {
      crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    }
  });

  return (crc ^ 0xffffffff) >>> 0;
}

function createPngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  const checksum = Buffer.alloc(4);

  length.writeUInt32BE(data.length, 0);
  checksum.writeUInt32BE(crc32([typeBuffer, data]), 0);

  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function parsePixel(pixel) {
  if (pixel === null) {
    return [0, 0, 0, 0];
  }

  const color = parseRadebeColorToken(pixel);

  if (!color) {
    throw new Error(`Cannot encode preview pixel color "${pixel}"`);
  }

  return [
    Math.round(color.r),
    Math.round(color.g),
    Math.round(color.b),
    Math.round(color.a * 255)
  ];
}

function encodePng(artifact) {
  const width = Math.max(artifact.width, 1);
  const height = Math.max(artifact.height, 1);
  const header = Buffer.alloc(13);
  const stride = width * 4 + 1;
  const raw = Buffer.alloc(stride * height);

  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * stride;

    raw[rowOffset] = 0;

    for (let x = 0; x < width; x += 1) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = parsePixel(artifact.pixels[y]?.[x] ?? null);

      raw[pixelOffset] = r;
      raw[pixelOffset + 1] = g;
      raw[pixelOffset + 2] = b;
      raw[pixelOffset + 3] = a;
    }
  }

  return Buffer.concat([
    pngSignature,
    createPngChunk("IHDR", header),
    createPngChunk("IDAT", deflateSync(raw)),
    createPngChunk("IEND", Buffer.alloc(0))
  ]);
}

function getPreviewOutputPath(previewPath) {
  const relativePreviewPath = previewPath.replace(/^\/+/, "");

  if (
    relativePreviewPath === "" ||
    relativePreviewPath.includes("..") ||
    path.isAbsolute(relativePreviewPath)
  ) {
    throw new Error(`Unsafe preview output path "${previewPath}"`);
  }

  return path.join(publicRoot, relativePreviewPath);
}

async function readJsonFile(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

const brandIcon = await readJsonFile(brandIconPath);
const examples = await readJsonFile(examplesPath);

await rm(generatedBrandRoot, { recursive: true, force: true });
await rm(generatedRoot, { recursive: true, force: true });
await mkdir(generatedBrandRoot, { recursive: true });
await mkdir(generatedRoot, { recursive: true });

const previewSources = [brandIcon, ...examples];

for (const previewSource of previewSources) {
  const source = previewSource.source.join("\n");
  const result = renderSource({ source });

  if (result.diagnostics.length > 0) {
    const messages = result.diagnostics
      .map((diagnostic) => diagnostic.message)
      .join("\n");

    throw new Error(`Cannot render preview for ${previewSource.id}:\n${messages}`);
  }

  const outputPath = getPreviewOutputPath(previewSource.preview);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, encodePng(result.artifact));
}

console.log(
  `Generated ${examples.length} example preview image(s) and 1 brand icon.`
);
