import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { queryKeys } from "../../../constants/queryKeys";
import { getApiErrorMessage, getApiFieldErrors } from "../../../services/apiClient";
import { fetchEmotionTags } from "../../../services/tagService";
import { useLocalizedName } from "../../../lib/useLocalizedName";
import { updateMoodSchema, type UpdateMoodFormValues } from "../schemas";
import type { AnonymousMood } from "../../../types/mood";

interface EditMoodFormProps {
  mood: AnonymousMood;
  onCancel: () => void;
  onSaved: () => void;
}

export function EditMoodForm({ mood, onCancel, onSaved }: EditMoodFormProps) {
  const { t } = useTranslation();
  const localizedName = useLocalizedName();
  const tagsQuery = useQuery({
    queryKey: queryKeys.emotionTags,
    queryFn: fetchEmotionTags,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UpdateMoodFormValues>({
    resolver: zodResolver(updateMoodSchema),
    defaultValues: {
      content: mood.content,
      tagIds: mood.tags.map((tag) => tag.id),
      primaryTagId: mood.tags.find((tag) => tag.isPrimary)?.id ?? mood.tags[0]?.id ?? "",
    },
  });

  const tagIds = watch("tagIds");
  const primaryTagId = watch("primaryTagId");

  const toggleTag = (tagId: string) => {
    const current = tagIds ?? [];
    const next = current.includes(tagId)
      ? current.filter((id) => id !== tagId)
      : [...current, tagId];

    setValue("tagIds", next, { shouldValidate: true });

    if (!primaryTagId || !next.includes(primaryTagId)) {
      setValue("primaryTagId", next[0] ?? "", { shouldValidate: true });
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      const { updateMood } = await import("../../../services/moodService");
      await updateMood(mood.id, values);
      onSaved();
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error);
      Object.entries(fieldErrors).forEach(([field, message]) => {
        setError(field as keyof UpdateMoodFormValues, { message });
      });
      setError("root", { message: getApiErrorMessage(error, t("moodForm.saveError")) });
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {errors.root ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errors.root.message}
        </div>
      ) : null}

      <div>
        <label htmlFor="edit-content" className="mb-1 block text-sm font-medium text-stone-700">
          {t("moodForm.yourMood")}
        </label>
        <textarea
          id="edit-content"
          rows={6}
          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-orange-700 focus:ring-2"
          {...register("content")}
        />
        {errors.content ? <p className="mt-1 text-sm text-red-600">{errors.content.message}</p> : null}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-stone-700">{t("moodForm.emotions")}</p>
        {tagsQuery.isLoading ? (
          <p className="text-sm text-stone-500">{t("moodForm.loadingTags")}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(tagsQuery.data ?? []).map((tag) => {
              const selected = tagIds?.includes(tag.id);
              const isPrimary = primaryTagId === tag.id;

              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  onDoubleClick={() => setValue("primaryTagId", tag.id, { shouldValidate: true })}
                  className={`rounded-full px-3 py-1 text-sm transition ${
                    selected
                      ? isPrimary
                        ? "bg-orange-700 text-white"
                        : "bg-orange-100 text-orange-900 ring-1 ring-orange-300"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  {localizedName(tag)}
                  {isPrimary ? " ★" : ""}
                </button>
              );
            })}
          </div>
        )}
        {errors.tagIds ? <p className="mt-1 text-sm text-red-600">{errors.tagIds.message}</p> : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-orange-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-900 disabled:opacity-60"
        >
          {isSubmitting ? t("moodForm.saving") : t("moodForm.saveChanges")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-100"
        >
          {t("common.cancel")}
        </button>
      </div>
    </form>
  );
}
