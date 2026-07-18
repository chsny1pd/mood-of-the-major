import { ROUTES } from "../constants/routes";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

export function isOAuthConfigured(): boolean {
  return import.meta.env.VITE_OAUTH_ENABLED === "true";
}

export function getOAuthStartUrl(provider: "google" | "github", returnUrl: string = ROUTES.dashboard): string {
  const params = new URLSearchParams({ returnUrl });
  return `${API_BASE_URL}/auth/${provider}?${params.toString()}`;
}

export const OAUTH_ERROR_CODES = [
  "oauth_not_configured",
  "oauth_failed",
  "email_domain_not_allowed",
] as const;

export type OAuthErrorCode = (typeof OAUTH_ERROR_CODES)[number];

export function isOAuthErrorCode(value: string): value is OAuthErrorCode {
  return (OAUTH_ERROR_CODES as readonly string[]).includes(value);
}

export function parseOAuthCallbackHash(): {
  accessToken: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  returnUrl: string;
  error: OAuthErrorCode | null;
} {
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  const params = new URLSearchParams(hash);

  const returnUrl = params.get("returnUrl");
  const sanitizedReturnUrl =
    returnUrl && returnUrl.startsWith("/") && !returnUrl.startsWith("//")
      ? returnUrl
      : ROUTES.dashboard;

  return {
    accessToken: params.get("accessToken"),
    displayName: params.get("displayName"),
    avatarUrl: params.get("avatarUrl"),
    returnUrl: sanitizedReturnUrl,
    error: (() => {
      const error = params.get("error");
      return error && isOAuthErrorCode(error) ? error : null;
    })(),
  };
}
