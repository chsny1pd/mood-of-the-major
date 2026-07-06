import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../constants/queryKeys";
import { fetchFaculties, fetchMajors } from "../../../services/referenceService";
import { fetchEmotionTags } from "../../../services/tagService";
import type { MoodFilters } from "../types";

interface FilterPanelProps {
  filters: MoodFilters;
  onChange: (filters: MoodFilters) => void;
  showSort?: boolean;
}

export const FilterPanel = memo(function FilterPanel({ filters, onChange, showSort = true }: FilterPanelProps) {
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
          <span className="mb-1 block font-medium text-stone-700">Sort</span>
          <select
            value={filters.sort ?? "newest"}
            onChange={(event) =>
              update({ sort: event.target.value as MoodFilters["sort"] })
            }
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900"
          >
            <option value="newest">Newest</option>
            <option value="most_reacted">Most reacted</option>
            <option value="most_commented">Most commented</option>
          </select>
        </label>
      ) : null}

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-stone-700">Emotion</span>
        <select
          value={filters.tagSlug ?? ""}
          onChange={(event) =>
            update({ tagSlug: event.target.value || undefined })
          }
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900"
        >
          <option value="">All emotions</option>
          {tagsQuery.data?.map((tag) => (
            <option key={tag.id} value={tag.slug}>
              {tag.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-stone-700">Faculty</span>
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
          <option value="">All faculties</option>
          {facultiesQuery.data?.map((faculty) => (
            <option key={faculty.id} value={faculty.id}>
              {faculty.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-stone-700">Major</span>
        <select
          value={filters.majorId ?? ""}
          onChange={(event) => update({ majorId: event.target.value || undefined })}
          disabled={!filters.facultyId}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 disabled:bg-stone-100"
        >
          <option value="">All majors</option>
          {majorsQuery.data?.map((major) => (
            <option key={major.id} value={major.id}>
              {major.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-stone-700">From</span>
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
        <span className="mb-1 block font-medium text-stone-700">To</span>
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
