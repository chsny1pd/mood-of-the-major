import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { themeClasses } from "../../../lib/themeClasses";
import { getApiErrorMessage } from "../../../services/apiClient";
import {
  submitFaculty,
  submitMajor,
  submitTag,
  type SubmissionType,
} from "../../../services/submissionService";
import { fetchFaculties } from "../../../services/referenceService";
import { useLocalizedName } from "../../../lib/useLocalizedName";
import { useAuth } from "../../../hooks/useAuth";
import { Link } from "react-router-dom";
import { ROUTES } from "../../../constants/routes";
import { queryKeys } from "../../../constants/queryKeys";

interface SubmitReferenceModalProps {
  type: SubmissionType;
  facultyId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SubmitReferenceModal({
  type,
  facultyId,
  onClose,
  onSuccess,
}: SubmitReferenceModalProps) {
  const { t } = useTranslation();
  const localizedName = useLocalizedName();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [name, setName] = useState("");
  const [nameTh, setNameTh] = useState("");
  const [selectedFacultyId, setSelectedFacultyId] = useState(facultyId ?? "");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const facultiesQuery = useQuery({
    queryKey: ["faculties"],
    queryFn: fetchFaculties,
    enabled: type === "major" && !facultyId,
  });

  const resolvedFacultyId = facultyId ?? selectedFacultyId;

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        nameTh: nameTh.trim() || null,
      };

      if (type === "faculty") {
        return submitFaculty(payload);
      }
      if (type === "major") {
        if (!resolvedFacultyId) {
          throw new Error("facultyId required");
        }
        return submitMajor(resolvedFacultyId, payload);
      }
      return submitTag(payload);
    },
    onSuccess: () => {
      setSuccessMessage(t(`submissions.success.${type}`));
      void queryClient.invalidateQueries({ queryKey: ["faculties"] });
      void queryClient.invalidateQueries({ queryKey: ["majors"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminFaculties });
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminMajors });
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminMoodTags });
      void queryClient.invalidateQueries({ queryKey: queryKeys.emotionTags });
      onSuccess?.();
    },
  });

  const titleKey =
    type === "faculty"
      ? "submissions.suggestFaculty"
      : type === "major"
        ? "submissions.suggestMajor"
        : "submissions.suggestTag";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-reference-title"
    >
      <div className={`w-full max-w-md p-6 shadow-xl ${themeClasses.cardLg}`}>
        <h2 id="submit-reference-title" className={`text-lg font-semibold ${themeClasses.heading}`}>
          {t(titleKey)}
        </h2>
        <p className={`mt-1 text-sm ${themeClasses.body}`}>{t("submissions.description")}</p>

        {!isAuthenticated ? (
          <div className="mt-4 space-y-4">
            <p className={`text-sm ${themeClasses.body}`}>{t("submissions.loginRequired")}</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} className={`rounded-xl border px-4 py-2 text-sm ${themeClasses.border} ${themeClasses.body}`}>
                {t("common.cancel")}
              </button>
              <Link
                to={ROUTES.login}
                className="rounded-xl bg-orange-800 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-900 dark:bg-orange-700 dark:hover:bg-orange-600"
              >
                {t("auth.signIn")}
              </Link>
            </div>
          </div>
        ) : successMessage ? (
          <>
            <p className="mt-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-100">
              {successMessage}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full rounded-xl bg-orange-800 px-4 py-2 text-sm font-semibold text-white dark:bg-orange-700"
            >
              {t("submissions.close")}
            </button>
          </>
        ) : (
          <form
            className="mt-4 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              mutation.mutate();
            }}
          >
            {type === "major" && !facultyId ? (
              <div>
                <label htmlFor="submission-faculty" className={`mb-1 block ${themeClasses.label}`}>
                  {t("moodForm.faculty")}
                </label>
                <select
                  id="submission-faculty"
                  value={selectedFacultyId}
                  onChange={(event) => setSelectedFacultyId(event.target.value)}
                  required
                  className={themeClasses.select}
                >
                  <option value="">{t("moodForm.selectFaculty")}</option>
                  {(facultiesQuery.data ?? []).map((faculty) => (
                    <option key={faculty.id} value={faculty.id}>
                      {localizedName(faculty)}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {type === "major" && !resolvedFacultyId ? (
              <p className={`text-sm ${themeClasses.errorBox}`}>{t("submissions.selectFacultyFirst")}</p>
            ) : null}

            <div>
              <label htmlFor="submission-name" className={`mb-1 block ${themeClasses.label}`}>
                {t("submissions.nameEn")}
              </label>
              <input
                id="submission-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={2}
                maxLength={120}
                required
                className={themeClasses.input}
              />
            </div>

            <div>
              <label htmlFor="submission-name-th" className={`mb-1 block ${themeClasses.label}`}>
                {t("submissions.nameThOptional")}
              </label>
              <input
                id="submission-name-th"
                value={nameTh}
                onChange={(event) => setNameTh(event.target.value)}
                maxLength={120}
                className={themeClasses.input}
              />
            </div>

            {mutation.isError ? (
              <p className="text-sm text-red-600 dark:text-red-400">
                {getApiErrorMessage(mutation.error, t("submissions.submitError"))}
              </p>
            ) : null}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className={`rounded-xl border px-4 py-2 text-sm ${themeClasses.border} ${themeClasses.body}`}
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                disabled={mutation.isPending || name.trim().length < 2 || (type === "major" && !resolvedFacultyId)}
                className="rounded-xl bg-orange-800 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-900 disabled:opacity-60 dark:bg-orange-700 dark:hover:bg-orange-600"
              >
                {mutation.isPending ? t("submissions.submitting") : t("submissions.submit")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
