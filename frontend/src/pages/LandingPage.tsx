import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";

export const LandingPage = memo(function LandingPage() {
  const { t } = useTranslation();

  const cards = useMemo(
    () => [
      {
        title: t("landing.cards.anonymous.title"),
        body: t("landing.cards.anonymous.body"),
      },
      {
        title: t("landing.cards.feeds.title"),
        body: t("landing.cards.feeds.body"),
      },
      {
        title: t("landing.cards.trust.title"),
        body: t("landing.cards.trust.body"),
      },
    ],
    [t],
  );

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="max-w-2xl">
        <p className="mb-3 text-sm font-medium uppercase tracking-wide text-teal-700 dark:text-teal-300">
          {t("landing.eyebrow")}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 sm:text-5xl">
          {t("landing.headline")}
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-stone-600 dark:text-stone-300">
          {t("landing.description")}
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <article
            key={card.title}
            className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-700 dark:bg-stone-900"
          >
            <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">{card.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{card.body}</p>
          </article>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-dashed border-teal-200 bg-teal-50/60 p-6 dark:border-teal-900 dark:bg-teal-950/40">
        <p className="text-sm text-teal-900 dark:text-teal-100">
          <span className="font-semibold">{t("landing.authLive")}</span> {t("landing.authLiveBody")}
        </p>
      </div>
    </section>
  );
});
