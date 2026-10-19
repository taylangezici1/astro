// Typecheck with the TypeScript version this app depends on (Expo SDK 57
// expects 6.x), not whichever `tsc` Yarn finds first on PATH — the repo root
// pins 5.9 for the API.
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const appDir = path.resolve(__dirname, "..");
const tsc = require.resolve("typescript/bin/tsc", { paths: [appDir] });
const { status } = spawnSync(process.execPath, [tsc, "--noEmit"], {
  cwd: appDir,
  stdio: "inherit",
});
process.exit(status ?? 1);
