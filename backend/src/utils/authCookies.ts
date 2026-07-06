import type { Response } from "express";
import type { Env } from "../config/env.js";

const REFRESH_COOKIE_NAME = "refreshToken";
const REFRESH_COOKIE_PATH = "/api/v1/auth";

export function setRefreshTokenCookie(res: Response, token: string, env: Env): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    path: REFRESH_COOKIE_PATH,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearRefreshTokenCookie(res: Response, env: Env): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    path: REFRESH_COOKIE_PATH,
  });
}

export function readRefreshTokenFromRequest(req: {
  cookies?: Record<string, string | undefined>;
  body?: { refreshToken?: string };
}): string | undefined {
  return req.cookies?.refreshToken ?? req.body?.refreshToken;
}
