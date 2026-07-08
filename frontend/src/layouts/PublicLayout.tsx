import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PublicNavbar } from "../components/PublicNavbar";
import { themeClasses } from "../lib/themeClasses";

export function PublicLayout() {
  const { t } = useTranslation();

  return (
    <div className={`flex min-h-screen flex-col ${themeClasses.page}`}>
      <PublicNavbar />

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className={`border-t ${themeClasses.border} ${themeClasses.surface}`}>
        <div className={`mx-auto max-w-5xl px-4 py-6 text-sm sm:px-6 ${themeClasses.muted}`}>
          {t("app.footer")}
        </div>
      </footer>
    </div>
  );
}
