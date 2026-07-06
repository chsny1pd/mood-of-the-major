import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { createDependencies } from "../../src/config/di.js";
import { loadEnv } from "../../src/config/env.js";

describe("Mood routes", () => {
  const env = loadEnv({
    ...process.env,
    NODE_ENV: "test",
    MONGODB_URI: "mongodb://127.0.0.1:27017/test",
  });
  const deps = createDependencies(env);
  const app = createApp(deps);

  it("POST /api/v1/moods requires authentication", async () => {
    const response = await request(app).post("/api/v1/moods").send({
      content: "Hello world",
      tagIds: ["665a1b2c3d4e5f6789012349"],
      primaryTagId: "665a1b2c3d4e5f6789012349",
    });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("AUTH_REQUIRED");
  });

  it("POST /api/v1/images/upload-url requires authentication", async () => {
    const response = await request(app).post("/api/v1/images/upload-url").send({
      fileName: "photo.gif",
      mimeType: "image/gif",
      fileSizeBytes: 1024,
    });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("AUTH_REQUIRED");
  });
});
