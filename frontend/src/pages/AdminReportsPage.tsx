import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { queryKeys } from "../constants/queryKeys";
import { fetchAdminReports, resolveReport, type AdminReportItem } from "../services/adminService";
import { getApiErrorMessage } from "../services/apiClient";

export function AdminReportsPage() {
  const queryClient = useQueryClient();
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const reportsQuery = useQuery({
    queryKey: queryKeys.adminReports({ status: "pending" }),
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
    onSuccess: async () => {
      setResolvingId(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminReports() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminDashboard });
    },
  });

  if (reportsQuery.isLoading) {
    return <p className="text-stone-500">Loading report queue...</p>;
  }

  if (reportsQuery.isError) {
    return (
      <EmptyState
        title="Could not load reports"
        description={getApiErrorMessage(reportsQuery.error, "Try again later.")}
      />
    );
  }

  const reports = reportsQuery.data?.data ?? [];
  const pendingCount = reportsQuery.data?.meta.pendingCount ?? reports.length;

  return (
    <section>
      <h1 className="text-2xl font-bold text-stone-900">Report queue</h1>
      <p className="mt-1 text-sm text-stone-600">{pendingCount} pending report(s)</p>

      {reports.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="Queue is clear" description="No pending reports need review." />
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {reports.map((report) => (
            <ReportRow
              key={report.id}
              report={report}
              isResolving={resolvingId === report.id && resolveMutation.isPending}
              onResolve={(status, removeContent) => {
                setResolvingId(report.id);
                void resolveMutation.mutate({ reportId: report.id, status, removeContent });
              }}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function ReportRow({
  report,
  isResolving,
  onResolve,
}: {
  report: AdminReportItem;
  isResolving: boolean;
  onResolve: (
    status: "resolved_removed" | "resolved_dismissed" | "resolved_warned",
    removeContent?: boolean,
  ) => void;
}) {
  return (
    <li className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-500">
            {report.targetType} · {report.reasonCode}
          </p>
          <p className="mt-1 text-sm text-stone-800">{report.contentPreview ?? "—"}</p>
          {report.description ? (
            <p className="mt-1 text-sm text-stone-600">{report.description}</p>
          ) : null}
          <p className="mt-2 text-xs text-stone-400">
            {new Date(report.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isResolving}
            onClick={() => onResolve("resolved_dismissed")}
            className="rounded-md border border-stone-300 px-3 py-1 text-sm hover:bg-stone-50 disabled:opacity-50"
          >
            Dismiss
          </button>
          <button
            type="button"
            disabled={isResolving}
            onClick={() => onResolve("resolved_removed", true)}
            className="rounded-md bg-red-700 px-3 py-1 text-sm text-white hover:bg-red-800 disabled:opacity-50"
          >
            Remove content
          </button>
        </div>
      </div>
    </li>
  );
}
