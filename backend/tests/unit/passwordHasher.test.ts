import { describe, expect, it } from "vitest";
import { BcryptPasswordHasher } from "../../src/infrastructure/auth/BcryptPasswordHasher.js";

describe("BcryptPasswordHasher", () => {
  it("hashes and verifies passwords", async () => {
    const hasher = new BcryptPasswordHasher(4);
    const hash = await hasher.hash("SecurePass123!");

    expect(hash).not.toBe("SecurePass123!");
    await expect(hasher.compare("SecurePass123!", hash)).resolves.toBe(true);
    await expect(hasher.compare("WrongPass123!", hash)).resolves.toBe(false);
  });
});
