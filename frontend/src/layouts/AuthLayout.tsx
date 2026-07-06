import { Link, Outlet } from "react-router-dom";
import { ROUTES } from "../constants/routes";

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to={ROUTES.home} className="text-lg font-semibold text-teal-800">
            Mood of the Major
          </Link>
          <p className="mt-2 text-sm text-stone-600">Anonymous sharing for university communities</p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
