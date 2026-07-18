# Soft Amber Glow UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace teal brand accents with a warm soft-amber/orange theme, add subtle ambient glow, and modernize Landing, Feed, Navbar, and Auth surfaces.

**Architecture:** Centralize brand tokens in `themeClasses` + CSS variables/utilities in `index.css`, add a small reusable `AmbientBackground` for glow planes, redesign key pages to consume those tokens, then sweep remaining hardcoded `teal-*` classes. Keep routes, anonymity, and business logic unchanged.

**Tech Stack:** React 19, Vite, Tailwind CSS v4, TypeScript, Vitest + jest-axe, i18next, Google Fonts (Fraunces + DM Sans)

**Spec:** [`docs/superpowers/specs/2026-07-18-soft-amber-glow-ui-design.md`](../specs/2026-07-18-soft-amber-glow-ui-design.md)

## Global Constraints

- Brand primary light: `#EA580C` (Tailwind `orange-600`); dark: `#FB923C` (`orange-400`)
- No WebGL/canvas; CSS-only ambient glow
- Respect `prefers-reduced-motion: reduce` (static gradient only)
- Preserve anonymity UI rules (no author identity surfaces)
- Do not change API contracts or backend
- Keep emotion-category semantic meaning separate from brand; migrate brand-only teal chrome to orange
- Conventional Commits; minimal focused diffs
- Update `DESIGN.md` color section in the same change set

## File map

| File | Responsibility |
|------|----------------|
| `frontend/src/styles/index.css` | Fonts, CSS variables, ambient utilities, reduced-motion, body wash |
| `frontend/src/lib/themeClasses.ts` | Shared brand/surface Tailwind class strings |
| `frontend/src/lib/themeClasses.test.ts` | Guard: brand classes use orange, not teal |
| `frontend/src/components/AmbientBackground.tsx` | Reusable soft radial glow layer |
| `frontend/src/components/ui/Button.tsx` | Primary/ghost orange variants |
| `frontend/src/components/ui/Avatar.tsx` | Orange avatar fill |
| `frontend/src/components/ui/DropdownMenu.tsx` | Orange focus ring |
| `frontend/src/components/AppNavbar.tsx` | Orange nav + subtle glow wash |
| `frontend/src/components/PublicNavbar.tsx` | Same as AppNavbar public paths |
| `frontend/src/pages/LandingPage.tsx` | Hero composition + CTAs + ambient |
| `frontend/src/app/StaticHomeFallback.tsx` | Match Landing/navbar orange |
| `frontend/index.html` | Inline SSR-ish home HTML: teal → orange |
| `frontend/src/layouts/AuthLayout.tsx` | Ambient shell behind auth card |
| `frontend/src/pages/FeedPage.tsx` | Header polish + orange CTAs |
| `frontend/src/components/MoodCard.tsx` | Orange hover border |
| `frontend/src/components/EmotionBadge.tsx` | Orange soft badge |
| Remaining `frontend/src/**` with `teal-*` | Token sweep |
| `frontend/src/locales/{en,th}/public.json` | Landing CTA keys if needed |
| `DESIGN.md` | Document orange primary palette |

---

### Task 1: Brand tokens + CSS foundation

**Files:**
- Modify: `frontend/src/styles/index.css`
- Modify: `frontend/src/lib/themeClasses.ts`
- Create: `frontend/src/lib/themeClasses.test.ts`
- Create: `frontend/src/components/AmbientBackground.tsx`

**Interfaces:**
- Consumes: none
- Produces:
  - `themeClasses` with orange brand strings (same export shape)
  - `AmbientBackground` props: `{ className?: string; variant?: "hero" | "subtle" }`
  - CSS classes: `.font-display`, `.ambient-glow`, `.ambient-glow--subtle`, CSS vars `--brand`, `--brand-soft`, `--glow`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/lib/themeClasses.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { themeClasses } from "./themeClasses";

