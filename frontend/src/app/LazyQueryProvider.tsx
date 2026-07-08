import { lazy, Suspense, type ReactNode } from "react";

const QueryProvider = lazy(() =>
  import("./QueryProvider").then((module) => ({ default: module.QueryProvider })),
);

interface LazyQueryProviderProps {
  children: ReactNode;
}

export function LazyQueryProvider({ children }: LazyQueryProviderProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-stone-500" role="status">
          Loading...
        </div>
      }
    >
      <QueryProvider>{children}</QueryProvider>
    </Suspense>
  );
}
