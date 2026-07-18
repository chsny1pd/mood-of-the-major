/**
 * Chrome on Windows often keeps locks on the user-data dir long enough that
 * chrome-launcher's destroyTmp() throws EPERM and makes `lhci autorun` exit 1
 * even after a successful Lighthouse run. Soften that cleanup so CI/local
 * Windows can assert scores.
 */
import { readFileSync, writeFileSync } from "node:fs";
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

const result = spawnSync("npx", ["lhci", "autorun"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    TEMP: join(root, ".lh-tmp"),
    TMP: join(root, ".lh-tmp"),
    TMPDIR: join(root, ".lh-tmp"),
  },
});

process.exit(result.status ?? 1);
