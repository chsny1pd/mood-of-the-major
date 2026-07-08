import { Link, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppNavbar } from "../components/AppNavbar";
import { ROUTES } from "../constants/routes";
import { themeClasses } from "../lib/themeClasses";

export function AuthLayout() {
  const { t } = useTranslation();

  return (
    <div className={`flex min-h-screen flex-col ${themeClasses.page}`}>
      <AppNavbar variant="app" />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:hidden">
            <Link to={ROUTES.home} className={`text-lg font-semibold ${themeClasses.link}`}>
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
  );
}
