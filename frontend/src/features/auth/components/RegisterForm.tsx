import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { ROUTES } from "../../../constants/routes";
import { getApiErrorMessage, getApiFieldErrors } from "../../../services/apiClient";
import { fetchFaculties, fetchMajors, type FacultyOption, type MajorOption } from "../../../services/referenceService";
import { registerSchema, type RegisterFormValues } from "../schemas";

export function RegisterForm() {
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
      .catch(() => setFormError("Could not load faculties. Is the backend running?"));
  }, []);

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
      setFormError(getApiErrorMessage(error, "Registration failed"));
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
          Email
        </label>
        <input
          {...register("email")}
          id="register-email"
          type="email"
          autoComplete="email"
          aria-label="Email"
          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-teal-700 focus:ring-2"
        />
        {errors.email ? <p className="mt-1 text-sm text-red-600">{errors.email.message}</p> : null}
      </div>

      <div>
        <label htmlFor="register-student-id" className="mb-1 block text-sm font-medium text-stone-700">
          Student ID
        </label>
        <input
          {...register("studentId")}
          id="register-student-id"
          type="text"
          autoComplete="off"
          aria-label="Student ID"
          placeholder="e.g. 6512345678"
          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-teal-700 focus:ring-2"
        />
        {errors.studentId ? (
          <p className="mt-1 text-sm text-red-600">{errors.studentId.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="register-year" className="mb-1 block text-sm font-medium text-stone-700">
          Year of study
        </label>
        <select
          id="register-year"
          aria-label="Year of study"
          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-teal-700 focus:ring-2"
          {...register("yearOfStudy", { valueAsNumber: true })}
        >
          <option value="">Select year</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((year) => (
            <option key={year} value={year}>
              Year {year}
            </option>
          ))}
        </select>
        {errors.yearOfStudy ? (
          <p className="mt-1 text-sm text-red-600">{errors.yearOfStudy.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="register-password" className="mb-1 block text-sm font-medium text-stone-700">
          Password
        </label>
        <input
          {...register("password")}
          id="register-password"
          type="password"
          autoComplete="new-password"
          aria-label="Password"
          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-teal-700 focus:ring-2"
        />
        {errors.password ? (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="facultyId" className="mb-1 block text-sm font-medium text-stone-700">
          Faculty (optional)
        </label>
        <select
          id="facultyId"
          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-teal-700 focus:ring-2"
          {...register("facultyId")}
        >
          <option value="">Select faculty</option>
          {faculties.map((faculty) => (
            <option key={faculty.id} value={faculty.id}>
              {faculty.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="majorId" className="mb-1 block text-sm font-medium text-stone-700">
          Major (optional)
        </label>
        <select
          id="majorId"
          disabled={!facultyId}
          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-teal-700 focus:ring-2 disabled:bg-stone-100"
          {...register("majorId")}
        >
          <option value="">Select major</option>
          {majors.map((major) => (
            <option key={major.id} value={major.id}>
              {major.name}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-900 disabled:opacity-60"
      >
        {isSubmitting ? "Creating account..." : "Create account"}
      </button>

      <p className="text-center text-sm text-stone-600">
        Already have an account?{" "}
        <Link to={ROUTES.login} className="font-medium text-teal-800 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
