import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { createDependencies } from "../../src/config/di.js";
import { loadEnv } from "../../src/config/env.js";

describe("API contract", () => {
  const env = loadEnv({
    ...process.env,
    NODE_ENV: "test",
    MONGODB_URI: "mongodb://127.0.0.1:27017/test",
  });
  const deps = createDependencies(env);
  const app = createApp(deps);

  it("error responses use the standard envelope with requestId", async () => {
    const response = await request(app).get("/api/v1/auth/me");

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: expect.any(String),
        message: expect.any(String),
      },
      requestId: expect.any(String),
    });
    expect(response.headers["x-request-id"]).toBe(response.body.requestId);
  });

  it("validation errors return 422 with VALIDATION_FAILED", async () => {
    const response = await request(app).post("/api/v1/auth/register").send({
      email: "bad",
      password: "short",
    });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION_FAILED");
    expect(response.body.requestId).toBeDefined();
  });

  it("GET /health returns ok status", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: "ok" });
  });
});
