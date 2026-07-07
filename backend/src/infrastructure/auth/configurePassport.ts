import passport from "passport";
import { Strategy as GoogleStrategy, type Profile as GoogleProfile } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import type { Env } from "../../config/env.js";
import {
  getOAuthCallbackBaseUrl,
  isGitHubOAuthConfigured,
  isGoogleOAuthConfigured,
} from "./oauthUrls.js";

export interface OAuthPassportProfile {
  provider: "google" | "github";
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

function extractGoogleProfile(profile: GoogleProfile): OAuthPassportProfile | null {
  const email = profile.emails?.[0]?.value?.trim().toLowerCase();
  if (!email) {
    return null;
  }

  return {
    provider: "google",
    email,
    displayName: profile.displayName?.trim() || null,
    avatarUrl: profile.photos?.[0]?.value ?? null,
  };
}

function extractGitHubProfile(profile: passport.Profile): OAuthPassportProfile | null {
  const email = profile.emails?.[0]?.value?.trim().toLowerCase();
  if (!email) {
    return null;
  }

  const displayName = profile.displayName?.trim() || profile.username?.trim() || null;

  return {
    provider: "github",
    email,
    displayName,
    avatarUrl: profile.photos?.[0]?.value ?? null,
  };
}

export function configurePassport(env: Env): void {
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user as OAuthPassportProfile);
  });

  if (isGoogleOAuthConfigured(env)) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: env.GOOGLE_CLIENT_ID!,
          clientSecret: env.GOOGLE_CLIENT_SECRET!,
          callbackURL: `${getOAuthCallbackBaseUrl(env)}/google/callback`,
        },
        (_accessToken, _refreshToken, profile, done) => {
          const mapped = extractGoogleProfile(profile);
          if (!mapped) {
            done(new Error("Google account is missing an email address"));
            return;
          }

          done(null, mapped as unknown as passport.Profile);
        },
      ),
    );
  }

  if (isGitHubOAuthConfigured(env)) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: env.GITHUB_CLIENT_ID!,
          clientSecret: env.GITHUB_CLIENT_SECRET!,
          callbackURL: `${getOAuthCallbackBaseUrl(env)}/github/callback`,
          scope: ["user:email"],
        },
        (_accessToken, _refreshToken, profile, done) => {
          const mapped = extractGitHubProfile(profile);
          if (!mapped) {
            done(new Error("GitHub account is missing an email address"));
            return;
          }

          done(null, mapped as unknown as passport.Profile);
        },
      ),
    );
  }
}
