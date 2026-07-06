import { useQuery } from "@tanstack/react-query";
import { fetchFaculties, fetchMajors } from "../../../services/referenceService";
import type { StatisticsScopeType } from "../../../types/statistics";

export interface ScopeSelection {
  scope: StatisticsScopeType;
  scopeId?: string;
  facultyId?: string;
}

interface ScopeSelectorProps {
  value: ScopeSelection;
  onChange: (value: ScopeSelection) => void;
}

export function ScopeSelector({ value, onChange }: ScopeSelectorProps) {
  const facultiesQuery = useQuery({
    queryKey: ["faculties"],
    queryFn: fetchFaculties,
  });

  const majorsQuery = useQuery({
    queryKey: ["majors", value.facultyId],
    queryFn: () => fetchMajors(value.facultyId!),
    enabled: value.scope === "major" && Boolean(value.facultyId),
  });

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-stone-700">Scope</span>
        <select
          value={value.scope}
          onChange={(event) => {
            const scope = event.target.value as StatisticsScopeType;
            onChange({ scope, facultyId: undefined, scopeId: undefined });
          }}
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
        >
          <option value="platform">Platform-wide</option>
          <option value="faculty">Faculty</option>
          <option value="major">Major</option>
        </select>
      </label>

      {value.scope === "faculty" || value.scope === "major" ? (
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-stone-700">Faculty</span>
          <select
            value={value.facultyId ?? ""}
            onChange={(event) => {
              const facultyId = event.target.value || undefined;
              onChange({
                scope: value.scope,
                facultyId,
                scopeId: value.scope === "faculty" ? facultyId : undefined,
              });
            }}
            className="w-full rounded-lg border border-stone-300 px-3 py-2"
          >
            <option value="">Select faculty</option>
            {facultiesQuery.data?.map((faculty) => (
              <option key={faculty.id} value={faculty.id}>
                {faculty.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {value.scope === "major" ? (
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-stone-700">Major</span>
          <select
            value={value.scopeId ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                scopeId: event.target.value || undefined,
              })
            }
            disabled={!value.facultyId}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 disabled:bg-stone-100"
          >
            <option value="">Select major</option>
            {majorsQuery.data?.map((major) => (
              <option key={major.id} value={major.id}>
                {major.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
}
