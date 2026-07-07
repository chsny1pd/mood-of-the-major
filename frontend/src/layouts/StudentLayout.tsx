import { Outlet } from "react-router-dom";
import { AppNavbar } from "../components/AppNavbar";

export function StudentLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <AppNavbar variant="app" />

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
