import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  REPORT_REASONS,
  getReportReasonTranslationKey,
  type ReportReasonCode,
} from "../../../types/engagement";
import { reportComment, reportMood } from "../../../services/reportService";
import { getApiErrorMessage } from "../../../services/apiClient";

interface ReportModalProps {
  targetType: "mood" | "comment";
  targetId: string;
  onClose: () => void;
}

export function ReportModal({ targetType, targetId, onClose }: ReportModalProps) {
  const { t } = useTranslation();
  const [reasonCode, setReasonCode] = useState<ReportReasonCode>("spam");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      targetType === "mood"
        ? reportMood(targetId, { reasonCode, description: description || undefined })
        : reportComment(targetId, { reasonCode, description: description || undefined }),
    onSuccess: (data) => {
      setMessage(data.message);
      setError(null);
    },
    onError: (err) => {
      setError(getApiErrorMessage(err, t("engagement.reportModal.submitError")));
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      data-testid="report-modal"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="report-modal-title" className="text-lg font-semibold text-stone-900">
          {t("engagement.reportModal.title")}
        </h2>
        <p className="mt-1 text-sm text-stone-600">{t("engagement.reportModal.description")}</p>

        {message ? (
          <p className="mt-4 rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-900">{message}</p>
        ) : (
          <form
            className="mt-4 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              mutation.mutate();
            }}
          >
            <div>
              <label htmlFor="reasonCode" className="mb-1 block text-sm font-medium text-stone-700">
                {t("engagement.reportModal.reason")}
              </label>
              <select
                id="reasonCode"
                value={reasonCode}
                onChange={(event) => setReasonCode(event.target.value as ReportReasonCode)}
                className="w-full rounded-xl border border-stone-300 px-3 py-2"
              >
                {REPORT_REASONS.map((reason) => (
                  <option key={reason.code} value={reason.code}>
                    {t(getReportReasonTranslationKey(reason.code))}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="description" className="mb-1 block text-sm font-medium text-stone-700">
                {t("engagement.reportModal.detailsOptional")}
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                maxLength={1000}
                className="w-full rounded-xl border border-stone-300 px-3 py-2"
              />
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-stone-300 px-4 py-2 text-sm text-stone-700"
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                data-testid="report-submit-button"
                disabled={mutation.isPending}
                className="rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
              >
                {mutation.isPending
                  ? t("engagement.reportModal.submitting")
                  : t("engagement.reportModal.submit")}
              </button>
            </div>
          </form>
        )}

        {message ? (
          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full rounded-xl bg-orange-800 px-4 py-2 text-sm font-semibold text-white"
          >
            {t("engagement.reportModal.close")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
