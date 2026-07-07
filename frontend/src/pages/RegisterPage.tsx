import { useTranslation } from "react-i18next";
import { RegisterForm } from "../features/auth/components/RegisterForm";

export function RegisterPage() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-stone-900 dark:text-stone-100">
        {t("auth.registerTitle")}
      </h1>
      <RegisterForm />
    </div>
  );
}
