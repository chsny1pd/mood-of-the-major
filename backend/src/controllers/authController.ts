import type { Response } from "express";
import type { AuthService, LoginInput, RegisterInput } from "../application/services/AuthService.js";
import type { UpdateUserProfileInput } from "../domain/entities/User.js";
import {
  toAuthUserDto,
  toTokenDto,
  toUserProfileDto,
} from "../application/mappers/authMapper.js";
import type { Env } from "../config/env.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  clearRefreshTokenCookie,
  readRefreshTokenFromRequest,
  setRefreshTokenCookie,
} from "../utils/authCookies.js";
import { AuthenticationError } from "../domain/errors/AppError.js";

export function createAuthController(authService: AuthService, env: Env) {
  return {
    register: asyncHandler(async (req, res: Response) => {
      const result = await authService.register(req.body as RegisterInput);

      setRefreshTokenCookie(res, result.refreshToken, env);

      res.status(201).json({
        success: true,
        data: {
          user: toAuthUserDto(result.user),
          tokens: toTokenDto(result.accessToken, result.expiresIn),
        },
      });
    }),

    login: asyncHandler(async (req, res: Response) => {
      const result = await authService.login(req.body as LoginInput);

      setRefreshTokenCookie(res, result.refreshToken, env);

      res.status(200).json({
        success: true,
        data: {
          user: toAuthUserDto(result.user),
          tokens: toTokenDto(result.accessToken, result.expiresIn),
        },
      });
    }),

    logout: asyncHandler(async (req, res: Response) => {
      if (!req.userId) {
        throw new AuthenticationError("Authentication required", "AUTH_REQUIRED");
      }

      await authService.logout(req.userId);
      clearRefreshTokenCookie(res, env);

      res.status(200).json({
        success: true,
        data: { message: "Logged out successfully." },
      });
    }),

    refresh: asyncHandler(async (req, res: Response) => {
      const refreshToken = readRefreshTokenFromRequest({
        cookies: req.cookies as Record<string, string | undefined>,
        body: req.body as { refreshToken?: string },
      });

      if (!refreshToken) {
        throw new AuthenticationError("Invalid refresh token", "AUTH_INVALID_TOKEN");
      }

      const result = await authService.refresh(refreshToken);
      setRefreshTokenCookie(res, result.refreshToken, env);

      res.status(200).json({
        success: true,
        data: toTokenDto(result.accessToken, result.expiresIn),
      });
    }),

    me: asyncHandler(async (req, res: Response) => {
      if (!req.userId) {
        throw new AuthenticationError("Authentication required", "AUTH_REQUIRED");
      }

      const profile = await authService.getProfile(req.userId);

      res.status(200).json({
        success: true,
        data: toUserProfileDto(profile),
      });
    }),

    updateMe: asyncHandler(async (req, res: Response) => {
      if (!req.userId) {
        throw new AuthenticationError("Authentication required", "AUTH_REQUIRED");
      }

      const profile = await authService.updateProfile(
        req.userId,
        req.body as UpdateUserProfileInput,
      );

      res.status(200).json({
        success: true,
        data: toUserProfileDto(profile),
      });
    }),
  };
}
