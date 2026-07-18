# Profile, Settings, Dashboard & Navigation — Design

> **Status:** Draft for implementation  
> **Date:** 2026-07-18  
> **Product:** Mood of the Major  
> **Approach:** Profile-first then Dashboard (sequence 1)

---

## 1. Goal

Deliver a coordinated product update that:

1. Persists OAuth/profile identity fields (`displayName`, `avatarUrl`) in the database so they survive refresh.
2. Lets users edit real name, display name, birth year (shown as age), faculty/major, and profile photo on Settings.
3. Fixes incomplete/flickering navbar items caused by remounting auth state.
4. Replaces separate Statistics + Trending pages with a single `/dashboard` that presents richer visualizations.
5. Expands mock seed data (~50 students, ~500 moods).
6. Removes Home from the navbar; routes post-login and brand logo (when authenticated) to Dashboard; keeps `/` reachable by URL only.
7. Promotes GitHub user `chsny1pd` to administrator.

**Success criteria**

- After OAuth or profile edit, refresh keeps display name and avatar visible in Settings/UserMenu.
- Settings can update all listed fields via authenticated API; public mood UIs never show `realName`.
- Student AppNavbar items stay complete across student routes (no flicker-off of auth links after navigation).
- `/dashboard` shows KPIs, distribution, time series, trending, plus 1–2 extra views; `/statistics` and `/trending` redirect there.
- Seed script produces ~50 users and ~500 moods without breaking anonymity thresholds unnecessarily.
- Logged-in visit to `/` redirects to `/dashboard`; logo → dashboard when authenticated; Home absent from nav.
- `chsny1pd` has `role: "administrator"` after promotion script run.

---

## 2. Non-goals

- Persisting login across **closed tabs** / cold start without access token (sessionStorage → cookie bootstrap). Deferred; user chose profile-field persistence only.
- Showing real names or avatars on anonymous mood cards/feeds.
- Rewriting admin layout navbar into AppNavbar.
- Changing emotion-category semantics or anonymity aggregation threshold policy.

---

## 3. Locked decisions

| Topic | Choice |
|-------|--------|
| Profile “stay forever” | Persist displayName/avatar (and related fields) in DB — not cold-start session restore |
| Age | Store `birthYear`; display computed age |
| Avatar | GitHub default + R2 upload to change |
| Mock volume | ~50 users, ~500 moods |
| Dashboard route | `/dashboard`; old `/statistics` & `/trending` redirect |
| Work sequence | Profile/API → Settings → Navbar/routing → Dashboard → Seed → Admin promote |

---

## 4. Data model

Extend User entity/model with:

| Field | Type | Notes |
|-------|------|--------|
| `displayName` | string, optional | Shown in account UI; not on public moods |
| `realName` | string, optional | Settings-only; never in anonymous mappers |
| `birthYear` | number, optional | e.g. 2004; age = currentYear − birthYear |
| `avatarUrl` | string, optional | HTTPS URL (GitHub or R2 public/presigned display URL as existing image pattern allows) |

Existing: `facultyId`, `majorId`, `email`, `role`, etc.

**OAuth fill policy:** On GitHub login/callback, if `displayName` / `avatarUrl` are empty, set from provider profile. Do not overwrite fields the user has already customized (track via “only fill when empty” or a `avatarSource` / `profileCustomized` flag — prefer **fill-when-empty** for simplicity).

**Anonymity:** `authMapper` / mood mappers must omit `realName`, `displayName`, `avatarUrl`, `birthYear`, `email` from public content responses.

---

## 5. API

| Method | Path | Purpose |
|--------|------|---------|
| `GET /auth/me` | Extended | Return new profile fields + faculty/major ids (and names if already convenient) |
| `PATCH /auth/me` | New | Update `realName`, `displayName`, `birthYear`, `facultyId`, `majorId`, `avatarUrl` |
| Existing image upload | Reuse | Presign/upload → client sets `avatarUrl` via PATCH |

**PATCH validation (Zod):**

- `realName` / `displayName`: trimmed strings, max length (e.g. 80)
- `birthYear`: integer 1950…currentYear
- `facultyId` / `majorId`: ObjectId; major must belong to faculty when both set
- `avatarUrl`: optional URL string
- Reject unknown fields (strict)

