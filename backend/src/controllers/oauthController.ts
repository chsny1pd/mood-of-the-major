import type { NextFunction, Request, Response } from "express";
import passport from "passport";
import type { AuthService } from "../application/services/AuthService.js";
import type { Env } from "../config/env.js";
import type { OAuthPassportProfile } from "../infrastructure/auth/configurePassport.js";
import {
  buildOAuthFailureRedirect,
  buildOAuthSuccessRedirect,
  isGitHubOAuthConfigured,
  isGoogleOAuthConfigured,
} from "../infrastructure/auth/oauthUrls.js";
import {
  sanitizeOAuthReturnUrl,
  signOAuthState,
  verifyOAuthState,
} from "../infrastructure/auth/oauthState.js";
import { AppError } from "../domain/errors/AppError.js";
import { setRefreshTokenCookie } from "../utils/authCookies.js";

function resolveJwtSecret(env: Env): string {
  if (env.JWT_SECRET) {
    return env.JWT_SECRET;
  }

  if (env.NODE_ENV === "development" || env.NODE_ENV === "test") {
    return "dev-jwt-secret-change-before-production";
  }

  throw new Error("JWT_SECRET is required");
}

function readReturnUrl(req: Request): string {
  const raw = typeof req.query.returnUrl === "string" ? req.query.returnUrl : undefined;
  return sanitizeOAuthReturnUrl(raw);
}

function readVerifiedReturnUrl(req: Request, env: Env): string {
  const verified = verifyOAuthState(
    typeof req.query.state === "string" ? req.query.state : undefined,
    resolveJwtSecret(env),
  );

  return verified?.returnUrl ?? "/feed";
}

async function finalizeOAuthLogin(
  authService: AuthService,
  env: Env,
  res: Response,
  profile: OAuthPassportProfile,
  returnUrl: string,
): Promise<void> {
  const result = await authService.loginWithOAuthProfile({
    email: profile.email,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
  });

  setRefreshTokenCookie(res, result.refreshToken, env);

  res.redirect(
    buildOAuthSuccessRedirect(env, {
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      returnUrl,
    }),
  );
}

export function createOAuthController(authService: AuthService, env: Env) {
  const jwtSecret = resolveJwtSecret(env);

  return {
    startGoogle(req: Request, res: Response, next: NextFunction): void {
      if (!isGoogleOAuthConfigured(env)) {
        res.redirect(buildOAuthFailureRedirect(env, "oauth_not_configured"));
        return;
      }

      const returnUrl = readReturnUrl(req);
      const state = signOAuthState({ returnUrl }, jwtSecret);

      passport.authenticate("google", {
        session: false,
        scope: ["profile", "email"],
        state,
      })(req, res, next);
    },

    callbackGoogle(req: Request, res: Response, next: NextFunction): void {
      if (!isGoogleOAuthConfigured(env)) {
        res.redirect(buildOAuthFailureRedirect(env, "oauth_not_configured"));
        return;
      }

      const returnUrl = readVerifiedReturnUrl(req, env);

      passport.authenticate(
        "google",
        { session: false },
        (error: Error | null, profile?: passport.Profile) => {
          void (async () => {
            if (error || !profile) {
              res.redirect(buildOAuthFailureRedirect(env, "oauth_failed"));
              return;
            }

            try {
              await finalizeOAuthLogin(
                authService,
                env,
                res,
                profile as unknown as OAuthPassportProfile,
                returnUrl,
              );
            } catch (loginError) {
              if (loginError instanceof AppError && loginError.code === "EMAIL_DOMAIN_NOT_ALLOWED") {
                res.redirect(buildOAuthFailureRedirect(env, "email_domain_not_allowed"));
                return;
              }

              res.redirect(buildOAuthFailureRedirect(env, "oauth_failed"));
            }
          })().catch(next);
        },
      )(req, res, next);
    },

    startGitHub(req: Request, res: Response, next: NextFunction): void {
      if (!isGitHubOAuthConfigured(env)) {
        res.redirect(buildOAuthFailureRedirect(env, "oauth_not_configured"));
        return;
      }

      const returnUrl = readReturnUrl(req);
      const state = signOAuthState({ returnUrl }, jwtSecret);

      passport.authenticate("github", {
        session: false,
        scope: ["user:email"],
        state,
      })(req, res, next);
    },

    callbackGitHub(req: Request, res: Response, next: NextFunction): void {
      if (!isGitHubOAuthConfigured(env)) {
        res.redirect(buildOAuthFailureRedirect(env, "oauth_not_configured"));
        return;
      }

      const returnUrl = readVerifiedReturnUrl(req, env);

      passport.authenticate(
        "github",
        { session: false },
        (error: Error | null, profile?: passport.Profile) => {
          void (async () => {
            if (error || !profile) {
              res.redirect(buildOAuthFailureRedirect(env, "oauth_failed"));
              return;
            }

            try {
              await finalizeOAuthLogin(
                authService,
                env,
                res,
                profile as unknown as OAuthPassportProfile,
                returnUrl,
              );
            } catch (loginError) {
              if (loginError instanceof AppError && loginError.code === "EMAIL_DOMAIN_NOT_ALLOWED") {
                res.redirect(buildOAuthFailureRedirect(env, "email_domain_not_allowed"));
                return;
              }

              res.redirect(buildOAuthFailureRedirect(env, "oauth_failed"));
            }
          })().catch(next);
        },
      )(req, res, next);
    },
  };
}
