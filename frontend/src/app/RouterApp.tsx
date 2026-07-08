import { Suspense, lazy } from "react";
import { StaticHomeFallback } from "./StaticHomeFallback";

const RouterShell = lazy(() => import("./RouterShell"));

function RouterFallback() {
  if (typeof window !== "undefined" && window.location.pathname === "/") {
    return <StaticHomeFallback />;
  }

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-stone-500 dark:text-stone-400" role="status">
      Loading...
    </div>
  );
}

export default function RouterApp() {
  return (
    <Suspense fallback={<RouterFallback />}>
      <RouterShell />
    </Suspense>
  );
}
