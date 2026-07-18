import { Suspense, lazy, useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ROUTES } from "../constants/routes";
import { ensureDisplayFont } from "../lib/displayFont";
import { useAuth } from "../hooks/useAuth";
import { Button } from "./ui/Button";

const LanguageSwitcher = lazy(() =>
  import("./LanguageSwitcher").then((module) => ({ default: module.LanguageSwitcher })),
);
const ThemeToggle = lazy(() =>
  import("./ThemeToggle").then((module) => ({ default: module.ThemeToggle })),
);
const UserMenu = lazy(() => import("./UserMenu").then((module) => ({ default: module.UserMenu })));

interface NavItem {
  to: string;
  labelKey: string;
  requiresAuth?: boolean;
  adminOnly?: boolean;
}

const primaryNavItems: NavItem[] = [
  { to: ROUTES.feed, labelKey: "nav.feed" },
  { to: ROUTES.groups, labelKey: "nav.groups", requiresAuth: true },
  { to: ROUTES.dashboard, labelKey: "nav.dashboard" },
];

const authenticatedNavItems: NavItem[] = [
  { to: ROUTES.bookmarks, labelKey: "nav.saved", requiresAuth: true },
  { to: ROUTES.admin, labelKey: "nav.admin", requiresAuth: true, adminOnly: true },
];

function navLinkClass({ isActive }: { isActive: boolean }) {
  return [
    "rounded-md px-2.5 py-1.5 transition",
    isActive
      ? "bg-orange-50 font-medium text-orange-900 dark:bg-orange-950 dark:text-orange-100"
      : "text-stone-600 hover:bg-stone-100 hover:text-orange-700 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-orange-300",
  ].join(" ");
}

function NotificationsBellLink({ className = "" }: { className?: string }) {
  const { t } = useTranslation();

  return (
    <NavLink
      to={ROUTES.notifications}
      aria-label={t("nav.inbox")}
      title={t("nav.inbox")}
      className={({ isActive }) =>
        [
          "inline-flex h-9 w-9 items-center justify-center rounded-full transition",
          isActive
            ? "bg-orange-50 text-orange-800 dark:bg-orange-950 dark:text-orange-200"
            : "text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800",
          className,
        ].join(" ")
      }
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
    </NavLink>
  );
}

interface AppNavbarProps {
  variant?: "public" | "app";
}

export function AppNavbar({ variant = "app" }: AppNavbarProps) {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    ensureDisplayFont();
  }, []);

  const visibleItems = [
    ...primaryNavItems.filter((item) => {
      if (item.requiresAuth) {
        return isAuthenticated;
      }
      return true;
    }),
    ...authenticatedNavItems.filter((item) => {
      if (item.adminOnly) {
        return user?.role === "administrator";
      }

      if (item.requiresAuth) {
        return isAuthenticated;
      }

      return true;
    }),
  ];

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-white/80 backdrop-blur dark:border-stone-700 dark:bg-stone-950/80">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -bottom-6 h-6 bg-gradient-to-b from-orange-400/15 to-transparent dark:from-orange-500/10"
      />
      <div className="relative mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Link
            to={isAuthenticated ? ROUTES.dashboard : ROUTES.home}
            className="font-display shrink-0 text-lg font-semibold tracking-tight text-orange-700 dark:text-orange-300"
          >
            {t("app.name")}
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            {visibleItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLinkClass}>
                {t(item.labelKey)}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="relative z-10 flex items-center gap-1 sm:gap-2">
          <Link to={ROUTES.howToUse} className="hidden sm:inline-flex">
            <Button variant="outline" size="sm" className="rounded-full">
              {t("nav.howToUse")}
            </Button>
          </Link>

          {isAuthenticated ? (
            <Link to={ROUTES.create} className="hidden sm:inline-flex">
              <Button size="sm" className="rounded-full">
                {t("nav.share")}
              </Button>
            </Link>
          ) : variant === "public" ? (
            <>
              <Link to={ROUTES.login} className="hidden sm:inline-flex">
                <Button variant="ghost" size="sm">
                  {t("nav.logIn")}
                </Button>
              </Link>
              <Link to={ROUTES.register} className="hidden sm:inline-flex">
                <Button size="sm" className="rounded-full">
                  {t("nav.join")}
                </Button>
              </Link>
            </>
          ) : null}

          <Suspense fallback={null}>
            <LanguageSwitcher />
          </Suspense>
          <Suspense fallback={null}>
            <ThemeToggle />
          </Suspense>
          {isAuthenticated ? <NotificationsBellLink /> : null}
          <Suspense fallback={null}>
            <UserMenu />
          </Suspense>

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-stone-600 hover:bg-stone-100 lg:hidden dark:text-stone-300 dark:hover:bg-stone-800"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? t("nav.closeMenu") : t("nav.menu")}
            onClick={() => setMobileOpen((value) => !value)}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileOpen ? <path d="M6 18 18 6M6 6l12 12" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <nav
          className="relative z-10 border-t border-stone-200 px-4 py-3 lg:hidden dark:border-stone-700"
          aria-label="Mobile navigation"
        >
          <div className="flex flex-col gap-1">
            {visibleItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLinkClass} onClick={closeMobile}>
                {t(item.labelKey)}
              </NavLink>
            ))}

            <NavLink to={ROUTES.howToUse} className={navLinkClass} onClick={closeMobile}>
              {t("nav.howToUse")}
            </NavLink>

            {isAuthenticated ? (
              <NavLink to={ROUTES.create} className={navLinkClass} onClick={closeMobile}>
                {t("nav.share")}
              </NavLink>
            ) : (
              <>
                <NavLink to={ROUTES.login} className={navLinkClass} onClick={closeMobile}>
                  {t("nav.logIn")}
                </NavLink>
                {variant === "public" ? (
                  <NavLink to={ROUTES.register} className={navLinkClass} onClick={closeMobile}>
                    {t("nav.join")}
                  </NavLink>
                ) : null}
              </>
            )}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
