import { Link, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppNavbar } from "../components/AppNavbar";
import { ROUTES } from "../constants/routes";

export function AuthLayout() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <AppNavbar variant="app" />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:hidden">
            <Link to={ROUTES.home} className="text-lg font-semibold text-teal-800 dark:text-teal-300">
              {t("app.name")}
            </Link>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">{t("app.tagline")}</p>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-700 dark:bg-stone-900">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
