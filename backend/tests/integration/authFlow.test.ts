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

describe.skipIf(!mongoAvailable)("Auth flow (integration)", () => {
  const ctx = createIntegrationContext();

  beforeAll(async () => {
    await connectIntegrationDatabase(ctx.deps);
    await seedReferenceData();
  });

  beforeEach(async () => {
    await clearTransactionalData();
  });

  afterAll(async () => {
    await disconnectIntegrationDatabase(ctx.deps);
  });

  it("registers a student and returns a valid session", async () => {
    const email = `auth-flow-${Date.now()}@test.local`;
    const { accessToken } = await registerStudent(ctx.app, email);

    const me = await request(ctx.app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe(email.toLowerCase());
    expect(me.body.data.role).toBe("student");
  });

  it("logs in with valid credentials", async () => {
    const email = `auth-login-${Date.now()}@test.local`;
    const password = "TestPass1";

    await registerStudent(ctx.app, email, password);

    const login = await request(ctx.app).post("/api/v1/auth/login").send({ email, password });

    expect(login.status).toBe(200);
    expect(login.body.data.tokens.accessToken).toBeDefined();
  });

  it("rejects duplicate registration", async () => {
    const email = `auth-dup-${Date.now()}@test.local`;
    await registerStudent(ctx.app, email);

    const duplicate = await request(ctx.app)
      .post("/api/v1/auth/register")
      .send({ email, password: "TestPass1", studentId: "ST99999999", yearOfStudy: 2 });

    expect(duplicate.status).toBe(422);
    expect(duplicate.body.error.code).toBe("EMAIL_ALREADY_EXISTS");
  });
});
