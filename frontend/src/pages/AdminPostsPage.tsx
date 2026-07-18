import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { EmptyState } from "../components/EmptyState";
import { queryKeys } from "../constants/queryKeys";
import { themeClasses } from "../lib/themeClasses";
import { fetchAdminContentMoods } from "../services/adminService";
import { getApiErrorMessage } from "../services/apiClient";

export function AdminPostsPage() {
  const { t } = useTranslation();
  const postsQuery = useQuery({
    queryKey: queryKeys.adminContentMoods(),
    queryFn: () => fetchAdminContentMoods(),
  });

  if (postsQuery.isLoading) {
    return <p className={themeClasses.muted}>{t("admin.loadingPosts")}</p>;
  }

  if (postsQuery.isError) {
    return (
      <EmptyState
        title={t("admin.postsErrorTitle")}
        description={getApiErrorMessage(postsQuery.error, t("common.tryAgainLater"))}
      />
    );
  }

  const posts = postsQuery.data?.data ?? [];

  return (
    <section>
      <h1 className={themeClasses.pageTitle}>{t("admin.postsTitle")}</h1>
      <p className={`mt-1 text-sm ${themeClasses.body}`}>{t("admin.postsDescription")}</p>

      {posts.length === 0 ? (
        <div className="mt-8">
          <EmptyState title={t("admin.noPostsTitle")} description={t("admin.noPostsDescription")} />
        </div>
      ) : (
        <div className={`mt-6 overflow-x-auto ${themeClasses.card}`}>
          <table className="min-w-full text-left text-sm">
            <thead className={`border-b ${themeClasses.border} ${themeClasses.surfaceMuted} ${themeClasses.body}`}>
              <tr>
                <th className="px-4 py-3 font-medium">{t("admin.tablePreview")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.tableStatus")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.tableReports")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.tableComments")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.tableCreated")}</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className={`border-b ${themeClasses.border} last:border-0 ${themeClasses.hoverRow}`}>
                  <td className={`max-w-xs truncate px-4 py-3 ${themeClasses.subheading}`}>
                    {post.contentPreview}
                  </td>
                  <td className={`px-4 py-3 capitalize ${themeClasses.body}`}>{post.status}</td>
                  <td className={`px-4 py-3 ${themeClasses.body}`}>{post.reportCount}</td>
                  <td className={`px-4 py-3 ${themeClasses.body}`}>{post.commentCount}</td>
                  <td className={`px-4 py-3 ${themeClasses.faint}`}>
                    {new Date(post.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
