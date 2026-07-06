import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { createDependencies } from "../../src/config/di.js";
import { loadEnv } from "../../src/config/env.js";

describe("Admin routes", () => {
  const env = loadEnv({
    ...process.env,
    NODE_ENV: "test",
    MONGODB_URI: "mongodb://127.0.0.1:27017/test",
  });
  const deps = createDependencies(env);
  const app = createApp(deps);

  it("GET /api/v1/admin/dashboard requires authentication", async () => {
    const response = await request(app).get("/api/v1/admin/dashboard");
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("AUTH_REQUIRED");
  });

  it("GET /api/v1/admin/reports requires authentication", async () => {
    const response = await request(app).get("/api/v1/admin/reports");
    expect(response.status).toBe(401);
  });

  it("GET /api/v1/admin/users requires authentication", async () => {
    const response = await request(app).get("/api/v1/admin/users");
    expect(response.status).toBe(401);
  });

  it("GET /api/v1/admin/audit-logs requires authentication", async () => {
    const response = await request(app).get("/api/v1/admin/audit-logs");
    expect(response.status).toBe(401);
  });

  it("GET /api/v1/notifications requires authentication", async () => {
    const response = await request(app).get("/api/v1/notifications");
    expect(response.status).toBe(401);
  });
});
