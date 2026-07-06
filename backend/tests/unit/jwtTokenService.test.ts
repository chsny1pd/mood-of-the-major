import { describe, expect, it } from "vitest";
import { JwtTokenService } from "../../src/infrastructure/auth/JwtTokenService.js";
import { AuthenticationError } from "../../src/domain/errors/AppError.js";

describe("JwtTokenService", () => {
  const tokens = new JwtTokenService("test-secret-key-for-jwt-service");

  it("issues and verifies access tokens", () => {
    const access = tokens.issueAccessToken("665a1b2c3d4e5f6789012345", "student", 0);

    expect(access.expiresIn).toBe(900);
    expect(access.accessToken.split(".")).toHaveLength(3);

    const claims = tokens.verifyAccessToken(access.accessToken);
    expect(claims.userId).toBe("665a1b2c3d4e5f6789012345");
    expect(claims.role).toBe("student");
    expect(claims.tokenVersion).toBe(0);
  });

  it("rejects invalid tokens", () => {
    expect(() => tokens.verifyAccessToken("not-a-token")).toThrow(AuthenticationError);
  });
});
