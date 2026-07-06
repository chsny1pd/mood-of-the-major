export function LandingPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="max-w-2xl">
        <p className="mb-3 text-sm font-medium uppercase tracking-wide text-teal-700">
          University emotional wellness
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
          Share how you feel — anonymously, safely, together.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-stone-600">
          Mood of the Major helps students express emotional experience without revealing identity,
          while communities understand collective mood across faculties and majors.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        {[
          {
            title: "Anonymous posts",
            body: "Your voice matters. Your identity stays private in public views.",
          },
          {
            title: "Faculty & major feeds",
            body: "See how your academic community is feeling over time.",
          },
          {
            title: "Built for trust",
            body: "Security, moderation, and privacy are core — not add-ons.",
          },
        ].map((card) => (
          <article
            key={card.title}
            className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-base font-semibold text-stone-900">{card.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">{card.body}</p>
          </article>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-dashed border-teal-200 bg-teal-50/60 p-6">
        <p className="text-sm text-teal-900">
          <span className="font-semibold">Sprint 1 foundation is live.</span> Authentication, feeds,
          and posting arrive in upcoming sprints.
        </p>
      </div>
    </section>
  );
}
