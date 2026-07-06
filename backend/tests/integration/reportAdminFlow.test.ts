import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import {
  clearTransactionalData,
  connectIntegrationDatabase,
  createIntegrationContext,
  disconnectIntegrationDatabase,
  isMongoAvailable,
  promoteUserToAdmin,
  registerStudent,
  seedReferenceData,
} from "../helpers/integrationSetup.js";

const mongoAvailable = await isMongoAvailable();

describe.skipIf(!mongoAvailable)("Report and admin flow (integration)", () => {
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

  it("allows admin to list and dismiss a pending report", async () => {
    const authorEmail = `report-author-${Date.now()}@test.local`;
    const reporterEmail = `report-reporter-${Date.now()}@test.local`;
    const adminEmail = `report-admin-${Date.now()}@test.local`;

    const author = await registerStudent(ctx.app, authorEmail);
    const reporter = await registerStudent(ctx.app, reporterEmail);
    await registerStudent(ctx.app, adminEmail);
    await promoteUserToAdmin(adminEmail);

    const adminLogin = await request(ctx.app)
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password: "TestPass1" });

    const adminToken = adminLogin.body.data.tokens.accessToken as string;

    const mood = await request(ctx.app)
      .post("/api/v1/moods")
      .set("Authorization", `Bearer ${author.accessToken}`)
      .send({
        content: "Reportable mood content for admin flow test.",
        tagIds: [stressTagId],
        primaryTagId: stressTagId,
      });

    const moodId = mood.body.data.id as string;

    const report = await request(ctx.app)
      .post(`/api/v1/moods/${moodId}/report`)
      .set("Authorization", `Bearer ${reporter.accessToken}`)
      .send({ reasonCode: "spam" });

    expect(report.status).toBe(201);

    const pending = await request(ctx.app)
      .get("/api/v1/admin/reports")
      .query({ status: "pending" })
      .set("Authorization", `Bearer ${adminToken}`);

    expect(pending.status).toBe(200);
    expect(pending.body.data.some((item: { targetId: string }) => item.targetId === moodId)).toBe(
      true,
    );

    const reportId = pending.body.data.find(
      (item: { targetId: string }) => item.targetId === moodId,
    ).id as string;

    const resolve = await request(ctx.app)
      .post(`/api/v1/admin/reports/${reportId}/resolve`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "resolved_dismissed" });

    expect(resolve.status).toBe(200);

    const cleared = await request(ctx.app)
      .get("/api/v1/admin/reports")
      .query({ status: "pending" })
      .set("Authorization", `Bearer ${adminToken}`);

    expect(
      cleared.body.data.some((item: { id: string }) => item.id === reportId),
    ).toBe(false);
  });

  it("rejects student access to admin reports", async () => {
    const email = `report-student-${Date.now()}@test.local`;
    const { accessToken } = await registerStudent(ctx.app, email);

    const response = await request(ctx.app)
      .get("/api/v1/admin/reports")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("INSUFFICIENT_ROLE");
  });
});
