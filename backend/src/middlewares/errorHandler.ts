import type { NextFunction, Request, Response } from "express";
import { AppError } from "../domain/errors/AppError.js";
import type { Logger } from "../infrastructure/logging/logger.js";
import { captureException } from "../infrastructure/monitoring/sentry.js";

export function errorHandler(logger: Logger) {
  return (error: unknown, req: Request, res: Response, _next: NextFunction): void => {
    const requestId = req.requestId ?? "unknown";

    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
        requestId,
      });
      return;
    }

    logger.error("Unhandled error", {
      requestId,
      message: error instanceof Error ? error.message : "Unknown error",
    });

    captureException(error, { requestId, path: req.path, method: req.method });

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
      requestId,
    });
  };
}
