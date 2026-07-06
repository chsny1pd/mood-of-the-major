import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { ValidationError } from "../domain/errors/AppError.js";

export function validate(schema: ZodSchema, source: "body" | "query" = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(source === "body" ? req.body : req.query);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join(".") || "body",
        message: issue.message,
      }));

      next(new ValidationError("Validation failed", details));
      return;
    }

    if (source === "body") {
      req.body = result.data;
    } else {
      req.validatedQuery = result.data as Record<string, unknown>;
    }

    next();
  };
}
