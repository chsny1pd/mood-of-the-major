import { useTranslation } from "react-i18next";
import { CreateMoodForm } from "../features/mood/components/CreateMoodForm";

export function CreateMoodPage() {
  const { t } = useTranslation();

  return (
    <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold text-stone-900 dark:text-stone-100">
        {t("create.pageTitle")}
      </h1>
      <p className="mt-2 text-stone-600 dark:text-stone-300">{t("create.pageDescription")}</p>
      <div className="mt-8">
        <CreateMoodForm />
      </div>
    </section>
  );
}
