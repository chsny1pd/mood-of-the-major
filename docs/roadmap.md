# Mood of the Major — Product Roadmap

> **Document type:** Phased delivery plan and milestone specification  
> **Status:** Draft v1.0  
> **Authority:** Derives from [`README.md`](../README.md), [`SPECS.md`](../SPECS.md), [`backend.md`](./backend.md), [`frontend.md`](./frontend.md), [`deployment.md`](./deployment.md), and [`testing-strategy.md`](./testing-strategy.md). Where conflict exists, `README.md` takes precedence.

---

## Table of Contents

1. [Vision](#vision)
2. [Project Milestones](#project-milestones)
3. [Future Versions](#future-versions)
4. [Document Maintenance](#document-maintenance)

---

## Vision

**Mood of the Major** is a production-ready, anonymous social platform for university students to share emotions, experiences, and daily thoughts — and to visualize the emotional atmosphere across faculties and majors.

The long-term vision is to give every student a **trusted space for honest expression** without fear of social judgment, while helping the broader campus community **understand collective emotional health** through aggregated statistics — never at the cost of individual privacy.

### Strategic Goals

| Goal | Roadmap outcome |
|------|-----------------|
| **Safe anonymous expression** | Identity is managed for authentication and moderation only; public-facing content never exposes who wrote it. |
| **Community emotional awareness** | Mood, faculty, and major feeds surface anonymous posts; trending emotions highlight rising themes within academic communities. |
| **Data-informed well-being** | Statistics dashboards give students, advisors, and administrators aggregated insight into mood trends over time, with minimum aggregation thresholds to prevent de-anonymization. |
| **Production-grade engineering** | Clean Architecture, typed contracts, CI/CD, and a test strategy that prioritizes anonymity, auth, and data integrity. |
| **Scalable infrastructure** | Stateless API on Railway, SPA on Vercel, MongoDB Atlas for persistence, Cloudflare R2 for private image storage — each scaling independently. |

### Target Users

| User | v1.0 value |
|------|------------|
| **University students** | Post anonymously, browse feeds, react, comment, bookmark, search, and explore emotional trends within their faculty or major. |
| **Faculty advisors / student affairs** | Review aggregated statistics dashboards scoped by faculty or major — no individual identity exposure. |
| **Platform administrators** | Moderate content, manage reports, oversee users, and audit administrative actions. |

### Architectural North Star

All delivery phases must uphold the principles defined across project documentation:

- **Clean Architecture** — business rules in domain and application layers; Express and Mongoose are replaceable details.
- **Anonymity by design** — enforced in API mappers and repository projections, not merely hidden in the UI.
- **Security by default** — JWT authentication, RBAC, input validation, rate limiting, and private media storage from day one of implementation.
- **Documentation before code** — specifications, API contracts, and architecture decisions precede feature implementation.
- **Incremental delivery** — small, verifiable increments aligned with the sprints below.

### Success Criteria for v1.0

Version 1.0 is complete when:

1. All P0 requirements in `SPECS.md` pass acceptance testing on staging.
2. Production deployment is live on Vercel, Railway, MongoDB Atlas, and Cloudflare R2.
3. Performance targets are met under staging load tests (feed p95 ≤ 500 ms, statistics p95 ≤ 2 s).
4. Security audit findings are resolved and the production checklist in `deployment.md` is complete.
5. Critical user journeys pass automated E2E tests and manual QA on staging.

---

## Project Milestones

Delivery is organized into **ten sprints** (Sprint 0 through Sprint 9). Each sprint produces verifiable deliverables and has an explicit Definition of Done. Sprints are sequential unless noted; some documentation work in Sprint 0 runs in parallel with early foundation tasks.

### Sprint Overview

| Sprint | Name | Primary focus |
|--------|------|---------------|
| 0 | Documentation & Engineering Standards | Authoritative specs, conventions, AI guardrails |
| 1 | Project Foundation | Monorepo scaffold, CI/CD, environments, core architecture |
| 2 | Authentication & User Management | Register, login, JWT, RBAC, session management |
| 3 | Mood Posting & Cloudflare R2 | Anonymous posts, feeds, image upload via presigned URLs |
| 4 | Comments, Reactions & Bookmarks | Engagement features, search, filtering, pagination |
| 5 | Statistics Dashboard | Aggregated metrics, trending emotions, threshold enforcement |
| 6 | Admin Dashboard | Moderation, reports, user management, audit trail |
| 7 | Performance & Security Hardening | Load testing, security audit, monitoring, optimization |
| 8 | Testing & Bug Fixes | Full regression, E2E suite, accessibility baseline, defect resolution |
| 9 | Production Release (v1.0) | Launch, smoke tests, operational handoff |

---

### Sprint 0 — Documentation & Engineering Standards

Establish the documentation foundation and engineering conventions required before application code is written.

#### Goals

- Complete the authoritative documentation set that defines what the system must do and how it must be built.
- Resolve blocking open decisions needed for Sprint 1 implementation gates.
- Configure AI-assisted development guardrails for consistent code generation.

#### Features

| Area | Scope |
|------|-------|
| **Core documentation** | `README.md`, `SPECS.md`, `DESIGN.md`, `docs/requirements.md`, and technical docs in `docs/` |
| **Architecture decisions** | Clean Architecture layers, deployment topology, data flows |
| **API & data design** | `docs/api.md`, `docs/database.md` — contracts before endpoints |
| **Security & auth specs** | `docs/security.md`, `docs/authentication.md`, `docs/cloudflare-r2.md` |
| **Engineering standards** | `.cursor/rules/` for architecture, backend, frontend, security, API, UI |
| **Testing strategy** | `docs/testing-strategy.md` — pyramid, priorities, CI gates |
| **Deployment guide** | `docs/deployment.md` — environments, secrets, CI/CD design |

#### Deliverables

- [ ] Complete documentation hierarchy per `README.md` Project Folder Overview
- [ ] Functional requirements traceable to `SPECS.md` (`FR-*`, `NFR-*`, `BR-*`)
- [ ] API endpoint catalog and error code registry in `docs/api.md`
- [ ] Database collection catalog, indexes, and conventions in `docs/database.md`
- [ ] Authentication flows documented (JWT expiry, refresh strategy, route protection)
- [ ] R2 upload/download workflows documented with limits and TTLs
- [ ] `.cursor/rules/` rule files for all layers
- [ ] This roadmap (`docs/roadmap.md`) approved by stakeholders
- [ ] Open decisions log updated: Phase 1 blockers resolved in `docs/requirements.md` (`OD-001`, `OD-002`, `OD-003`, `OD-013`, `OD-014`)

#### Definition of Done

- All documents listed in README Document Hierarchy exist and cross-reference consistently.
- No contradiction between `SPECS.md` and `README.md`; conflicts resolved with README as authority.
- API contracts defined for Sprint 1–2 endpoints before any implementation begins.
- Engineering team can onboard using documentation alone — no tribal knowledge required.
- Stakeholders sign off on v1.0 scope and deferred items in `SPECS.md` §12 Out of Scope.

#### Risks

| Risk | Mitigation |
|------|------------|
| Documentation drift during implementation | Document maintenance tables in each doc; PRs must reference doc sections |
| Unresolved TBD decisions block Sprint 1 | Phase 1 ODs resolved in `docs/requirements.md`; remaining ODs gated to later sprints |
| Over-specification delays coding | Gate only Sprint 1 endpoints; defer Phase 3+ API detail to pre-sprint doc sprints |
| Scope creep in specs | Defer items explicitly to Future Versions section of this roadmap |

#### Dependencies

- Project vision and stack defined in `README.md`
- Access to university faculty/major reference data for seed planning (`ASM-002`)
- Stakeholder availability for scope review

---

### Sprint 1 — Project Foundation

Initialize the application codebase, development environments, and CI/CD pipeline. No user-facing features ship in this sprint.

#### Goals

- Scaffold `frontend/` and `backend/` with TypeScript, linting, and Clean Architecture folder structure.
- Establish development, staging, and production environment topology.
- Enable automated quality gates on every pull request.

#### Features

| Area | Scope |
|------|-------|
| **Backend scaffold** | Express app factory, middleware skeleton, DI wiring pattern, health endpoints |
| **Frontend scaffold** | Vite + React 19, Tailwind, router shell, provider composition |
| **Monorepo layout** | `frontend/`, `backend/`, `.github/workflows/` per `architecture.md` |
| **Environment config** | `.env.example` files; Zod env validation on backend startup |
| **CI pipeline** | Lint, type-check, test runner setup on PR (`INT-DEP-003`, `INT-DEP-005`) |
| **Cloud provisioning** | Atlas dev cluster, R2 dev bucket, Railway/Vercel project shells |
| **Reference data seed** | Faculties, majors, emotion tags — script or migration |

#### Deliverables

- [ ] `backend/` with Clean Architecture folder structure per `backend.md`
- [ ] `frontend/` with feature-based folder structure per `frontend.md`
- [ ] ESLint + Prettier configured for both packages (`NFR-MAINT-004`)
- [ ] GitHub Actions `ci.yml` — parallel frontend and backend jobs
- [ ] `GET /health` and `GET /ready` endpoints on backend
- [ ] MongoDB connection with Mongoose; dev database `mood_of_the_major_dev`
- [ ] Vercel project (root: `frontend`) and Railway project (root: `backend`) provisioned
- [ ] Branch protection on `main` — require PR and passing CI
- [ ] Seed script for faculties, majors, and mood category tags

#### Definition of Done

- `npm run build`, `npm run lint`, and `npm test` succeed locally and in CI for both packages.
- Backend fails fast on missing production secrets (`backend.md` Environment Configuration).
- Frontend loads at local dev URL with placeholder landing page.
- Staging environment topology documented and provisioned (optional deploy in this sprint or early Sprint 2).
- All Sprint 1 open decisions resolved — see `docs/requirements.md` (`OD-001`, `OD-002`, `OD-013`).

#### Risks

| Risk | Mitigation |
|------|------------|
| Platform account provisioning delays | Begin Cloudflare, Atlas, Railway, Vercel setup in parallel at sprint start |
| Over-engineering scaffold | Follow documented folder structures exactly; no speculative abstractions |
| CI flakiness | Minimal test suite initially; focus on lint and type-check reliability |
| Environment secret leakage | `.gitignore` for `.env`; `.env.example` key-only; review in PR checklist |

#### Dependencies

- Sprint 0 documentation complete (`docs/api.md`, `docs/database.md`, `docs/authentication.md`)
- GitHub repository with team access
- Cloud accounts provisioned (`ASM-003`)

---

### Sprint 2 — Authentication & User Management

Implement secure user registration, login, JWT session management, and role-based access control.

#### Goals

- Students can register and authenticate with industry-standard password security.
- All protected API routes enforce JWT validation before business logic.
- Frontend session management supports login, logout, and route guards.

#### Features

| Area | Scope |
|------|-------|
| **Registration** | Email/password with client and server validation (`FR-AUTH-001`, `FR-AUTH-007`) |
| **Login / logout** | JWT access token + refresh token strategy (`FR-AUTH-002`, `FR-AUTH-004`, `FR-AUTH-008`) |
| **Password security** | bcrypt hashing; generic login errors (`FR-AUTH-003`, `NFR-SEC-001`) |
| **RBAC** | Student and administrator roles minimum (`FR-AUTH-006`) |
| **Protected routes** | Middleware chain: authenticate → authorize (`FR-AUTH-005`, `BR-AUTH-003`) |
| **Rate limiting** | Auth endpoints throttled (`FR-AUTH-009`, `NFR-SEC-004`) |
| **Frontend auth** | Register/Login pages, AuthContext, Axios interceptors, route guards |
| **User profile** | `GET /auth/me` bootstrap; faculty/major affiliation on registration |

#### Deliverables

- [ ] `AuthService`, `JwtTokenService`, `BcryptPasswordHasher`, `MongooseUserRepository`
- [ ] Auth routes: register, login, logout, refresh, me
- [ ] `authenticate` and `authorize` middleware
- [ ] Frontend: `features/auth/`, LoginPage, RegisterPage, AuthLayout, AuthContext
- [ ] Token storage per `authentication.md` — access in memory/sessionStorage; refresh HttpOnly cookie
- [ ] Unit tests: `AuthService`, JWT middleware, password hashing
- [ ] Integration tests: auth flow, rate limits, protected route rejection

#### Definition of Done

- All Sprint 2 acceptance criteria from `SPECS.md` §11 Phase 1 auth subset pass on staging.
- Plain-text passwords never stored; bcrypt applied with configured cost factor.
- Missing, invalid, and expired JWTs return structured `401` errors — no silent bypass.
- Administrator role required for admin route stubs (even if admin UI not yet built).
- Frontend redirects unauthenticated users from protected routes with `returnUrl`.
- Auth integration tests pass in CI.

#### Risks

| Risk | Mitigation |
|------|------------|
| Refresh token strategy complexity | Follow `docs/authentication.md`; resolve `OD-003` in Sprint 0 |
| HttpOnly cookie CORS issues | Configure `withCredentials` and CORS early; test cross-origin in staging |
| Email domain restriction ambiguity | Resolve `OD-014`; implement as configurable `ALLOWED_EMAIL_DOMAINS` |
| Token storage XSS exposure | Follow `security.md` client storage guidance; no refresh in localStorage |

#### Dependencies

- Sprint 1 foundation (backend app, frontend app, CI, MongoDB connection)
- `docs/authentication.md` finalized
- User Mongoose model and `IUserRepository` per `docs/database.md`

---

### Sprint 3 — Mood Posting & Cloudflare R2

Deliver core anonymous posting, mood categories, feeds, and secure image upload via Cloudflare R2 presigned URLs.

#### Goals

- Authenticated students create anonymous mood posts with categories and faculty/major context.
- Global, faculty, and major feeds serve paginated anonymous content.
- Image attachments upload directly to R2 without transiting the application server.

#### Features

| Area | Scope |
|------|-------|
| **Anonymous posting** | Create mood with text, tags, faculty/major (`FR-POST-001`–`FR-POST-006`, `FR-CAT-001`) |
| **Anonymity enforcement** | Public DTOs strip identity (`FR-POST-002`, `BR-ANON-001`, `NFR-PRIV-001`) |
| **Mood feeds** | Global, faculty, major feeds with cursor pagination (`FR-FEED-001`–`FR-FEED-005`) |
| **Mood categories** | Predefined tags; selectable at creation (`FR-CAT-001`, `FR-CAT-002`) |
| **Image presign flow** | Request URL → client PUT to R2 → confirm (`FR-IMG-001`–`FR-IMG-007`) |
| **Signed download** | Time-limited image URLs for authorized viewers (`FR-IMG-005`) |
| **Rate limiting** | Post creation throttled (`FR-POST-010`) |
| **Frontend surfaces** | FeedPage, FacultyFeedPage, MajorFeedPage, CreateMoodPage, MoodDetailPage, UploadImage |

#### Deliverables

- [ ] `MoodService`, `ImageService`, `MoodMapper`, mood and image repositories
- [ ] Mood routes: create, feeds (global/faculty/major), detail, delete (owner)
- [ ] Image routes: presign upload, confirm, signed URL, delete unlinked
- [ ] `R2ImageStorage` adapter implementing `IImageStorage`
- [ ] R2 dev/staging buckets configured with private access and CORS
- [ ] Frontend: `features/feed/`, `features/mood/`, `features/upload/`, `features/faculty/`, `features/major/`
- [ ] Shared components: MoodCard, EmotionBadge, FilterPanel (basic), Skeleton, EmptyState
- [ ] Tests: anonymity DTO contract, presign validation, feed pagination, R2 orchestration mocks

#### Definition of Done

- Student creates text-only mood; appears in global feed without author identity in API or UI.
- Faculty and major feeds filter correctly; cursor pagination returns `nextCursor` meta.
- Full image flow works: presign → PUT to R2 → confirm → publish mood with images → display via signed URL.
- No image binary passes through Express; R2 bucket has no public read ACL.
- Presign rejects invalid MIME types and files over 5 MB.
- Post creation rate limit triggers `429` after threshold.
- Manual QA: create mood with 4 images on staging.

#### Risks

| Risk | Mitigation |
|------|------------|
| R2 CORS misconfiguration | Follow `cloudflare-r2.md`; test PUT from staging Vercel origin early |
| Orphaned uploads after failed publish | Pending `moodimages` status; scheduled cleanup job in Sprint 7 (`BR-IMG-004`); ops runbook until job ships |
| Anonymity leak via query projection | Public DTO contract tests; code review on all mappers |
| Feed performance at scale | Compound indexes on `(createdAt, _id)`; denormalized counts from Sprint 4 |

#### Dependencies

- Sprint 2 authentication (all write endpoints require JWT)
- Sprint 1 seed data (faculties, majors, tags)
- Cloudflare R2 bucket and credentials in Railway (`INT-R2-001`–`INT-R2-004`)
- Resolve `OD-005` pagination strategy (cursor), `OD-006` image limits

---

### Sprint 4 — Comments, Reactions & Bookmarks

Add engagement features, search, filtering, and bookmarking to complete the student interaction loop.

#### Goals

- Students engage anonymously with comments and reactions on mood posts.
- Students save posts for personal reference and discover content via search and filters.
- All list endpoints support consistent pagination and anonymity.

#### Features

| Area | Scope |
|------|-------|
| **Comments** | Anonymous comments on posts; validation and rate limits (`FR-CMT-001`–`FR-CMT-003`, `FR-CMT-007`) |
| **Reactions** | Upsert one reaction per user per post/comment (`FR-REACT-001`–`FR-REACT-004`) |
| **Bookmarks** | Save, list, remove bookmarks (`FR-BMK-001`–`FR-BMK-003`) |
| **Search & filter** | Text search, faculty/major/category/date filters (`FR-SRCH-001`–`FR-SRCH-008`) |
| **Pagination** | All list endpoints cursor-paginated (`FR-SRCH-006`) |
| **Post lifecycle** | Owner edit/delete within policy window (`FR-POST-007`, `FR-POST-008`) |
| **Report submission** | Flag inappropriate content (`FR-RPT-001`–`FR-RPT-002`) |
| **Frontend** | Comments, reactions, bookmarks, search features; ReportForm modal |

#### Deliverables

- [ ] `CommentService`, `ReactionService`, `BookmarkService`, `SearchService`, `ReportService`
- [ ] API routes for comments, reactions, bookmarks, search, reports
- [ ] Denormalized `commentCount` and `reactionSummary` on mood documents
- [ ] Frontend: `features/comments/`, `features/reactions/`, `features/bookmarks/`, `features/search/`
- [ ] Pages: BookmarksPage, SearchResultsPage; comment/reaction UI on MoodDetailPage
- [ ] Optimistic updates for reactions and bookmarks (`frontend.md`)
- [ ] Tests: reaction upsert uniqueness, comment anonymity, search filters, report cooldown

#### Definition of Done

- All Sprint 2 acceptance criteria from `SPECS.md` §11 Phase 2 pass on staging.
- Comments and reactions never expose actor identity in public responses.
- Each user has at most one reaction per target; changing reaction updates existing record.
- Search requires authentication; combined filters (faculty + category + date) work.
- Bookmarks list persists across sessions; toggle reflected on MoodCard.
- Report creates pending queue entry (admin resolution in Sprint 6).
- Rate limits enforced on comment creation.

#### Risks

| Risk | Mitigation |
|------|------------|
| Threaded vs flat comments undecided | Resolve `OD-004` early in sprint; default flat if delayed |
| Search performance without Atlas Search | MongoDB text index on `moods.content`; monitor query plans |
| Optimistic update rollback UX | TanStack Query rollback on mutation failure |
| Reaction denormalization race conditions | Atomic `$inc` and upsert in repository layer |

#### Dependencies

- Sprint 3 mood posting and feeds (comments/reactions target moods)
- Sprint 2 authentication
- Resolve `OD-004`, `OD-007`, `OD-012` (comment model, reaction types, edit window)

---

### Sprint 5 — Statistics Dashboard

Deliver aggregated analytics, trending emotions, and privacy-preserving threshold enforcement.

#### Goals

- Stakeholders view mood distributions and time-series trends scoped by faculty or major.
- Aggregated data never exposes individual identity; minimum group sizes enforced.
- Trending emotions surface rising themes from recent activity.

#### Features

| Area | Scope |
|------|-------|
| **Statistics dashboard** | Mood distribution, time-series, scoped metrics (`FR-STAT-001`–`FR-STAT-006`) |
| **Threshold enforcement** | Suppress data below `AGGREGATION_THRESHOLD_MIN` (`BR-STAT-001`, `NFR-PRIV-002`) |
| **Trending emotions** | Platform, faculty, major trending themes (`FR-TREND-001`–`FR-TREND-003`) |
| **Role access** | Advisor/administrator access; student access per policy (`FR-STAT-007`, `OD-009`) |
| **Background aggregation** | Daily statistics job writing to `dailystatistics`, `emotionstatistics` |
| **Frontend** | StatisticsPage, TrendingPage, charts, ScopeSelector, threshold empty states |

#### Deliverables

- [ ] `StatisticsService`, `TrendingService`, statistics repositories
- [ ] `GET /statistics/dashboard`, trending endpoints
- [ ] `AggregationThresholdPolicy` domain service
- [ ] Scheduled daily aggregation job (Railway cron or internal endpoint)
- [ ] Frontend: `features/statistics/` with DistributionChart, TimeSeriesChart, TrendingEmotionChip
- [ ] ChartContainer with "Insufficient data" state when `meetsThreshold: false`
- [ ] Tests: threshold boundary (4 vs 5 records), anonymous aggregation output, UTC date bucketing

#### Definition of Done

- Dashboard returns aggregated metrics within 2 s p95 on staging with seeded data.
- Groups below threshold return suppressed response — not partial identity-leaking counts.
- Trending page shows scoped themes without attributing individual posts.
- Daily aggregation job runs idempotently; documented schedule (01:00 UTC).
- Frontend statistics page handles loading, error, threshold, and data states.
- Resolve `OD-009`, `OD-010`, `OD-011` (student stats access, threshold value, advisor role).

#### Risks

| Risk | Mitigation |
|------|------------|
| Live aggregation too slow | Read pre-computed collections only (`backend.md` Performance) |
| Threshold UX confusion | Distinct empty state copy explaining anonymity protection |
| Job failure silent data staleness | Log job start/end; alert on failure; manual trigger endpoint |
| Chart library bundle size | Lazy-load chart library in statistics feature |

#### Dependencies

- Sprint 3–4 mood and engagement data (aggregation source)
- Sprint 2 authentication and role model
- `emotionstatistics` and `dailystatistics` collections per `docs/database.md`
- Resolve `OD-009`, `OD-010`, `OD-011`

---

### Sprint 6 — Admin Dashboard

Provide administrators with moderation tools, report resolution, user management, and audit accountability.

#### Goals

- Administrators review and action reported content through a dedicated dashboard.
- User accounts can be suspended or reinstated; platform policies enforced.
- All administrative actions produce immutable audit log entries.

#### Features

| Area | Scope |
|------|-------|
| **Admin dashboard** | Overview KPIs, report queue, moderation workspace (`FR-ADMIN-001`–`FR-ADMIN-005`) |
| **Report resolution** | Approve, dismiss, remove content (`FR-RPT-003`, `FR-RPT-006`) |
| **Content moderation** | Admin remove posts/comments with audit (`FR-POST-009`, `FR-CMT-006`) |
| **User management** | Suspend, reinstate accounts (`FR-ADMIN-004`) |
| **Audit trail** | Append-only `auditlogs`; identity access logged (`FR-ADMIN-005`, `NFR-SEC-010`) |
| **Mood category admin** | Add/deactivate tags (`FR-CAT-003`) |
| **In-app notifications** | Basic notification delivery (`FR-NOTIF-001`, `FR-NOTIF-002`) |
| **Frontend** | AdminLayout, all `/admin/*` pages, AdminGuard |

#### Deliverables

- [ ] `AdminService`, `NotificationService`; extended `ReportService`
- [ ] Admin routes: dashboard, reports, content moderation, users, audit logs, tags
- [ ] `AuditLogRepository` — append-only writes on moderation and identity access
- [ ] Frontend: `features/admin/` — AdminReportTable, ModerationDrawer, UserStatusPanel
- [ ] Pages: AdminOverviewPage, ReportQueuePage, ContentModerationPage, UserManagementPage, AuditLogPage
- [ ] In-app NotificationsPage (Phase 3 minimum scope)
- [ ] Tests: RBAC on all admin routes, audit log creation, report resolution flows

#### Definition of Done

- All acceptance criteria from `SPECS.md` §11 Phase 3 pass on staging.
- Non-administrator users receive `403` on all admin API routes and frontend redirect from `/admin/*`.
- Report queue shows pending reports; admin can resolve with documented outcome.
- Admin viewing identity-linked data creates audit log entry with `identityAccessed: true`.
- Student-submitted reports from Sprint 4 appear in queue and reach resolution.
- In-app notifications delivered for defined triggers (minimum: report resolution, moderation action on owned content).

#### Risks

| Risk | Mitigation |
|------|------------|
| Admin UI scope expansion | Strict P0/P1 prioritization from `SPECS.md`; defer health KPIs to v1.1 |
| Audit log storage growth | Indexed queries; retention policy in `security.md` |
| Notification trigger ambiguity | Resolve `OD-008`; ship minimum viable triggers |
| Accidental identity exposure in admin DTOs | Separate admin mappers; audit-triggered identity fields only |

#### Dependencies

- Sprint 4 report submission
- Sprint 2 administrator role and auth
- Sprint 3–5 content and statistics for admin context
- Resolve `OD-008` notification triggers

---

### Sprint 7 — Performance & Security Hardening

Optimize system performance, complete security controls, and establish operational monitoring before full regression testing.

#### Goals

- Meet NFR performance targets under staging load tests.
- Resolve security audit findings and complete production security checklist.
- Deploy monitoring, logging, and alerting for production operations.

#### Features

| Area | Scope |
|------|-------|
| **Performance optimization** | Query tuning, index review, denormalization verification (`NFR-PERF-001`–`NFR-PERF-004`) |
| **Load testing** | k6/Artillery benchmarks on feed, presign, statistics endpoints |
| **Frontend performance** | Lighthouse ≥ 80 on feed and create mood pages (`NFR-PERF-003`) |
| **Security hardening** | Helmet, CORS, rate limits, CSP on Vercel (`NFR-SEC-001`–`NFR-SEC-010`) |
| **Security audit** | Penetration test or structured security review (`security.md`) |
| **Monitoring** | Railway/Vercel/Atlas metrics; external uptime checks (`deployment.md`) |
| **Error tracking** | Sentry or equivalent on backend and frontend |
| **Background jobs** | Orphan image cleanup, deleted image purge, trending recalculation |
| **Logging** | Structured JSON logs with `requestId`; audit vs application log separation |

#### Deliverables

- [ ] Atlas Performance Advisor review; missing indexes added
- [ ] Staging load test report — feed p95 ≤ 500 ms, presign p95 ≤ 200 ms, stats p95 ≤ 2 s
- [ ] Lighthouse CI report for key frontend pages
- [ ] Security audit report with remediated findings
- [ ] Production checklist (`deployment.md`) — security section complete
- [ ] External uptime monitor on `/health` and frontend `/`
- [ ] Sentry (or equivalent) configured for staging and production
- [ ] Orphan R2 cleanup job scheduled (every 6 hours)
- [ ] Rate limiter verified across auth, write, and feed endpoint groups

#### Definition of Done

- All Phase 4 acceptance criteria from `SPECS.md` §11 (performance and security subset) pass.
- Load test p95 within targets or documented exceptions with remediation plan.
- No critical/high npm audit vulnerabilities unresolved.
- Penetration test findings rated critical/high are fixed and re-verified.
- Monitoring alerts configured for API down, elevated 5xx, and auth failure spikes.
- Production secrets verified — none in repository; environment separation confirmed.

#### Risks

| Risk | Mitigation |
|------|------------|
| Load test environment unlike production | Seed staging with production-like volume; use same tier where possible |
| Multi-instance rate limit inconsistency | Document per-instance limits for v1; plan Redis limiter for v1.1 |
| Security audit delays launch | Schedule audit mid-sprint; parallel remediation track |
| Performance regression from hardening | Baseline before changes; re-run benchmarks after each optimization |

#### Dependencies

- Sprints 2–6 feature-complete on staging
- Staging environment mirrors production configuration
- Security reviewer or third-party pentest engagement scheduled

---

### Sprint 8 — Testing & Bug Fixes

Execute comprehensive regression testing, expand automated coverage, resolve defects, and validate staging against manual QA checklist.

#### Goals

- Achieve confidence in anonymity, auth, and data integrity through automated test suites.
- Resolve all P0/P1 defects blocking production release.
- Complete manual QA checklist on staging with sign-off.

#### Features

| Area | Scope |
|------|-------|
| **Unit test expansion** | Domain services, application services, mappers, validators |
| **Integration tests** | Full HTTP middleware chain, repositories, auth flows |
| **API contract tests** | Response shapes, error codes, pagination per `api.md` |
| **Frontend tests** | Components, forms, hooks, routing guards, sanitization |
| **E2E tests** | Playwright critical paths on staging (`testing-strategy.md`) |
| **Accessibility baseline** | axe-core on key pages; eslint-plugin-jsx-a11y in CI |
| **Regression suite** | Automated run on merge to `main` |
| **Bug triage** | P0/P1 fix protocol with regression tests per bug |

#### Deliverables

- [ ] Backend unit + integration test suites passing in CI with MongoDB service container
- [ ] Frontend unit tests for auth flow, forms, MoodCard anonymity, error mapping
- [ ] Playwright E2E suite: register → login → create mood → feed → image upload → admin report flow
- [ ] Public DTO contract tests — no `authorId`, `userId`, or `email` in anonymous responses
- [ ] Manual QA checklist (`testing-strategy.md`) executed on staging — all items checked
- [ ] Defect backlog triaged; all P0 and release-blocking P1 items closed
- [ ] Rollback procedure tested (Vercel promote + Railway rollback)
- [ ] Quarterly backup restore drill scheduled

#### Definition of Done

- CI green on `main` — lint, type-check, unit, integration, E2E smoke.
- Every production bug fix from this sprint includes a regression test.
- E2E suite passes against staging URL on consecutive runs (no flaky failures ignored).
- Manual QA sign-off from product/QA stakeholder.
- Known P2 defects documented with acceptance for v1.0 launch.
- Staging E2E becomes required gate before production deploy workflow.

#### Risks

| Risk | Mitigation |
|------|------------|
| E2E flakiness | Explicit waits; `retry: false` in unit tests; quarantine policy for flaky tests |
| Test coverage gaps in anonymity | Mandatory public DTO contract test suite |
| Bug fix scope creep | Strict P0/P1 triage; defer P2 to v1.1 |
| Staging data insufficient for QA | Realistic seed script; reset schedule documented |

#### Dependencies

- Sprint 7 hardening complete on staging
- Staging URL stable for E2E automation
- QA resource availability for manual checklist

---

### Sprint 9 — Production Release (v1.0)

Deploy to production, execute post-launch verification, and complete operational handoff.

#### Goals

- Production environment serves end users with 99.5% uptime target.
- Post-deploy smoke tests confirm critical paths.
- Operations team has runbooks, monitoring access, and incident contacts.

#### Features

| Area | Scope |
|------|-------|
| **Production deploy** | Merge to `main` triggers Railway + Vercel production deploy |
| **Infrastructure verification** | Full production checklist (`deployment.md`) |
| **Smoke tests** | Health, auth, feed, create mood, image upload, admin access |
| **Domain & TLS** | Custom domains on Vercel and Railway with HTTPS |
| **Launch communication** | Release notes, known limitations, support channel |
| **Post-launch monitoring** | 30-minute elevated watch; error rate and latency alerts |
| **Documentation handoff** | Runbooks for rollback, incident response, backup restore |

#### Deliverables

- [ ] Production MongoDB Atlas cluster with automated backups (30-day retention preferred)
- [ ] Production R2 bucket — private, CORS restricted to production Vercel origin
- [ ] Railway production service with all secrets configured
- [ ] Vercel production with `VITE_API_BASE_URL` pointing to production API
- [ ] GitHub Actions `deploy-production.yml` — deploy after CI green
- [ ] External uptime monitoring active
- [ ] Post-deploy smoke test script executed and archived
- [ ] v1.0 release tag and release notes published
- [ ] Incident response contact and on-call rotation defined

#### Definition of Done

- Production checklist (`deployment.md`) — **all items complete**.
- `GET /health` and `GET /ready` return 200 on production API.
- Frontend loads at production URL; API calls use correct `VITE_API_BASE_URL`.
- End-to-end student journey verified on production: register → login → create mood with image → view in feed.
- Admin moderation path verified on production with test administrator account.
- No P0 defects open; P1 defects accepted and documented.
- Rollback tested and documented in runbook.
- **v1.0 declared live.**

#### Risks

| Risk | Mitigation |
|------|------------|
| Production config error (CORS, secrets) | Staging mirrors production; smoke test script catches mismatches |
| Launch day traffic spike | Rate limits active; Railway replica plan ready |
| Database migration failure | Forward-fix preferred; point-in-time restore runbook ready |
| User support volume | Known limitations documented; FAQ from manual QA findings |

#### Dependencies

- Sprint 8 QA sign-off and green CI
- Production cloud accounts and billing configured
- Custom domain DNS configured
- Stakeholder launch approval

---

## Future Versions

Items below are **explicitly deferred** beyond v1.0 per `README.md` Future Improvements and `SPECS.md` §12 Out of Scope. They are organized into planned version increments for product planning purposes. Prioritization within each version will be driven by user feedback and platform maturity after launch.

---

### Version 1.1 — Engagement & Operations

**Theme:** Improve day-to-day student experience and operational efficiency without architectural rewrites.

| Feature | Description | Rationale |
|---------|-------------|-----------|
| **Push notifications** | Web push or email for report resolution, reactions on bookmarked posts, trending alerts in user's faculty | Extends in-app notifications (`FR-NOTIF-002`); optional channel per user preference |
| **Enhanced notification preferences** | Granular opt-in/out per notification type (`FR-NOTIF-004`) | Reduces notification fatigue |
| **Feed personalization** | Mood feed weighted by student's faculty/major affiliation (`FR-FEED-007`) | Increases relevance without compromising anonymity |
| **Feed sorting options** | Newest, most reacted (`FR-FEED-008`) | User control over discovery |
| **Post edit window refinement** | Configurable edit policy; improved UX for edit/delete | Operational tuning based on moderation data |
| **Platform health dashboard** | Admin KPIs: error rates, active users (`FR-ADMIN-006`) | Operational visibility deferred from v1.0 |
| **Distributed rate limiting** | Redis-backed limiter for multi-instance Railway replicas | Required for horizontal scale consistency |
| **Export aggregated statistics** | CSV download for advisors/administrators | Institutional reporting need |
| **WCAG 2.1 AA remediation pass** | Formal accessibility audit and fixes (`NFR-UX-005`) | Inclusive access for diverse student population |

**Dependencies:** Stable v1.0 production metrics; notification infrastructure decision (web push vs email-first).

---

### Version 1.2 — Intelligence & Discovery

**Theme:** Add privacy-preserving intelligence layers that help students discover relevant emotional content and help institutions understand trends deeper.

| Feature | Description | Rationale |
|---------|-------------|-----------|
| **AI emotion analysis** | Optional ML-assisted mood category suggestion or sentiment scoring on post creation — never exposed as identity-linked profiling | Assists tagging accuracy; aggregated insights only |
| **Recommendation system** | Privacy-preserving feed ranking based on engagement patterns — no identity exposure, no cross-user profiling labels | Surfaces relevant anonymous content (`README.md` Future Improvements) |
| **Faculty analytics** | Enhanced advisor dashboards: comparative faculty trends, anomaly detection on mood shifts | Supports student affairs intervention planning |
| **Trending algorithm v2** | Rising vs declining theme indicators (`FR-TREND-004`) | Richer trending page |
| **Atlas Search** | Improved full-text search relevance | Better discovery at scale |
| **Real-time feed updates (SSE)** | Server-sent events for feed refresh without full page reload | Lighter-weight than WebSocket for v1.2 scope |
| **Internationalization (i18n)** | Multi-language UI for diverse student populations | Campus demographic expansion |

**Dependencies:** Sufficient aggregated data volume for ML training; privacy review for AI features; `packages/shared` monorepo workspace for schema parity.

---

### Version 2.0 — Platform Expansion

**Theme:** Transform Mood of the Major from a single-university deployment into a multi-surface, multi-institution platform.

| Feature | Description | Rationale |
|---------|-------------|-----------|
| **Mobile application** | React Native (or native) companion app for iOS and Android consuming the same REST API and JWT auth | Students primarily on mobile (`frontend.md`); push notifications native |
| **Real-time updates** | WebSocket service for live feed, notification delivery, and online user counts (aggregated, anonymous) | Full real-time experience (`README.md` Future Improvements) |
| **Multi-university support** | Tenant isolation with `tenantId` on all queries; per-institution branding and faculty/major catalogs | Scale platform to multiple institutions |
| **Push notifications (native)** | FCM/APNs integration via device token registration | Mobile engagement |
| **Integration APIs** | Webhooks and public APIs for student information systems | Institutional IT integration |
| **Advanced analytics** | Predictive well-being indicators from aggregated trends; ML moderation pipeline | Proactive student support (aggregated only) |
| **Microservices split** | Dedicated statistics worker and notification service | Scale independent workloads |
| **Multi-region deployment** | Atlas global clusters; regional R2 buckets | Latency and data residency |

**Architectural implications:**

- Backend may add WebSocket service alongside Express (`backend.md` Future Backend Improvements).
- Authentication may require SSO/OIDC integration for enterprise universities.
- New `tenantId` dimension on all repositories and queries.
- Job queue (BullMQ + Redis) for reliable background processing at scale.

**Dependencies:** v1.x operational stability; proven product-market fit at initial university; dedicated mobile and platform engineering capacity.

---

### Future Feature Reference Matrix

Cross-version summary of features referenced in project documentation:

| Feature | Earliest planned version | Notes |
|---------|--------------------------|-------|
| AI emotion analysis | v1.2 | Aggregated insights only; optional assist at post creation |
| Mobile application | v2.0 | React Native + shared API/types |
| Push notifications | v1.1 (web) / v2.0 (native) | In-app notifications ship in v1.0 Sprint 6 |
| Real-time updates | v1.2 (SSE) / v2.0 (WebSocket) | Not in v1.0 scope |
| Recommendation system | v1.2 | Privacy-preserving; no identity-linked profiling |
| Faculty analytics | v1.2 | Extends statistics dashboard for advisors |
| Direct messaging | Not planned | Out of scope — moderation and privacy complexity |
| Multi-university tenants | v2.0 | Single university in v1.0 (`ASM-004`) |
| SSO / university IdP | v2.0+ | Email/password only in v1.0 (`ASM-005`) |

---

## Document Maintenance

| Event | Action |
|-------|--------|
| Sprint completed | Mark deliverables; verify Definition of Done against test results |
| Scope change | Update sprint features; reconcile with `SPECS.md` and `README.md` roadmap |
| Open decision resolved | Remove from sprint risks; update affected sprint dependencies |
| Version reprioritization | Adjust Future Versions; document rationale |
| Production launch | Archive v1.0 sprint status; open v1.1 planning |
| Post-incident | Add regression requirement to Sprint 8 testing strategy reference |

---

*This roadmap is the authoritative phased delivery plan for Mood of the Major v1.0. All implementation work must align with sprint goals and the vision defined here and in [`README.md`](../README.md).*
