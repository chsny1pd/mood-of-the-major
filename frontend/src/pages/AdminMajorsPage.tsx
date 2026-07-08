import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "../components/EmptyState";
import { SubmitReferenceModal } from "../features/submissions/components/SubmitReferenceModal";
import { queryKeys } from "../constants/queryKeys";
import { useLocalizedName } from "../lib/useLocalizedName";
import { themeClasses } from "../lib/themeClasses";
import { fetchAdminMajors } from "../services/adminService";
import { getApiErrorMessage } from "../services/apiClient";

export function AdminMajorsPage() {
  const { t } = useTranslation();
  const localizedName = useLocalizedName();
  const [showAddMore, setShowAddMore] = useState(false);
  const majorsQuery = useQuery({
    queryKey: queryKeys.adminMajors,
    queryFn: fetchAdminMajors,
  });

  if (majorsQuery.isLoading) {
    return <p className={themeClasses.muted}>{t("admin.loadingMajors")}</p>;
  }

  if (majorsQuery.isError) {
    return (
      <EmptyState
        title={t("admin.majorsErrorTitle")}
        description={getApiErrorMessage(majorsQuery.error, t("common.tryAgainLater"))}
      />
    );
  }

  const majors = majorsQuery.data ?? [];

  return (
    <section>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${themeClasses.heading}`}>{t("admin.majorsTitle")}</h1>
          <p className={`mt-1 text-sm ${themeClasses.body}`}>{t("admin.majorsDescription")}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddMore(true)}
          className="shrink-0 rounded-xl bg-teal-800 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-900 dark:bg-teal-700 dark:hover:bg-teal-600"
        >
          {t("submissions.addMore")}
        </button>
      </div>

      {majors.length === 0 ? (
        <div className="mt-8">
          <EmptyState title={t("admin.noMajorsTitle")} description={t("admin.noMajorsDescription")} />
        </div>
      ) : (
        <div className={`mt-6 overflow-x-auto ${themeClasses.card}`}>
          <table className="min-w-full text-left text-sm">
            <thead className={`border-b ${themeClasses.border} ${themeClasses.surfaceMuted} ${themeClasses.body}`}>
              <tr>
                <th className="px-4 py-3 font-medium">{t("admin.tableName")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.tableFaculty")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.tableSlug")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.tableStatus")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.tableApproval")}</th>
              </tr>
            </thead>
            <tbody>
              {majors.map((major) => (
                <tr key={major.id} className={`border-b ${themeClasses.border} last:border-0 ${themeClasses.hoverRow}`}>
                  <td className={`px-4 py-3 ${themeClasses.subheading}`}>{localizedName(major)}</td>
                  <td className={`px-4 py-3 ${themeClasses.body}`}>{major.facultyName}</td>
                  <td className={`px-4 py-3 ${themeClasses.body}`}>{major.slug}</td>
                  <td className={`px-4 py-3 capitalize ${themeClasses.body}`}>
                    {major.isActive ? t("admin.active") : t("admin.inactive")}
                  </td>
                  <td className={`px-4 py-3 capitalize ${themeClasses.body}`}>{major.approvalStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showAddMore ? (
        <SubmitReferenceModal type="major" onClose={() => setShowAddMore(false)} />
      ) : null}
    </section>
  );
}
