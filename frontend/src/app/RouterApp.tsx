import { Suspense, lazy } from "react";
import { StaticHomeFallback } from "./StaticHomeFallback";

const RouterShell = lazy(() => import("./RouterShell"));

const isMarketingHome =
  typeof window !== "undefined" &&
  (window.location.pathname === "/" || window.location.pathname === "");

// Warm the home critical path in parallel with the shell lazy() boundary.
if (isMarketingHome) {
  void import("./RouterShell");
  void import("./routes/homeRoute");
}

function RouterFallback() {
  if (isMarketingHome) {
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
