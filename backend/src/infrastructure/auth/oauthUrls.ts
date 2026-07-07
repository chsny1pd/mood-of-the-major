import type { Env } from "../../config/env.js";
import { getCorsOrigins } from "../../config/env.js";

export function getFrontendUrl(env: Env): string {
  return env.FRONTEND_URL ?? getCorsOrigins(env)[0] ?? "http://localhost:5173";
}

export function getOAuthCallbackBaseUrl(env: Env): string {
  return env.OAUTH_CALLBACK_BASE_URL ?? `${getFrontendUrl(env)}/api/v1/auth`;
}

export function isGoogleOAuthConfigured(env: Env): boolean {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}

export function isGitHubOAuthConfigured(env: Env): boolean {
  return Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET);
}

export function isOAuthConfigured(env: Env): boolean {
  return isGoogleOAuthConfigured(env) || isGitHubOAuthConfigured(env);
}

export function buildOAuthSuccessRedirect(
  env: Env,
  params: {
    accessToken: string;
    expiresIn: number;
    displayName?: string | null;
    avatarUrl?: string | null;
    returnUrl: string;
  },
): string {
  const hash = new URLSearchParams({
    accessToken: params.accessToken,
    expiresIn: String(params.expiresIn),
    returnUrl: params.returnUrl,
  });

  if (params.displayName) {
    hash.set("displayName", params.displayName);
  }

  if (params.avatarUrl) {
    hash.set("avatarUrl", params.avatarUrl);
  }

  return `${getFrontendUrl(env)}/auth/callback#${hash.toString()}`;
}

export function buildOAuthFailureRedirect(env: Env, code: string): string {
  return `${getFrontendUrl(env)}/auth/callback#error=${encodeURIComponent(code)}`;
}
