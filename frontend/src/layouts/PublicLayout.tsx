import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppNavbar } from "../components/AppNavbar";

export function PublicLayout() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <AppNavbar variant="public" />

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
        <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-stone-500 dark:text-stone-400 sm:px-6">
          {t("app.footer")}
        </div>
      </footer>
    </div>
  );
}
