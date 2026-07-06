import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "../components/EmptyState";
import { queryKeys } from "../constants/queryKeys";
import { fetchAuditLogs } from "../services/adminService";
import { getApiErrorMessage } from "../services/apiClient";

export function AdminAuditLogPage() {
  const auditQuery = useQuery({
    queryKey: queryKeys.adminAuditLogs(),
    queryFn: () => fetchAuditLogs(),
  });

  if (auditQuery.isLoading) {
    return <p className="text-stone-500">Loading audit log...</p>;
  }

  if (auditQuery.isError) {
    return (
      <EmptyState
        title="Could not load audit log"
        description={getApiErrorMessage(auditQuery.error, "Try again later.")}
      />
    );
  }

  const logs = auditQuery.data?.data ?? [];

  return (
    <section>
      <h1 className="text-2xl font-bold text-stone-900">Audit log</h1>
      <p className="mt-1 text-sm text-stone-600">Append-only record of administrative actions.</p>

      {logs.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No audit entries yet" description="Actions will appear here." />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {logs.map((log) => (
            <li key={log.id} className="rounded-xl border border-stone-200 bg-white p-4 text-sm shadow-sm">
              <p className="font-medium text-stone-900">{log.action}</p>
              <p className="text-stone-600">
                {log.adminEmail ?? log.adminId} · {log.targetType}
                {log.targetId ? ` · ${log.targetId}` : ""}
                {log.identityAccessed ? " · identity accessed" : ""}
              </p>
              <p className="mt-1 text-xs text-stone-400">{new Date(log.createdAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
