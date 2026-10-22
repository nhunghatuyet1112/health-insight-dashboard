import { spawn, spawnSync } from "node:child_process";
const compiled = spawnSync(
  process.execPath,
  ["node_modules/typescript/bin/tsc", "-p", "tsconfig.server.json"],
  { stdio: "inherit" },
);
if (compiled.status !== 0) process.exit(compiled.status ?? 1);
const api = spawn(
  process.execPath,
  ["--env-file-if-exists=.env", "dist-server/server/index.js", "--api-only"],
  { stdio: "inherit" },
);
const vite = spawn(
  process.execPath,
  ["node_modules/vite/bin/vite.js", ...process.argv.slice(2)],
  { stdio: "inherit" },
);
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  api.kill("SIGTERM");
  vite.kill("SIGTERM");
  process.exitCode = code;
}
api.on("exit", (code) => stop(code ?? 0));
vite.on("exit", (code) => stop(code ?? 0));
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
