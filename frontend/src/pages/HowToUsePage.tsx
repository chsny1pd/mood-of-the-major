import { useTranslation } from "react-i18next";
import { Card, CardContent } from "../components/ui/Card";

export function HowToUsePage() {
  const { t } = useTranslation();

  const postSteps = [
    t("howToUse.howToPostSteps.selectMood"),
    t("howToUse.howToPostSteps.writeMessage"),
    t("howToUse.howToPostSteps.submit"),
  ];

  const faqItems = [
    { q: t("howToUse.faq.howPost.q"), a: t("howToUse.faq.howPost.a") },
    { q: t("howToUse.faq.whoAmI.q"), a: t("howToUse.faq.whoAmI.a") },
    { q: t("howToUse.faq.editPost.q"), a: t("howToUse.faq.editPost.a") },
    { q: t("howToUse.faq.reactions.q"), a: t("howToUse.faq.reactions.a") },
  ];

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold text-stone-900 dark:text-stone-100">
        {t("howToUse.title")}
      </h1>

      <div className="mt-8 space-y-8">
        <article>
          <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
            {t("howToUse.whatIsTitle")}
          </h2>
          <p className="mt-3 leading-relaxed text-stone-600 dark:text-stone-300">
            {t("howToUse.whatIsBody")}
          </p>
        </article>

        <article>
          <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
            {t("howToUse.howToPostTitle")}
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-stone-600 dark:text-stone-300">
            {postSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </article>

        <article>
          <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
            {t("howToUse.browseTitle")}
          </h2>
          <p className="mt-3 leading-relaxed text-stone-600 dark:text-stone-300">
            {t("howToUse.browseBody")}
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-stone-600 dark:text-stone-300">
            <li>{t("howToUse.browseReactions")}</li>
            <li>{t("howToUse.browseFilters")}</li>
            <li>{t("howToUse.browseSearch")}</li>
          </ul>
        </article>

        <article>
          <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
            {t("howToUse.privacyTitle")}
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-stone-600 dark:text-stone-300">
            <li>{t("howToUse.privacyAnonymous")}</li>
            <li>{t("howToUse.privacyData")}</li>
            <li>{t("howToUse.privacyGuidelines")}</li>
          </ul>
        </article>

        <article>
          <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
            {t("howToUse.faqTitle")}
          </h2>
          <div className="mt-4 space-y-3">
            {faqItems.map((item) => (
              <Card key={item.q}>
                <CardContent className="py-4">
                  <h3 className="font-medium text-stone-900 dark:text-stone-100">{item.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                    {item.a}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
