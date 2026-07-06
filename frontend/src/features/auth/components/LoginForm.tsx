import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { ROUTES } from "../../../constants/routes";
import { getApiErrorMessage, getApiFieldErrors } from "../../../services/apiClient";
import { loginSchema, type LoginFormValues } from "../schemas";

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await login(values.email, values.password);
      const returnUrl =
        (location.state as { returnUrl?: string } | null)?.returnUrl ?? ROUTES.feed;
      navigate(returnUrl, { replace: true });
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error);
      Object.entries(fieldErrors).forEach(([field, message]) => {
        setError(field as keyof LoginFormValues, { message });
      });
      setFormError(getApiErrorMessage(error, "Invalid email or password"));
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
        <label htmlFor="login-email" className="mb-1 block text-sm font-medium text-stone-700">
          Email
        </label>
        <input
          {...register("email")}
          id="login-email"
          type="email"
          autoComplete="email"
          aria-label="Email"
          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-teal-700 focus:ring-2"
        />
        {errors.email ? <p className="mt-1 text-sm text-red-600">{errors.email.message}</p> : null}
      </div>

      <div>
        <label htmlFor="login-password" className="mb-1 block text-sm font-medium text-stone-700">
          Password
        </label>
        <input
          {...register("password")}
          id="login-password"
          type="password"
          autoComplete="current-password"
          aria-label="Password"
          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-teal-700 focus:ring-2"
        />
        {errors.password ? (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-900 disabled:opacity-60"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>

      <p className="text-center text-sm text-stone-600">
        No account yet?{" "}
        <Link to={ROUTES.register} className="font-medium text-teal-800 hover:underline">
          Create one
        </Link>
      </p>
    </form>
  );
}
