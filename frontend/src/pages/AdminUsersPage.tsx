import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "../components/EmptyState";
import { queryKeys } from "../constants/queryKeys";
import { useAuth } from "../hooks/useAuth";
import {
  fetchAdminUsers,
  updateUserRole,
  updateUserStatus,
  type AdminUserItem,
  type AdminUserRole,
} from "../services/adminService";
import { getApiErrorMessage } from "../services/apiClient";
import { themeClasses } from "../lib/themeClasses";

const ROLE_OPTIONS: AdminUserRole[] = ["student", "administrator", "advisor"];

export function AdminUsersPage() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
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

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: AdminUserRole }) =>
      updateUserRole(userId, { role }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers() });
    },
  });

  const actionError =
    statusMutation.isError || roleMutation.isError
      ? getApiErrorMessage(
          statusMutation.error ?? roleMutation.error,
          t("admin.userUpdateError"),
        )
      : null;

  return (
    <section>
      <h1 className={themeClasses.pageTitle}>{t("admin.usersTitle")}</h1>
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

      {actionError ? <p className="mt-4 text-sm text-red-600 dark:text-red-400">{actionError}</p> : null}

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
                  isSelf={currentUser?.id === user.id}
                  isUpdatingStatus={
                    statusMutation.isPending && statusMutation.variables?.userId === user.id
                  }
                  isUpdatingRole={roleMutation.isPending && roleMutation.variables?.userId === user.id}
                  onToggleStatus={(status) => statusMutation.mutate({ userId: user.id, status })}
                  onChangeRole={(role) => roleMutation.mutate({ userId: user.id, role })}
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
  isSelf,
  isUpdatingStatus,
  isUpdatingRole,
  onToggleStatus,
  onChangeRole,
}: {
  user: AdminUserItem;
  isSelf: boolean;
  isUpdatingStatus: boolean;
  isUpdatingRole: boolean;
  onToggleStatus: (status: "active" | "suspended") => void;
  onChangeRole: (role: AdminUserRole) => void;
}) {
  const { t } = useTranslation();
  const isAdmin = user.role === "administrator";
  const roleValue = ROLE_OPTIONS.includes(user.role as AdminUserRole)
    ? (user.role as AdminUserRole)
    : "student";

  return (
    <tr className={`border-b ${themeClasses.border} last:border-0 ${themeClasses.hoverRow}`}>
      <td className={`px-4 py-3 ${themeClasses.subheading}`}>
        {user.email}
        {isSelf ? (
          <span className={`ml-2 text-xs ${themeClasses.faint}`}>({t("admin.you")})</span>
        ) : null}
      </td>
      <td className="px-4 py-3">
        {isSelf ? (
          <span className={`capitalize ${themeClasses.body}`}>{user.role}</span>
        ) : (
          <select
            value={roleValue}
            disabled={isUpdatingRole}
            onChange={(event) => onChangeRole(event.target.value as AdminUserRole)}
            aria-label={t("admin.changeRole")}
            className={`${themeClasses.input} max-w-[11rem] py-1.5 text-sm capitalize`}
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {t(`admin.roles.${role}`)}
              </option>
            ))}
          </select>
        )}
      </td>
      <td className={`px-4 py-3 capitalize ${themeClasses.body}`}>{user.status}</td>
      <td className="px-4 py-3">
        {isAdmin ? (
          <span className={themeClasses.faint}>{t("admin.protected")}</span>
        ) : user.status === "active" ? (
          <button
            type="button"
            disabled={isUpdatingStatus}
            onClick={() => onToggleStatus("suspended")}
            className="text-red-700 hover:underline disabled:opacity-50 dark:text-red-400"
          >
            {t("admin.suspend")}
          </button>
        ) : (
          <button
            type="button"
            disabled={isUpdatingStatus}
            onClick={() => onToggleStatus("active")}
            className="text-orange-700 hover:underline disabled:opacity-50 dark:text-orange-400"
          >
            {t("admin.reinstate")}
          </button>
        )}
      </td>
    </tr>
  );
}
