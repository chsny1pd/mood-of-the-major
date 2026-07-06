import type { UserRole } from "../entities/User.js";

export interface AccessTokenPayload {
  accessToken: string;
  expiresIn: number;
}

export interface TokenPair extends AccessTokenPayload {
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

export interface AccessTokenClaims {
  userId: string;
  role: UserRole;
  tokenVersion: number;
}

export interface ITokenService {
  issueTokenPair(userId: string, role: UserRole, tokenVersion: number): TokenPair;
  issueAccessToken(userId: string, role: UserRole, tokenVersion: number): AccessTokenPayload;
  verifyAccessToken(token: string): AccessTokenClaims;
  hashRefreshToken(refreshToken: string): string;
  generateRefreshToken(): string;
}
