/**
 * Wrapper around `lhci autorun` that:
 * 1. Uses a short Chrome temp dir so Unix domain sockets stay under the
 *    ~107-char path limit (repo paths like
 *    /home/runner/work/.../frontend/.lh-tmp/... fail on GitHub Actions).
 * 2. Softens chrome-launcher's destroyTmp() on Windows, where EPERM/EBUSY
 *    after a successful run would otherwise make `lhci` exit 1.
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const launcherPath = join(
  root,
  "node_modules",
  "lighthouse",
  "node_modules",
  "chrome-launcher",
  "dist",
  "chrome-launcher.js",
);

const MARKER = "EPERM_SOFT_CLEANUP";
let source = readFileSync(launcherPath, "utf8");

if (!source.includes(MARKER)) {
  const needle = "rmSync(this.userDataDir, { recursive: true, force: true, maxRetries: 10 });";
  if (!source.includes(needle)) {
    console.warn("chrome-launcher destroyTmp pattern not found; skipping patch");
  } else {
    source = source.replace(
      needle,
      `try { rmSync(this.userDataDir, { recursive: true, force: true, maxRetries: 10 }); } catch (e) { if (e && (e.code === "EPERM" || e.code === "EBUSY" || e.code === "ENOENT")) { /* ${MARKER} */ return; } throw e; }`,
    );
    writeFileSync(launcherPath, source);
  }
}

/** Short base path: /tmp on Unix, OS temp on Windows (no Unix socket limit). */
const tmpRoot = process.platform === "win32" ? join(tmpdir(), "lhci") : "/tmp/lhci";
mkdirSync(tmpRoot, { recursive: true });
const chromeTmp = mkdtempSync(join(tmpRoot, "run-"));

let exitCode = 1;
try {
  const result = spawnSync("npx", ["lhci", "autorun"], {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      TEMP: chromeTmp,
      TMP: chromeTmp,
      TMPDIR: chromeTmp,
    },
  });
  exitCode = result.status ?? 1;
} finally {
  try {
    rmSync(chromeTmp, { recursive: true, force: true, maxRetries: 10 });
  } catch (e) {
    const code = e && typeof e === "object" && "code" in e ? e.code : undefined;
    // Chrome may still hold locks briefly on Windows; ignore soft failures.
    if (code !== "EPERM" && code !== "EBUSY" && code !== "ENOENT") {
      console.warn("Failed to clean Chrome temp dir:", chromeTmp, e);
    }
  }
}

process.exit(exitCode);
