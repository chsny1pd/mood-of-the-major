import { Suspense, lazy, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ROUTES } from "../constants/routes";
import { Button } from "./ui/Button";

const LanguageSwitcher = lazy(() =>
  import("./LanguageSwitcher").then((module) => ({ default: module.LanguageSwitcher })),
);
const ThemeToggle = lazy(() =>
  import("./ThemeToggle").then((module) => ({ default: module.ThemeToggle })),
);

const publicNavItems = [
  { to: ROUTES.feed, labelKey: "nav.feed" },
  { to: ROUTES.howToUse, labelKey: "nav.howToUse" },
] as const;

function navLinkClass({ isActive }: { isActive: boolean }) {
  return [
    "rounded-md px-2.5 py-1.5 transition",
    isActive
      ? "bg-orange-50 font-medium text-orange-900 dark:bg-orange-950 dark:text-orange-100"
      : "text-stone-600 hover:bg-stone-100 hover:text-orange-700 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-orange-300",
  ].join(" ");
}

export function PublicNavbar() {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="relative border-b border-stone-200/80 bg-white/80 backdrop-blur dark:border-stone-700 dark:bg-stone-950/80">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -bottom-6 h-6 bg-gradient-to-b from-orange-400/15 to-transparent dark:from-orange-500/10"
      />
      <div className="relative mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Link
            to={ROUTES.home}
            className="font-display shrink-0 text-lg font-semibold tracking-tight text-orange-700 dark:text-orange-300"
          >
            {t("app.name")}
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            {publicNavItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLinkClass}>
                {t(item.labelKey)}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
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

          <Suspense fallback={null}>
            <LanguageSwitcher />
          </Suspense>
          <Suspense fallback={null}>
            <ThemeToggle />
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
          className="border-t border-stone-200 px-4 py-3 lg:hidden dark:border-stone-700"
          aria-label="Mobile navigation"
        >
          <div className="flex flex-col gap-1">
            {publicNavItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLinkClass} onClick={closeMobile}>
                {t(item.labelKey)}
              </NavLink>
            ))}
            <NavLink to={ROUTES.login} className={navLinkClass} onClick={closeMobile}>
              {t("nav.logIn")}
            </NavLink>
            <NavLink to={ROUTES.register} className={navLinkClass} onClick={closeMobile}>
              {t("nav.join")}
            </NavLink>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
