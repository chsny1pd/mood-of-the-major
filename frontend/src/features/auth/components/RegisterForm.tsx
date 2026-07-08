import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PasswordInput } from "../../../components/ui/PasswordInput";
import { SubmitReferenceModal } from "../../submissions/components/SubmitReferenceModal";
import { useAuth } from "../../../hooks/useAuth";
import { ROUTES } from "../../../constants/routes";
import { themeClasses } from "../../../lib/themeClasses";
import { getApiErrorMessage, getApiFieldErrors } from "../../../services/apiClient";
import { fetchFaculties, fetchMajors, type FacultyOption, type MajorOption } from "../../../services/referenceService";
import { useLocalizedName } from "../../../lib/useLocalizedName";
import { registerSchema, type RegisterFormValues } from "../schemas";

export function RegisterForm() {
  const { t } = useTranslation();
  const localizedName = useLocalizedName();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const [faculties, setFaculties] = useState<FacultyOption[]>([]);
  const [majors, setMajors] = useState<MajorOption[]>([]);
  const [suggestType, setSuggestType] = useState<"faculty" | "major" | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const facultyId = watch("facultyId");

  useEffect(() => {
    void fetchFaculties()
      .then(setFaculties)
      .catch(() => setFormError(t("register.facultiesLoadError")));
  }, [t]);

  useEffect(() => {
    if (!facultyId) {
      setMajors([]);
      return;
    }

    void fetchMajors(facultyId)
      .then(setMajors)
      .catch(() => setMajors([]));
  }, [facultyId]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await registerUser({
        email: values.email,
        studentId: values.studentId,
        yearOfStudy: values.yearOfStudy,
        password: values.password,
        facultyId: values.facultyId || undefined,
        majorId: values.majorId || undefined,
      });
      navigate(ROUTES.feed, { replace: true });
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error);
      Object.entries(fieldErrors).forEach(([field, message]) => {
        setError(field as keyof RegisterFormValues, { message });
      });
      setFormError(getApiErrorMessage(error, t("register.registrationFailed")));
    }
  });

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4">
        {formError ? <div className={themeClasses.errorBox}>{formError}</div> : null}

        <div>
          <label htmlFor="register-email" className={`mb-1 block ${themeClasses.label}`}>
            {t("auth.email")}
          </label>
          <input
            {...register("email")}
            id="register-email"
            type="email"
            autoComplete="email"
            aria-label={t("auth.email")}
            className={themeClasses.input}
          />
          {errors.email ? (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="register-student-id" className={`mb-1 block ${themeClasses.label}`}>
            {t("register.studentId")}
          </label>
          <input
            {...register("studentId")}
            id="register-student-id"
            type="text"
            autoComplete="off"
            aria-label={t("register.studentId")}
            placeholder={t("register.studentIdPlaceholder")}
            className={themeClasses.input}
          />
          {errors.studentId ? (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.studentId.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="register-year" className={`mb-1 block ${themeClasses.label}`}>
            {t("register.yearOfStudy")}
          </label>
          <select
            id="register-year"
            aria-label={t("register.yearOfStudy")}
            className={themeClasses.select}
            {...register("yearOfStudy", { valueAsNumber: true })}
          >
            <option value="">{t("register.selectYear")}</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((year) => (
              <option key={year} value={year}>
                {t("register.yearOption", { year })}
              </option>
            ))}
          </select>
          {errors.yearOfStudy ? (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.yearOfStudy.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="register-password" className={`mb-1 block ${themeClasses.label}`}>
            {t("auth.password")}
          </label>
          <PasswordInput
            {...register("password")}
            id="register-password"
            autoComplete="new-password"
            aria-label={t("auth.password")}
            error={errors.password?.message}
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="facultyId" className={themeClasses.label}>
              {t("register.facultyOptional")}
            </label>
            <button
              type="button"
              onClick={() => setSuggestType("faculty")}
              className={`text-xs ${themeClasses.linkSubtle}`}
            >
              {t("submissions.suggestNew")}
            </button>
          </div>
          <select id="facultyId" className={themeClasses.select} {...register("facultyId")}>
            <option value="">{t("register.selectFaculty")}</option>
            {faculties.map((faculty) => (
              <option key={faculty.id} value={faculty.id}>
                {localizedName(faculty)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="majorId" className={themeClasses.label}>
              {t("register.majorOptional")}
            </label>
            <button
              type="button"
              onClick={() => setSuggestType("major")}
              disabled={!facultyId}
              className={`text-xs disabled:opacity-50 ${themeClasses.linkSubtle}`}
            >
              {t("submissions.suggestNew")}
            </button>
          </div>
          <select
            id="majorId"
            disabled={!facultyId}
            className={`disabled:opacity-60 ${themeClasses.select}`}
            {...register("majorId")}
          >
            <option value="">{t("register.selectMajor")}</option>
            {majors.map((major) => (
              <option key={major.id} value={major.id}>
                {localizedName(major)}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-900 disabled:opacity-60 dark:bg-teal-700 dark:hover:bg-teal-600"
        >
          {isSubmitting ? t("register.creatingAccount") : t("register.createAccount")}
        </button>

        <p className={`text-center text-sm ${themeClasses.body}`}>
          {t("register.alreadyHaveAccount")}{" "}
          <Link to={ROUTES.login} className={`font-medium ${themeClasses.link}`}>
            {t("auth.signIn")}
          </Link>
        </p>
      </form>

      {suggestType ? (
        <SubmitReferenceModal
          type={suggestType}
          facultyId={suggestType === "major" ? facultyId : undefined}
          onClose={() => setSuggestType(null)}
        />
      ) : null}
    </>
  );
}
