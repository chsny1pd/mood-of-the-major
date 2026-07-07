import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../hooks/useAuth";
import { ROUTES } from "../../../constants/routes";
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
    <form onSubmit={onSubmit} className="space-y-4">
      {formError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {formError}
        </div>
      ) : null}

      <div>
        <label htmlFor="register-email" className="mb-1 block text-sm font-medium text-stone-700">
          {t("auth.email")}
        </label>
        <input
          {...register("email")}
          id="register-email"
          type="email"
          autoComplete="email"
          aria-label={t("auth.email")}
          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-teal-700 focus:ring-2"
        />
        {errors.email ? <p className="mt-1 text-sm text-red-600">{errors.email.message}</p> : null}
      </div>

      <div>
        <label htmlFor="register-student-id" className="mb-1 block text-sm font-medium text-stone-700">
          {t("register.studentId")}
        </label>
        <input
          {...register("studentId")}
          id="register-student-id"
          type="text"
          autoComplete="off"
          aria-label={t("register.studentId")}
          placeholder={t("register.studentIdPlaceholder")}
          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-teal-700 focus:ring-2"
        />
        {errors.studentId ? (
          <p className="mt-1 text-sm text-red-600">{errors.studentId.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="register-year" className="mb-1 block text-sm font-medium text-stone-700">
          {t("register.yearOfStudy")}
        </label>
        <select
          id="register-year"
          aria-label={t("register.yearOfStudy")}
          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-teal-700 focus:ring-2"
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
          <p className="mt-1 text-sm text-red-600">{errors.yearOfStudy.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="register-password" className="mb-1 block text-sm font-medium text-stone-700">
          {t("auth.password")}
        </label>
        <input
          {...register("password")}
          id="register-password"
          type="password"
          autoComplete="new-password"
          aria-label={t("auth.password")}
          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-teal-700 focus:ring-2"
        />
        {errors.password ? (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="facultyId" className="mb-1 block text-sm font-medium text-stone-700">
          {t("register.facultyOptional")}
        </label>
        <select
          id="facultyId"
          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-teal-700 focus:ring-2"
          {...register("facultyId")}
        >
          <option value="">{t("register.selectFaculty")}</option>
          {faculties.map((faculty) => (
            <option key={faculty.id} value={faculty.id}>
              {localizedName(faculty)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="majorId" className="mb-1 block text-sm font-medium text-stone-700">
          {t("register.majorOptional")}
        </label>
        <select
          id="majorId"
          disabled={!facultyId}
          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-teal-700 focus:ring-2 disabled:bg-stone-100"
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
        className="w-full rounded-xl bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-900 disabled:opacity-60"
      >
        {isSubmitting ? t("register.creatingAccount") : t("register.createAccount")}
      </button>

      <p className="text-center text-sm text-stone-600">
        {t("register.alreadyHaveAccount")}{" "}
        <Link to={ROUTES.login} className="font-medium text-teal-800 hover:underline">
          {t("auth.signIn")}
        </Link>
      </p>
    </form>
  );
}
