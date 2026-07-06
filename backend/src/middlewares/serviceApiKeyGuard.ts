import type { NextFunction, Request, Response } from "express";
import type { Env } from "../config/env.js";

export function createServiceApiKeyGuard(env: Env) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const apiKey = req.header("x-service-api-key");

    if (!env.SERVICE_API_KEY || apiKey !== env.SERVICE_API_KEY) {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Invalid service API key." },
        requestId: req.requestId,
      });
      return;
    }

    next();
  };
}
