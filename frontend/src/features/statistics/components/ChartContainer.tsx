import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { themeClasses } from "../../../lib/themeClasses";

interface ChartContainerProps {
  title: string;
  meetsThreshold: boolean;
  children: ReactNode;
}

export function ChartContainer({ title, meetsThreshold, children }: ChartContainerProps) {
  const { t } = useTranslation();

  return (
    <section className={`p-5 ${themeClasses.cardLg}`}>
      <h2 className={`mb-4 text-lg font-semibold ${themeClasses.heading}`}>{title}</h2>
      {meetsThreshold ? (
        children
      ) : (
        <div className="rounded-xl bg-stone-50 px-4 py-8 text-center dark:bg-stone-950">
          <p className={`font-medium ${themeClasses.subheading}`}>{t("charts.insufficientData")}</p>
          <p className={`mt-1 text-sm ${themeClasses.muted}`}>
            {t("charts.insufficientDataDescription")}
          </p>
        </div>
      )}
    </section>
  );
}
