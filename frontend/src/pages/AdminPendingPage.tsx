import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "../components/EmptyState";
import { queryKeys } from "../constants/queryKeys";
import { useLocalizedName } from "../lib/useLocalizedName";
import { themeClasses } from "../lib/themeClasses";
import {
  approvePendingSubmission,
  fetchPendingSubmissions,
  rejectPendingSubmission,
  updatePendingSubmission,
  type PendingSubmissionItem,
  type PendingSubmissionType,
} from "../services/adminService";
import { fetchFaculties } from "../services/referenceService";
import { getApiErrorMessage } from "../services/apiClient";

export function AdminPendingPage() {
  const { t } = useTranslation();
  const [typeFilter, setTypeFilter] = useState<PendingSubmissionType | "">("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const pendingQuery = useQuery({
    queryKey: queryKeys.adminPendingSubmissions({ type: typeFilter || undefined }),
    queryFn: () => fetchPendingSubmissions({ type: typeFilter || undefined }),
  });

  const facultiesQuery = useQuery({
    queryKey: ["faculties"],
    queryFn: fetchFaculties,
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.adminPendingSubmissions() });
    await queryClient.invalidateQueries({ queryKey: queryKeys.adminDashboard });
    await queryClient.invalidateQueries({ queryKey: queryKeys.adminFaculties });
    await queryClient.invalidateQueries({ queryKey: queryKeys.adminMajors });
    await queryClient.invalidateQueries({ queryKey: queryKeys.adminMoodTags });
  };

  const approveMutation = useMutation({
    mutationFn: ({ type, id }: { type: PendingSubmissionType; id: string }) =>
      approvePendingSubmission(type, id),
    onSuccess: invalidate,
    onError: (error) => setActionError(getApiErrorMessage(error, t("admin.pendingActionError"))),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ type, id }: { type: PendingSubmissionType; id: string }) =>
      rejectPendingSubmission(type, id),
    onSuccess: invalidate,
    onError: (error) => setActionError(getApiErrorMessage(error, t("admin.pendingActionError"))),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      type,
      id,
      body,
    }: {
      type: PendingSubmissionType;
      id: string;
      body: { name?: string; nameTh?: string | null; facultyId?: string };
    }) => updatePendingSubmission(type, id, body),
    onSuccess: () => {
      setEditingId(null);
      void invalidate();
    },
    onError: (error) => setActionError(getApiErrorMessage(error, t("admin.pendingActionError"))),
  });

  if (pendingQuery.isLoading) {
    return <p className={themeClasses.muted}>{t("admin.loadingPending")}</p>;
  }

  if (pendingQuery.isError) {
    return (
      <EmptyState
        title={t("admin.pendingErrorTitle")}
        description={getApiErrorMessage(pendingQuery.error, t("common.tryAgainLater"))}
      />
    );
  }

  const items = pendingQuery.data?.data ?? [];
  const pendingCount = pendingQuery.data?.meta.pendingCount ?? items.length;
  const isBusy =
    approveMutation.isPending || rejectMutation.isPending || updateMutation.isPending;

  return (
    <section>
      <h1 className={`text-2xl font-bold ${themeClasses.heading}`}>{t("admin.pendingTitle")}</h1>
      <p className={`mt-1 text-sm ${themeClasses.body}`}>
        {t("admin.pendingDescription", { count: pendingCount })}
      </p>

      <label className={`mt-6 block max-w-xs text-sm ${themeClasses.label}`}>
        {t("admin.filterByType")}
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value as PendingSubmissionType | "")}
          className={`mt-1 ${themeClasses.select} w-full`}
        >
          <option value="">{t("admin.allTypes")}</option>
          <option value="faculty">{t("admin.typeFaculty")}</option>
          <option value="major">{t("admin.typeMajor")}</option>
          <option value="tag">{t("admin.typeTag")}</option>
        </select>
      </label>

      {actionError ? <p className={`mt-4 ${themeClasses.errorBox}`}>{actionError}</p> : null}

      {items.length === 0 ? (
        <div className="mt-8">
          <EmptyState title={t("admin.noPendingTitle")} description={t("admin.noPendingDescription")} />
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {items.map((item) => (
            <PendingRow
              key={`${item.type}-${item.id}`}
              item={item}
              isEditing={editingId === item.id}
              isBusy={isBusy}
              faculties={facultiesQuery.data ?? []}
              onEdit={() => setEditingId(item.id)}
              onCancelEdit={() => setEditingId(null)}
              onSave={(body) => updateMutation.mutate({ type: item.type, id: item.id, body })}
              onApprove={() => approveMutation.mutate({ type: item.type, id: item.id })}
              onReject={() => rejectMutation.mutate({ type: item.type, id: item.id })}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function typeLabel(type: PendingSubmissionType, t: (key: string) => string): string {
  if (type === "faculty") return t("admin.typeFaculty");
  if (type === "major") return t("admin.typeMajor");
  return t("admin.typeTag");
}

function PendingRow({
  item,
  isEditing,
  isBusy,
  faculties,
  onEdit,
  onCancelEdit,
  onSave,
  onApprove,
  onReject,
}: {
  item: PendingSubmissionItem;
  isEditing: boolean;
  isBusy: boolean;
  faculties: Array<{ id: string; name: string; nameTh: string | null }>;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (body: { name?: string; nameTh?: string | null; facultyId?: string }) => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const { t } = useTranslation();
  const localizedName = useLocalizedName();
  const [name, setName] = useState(item.name);
  const [nameTh, setNameTh] = useState(item.nameTh ?? "");
  const [facultyId, setFacultyId] = useState(item.type === "major" ? item.facultyId : "");

  return (
    <li className={`p-4 ${themeClasses.card}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={`text-xs uppercase tracking-wide ${themeClasses.muted}`}>
            {typeLabel(item.type, t)}
          </p>
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={themeClasses.input}
                aria-label={t("submissions.nameEn")}
              />
              <input
                value={nameTh}
                onChange={(event) => setNameTh(event.target.value)}
                className={themeClasses.input}
                aria-label={t("submissions.nameThOptional")}
              />
              {item.type === "major" ? (
                <select
                  value={facultyId}
                  onChange={(event) => setFacultyId(event.target.value)}
                  className={`${themeClasses.select} w-full`}
                >
                  {faculties.map((faculty) => (
                    <option key={faculty.id} value={faculty.id}>
                      {localizedName(faculty)}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
          ) : (
            <>
              <p className={`mt-1 font-medium ${themeClasses.subheading}`}>{localizedName(item)}</p>
              {item.type === "major" ? (
                <p className={`text-sm ${themeClasses.body}`}>
                  {t("admin.tableFaculty")}: {item.facultyName}
                </p>
              ) : null}
            </>
          )}
          <p className={`mt-2 text-xs ${themeClasses.faint}`}>
            {new Date(item.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isEditing ? (
            <>
              <button
                type="button"
                disabled={isBusy}
                onClick={() =>
                  onSave({
                    name: name.trim(),
                    nameTh: nameTh.trim() || null,
                    ...(item.type === "major" ? { facultyId } : {}),
                  })
                }
                className="rounded-md bg-teal-800 px-3 py-1 text-sm text-white disabled:opacity-50 dark:bg-teal-700"
              >
                {t("common.save")}
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={onCancelEdit}
                className={`rounded-md border px-3 py-1 text-sm ${themeClasses.border} ${themeClasses.body}`}
              >
                {t("common.cancel")}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={isBusy}
                onClick={onEdit}
                className={`rounded-md border px-3 py-1 text-sm ${themeClasses.border} ${themeClasses.hoverRow}`}
              >
                {t("admin.edit")}
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={onApprove}
                className="rounded-md bg-teal-800 px-3 py-1 text-sm text-white disabled:opacity-50 dark:bg-teal-700"
              >
                {t("admin.approve")}
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={onReject}
                className="rounded-md bg-red-700 px-3 py-1 text-sm text-white disabled:opacity-50"
              >
                {t("admin.reject")}
              </button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}
