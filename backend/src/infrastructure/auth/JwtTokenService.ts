import { randomBytes, createHash } from "node:crypto";
import jwt from "jsonwebtoken";
import type { UserRole } from "../../domain/entities/User.js";
import {
  AuthenticationError,
} from "../../domain/errors/AppError.js";
import type {
  AccessTokenClaims,
  AccessTokenPayload,
  ITokenService,
  TokenPair,
} from "../../domain/ports/ITokenService.js";

const ACCESS_TOKEN_TTL_SECONDS = 900;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export class JwtTokenService implements ITokenService {
  constructor(private readonly jwtSecret: string) {}

  issueTokenPair(userId: string, role: UserRole, tokenVersion: number): TokenPair {
    const refreshToken = this.generateRefreshToken();
    const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
    const access = this.issueAccessToken(userId, role, tokenVersion);

    return {
      ...access,
      refreshToken,
      refreshTokenExpiresAt,
    };
  }

  issueAccessToken(userId: string, role: UserRole, tokenVersion: number): AccessTokenPayload {
    const accessToken = jwt.sign(
      {
        sub: userId,
        role,
        typ: "access",
        tv: tokenVersion,
      },
      this.jwtSecret,
      { expiresIn: ACCESS_TOKEN_TTL_SECONDS },
    );

    return {
      accessToken,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    };
  }

  verifyAccessToken(token: string): AccessTokenClaims {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as jwt.JwtPayload;

      if (payload.typ !== "access" || typeof payload.sub !== "string") {
        throw new AuthenticationError("Invalid token", "AUTH_INVALID_TOKEN");
      }

      return {
        userId: payload.sub,
        role: payload.role as UserRole,
        tokenVersion: Number(payload.tv ?? 0),
      };
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }

      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError("Token expired", "AUTH_EXPIRED_TOKEN");
      }

      throw new AuthenticationError("Invalid token", "AUTH_INVALID_TOKEN");
    }
  }

  hashRefreshToken(refreshToken: string): string {
    return createHash("sha256").update(refreshToken).digest("hex");
  }

  generateRefreshToken(): string {
    return randomBytes(32).toString("hex");
  }
}
