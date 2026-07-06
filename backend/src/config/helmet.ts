import helmet from "helmet";
import type { Env } from "./env.js";

export function createHelmetMiddleware(env: Env) {
  const isProduction = env.NODE_ENV === "production";

  return helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin" },
    hsts: isProduction ? { maxAge: 31_536_000, includeSubDomains: true } : false,
    xssFilter: false,
  });
}
