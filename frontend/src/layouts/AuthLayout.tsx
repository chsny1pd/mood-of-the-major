import { useEffect, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AmbientBackground } from "../components/AmbientBackground";
import { AppNavbar } from "../components/AppNavbar";
import { ROUTES } from "../constants/routes";
import i18n, { ensureFullTranslations } from "../lib/i18n";
import { themeClasses } from "../lib/themeClasses";

/** Kick off as soon as this chunk evaluates — before AuthLayout's first paint. */
const authTranslationsPromise = ensureFullTranslations();

function hasAuthTranslations(): boolean {
  return i18n.exists("auth.signInTitle");
}

export function AuthLayout() {
  const { t } = useTranslation();
  const [translationsReady, setTranslationsReady] = useState(hasAuthTranslations);

  useEffect(() => {
    if (translationsReady) {
      return;
    }

    let cancelled = false;
    void authTranslationsPromise.then(() => {
      if (!cancelled) {
        setTranslationsReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [translationsReady]);

  if (!translationsReady) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center ${themeClasses.page}`}
        role="status"
        aria-live="polite"
      >
        {t("common.loading")}
      </div>
    );
  }

  return (
    <div className={`relative flex min-h-screen flex-col overflow-hidden ${themeClasses.page}`}>
      <AmbientBackground variant="subtle" />
      <div className="relative z-10 flex min-h-screen flex-col">
        <AppNavbar variant="app" />
        <div className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center lg:hidden">
              <Link to={ROUTES.home} className={`font-display text-lg font-semibold ${themeClasses.link}`}>
                {t("app.name")}
              </Link>
              <p className={`mt-2 text-sm ${themeClasses.body}`}>{t("app.tagline")}</p>
            </div>

            <div className={`p-6 ${themeClasses.cardLg}`}>
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
