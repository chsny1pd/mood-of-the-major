import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ROUTES } from "../constants/routes";
import { isOAuthErrorCode } from "../lib/oauth";

export function AuthCallbackPage() {
  const { t } = useTranslation();
  const { completeOAuthCallback } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const returnUrl = await completeOAuthCallback();
        navigate(returnUrl, { replace: true });
      } catch (callbackError) {
        const code = callbackError instanceof Error ? callbackError.message : "";
        setError(
          isOAuthErrorCode(code) ? t(`auth.oauthErrors.${code}`) : t("auth.callbackError"),
        );
      }
    })();
  }, [completeOAuthCallback, navigate, t]);

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
          {error}
        </div>
        <p className="text-center text-sm">
          <Link to={ROUTES.login} className="font-medium text-teal-800 hover:underline dark:text-teal-300">
            {t("auth.backToLogin")}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="py-8 text-center text-stone-600 dark:text-stone-300">{t("auth.callbackLoading")}</div>
  );
}
