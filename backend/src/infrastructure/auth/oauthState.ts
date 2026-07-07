import { createHmac, timingSafeEqual } from "node:crypto";

export interface OAuthStatePayload {
  returnUrl: string;
}

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function sanitizeOAuthReturnUrl(returnUrl: string | undefined): string {
  if (!returnUrl || !returnUrl.startsWith("/") || returnUrl.startsWith("//")) {
    return "/feed";
  }

  return returnUrl;
}

export function signOAuthState(payload: OAuthStatePayload, secret: string): string {
  const data = toBase64Url(JSON.stringify(payload));
  const signature = createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${signature}`;
}

export function verifyOAuthState(state: string | undefined, secret: string): OAuthStatePayload | null {
  if (!state) {
    return null;
  }

  const [data, signature] = state.split(".");
  if (!data || !signature) {
    return null;
  }

  const expected = createHmac("sha256", secret).update(data).digest("base64url");
  if (signature.length !== expected.length) {
    return null;
  }

  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(data)) as OAuthStatePayload;
    return { returnUrl: sanitizeOAuthReturnUrl(payload.returnUrl) };
  } catch {
    return null;
  }
}
