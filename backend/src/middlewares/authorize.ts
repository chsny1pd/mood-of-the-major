import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "../domain/entities/User.js";
import { AuthorizationError } from "../domain/errors/AppError.js";

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      next(new AuthorizationError("Insufficient permissions", "FORBIDDEN"));
      return;
    }

    next();
  };
}
