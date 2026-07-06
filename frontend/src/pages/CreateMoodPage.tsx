import { CreateMoodForm } from "../features/mood/components/CreateMoodForm";

export function CreateMoodPage() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold text-stone-900">Share your mood</h1>
      <p className="mt-2 text-stone-600">
        Your post will be anonymous. Only you know it&apos;s yours.
      </p>
      <div className="mt-8">
        <CreateMoodForm />
      </div>
    </section>
  );
}
