import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "../components/EmptyState";
import { queryKeys } from "../constants/queryKeys";
import { fetchAdminDashboard } from "../services/adminService";
import { getApiErrorMessage } from "../services/apiClient";

export function AdminOverviewPage() {
  const dashboardQuery = useQuery({
    queryKey: queryKeys.adminDashboard,
    queryFn: fetchAdminDashboard,
  });

  if (dashboardQuery.isLoading) {
    return <p className="text-stone-500">Loading dashboard...</p>;
  }

  if (dashboardQuery.isError) {
    return (
      <EmptyState
        title="Could not load admin dashboard"
        description={getApiErrorMessage(dashboardQuery.error, "Try again later.")}
      />
    );
  }

  const data = dashboardQuery.data!;

  return (
    <section>
      <h1 className="text-2xl font-bold text-stone-900">Admin overview</h1>
      <p className="mt-1 text-sm text-stone-600">Platform moderation and accountability.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Open reports" value={data.openReports} />
        <KpiCard label="Actions today" value={data.actionsToday} />
        <KpiCard label="Active users (24h)" value={data.activeUsers24h} />
        <KpiCard label="Moods created (24h)" value={data.moodsCreated24h} />
      </div>

      <div className="mt-8 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-stone-900">Recent admin actions</h2>
        {data.recentActions.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">No actions recorded yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-stone-100">
            {data.recentActions.map((action) => (
              <li key={action.id} className="py-3 text-sm">
                <p className="font-medium text-stone-800">{action.action}</p>
                <p className="text-stone-500">
                  {action.adminEmail ?? action.adminId} · {action.targetType}
                  {action.targetId ? ` · ${action.targetId.slice(0, 8)}…` : ""}
                </p>
                <p className="text-xs text-stone-400">
                  {new Date(action.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-stone-900">{value.toLocaleString()}</p>
    </div>
  );
}
