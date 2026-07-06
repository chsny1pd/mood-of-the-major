import { Suspense, lazy, type ComponentType } from "react";

export function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-stone-500" role="status">
      Loading...
    </div>
  );
}

export function lazyRoute<T extends Record<string, ComponentType>>(
  importFn: () => Promise<T>,
  exportName: keyof T & string,
) {
  const LazyComponent = lazy(() =>
    importFn().then((module) => ({ default: module[exportName] as ComponentType })),
  );

  return function LazyRoute() {
    return (
      <Suspense fallback={<RouteFallback />}>
        <LazyComponent />
      </Suspense>
    );
  };
}
