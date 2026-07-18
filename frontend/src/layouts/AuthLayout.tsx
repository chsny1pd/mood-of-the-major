import { useEffect } from "react";
import { Link, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AmbientBackground } from "../components/AmbientBackground";
import { AppNavbar } from "../components/AppNavbar";
import { ROUTES } from "../constants/routes";
import { ensureFullTranslations } from "../lib/i18n";
import { themeClasses } from "../lib/themeClasses";

export function AuthLayout() {
  const { t } = useTranslation();

  useEffect(() => {
    void ensureFullTranslations();
  }, []);

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
