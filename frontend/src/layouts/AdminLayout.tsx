import { Link, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ROUTES } from "../constants/routes";
import { themeClasses } from "../lib/themeClasses";

export function AdminLayout() {
  const { t } = useTranslation();

  const navItems = [
    { to: ROUTES.admin, label: t("admin.overview") },
    { to: ROUTES.adminPosts, label: t("admin.posts") },
    { to: ROUTES.adminReports, label: t("admin.reports") },
    { to: ROUTES.adminPending, label: t("admin.pending") },
    { to: ROUTES.adminUsers, label: t("admin.users") },
    { to: ROUTES.adminFaculties, label: t("admin.faculties") },
    { to: ROUTES.adminMajors, label: t("admin.majors") },
    { to: ROUTES.adminMoods, label: t("admin.moodTags") },
    { to: ROUTES.adminAudit, label: t("admin.auditLog") },
  ];

  return (
    <div className={themeClasses.adminPage}>
      <header className="border-b border-stone-700 bg-stone-900 text-stone-100 dark:border-stone-800">
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
        <nav className="mx-auto flex max-w-6xl flex-wrap gap-1 px-4 pb-3 sm:px-6">
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
