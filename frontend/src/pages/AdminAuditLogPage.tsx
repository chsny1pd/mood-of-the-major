import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { EmptyState } from "../components/EmptyState";
import { queryKeys } from "../constants/queryKeys";
import { fetchAuditLogs } from "../services/adminService";
import { getApiErrorMessage } from "../services/apiClient";

export function AdminAuditLogPage() {
  const { t } = useTranslation();
  const auditQuery = useQuery({
    queryKey: queryKeys.adminAuditLogs(),
    queryFn: () => fetchAuditLogs(),
  });

  if (auditQuery.isLoading) {
    return <p className="text-stone-500">{t("admin.loadingAudit")}</p>;
  }

  if (auditQuery.isError) {
    return (
      <EmptyState
        title={t("admin.auditErrorTitle")}
        description={getApiErrorMessage(auditQuery.error, t("common.tryAgainLater"))}
      />
    );
  }

  const logs = auditQuery.data?.data ?? [];

  return (
    <section>
      <h1 className="text-2xl font-bold text-stone-900">{t("admin.auditTitle")}</h1>
      <p className="mt-1 text-sm text-stone-600">{t("admin.auditDescription")}</p>

      {logs.length === 0 ? (
        <div className="mt-8">
          <EmptyState title={t("admin.noAuditEntries")} description={t("admin.auditEntriesHint")} />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {logs.map((log) => (
            <li key={log.id} className="rounded-xl border border-stone-200 bg-white p-4 text-sm shadow-sm">
              <p className="font-medium text-stone-900">{log.action}</p>
              <p className="text-stone-600">
                {log.adminEmail ?? log.adminId} · {log.targetType}
                {log.targetId ? ` · ${log.targetId}` : ""}
                {log.identityAccessed ? ` · ${t("admin.identityAccessed")}` : ""}
              </p>
              <p className="mt-1 text-xs text-stone-400">{new Date(log.createdAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
