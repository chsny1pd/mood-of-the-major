import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AmbientBackground } from "../components/AmbientBackground";
import { Button } from "../components/ui/Button";
import { ROUTES } from "../constants/routes";

export const LandingPage = memo(function LandingPage() {
  const { t } = useTranslation();

  const cards = useMemo(
    () => [
      { title: t("landing.cards.anonymous.title"), body: t("landing.cards.anonymous.body") },
      { title: t("landing.cards.feeds.title"), body: t("landing.cards.feeds.body") },
      { title: t("landing.cards.trust.title"), body: t("landing.cards.trust.body") },
    ],
    [t],
  );

  return (
    <div className="relative overflow-hidden">
      <AmbientBackground />
      <section className="relative z-10 mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="max-w-2xl">
          <p className="font-display text-3xl font-semibold tracking-tight text-orange-700 dark:text-orange-300 sm:text-4xl">
            {t("app.name")}
          </p>
          <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 sm:text-5xl">
            {t("landing.headline")}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-stone-600 dark:text-stone-300">
            {t("landing.description")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={ROUTES.login}>
              <Button size="lg">{t("landing.ctaSignIn")}</Button>
            </Link>
            <Link to={ROUTES.register}>
              <Button size="lg" variant="outline">
                {t("landing.ctaJoin")}
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-20 grid gap-4 sm:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.title}
              className="rounded-2xl border border-stone-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-stone-700 dark:bg-stone-900/80"
            >
              <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">{card.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{card.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-dashed border-orange-200 bg-orange-50/60 p-6 dark:border-orange-900 dark:bg-orange-950/40">
          <p className="text-sm text-orange-950 dark:text-orange-100">
            <span className="font-semibold">{t("landing.authLive")}</span> {t("landing.authLiveBody")}
          </p>
        </div>
      </section>
    </div>
  );
});
