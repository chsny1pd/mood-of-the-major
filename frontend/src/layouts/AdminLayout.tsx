import { Link, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ROUTES } from "../constants/routes";

export function AdminLayout() {
  const { t } = useTranslation();

  const navItems = [
    { to: ROUTES.admin, label: t("admin.overview") },
    { to: ROUTES.adminReports, label: t("admin.reports") },
    { to: ROUTES.adminUsers, label: t("admin.users") },
    { to: ROUTES.adminAudit, label: t("admin.auditLog") },
  ];

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <header className="border-b border-stone-300 bg-stone-900 text-stone-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-stone-400">{t("admin.administration")}</p>
            <Link to={ROUTES.admin} className="text-lg font-semibold text-white">
              {t("app.name")}
            </Link>
          </div>
          <Link to={ROUTES.feed} className="text-sm text-stone-300 hover:text-white">
            {t("nav.backToApp")}
          </Link>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 px-4 pb-3 sm:px-6">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-3 py-1.5 text-sm text-stone-300 hover:bg-stone-800 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
