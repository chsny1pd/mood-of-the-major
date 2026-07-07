import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

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
      } catch {
        setError(t("auth.callbackError"));
      }
    })();
  }, [completeOAuthCallback, navigate, t]);

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
        {error}
      </div>
    );
  }

  return (
    <div className="py-8 text-center text-stone-600 dark:text-stone-300">{t("auth.callbackLoading")}</div>
  );
}
