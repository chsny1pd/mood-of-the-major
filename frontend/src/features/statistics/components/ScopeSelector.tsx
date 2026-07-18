import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { fetchFaculties, fetchMajors } from "../../../services/referenceService";
import { useLocalizedName } from "../../../lib/useLocalizedName";
import { themeClasses } from "../../../lib/themeClasses";
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
  const { t } = useTranslation();
  const localizedName = useLocalizedName();

  const facultiesQuery = useQuery({
    queryKey: ["faculties"],
    queryFn: fetchFaculties,
  });

  const majorsQuery = useQuery({
    queryKey: ["majors", value.facultyId],
    queryFn: () => fetchMajors(value.facultyId!),
    enabled: value.scope === "major" && Boolean(value.facultyId),
  });

  const selectClassName = `w-full ${themeClasses.select}`;

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="block text-sm">
        <span className={`mb-1 block font-medium ${themeClasses.label}`}>{t("scope.label")}</span>
        <select
          value={value.scope}
          onChange={(event) => {
            const scope = event.target.value as StatisticsScopeType;
            onChange({ scope, facultyId: undefined, scopeId: undefined });
          }}
          className={selectClassName}
        >
          <option value="platform">{t("scope.platform")}</option>
          <option value="faculty">{t("scope.faculty")}</option>
          <option value="major">{t("scope.major")}</option>
        </select>
      </label>

      {value.scope === "faculty" || value.scope === "major" ? (
        <label className="block text-sm">
          <span className={`mb-1 block font-medium ${themeClasses.label}`}>{t("scope.faculty")}</span>
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
            className={selectClassName}
            disabled={facultiesQuery.isLoading}
          >
            <option value="">
              {facultiesQuery.isLoading ? t("common.loading") : t("scope.selectFaculty")}
            </option>
            {facultiesQuery.data?.map((faculty) => (
              <option key={faculty.id} value={faculty.id}>
                {localizedName(faculty)}
              </option>
            ))}
          </select>
          {facultiesQuery.isError ? (
            <p className={`mt-1 text-xs ${themeClasses.muted}`}>{t("common.error")}</p>
          ) : null}
        </label>
      ) : null}

      {value.scope === "major" ? (
        <label className="block text-sm">
          <span className={`mb-1 block font-medium ${themeClasses.label}`}>{t("scope.major")}</span>
          <select
            value={value.scopeId ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                scopeId: event.target.value || undefined,
              })
            }
            disabled={!value.facultyId || majorsQuery.isLoading}
            className={`${selectClassName} disabled:bg-stone-100 disabled:opacity-70 dark:disabled:bg-stone-900`}
          >
            <option value="">
              {!value.facultyId
                ? t("scope.selectFaculty")
                : majorsQuery.isLoading
                  ? t("common.loading")
                  : t("scope.selectMajor")}
            </option>
            {majorsQuery.data?.map((major) => (
              <option key={major.id} value={major.id}>
                {localizedName(major)}
              </option>
            ))}
          </select>
          {majorsQuery.isError ? (
            <p className={`mt-1 text-xs ${themeClasses.muted}`}>{t("common.error")}</p>
          ) : value.facultyId && majorsQuery.isSuccess && (majorsQuery.data?.length ?? 0) === 0 ? (
            <p className={`mt-1 text-xs ${themeClasses.muted}`}>{t("scope.noMajors")}</p>
          ) : null}
        </label>
      ) : null}
    </div>
  );
}
