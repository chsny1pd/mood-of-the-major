import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { EmptyState } from "../components/EmptyState";
import { queryKeys } from "../constants/queryKeys";
import { themeClasses } from "../lib/themeClasses";
import { fetchAdminDashboard } from "../services/adminService";
import { getApiErrorMessage } from "../services/apiClient";

export function AdminOverviewPage() {
  const { t } = useTranslation();
  const dashboardQuery = useQuery({
    queryKey: queryKeys.adminDashboard,
    queryFn: fetchAdminDashboard,
  });

  if (dashboardQuery.isLoading) {
    return <p className={themeClasses.muted}>{t("admin.loadingDashboard")}</p>;
  }

  if (dashboardQuery.isError) {
    return (
      <EmptyState
        title={t("admin.dashboardErrorTitle")}
        description={getApiErrorMessage(dashboardQuery.error, t("common.tryAgainLater"))}
      />
    );
  }

  const data = dashboardQuery.data!;

  return (
    <section>
      <h1 className={themeClasses.pageTitle}>{t("admin.overviewTitle")}</h1>
      <p className={`mt-1 text-sm ${themeClasses.body}`}>{t("admin.overviewDescription")}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={t("admin.kpiTotalUsers")} value={data.totalUsers} />
        <KpiCard label={t("admin.kpiTotalPosts")} value={data.totalPosts} />
        <KpiCard label={t("admin.kpiTotalMoods")} value={data.totalMoods} />
        <KpiCard label={t("admin.kpiTotalFaculties")} value={data.totalFaculties} />
        <KpiCard label={t("admin.kpiTotalMajors")} value={data.totalMajors} />
        <KpiCard label={t("admin.kpiPendingSubmissions")} value={data.pendingSubmissions} />
        <KpiCard label={t("admin.kpiOpenReports")} value={data.openReports} />
        <KpiCard label={t("admin.kpiActionsToday")} value={data.actionsToday} />
        <KpiCard label={t("admin.kpiActiveUsers24h")} value={data.activeUsers24h} />
        <KpiCard label={t("admin.kpiMoodsCreated24h")} value={data.moodsCreated24h} />
      </div>

      <div className={`mt-8 p-4 ${themeClasses.card}`}>
        <h2 className={`font-semibold ${themeClasses.heading}`}>{t("admin.recentActions")}</h2>
        {data.recentActions.length === 0 ? (
          <p className={`mt-3 text-sm ${themeClasses.muted}`}>{t("admin.noActionsYet")}</p>
        ) : (
          <ul className={`mt-3 divide-y ${themeClasses.divider}`}>
            {data.recentActions.map((action) => (
              <li key={action.id} className="py-3 text-sm">
                <p className={`font-medium ${themeClasses.subheading}`}>{action.action}</p>
                <p className={themeClasses.muted}>
                  {action.adminEmail ?? action.adminId} · {action.targetType}
                  {action.targetId ? ` · ${action.targetId.slice(0, 8)}…` : ""}
                </p>
                <p className={`text-xs ${themeClasses.faint}`}>
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
    <div className={`p-4 ${themeClasses.card}`}>
      <p className={`text-sm ${themeClasses.muted}`}>{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${themeClasses.heading}`}>{value.toLocaleString()}</p>
    </div>
  );
}
