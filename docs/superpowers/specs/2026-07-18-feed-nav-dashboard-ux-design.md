# Feed UX, dashboard scope, navbar, logout — 2026-07-18

## Summary

Consolidate search into the feed, fix dashboard scope theming and navbar interactions, keep existing RBAC/admin entry points visible, restyle How to Use as a CTA beside Share, and send logout to home.

## Decisions

1. **Search on Feed** — Text input + existing filters on `/feed`. When `q` ≥ 2 chars, call `/moods/search`; otherwise use feed API. Navbar Search removed; `/search` redirects to `/feed`. Backend search uses optional auth (same as feed).
2. **ScopeSelector** — Use shared `themeClasses` for dark/light contrast; show loading/empty/error for faculty/major lists.
3. **Faculty/major scope** — Existing API wiring kept; UI fixes ensure users can select IDs correctly. Aggregation still depends on job data for those scopes.
4. **RBAC/Admin** — Already present (`RequireAdmin`, `/admin*`). Navbar Admin link for `administrator`; also linked from UserMenu.
5. **Dashboard navbar clicks** — Sticky header `z-50` + dropdown menus portaled to `document.body` so Recharts stacking contexts cannot cover menus.
6. **How to Use** — Outline pill button beside Share (and near auth CTAs on public navbar).
7. **Logout** — After logout, navigate to `/` (home).

## Out of scope

- Changing aggregation job behavior or anonymity thresholds
- Removing `SearchPage.tsx` source file (route redirects; page unused)
