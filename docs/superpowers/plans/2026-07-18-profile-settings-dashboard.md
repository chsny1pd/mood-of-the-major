# Profile, Settings, Dashboard & Navigation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist profile fields in DB, editable Settings (including avatar), fix navbar auth remounts, ship `/dashboard` (replacing Statistics+Trending in nav), expand mock seed, promote GitHub admin `chsny1pd`.

**Architecture:** Extend User domain + Mongoose + `AuthService` (OAuth fill-when-empty, `PATCH /auth/me`). Frontend: lift single `AuthProvider` to `AppProviders`, Settings form + image upload, routing/nav updates, compose Statistics+Trending into `DashboardPage` with a weekday activity view. Expand `seed-mock-data.ts` constants. Run promote script for `chsny1pd`.

**Tech Stack:** Express, Zod, Mongoose, React 19, React Router 7, TanStack Query, Recharts, Vitest, existing R2 image upload

**Spec:** [`docs/superpowers/specs/2026-07-18-profile-settings-dashboard-design.md`](../specs/2026-07-18-profile-settings-dashboard-design.md)

## Global Constraints

- Persist `displayName` / `avatarUrl` in DB (fill-when-empty on OAuth); not cold-start session restore
- Age: store `birthYear`; display `currentYear - birthYear`
- Avatar: GitHub default + R2 upload → PATCH `avatarUrl`
- `realName` never appears in public mood/comment DTOs
- Mock: ~50 students, ~500 moods
- Dashboard at `/dashboard`; `/statistics` and `/trending` redirect there
- Post-login default and authenticated logo → `/dashboard`; Home removed from navbar; `/` URL-only; authenticated `/` → dashboard
- Soft Amber Glow UI tokens; Conventional Commits; update `docs/api.md` when API changes

## File map

| File | Role |
|------|------|
| `backend/src/domain/entities/User.ts` | New profile fields on `User` / update input |
| `backend/src/infrastructure/database/models/User.ts` | Schema fields |
| `backend/src/domain/ports/IUserRepository.ts` | `updateProfile` |
| `backend/src/infrastructure/database/repositories/MongooseUserRepository.ts` | Implement update + map fields |
| `backend/src/application/services/AuthService.ts` | OAuth fill, `updateProfile`, extend `UserProfile` |
| `backend/src/application/mappers/authMapper.ts` | DTO fields |
| `backend/src/validators/authSchemas.ts` | `updateProfileSchema` |
| `backend/src/controllers/authController.ts` | `updateMe` |
| `backend/src/routes/authRoutes.ts` | `PATCH /me` |
| `backend/tests/...` | Auth profile tests |
| `frontend/src/services/authService.ts` | Types + `updateMe` |
| `frontend/src/contexts/*` | Single provider; profile from `/me` |
| `frontend/src/app/providers.tsx` | Mount `AuthProvider` once |
| `frontend/src/app/routes/*.tsx` | Remove nested `AuthProvider`s |
| `frontend/src/pages/SettingsPage.tsx` | Editable profile form |
| `frontend/src/lib/age.ts` | `ageFromBirthYear` helper |
| `frontend/src/pages/DashboardPage.tsx` | New dashboard |
| `frontend/src/features/statistics/components/WeekdayActivityChart.tsx` | New chart |
| `frontend/src/components/AppNavbar.tsx` / `PublicNavbar.tsx` | Nav items + logo |
| `frontend/src/constants/routes.ts` / `router.tsx` | dashboard + redirects |
| `frontend/src/pages/LandingPage.tsx` or layout | Auth redirect from `/` |
| `backend/scripts/seed-mock-data.ts` | Volume bump |
| `docs/api.md` | Document PATCH `/auth/me`, dashboard |

---

### Task 1: Backend User profile fields + repository

**Files:**
- Modify: `backend/src/domain/entities/User.ts`
- Modify: `backend/src/infrastructure/database/models/User.ts`
- Modify: `backend/src/domain/ports/IUserRepository.ts`
- Modify: `backend/src/infrastructure/database/repositories/MongooseUserRepository.ts`
- Test: `backend/tests/unit/userProfileFields.test.ts` (or extend existing user repo/auth unit test)

**Interfaces:**
- Produces: `User` includes `displayName`, `realName`, `birthYear`, `avatarUrl` (all nullable)
- Produces: `users.updateProfile(id, patch): Promise<User | null>`

