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

## Sprint 7 — Performance & Security Hardening (next)
