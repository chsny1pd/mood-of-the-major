export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-6 py-10 text-center dark:border-stone-600 dark:bg-stone-900">
      <h2 className="text-lg font-medium text-stone-800 dark:text-stone-200">{title}</h2>
      <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
