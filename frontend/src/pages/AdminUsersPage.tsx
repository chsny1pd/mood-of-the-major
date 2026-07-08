import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "../components/EmptyState";
import { queryKeys } from "../constants/queryKeys";
import { fetchAdminUsers, updateUserStatus, type AdminUserItem } from "../services/adminService";
import { getApiErrorMessage } from "../services/apiClient";
import { themeClasses } from "../lib/themeClasses";

export function AdminUsersPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const usersQuery = useQuery({
    queryKey: queryKeys.adminUsers({ q: search || undefined }),
    queryFn: () => fetchAdminUsers({ q: search || undefined }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: "active" | "suspended" }) =>
      updateUserStatus(userId, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers() });
    },
  });

  return (
    <section>
      <h1 className={`text-2xl font-bold ${themeClasses.heading}`}>{t("admin.usersTitle")}</h1>
      <p className={`mt-1 text-sm ${themeClasses.body}`}>{t("admin.usersDescription")}</p>

      <label className={`mt-6 block max-w-md text-sm ${themeClasses.label}`}>
        <span className="mb-1 block font-medium">{t("admin.searchByEmail")}</span>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className={themeClasses.input}
          placeholder={t("admin.searchPlaceholder")}
        />
      </label>

      {usersQuery.isLoading ? (
        <p className={`mt-6 ${themeClasses.muted}`}>{t("admin.loadingUsers")}</p>
      ) : usersQuery.isError ? (
        <div className="mt-6">
          <EmptyState
            title={t("admin.usersErrorTitle")}
            description={getApiErrorMessage(usersQuery.error, t("common.tryAgainLater"))}
          />
        </div>
      ) : (
        <div className={`mt-6 overflow-x-auto ${themeClasses.card}`}>
          <table className="min-w-full text-left text-sm">
            <thead className={`border-b ${themeClasses.border} ${themeClasses.surfaceMuted} ${themeClasses.body}`}>
              <tr>
                <th className="px-4 py-3 font-medium">{t("admin.tableEmail")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.tableRole")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.tableStatus")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.tableActions")}</th>
              </tr>
            </thead>
            <tbody>
              {(usersQuery.data?.data ?? []).map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  isUpdating={statusMutation.isPending && statusMutation.variables?.userId === user.id}
                  onToggleStatus={(status) => statusMutation.mutate({ userId: user.id, status })}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function UserRow({
  user,
  isUpdating,
  onToggleStatus,
}: {
  user: AdminUserItem;
  isUpdating: boolean;
  onToggleStatus: (status: "active" | "suspended") => void;
}) {
  const { t } = useTranslation();
  const isAdmin = user.role === "administrator";

  return (
    <tr className={`border-b ${themeClasses.border} last:border-0 ${themeClasses.hoverRow}`}>
      <td className={`px-4 py-3 ${themeClasses.subheading}`}>{user.email}</td>
      <td className={`px-4 py-3 capitalize ${themeClasses.body}`}>{user.role}</td>
      <td className={`px-4 py-3 capitalize ${themeClasses.body}`}>{user.status}</td>
      <td className="px-4 py-3">
        {isAdmin ? (
          <span className={themeClasses.faint}>{t("admin.protected")}</span>
        ) : user.status === "active" ? (
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onToggleStatus("suspended")}
            className="text-red-700 hover:underline disabled:opacity-50 dark:text-red-400"
          >
            {t("admin.suspend")}
          </button>
        ) : (
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onToggleStatus("active")}
            className="text-teal-700 hover:underline disabled:opacity-50 dark:text-teal-400"
          >
            {t("admin.reinstate")}
          </button>
        )}
      </td>
    </tr>
  );
}