---

## 6. Frontend — Settings

- Form fields for real name, display name, birth year (show computed age), faculty select, major select (dependent), avatar preview + file input using existing image upload flow.
- Load from `/auth/me`; save via `PATCH /auth/me`.
- Keep theme + language + logout.
- Short privacy note: real name is not shown on the public feed.
- AuthContext `user` (and any UserMenu avatar) refreshed after successful PATCH / after `/me`.

---

## 7. Frontend — Auth provider & navbar

**AuthProvider:** Single provider wrapping the app router (or equivalent one mount) so navigating between public/auth/student/admin trees does not remount and clear `user` mid-flight. Fix is the primary remedy for “navbar items disappearing.”

**AppNavbar (authenticated student):**

- Items: Feed, Dashboard, Search, Saved, Inbox, How to use, Admin (if administrator).
- Remove: Home, Statistics, Trending (as separate entries).
- Logo link: authenticated → `/dashboard`; else → `/`.

**Public / landing navbar:** No Home item in the link list (landing remains at `/` via direct URL). Logo → `/` when logged out.

**Routing:**

- `ROUTES.dashboard = "/dashboard"`
- Redirects: `/statistics` → `/dashboard`, `/trending` → `/dashboard`
- Default post-login / register / OAuth success (no `returnUrl`): `/dashboard`
- Authenticated user hitting `/`: `<Navigate to="/dashboard" />` (or equivalent guard on Landing)

---

## 8. Dashboard

**Page:** `DashboardPage` at `/dashboard` (auth required).

**Content (compose existing APIs where possible):**

1. Header + scope (platform / faculty / major) + period (7d / 30d / 90d)
2. KPI cards (moods, comments, reactions)
3. Emotion distribution chart
4. Activity time series
5. Trending emotions panel (from trending API)
6. **New presentation (at least one, prefer two if data allows without new privacy risk):**
   - Weekday activity heatmap **or** bar breakdown by day-of-week from time series
   - Optional faculty share chart only when aggregation threshold is met

Reuse `statisticsService` / trending hooks; add thin adapters if needed for day-of-week aggregation client-side from time series points.

Visual language: Soft Amber Glow tokens already in app; one composition per section; charts remain accessible (labels, not color-only).

---

## 9. Seed / mock data

Update `backend/scripts/seed-mock-data.ts` (or parameters) to target:

- ~50 mock students
- ~500 moods
- Proportionate comments/reactions for dashboard density

Document npm script usage in script header / README only if already documented for seed — avoid unsolicited README sprawl; comment in script is enough if README already covers `seed:mock-data`.

---

## 10. Admin promotion

Run existing `npm run promote:github-admin -- chsny1pd` against the target MongoDB (local/dev as appropriate). Optionally add `chsny1pd` to a small allowlist comment or seed-admin helper **only if** the project already maintains such a list; otherwise one-time script run is sufficient. Record in implementation notes that promotion was executed or is a required manual step for each environment.

---

## 11. Implementation sequence

1. Backend User fields + OAuth fill-when-empty + GET/PATCH `/auth/me`
2. Frontend AuthContext/`/me` types + Settings edit UI + avatar upload
3. Single AuthProvider mount + navbar/routing/home/logo/login redirects + dashboard route redirects
4. DashboardPage + chart enhancements; retire Statistics/Trending from nav
5. Expand mock seed
6. Promote `chsny1pd`

---

## 12. Testing

- Unit: Zod schema birthYear bounds; age display helper; anonymity mapper omits realName/avatar
- API: PATCH `/auth/me` happy path + major/faculty mismatch rejected
- Frontend: Settings form submits; Landing a11y still OK; navbar shows Dashboard not Home when authenticated
- Manual: OAuth → refresh → avatar/name remain; login → lands on dashboard; logo → dashboard

---

## 13. Docs

Update `docs/api.md` (and `DESIGN.md` nav if it lists Statistics/Trending) to document PATCH `/auth/me`, `/dashboard`, and redirects. Keep anonymity rules explicit.
