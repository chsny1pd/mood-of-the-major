# Mood of the Major — Task Tracker

> **Context:** Classroom / academic project. Staging environment and enterprise ops items are **not required**.  
> **Production sign-off:** See [`docs/production-checklist-audit.md`](docs/production-checklist-audit.md).

---

# Sprint 1 — Project Foundation

- [x] Backend scaffold (Clean Architecture folders, Express, health endpoints)
- [x] Frontend scaffold (Vite + React 19 + Tailwind, landing page)
- [x] ESLint + Prettier (frontend and backend)
- [x] GitHub Actions `ci.yml`
- [x] MongoDB connection + Mongoose models for reference data
- [x] Seed script (faculties, majors, emotion tags)
- [x] MongoDB Atlas + Cloudflare R2 (production — shared for dev/demo)
- [x] Railway project (root: `backend/`)
- [x] Vercel project (root: `frontend/`)
- [~] Branch protection on `main` — waived (classroom solo project)

## Sprint 2 — Authentication

- [x] AuthService, JwtTokenService, BcryptPasswordHasher, MongooseUserRepository
- [x] Auth routes: register, login, logout, refresh, me
- [x] `authenticate` and `authorize` middleware
- [x] Frontend: `features/auth/`, LoginPage, RegisterPage, AuthLayout, AuthContext
- [x] Token storage: access in sessionStorage; refresh HttpOnly cookie
- [x] Unit/integration tests for auth baseline
- [x] Cross-origin auth verified on production (Vercel + Railway)

## Sprint 3 — Mood Posting

- [x] MoodService, ImageService, MoodMapper, mood and image repositories
- [x] Mood routes: create, feeds (global/faculty/major), detail, delete (owner)
- [x] Image routes: presign upload, confirm, signed URL, delete unlinked
- [x] R2ImageStorage adapter implementing IImageStorage
- [x] Frontend: feed, mood create, faculty/major feed pages
- [x] Shared components: MoodCard, EmotionBadge, Skeleton, EmptyState
- [x] Production deploy verified (Vercel + Railway)
- [x] Manual QA: image flow (local + production)

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
- [x] Manual QA (local): comments, reactions, bookmarks, search

## Sprint 5 — Statistics Dashboard

- [x] Backend: StatisticsService, TrendingService, statistics repositories
- [x] Backend: `GET /statistics/dashboard`, `GET /moods/trending`
- [x] Backend: AggregationThresholdPolicy; daily aggregation job endpoint
- [x] Frontend: `features/statistics/` — DistributionChart, TimeSeriesChart, ScopeSelector
- [x] Frontend: StatisticsPage, TrendingPage; ChartContainer threshold empty states
- [x] Tests: threshold boundary unit test (4 vs 5 records); StatisticsService threshold tests; statistics route integration tests
- [x] Ops scripts: `seed:sample-moods`, `aggregate:statistics`, `qa:statistics`
- [x] Resolved OD-009 (students may access statistics), OD-010 (threshold 5), OD-011 (distinct advisor role)
- [x] Manual QA: `npm run qa:statistics`

## Sprint 6 — Admin Dashboard

- [x] Backend: AdminService, NotificationService; extended Report/User/Mood/Tag repositories
- [x] Backend: Admin routes — dashboard, reports, users, moods moderation, audit logs, tags
- [x] Backend: AuditLog + Notification models/repos; append-only audit on moderation
- [x] Backend: Notifications API — list, mark read, read-all, delete
- [x] Frontend: AdminLayout, RequireAdmin, `/admin/*` pages (overview, reports, users, audit)
- [x] Frontend: NotificationsPage; admin link in header for administrators
- [x] Ops: `npm run promote:admin -- <email>`
- [x] Tests: admin + notification auth guard integration tests
- [x] Manual QA (local): report resolve, user suspend, audit log

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
- [~] k6 staging load test — waived (no staging env; classroom)
- [~] Sentry DSN on Railway/Vercel — optional, not configured
- [~] Uptime secrets — waived (classroom)
- [~] Formal pentest — waived (classroom)

## Sprint 8 — Testing & Bug Fixes (complete)

- [x] Public DTO anonymity contract tests (`backend/tests/unit/anonymityContract.test.ts`)
- [x] API error envelope contract tests (`backend/tests/integration/apiContract.test.ts`)
- [x] Frontend unit tests: MoodCard anonymity, apiClient error mapping, RequireAuth guard
- [x] Accessibility baseline: jest-axe on LandingPage; eslint-plugin-jsx-a11y in CI
- [x] Playwright E2E suite: smoke + student journey (`e2e/tests/`)
- [x] E2E + Lighthouse jobs in GitHub Actions CI
- [x] Backend integration tests with MongoDB service container (`authFlow`, `moodFlow`, `imageFlow`, `reportAdminFlow`)
- [x] Playwright admin report flow E2E (`e2e/tests/admin-report.spec.ts`)
- [x] Playwright image upload E2E (`e2e/tests/image-upload.spec.ts`)
- [x] Manual QA checklist (`docs/testing-strategy.md`) — completed on **local** (staging waived)
- [~] Defect backlog triage — N/A (no open P0/P1 for classroom demo)
- [~] Rollback procedure tested — waived (classroom)

## Sprint 9 — Production Release (complete)

- [x] Post-deploy smoke test script (`backend/scripts/smoke-test.ts`)
- [x] Production deploy workflow template (`.github/workflows/deploy-production.yml`)
- [x] Rollback runbook (`docs/ops/rollback-runbook.md`)
- [x] Production MongoDB Atlas with backups
- [x] Production R2 bucket (private, CORS for Vercel prod)
- [x] Railway + Vercel production secrets (`NODE_ENV`, JWT, CORS, `VITE_API_BASE_URL`)
- [~] `PRODUCTION_API_BASE_URL` GitHub secret — optional (smoke run manually)
- [x] Post-deploy smoke executed on production
- [x] **Production live** (classroom demo — default platform URLs)