describe("themeClasses brand tokens", () => {
  it("uses orange brand accents instead of teal", () => {
    expect(themeClasses.link).toContain("orange");
    expect(themeClasses.link).not.toContain("teal");
    expect(themeClasses.linkSubtle).toContain("orange");
    expect(themeClasses.input).toContain("orange");
    expect(themeClasses.select).toContain("orange");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- src/lib/themeClasses.test.ts`

Expected: FAIL (link still contains `teal`)

- [ ] **Step 3: Update `themeClasses.ts`**

Replace teal brand strings with orange:

```ts
/** Shared Tailwind class strings for consistent light/dark theming. */
export const themeClasses = {
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
    "rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none ring-orange-600 focus:ring-2 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100",
  label: "text-sm font-medium text-stone-700 dark:text-stone-300",
  errorBox:
    "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-100",
  divider: "divide-stone-100 dark:divide-stone-800",
  border: "border-stone-200 dark:border-stone-700",
  hoverRow: "hover:bg-stone-50 dark:hover:bg-stone-800",
  adminPage: "min-h-screen bg-stone-100 text-stone-900 dark:bg-stone-950 dark:text-stone-100",
} as const;
```

- [ ] **Step 4: Update `index.css` with fonts, vars, ambient utilities**

Replace/extend `frontend/src/styles/index.css` to include (keep existing `@import "tailwindcss"` and dark variant):

```css
@import "tailwindcss";
@import url("https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap");

@custom-variant dark (&:where(.dark, .dark *));

:root {
  --brand: #ea580c;
  --brand-hover: #c2410c;
  --brand-soft: #fff7ed;
  --glow: rgb(251 146 60 / 0.22);
  font-family: "DM Sans", "Segoe UI", system-ui, -apple-system, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color-scheme: light;
}

:root.dark {
  --brand: #fb923c;
  --brand-hover: #fdba74;
  --brand-soft: #431407;
  --glow: rgb(249 115 22 / 0.16);
  color-scheme: dark;
}

.font-display {
  font-family: "Fraunces", Georgia, "Times New Roman", serif;
}

.ambient-glow {
  pointer-events: none;
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 0;
}

.ambient-glow::before,
.ambient-glow::after {
  content: "";
  position: absolute;
  border-radius: 9999px;
  filter: blur(64px);
  opacity: 1;
}

.ambient-glow::before {
  top: -12%;
  left: -8%;
  width: min(52vw, 28rem);
  height: min(52vw, 28rem);
  background: var(--glow);
}

.ambient-glow::after {
  right: -10%;
  bottom: -18%;
  width: min(48vw, 24rem);
  height: min(48vw, 24rem);
  background: rgb(253 186 116 / 0.18);
}

.ambient-glow--subtle::before {
  opacity: 0.65;
  width: min(40vw, 18rem);
  height: min(40vw, 18rem);
}

.ambient-glow--subtle::after {
  opacity: 0.45;
}

@media (prefers-reduced-motion: no-preference) {
  .ambient-glow::before,
  .ambient-glow::after {
    animation: ambient-breathe 12s ease-in-out infinite alternate;
  }
}

@keyframes ambient-breathe {
  from {
    transform: translate3d(0, 0, 0) scale(1);
  }
  to {
    transform: translate3d(2%, 3%, 0) scale(1.06);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ambient-glow::before,
  .ambient-glow::after {
    animation: none;
  }
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background-color: #fafaf9;
  color: #1c1917;
}

:root.dark body {
  background-color: #0c0a09;
  color: #f5f5f4;
}

#root {
  min-height: 100vh;
}
```

- [ ] **Step 5: Create `AmbientBackground.tsx`**

```tsx
interface AmbientBackgroundProps {
  className?: string;
  variant?: "hero" | "subtle";
}

export function AmbientBackground({ className = "", variant = "hero" }: AmbientBackgroundProps) {
  const variantClass = variant === "subtle" ? "ambient-glow ambient-glow--subtle" : "ambient-glow";
  return <div aria-hidden="true" className={`${variantClass} ${className}`.trim()} />;
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd frontend && npm test -- src/lib/themeClasses.test.ts`

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add frontend/src/lib/themeClasses.ts frontend/src/lib/themeClasses.test.ts frontend/src/styles/index.css frontend/src/components/AmbientBackground.tsx
git commit -m "$(cat <<'EOF'
feat(ui): add soft amber brand tokens and ambient glow utilities

EOF
)"
```

---

### Task 2: Shared UI primitives (Button, Avatar, Dropdown)

**Files:**
- Modify: `frontend/src/components/ui/Button.tsx`
- Modify: `frontend/src/components/ui/Avatar.tsx`
- Modify: `frontend/src/components/ui/DropdownMenu.tsx`

**Interfaces:**
- Consumes: orange brand from Task 1 (Tailwind `orange-*`)
- Produces: same component APIs; primary/ghost/focus use orange

- [ ] **Step 1: Update Button variants**

In `Button.tsx`, set:

```ts
const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-400 dark:text-stone-950",
  secondary:
    "bg-stone-900 text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white",
  ghost:
    "text-stone-600 hover:bg-stone-100 hover:text-orange-700 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-orange-300",
  outline:
    "border border-stone-300 text-stone-700 hover:bg-stone-100 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800",
};
```

- [ ] **Step 2: Update Avatar**

Replace `bg-teal-700` / `dark:bg-teal-600` with `bg-orange-600` / `dark:bg-orange-500`.

- [ ] **Step 3: Update DropdownMenu focus ring**

Replace `focus-visible:ring-teal-700` with `focus-visible:ring-orange-600`.

- [ ] **Step 4: Verify no teal in ui folder**

Run: `rg "teal-" frontend/src/components/ui`

Expected: no matches

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ui/Button.tsx frontend/src/components/ui/Avatar.tsx frontend/src/components/ui/DropdownMenu.tsx
git commit -m "$(cat <<'EOF'
feat(ui): switch shared controls to orange brand accents

EOF
)"
```

---

### Task 3: Landing hero + i18n CTAs + static fallback

**Files:**
- Modify: `frontend/src/pages/LandingPage.tsx`
- Modify: `frontend/src/pages/LandingPage.a11y.test.tsx` (only if structure roles change — keep axe passing)
- Modify: `frontend/src/locales/en/public.json`
- Modify: `frontend/src/locales/th/public.json`
- Modify: `frontend/src/locales/en/translation.json` (landing keys if duplicated)
- Modify: `frontend/src/locales/th/translation.json`
- Modify: `frontend/src/app/StaticHomeFallback.tsx`
- Modify: `frontend/index.html` (inline home HTML)

**Interfaces:**
- Consumes: `AmbientBackground`, `ROUTES`, `themeClasses`, `t("landing.*")`, `t("nav.logIn")`, `t("nav.join")`
- Produces: Landing first viewport with brand, headline, description, CTA group; cards below fold

- [ ] **Step 1: Add landing CTA keys (en/th public + full translation)**

In `landing` object of `en/public.json` and `en/translation.json` (and Thai equivalents), add:

```json
"ctaSignIn": "Sign in",
"ctaJoin": "Join the community"
```

Thai (`th/public.json` / `th/translation.json`):

```json
"ctaSignIn": "เข้าสู่ระบบ",
"ctaJoin": "เข้าร่วมชุมชน"
```

(Keep existing keys; do not remove `authLive` / cards.)

- [ ] **Step 2: Rewrite `LandingPage.tsx` composition**

Use this structure (exact classes may be tuned slightly, but hierarchy must match):

```tsx
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
```

Note: Drop the old teal eyebrow as the sole brand signal — brand name is hero-level per design. Do not put cards in the first viewport on small screens if spacing keeps CTAs above fold; cards at `mt-20` is intentional.

- [ ] **Step 3: Run Landing a11y test**

Run: `cd frontend && npm test -- src/pages/LandingPage.a11y.test.tsx`

Expected: PASS

- [ ] **Step 4: Update `StaticHomeFallback.tsx` and `index.html` inline home**

Replace all `teal-*` with matching `orange-*` (e.g. `text-teal-800` → `text-orange-700`, `bg-teal-700` → `bg-orange-600`, `bg-teal-50` → `bg-orange-50`, dashed teal borders → orange). Align brand/CTA colors with Landing.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/LandingPage.tsx frontend/src/locales frontend/src/app/StaticHomeFallback.tsx frontend/index.html
git commit -m "$(cat <<'EOF'
feat(ui): redesign landing with soft amber hero and CTAs

EOF
)"
```

---

### Task 4: Navbar orange + subtle glow

**Files:**
- Modify: `frontend/src/components/AppNavbar.tsx`
- Modify: `frontend/src/components/PublicNavbar.tsx` (if still used; keep in sync with AppNavbar)

**Interfaces:**
- Consumes: orange Button, brand link colors
- Produces: navbar with orange active states and soft bottom glow

- [ ] **Step 1: Update `navLinkClass` in AppNavbar**

```ts
function navLinkClass({ isActive }: { isActive: boolean }) {
  return [
    "rounded-md px-2.5 py-1.5 transition",
    isActive
      ? "bg-orange-50 font-medium text-orange-900 dark:bg-orange-950 dark:text-orange-100"
      : "text-stone-600 hover:bg-stone-100 hover:text-orange-700 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-orange-300",
  ].join(" ");
}
```

- [ ] **Step 2: Update header chrome**

Change header wrapper to include relative + soft glow strip:

```tsx
<header className="relative border-b border-stone-200/80 bg-white/80 backdrop-blur dark:border-stone-700 dark:bg-stone-950/80">
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-x-0 -bottom-6 h-6 bg-gradient-to-b from-orange-400/15 to-transparent dark:from-orange-500/10"
  />
  {/* existing inner content; logo link: text-orange-700 dark:text-orange-300 */}
```

Logo `Link` classes: `shrink-0 text-lg font-semibold tracking-tight text-orange-700 dark:text-orange-300` (optionally add `font-display` on logo only).

- [ ] **Step 3: Mirror changes in `PublicNavbar.tsx`**

Same active/hover/logo/teal→orange replacements.

- [ ] **Step 4: Grep navbars for teal**

Run: `rg "teal-" frontend/src/components/AppNavbar.tsx frontend/src/components/PublicNavbar.tsx`

Expected: no matches

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/AppNavbar.tsx frontend/src/components/PublicNavbar.tsx
git commit -m "$(cat <<'EOF'
feat(ui): restyle navbars with amber accents and soft glow

EOF
)"
```

---

### Task 5: Auth shell + Feed header polish

**Files:**
- Modify: `frontend/src/layouts/AuthLayout.tsx`
- Modify: `frontend/src/pages/FeedPage.tsx`
- Modify: `frontend/src/components/MoodCard.tsx`
- Modify: `frontend/src/components/EmotionBadge.tsx`
- Modify: `frontend/src/features/auth/components/LoginForm.tsx`
- Modify: `frontend/src/features/auth/components/RegisterForm.tsx`

**Interfaces:**
- Consumes: `AmbientBackground` (`variant="subtle"`), orange Button/themeClasses
- Produces: warm auth shell; feed header with orange Share; orange card hover/badge

- [ ] **Step 1: Update AuthLayout**

```tsx
import { AmbientBackground } from "../components/AmbientBackground";
// ...
return (
  <div className={`relative flex min-h-screen flex-col overflow-hidden ${themeClasses.page}`}>
    <AmbientBackground variant="subtle" />
    <div className="relative z-10 flex min-h-screen flex-col">
      <AppNavbar variant="app" />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        {/* existing centered card content unchanged structurally */}
      </div>
    </div>
  </div>
);
```

- [ ] **Step 2: Orange auth submit buttons**

In `LoginForm.tsx` and `RegisterForm.tsx`, replace `bg-teal-800` / `hover:bg-teal-900` / dark teal variants with:

`bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-400` (and white/dark text as on Button primary).

Prefer switching to `<Button type="submit" ...>` if trivial; otherwise class swap only.

- [ ] **Step 3: Polish FeedPage header**

- Title: add `font-display` optionally; keep `text-3xl font-semibold`
- Wrap section in `relative`; optional subtle ambient behind header only (small absolute glow div, not full-page)
- Share links: `bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-400`

- [ ] **Step 4: MoodCard + EmotionBadge**

`MoodCard`: `hover:border-teal-200` → `hover:border-orange-200`, dark similarly.  
`EmotionBadge` brand-teal path → `bg-orange-100 text-orange-900 ring-orange-200` (+ dark variants).

- [ ] **Step 5: Smoke test**

Run: `cd frontend && npm test -- src/lib/themeClasses.test.ts src/pages/LandingPage.a11y.test.tsx`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add frontend/src/layouts/AuthLayout.tsx frontend/src/pages/FeedPage.tsx frontend/src/components/MoodCard.tsx frontend/src/components/EmotionBadge.tsx frontend/src/features/auth/components/LoginForm.tsx frontend/src/features/auth/components/RegisterForm.tsx
git commit -m "$(cat <<'EOF'
feat(ui): warm auth shell and amber feed accents

EOF
)"
```

---

### Task 6: Full teal → orange sweep

**Files:** (all remaining matches from `rg "teal-" frontend`)

Known list at plan time:

- `frontend/src/components/LanguageSwitcher.tsx`
- `frontend/src/components/ThemeToggle.tsx`
- `frontend/src/pages/AdminFacultiesPage.tsx`
- `frontend/src/pages/AdminMajorsPage.tsx`
- `frontend/src/pages/AdminMoodsPage.tsx`
- `frontend/src/pages/AdminPendingPage.tsx`
- `frontend/src/pages/AdminUsersPage.tsx`
- `frontend/src/pages/NotificationsPage.tsx`
- `frontend/src/pages/BookmarksPage.tsx`
- `frontend/src/pages/FacultyFeedPage.tsx`
- `frontend/src/pages/MajorFeedPage.tsx`
- `frontend/src/pages/AuthCallbackPage.tsx`
- `frontend/src/pages/SettingsPage.tsx`
- `frontend/src/features/mood/components/CreateMoodForm.tsx`
- `frontend/src/features/mood/components/EditMoodForm.tsx`
- `frontend/src/features/repost/components/RepostButton.tsx`
- `frontend/src/features/bookmarks/components/BookmarkButton.tsx`
- `frontend/src/features/bookmarks/components/BookmarkIconButton.tsx`
- `frontend/src/features/comments/components/CommentSection.tsx`
- `frontend/src/features/statistics/components/TrendingEmotionChip.tsx`
- `frontend/src/features/submissions/components/SubmitReferenceModal.tsx`
- `frontend/src/features/reactions/components/ReactionBar.tsx`
- `frontend/src/features/report/components/ReportModal.tsx`

**Interfaces:**
- Consumes: orange Tailwind scale mapping below
- Produces: zero `teal-` under `frontend/src` and `frontend/index.html`

**Mapping (apply mechanically):**

| From | To |
|------|-----|
| `teal-50` | `orange-50` |
| `teal-100` | `orange-100` |
| `teal-200` | `orange-200` |
| `teal-300` | `orange-300` |
| `teal-400` | `orange-400` |
| `teal-500` | `orange-500` |
| `teal-600` | `orange-600` |
| `teal-700` | `orange-700` |
| `teal-800` | `orange-700` (prefer) or `orange-800` for solid fills that were very dark |
| `teal-900` | `orange-900` |
| `teal-950` | `orange-950` |

Solid primary buttons that were `bg-teal-700` / `bg-teal-800` → `bg-orange-600` with `hover:bg-orange-700` for consistency with Button primary.

- [ ] **Step 1: Run inventory**

Run: `rg -n "teal-" frontend`

- [ ] **Step 2: Apply mapping file by file**

No behavior changes — class string swaps only.

- [ ] **Step 3: Verify clean**

Run: `rg "teal-" frontend`

Expected: no matches (or only a comment documenting migration — prefer zero matches)

- [ ] **Step 4: Run frontend tests + typecheck**

Run:

```bash
cd frontend && npm test && npm run typecheck
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend
git commit -m "$(cat <<'EOF'
refactor(ui): replace remaining teal accents with orange

EOF
)"
```

---

### Task 7: DESIGN.md sync + final verification

**Files:**
- Modify: `DESIGN.md` (Color Palette + Dark Mode brand rows)
- Optional: `docs/frontend.md` only if it names teal explicitly

**Interfaces:**
- Consumes: locked palette from spec
- Produces: docs match shipped UI

- [ ] **Step 1: Update Color Palette table in `DESIGN.md`**

Replace Primary/Secondary rows under Semantic Color Roles:

| Role | Intent | Description |
|------|--------|-------------|
| **Primary** | Brand, primary CTAs | Soft amber-orange (`#EA580C` light / `#FB923C` dark) — warm, calm, approachable |
| **Secondary** | Supporting actions | Warm stone outline / ghost — secondary buttons stay neutral |

Update Dark Mode Strategy primary brand row from indigo-violet to amber-orange lighter tint.

Add a short note under Color Philosophy that ambient soft orange glow may appear on marketing/auth/header surfaces only.

- [ ] **Step 2: Manual checklist (implementer)**

- [ ] Light + dark: Landing, Feed, Login, Navbar (desktop + ~375px)
- [ ] Focus rings visible on inputs/buttons
- [ ] `prefers-reduced-motion`: no ambient animation
- [ ] `rg "teal-" frontend` clean

- [ ] **Step 3: Final test run**

Run: `cd frontend && npm test && npm run lint`

Expected: PASS (fix lint issues unrelated to this work only if pre-existing; do not expand scope)

- [ ] **Step 4: Commit**

```bash
git add DESIGN.md
git commit -m "$(cat <<'EOF'
docs: align DESIGN.md palette with soft amber glow theme

EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Orange color system / tokens | 1, 2, 6 |
| CSS ambient glow + reduced motion | 1 |
| Fraunces + DM Sans | 1, 3 |
| Landing hero + CTAs | 3 |
| Navbar orange + glow | 4 |
| Auth ambient shell | 5 |
| Feed header + card accents | 5 |
| Full teal sweep | 6 |
| DESIGN.md update | 7 |
| A11y / tests | 1, 3, 5, 6, 7 |

## Self-review notes

- No TBD placeholders in tasks
- `AmbientBackground` API is consistent across Tasks 1, 3, 5
- Teal→orange mapping is explicit for Task 6
- Static HTML in `index.html` included so first paint matches brand
