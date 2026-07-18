import publicEn from "../locales/en/public.json";
import { themeClasses } from "../lib/themeClasses";

const copy = publicEn;

const navItems = [
  { href: "/", label: copy.nav.home },
  { href: "/feed", label: copy.nav.feed },
  { href: "/statistics", label: copy.nav.statistics },
  { href: "/how-to-use", label: copy.nav.howToUse },
] as const;

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
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <a
              href="/"
              className="shrink-0 text-lg font-semibold tracking-tight text-orange-800 dark:text-orange-300"
            >
              {copy.app.name}
            </a>
            <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-2.5 py-1.5 text-stone-600 transition hover:bg-stone-100 hover:text-orange-800 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-orange-300"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <a
              href="/login"
              className="hidden rounded-xl px-2.5 py-1 text-xs font-medium text-stone-600 transition hover:bg-stone-100 hover:text-orange-800 sm:inline-flex dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-orange-300"
            >
              {copy.nav.logIn}
            </a>
            <a
              href="/register"
              className="hidden rounded-xl bg-orange-700 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-orange-800 sm:inline-flex dark:bg-orange-600 dark:hover:bg-orange-500"
            >
              {copy.nav.join}
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-medium uppercase tracking-wide text-orange-700 dark:text-orange-300">
              {copy.landing.eyebrow}
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 sm:text-5xl">
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

          <div className="mt-12 rounded-2xl border border-dashed border-orange-200 bg-orange-50/60 p-6 dark:border-orange-900 dark:bg-orange-950/40">
            <p className="text-sm text-orange-900 dark:text-orange-100">
              <span className="font-semibold">{copy.landing.authLive}</span> {copy.landing.authLiveBody}
            </p>
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
