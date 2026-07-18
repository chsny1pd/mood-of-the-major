import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "../components/EmptyState";
import { SubmitReferenceModal } from "../features/submissions/components/SubmitReferenceModal";
import { queryKeys } from "../constants/queryKeys";
import { useLocalizedName } from "../lib/useLocalizedName";
import { emotionEmoji } from "../lib/emotionEmoji";
import { themeClasses } from "../lib/themeClasses";
import { fetchAdminMoodTags } from "../services/adminService";
import { getApiErrorMessage } from "../services/apiClient";

export function AdminMoodsPage() {
  const { t } = useTranslation();
  const localizedName = useLocalizedName();
  const [showAddMore, setShowAddMore] = useState(false);
  const tagsQuery = useQuery({
    queryKey: queryKeys.adminMoodTags,
    queryFn: fetchAdminMoodTags,
  });

  if (tagsQuery.isLoading) {
    return <p className={themeClasses.muted}>{t("admin.loadingMoodTags")}</p>;
  }

  if (tagsQuery.isError) {
    return (
      <EmptyState
        title={t("admin.moodTagsErrorTitle")}
        description={getApiErrorMessage(tagsQuery.error, t("common.tryAgainLater"))}
      />
    );
  }

  const tags = tagsQuery.data ?? [];

  return (
    <section>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className={themeClasses.pageTitle}>{t("admin.moodTagsTitle")}</h1>
          <p className={`mt-1 text-sm ${themeClasses.body}`}>{t("admin.moodTagsDescription")}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddMore(true)}
          className="shrink-0 rounded-xl bg-orange-800 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-900 dark:bg-orange-700 dark:hover:bg-orange-600"
        >
          {t("submissions.addMore")}
        </button>
      </div>

      {tags.length === 0 ? (
        <div className="mt-8">
          <EmptyState title={t("admin.noMoodTagsTitle")} description={t("admin.noMoodTagsDescription")} />
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
              {tags.map((tag) => (
                <tr key={tag.id} className={`border-b ${themeClasses.border} last:border-0 ${themeClasses.hoverRow}`}>
                  <td className={`px-4 py-3 ${themeClasses.subheading}`}>
                    <span aria-hidden="true">{emotionEmoji(tag.slug)}</span> {localizedName(tag)}
                  </td>
                  <td className={`px-4 py-3 ${themeClasses.body}`}>{tag.slug}</td>
                  <td className={`px-4 py-3 capitalize ${themeClasses.body}`}>
                    {tag.isActive ? t("admin.active") : t("admin.inactive")}
                  </td>
                  <td className={`px-4 py-3 capitalize ${themeClasses.body}`}>{tag.approvalStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showAddMore ? (
        <SubmitReferenceModal type="tag" onClose={() => setShowAddMore(false)} />
      ) : null}
    </section>
  );
}
