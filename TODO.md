# Sprint 1 — Project Foundation

- [x] Backend scaffold (Clean Architecture folders, Express, health endpoints)
- [x] Frontend scaffold (Vite + React 19 + Tailwind, landing page)
- [x] ESLint + Prettier (frontend and backend)
- [x] GitHub Actions `ci.yml`
- [x] MongoDB connection + Mongoose models for reference data
- [x] Seed script (faculties, majors, emotion tags)
- [ ] Provision MongoDB Atlas dev cluster (`ASM-003`)
- [ ] Provision Cloudflare R2 dev bucket
- [ ] Provision Railway project (root: `backend/`)
- [ ] Provision Vercel project (root: `frontend/`)
- [ ] Enable branch protection on `main` (require PR + passing CI)

## Sprint 2 — Authentication

- [x] AuthService, JwtTokenService, BcryptPasswordHasher, MongooseUserRepository
- [x] Auth routes: register, login, logout, refresh, me
- [x] `authenticate` and `authorize` middleware
- [x] Frontend: `features/auth/`, LoginPage, RegisterPage, AuthLayout, AuthContext
- [x] Token storage: access in sessionStorage; refresh HttpOnly cookie
- [x] Unit/integration tests for auth baseline
- [ ] Auth E2E on staging with cross-origin cookie config

## Sprint 3 — Mood Posting

- [x] MoodService, ImageService, MoodMapper, mood and image repositories
- [x] Mood routes: create, feeds (global/faculty/major), detail, delete (owner)
- [x] Image routes: presign upload, confirm, signed URL, delete unlinked
- [x] R2ImageStorage adapter implementing IImageStorage
- [x] Frontend: feed, mood create, faculty/major feed pages
- [x] Shared components: MoodCard, EmotionBadge, Skeleton, EmptyState
- [x] Production deploy verified (Vercel + Railway)
- [ ] Manual QA: full image flow on staging

## Sprint 4 — Comments, Reactions & Bookmarks

- [x] Backend: CommentService, ReactionService, BookmarkService, ReportService, mood search
- [x] Backend: API routes for comments, reactions, bookmarks, search, reports
- [x] Backend: Mongoose models/repos for comments, reactions, bookmarks, reports
- [x] Backend: comment rate limiter; denormalized reactionSummary / commentCount updates
- [x] Frontend: comments, reactions, bookmarks, search, report UI
- [x] Frontend: FilterPanel, search filters/pagination, MoodCard bookmark toggle
- [x] Frontend: comment reply/delete/report UI; bookmarks pagination
- [x] Frontend: BookmarksPage, SearchPage; MoodDetail engagement section
- [x] Tests: commentMapper anonymity; AggregationThresholdPolicy unit test
- [x] Integration tests: engagement auth guards
- [ ] Manual QA on staging (comments, reactions, bookmarks, search)

## Sprint 5 — Statistics Dashboard

- [x] Backend: StatisticsService, TrendingService, statistics repositories
- [x] Backend: `GET /statistics/dashboard`, `GET /moods/trending`
- [x] Backend: AggregationThresholdPolicy; daily aggregation job endpoint
- [x] Frontend: `features/statistics/` — DistributionChart, TimeSeriesChart, ScopeSelector
- [x] Frontend: StatisticsPage, TrendingPage; ChartContainer threshold empty states
- [x] Tests: threshold boundary unit test (4 vs 5 records); StatisticsService threshold tests; statistics route integration tests
- [x] Ops scripts: `seed:sample-moods`, `aggregate:statistics`, `qa:statistics`
- [x] Resolved OD-009 (students may access statistics), OD-010 (threshold 5), OD-011 (distinct advisor role)
- [x] Manual QA: `npm run qa:statistics` verifies aggregation + dashboard output locally/staging

## Sprint 6 — Admin Dashboard

- [x] Backend: AdminService, NotificationService; extended Report/User/Mood/Tag repositories
- [x] Backend: Admin routes — dashboard, reports, users, moods moderation, audit logs, tags
- [x] Backend: AuditLog + Notification models/repos; append-only audit on moderation
- [x] Backend: Notifications API — list, mark read, read-all, delete
- [x] Frontend: AdminLayout, RequireAdmin, `/admin/*` pages (overview, reports, users, audit)
- [x] Frontend: NotificationsPage; admin link in header for administrators
- [x] Ops: `npm run promote:admin -- <email>`
- [x] Tests: admin + notification auth guard integration tests
- [ ] Manual QA on staging (report resolve, user suspend, audit log entries)

## Sprint 7 — Performance & Security Hardening (complete)

- [x] Helmet configured per `security.md` (CSP off for JSON API, CORP cross-origin, HSTS in production)
- [x] Rate limiters: auth, write (user-keyed), feed, general API; env overrides; `requestId` in 429 responses
- [x] Structured JSON logging in staging/production; `userId` in request finish logs when authenticated
- [x] MongoDB index sync on startup for all collections
- [x] Orphan/deleted image cleanup job — `POST /api/v1/internal/jobs/cleanup-images`; CLI `npm run cleanup:images`
- [x] Frontend security headers via `frontend/vercel.json` (CSP, HSTS, Permissions-Policy)
- [x] k6 load test scripts + runbook (`docs/load-testing.md`)
- [x] Sentry integration (optional — `SENTRY_DSN` / `VITE_SENTRY_DSN`)
- [x] Lighthouse CI config + GitHub Actions job (`frontend/lighthouserc.cjs`)
- [x] Uptime monitoring runbook + scheduled workflow (`.github/workflows/uptime-check.yml`)
- [x] Sprint 7 sign-off doc (`docs/sprint-7-signoff.md`)
- [ ] Staging load test report archived (ops — run k6 against staging)
- [ ] Sentry DSN configured on Railway/Vercel (ops)
- [ ] External uptime secrets set (`STAGING_API_URL`, `STAGING_FRONTEND_URL`)
- [ ] Formal security audit / pentest (pre–Sprint 9)

## Sprint 8 — Testing & Bug Fixes (in progress)

- [x] Public DTO anonymity contract tests (`backend/tests/unit/anonymityContract.test.ts`)
- [x] API error envelope contract tests (`backend/tests/integration/apiContract.test.ts`)
- [x] Frontend unit tests: MoodCard anonymity, apiClient error mapping, RequireAuth guard
- [x] Accessibility baseline: jest-axe on LandingPage; eslint-plugin-jsx-a11y in CI
- [x] Playwright E2E suite: smoke + student journey (`e2e/tests/`)
- [x] E2E + Lighthouse jobs in GitHub Actions CI
- [ ] Backend integration tests with MongoDB service container (expand beyond auth guards)
- [ ] Playwright admin report flow E2E
- [ ] Playwright image upload E2E
- [ ] Manual QA checklist on staging (`docs/testing-strategy.md`) — all items checked
- [ ] Defect backlog triaged; P0/P1 closed
- [ ] Rollback procedure tested on staging