- [ ] **Step 1: Write failing unit test for age helper + profile patch shape**

Create `backend/src/utils/ageFromBirthYear.ts` and `backend/tests/unit/ageFromBirthYear.test.ts`:

```ts
export function ageFromBirthYear(birthYear: number, now = new Date()): number {
  return now.getUTCFullYear() - birthYear;
}
```

```ts
import { describe, expect, it } from "vitest";
import { ageFromBirthYear } from "../../src/utils/ageFromBirthYear.js";

describe("ageFromBirthYear", () => {
  it("computes age from birth year", () => {
    expect(ageFromBirthYear(2004, new Date("2026-07-18T00:00:00Z"))).toBe(22);
  });
});
```

(Frontend can duplicate a tiny helper or import from shared later — for now duplicate `frontend/src/lib/age.ts` with same logic in Task 3.)

- [ ] **Step 2: Run test**

`cd backend && npm test -- tests/unit/ageFromBirthYear.test.ts`  
Expected: FAIL until util exists, then PASS after Step 3.

- [ ] **Step 3: Extend User entity + mongoose schema**

Add to `User` interface and schema (all optional/null defaults):

```ts
displayName: string | null;
realName: string | null;
birthYear: number | null;
avatarUrl: string | null;
```

Schema:

```ts
displayName: { type: String, trim: true, default: null },
realName: { type: String, trim: true, default: null },
birthYear: { type: Number, min: 1950, max: 2100, default: null },
avatarUrl: { type: String, trim: true, default: null },
```

Map these in `MongooseUserRepository` document→entity mapper (same pattern as `email`).

- [ ] **Step 4: Add `updateProfile` to port + mongoose repo**

```ts
export interface UpdateUserProfileInput {
  displayName?: string | null;
  realName?: string | null;
  birthYear?: number | null;
  avatarUrl?: string | null;
  facultyId?: string | null;
  majorId?: string | null;
}

// IUserRepository
updateProfile(id: string, input: UpdateUserProfileInput): Promise<User | null>;
```

Implement with `$set` only provided keys; return updated user.

- [ ] **Step 5: Commit**

```bash
git add backend/src/domain backend/src/infrastructure/database backend/src/utils/ageFromBirthYear.ts backend/tests/unit/ageFromBirthYear.test.ts
git commit -m "feat(auth): add user profile fields and updateProfile repository"
```

---

### Task 2: AuthService OAuth fill + GET/PATCH `/auth/me`

**Files:**
- Modify: `backend/src/application/services/AuthService.ts`
- Modify: `backend/src/application/mappers/authMapper.ts`
- Modify: `backend/src/validators/authSchemas.ts`
- Modify: `backend/src/controllers/authController.ts`
- Modify: `backend/src/routes/authRoutes.ts`
- Modify: `backend/src/controllers/oauthController.ts` (default returnUrl `/dashboard`)
- Test: `backend/tests/integration/auth.test.ts` (extend) or new profile update test

**Interfaces:**
- Consumes: `users.updateProfile`
- Produces: `AuthService.updateProfile(userId, input)`, extended `UserProfile` / DTOs
- Route: `PATCH /api/v1/auth/me`

- [ ] **Step 1: Extend `UserProfile` + mappers**

Include `displayName`, `realName`, `birthYear`, `avatarUrl` on `UserProfile`, `toAuthUserDto`, `toUserProfileDto`.

- [ ] **Step 2: OAuth fill-when-empty in `loginWithOAuthProfile`**

After loading/creating user, before `issueSession`:

```ts
const patch: UpdateUserProfileInput = {};
if (!user.displayName && input.displayName) patch.displayName = input.displayName.trim();
if (!user.avatarUrl && input.avatarUrl) patch.avatarUrl = input.avatarUrl.trim();
if (Object.keys(patch).length > 0) {
  user = (await this.users.updateProfile(user.id, patch)) ?? user;
}
```

- [ ] **Step 3: Add `updateProfileSchema` + `AuthService.updateProfile`**

Zod (strict):

```ts
export const updateProfileSchema = z
  .object({
    displayName: z.string().trim().min(1).max(80).nullable().optional(),
    realName: z.string().trim().min(1).max(80).nullable().optional(),
    birthYear: z.number().int().min(1950).max(new Date().getUTCFullYear()).nullable().optional(),
    avatarUrl: z.string().url().max(2048).nullable().optional(),
    facultyId: z.string().optional().nullable(),
    majorId: z.string().optional().nullable(),
  })
  .strict();
```

