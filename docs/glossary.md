# Mood of the Major — Glossary

> **Document type:** Terminology reference  
> **Status:** Draft v1.0  
> **Authority:** Derives from [`README.md`](../README.md), [`SPECS.md`](../SPECS.md), [`database.md`](./database.md), [`api.md`](./api.md), [`backend.md`](./backend.md), and [`frontend.md`](./frontend.md). Where conflict exists, `README.md` takes precedence.

---

## Table of Contents

1. [How to Use This Document](#how-to-use-this-document)
2. [Business Terms](#business-terms)
3. [Technical Terms](#technical-terms)
4. [Related Documents](#related-documents)

---

## How to Use This Document

This glossary defines **business**, **technical**, and **architectural** terms used across Mood of the Major documentation. Definitions are written for product stakeholders, designers, and engineers — consistent with `SPECS.md` §4 Glossary and extended with implementation vocabulary from the API, database, and architecture specifications.

Each entry includes:

| Field | Description |
|-------|-------------|
| **Name** | Canonical term as used in project docs |
| **Definition** | What the term means in this project |
| **Purpose** | Why the concept exists |
| **Related Components** | Collections, services, pages, or layers (when applicable) |
| **Notes** | Optional clarifications, aliases, or TBD items |

---

## Business Terms

### Mood

| | |
|---|---|
| **Definition** | A user-created entry expressing emotion, experience, or daily thought. Stored as a document in the `moods` collection with text content, optional images, emotion tags, and faculty/major context. |
| **Purpose** | Core content unit of the platform — the primary way students share anonymously. |
| **Related Components** | `moods` collection; `MoodService`; `MoodCard`; `CreateMoodPage`; `MoodDetailPage`; `POST /api/v1/moods` |
| **Notes** | Also called **mood post**. Distinct from **Mood Feed**, which is a list of moods. |

---

### Emotion

| | |
|---|---|
| **Definition** | A structured classification of emotional content (e.g., stress, joy, anxiety, gratitude). Implemented as `tags` documents with `type: emotion` — the same concept as **mood category** in `SPECS.md`. |
| **Purpose** | Enables categorization at post creation, filtering in feeds, statistics breakdowns, and trending calculations. |
| **Related Components** | `tags` collection; `moodtags` junction; `EmotionBadge`; `emotionstatistics`; `GET /api/v1/tags` (via admin/reference) |
| **Notes** | Displayed via `EmotionBadge` using `name`, `slug`, `colorToken`, and `iconKey` from the tag record. |

---

### Faculty

| | |
|---|---|
| **Definition** | An academic division within the university (e.g., Faculty of Engineering). Reference data seeded at deployment and used to scope feeds, filters, statistics, and user affiliation. |
| **Purpose** | Organizes content and analytics by academic community so students can explore mood within their broader faculty context. |
| **Related Components** | `faculties` collection; `FacultyFeedPage`; `GET /api/v1/faculties`; `GET /api/v1/faculties/:facultyId/moods` |
| **Notes** | Identified by ObjectId or URL `slug` (e.g., `/faculty/engineering`). Deactivated via `isActive: false`, not hard-deleted. |

---

### Major

| | |
|---|---|
| **Definition** | A specific field of study within a faculty (e.g., Computer Science within Faculty of Engineering). Each major belongs to exactly one faculty. |
| **Purpose** | Provides finer-grained community scoping for feeds, filters, and statistics — especially important for aggregation threshold enforcement in small programs. |
| **Related Components** | `majors` collection; `MajorFeedPage`; `GET /api/v1/majors`; `GET /api/v1/majors/:majorId/moods` |
| **Notes** | Slug is unique within a faculty, not globally. Route: `/major/:majorId`. |

---

### Anonymous Post

| | |
|---|---|
| **Definition** | Content published by an authenticated user where the author's identity (`authorId`, email, name) is **never visible** to other users in any public-facing API response or UI element. Applies to mood posts and comments. |
| **Purpose** | Enables honest emotional expression without fear of social judgment — a first-class architectural constraint, not merely a UI toggle (`NFR-PRIV-003`). |
| **Related Components** | `moods`, `comments` collections; public DTO mappers; `AnonymityPolicy`; rules `BR-ANON-001`–`BR-ANON-004` |
| **Notes** | Users must be authenticated to post (`BR-AUTH-001`), but identity is stored internally for ownership, bookmarks, and moderation only. |

---

### Comment

| | |
|---|---|
| **Definition** | An anonymous text response attached to a mood post. May be top-level or threaded via `parentId` (max depth 3). Stored in the `comments` collection. |
| **Purpose** | Allows peer support and discussion on shared emotional content without revealing who commented. |
| **Related Components** | `comments` collection; `CommentService`; `CommentCard`; `POST /api/v1/moods/:moodId/comments` |
| **Notes** | `authorId` is internal only. Creating a comment increments `moods.commentCount`. Rate-limited per `FR-CMT-007`. |

---

### Reaction

| | |
|---|---|
| **Definition** | A lightweight emotional response to a mood post or comment. Each user may have **at most one reaction per target**; changing reaction type updates the existing record. Default types: `empathy`, `support`, `relate`, `solidarity`. |
| **Purpose** | Provides low-friction engagement without the overhead of writing a comment; reaction counts are visible without exposing who reacted. |
| **Related Components** | `reactions` collection; `ReactionService`; `ReactionPicker`; `PUT /api/v1/reactions`; denormalized `reactionSummary` on moods/comments |
| **Notes** | Public API returns aggregate counts only (`FR-REACT-004`). Authenticated users may see their own `userReaction` on a target. |

---

### Bookmark

| | |
|---|---|
| **Definition** | A private link between a user and a mood post, saved for personal reference. Unique per `(userId, moodId)` pair. |
| **Purpose** | Lets students return to meaningful posts without exposing saves to other users. |
| **Related Components** | `bookmarks` collection; `BookmarkService`; `BookmarksPage`; `POST /api/v1/bookmarks`; `GET /api/v1/bookmarks` |
| **Notes** | Bookmarked moods remain accessible to the owner even if removed from public feeds (`FR-BMK-004`). Unbookmark hard-deletes the bookmark row. |

---

### Trending

| | |
|---|---|
| **Definition** | Currently popular or **rising** emotional themes derived from recent post and reaction activity, scoped platform-wide, by faculty, or by major. Calculated from `dailystatistics` and `emotionstatistics` with delta comparison between time windows (e.g., last 7 days vs prior 7 days). |
| **Purpose** | Surfaces collective emotional themes so communities can see what emotions are gaining or losing prominence — without attributing trends to individuals. |
| **Related Components** | `TrendingService`; `TrendingPage`; `GET /api/v1/moods/trending`; `dailystatistics`, `emotionstatistics` collections |
| **Notes** | Response includes `delta`, `direction` (`rising` / `declining`), and `meetsThreshold`. Algorithm version tracked in `algorithmVersion` (`BR-STAT-003`). |

---

### Statistics

| | |
|---|---|
| **Definition** | Aggregated mood metrics — distribution by emotion, time-series trends, and KPIs — scoped by platform, faculty, or major. Computed by background jobs into pre-aggregated collections, not live-scanned from all moods on each request. |
| **Purpose** | Supports data-informed understanding of student well-being trends for students, advisors, and administrators without exposing individual identities. |
| **Related Components** | `emotionstatistics`, `dailystatistics` collections; `StatisticsService`; `StatisticsPage`; `GET /api/v1/statistics/dashboard` |
| **Notes** | Subject to **aggregation threshold** — counts suppressed when group size is below minimum (`FR-STAT-006`, `BR-STAT-001`). |

---

### Report

| | |
|---|---|
| **Definition** | A user-submitted flag indicating that a mood post or comment may violate platform policies. Captures `reasonCode` and optional description; enters an admin review queue with status `pending` until resolved. |
| **Purpose** | Enables community-driven content safety while keeping the reporter's identity hidden from the reported content's author. |
| **Related Components** | `reports` collection; `ReportService`; `ReportForm`; `POST /api/v1/moods/:moodId/report`; `GET /api/v1/admin/reports` |
| **Notes** | Duplicate reports from the same user on the same content blocked within a cooldown window (`FR-RPT-005`). Reports are append-only — never hard-deleted. |

---

### Moderator

| | |
|---|---|
| **Definition** | In Mood of the Major, content moderation is performed by users with the **administrator** role — there is no separate `moderator` role in v1.0. Moderators review reports, remove violating content, and manage user account status. |
| **Purpose** | Maintains platform safety and policy compliance while preserving an audit trail of all moderation actions. |
| **Related Components** | `AdminService`; `ReportQueuePage`; `ContentModerationPage`; `auditlogs` collection; `/admin/*` routes |
| **Notes** | All moderation actions write to `auditlogs` (`FR-ADMIN-005`). Viewing identity-linked data triggers `identityAccessed: true` audit entries. |

---

### Administrator

| | |
|---|---|
| **Definition** | A platform operator with role `administrator` in the `users` collection. Has access to the admin dashboard, report queue, user management, content moderation, tag management, and audit logs. |
| **Purpose** | Provides oversight, moderation, and platform configuration capabilities unavailable to regular students. |
| **Related Components** | `AdminLayout`; `AdminGuard`; `AdminService`; all `/api/v1/admin/*` endpoints; `auditlogs` |
| **Notes** | Admin API responses may include `authorId` and `authorEmail` on moods — always audit-logged (`BR-ANON-004`). Distinct from **advisor** role (statistics access, TBD per `OD-011`). |

---

### Student

| | |
|---|---|
| **Definition** | An authenticated university student — the primary platform user with role `student`. Can register, login, create anonymous posts, comment, react, bookmark, search, and report content. |
| **Purpose** | Target user for core product value: safe anonymous expression and community emotional awareness. |
| **Related Components** | `users` collection; `StudentLayout`; `StudentGuard`; student-scoped write endpoints |
| **Notes** | Default role on registration. May have optional `facultyId` and `majorId` affiliation used for defaults and future feed personalization. |

---

### Notification

| | |
|---|---|
| **Definition** | An in-app message delivered to a user about relevant activity (e.g., moderation outcome, activity on engaged content). Stored in the `notifications` collection with `type`, `title`, `body`, and optional deep-link reference. |
| **Purpose** | Keeps users informed of platform events without revealing identity information inconsistent with anonymity rules. |
| **Related Components** | `notifications` collection; `NotificationService`; `NotificationsPage`; `GET /api/v1/notifications` |
| **Notes** | v1.0 delivers in-app notifications; push notifications are deferred (`FR-NOTIF-002`). Notification body must not contain reporter or author identity (`FR-NOTIF-003`). |

---

### Dashboard

| | |
|---|---|
| **Definition** | A consolidated UI surface presenting aggregated data or administrative controls. Two primary dashboards exist: the **Statistics Dashboard** (student/advisor/admin analytics) and the **Admin Dashboard** (moderation KPIs and queues). |
| **Purpose** | Presents complex aggregated or operational data in a single view without requiring multiple API calls from the user. |
| **Related Components** | **Statistics:** `StatisticsPage`, `GET /api/v1/statistics/dashboard`. **Admin:** `AdminOverviewPage`, `GET /api/v1/admin/dashboard` |
| **Notes** | Statistics dashboard p95 target ≤ 2 seconds (`NFR-PERF-004`). Admin dashboard includes open report count and recent actions. |

---

### Mood Feed

| | |
|---|---|
| **Definition** | A chronologically or algorithmically ordered list of anonymous mood posts. Variants include the **global Mood Feed** (platform-wide), **Faculty Feed**, and **Major Feed** — each filtered by scope. |
| **Purpose** | Primary browsing experience for discovering anonymous emotional content within relevant academic communities. |
| **Related Components** | `FeedPage`; `MoodFeedList`; `GET /api/v1/moods/feed`; `GET /api/v1/faculties/:facultyId/moods`; cursor pagination via `meta.nextCursor` |
| **Notes** | Public read may be available to guests with optional limits (`OD-002`). Authenticated users may receive personalization by faculty/major (`FR-FEED-007`). Sort options: `newest`, `most_reacted`, `most_commented`. |

---

### Popularity Score

| | |
|---|---|
| **Definition** | A composite engagement metric ranking communities or content by activity volume. For faculties, implemented as **`activityScore`** — typically the sum of `moodCount`, `commentCount`, and `reactionCount` over a time window (e.g., 7 or 30 days). For trending emotions, popularity is expressed via **`delta`** (change vs prior window) and **`rank`**. |
| **Purpose** | Identifies the most active faculties and rising emotional themes without exposing individual user activity or identity. |
| **Related Components** | `GET /api/v1/statistics/faculties/top`; `GET /api/v1/moods/trending`; `dailystatistics`, `emotionstatistics` collections |
| **Notes** | Not a per-post author popularity metric — anonymity prohibits ranking users. Results gated by `meetsThreshold`. Top faculties response field: `activityScore`. |

---

### Advisor

| | |
|---|---|
| **Definition** | An authenticated staff role (`advisor`) with access to aggregated statistics dashboards — not individual user identities. Whether advisor is a distinct role or a permission subset of administrator is TBD (`OD-011`). |
| **Purpose** | Enables faculty advisors and student affairs staff to understand well-being patterns at faculty/major level. |
| **Related Components** | `StatisticsPage`; statistics API endpoints; `RoleGuard` |
| **Notes** | Student access to statistics dashboard also TBD (`OD-009`). |

---

### Guest

| | |
|---|---|
| **Definition** | An unauthenticated visitor with access limited to explicitly public capabilities — typically read-only feeds, mood detail (active moods), trending, and marketing pages. |
| **Purpose** | Allows discovery and conversion to registration without requiring login for all read paths. |
| **Related Components** | `PublicLayout`; `GuestGuard`; public API endpoints marked optional-auth in `api.md` |
| **Notes** | Guest feed access level and limits (e.g., truncated `limit`) TBD (`OD-002`). Protected actions show `AuthGuardPrompt` or redirect to login. |

---

### Aggregation Threshold

| | |
|---|---|
| **Definition** | The minimum group size required before statistics display raw counts — configured via `AGGREGATION_THRESHOLD_MIN` (default `5`). When below threshold, API returns `meetsThreshold: false` and suppresses counts to prevent de-anonymization. |
| **Purpose** | Privacy protection — prevents inferring individual identity from small-group statistics. |
| **Related Components** | `AggregationThresholdPolicy`; `StatisticsService`; `emotionstatistics.meetsThreshold`; `ChartContainer` threshold empty state |
| **Notes** | Exact minimum value resolved in `security.md` (`OD-010`). Distinct from rate limiting. |

---

### Mood Category

| | |
|---|---|
| **Definition** | Synonym for **emotion** tag — a predefined classification selected at post creation (e.g., stress, joy, anxiety, gratitude). At least one required per mood (`BR-CNT-002`). |
| **Purpose** | Same as **Emotion** — structured classification for content and analytics. |
| **Related Components** | `tags` (`type: emotion`); `moodtags`; `primaryTagId` on `moods` |
| **Notes** | SPECS uses "mood category"; database implements as `tags`. Admin can add/deactivate categories (`FR-CAT-003`). |

---

## Technical Terms

### JWT

| | |
|---|---|
| **Definition** | JSON Web Token — a compact, signed token format used for **stateless authentication**. Access tokens are sent in the `Authorization: Bearer` header; claims include `sub` (userId), `role`, `iat`, and `exp`. |
| **Purpose** | Enables scalable, stateless API authentication without server-side session storage — supports horizontal scaling on Railway. |
| **Related Components** | `JwtTokenService`; `authenticate` middleware; `AuthService`; `BR-AUTH-003` |
| **Notes** | Default access token TTL: 15 minutes. Validated on every protected request before business logic executes. |

---

### Access Token

| | |
|---|---|
| **Definition** | A short-lived JWT issued on login or refresh that authorizes API requests. Stored in memory or `sessionStorage` on the client — never in `localStorage` for refresh tokens. |
| **Purpose** | Proves authenticated identity and role for each API call without re-entering credentials. |
| **Related Components** | Axios request interceptor; `utils/token.ts`; `AuthContext`; `Authorization: Bearer` header |
| **Notes** | Expired tokens return `401 AUTH_EXPIRED_TOKEN`; client attempts silent refresh via `/auth/refresh`. |

---

### Refresh Token

| | |
|---|---|
| **Definition** | A long-lived credential used to obtain a new access token without re-login. Delivered as an **HttpOnly, Secure, SameSite=Strict** cookie (preferred) or in response body per `authentication.md` (`OD-003`). |
| **Purpose** | Balances security (short access token lifetime) with user experience (persistent sessions). |
| **Related Components** | `POST /api/v1/auth/refresh`; Axios interceptor; `AuthService` |
| **Notes** | Invalidated on logout. Rotation policy may invalidate prior refresh tokens on reuse detection. Not accessible to JavaScript — XSS mitigation. |

---

### Cloudflare R2

| | |
|---|---|
| **Definition** | S3-compatible object storage service used for all user-uploaded images. Buckets are **private** — no public read ACLs. One bucket per environment (dev, staging, production). |
| **Purpose** | Stores image binaries off the application server and MongoDB — scales independently with zero egress fees to Cloudflare CDN (`NFR-SCALE-002`). |
| **Related Components** | `R2ImageStorage` adapter; `IImageStorage` port; `ImageService`; `moodimages` collection; `cloudflare-r2.md` |
| **Notes** | Clients upload/download directly via presigned URLs — Railway never stores image bytes (`FR-IMG-007`). |

---

### Object Key

| | |
|---|---|
| **Definition** | The unique path string identifying an object within an R2 bucket. Format: `{environment}/moods/{userId}/{timestamp}-{uuid}.{ext}`. Stored in `moodimages.objectKey` — never exposed in client-facing error messages. |
| **Purpose** | Links MongoDB image metadata to the corresponding binary in R2 for presign, confirm, download, and delete operations. |
| **Related Components** | `moodimages` collection; `R2ImageStorage`; unique index on `objectKey` |
| **Notes** | Immutable after creation. Orphan keys cleaned up by scheduled job after 24h if unlinked (`BR-IMG-004`). |

---

### Signed URL

| | |
|---|---|
| **Definition** | A time-limited URL authorizing a single HTTP operation on an R2 object without exposing bucket credentials. Two types: **presigned upload URL** (PUT, 15-minute TTL) and **signed download URL** (GET, 1-hour TTL). |
| **Purpose** | Mediates all R2 access through backend authorization while keeping binaries off the API server. |
| **Related Components** | `ImageService`; `POST /api/v1/images/upload-url`; `GET /api/v1/images/:imageId/url`; `useImageUpload` hook |
| **Notes** | Signed URLs are **never persisted** in MongoDB — generated ephemeral at request time (`BR-IMG-003`). Also called presigned URL for uploads. |

---

### Presigned Upload URL

| | |
|---|---|
| **Definition** | A signed URL authorizing the client to `PUT` image binary data directly to R2. Issued after MIME and size validation; creates a `moodimages` row with `status: pending`. |
| **Purpose** | First step of the three-step upload flow: presign → client PUT → confirm. |
| **Related Components** | `POST /api/v1/images/upload-url`; `UploadImage` component; `useImageUpload` |
| **Notes** | Target p95 generation ≤ 200 ms (`NFR-PERF-002`). Max 5 MB; allowlist: JPEG, PNG, WebP. |

---

### Repository Pattern

| | |
|---|---|
| **Definition** | A design pattern where all database access flows through **repository interfaces** (ports) in the domain layer, implemented by Mongoose adapters in infrastructure. Controllers and routes never call Mongoose directly. |
| **Purpose** | Decouples business logic from MongoDB; enables unit testing with mock repositories and future database swappability (`NFR-MAINT-003`, `INT-DB-004`). |
| **Related Components** | `IMoodRepository`, `IUserRepository`, etc.; `MongooseMoodRepository`; `infrastructure/database/repositories/` |
| **Notes** | Public queries use projection profiles (e.g., `publicProfile`) that exclude identity fields. See ADR-007. |

---

### Service Layer

| | |
|---|---|
| **Definition** | The **application services** layer — use-case orchestrators such as `MoodService`, `AuthService`, and `StatisticsService`. One public method per user-facing operation; enforces business rules and coordinates repositories and adapters. |
| **Purpose** | Centralizes business logic outside HTTP handlers and UI — the authoritative enforcement point for anonymity, ownership, thresholds, and RBAC. |
| **Related Components** | `backend/src/application/services/`; invoked by controllers; depends on domain ports only |
| **Notes** | Must not import Express `Request`/`Response` types. Domain services (e.g., `AnonymityPolicy`) handle pure logic without I/O. |

---

### Controller

| | |
|---|---|
| **Definition** | A thin HTTP adapter in the backend delivery layer. Extracts validated input from the request, calls one application service method, and formats the `{ success, data, meta }` response envelope. |
| **Purpose** | Translates HTTP ↔ use cases without containing business logic (`NFR-MAINT-002`). |
| **Related Components** | `backend/src/controllers/`; `asyncHandler` wrapper; mapped from `routes/` |
| **Notes** | Must not import Mongoose models or implement anonymity rules inline — delegates to services and mappers. |

---

### Middleware

| | |
|---|---|
| **Definition** | Express functions that run in a chain before the controller — handling cross-cutting HTTP concerns: logging, security headers, CORS, rate limiting, JWT authentication, RBAC authorization, and request validation. |
| **Purpose** | Enforces security and validation **before** business logic on every request (`BR-AUTH-003`, `NFR-SEC-002`). |
| **Related Components** | `authenticate`, `authorize`, `validate`, `rateLimiter`, `errorHandler`, `requestLogger`; Helmet via `app.ts` |
| **Notes** | Order matters: CORS → rate limit → authenticate → authorize → validate → controller. |

---

### DTO

| | |
|---|---|
| **Definition** | Data Transfer Object — the shape of data crossing an API or layer boundary. **Public DTOs** (anonymous) exclude `authorId`, `userId`, and `email`. **Admin DTOs** may include identity fields with audit triggers. |
| **Purpose** | Defines explicit contracts for what leaves the backend — anonymity is enforced in DTOs, not only in the UI (`BR-ANON-001`). |
| **Related Components** | `application/mappers/`; `types/api/` on frontend; anonymous mood/comment schemas in `api.md` |
| **Notes** | Frontend TypeScript types mirror public DTOs and document identity field exclusion by design. |

---

### MongoDB Collection

| | |
|---|---|
| **Definition** | A named set of documents in MongoDB Atlas — the project's persistence unit. Mood of the Major uses exactly **15 collections**; adding a sixteenth requires an ADR. |
| **Purpose** | Stores all structured application data via Mongoose ODM; images store metadata only — never binaries. |
| **Related Components** | `users`, `faculties`, `majors`, `moods`, `moodimages`, `comments`, `reactions`, `reports`, `notifications`, `bookmarks`, `tags`, `moodtags`, `emotionstatistics`, `dailystatistics`, `auditlogs` |
| **Notes** | Database name: `mood_of_the_major` (with `_dev`, `_staging` suffixes per environment). Collection names are lowercase plural. |

---

### Aggregation Pipeline

| | |
|---|---|
| **Definition** | A MongoDB aggregation framework sequence (`$match`, `$group`, `$bucket`, etc.) that computes statistics, trending deltas, and daily rollups from source collections. Runs as **scheduled background jobs**, not on every feed request. |
| **Purpose** | Produces pre-computed analytics in `emotionstatistics` and `dailystatistics` — meets dashboard p95 ≤ 2 s without live full scans (`NFR-PERF-004`, ADR-013). |
| **Related Components** | Daily statistics job (01:00 UTC); `StatisticsService`; trending recalculation; `database.md` §Aggregation Strategy |
| **Notes** | Outputs counts only — never individual `moodId` or `authorId` in public statistics (`FR-STAT-005`). Idempotent upserts by unique compound keys. |

---

### Environment Variables

| | |
|---|---|
| **Definition** | Configuration values loaded at runtime from platform secret stores or local `.env` files (gitignored). Backend validates required secrets at startup via Zod; missing production secrets cause fail-fast exit. |
| **Purpose** | Separates configuration from code; keeps credentials out of source control (`NFR-SEC-006`). |
| **Related Components** | **Backend (Railway):** `MONGODB_URI`, `JWT_SECRET`, `R2_*`, `CORS_ALLOWED_ORIGINS`. **Frontend (Vercel):** `VITE_API_BASE_URL`, `VITE_APP_ENV` only — no secrets. |
| **Notes** | `VITE_*` variables are embedded at build time and are public. Never put JWT or MongoDB credentials in `VITE_*`. |

---

### CI/CD

| | |
|---|---|
| **Definition** | Continuous Integration / Continuous Deployment — automated pipeline via **GitHub Actions**. On pull request: lint, type-check, tests, dependency audit. On merge to `main`: deploy backend to Railway and frontend to Vercel. |
| **Purpose** | Ensures quality gates before merge and repeatable, documented deployments (`INT-DEP-003`, `INT-DEP-005`). |
| **Related Components** | `.github/workflows/ci.yml`, `deploy-production.yml`; branch protection on `main` |
| **Notes** | Path filters skip deploy when only `docs/**` changes. Backend runtime secrets live in Railway — not GitHub. |

---

### Rate Limiting

| | |
|---|---|
| **Definition** | Middleware that restricts request frequency per IP or per authenticated user to mitigate abuse. Returns HTTP `429 RATE_LIMIT_EXCEEDED` with `X-RateLimit-*` headers when exceeded. |
| **Purpose** | Protects auth endpoints from brute force and posting/comment endpoints from spam (`FR-AUTH-009`, `NFR-SEC-004`). |
| **Related Components** | `rateLimiter` middleware; `constants/rateLimits.ts`; limits in `api.md` §API Security |
| **Notes** | Example: login/register 10/15 min/IP; mood/comment create 30/hour/user; feeds 120/min/user. Multi-instance limits may be per-replica in v1. |

---

### Validation

| | |
|---|---|
| **Definition** | Multi-layer checking that inputs meet shape, type, and business rules before persistence. Layers: (1) API ingress Zod/Express Validator, (2) application service business rules, (3) domain invariants, (4) Mongoose schema. |
| **Purpose** | Fail fast on bad input; reject unknown fields on strict schemas (`NFR-SEC-002`); client-side Zod is UX-only — server is authoritative. |
| **Related Components** | `validators/`; `validate` middleware; React Hook Form + Zod on frontend |
| **Notes** | Validation errors return `422 VALIDATION_FAILED` with optional `details` array for field-level messages. |

---

### Soft Delete

| | |
|---|---|
| **Definition** | Marking a record as deleted by setting `deletedAt` and/or a `status` enum (e.g., `deleted_by_author`, `moderated_removed`) without physically removing the document. Public queries filter `deletedAt: null` and active status. |
| **Purpose** | Preserves content for audit, moderation history, and bookmark access while hiding from public feeds (`BR-CNT-004`, ADR-014). |
| **Related Components** | `moods`, `comments`, `moodimages`, `users`; contrast with hard delete on `bookmarks`, `reactions` |
| **Notes** | `auditlogs` are append-only — never soft or hard deleted in normal operations. R2 object deletion follows soft-delete via background job. |

---

### Feature Module

| | |
|---|---|
| **Definition** | A self-contained vertical slice in `frontend/src/features/<name>/` owning domain-specific components, hooks, schemas, and public exports. Examples: `auth`, `feed`, `mood`, `statistics`, `admin`. |
| **Purpose** | Isolates product domains so changes stay localized; prevents cross-feature imports (`architecture.md` ADR-008). |
| **Related Components** | `features/feed/`, `features/mood/`, etc.; barrel `index.ts`; shared code extracted to `components/`, `services/`, `hooks/` |
| **Notes** | Feature hooks call `services/` wrappers — not raw Axios. Query keys namespaced by domain (e.g., `['moods', 'feed']`). |

---

### Responsive Design

| | |
|---|---|
| **Definition** | UI layout that adapts across viewport sizes using a **mobile-first** Tailwind breakpoint strategy: default (< 768px), `md:` (tablet), `lg:` (desktop). Students primarily use phones on campus. |
| **Purpose** | Ensures usable experience on all devices (`NFR-UX-001`, `DESIGN.md`). |
| **Related Components** | `StudentLayout` (bottom nav mobile, sidebar desktop); `FilterPanel` (bottom sheet vs embedded); touch targets ≥ 44×44px |
| **Notes** | Admin layout uses fixed sidebar on desktop; horizontal scroll on mobile tables. |

---

### Dark Mode

| | |
|---|---|
| **Definition** | A first-class color theme using semantic design tokens with Tailwind `dark:` variants. User preference: System / Light / Dark — persisted in `localStorage` via `ThemeContext`. |
| **Purpose** | Comfortable reading in varied lighting; emotion badges and charts adjusted for dark background contrast (`DESIGN.md`). |
| **Related Components** | `ThemeContext`; `tailwind.config.ts` semantic colors; `styles/tokens.css` |
| **Notes** | Default respects `prefers-color-scheme` on first visit. Transitions ≤ 200ms; disabled under `prefers-reduced-motion`. |

---

### Skeleton Loading

| | |
|---|---|
| **Definition** | Placeholder UI blocks that mirror final content layout during initial data fetch — preferred over full-page spinners for content areas (`NFR-UX-003`). |
| **Purpose** | Reduces perceived wait time and layout shift; communicates that content is loading without a blank screen. |
| **Related Components** | `Skeleton` component; `MoodCard` skeleton variants; TanStack Query `isLoading` on feeds, detail, statistics |
| **Notes** | Shimmer animation disabled under `prefers-reduced-motion`. Button submit uses inline spinner, not skeleton. |

---

### Definition of Done

| | |
|---|---|
| **Definition** | Explicit completion criteria for a sprint, feature, or phase — verifiable conditions that must pass before work is accepted. Aligned with `SPECS.md` §11 Acceptance Criteria by Phase and sprint checklists in `docs/roadmap.md`. |
| **Purpose** | Prevents ambiguous "done" states; ties delivery to testable requirements and staging verification. |
| **Related Components** | Sprint DoD sections in `roadmap.md`; Phase 1–4 acceptance tables in `SPECS.md`; manual QA checklist |
| **Notes** | Example: Sprint 3 DoD includes full R2 upload flow and anonymity DTO contract tests passing on staging. |

---

### Sprint

| | |
|---|---|
| **Definition** | A time-boxed delivery increment in the project roadmap (Sprint 0 through Sprint 9 for v1.0). Each sprint has goals, features, deliverables, definition of done, risks, and dependencies. |
| **Purpose** | Structures incremental delivery aligned with Clean Architecture and documentation-first development. |
| **Related Components** | `docs/roadmap.md`; `TODO.md` for task tracking |
| **Notes** | Sprint 0 is documentation-only; Sprint 9 is production release (v1.0). Sprints are sequential with documented dependencies. |

---

### ADR

| | |
|---|---|
| **Definition** | Architecture Decision Record — a documented record of a significant technical or architectural choice, including context, decision, alternatives considered, and consequences. Authoritative log: `docs/adr.md` (ADR-001 through ADR-015+). |
| **Purpose** | Preserves rationale for stack and design choices; required before deviating from mandated technologies or adding MongoDB collections beyond the 15-collection lock. |
| **Related Components** | `docs/adr.md`; referenced from `architecture.md`, `backend.md`, `database.md` |
| **Notes** | Examples: ADR-006 Clean Architecture, ADR-011 Private R2 Bucket, ADR-012 Anonymous Posting Design, ADR-013 Precomputed Statistics. New collections require ADR. |

---

### Clean Architecture

| | |
|---|---|
| **Definition** | Architectural style organizing code into concentric layers with **inward-only dependencies**: Delivery (routes, controllers) → Application (services) → Domain (entities, ports) ← Infrastructure (Mongoose, R2, JWT). Business rules never depend on frameworks or databases. |
| **Purpose** | Maintainable, testable codebase where Express and Mongoose are replaceable details (`NFR-MAINT-001`, ADR-006). |
| **Related Components** | `backend/src/domain/`, `application/`, `infrastructure/`; `.cursor/rules/architecture.mdc` |
| **Notes** | Forbidden: Mongoose in controllers; business logic in routes; anonymity only in React. |

---

### TanStack Query

| | |
|---|---|
| **Definition** | Client-side library for **server-state management** — caching, background refetch, mutations, and infinite pagination for all API-derived data. |
| **Purpose** | Single authoritative cache for feeds, moods, statistics, and auth profile — avoids duplicating API data in React state or Context (`INT-API-002`, ADR-004). |
| **Related Components** | `QueryClientProvider`; `useQuery`, `useMutation`, `useInfiniteQuery`; `constants/queryKeys.ts`; `lib/queryClient.ts` |
| **Notes** | Does not store JWT tokens — `AuthContext` owns session. Cursor pagination via `getNextPageParam` from `meta.nextCursor`. |

---

### Cursor Pagination

| | |
|---|---|
| **Definition** | Pagination strategy using an opaque `cursor` string (encoding `createdAt` + `_id`) instead of offset/page numbers. Query params: `limit` (default 20, max 50) and `cursor`; response includes `meta.nextCursor` and `meta.hasMore`. |
| **Purpose** | Stable, performant pagination on large feeds without skip-offset degradation (`OD-005`, `NFR-SCALE-004`). |
| **Related Components** | All list endpoints in `api.md`; `useInfiniteQuery` on frontend; compound index `{ createdAt: -1, _id: -1 }` on `moods` |
| **Notes** | Resolves open decision `OD-005`. Guest feeds may use reduced `limit`. |

---

### RBAC

| | |
|---|---|
| **Definition** | Role-Based Access Control — authorization model distinguishing roles: `guest`, `student`, `advisor`, `administrator`. Enforced in middleware (`authorize`) and application services. |
| **Purpose** | Ensures users access only capabilities appropriate to their role (`FR-AUTH-006`, `BR-AUTH-002`). |
| **Related Components** | `authorize` middleware; `AdminGuard`, `StudentGuard`, `RoleGuard`; JWT `role` claim |
| **Notes** | Frontend route guards improve UX but are not the security boundary — server always enforces. |

---

### Presigned URL

| | |
|---|---|
| **Definition** | See **Signed URL** — specifically the upload variant authorizing client `PUT` to R2. Used interchangeably with "presigned upload URL" in `SPECS.md` and `cloudflare-r2.md`. |
| **Purpose** | Same as **Signed URL** (upload path). |
| **Related Components** | Same as **Signed URL** |
| **Notes** | Download URLs are "signed download URLs" — both are presigned in the S3/R2 sense. |

---

## Related Documents

| Document | Glossary relevance |
|----------|-------------------|
| [`SPECS.md`](../SPECS.md) | Original glossary (§4); requirement IDs (`FR-*`, `BR-*`, `NFR-*`) |
| [`database.md`](./database.md) | Collection schemas; aggregation; anonymity storage model |
| [`api.md`](./api.md) | DTO shapes; endpoint terminology; error codes |
| [`backend.md`](./backend.md) | Layer definitions; service and middleware vocabulary |
| [`frontend.md`](./frontend.md) | Feature modules; state management; UI patterns |
| [`roadmap.md`](./roadmap.md) | Sprint and Definition of Done usage |
| [`adr.md`](./adr.md) | Full ADR log with decision rationale |

---

## Document Maintenance

| Event | Action |
|-------|--------|
| New domain term introduced | Add entry to Business or Technical Terms |
| SPECS glossary updated | Reconcile definitions; README/SPECS take precedence on conflict |
| Open decision resolved | Update Notes on affected terms (e.g., `OD-009`, `OD-011`) |
| ADR accepted | Cross-reference in ADR entry and affected technical terms |
| API or schema rename | Update Related Components paths |

---

*This glossary is the authoritative terminology reference for Mood of the Major. Use these definitions consistently across documentation, specifications, and implementation discussions.*
