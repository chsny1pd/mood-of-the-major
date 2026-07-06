import type { ReactNode } from "react";

interface ChartContainerProps {
  title: string;
  meetsThreshold: boolean;
  children: ReactNode;
}

export function ChartContainer({ title, meetsThreshold, children }: ChartContainerProps) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-stone-900">{title}</h2>
      {meetsThreshold ? (
        children
      ) : (
        <div className="rounded-xl bg-stone-50 px-4 py-8 text-center">
          <p className="font-medium text-stone-700">Insufficient data</p>
          <p className="mt-1 text-sm text-stone-500">
            Aggregated statistics are hidden when group sizes are too small to protect anonymity.
          </p>
        </div>
      )}
    </section>
  );
}