Service: validate affiliation via existing `validateAffiliation`, then `users.updateProfile`, return `buildProfile`.

- [ ] **Step 4: Wire controller + route**

```ts
router.patch("/me", authenticate, validate(updateProfileSchema), authController.updateMe);
```

- [ ] **Step 5: Change OAuth default returnUrl** from `/feed` to `/dashboard` in `oauthController.readVerifiedReturnUrl` fallback and `frontend` OAuth defaults (Task 4 also covers frontend).

- [ ] **Step 6: Integration test** — login/register user, PATCH profile, GET me returns fields; OAuth unit/integration if present asserting fill-when-empty.

- [ ] **Step 7: Commit**

```bash
git commit -m "feat(auth): persist OAuth profile and add PATCH /auth/me"
```

---

### Task 3: Frontend auth types, single AuthProvider, Settings form

**Files:**
- Modify: `frontend/src/services/authService.ts`
- Modify: `frontend/src/contexts/auth-context.ts`, `AuthContext.tsx`
- Modify: `frontend/src/app/providers.tsx`
- Modify: `frontend/src/app/routes/authRoutes.tsx`, `studentRoutes.tsx`, `studentPrivateRoutes.tsx`, `adminRoutes.tsx` — remove inner `AuthProvider`
- Create: `frontend/src/lib/age.ts`
- Modify: `frontend/src/pages/SettingsPage.tsx`
- Modify: locales `en`/`th` `translation.json` for new settings strings
- Reuse: existing image upload service/hooks from CreateMoodForm pattern

**Interfaces:**
- `UserProfile` includes new fields; `updateMe(input)` calls `PATCH /auth/me`
- `profileMeta` derived from `user.displayName` / `user.avatarUrl` (deprecate hash-only as source of truth; OAuth callback may still set temporarily then refresh `/me`)

- [ ] **Step 1: Types + `updateMe` + age helper**

```ts
// authService UserProfile additions
displayName: string | null;
realName: string | null;
birthYear: number | null;
avatarUrl: string | null;

export async function updateMe(input: {
  displayName?: string | null;
  realName?: string | null;
  birthYear?: number | null;
  avatarUrl?: string | null;
  facultyId?: string | null;
  majorId?: string | null;
}): Promise<UserProfile> {
  const response = await apiClient.patch<{ success: true; data: UserProfile }>("/auth/me", input);
  return response.data.data;
}
```

- [ ] **Step 2: Lift AuthProvider**

`providers.tsx`:

```tsx
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider } from "../contexts/ThemeContext";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
```

Remove `<AuthProvider>` wrappers from route shell components (keep `RequireAuth` / layouts).

After OAuth callback: call `refreshProfile()` so DB values load; stop relying solely on hash `profileMeta`.

- [ ] **Step 3: Settings editable form**

- Fields: realName, displayName, birthYear (number input) + show `ageFromBirthYear`, faculty/major selects (reuse patterns from RegisterForm / CreateMoodForm), avatar file input → existing image upload → `updateMe({ avatarUrl })`
- Save button → `updateMe` → `refreshProfile`
- Privacy note i18n key
- Email remains read-only

- [ ] **Step 4: Manual/verify** — `npm test` frontend; typecheck

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(settings): editable profile with persisted avatar and names"
```

---

### Task 4: Navbar + routing (Home out, Dashboard in)

**Files:**
- Modify: `frontend/src/constants/routes.ts` — add `dashboard: "/dashboard"`
- Modify: `frontend/src/components/AppNavbar.tsx`, `PublicNavbar.tsx`
- Modify: `frontend/src/app/router.tsx` — dashboard route; redirects for statistics/trending; landing guard
- Modify: `LoginForm`, `RegisterForm`, `oauth.ts`, `AuthContext.loginWithOAuth` defaults → `ROUTES.dashboard`
- Modify: `LandingPage` or `PublicLayout` — if authenticated, `<Navigate to={ROUTES.dashboard} replace />`
- Modify: i18n `nav.dashboard`

**Nav items (AppNavbar authenticated):** Feed, Dashboard, Search, Saved, Inbox, How to use, Admin(adminOnly).  
**Remove:** Home, Statistics, Trending.

Logo: `to={isAuthenticated ? ROUTES.dashboard : ROUTES.home}`

PublicNavbar: remove Home; keep Feed/How to use; Statistics → Dashboard only if public access desired — **Dashboard requires auth** per current Statistics; for logged-out public nav use Feed + How to use + Login/Join (drop Statistics or link Login). Spec: remove Home; Statistics/Trending gone. Public: Feed, How to use (and Login/Join).

- [ ] **Step 1: Routes + redirects**

```tsx
{ path: ROUTES.statistics, loader: () => redirect(ROUTES.dashboard) }, // or element Navigate
{ path: ROUTES.trending, element: <Navigate to={ROUTES.dashboard} replace /> },
```

Add dashboard under `studentPrivateRoutes`.

- [ ] **Step 2: Navbar + logo + post-login defaults**

- [ ] **Step 3: Authenticated landing redirect**

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(nav): route authenticated users to dashboard and fix nav items"
```

