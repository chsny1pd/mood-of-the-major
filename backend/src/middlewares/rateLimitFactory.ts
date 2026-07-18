import type { NextFunction, Request, Response } from "express";
import rateLimit, {
  ipKeyGenerator,
  type Options,
  type RateLimitRequestHandler,
} from "express-rate-limit";
import type { Env } from "../config/env.js";
import { DEFAULT_RATE_LIMITS } from "../domain/constants/rateLimits.js";
import type { Logger } from "../infrastructure/logging/logger.js";

export interface RateLimitConfig {
  auth: { windowMs: number; max: number };
  write: { windowMs: number; max: number };
  feed: { windowMs: number; max: number };
  general: { windowMs: number; max: number };
}

export function resolveRateLimitConfig(env: Env): RateLimitConfig {
  return {
    auth: {
      windowMs: env.RATE_LIMIT_AUTH_WINDOW_MS ?? DEFAULT_RATE_LIMITS.auth.windowMs,
      max: env.RATE_LIMIT_AUTH_MAX ?? DEFAULT_RATE_LIMITS.auth.max,
    },
    write: {
      windowMs: env.RATE_LIMIT_WRITE_WINDOW_MS ?? DEFAULT_RATE_LIMITS.write.windowMs,
      max: env.RATE_LIMIT_WRITE_MAX ?? DEFAULT_RATE_LIMITS.write.max,
    },
    feed: {
      windowMs: env.RATE_LIMIT_FEED_WINDOW_MS ?? DEFAULT_RATE_LIMITS.feed.windowMs,
      max: env.RATE_LIMIT_FEED_MAX ?? DEFAULT_RATE_LIMITS.feed.max,
    },
    general: {
      windowMs: env.RATE_LIMIT_GENERAL_WINDOW_MS ?? DEFAULT_RATE_LIMITS.general.windowMs,
      max: env.RATE_LIMIT_GENERAL_MAX ?? DEFAULT_RATE_LIMITS.general.max,
    },
  };
}

function clientIpKey(req: Request): string {
  return ipKeyGenerator(req.ip ?? "unknown");
}

function userOrIpKeyGenerator(req: Request): string {
  if (req.userId) {
    return req.userId;
  }

  return ipKeyGenerator(req.ip ?? "unknown");
}

function createRateLimiter(
  logger: Logger,
  options: Partial<Options> & Pick<Options, "windowMs" | "max">,
  message: string,
): RateLimitRequestHandler {
  return rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    ...options,
    handler: (req: Request, res: Response, _next: NextFunction, handlerOptions) => {
      logger.warn("Rate limit exceeded", {
        requestId: req.requestId,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userId: req.userId,
      });

      res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message,
        },
        requestId: req.requestId,
      });

      if (handlerOptions.headers) {
        res.setHeader("Retry-After", String(Math.ceil(handlerOptions.windowMs / 1000)));
      }
    },
  });
}

export interface AppRateLimiters {
  auth: RateLimitRequestHandler;
  post: RateLimitRequestHandler;
  comment: RateLimitRequestHandler;
  imageUpload: RateLimitRequestHandler;
  feed: RateLimitRequestHandler;
  general: RateLimitRequestHandler;
}

export function createRateLimiters(env: Env, logger: Logger): AppRateLimiters {
  const config = resolveRateLimitConfig(env);

  return {
    auth: createRateLimiter(
      logger,
      { windowMs: config.auth.windowMs, max: config.auth.max, keyGenerator: clientIpKey },
      "Too many authentication attempts. Please try again later.",
    ),
    post: createRateLimiter(
      logger,
      { windowMs: config.write.windowMs, max: config.write.max, keyGenerator: userOrIpKeyGenerator },
      "Too many posts. Please try again later.",
    ),
    comment: createRateLimiter(
      logger,
      { windowMs: config.write.windowMs, max: config.write.max, keyGenerator: userOrIpKeyGenerator },
      "Too many comments. Please try again later.",
    ),
    imageUpload: createRateLimiter(
      logger,
      { windowMs: config.write.windowMs, max: config.write.max, keyGenerator: userOrIpKeyGenerator },
      "Too many upload requests. Please try again later.",
    ),
    feed: createRateLimiter(
      logger,
      { windowMs: config.feed.windowMs, max: config.feed.max, keyGenerator: userOrIpKeyGenerator },
      "Too many feed requests. Please slow down.",
    ),
    general: createRateLimiter(
      logger,
      { windowMs: config.general.windowMs, max: config.general.max, keyGenerator: clientIpKey },
      "Too many requests. Please try again later.",
    ),
  };
}
