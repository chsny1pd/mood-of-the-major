import * as Sentry from "@sentry/node";
import type { Env } from "../../config/env.js";

let enabled = false;

export function initSentry(env: Env): void {
  if (!env.SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === "production" ? 0.1 : 1.0,
  });

  enabled = true;
}

export function captureException(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (!enabled) {
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      for (const [key, value] of Object.entries(context)) {
        scope.setExtra(key, value);
      }
    }

    Sentry.captureException(error);
  });
}

export function isSentryEnabled(): boolean {
  return enabled;
}
