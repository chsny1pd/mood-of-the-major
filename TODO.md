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

## Sprint 4 — Comments, Reactions & Bookmarks (in progress)

- [x] Backend: CommentService, ReactionService, BookmarkService, ReportService, mood search
- [x] Backend: API routes for comments, reactions, bookmarks, search, reports
- [x] Backend: Mongoose models/repos for comments, reactions, bookmarks, reports
- [x] Backend: comment rate limiter; denormalized reactionSummary / commentCount updates
- [x] Frontend: comments, reactions, bookmarks, search, report UI
- [x] Frontend: BookmarksPage, SearchPage; MoodDetail engagement section
- [x] Tests: commentMapper anonymity unit test
- [x] Integration tests: engagement auth guards
- [ ] Manual QA on staging (comments, reactions, bookmarks, search)
