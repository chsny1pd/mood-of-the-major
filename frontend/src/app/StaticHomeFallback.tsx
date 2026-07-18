import publicEn from "../locales/en/public.json";
import { themeClasses } from "../lib/themeClasses";

const copy = publicEn;

const cards = [
  {
    title: copy.landing.cards.anonymous.title,
    body: copy.landing.cards.anonymous.body,
  },
  {
    title: copy.landing.cards.feeds.title,
    body: copy.landing.cards.feeds.body,
  },
  {
    title: copy.landing.cards.trust.title,
    body: copy.landing.cards.trust.body,
  },
] as const;

export function StaticHomeFallback() {
  return (
    <div className={`flex min-h-screen flex-col ${themeClasses.page}`}>
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur dark:border-stone-700 dark:bg-stone-950/80">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
          <a
            href="/"
            className="shrink-0 text-lg font-semibold tracking-tight text-orange-800 dark:text-orange-300"
          >
            {copy.app.name}
          </a>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-3xl font-semibold tracking-tight text-orange-700 dark:text-orange-300 sm:text-4xl">
              {copy.app.name}
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 sm:text-5xl">
              {copy.landing.headline}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-stone-600 dark:text-stone-300">
              {copy.landing.description}
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
        </section>
      </main>

      <footer className={`border-t ${themeClasses.border} ${themeClasses.surface}`}>
        <div className={`mx-auto max-w-5xl px-4 py-6 text-sm sm:px-6 ${themeClasses.muted}`}>
          {copy.app.footer}
        </div>
      </footer>
    </div>
  );
}
