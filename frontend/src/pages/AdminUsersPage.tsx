import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { queryKeys } from "../constants/queryKeys";
import { fetchAdminUsers, updateUserStatus, type AdminUserItem } from "../services/adminService";
import { getApiErrorMessage } from "../services/apiClient";

export function AdminUsersPage() {
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
      <h1 className="text-2xl font-bold text-stone-900">User management</h1>
      <p className="mt-1 text-sm text-stone-600">Suspend or reinstate student accounts.</p>

      <label className="mt-6 block max-w-md text-sm">
        <span className="mb-1 block font-medium text-stone-700">Search by email</span>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
          placeholder="student@university.edu"
        />
      </label>

      {usersQuery.isLoading ? (
        <p className="mt-6 text-stone-500">Loading users...</p>
      ) : usersQuery.isError ? (
        <div className="mt-6">
          <EmptyState
            title="Could not load users"
            description={getApiErrorMessage(usersQuery.error, "Try again later.")}
          />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-stone-600">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
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
  const isAdmin = user.role === "administrator";

  return (
    <tr className="border-b border-stone-100 last:border-0">
      <td className="px-4 py-3">{user.email}</td>
      <td className="px-4 py-3 capitalize">{user.role}</td>
      <td className="px-4 py-3 capitalize">{user.status}</td>
      <td className="px-4 py-3">
        {isAdmin ? (
          <span className="text-stone-400">Protected</span>
        ) : user.status === "active" ? (
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onToggleStatus("suspended")}
            className="text-red-700 hover:underline disabled:opacity-50"
          >
            Suspend
          </button>
        ) : (
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onToggleStatus("active")}
            className="text-teal-700 hover:underline disabled:opacity-50"
          >
            Reinstate
          </button>
        )}
      </td>
    </tr>
  );
}
