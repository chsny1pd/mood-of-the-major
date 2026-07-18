import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { createDependencies } from "../../src/config/di.js";
import { loadEnv } from "../../src/config/env.js";

describe("Engagement routes", () => {
  const env = loadEnv({
    ...process.env,
    NODE_ENV: "test",
    MONGODB_URI: "mongodb://127.0.0.1:27017/test",
  });
  const deps = createDependencies(env);
  const app = createApp(deps);

  it("GET /api/v1/moods/search is public with optional auth", async () => {
    const response = await request(app).get("/api/v1/moods/search").query({ q: "hello" });

    // Without a live DB this may 500/503; it must not require auth (401).
    expect(response.status).not.toBe(401);
    if (response.body?.error?.code) {
      expect(response.body.error.code).not.toBe("AUTH_REQUIRED");
    }
  });

  it("GET /api/v1/bookmarks requires authentication", async () => {
    const response = await request(app).get("/api/v1/bookmarks");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("AUTH_REQUIRED");
  });

  it("GET /api/v1/bookmarks/status/:moodId requires authentication", async () => {
    const response = await request(app).get("/api/v1/bookmarks/status/665a1b2c3d4e5f6789012348");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("AUTH_REQUIRED");
  });

  it("POST /api/v1/bookmarks requires authentication", async () => {
    const response = await request(app)
      .post("/api/v1/bookmarks")
      .send({ moodId: "665a1b2c3d4e5f6789012348" });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("AUTH_REQUIRED");
  });

  it("PUT /api/v1/reactions requires authentication", async () => {
    const response = await request(app).put("/api/v1/reactions").send({
      targetType: "mood",
      targetId: "665a1b2c3d4e5f6789012348",
      emoji: "💙",
    });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("AUTH_REQUIRED");
  });

  it("GET /api/v1/statistics/dashboard requires authentication", async () => {
    const response = await request(app).get("/api/v1/statistics/dashboard");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("AUTH_REQUIRED");
  });
});
