import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { isOAuthConfigured } from "../lib/oauth";
import { ROUTES } from "../constants/routes";
import { Button } from "./ui/Button";

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.16 3.33v2.77h3.5c2.04-1.88 3.22-4.65 3.22-7.11z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.5-2.77c-.98.66-2.23 1.06-3.78 1.06-2.9 0-5.36-1.98-6.24-4.66H1.1v2.84C2.87 20.94 7.18 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.76 14.07c-.22-.66-.35-1.36-.35-2.07s.13-1.41.35-2.07V7.09H1.1C.4 8.55 0 10.22 0 12s.4 3.45 1.1 4.91l4.66-3.84z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.18 0 2.87 2.06 1.1 5.09l4.66 3.84C6.64 6.73 9.1 4.75 12 4.75z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

export function OAuthButtons() {
  const { t } = useTranslation();
  const { loginWithOAuth } = useAuth();
  const location = useLocation();
  const [loadingProvider, setLoadingProvider] = useState<"google" | "github" | null>(null);

  if (!isOAuthConfigured()) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
        {t("auth.oauthUnavailable")}
      </p>
    );
  }

  const returnUrl =
    (location.state as { returnUrl?: string } | null)?.returnUrl ?? ROUTES.feed;

  const handleOAuth = (provider: "google" | "github") => {
    setLoadingProvider(provider);
    loginWithOAuth(provider, returnUrl);
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        disabled={loadingProvider !== null}
        onClick={() => handleOAuth("google")}
      >
        <GoogleIcon />
        {loadingProvider === "google" ? t("auth.oauthLoading") : t("auth.continueWithGoogle")}
      </Button>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        disabled={loadingProvider !== null}
        onClick={() => handleOAuth("github")}
      >
        <GitHubIcon />
        {loadingProvider === "github" ? t("auth.oauthLoading") : t("auth.continueWithGitHub")}
      </Button>
    </div>
  );
}
