import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { ValidationError } from "../domain/errors/AppError.js";

export function validate(schema: ZodSchema, source: "body" | "query" | "params" = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const payload = source === "body" ? req.body : source === "query" ? req.query : req.params;
    const result = schema.safeParse(payload);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join(".") || source,
        message: issue.message,
      }));

      next(new ValidationError("Validation failed", details));
      return;
    }

    if (source === "body") {
      req.body = result.data;
    } else if (source === "query") {
      req.validatedQuery = result.data as Record<string, unknown>;
    } else {
      req.params = result.data as typeof req.params;
    }

    next();
  };
}
