import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { ROUTES } from "../constants/routes";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-stone-500">
        {t("common.loadingSession")}
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace state={{ returnUrl: location.pathname }} />;
  }

  if (user?.role !== "administrator") {
    return <Navigate to={ROUTES.feed} replace />;
  }

  return children;
}
