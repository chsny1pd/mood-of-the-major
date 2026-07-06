/**
 * Post-deploy smoke test — run against staging or production API.
 *
 * Usage:
 *   API_BASE_URL=https://api.example.com/api/v1 npm run smoke
 *   API_BASE_URL=https://api.example.com/api/v1 SMOKE_REGISTER=true npm run smoke
 */
import "dotenv/config";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000/api/v1";
const SMOKE_REGISTER = process.env.SMOKE_REGISTER === "true";

interface CheckResult {
  name: string;
  ok: boolean;
  detail?: string;
}

async function check(name: string, fn: () => Promise<void>): Promise<CheckResult> {
  try {
    await fn();
    return { name, ok: true };
  } catch (error) {
    return {
      name,
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

async function fetchJson(path: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  return response;
}

async function main(): Promise<void> {
  const results: CheckResult[] = [];

  results.push(
    await check("GET /health", async () => {
      const base = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
      const response = await fetch(`${base}/health`);
      if (!response.ok) throw new Error(`status ${response.status}`);
      const body = (await response.json()) as { status?: string };
      if (body.status !== "ok") throw new Error("unexpected health body");
    }),
  );

  results.push(
    await check("GET /ready", async () => {
      const base = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
      const response = await fetch(`${base}/ready`);
      if (!response.ok) throw new Error(`status ${response.status}`);
    }),
  );

  results.push(
    await check("GET /faculties", async () => {
      const response = await fetchJson("/faculties");
      if (!response.ok) throw new Error(`status ${response.status}`);
      const body = (await response.json()) as { success?: boolean; data?: unknown[] };
      if (!body.success || !Array.isArray(body.data)) throw new Error("invalid envelope");
    }),
  );

  results.push(
    await check("GET /tags", async () => {
      const response = await fetchJson("/tags");
      if (!response.ok) throw new Error(`status ${response.status}`);
      const body = (await response.json()) as { success?: boolean; data?: unknown[] };
      if (!body.success || body.data?.length === 0) throw new Error("no tags returned");
    }),
  );

  results.push(
    await check("GET /moods/feed (public)", async () => {
      const response = await fetchJson("/moods/feed");
      if (!response.ok) throw new Error(`status ${response.status}`);
      const body = (await response.json()) as { success?: boolean };
      if (!body.success) throw new Error("feed envelope invalid");
    }),
  );

  if (SMOKE_REGISTER) {
    const email = `smoke-${Date.now()}@test.local`;
    const password = "SmokeTest1";

    results.push(
      await check("POST /auth/register", async () => {
        const response = await fetchJson("/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (response.status !== 201) throw new Error(`status ${response.status}`);
      }),
    );

    let accessToken = "";

    results.push(
      await check("POST /auth/login", async () => {
        const response = await fetchJson("/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!response.ok) throw new Error(`status ${response.status}`);
        const body = (await response.json()) as {
          data?: { tokens?: { accessToken?: string } };
        };
        accessToken = body.data?.tokens?.accessToken ?? "";
        if (!accessToken) throw new Error("missing access token");
      }),
    );

    results.push(
      await check("GET /auth/me", async () => {
        const response = await fetchJson("/auth/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) throw new Error(`status ${response.status}`);
      }),
    );
  }

  const failed = results.filter((result) => !result.ok);

  for (const result of results) {
    const status = result.ok ? "PASS" : "FAIL";
    console.log(`${status}  ${result.name}${result.detail ? ` — ${result.detail}` : ""}`);
  }

  if (failed.length > 0) {
    console.error(`\nSmoke test failed: ${failed.length}/${results.length} checks`);
    process.exit(1);
  }

  console.log(`\nSmoke test passed: ${results.length}/${results.length} checks`);
}

main().catch((error) => {
  console.error("Smoke test error:", error);
  process.exit(1);
});
