import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PublicNavbar } from "../../components/PublicNavbar";
import { useAuth } from "../../hooks/useAuth";
import { ROUTES } from "../../constants/routes";
import { themeClasses } from "../../lib/themeClasses";
import { LandingPage } from "../../pages/LandingPage";

/**
 * Single chunk for `/` so PublicNavbar + LandingPage load together instead of
 * publicRoutes → LandingPage waterfalls that delay LCP.
 */
export function Component() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();

  if (!isLoading && isAuthenticated) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  return (
    <div className={`flex min-h-screen flex-col ${themeClasses.page}`}>
      <PublicNavbar />

      <main className="flex-1">
        <LandingPage />
      </main>

      <footer className={`border-t ${themeClasses.border} ${themeClasses.surface}`}>
        <div className={`mx-auto max-w-5xl px-4 py-6 text-sm sm:px-6 ${themeClasses.muted}`}>
          {t("app.footer")}
        </div>
      </footer>
    </div>
  );
}
