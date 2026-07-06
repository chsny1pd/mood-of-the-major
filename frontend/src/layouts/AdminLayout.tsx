import { Link, Outlet } from "react-router-dom";
import { ROUTES } from "../constants/routes";

const navItems = [
  { to: ROUTES.admin, label: "Overview" },
  { to: ROUTES.adminReports, label: "Reports" },
  { to: ROUTES.adminUsers, label: "Users" },
  { to: ROUTES.adminAudit, label: "Audit log" },
];

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <header className="border-b border-stone-300 bg-stone-900 text-stone-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-stone-400">Administration</p>
            <Link to={ROUTES.admin} className="text-lg font-semibold text-white">
              Mood of the Major
            </Link>
          </div>
          <Link to={ROUTES.feed} className="text-sm text-stone-300 hover:text-white">
            Back to app
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
