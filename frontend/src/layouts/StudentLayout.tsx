import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { AppNavbar } from "../components/AppNavbar";
import { ensureFullTranslations } from "../lib/i18n";
import { themeClasses } from "../lib/themeClasses";

export function StudentLayout() {
  useEffect(() => {
    void ensureFullTranslations();
  }, []);

  return (
    <div className={`flex min-h-screen flex-col ${themeClasses.page}`}>
      <AppNavbar variant="app" />

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
