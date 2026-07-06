import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { ROUTES } from "../../../constants/routes";
import { queryKeys } from "../../../constants/queryKeys";
import { getApiErrorMessage, getApiFieldErrors } from "../../../services/apiClient";
import { fetchEmotionTags } from "../../../services/tagService";
import { createMood } from "../../../services/moodService";
import { fetchFaculties, fetchMajors } from "../../../services/referenceService";
import { useImageUpload } from "../../upload/hooks/useImageUpload";
import { createMoodSchema, type CreateMoodFormValues } from "../schemas";

export function CreateMoodForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedFacultyId, setSelectedFacultyId] = useState(user?.facultyId ?? "");
  const { images, uploading, error: uploadError, uploadFiles, removeImage, imageIds, reset } =
    useImageUpload();

  const tagsQuery = useQuery({
    queryKey: queryKeys.emotionTags,
    queryFn: fetchEmotionTags,
  });

  const facultiesQuery = useQuery({
    queryKey: ["faculties"],
    queryFn: fetchFaculties,
  });

  const majorsQuery = useQuery({
    queryKey: ["majors", selectedFacultyId],
    queryFn: () => fetchMajors(selectedFacultyId),
    enabled: Boolean(selectedFacultyId),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateMoodFormValues>({
    resolver: zodResolver(createMoodSchema),
    defaultValues: {
      content: "",
      facultyId: user?.facultyId ?? "",
      majorId: user?.majorId ?? "",
      tagIds: [],
      primaryTagId: "",
    },
  });

  const tagIds = watch("tagIds");
  const primaryTagId = watch("primaryTagId");

  useEffect(() => {
    if (user?.facultyId) setSelectedFacultyId(user.facultyId);
  }, [user?.facultyId]);

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
    setFormError(null);

    try {
      const mood = await createMood({
        content: values.content,
        facultyId: values.facultyId || undefined,
        majorId: values.majorId || undefined,
        tagIds: values.tagIds,
        primaryTagId: values.primaryTagId,
        imageIds: imageIds.length > 0 ? imageIds : undefined,
      });

      reset();
      navigate(ROUTES.moodDetail(mood.id));
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error);
      Object.entries(fieldErrors).forEach(([field, message]) => {
        setError(field as keyof CreateMoodFormValues, { message });
      });
      setFormError(getApiErrorMessage(error, "Could not publish your mood."));
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {(formError || uploadError) && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {formError ?? uploadError}
        </div>
      )}

      <div>
        <label htmlFor="content" className="mb-1 block text-sm font-medium text-stone-700">
          Your mood
        </label>
        <textarea
          id="content"
          rows={6}
          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-teal-700 focus:ring-2"
          placeholder="Share anonymously how you're feeling today..."
          {...register("content")}
        />
        {errors.content ? <p className="mt-1 text-sm text-red-600">{errors.content.message}</p> : null}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-stone-700">Emotions</p>
        {tagsQuery.isLoading ? (
          <p className="text-sm text-stone-500">Loading tags...</p>
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
                        ? "bg-teal-700 text-white"
                        : "bg-teal-100 text-teal-900 ring-1 ring-teal-300"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  {tag.name}
                  {isPrimary ? " ★" : ""}
                </button>
              );
            })}
          </div>
        )}
        {errors.tagIds ? <p className="mt-1 text-sm text-red-600">{errors.tagIds.message}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="facultyId" className="mb-1 block text-sm font-medium text-stone-700">
            Faculty
          </label>
          <select
            id="facultyId"
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900"
            {...register("facultyId", {
              onChange: (event) => {
                setSelectedFacultyId(event.target.value);
                setValue("majorId", "");
              },
            })}
          >
            <option value="">Select faculty</option>
            {(facultiesQuery.data ?? []).map((faculty) => (
              <option key={faculty.id} value={faculty.id}>
                {faculty.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="majorId" className="mb-1 block text-sm font-medium text-stone-700">
            Major
          </label>
          <select
            id="majorId"
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900"
            {...register("majorId")}
            disabled={!selectedFacultyId}
          >
            <option value="">Select major</option>
            {(majorsQuery.data ?? []).map((major) => (
              <option key={major.id} value={major.id}>
                {major.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="images" className="mb-1 block text-sm font-medium text-stone-700">
          Images (optional, up to 4)
        </label>
        <input
          id="images"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={uploading || images.length >= 4}
          onChange={(event) => {
            if (event.target.files) void uploadFiles(event.target.files);
            event.target.value = "";
          }}
          className="block w-full text-sm text-stone-600"
        />
        {images.length > 0 ? (
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((image) => (
              <li key={image.id} className="relative overflow-hidden rounded-xl border border-stone-200">
                <img src={image.previewUrl} alt="" className="h-24 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(image.id)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting || uploading}
        className="w-full rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
      >
        {isSubmitting ? "Publishing..." : "Publish anonymously"}
      </button>
    </form>
  );
}
