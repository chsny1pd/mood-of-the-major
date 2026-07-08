import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "../components/EmptyState";
import { queryKeys } from "../constants/queryKeys";
import { fetchAdminReports, resolveReport, type AdminReportItem } from "../services/adminService";
import { getApiErrorMessage } from "../services/apiClient";
import { getReportReasonTranslationKey, type ReportReasonCode } from "../types/engagement";
import { themeClasses } from "../lib/themeClasses";

const pendingReportsQueryKey = queryKeys.adminReports({ status: "pending" });

type AdminReportsResponse = Awaited<ReturnType<typeof fetchAdminReports>>;

export function AdminReportsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const reportsQuery = useQuery({
    queryKey: pendingReportsQueryKey,
    queryFn: () => fetchAdminReports({ status: "pending" }),
  });

  const resolveMutation = useMutation({
    mutationFn: ({
      reportId,
      status,
      removeContent,
    }: {
      reportId: string;
      status: "resolved_removed" | "resolved_dismissed" | "resolved_warned";
      removeContent?: boolean;
    }) => resolveReport(reportId, { status, removeContent }),
    onMutate: async ({ reportId }) => {
      setActionError(null);
      await queryClient.cancelQueries({ queryKey: queryKeys.adminReports() });

      const previous = queryClient.getQueryData<AdminReportsResponse>(pendingReportsQueryKey);

      if (previous) {
        const nextReports = previous.data.filter((report) => report.id !== reportId);
        queryClient.setQueryData<AdminReportsResponse>(pendingReportsQueryKey, {
          ...previous,
          data: nextReports,
          meta: {
            ...previous.meta,
            pendingCount: Math.max(0, (previous.meta.pendingCount ?? previous.data.length) - 1),
          },
        });
      }

      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(pendingReportsQueryKey, context.previous);
      }
      setActionError(getApiErrorMessage(error, t("admin.reportUpdateError")));
      setResolvingId(null);
    },
    onSuccess: () => {
      setResolvingId(null);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminReports() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminDashboard });
    },
  });

  const handleResolve = useCallback(
    (
      reportId: string,
      status: "resolved_removed" | "resolved_dismissed" | "resolved_warned",
      removeContent?: boolean,
    ) => {
      setResolvingId(reportId);
      void resolveMutation.mutate({ reportId, status, removeContent });
    },
    [resolveMutation],
  );

  if (reportsQuery.isLoading) {
    return <p className={themeClasses.muted}>{t("admin.loadingReports")}</p>;
  }

  if (reportsQuery.isError) {
    return (
      <EmptyState
        title={t("admin.reportsErrorTitle")}
        description={getApiErrorMessage(reportsQuery.error, t("common.tryAgainLater"))}
      />
    );
  }

  const reports = reportsQuery.data?.data ?? [];
  const pendingCount = reportsQuery.data?.meta.pendingCount ?? reports.length;

  return (
    <section>
      <h1 className={`text-2xl font-bold ${themeClasses.heading}`}>{t("admin.reportQueueTitle")}</h1>
      <p className={`mt-1 text-sm ${themeClasses.body}`}>{t("admin.pendingReports", { count: pendingCount })}</p>

      {actionError ? <p className={`mt-4 ${themeClasses.errorBox}`}>{actionError}</p> : null}

      {reports.length === 0 ? (
        <div className="mt-8">
          <EmptyState title={t("admin.queueClearTitle")} description={t("admin.queueClearDescription")} />
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {reports.map((report) => (
            <ReportRow
              key={report.id}
              report={report}
              isResolving={resolvingId === report.id && resolveMutation.isPending}
              onResolve={handleResolve}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

const ReportRow = memo(function ReportRow({
  report,
  isResolving,
  onResolve,
}: {
  report: AdminReportItem;
  isResolving: boolean;
  onResolve: (
    reportId: string,
    status: "resolved_removed" | "resolved_dismissed" | "resolved_warned",
    removeContent?: boolean,
  ) => void;
}) {
  const { t } = useTranslation();
  const reasonKey = getReportReasonTranslationKey(report.reasonCode as ReportReasonCode);

  return (
    <li className={`p-4 ${themeClasses.card}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={`text-xs uppercase tracking-wide ${themeClasses.muted}`}>
            {report.targetType} · {t(reasonKey)}
          </p>
          <p className={`mt-1 text-sm ${themeClasses.subheading}`}>{report.contentPreview ?? "—"}</p>
          {report.description ? (
            <p className={`mt-1 text-sm ${themeClasses.body}`}>{report.description}</p>
          ) : null}
          <p className={`mt-2 text-xs ${themeClasses.faint}`}>
            {new Date(report.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isResolving}
            onClick={() => onResolve(report.id, "resolved_dismissed")}
            className={`rounded-md border px-3 py-1 text-sm disabled:opacity-50 ${themeClasses.border} ${themeClasses.hoverRow}`}
          >
            {t("admin.dismiss")}
          </button>
          <button
            type="button"
            disabled={isResolving}
            onClick={() => onResolve(report.id, "resolved_removed", true)}
            className="rounded-md bg-red-700 px-3 py-1 text-sm text-white hover:bg-red-800 disabled:opacity-50"
          >
            {t("admin.removeContent")}
          </button>
        </div>
      </div>
    </li>
  );
});
