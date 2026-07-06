import type { NextFunction, Request, Response } from "express";
import { AuthenticationError } from "../domain/errors/AppError.js";
import type { ITokenService } from "../domain/ports/ITokenService.js";
import type { IUserRepository } from "../domain/ports/IUserRepository.js";

export function createAuthenticateMiddleware(
  tokens: ITokenService,
  users: IUserRepository,
) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const header = req.headers.authorization;

      if (!header?.startsWith("Bearer ")) {
        throw new AuthenticationError("Authentication required", "AUTH_REQUIRED");
      }

      const accessToken = header.slice("Bearer ".length).trim();
      const claims = tokens.verifyAccessToken(accessToken);
      const user = await users.findById(claims.userId);

      if (!user || user.deletedAt) {
        throw new AuthenticationError("Invalid token", "AUTH_INVALID_TOKEN");
      }

      if (user.status !== "active") {
        throw new AuthenticationError("Account suspended", "ACCOUNT_SUSPENDED", 403);
      }

      if (user.tokenVersion !== claims.tokenVersion) {
        throw new AuthenticationError("Invalid token", "AUTH_INVALID_TOKEN");
      }

      req.userId = user.id;
      req.userRole = user.role;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function createOptionalAuthenticateMiddleware(
  tokens: ITokenService,
  users: IUserRepository,
) {
  const authenticate = createAuthenticateMiddleware(tokens, users);

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.headers.authorization) {
      next();
      return;
    }

    await authenticate(req, res, next);
  };
}
