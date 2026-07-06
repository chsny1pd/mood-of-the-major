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

describe.skipIf(!mongoAvailable)("Mood flow (integration)", () => {
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

  it("creates a mood and returns it in the public feed without identity fields", async () => {
    const email = `mood-flow-${Date.now()}@test.local`;
    const { accessToken } = await registerStudent(ctx.app, email);
    const content = "Integration test mood — feeling stressed about exams.";

    const create = await request(ctx.app)
      .post("/api/v1/moods")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        content,
        tagIds: [stressTagId],
        primaryTagId: stressTagId,
      });

    expect(create.status).toBe(201);
    expect(create.body.data.content).toBe(content);
    expect(JSON.stringify(create.body.data)).not.toContain("authorId");

    const feed = await request(ctx.app).get("/api/v1/moods/feed");

    expect(feed.status).toBe(200);
    expect(feed.body.data.some((mood: { content: string }) => mood.content === content)).toBe(true);
    expect(JSON.stringify(feed.body.data)).not.toContain("authorId");
  });

  it("returns mood detail for authenticated user without author identity", async () => {
    const email = `mood-detail-${Date.now()}@test.local`;
    const { accessToken } = await registerStudent(ctx.app, email);

    const create = await request(ctx.app)
      .post("/api/v1/moods")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        content: "Detail page anonymity check.",
        tagIds: [stressTagId],
        primaryTagId: stressTagId,
      });

    const moodId = create.body.data.id as string;

    const detail = await request(ctx.app)
      .get(`/api/v1/moods/${moodId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(detail.status).toBe(200);
    expect(detail.body.data.id).toBe(moodId);
    expect(JSON.stringify(detail.body.data)).not.toContain("authorId");
  });
});
