import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { createDependencies } from "../../src/config/di.js";
import { loadEnv } from "../../src/config/env.js";

describe("Health endpoints", () => {
  const env = loadEnv({ ...process.env, NODE_ENV: "test", MONGODB_URI: "mongodb://127.0.0.1:27017/test" });
  const deps = createDependencies(env);
  const app = createApp(deps);

  it("GET /health returns 200", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  it("GET /ready returns 503 when database is disconnected", async () => {
    const response = await request(app).get("/ready");

    expect(response.status).toBe(503);
    expect(response.body.status).toBe("not_ready");
  });
});
