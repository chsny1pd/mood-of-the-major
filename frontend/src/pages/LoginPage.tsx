import { useTranslation } from "react-i18next";
import { LoginForm } from "../features/auth/components/LoginForm";
import { OAuthButtons } from "../components/OAuthButtons";
import { themeClasses } from "../lib/themeClasses";

export function LoginPage() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className={`mb-6 ${themeClasses.pageTitle}`}>{t("auth.signInTitle")}</h1>

      <OAuthButtons />

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-stone-200 dark:bg-stone-700" />
        <span className="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">
          {t("auth.orContinueWithEmail")}
        </span>
        <div className="h-px flex-1 bg-stone-200 dark:bg-stone-700" />
      </div>

      <LoginForm />
    </div>
  );
}
