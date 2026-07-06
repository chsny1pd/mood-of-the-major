import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import {
  clearTransactionalData,
  connectIntegrationDatabase,
  createIntegrationContext,
  disconnectIntegrationDatabase,
  isMongoAvailable,
  registerStudent,
  seedReferenceData,
} from "../helpers/integrationSetup.js";

const mongoAvailable = await isMongoAvailable();
const PNG_BYTES = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

describe.skipIf(!mongoAvailable)("Image upload flow (integration)", () => {
  const ctx = createIntegrationContext();
  let stressTagId = "";

  beforeAll(async () => {
    await connectIntegrationDatabase(ctx.deps);
    const seeded = await seedReferenceData();
    stressTagId = seeded.stressTagId;
  });

  beforeEach(async () => {
    await clearTransactionalData();
  });

  afterAll(async () => {
    await disconnectIntegrationDatabase(ctx.deps);
  });

  it("presigns, uploads via proxy, confirms, and attaches image to mood", async () => {
    const email = `image-flow-${Date.now()}@test.local`;
    const { accessToken } = await registerStudent(ctx.app, email);

    const presign = await request(ctx.app)
      .post("/api/v1/images/upload-url")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        fileName: "test.png",
        mimeType: "image/png",
        fileSizeBytes: PNG_BYTES.byteLength,
      });

    expect(presign.status).toBe(201);
    expect(presign.body.data.uploadVia).toBe("proxy");

    const imageId = presign.body.data.imageId as string;

    const upload = await request(ctx.app)
      .put(`/api/v1/images/${imageId}/data`)
      .set("Authorization", `Bearer ${accessToken}`)
      .set("Content-Type", "image/png")
      .send(PNG_BYTES);

    expect(upload.status).toBe(204);

    const confirm = await request(ctx.app)
      .post(`/api/v1/images/${imageId}/confirm`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({});

    expect(confirm.status).toBe(200);
    expect(confirm.body.data.status).toBe("confirmed");

    const mood = await request(ctx.app)
      .post("/api/v1/moods")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        content: "Mood with attached image.",
        tagIds: [stressTagId],
        primaryTagId: stressTagId,
        imageIds: [imageId],
      });

    expect(mood.status).toBe(201);
    expect(mood.body.data.images).toHaveLength(1);
    expect(mood.body.data.images[0].id).toBe(imageId);
  });

  it("rejects invalid MIME type on presign", async () => {
    const email = `image-mime-${Date.now()}@test.local`;
    const { accessToken } = await registerStudent(ctx.app, email);

    const presign = await request(ctx.app)
      .post("/api/v1/images/upload-url")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        fileName: "bad.pdf",
        mimeType: "application/pdf",
        fileSizeBytes: 1024,
      });

    expect(presign.status).toBe(422);
    expect(presign.body.error.code).toBe("VALIDATION_FAILED");
  });
});
