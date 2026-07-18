import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { EmptyState } from "../components/EmptyState";
import { queryKeys } from "../constants/queryKeys";
import { fetchAuditLogs } from "../services/adminService";
import { getApiErrorMessage } from "../services/apiClient";
import { themeClasses } from "../lib/themeClasses";

export function AdminAuditLogPage() {
  const { t } = useTranslation();
  const auditQuery = useQuery({
    queryKey: queryKeys.adminAuditLogs(),
    queryFn: () => fetchAuditLogs(),
  });

  if (auditQuery.isLoading) {
    return <p className={themeClasses.muted}>{t("admin.loadingAudit")}</p>;
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
      <h1 className={themeClasses.pageTitle}>{t("admin.auditTitle")}</h1>
      <p className={`mt-1 text-sm ${themeClasses.body}`}>{t("admin.auditDescription")}</p>

      {logs.length === 0 ? (
        <div className="mt-8">
          <EmptyState title={t("admin.noAuditEntries")} description={t("admin.auditEntriesHint")} />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {logs.map((log) => (
            <li key={log.id} className={`p-4 text-sm ${themeClasses.card}`}>
              <p className={`font-medium ${themeClasses.heading}`}>{log.action}</p>
              <p className={themeClasses.body}>
                {log.adminEmail ?? log.adminId} · {log.targetType}
                {log.targetId ? ` · ${log.targetId}` : ""}
                {log.identityAccessed ? ` · ${t("admin.identityAccessed")}` : ""}
              </p>
              <p className={`mt-1 text-xs ${themeClasses.faint}`}>{new Date(log.createdAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
