# Soft Amber Glow — UI Theme Refresh Design

> **Status:** Draft for implementation  
> **Date:** 2026-07-18  
> **Product:** Mood of the Major  
> **Direction:** Calm warm orange (Approach A) · Scope B · Soft Amber Glow (Approach 1)

---

## 1. Goal

Refresh the entire frontend visual language from teal accents to a warm soft-amber/orange theme, modernize key surfaces (Landing, Feed, Navbar, Auth), and add subtle ambient light gradients — without changing product flows, anonymity rules, or backend contracts.

**Success criteria**

- No remaining brand/accent `teal-*` on student-facing and shared UI (admin included for token consistency).
- Landing, Feed, Navbar, and Auth feel distinctly warmer and more modern while remaining calm and trustworthy.
- Soft ambient glow is visible on hero/header surfaces; respects `prefers-reduced-motion`.
- Light and dark mode both use the orange system with readable contrast (≥ 4.5:1 for body text on surfaces).
- Existing UX (routes, anonymity, loading/empty/error states) unchanged.

---

## 2. Non-goals

- No new features, routes, or copy rewrites beyond minor microcopy if needed for hierarchy.
- No WebGL/canvas glow; no heavy glassmorphism on feed cards.
- No full layout overhaul of admin tables, statistics charts internals, or mobile bottom-nav architecture.
- No change to emotion-category semantic colors if they already encode mood meaning independently of brand (keep emotion hues; only brand/chrome moves to orange).

---

## 3. Color system

| Role | Light | Dark | Usage |
|------|--------|------|--------|
| Primary | `#EA580C` (orange-600) | `#FB923C` (orange-400) | CTAs, brand links, logo |
| Primary hover | `#C2410C` (orange-700) | `#FDBA74` (orange-300) | Hover |
| Primary soft | `#FFF7ED` / `#FFEDD5` | `#431407` / `#7C2D12` | Active nav, chips, selected tags |
| Glow | orange-400 @ 15–25% | orange-500 @ 10–20% | Ambient radial blobs |
| Page | stone-50 warm | stone-950 | App background |
| Surface | white / stone-50 | stone-900 | Cards, panels |
| Text | stone-900 / 600 / 500 | stone-100 / 300 / 400 | Heading / body / muted |
| Focus ring | orange-600 | orange-400 | Inputs, buttons |
| Danger | red scale (unchanged) | red scale | Errors, destructive |

**Token strategy**

1. Centralize brand classes in `frontend/src/lib/themeClasses.ts` and `frontend/src/components/ui/*`.
2. Replace hardcoded `teal-*` with `orange-*` (or theme tokens) across the frontend.
3. Optional CSS variables in `index.css` for glow utilities (`--brand`, `--brand-soft`, `--glow`) to avoid scattering magic opacities.
4. Update `DESIGN.md` Color Palette section to reflect orange primary (doc sync after UI lands).

---

## 4. Typography

| Role | Face | Usage |
|------|------|--------|
| Display | Fraunces (Google Fonts) | Landing brand + hero headline only |
| UI / body | DM Sans | App chrome, forms, feed body, admin |
| Fallback | system-ui stack | If fonts fail to load |

Rules:

- Display weight reserved for Landing (and optionally large page titles on Feed/Auth headers).
- Feed post content stays UI sans for long-form readability.
- Load fonts via a single place (`index.css` `@import` or `index.html` link); no per-component font imports.

---

## 5. Ambient light & motion

**Ambient**

- Shared utility (e.g. `.ambient-glow` or a small `AmbientBackground` wrapper) with 1–2 soft radial gradients.
- Applied to: Landing hero plane, Auth layout shell, subtle under-navbar wash, optional Feed page header only.
- Not applied behind every mood card (keeps feed calm and readable).

**Motion (2–3 intentional)**

1. Landing: gentle fade/rise of hero text + slow opacity ease on glow (≤ 800ms, once on load).
2. Navbar: slight border/glow intensify on scroll (CSS transition).
3. Primary buttons / mood cards: short hover lift or border-color transition (150–250ms).