---

### Task 5: Dashboard page + richer charts

**Files:**
- Create: `frontend/src/pages/DashboardPage.tsx`
- Create: `frontend/src/features/statistics/components/WeekdayActivityChart.tsx`
- Modify: `frontend/src/pages/TrendingPage.tsx` / `StatisticsPage.tsx` — optional thin re-exports redirecting, or delete usage and leave redirects only
- Reuse: `fetchStatisticsDashboard`, trending fetch from `TrendingPage`, `ScopeSelector`, `DistributionChart`, `TimeSeriesChart`, `TrendingEmotionChip`

**Weekday chart:** Aggregate `data.timeSeries` (or activity points) client-side into Mon–Sun counts; render simple bar chart with Recharts.

Compose page:

1. Title + description (i18n `dashboard.*`)
2. Scope + period
3. KPI row
4. Distribution + Time series
5. WeekdayActivityChart
6. Trending emotions section (same query as TrendingPage)

- [ ] **Step 1: Implement WeekdayActivityChart + unit test for aggregation helper**

```ts
export function aggregateByWeekday(points: { date: string; count: number }[]): number[] {
  const buckets = [0, 0, 0, 0, 0, 0, 0]; // Sun..Sat or Mon..Sun — document choice (use Mon=0..Sun=6)
  for (const p of points) {
    const day = new Date(p.date).getUTCDay();
    buckets[day] += p.count;
  }
  return buckets;
}
```

- [ ] **Step 2: DashboardPage wiring**

- [ ] **Step 3: Visual polish** — amber theme classes, ambient subtle header optional

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(dashboard): unify statistics and trending with weekday chart"
```

---

### Task 6: Expand mock seed + promote admin + docs

**Files:**
- Modify: `backend/scripts/seed-mock-data.ts` — `MOCK_STUDENT_COUNT = 50`, `TARGET_MOOD_COUNT = 500`; bump `MOCK_MARKER` to `mock-data-v2` if script deletes-by-marker so re-seed replaces cleanly
- Run: `npm run promote:github-admin -- chsny1pd` (document in commit message if DB not available in CI — script must exist and succeed when `MONGODB_URI` set)
- Modify: `docs/api.md` — PATCH `/auth/me`, profile fields on GET `/me`
- Modify: `DESIGN.md` nav if it lists Statistics/Trending as primary nav

- [ ] **Step 1: Update seed constants + marker; run seed locally if Mongo available**

- [ ] **Step 2: Promote `chsny1pd`**

```bash
cd backend && npm run promote:github-admin -- chsny1pd
```

- [ ] **Step 3: Docs sync**

- [ ] **Step 4: Full verification**

```bash
cd backend && npm test
cd frontend && npm test && npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git commit -m "chore: expand mock seed, promote github admin, update API docs"
```

---

## Spec coverage

| Spec item | Task |
|-----------|------|
| DB profile fields + OAuth fill | 1–2 |
| PATCH/GET `/auth/me` | 2 |
| Settings edit + avatar upload | 3 |
| Single AuthProvider / navbar flicker | 3–4 |
| Home out / logo / login → dashboard | 4 |
| `/dashboard` + redirects | 4–5 |
| Richer viz | 5 |
| Mock ~50/500 | 6 |
| Admin `chsny1pd` | 6 |
| Anonymity (no realName on public) | 2 mappers + verify no mood mapper includes new fields |
| docs/api.md | 6 |

## Self-review

- No TBD blockers; OAuth returnUrl and frontend defaults both pointed at dashboard
- `updateProfile` signature consistent across tasks
- Nested AuthProvider removal is explicit to fix navbar disappearance
