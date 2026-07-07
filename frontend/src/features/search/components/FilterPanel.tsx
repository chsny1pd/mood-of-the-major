import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { queryKeys } from "../../../constants/queryKeys";
import { fetchFaculties, fetchMajors } from "../../../services/referenceService";
import { fetchEmotionTags } from "../../../services/tagService";
import { useLocalizedName } from "../../../lib/useLocalizedName";
import type { MoodFilters } from "../types";

interface FilterPanelProps {
  filters: MoodFilters;
  onChange: (filters: MoodFilters) => void;
  showSort?: boolean;
}

export const FilterPanel = memo(function FilterPanel({ filters, onChange, showSort = true }: FilterPanelProps) {
  const { t } = useTranslation();
  const localizedName = useLocalizedName();

  const tagsQuery = useQuery({
    queryKey: queryKeys.emotionTags,
    queryFn: fetchEmotionTags,
  });

  const facultiesQuery = useQuery({
    queryKey: ["faculties"],
    queryFn: fetchFaculties,
  });

  const majorsQuery = useQuery({
    queryKey: ["majors", filters.facultyId],
    queryFn: () => fetchMajors(filters.facultyId!),
    enabled: Boolean(filters.facultyId),
  });

  const update = (patch: Partial<MoodFilters>) => {
    onChange({ ...filters, ...patch });
  };

  return (
    <div className="grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
      {showSort ? (
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-stone-700">{t("filter.sort")}</span>
          <select
            value={filters.sort ?? "newest"}
            onChange={(event) =>
              update({ sort: event.target.value as MoodFilters["sort"] })
            }
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900"
          >
            <option value="newest">{t("filter.sortNewest")}</option>
            <option value="most_reacted">{t("filter.sortMostReacted")}</option>
            <option value="most_commented">{t("filter.sortMostCommented")}</option>
          </select>
        </label>
      ) : null}

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-stone-700">{t("filter.emotion")}</span>
        <select
          value={filters.tagSlug ?? ""}
          onChange={(event) =>
            update({ tagSlug: event.target.value || undefined })
          }
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900"
        >
          <option value="">{t("filter.allEmotions")}</option>
          {tagsQuery.data?.map((tag) => (
            <option key={tag.id} value={tag.slug}>
              {localizedName(tag)}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-stone-700">{t("filter.faculty")}</span>
        <select
          value={filters.facultyId ?? ""}
          onChange={(event) =>
            update({
              facultyId: event.target.value || undefined,
              majorId: undefined,
            })
          }
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900"
        >
          <option value="">{t("filter.allFaculties")}</option>
          {facultiesQuery.data?.map((faculty) => (
            <option key={faculty.id} value={faculty.id}>
              {localizedName(faculty)}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-stone-700">{t("filter.major")}</span>
        <select
          value={filters.majorId ?? ""}
          onChange={(event) => update({ majorId: event.target.value || undefined })}
          disabled={!filters.facultyId}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 disabled:bg-stone-100"
        >
          <option value="">{t("filter.allMajors")}</option>
          {majorsQuery.data?.map((major) => (
            <option key={major.id} value={major.id}>
              {localizedName(major)}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-stone-700">{t("filter.from")}</span>
        <input
          type="date"
          value={filters.from?.slice(0, 10) ?? ""}
          onChange={(event) =>
            update({
              from: event.target.value
                ? new Date(`${event.target.value}T00:00:00.000Z`).toISOString()
                : undefined,
            })
          }
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-stone-700">{t("filter.to")}</span>
        <input
          type="date"
          value={filters.to?.slice(0, 10) ?? ""}
          onChange={(event) =>
            update({
              to: event.target.value
                ? new Date(`${event.target.value}T23:59:59.999Z`).toISOString()
                : undefined,
            })
          }
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900"
        />
      </label>
    </div>
  );
});
