import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import type { Logger } from "../infrastructure/logging/logger.js";

export function requestLogger(logger: Logger) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const requestId = randomUUID();
    req.requestId = requestId;
    res.setHeader("X-Request-Id", requestId);

    const startedAt = Date.now();

    res.on("finish", () => {
      logger.info("HTTP request", {
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,
      });
    });

    next();
  };
}
