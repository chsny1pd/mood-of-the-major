#!/usr/bin/env node
/**
 * Registers the official MongoDB MCP server in ~/.cursor/mcp.json
 * using MONGODB_URI from backend/.env (never committed).
 *
 * Usage: node scripts/setup-mongodb-mcp.mjs [--read-only]
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const envPath = path.join(repoRoot, "backend", ".env");
const mcpPath = path.join(os.homedir(), ".cursor", "mcp.json");
const readOnly = process.argv.includes("--read-only");

function parseMongoUri(content) {
  const match = content.match(/^MONGODB_URI=(.+)$/m);
  if (!match) {
    throw new Error("MONGODB_URI not found in backend/.env");
  }
  return match[1].trim();
}

if (!fs.existsSync(envPath)) {
  console.error("Missing backend/.env — copy from backend/.env.example first.");
  process.exit(1);
}

const uri = parseMongoUri(fs.readFileSync(envPath, "utf8"));

const args = ["-y", "mongodb-mcp-server@latest"];
if (readOnly) {
  args.push("--readOnly");
}

const mongodbServer = {
  command: "npx",
  args,
  env: {
    MDB_MCP_CONNECTION_STRING: uri,
  },
};

let config = { mcpServers: {} };
if (fs.existsSync(mcpPath)) {
  config = JSON.parse(fs.readFileSync(mcpPath, "utf8"));
}
config.mcpServers ??= {};
config.mcpServers.mongodb = mongodbServer;

fs.mkdirSync(path.dirname(mcpPath), { recursive: true });
fs.writeFileSync(mcpPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");

console.log(`Updated ${mcpPath}`);
console.log(`MongoDB MCP: ${readOnly ? "read-only" : "read/write"} mode`);
console.log("Restart Cursor, then verify MongoDB tools appear under MCP.");
