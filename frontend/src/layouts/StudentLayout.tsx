import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ROUTES } from "../constants/routes";

export function StudentLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to={ROUTES.feed} className="text-lg font-semibold tracking-tight text-teal-800">
            Mood of the Major
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link to={ROUTES.feed} className="hidden text-stone-600 hover:text-teal-800 sm:inline">
              Feed
            </Link>
            {user ? (
              <>
                <Link to={ROUTES.search} className="hidden text-stone-600 hover:text-teal-800 sm:inline">
                  Search
                </Link>
                <Link
                  to={ROUTES.bookmarks}
                  className="hidden text-stone-600 hover:text-teal-800 sm:inline"
                >
                  Saved
                </Link>
              </>
            ) : null}
            {user ? (
              <Link
                to={ROUTES.create}
                className="rounded-full bg-teal-700 px-3 py-1 text-white hover:bg-teal-800"
              >
                Share
              </Link>
            ) : (
              <Link to={ROUTES.login} className="text-stone-600 hover:text-teal-800">
                Log in
              </Link>
            )}
            {user ? (
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-full border border-stone-300 px-3 py-1 text-stone-700 hover:bg-stone-100"
              >
                Log out
              </button>
            ) : null}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
