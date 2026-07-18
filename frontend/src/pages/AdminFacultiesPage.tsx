import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "../components/EmptyState";
import { SubmitReferenceModal } from "../features/submissions/components/SubmitReferenceModal";
import { queryKeys } from "../constants/queryKeys";
import { useLocalizedName } from "../lib/useLocalizedName";
import { themeClasses } from "../lib/themeClasses";
import { fetchAdminFaculties } from "../services/adminService";
import { getApiErrorMessage } from "../services/apiClient";

export function AdminFacultiesPage() {
  const { t } = useTranslation();
  const localizedName = useLocalizedName();
  const [showAddMore, setShowAddMore] = useState(false);
  const facultiesQuery = useQuery({
    queryKey: queryKeys.adminFaculties,
    queryFn: fetchAdminFaculties,
  });

  if (facultiesQuery.isLoading) {
    return <p className={themeClasses.muted}>{t("admin.loadingFaculties")}</p>;
  }

  if (facultiesQuery.isError) {
    return (
      <EmptyState
        title={t("admin.facultiesErrorTitle")}
        description={getApiErrorMessage(facultiesQuery.error, t("common.tryAgainLater"))}
      />
    );
  }

  const faculties = facultiesQuery.data ?? [];

  return (
    <section>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${themeClasses.heading}`}>{t("admin.facultiesTitle")}</h1>
          <p className={`mt-1 text-sm ${themeClasses.body}`}>{t("admin.facultiesDescription")}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddMore(true)}
          className="shrink-0 rounded-xl bg-orange-800 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-900 dark:bg-orange-700 dark:hover:bg-orange-600"
        >
          {t("submissions.addMore")}
        </button>
      </div>

      {faculties.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title={t("admin.noFacultiesTitle")}
            description={t("admin.noFacultiesDescription")}
          />
        </div>
      ) : (
        <div className={`mt-6 overflow-x-auto ${themeClasses.card}`}>
          <table className="min-w-full text-left text-sm">
            <thead className={`border-b ${themeClasses.border} ${themeClasses.surfaceMuted} ${themeClasses.body}`}>
              <tr>
                <th className="px-4 py-3 font-medium">{t("admin.tableName")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.tableSlug")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.tableStatus")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.tableApproval")}</th>
              </tr>
            </thead>
            <tbody>
              {faculties.map((faculty) => (
                <tr key={faculty.id} className={`border-b ${themeClasses.border} last:border-0 ${themeClasses.hoverRow}`}>
                  <td className={`px-4 py-3 ${themeClasses.subheading}`}>{localizedName(faculty)}</td>
                  <td className={`px-4 py-3 ${themeClasses.body}`}>{faculty.slug}</td>
                  <td className={`px-4 py-3 capitalize ${themeClasses.body}`}>
                    {faculty.isActive ? t("admin.active") : t("admin.inactive")}
                  </td>
                  <td className={`px-4 py-3 capitalize ${themeClasses.body}`}>{faculty.approvalStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showAddMore ? (
        <SubmitReferenceModal type="faculty" onClose={() => setShowAddMore(false)} />
      ) : null}
    </section>
  );
}
