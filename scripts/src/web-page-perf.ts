import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { main } from "./web-page-perf/cli.js";

const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (entryPath === fileURLToPath(import.meta.url)) {
  process.exit(await main(process.argv.slice(2)));
}
