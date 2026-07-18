import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PasswordInput } from "../../../components/ui/PasswordInput";
import { useAuth } from "../../../hooks/useAuth";
import { ROUTES } from "../../../constants/routes";
import { themeClasses } from "../../../lib/themeClasses";
import { getApiErrorMessage, getApiFieldErrors } from "../../../services/apiClient";
import { loginSchema, type LoginFormValues } from "../schemas";

export function LoginForm() {
  const { t } = useTranslation();
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
      setFormError(getApiErrorMessage(error, t("auth.invalidCredentials")));
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {formError ? <div className={themeClasses.errorBox}>{formError}</div> : null}

      <div>
        <label htmlFor="login-email" className={`mb-1 block ${themeClasses.label}`}>
          {t("auth.email")}
        </label>
        <input
          {...register("email")}
          id="login-email"
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
        <label htmlFor="login-password" className={`mb-1 block ${themeClasses.label}`}>
          {t("auth.password")}
        </label>
        <PasswordInput
          {...register("password")}
          id="login-password"
          autoComplete="current-password"
          aria-label={t("auth.password")}
          error={errors.password?.message}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:opacity-60 dark:bg-orange-500 dark:text-stone-950 dark:hover:bg-orange-400"
      >
        {isSubmitting ? t("auth.signingIn") : t("auth.signIn")}
      </button>

      <p className={`text-center text-sm ${themeClasses.body}`}>
        {t("auth.noAccount")}{" "}
        <Link to={ROUTES.register} className={`font-medium ${themeClasses.link}`}>
          {t("auth.createAccount")}
        </Link>
      </p>
    </form>
  );
}
