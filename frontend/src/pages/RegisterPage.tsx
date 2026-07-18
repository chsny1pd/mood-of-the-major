import { useTranslation } from "react-i18next";
import { RegisterForm } from "../features/auth/components/RegisterForm";
import { themeClasses } from "../lib/themeClasses";

export function RegisterPage() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className={`mb-6 ${themeClasses.pageTitle}`}>{t("auth.registerTitle")}</h1>
      <RegisterForm />
    </div>
  );
}
