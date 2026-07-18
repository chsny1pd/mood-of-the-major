/** Shared Tailwind class strings for consistent light/dark theming. */
export const themeClasses = {
  pageTitle: "font-display text-3xl font-semibold text-stone-900 dark:text-stone-100",
  heading: "text-stone-900 dark:text-stone-100",
  subheading: "text-stone-800 dark:text-stone-200",
  body: "text-stone-600 dark:text-stone-400",
  muted: "text-stone-500 dark:text-stone-400",
  faint: "text-stone-400 dark:text-stone-500",
  link: "text-orange-700 hover:underline dark:text-orange-300",
  linkSubtle: "text-orange-600 hover:underline dark:text-orange-400",
  surface: "bg-white dark:bg-stone-900",
  surfaceMuted: "bg-stone-50 dark:bg-stone-950",
  page: "bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100",
  card: "rounded-xl border border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-900",
  cardLg: "rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-900",
  input:
    "w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none ring-orange-600 focus:ring-2 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100 dark:placeholder:text-stone-500",
  select:
    "w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none ring-orange-600 focus:ring-2 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100",
  label: "text-sm font-medium text-stone-700 dark:text-stone-300",
  errorBox:
    "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-100",
  divider: "divide-stone-100 dark:divide-stone-800",
  border: "border-stone-200 dark:border-stone-700",
  hoverRow: "hover:bg-stone-50 dark:hover:bg-stone-800",
  adminPage: "min-h-screen bg-stone-100 text-stone-900 dark:bg-stone-950 dark:text-stone-100",
} as const;
