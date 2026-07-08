import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { themeClasses } from "../../../lib/themeClasses";
import { getApiErrorMessage } from "../../../services/apiClient";
import {
  submitFaculty,
  submitMajor,
  submitTag,
  type SubmissionType,
} from "../../../services/submissionService";
import { useAuth } from "../../../hooks/useAuth";
import { Link } from "react-router-dom";
import { ROUTES } from "../../../constants/routes";

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
  const { isAuthenticated } = useAuth();
  const [name, setName] = useState("");
  const [nameTh, setNameTh] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
        if (!facultyId) {
          throw new Error("facultyId required");
        }
        return submitMajor(facultyId, payload);
      }
      return submitTag(payload);
    },
    onSuccess: () => {
      setSuccessMessage(t(`submissions.success.${type}`));
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
                className="rounded-xl bg-teal-800 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-900 dark:bg-teal-700 dark:hover:bg-teal-600"
              >
                {t("auth.signIn")}
              </Link>
            </div>
          </div>
        ) : successMessage ? (
          <>
            <p className="mt-4 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-100">
              {successMessage}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full rounded-xl bg-teal-800 px-4 py-2 text-sm font-semibold text-white dark:bg-teal-700"
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
                disabled={mutation.isPending || name.trim().length < 2 || (type === "major" && !facultyId)}
                className="rounded-xl bg-teal-800 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-900 disabled:opacity-60 dark:bg-teal-700 dark:hover:bg-teal-600"
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
