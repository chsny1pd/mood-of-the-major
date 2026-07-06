import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { createDependencies } from "../../src/config/di.js";
import { loadEnv } from "../../src/config/env.js";

describe("Statistics routes", () => {
  const env = loadEnv({
    ...process.env,
    NODE_ENV: "test",
    MONGODB_URI: "mongodb://127.0.0.1:27017/test",
    SERVICE_API_KEY: "test-service-key",
  });
  const deps = createDependencies(env);
  const app = createApp(deps);

  it("GET /api/v1/statistics/dashboard requires authentication", async () => {
    const response = await request(app).get("/api/v1/statistics/dashboard");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("AUTH_REQUIRED");
  });

  it("POST /api/v1/internal/jobs/aggregate-statistics rejects missing API key", async () => {
    const response = await request(app).post("/api/v1/internal/jobs/aggregate-statistics");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("POST /api/v1/internal/jobs/aggregate-statistics rejects invalid API key", async () => {
    const response = await request(app)
      .post("/api/v1/internal/jobs/aggregate-statistics")
      .set("x-service-api-key", "wrong-key");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });
});
