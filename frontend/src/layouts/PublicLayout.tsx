import { Outlet } from "react-router-dom";
import { ROUTES } from "../constants/routes";

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <a href={ROUTES.home} className="text-lg font-semibold tracking-tight text-teal-800">
            Mood of the Major
          </a>
          <nav className="flex items-center gap-3 text-sm">
            <a
              href={ROUTES.login}
              className="rounded-full px-3 py-1 text-stone-700 hover:bg-stone-100"
            >
              Sign in
            </a>
            <a
              href={ROUTES.register}
              className="rounded-full bg-teal-800 px-3 py-1 font-medium text-white hover:bg-teal-900"
            >
              Join
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-stone-500 sm:px-6">
          Anonymous emotional sharing for university communities.
        </div>
      </footer>
    </div>
  );
}