**Accessibility**

- `@media (prefers-reduced-motion: reduce)`: no animated glow; static gradient only; no entrance choreography.

---

## 6. Key surface redesigns

### 6.1 Landing

- Full-bleed warm atmosphere (gradient + ambient glow), not a flat stone page.
- First viewport: brand name (hero-level), one headline, one supporting sentence, CTA group (Sign in / Register). Feature cards move below the fold.
- No floating badges/chips on the hero.
- Keep existing i18n keys; restructure markup/classes only. Add CTA links if missing (wire to existing auth routes).

### 6.2 Navbar (App + Public)

- Brand color → orange; active link soft orange surface.
- Translucent bar (`bg-white/80` + blur) retained; add soft bottom glow wash in orange at low opacity.
- Primary “Share” / auth CTAs use orange Button variant.
- Mobile menu inherits same tokens.

### 6.3 Feed

- Page header with clearer hierarchy: display-ish title, muted description, orange Share CTA.
- Soft ambient wash behind header only; list area stays high-contrast surfaces.
- Mood cards: keep structure; orange hover border; EmotionBadge / selected chips use orange soft tokens.
- Filter panel uses shared `themeClasses` (already); ensure focus rings orange.

### 6.4 Auth (Login / Register shell)

- Centered card on ambient warm background (same glow language as Landing, quieter).
- Primary submit buttons and OAuth secondary styling aligned with orange primary / stone outline.
- Error states remain red; success soft boxes can use orange-soft instead of teal-soft.

### 6.5 Rest of app

- Token pass: replace teal accents in reactions, comments, bookmarks, reports, statistics chips, admin primary buttons, avatars, etc.
- No structural redesign required for admin/statistics beyond brand color consistency.

---

## 7. Implementation architecture

| Layer | Change |
|-------|--------|
| `styles/index.css` | Fonts, CSS variables, ambient utilities, reduced-motion, optional body wash |
| `lib/themeClasses.ts` | teal → orange tokens |
| `components/ui/*` | Button, Avatar, focus rings |
| `AppNavbar` / `PublicNavbar` / `StaticHomeFallback` | Orange + subtle glow |
| `LandingPage` | Hero composition + ambient + fonts |
| Auth layout + Login/Register pages | Ambient shell + orange CTAs |
| `FeedPage` + `MoodCard` + related badges | Header polish + orange accents |
| Sweep remaining `teal-*` in `frontend/` | Consistency |
| `DESIGN.md` | Update palette to orange primary |

**Out of scope for this pass:** e2e screenshot baselines if any hardcode teal (update only if tests assert colors).

---

## 8. Testing & verification

- Manual: light + dark on Landing, Feed, Login, Navbar (desktop + mobile width).
- A11y: focus rings visible; contrast spot-check on orange buttons (white text on orange-600 is OK).
- `prefers-reduced-motion`: glow not animated.
- Existing unit/a11y tests for Landing still pass (structure/roles preserved).
- Grep: no `teal-` left under `frontend/src` for brand usage (allow comment if documenting migration).

---

## 9. Rollout

Single focused UI PR. No feature flags. Update `DESIGN.md` in the same change set so docs match shipping UI.

---

## 10. Decisions locked

| Decision | Choice |
|----------|--------|
| Mood | Calm warm (A) |
| Scope | Tokens + key surfaces Landing/Feed/Navbar/Auth (B) |
| Style | Soft Amber Glow (1) |
| Display font | Fraunces |
| UI font | DM Sans |
| Brand scale | Tailwind `orange-*` mapped as above |
| Glow tech | CSS only |
| Emotion colors | Unchanged unless they currently use teal as brand-only |

---

## 11. Open items (resolved)

None blocking. EmotionBadge currently uses teal as brand chrome → migrate to orange soft; true emotion-specific palettes (if added later) stay separate from brand.
