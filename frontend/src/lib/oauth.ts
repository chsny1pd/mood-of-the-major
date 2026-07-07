import { ROUTES } from "../constants/routes";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

export function isOAuthConfigured(): boolean {
  return import.meta.env.VITE_OAUTH_ENABLED === "true";
}

export function getOAuthStartUrl(provider: "google" | "github", returnUrl: string = ROUTES.feed): string {
  const params = new URLSearchParams({ returnUrl });
  return `${API_BASE_URL}/auth/${provider}?${params.toString()}`;
}

export function parseOAuthCallbackHash(): {
  accessToken: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  returnUrl: string;
  error: string | null;
} {
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  const params = new URLSearchParams(hash);

  const returnUrl = params.get("returnUrl");
  const sanitizedReturnUrl =
    returnUrl && returnUrl.startsWith("/") && !returnUrl.startsWith("//")
      ? returnUrl
      : ROUTES.feed;

  return {
    accessToken: params.get("accessToken"),
    displayName: params.get("displayName"),
    avatarUrl: params.get("avatarUrl"),
    returnUrl: sanitizedReturnUrl,
    error: params.get("error"),
  };
}
