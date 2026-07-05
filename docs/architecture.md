# Mood of the Major — Software Architecture

> **Document type:** System architecture specification  
> **Status:** Draft v1.0  
> **Authority:** This document derives from [`README.md`](../README.md), [`SPECS.md`](../SPECS.md), and [`DESIGN.md`](../DESIGN.md). Where conflict exists, `README.md` takes precedence, then `SPECS.md`, then `DESIGN.md`.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Principles](#architecture-principles)
3. [High-Level Architecture](#high-level-architecture)
4. [Frontend Architecture](#frontend-architecture)
5. [Backend Architecture](#backend-architecture)
6. [Data Flow](#data-flow)
7. [State Management Strategy](#state-management-strategy)
8. [Error Handling Strategy](#error-handling-strategy)
9. [Validation Strategy](#validation-strategy)
10. [Logging Strategy](#logging-strategy)
11. [Environment Variables](#environment-variables)
12. [Folder Structure](#folder-structure)
13. [Related Documents](#related-documents)

---

## System Overview

Mood of the Major is a **distributed full-stack system** composed of four primary runtime components:

1. **Client** — A single-page application (SPA) built with React 19 and Vite, deployed on Vercel.
2. **Backend API** — A stateless REST API built with Express.js, deployed on Railway.
3. **MongoDB Atlas** — Managed document database for all structured application data.
4. **Cloudflare R2** — Private object storage for user-uploaded images.

The client communicates with the backend exclusively over **HTTPS REST**. The backend orchestrates persistence in MongoDB and authorized access to R2. **No image binaries pass through or persist on the application server.**

The system serves three experiential surfaces defined in `DESIGN.md`:

- **Student experience** — Anonymous mood sharing, feeds, engagement, and statistics.
- **Advisor experience** — Read-focused aggregated analytics (access scope TBD per `SPECS.md`).
- **Administrator experience** — Moderation, reporting, user management, and audit tooling.

### Architectural Style

The project follows **Clean Architecture** (also known as Ports and Adapters). Business rules are isolated in the **domain** and **application** layers. Frameworks (Express, React, Mongoose) and external services (Atlas, R2) live at the outer edges as replaceable implementation details.

### Deployment Topology

```
┌─────────────┐         HTTPS          ┌─────────────┐
│   Vercel    │ ◄──────────────────► │   Browser   │
│  (Frontend) │                        │   (Client)  │
└─────────────┘                        └──────┬──────┘
                                              │ HTTPS REST
                                              ▼
                                       ┌─────────────┐
                                       │   Railway   │
                                       │  (Backend)  │
                                       └──────┬──────┘
                                              │
                              ┌───────────────┼───────────────┐
                              ▼               ▼               ▼
                       ┌───────────┐  ┌───────────┐  ┌───────────┐
                       │  MongoDB  │  │Cloudflare │  │  GitHub   │
                       │   Atlas   │  │    R2     │  │  Actions  │
                       └───────────┘  └───────────┘  └───────────┘
```

| Property | Decision |
|----------|----------|
| **Repository layout** | Documentation monorepo today; application code will live in dedicated `frontend/` and `backend/` directories |
| **Deployment model** | Frontend and backend independently deployable (`README.md`) |
| **API style** | REST over JSON (`INT-API-001`) |
| **Authentication** | Stateless JWT (`FR-AUTH-002`, `NFR-SCALE-003`) |
| **Language** | TypeScript on both frontend and backend (`NFR-MAINT-005`) |

---

## Architecture Principles

### Why Clean Architecture

Clean Architecture is chosen because Mood of the Major has **non-trivial business rules** that must outlive framework choices:

- **Anonymity enforcement** — Author identity must be stripped from all public API responses (`BR-ANON-001` through `BR-ANON-003`), not merely hidden in the UI.
- **Aggregation thresholds** — Statistics logic must enforce minimum group sizes before returning data (`BR-STAT-001`).
- **Role-based authorization** — Students, advisors, and administrators have distinct capabilities (`SPECS.md` §5).
- **Media access control** — Image authorization is a business rule, not a storage configuration detail.

Placing these rules in the domain and application layers ensures they are testable without HTTP, MongoDB, or R2. When Express or Mongoose versions change, business logic remains stable.

### Separation of Concerns

Each layer and module has a single, well-defined responsibility:

| Concern | Owner | Must not |
|---------|-------|----------|
| HTTP routing and status codes | Backend API layer | Contain business rules |
| Business orchestration | Application services | Know about Express `req`/`res` |
| Domain invariants | Domain entities and services | Import Mongoose or Axios |
| Database queries | Repository implementations | Leak into controllers |
| UI rendering | React components | Call MongoDB or R2 |
| Server-state caching | TanStack Query | Duplicate business validation |
| Input shape validation | Validators (API + forms) | Replace domain rule checks |
| Cross-cutting auth | Middleware | Implement authorization logic beyond token parsing |

Violations — such as anonymity checks only in React components or Mongoose calls in controllers — are architectural defects (`NFR-MAINT-002`, `NFR-MAINT-003`).

### Dependency Direction

Dependencies point **inward**. Outer layers depend on inner abstractions; inner layers depend on nothing external.

```
Presentation (React)
        │
        ▼ depends on
    API Contracts (DTOs, shared Zod schemas)
        │
        ▼
Backend API Layer (Express routes, controllers)
        │
        ▼
Application Layer (use case services)
        │
        ▼
Domain Layer (entities, ports/interfaces)
        ▲
        │ implements
Infrastructure Layer (Mongoose repos, R2 adapter, JWT service, bcrypt)
```

**Port and adapter pattern:**

- Domain defines `IMoodRepository`, `IImageStorage`, `IAuthTokenService` interfaces (ports).
- Infrastructure provides Mongoose and R2 implementations (adapters).
- Application services depend only on port interfaces, injected at startup.

### Scalability

| Dimension | Strategy |
|-----------|----------|
| **API throughput** | Stateless JWT enables horizontal scaling of Railway instances (`NFR-SCALE-003`) |
| **Database** | MongoDB Atlas managed scaling; indexed queries for feeds and filters (`NFR-SCALE-001`) |
| **Media storage** | R2 scales independently; uploads bypass backend bandwidth (`NFR-SCALE-002`) |
| **Feed volume** | Mandatory pagination on all list endpoints (`NFR-SCALE-004`, `FR-SRCH-006`) |
| **Client performance** | TanStack Query caching reduces redundant API calls; Vite code-splitting by route |

### Maintainability

| Practice | Benefit |
|----------|---------|
| Clean layer boundaries | Engineers locate logic predictably |
| Feature-based frontend folders | Changes to feeds do not scatter across unrelated modules |
| Repository pattern | Database implementation swappable or mockable in tests |
| Shared Zod schemas | Frontend and backend agree on contracts (`NFR-COMPAT-003`) |
| TypeScript throughout | Compile-time safety across client and server |
| Documented ADRs in this file | Deviations from stack require explicit records (`INT-API-005` / SPECS §9.5) |
| `.cursor/rules/` | AI-assisted development preserves conventions |

---

## High-Level Architecture

### Component Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                         │
│         React 19 · Vite · Tailwind CSS · React Router           │
│         Axios · TanStack Query · React Hook Form · Zod          │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS (REST API, JSON)
┌────────────────────────────▼────────────────────────────────────┐
│                     Backend API (Express.js)                    │
│         Routes → Controllers → Middleware → Validators          │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                   Application / Use Case Layer                    │
│      Business rules, orchestration, authorization logic         │
└────────────┬───────────────────────────────┬────────────────────┘
             │                               │
┌────────────▼──────────────┐   ┌────────────▼────────────────────┐
│    Domain Layer           │   │    Infrastructure Layer         │
│  Entities, value objects  │   │  MongoDB (Mongoose), R2, JWT,   │
│  Ports (interfaces)       │   │  bcrypt, logging adapters       │
└───────────────────────────┘   └─────────────────────────────────┘
             │                               │
             ▼                               ▼
      ┌─────────────┐                 ┌─────────────┐
      │ MongoDB     │                 │ Cloudflare  │
      │ Atlas       │                 │ R2          │
      └─────────────┘                 └─────────────┘
```

### Component Responsibilities

#### Client (Browser / Frontend SPA)

| Responsibility | Detail |
|----------------|--------|
| **Render UI** | Pages and layouts per `DESIGN.md`; responsive across breakpoints (`NFR-UX-001`) |
| **Client-side routing** | React Router; student shell vs. admin shell |
| **Form interaction** | React Hook Form with Zod validation (`NFR-UX-002`) |
| **Server-state management** | TanStack Query for feeds, moods, statistics, admin queues |
| **API communication** | Axios with interceptors for JWT attachment and error normalization |
| **Client-side sanitization** | Safe rendering of user-generated content (`NFR-SEC-003`) |
| **Token storage** | Secure client-side JWT persistence per `docs/authentication.md` |
| **Direct R2 upload** | PUT images to presigned URLs issued by backend — no R2 credentials in client |

The client **never** enforces anonymity alone. It renders what the API returns, but the API is authoritative (`NFR-PRIV-003`).

#### Backend API (Express.js on Railway)

| Responsibility | Detail |
|----------------|--------|
| **HTTP boundary** | Route definitions, request parsing, response formatting |
| **Authentication** | JWT validation middleware on protected routes (`BR-AUTH-003`) |
| **Authorization** | RBAC checks delegated to application services (`FR-AUTH-006`) |
| **Input validation** | Zod and/or Express Validator at ingress (`NFR-SEC-002`) |
| **Use case orchestration** | Controllers delegate to application services — thin controllers (`README.md`) |
| **Anonymity mapping** | Strip identity fields from public DTOs before response |
| **Rate limiting** | Auth and write endpoints (`NFR-SEC-004`) |
| **CORS** | Strict origin allowlist in production (`NFR-SEC-005`) |
| **Presigned URL issuance** | Authorize upload/download; generate R2 URLs |
| **Structured errors** | Consistent error envelope without stack traces (`NFR-SEC-009`) |

The backend **never** stores image file binaries. It stores metadata and object keys only (`INT-DB-003`).

#### MongoDB Atlas

| Responsibility | Detail |
|----------------|--------|
| **Structured persistence** | Users, posts, comments, reactions, bookmarks, reports, categories, audit records |
| **Image metadata** | Object keys, MIME types, upload status — not binary data |
| **Aggregation queries** | Statistics, trending emotions, feed filters |
| **Indexing** | Feed pagination, faculty/major filters, search (strategy in `docs/database.md`) |
| **Backups** | Automated production backups (`NFR-AVAIL-002`) |
| **Network security** | IP allowlist restricted to Railway backend (`NFR-SEC-007`) |

Access is exclusively through **repository implementations** in the infrastructure layer (`INT-DB-004`).

#### Cloudflare R2

| Responsibility | Detail |
|----------------|--------|
| **Binary image storage** | Private bucket; all objects inaccessible without signed URLs |
| **Presigned upload** | Time-limited PUT URLs for direct client upload |
| **Signed download** | Time-limited GET URLs after backend authorization |
| **Independent scaling** | Storage growth does not affect API server resources |

Configuration and bucket policies are documented in `docs/cloudflare-r2.md` (`INT-R2-004`).

---

## Frontend Architecture

The frontend is a **React 19 SPA** organized by **feature** with shared UI primitives. It maps directly to pages defined in `DESIGN.md` §Navigation Structure.

### Layer Model

```
┌─────────────────────────────────────────────────────────┐
│  Pages          Route-level views; one per URL            │
├─────────────────────────────────────────────────────────┤
│  Layouts        Student shell, admin shell, auth layout │
├─────────────────────────────────────────────────────────┤
│  Features       Domain-oriented modules (feed, mood…)   │
│    ├─ Components  Feature-specific UI                   │
│    ├─ Hooks         Feature data and behavior hooks     │
│    └─ Services      Feature API call wrappers           │
├─────────────────────────────────────────────────────────┤
│  Shared                                           │
│    ├─ Components  Navbar, MoodCard, Modal, etc.         │
│    ├─ Hooks         useAuth, useDebounce, useTheme      │
│    ├─ Contexts      Auth, theme (minimal global state)  │
│    ├─ Services      Axios instance, API error mapper    │
│    ├─ Utils         Date formatting, sanitization       │
│    ├─ Types         Shared TypeScript interfaces        │
│    └─ Assets        Icons, illustrations, fonts         │
└─────────────────────────────────────────────────────────┘
```

### Pages

Pages are top-level route components. Each page composes layouts, feature components, and shared components. Pages contain **no direct Axios calls** — they use hooks backed by TanStack Query.

| Page | Route (per DESIGN.md) | Feature module |
|------|----------------------|----------------|
| Landing | `/` | `landing` |
| Register | `/register` | `auth` |
| Login | `/login` | `auth` |
| Mood Feed | `/feed` | `feed` |
| Faculty Feed | `/faculty/:facultyId` | `faculty` |
| Major Feed | `/major/:majorId` | `major` |
| Create Mood | `/create` | `mood` |
| Mood Detail | `/mood/:moodId` | `mood` |
| Search Results | `/search` | `search` |
| Bookmarks | `/bookmarks` | `bookmarks` |
| Trending | `/trending` | `statistics` |
| Statistics | `/statistics` | `statistics` |
| Notifications | `/notifications` | `notifications` |
| Admin Overview | `/admin` | `admin` |
| Report Queue | `/admin/reports` | `admin` |
| Content Moderation | `/admin/content` | `admin` |
| User Management | `/admin/users` | `admin` |
| Audit Log | `/admin/audit` | `admin` |

### Layouts

Layouts wrap pages with persistent chrome:

| Layout | Used by | Provides |
|--------|---------|----------|
| **PublicLayout** | Landing | Minimal header, footer |
| **AuthLayout** | Register, Login | Centered card, logo |
| **StudentLayout** | Feed, mood, bookmarks, statistics, trending | Navbar, sidebar (desktop), bottom nav (mobile) |
| **AdminLayout** | All `/admin/*` | Admin sidebar, top bar, no student create CTA |

Layouts handle outlet rendering for nested routes and role-based visibility (e.g., hide Create for guests).

### Components

Components follow the hierarchy in `DESIGN.md` §Component Design:

- **Shared components** — Reusable across features: `Navbar`, `Sidebar`, `MoodCard`, `CommentCard`, `EmotionBadge`, `StatisticsCard`, `SearchBar`, `FilterPanel`, `UploadImage`, `Pagination`, `Modal`, `Toast`, etc.
- **Feature components** — Composed for one domain: `MoodFeedList`, `CreateMoodForm`, `ReportModal`, `AdminReportTable`.

Component rules:

- Presentational components receive data via props; no TanStack Query inside leaf components.
- Container components (or page-level hooks) fetch data and pass down.
- No business logic equivalent to anonymity stripping — trust API public DTOs; display safeguards still sanitize rendered HTML.

### Contexts

Context is used **sparingly** for truly global, low-churn state. Server data does not live in context.

| Context | Purpose |
|---------|---------|
| **AuthContext** | Current user session, role, login/logout actions, JWT presence |
| **ThemeContext** | Light / dark / system preference per `DESIGN.md` §Dark Mode |

Avoid prop-drilling for auth and theme only. Do not create a `FeedContext` or `MoodContext` — TanStack Query handles that cache.

### Hooks

| Category | Examples | Responsibility |
|----------|----------|----------------|
| **Auth** | `useAuth`, `useRequireAuth` | Session state, redirect guests |
| **Data (TanStack Query)** | `useMoodFeed`, `useMoodDetail`, `useBookmarks` | Server-state fetch, cache, invalidation |
| **Mutations** | `useCreateMood`, `useReactToMood`, `useReportContent` | POST/PUT/DELETE with optimistic updates where safe |
| **UI** | `useMediaQuery`, `useDisclosure`, `useTheme` | Responsive and interaction state |
| **Upload** | `useImageUpload` | Presigned URL flow orchestration |

Custom hooks colocate with their feature module unless shared across two or more features.

### Services

Services are **thin API wrappers** around the shared Axios instance. They contain no React code.

| Service | Responsibility |
|---------|----------------|
| **apiClient** | Configured Axios instance: base URL, JWT interceptor, error normalizer |
| **authService** | Login, register, logout API calls |
| **moodService** | CRUD and feed endpoints for moods |
| **imageService** | Request presigned upload URL, confirm upload, request signed download URL |
| **commentService** | Comment CRUD |
| **reactionService** | Reaction set/remove |
| **bookmarkService** | Bookmark add/remove/list |
| **searchService** | Search and filter queries |
| **statisticsService** | Aggregated metrics and trending |
| **adminService** | Reports, moderation, users, audit |
| **notificationService** | Notification list and read state |

Exact endpoint paths are defined in `docs/api.md` — services map to those contracts.

### Utilities

| Utility area | Examples |
|--------------|----------|
| **Sanitization** | HTML/text safe rendering for user content |
| **Formatting** | Relative timestamps, number abbreviation |
| **Token** | Read/write/clear JWT from secure storage |
| **Errors** | Map API error codes to user-facing messages per `DESIGN.md` §Error States |
| **Validation helpers** | Shared Zod schema fragments |

### Types

TypeScript types are organized as:

- **`types/api/`** — Request and response DTOs mirroring `docs/api.md`
- **`types/domain/`** — Frontend domain models (Mood, Comment, MoodCategory, etc.)
- **`types/auth/`** — User session, role enum (Student, Administrator; Advisor TBD)

Public DTO types **exclude** author identity fields by design (`BR-ANON-001`).

### Assets

Static assets: logo, empty-state illustrations, font files, icon sets. Referenced from `assets/` and imported by components. User-uploaded images are **not** assets — they load from signed R2 URLs at runtime.

### Feature-Based Organization

Each feature module is self-contained:

```
features/<feature-name>/
├── components/     Feature-specific UI
├── hooks/          Query and mutation hooks
├── services/       API wrappers (or re-export from shared services)
├── types/          Feature-specific types
├── schemas/        Zod form schemas
└── index.ts        Public exports
```

**Feature modules** align with product domains:

| Feature | Scope |
|---------|-------|
| `landing` | Marketing page |
| `auth` | Register, login, logout |
| `feed` | Mood feed, pagination |
| `faculty` | Faculty feed and page header |
| `major` | Major feed and page header |
| `mood` | Create, detail, edit (if supported) |
| `comments` | Comment list and input (used by mood detail) |
| `reactions` | Reaction picker (used by mood and comments) |
| `bookmarks` | Bookmark list and toggle |
| `search` | Search bar integration and results |
| `statistics` | Dashboard, trending, charts |
| `notifications` | Notification list (Phase 3) |
| `admin` | All admin pages and moderation flows |
| `upload` | Image upload component and hook |

**Shared** module holds cross-feature components, hooks, contexts, and services.

---

## Backend Architecture

The backend follows Clean Architecture with an Express **delivery layer** on the outside.

### Layer Model

```
┌─────────────────────────────────────────────────────────┐
│  Routes           HTTP method + path → controller       │
├─────────────────────────────────────────────────────────┤
│  Controllers      Parse request, call service, respond  │
├─────────────────────────────────────────────────────────┤
│  Middlewares      Auth, rate limit, CORS, error handler │
├─────────────────────────────────────────────────────────┤
│  Validators       Zod / Express Validator schemas       │
├─────────────────────────────────────────────────────────┤
│  Services         Application / use case layer          │
├─────────────────────────────────────────────────────────┤
│  Domain           Entities, value objects, port IFs   │
├─────────────────────────────────────────────────────────┤
│  Repositories     Mongoose implementations of ports     │
├─────────────────────────────────────────────────────────┤
│  Models           Mongoose schemas (infrastructure)     │
├─────────────────────────────────────────────────────────┤
│  Adapters         R2 storage, JWT, bcrypt, logger       │
├─────────────────────────────────────────────────────────┤
│  Config / Constants / Types / Utils                     │
└─────────────────────────────────────────────────────────┘
```

### Routes

Routes map HTTP verbs and paths to controller methods. They apply middleware chains:

| Middleware order (typical protected route) | Purpose |
|---------------------------------------------|---------|
| 1. `cors` | Origin allowlist |
| 2. `rateLimiter` | Abuse prevention |
| 3. `authenticate` | JWT validation |
| 4. `authorize(role)` | RBAC where required |
| 5. `validate(schema)` | Request body/query validation |
| 6. `controller.method` | Handle request |

Route groups mirror feature domains: `auth`, `moods`, `comments`, `reactions`, `bookmarks`, `search`, `statistics`, `images`, `reports`, `admin`, `notifications`.

Route definitions live in `docs/api.md`. Routes contain **no business logic**.

### Controllers

Controllers are **thin adapters** between HTTP and application services:

1. Extract validated input from `req`
2. Call the appropriate application service
3. Map service result to HTTP response (status + JSON body)
4. Pass errors to the global error handler

Controllers do not import Mongoose models or query the database directly (`NFR-MAINT-003`).

### Services (Application Layer)

Services implement **use cases** — one service method per user-facing operation:

| Service (examples) | Use cases |
|--------------------|-----------|
| `AuthService` | Register, login, token refresh, password hash verification |
| `MoodService` | Create mood, get feed, get detail, delete (owner/admin) |
| `CommentService` | Add comment, list comments, delete |
| `ReactionService` | Set/remove reaction, aggregate counts |
| `BookmarkService` | Add/remove/list bookmarks |
| `SearchService` | Search and filter with pagination |
| `StatisticsService` | Aggregated metrics with threshold enforcement |
| `TrendingService` | Trending emotion calculation |
| `ImageService` | Issue presigned upload URL, confirm upload, issue signed download URL |
| `ReportService` | Submit report, list queue, resolve |
| `AdminService` | User management, audit log, moderation actions |
| `NotificationService` | Create and list notifications (Phase 3) |

Services:

- Enforce business rules (`BR-*` from `SPECS.md`)
- Call domain entities and domain services
- Invoke repository ports and infrastructure adapters
- Apply anonymity mapping for public responses
- Throw domain-specific errors mapped by the error handler

### Repositories

Repositories implement **port interfaces** defined in the domain layer:

| Port interface (examples) | Implementation |
|---------------------------|----------------|
| `IUserRepository` | `MongooseUserRepository` |
| `IMoodRepository` | `MongooseMoodRepository` |
| `ICommentRepository` | `MongooseCommentRepository` |
| `IReactionRepository` | `MongooseReactionRepository` |
| `IBookmarkRepository` | `MongooseBookmarkRepository` |
| `IReportRepository` | `MongooseReportRepository` |
| `ICategoryRepository` | `MongooseCategoryRepository` |
| `IAuditLogRepository` | `MongooseAuditLogRepository` |

Repositories encapsulate all Mongoose queries, projections, and aggregations. Schema details belong in `docs/database.md`.

### Models

Mongoose **schemas and models** live in the infrastructure layer. They define:

- Field types and constraints at persistence level
- Indexes (complementing `docs/database.md`)
- Timestamps, soft-delete flags for moderated content

Models are **not** domain entities. Mappers translate between Mongoose documents and domain entities at the repository boundary.

### Middlewares

| Middleware | Responsibility |
|------------|----------------|
| **authenticate** | Verify JWT signature and expiration; attach `userId` and `role` to request context |
| **authorize** | Assert required role (Student, Administrator) |
| **rateLimiter** | Per-IP or per-user limits on auth and write routes |
| **validate** | Run Zod or Express Validator schema against body, query, params |
| **errorHandler** | Catch all errors; map to structured JSON response |
| **requestLogger** | Log request metadata (not bodies with passwords) |
| **cors** | Enforce allowed origins per environment |

### Validators

Validation schemas are co-located by feature:

- **Request validators** — API ingress; reject unknown fields (`NFR-SEC-002`)
- **Shared Zod schemas** — Aligned with frontend form schemas where practical (`NFR-COMPAT-003`)

Validation confirms **shape and type**. Domain services confirm **business rules** (e.g., aggregation threshold, ownership, cooldown windows).

### Utils

| Utility | Purpose |
|---------|---------|
| **DTO mappers** | Domain entity → public API response (strip identity) |
| **Pagination helpers** | Cursor/offset encoding (strategy TBD per `SPECS.md` OD-005) |
| **Date/time** | UTC normalization (`BR-STAT-002`) |
| **Async handler** | Wrap controllers for promise error propagation |

### Configuration

Configuration module loads and validates environment variables at startup. Fails fast if required secrets are missing in production. See [Environment Variables](#environment-variables).

### Constants

Application-wide constants: role names, error codes, rate limit thresholds, default pagination sizes, mood category slugs (reference data — not schema).

### Types

Backend TypeScript types:

- **`types/express.d.ts`** — Extend Express Request with `userId`, `role`
- **`types/dto/`** — API request/response shapes
- **`types/domain/`** — Domain entities (framework-agnostic)

### Error Handling

See [Error Handling Strategy](#error-handling-strategy). Controllers and services throw typed errors; a single middleware formats all HTTP error responses.

---

## Data Flow

### Authentication Flow

```
User (Client)                Backend API              Application           Infrastructure
     │                            │                        │                      │
     │── POST credentials ───────►│                        │                      │
     │                            │── validate input ─────►│                      │
     │                            │                        │── find user ────────►│ MongoDB
     │                            │                        │◄── user document ────│
     │                            │                        │── verify bcrypt ─────►│ bcrypt
     │                            │                        │── sign JWT ──────────►│ JWT adapter
     │                            │◄── token + public user │                      │
     │◄── 200 { token, role } ────│    (no sensitive data) │                      │
     │                            │                        │                      │
     │── store JWT locally        │                        │                      │
     │                            │                        │                      │
     │── GET /protected ─────────►│                        │                      │
     │   Authorization: Bearer    │── authenticate JWT ───►│                      │
     │                            │── authorize role ─────►│                      │
     │                            │── use case ───────────►│                      │
     │                            │                        │── repository query ─►│ MongoDB
     │◄── 200 anonymous DTO ──────│◄── mapped response ────│◄─────────────────────│
```

**Key points:**

- JWT is stateless; no server-side session store required (`NFR-SCALE-003`).
- Token validated **before** business logic on every protected route (`BR-AUTH-003`).
- Public responses never include fields that identify post/comment authors (`BR-ANON-001`).

---

### Image Upload Flow

```
User (Client)           Backend API           Application          R2 Adapter        MongoDB
     │                       │                     │                   │                │
     │── request upload URL ─►│                     │                   │                │
     │   (mime, size, name)   │── authorize user ──►│                   │                │
     │                       │                     │── validate rules ─►│                │
     │                       │                     │── presign PUT ────►│ Cloudflare R2  │
     │◄── presigned URL ──────│◄────────────────────│◄──────────────────│                │
     │                       │                     │                   │                │
     │── PUT image binary ───────────────────────────────────────────►│ R2 (direct)    │
     │                       │                     │                   │                │
     │── confirm upload ─────►│                     │                   │                │
     │   (object key)         │── verify object ───►│── head object ───►│ R2             │
     │                       │                     │── save metadata ──────────────────────►│
     │◄── 200 { imageRef } ───│◄────────────────────│◄──────────────────────────────────│
     │                       │                     │                   │                │
     │── create mood ────────►│  (includes imageRef)│── link to post ─────────────────────►│
```

**Key points:**

- Binary never touches Railway server disk or memory beyond streaming validation if needed.
- Presigned URL generation target: **200 ms p95** (`NFR-PERF-002`).
- Only object key and metadata persist in MongoDB (`INT-DB-003`, `BR-IMG-003`).
- Orphan cleanup if post creation fails after upload (`BR-IMG-004`).

---

### Image Read Flow

```
User (Client)           Backend API           Application          R2 Adapter
     │                       │                     │                   │
     │── GET image access ───►│                     │                   │
     │   (imageRef / moodId)  │── authenticate ────►│                   │
     │                       │                     │── authorize view ─►│
     │                       │                     │── sign GET URL ───►│ R2
     │◄── signed download URL │◄────────────────────│◄──────────────────│
     │                       │                     │                   │
     │── GET image binary ────────────────────────────────────────────►│ R2 (direct)
     │◄── image data ───────────────────────────────────────────────────│
```

**Key points:**

- No permanent public URLs (`BR-IMG-003`).
- Signed URLs are time-limited.
- Authorization ensures requester may view the image in context (e.g., mood is accessible).

---

### Mood Feed Read Flow (Representative)

```
Client (TanStack Query)     Backend API        MoodService          MoodRepository       MongoDB
         │                       │                  │                     │                │
         │── GET /feed?page ─────►│                  │                     │                │
         │                       │── authenticate ─►│                     │                │
         │                       │── getFeed() ────►│                     │                │
         │                       │                  │── find paginated ──►│                │
         │                       │                  │                     │── query ──────►│
         │                       │                  │◄── domain entities ─│◄───────────────│
         │                       │                  │── map to public DTO │                │
         │                       │                  │   (strip identity)  │                │
         │◄── 200 { moods } ──────│◄─────────────────│                     │                │
         │── cache in QueryClient  │                  │                     │                │
```

---

### Statistics Aggregation Flow

```
Client                  Backend API       StatisticsService      MoodRepository        MongoDB
   │                         │                    │                     │                  │
   │── GET /statistics ─────►│                    │                     │                  │
   │   ?faculty&dateRange     │── authorize role ─►│                     │                  │
   │                         │── getStats() ─────►│                     │                  │
   │                         │                    │── aggregation ─────►│                  │
   │                         │                    │                     │── pipeline ─────►│
   │                         │                    │◄── raw counts ──────│◄─────────────────│
   │                         │                    │── apply threshold ──│                  │
   │                         │                    │   (BR-STAT-001)     │                  │
   │◄── 200 or threshold ─────│◄───────────────────│                     │                  │
   │    empty state            │                    │                     │                  │
```

---

## State Management Strategy

### Principle

**Server state and client state are separated.** Mood of the Major is data-heavy on the server side (feeds, statistics, admin queues). Client UI state is comparatively light.

### Server State — TanStack Query

All data fetched from the REST API is managed by **TanStack Query** (`INT-API-002`, `README.md`):

| Concern | TanStack Query feature |
|---------|------------------------|
| Fetching | `useQuery` per resource (feed, mood detail, statistics) |
| Caching | Stale-while-revalidate; configurable `staleTime` per resource type |
| Mutations | `useMutation` for create, react, bookmark, report |
| Invalidation | After mutation, invalidate related query keys (e.g., create mood → invalidate feed) |
| Pagination | `useInfiniteQuery` or page-param query (aligned with API strategy TBD) |
| Loading/error | Built-in `isLoading`, `isError`, `error` drive UI states (`NFR-UX-003`) |
| Deduplication | Parallel components requesting same data share one fetch |

**Query key convention (intent):** `['moods', 'feed', filters]`, `['moods', moodId]`, `['statistics', scope, dateRange]`, `['admin', 'reports', status]`.

Server data must **not** be copied into React Context or duplicated in uncontrolled local state.

### Client State — Local and Context

| State type | Storage | Examples |
|------------|---------|----------|
| **Auth session** | AuthContext + secure token storage | `userId`, `role`, `isAuthenticated` |
| **Theme** | ThemeContext + localStorage | `light`, `dark`, `system` |
| **Form draft** | React Hook Form internal state | Create mood text, selected category |
| **UI ephemeral** | `useState` / `useDisclosure` | Modal open, filter drawer, reaction picker |
| **Upload progress** | `useImageUpload` hook local state | Per-file progress before confirm |

### What Not to Use

- **Redux / Zustand for server data** — TanStack Query is authoritative for API state.
- **Context for feeds or moods** — Creates stale cache and bypasses Query invalidation.
- **URL state for filters** — Optional enhancement; search and faculty/major filters may sync to query params for shareability (future).

### Optimistic Updates

Apply optimistic updates only where rollback is safe and anonymity is preserved:

- **Reactions** — Optimistic count update; rollback on failure.
- **Bookmarks** — Optimistic toggle; rollback on failure.
- **Create mood** — Do **not** optimistically insert into feed; wait for server confirmation to ensure anonymity mapping and validation.

---

## Error Handling Strategy

### Backend

#### Error Categories

| Category | HTTP status | Example |
|----------|-------------|---------|
| **Validation** | 400 | Invalid mood category, missing required field |
| **Authentication** | 401 | Missing or expired JWT |
| **Authorization** | 403 | Student accessing admin route |
| **Not found** | 404 | Mood deleted or never existed |
| **Conflict** | 409 | Duplicate report within cooldown |
| **Rate limit** | 429 | Too many login attempts |
| **Domain rule** | 422 | Aggregation threshold not met (or 200 with empty payload — TBD in API doc) |
| **Internal** | 500 | Unexpected failure |

#### Error Response Envelope

All API errors return a **consistent JSON structure**:

| Field | Purpose |
|-------|---------|
| `code` | Machine-readable error code (e.g., `AUTH_INVALID_CREDENTIALS`) |
| `message` | Human-readable message safe for client display |
| `details` | Optional field-level validation errors |
| `requestId` | Correlation ID for log lookup |

**Never include:** stack traces, internal paths, MongoDB error strings, R2 bucket names (`NFR-SEC-009`).

#### Error Propagation

```
Service throws DomainError
        │
        ▼
Controller does not catch (async wrapper)
        │
        ▼
Global errorHandler middleware
        │
        ├── DomainError → mapped status + envelope
        ├── ValidationError → 400 + details
        └── Unknown → 500 + generic message; full error logged server-side
```

### Frontend

| Layer | Behavior |
|-------|----------|
| **Axios interceptor** | Normalize error envelope; attach `requestId` to logs |
| **TanStack Query** | `isError` triggers Error Banner or inline message per `DESIGN.md` |
| **React Hook Form** | Map `details` to field errors (`NFR-UX-002`) |
| **Toast** | Transient feedback for mutation failures |
| **Error Boundary** | Catch render errors; fallback UI for unexpected crashes |

User-facing copy follows `DESIGN.md` §Error States — calm, actionable, preserves drafts on post failure.

---

## Validation Strategy

Validation operates at **multiple boundaries**. Each layer has a distinct job; none replaces the others.

### Validation Layers

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Client form (Zod + React Hook Form)               │
│  Immediate UX feedback; optional fields, formats, lengths      │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: API ingress (Zod / Express Validator)             │
│  Authoritative shape check; reject unknown fields            │
├─────────────────────────────────────────────────────────────┤
│  Layer 3: Application / domain services                     │
│  Business rules: ownership, cooldowns, thresholds, RBAC    │
├─────────────────────────────────────────────────────────────┤
│  Layer 4: Persistence (Mongoose schema)                   │
│  Last-resort data integrity at database boundary             │
└─────────────────────────────────────────────────────────────┘
```

### Shared Schemas

Zod schemas for the same DTO should be **shared or mirrored** between frontend and backend where practical (`NFR-COMPAT-003`):

| Schema (examples) | Used by |
|-------------------|---------|
| `registerSchema` | Register form + auth route validator |
| `createMoodSchema` | Create mood form + moods route validator |
| `commentSchema` | Comment input + comments route validator |
| `reportSchema` | Report modal + reports route validator |

Shared schemas may live in a future `packages/shared` workspace or be duplicated with sync tests — decision at implementation time.

### Image Validation

| Check | Where |
|-------|-------|
| MIME type allowlist | Client (preview reject) + backend before presign (`BR-IMG-001`) |
| File size limit | Client + backend before presign (`BR-IMG-002`) |
| Object existence | Backend on upload confirm (head object in R2) |

### Anonymity Validation

Not a form validation concern — enforced in **application services** and **DTO mappers**:

- Public response builders must exclude `authorId`, `email`, and similar fields.
- Automated tests assert public DTOs contain no identity fields (`BR-ANON-001`).

---

## Logging Strategy

### Goals

| Goal | Requirement |
|------|-------------|
| **Debuggability** | Trace request flow with correlation IDs |
| **Security** | Never log passwords, JWTs, or PII in plain text |
| **Auditability** | Log all admin identity-access and moderation actions (`BR-ANON-004`, `NFR-SEC-010`) |
| **Operations** | Support production incident investigation on Railway |

### Log Levels

| Level | Usage |
|-------|-------|
| **error** | Unhandled exceptions, R2/DB connection failures |
| **warn** | Rate limit hits, repeated auth failures, threshold suppression |
| **info** | Request completed, admin actions, startup configuration |
| **debug** | Development-only verbose tracing |

Production default: `info`. `debug` enabled only in development.

### What to Log

| Event | Fields |
|-------|--------|
| **HTTP request** | `requestId`, method, path, status, duration, userId (if auth) |
| **Auth failure** | `requestId`, IP, path (not password) |
| **Admin moderation** | `adminId`, action, target type, target id, timestamp |
| **Admin identity access** | `adminId`, resource, reason, timestamp |
| **R2 operation failure** | `requestId`, operation, object key (not signed URL) |
| **Aggregation suppressed** | scope, reason: below threshold |

### What Never to Log

- Passwords or bcrypt hashes
- Full JWT tokens
- Request bodies containing credentials
- Student identity linked to anonymous post content in standard request logs (admin audit is separate, access-controlled)

### Implementation Intent

- Structured JSON logs in production (Railway log aggregation).
- `requestId` generated per request; returned in error responses.
- Audit log entries also **persisted to MongoDB** via `IAuditLogRepository` for admin accountability — application logs are not the sole audit record.

---

## Environment Variables

Environment variables are validated at backend startup and documented fully in `docs/deployment.md`. Below is the architectural catalog of **required categories** — not an implementation manifest.

### Backend (Railway)

| Variable category | Purpose | Sensitivity |
|-------------------|---------|-------------|
| `NODE_ENV` | `development` \| `staging` \| `production` | Public |
| `PORT` | HTTP listen port | Public |
| `MONGODB_URI` | Atlas connection string | **Secret** |
| `JWT_SECRET` | Token signing key | **Secret** |
| `JWT_EXPIRES_IN` | Access token lifetime | Config |
| `JWT_REFRESH_*` | Refresh token config (TBD per `docs/authentication.md`) | Config / Secret |
| `BCRYPT_ROUNDS` | Hash cost factor | Config |
| `R2_ACCOUNT_ID` | Cloudflare account | **Secret** |
| `R2_ACCESS_KEY_ID` | R2 API key | **Secret** |
| `R2_SECRET_ACCESS_KEY` | R2 API secret | **Secret** |
| `R2_BUCKET_NAME` | Private bucket name | Config |
| `R2_PUBLIC_URL` / endpoint | R2 S3-compatible endpoint | Config |
| `CORS_ALLOWED_ORIGINS` | Comma-separated frontend origins | Config |
| `RATE_LIMIT_*` | Window and max requests | Config |
| `LOG_LEVEL` | Logging verbosity | Config |
| `AGGREGATION_THRESHOLD_MIN` | Minimum group size for statistics | Config |

### Frontend (Vercel)

| Variable category | Purpose | Sensitivity |
|-------------------|---------|-------------|
| `VITE_API_BASE_URL` | Backend REST API origin | Public (build-time) |
| `VITE_APP_ENV` | Environment label for client behavior | Public |
| `VITE_*` (feature flags) | Optional toggles | Public |

### Rules

- Secrets stored in Railway/Vercel secret managers and GitHub encrypted secrets — **never in source control** (`NFR-SEC-006`).
- Frontend env vars prefixed for Vite exposure; no backend secrets in `VITE_*`.
- `.env.example` files (without values) will list variables at implementation time.
- Staging and production use separate Atlas clusters and R2 buckets.

---

## Folder Structure

The following describes the **intended application folder structure** at implementation time. These directories do not exist yet in the documentation-phase repository.

### Repository Root (Future)

```
mood-of-the-major/
├── README.md
├── SPECS.md
├── DESIGN.md
├── docs/
├── .cursor/
├── .github/
├── frontend/                  # React SPA (Vercel)
├── backend/                   # Express API (Railway)
└── packages/                  # Optional: shared Zod schemas, types
    └── shared/
```

### Frontend Structure

```
frontend/
├── public/                    # Static public assets (favicon, robots.txt)
├── src/
│   ├── app/                   # App bootstrap, router, providers
│   │   ├── App.tsx
│   │   ├── router.tsx         # React Router route definitions
│   │   └── providers.tsx      # QueryClient, AuthContext, ThemeContext
│   │
│   ├── pages/                 # Route-level page components (thin)
│   │   ├── LandingPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── FeedPage.tsx
│   │   ├── MoodDetailPage.tsx
│   │   ├── StatisticsPage.tsx
│   │   └── admin/
│   │       ├── AdminOverviewPage.tsx
│   │       └── ReportQueuePage.tsx
│   │
│   ├── layouts/
│   │   ├── PublicLayout.tsx
│   │   ├── AuthLayout.tsx
│   │   ├── StudentLayout.tsx
│   │   └── AdminLayout.tsx
│   │
│   ├── features/              # Feature-based modules
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── schemas/
│   │   │   └── index.ts
│   │   ├── feed/
│   │   ├── faculty/
│   │   ├── major/
│   │   ├── mood/
│   │   ├── comments/
│   │   ├── reactions/
│   │   ├── bookmarks/
│   │   ├── search/
│   │   ├── statistics/
│   │   ├── notifications/
│   │   ├── upload/
│   │   └── admin/
│   │
│   ├── shared/
│   │   ├── components/      # Navbar, MoodCard, Modal, Pagination, etc.
│   │   ├── hooks/
│   │   ├── contexts/        # AuthContext, ThemeContext
│   │   ├── services/        # apiClient, feature service wrappers
│   │   ├── utils/           # sanitize, format, token helpers
│   │   ├── types/           # api, domain, auth types
│   │   └── constants/
│   │
│   ├── assets/              # Fonts, illustrations, icons
│   └── styles/              # Tailwind entry, global CSS variables
│
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```

**Organization rules:**

- `pages/` import from `features/` and `layouts/` — pages stay thin.
- `shared/components/` holds cross-feature UI from `DESIGN.md` §Component Design.
- Feature folders do not import from sibling features directly; shared code goes to `shared/`.
- Colocate feature tests under `features/<name>/__tests__/` or `frontend/tests/`.

### Backend Structure

```
backend/
├── src/
│   ├── index.ts               # Application entry point
│   ├── app.ts                 # Express app factory
│   │
│   ├── routes/                # Route definitions only
│   │   ├── index.ts           # Route aggregator
│   │   ├── auth.routes.ts
│   │   ├── mood.routes.ts
│   │   ├── comment.routes.ts
│   │   ├── image.routes.ts
│   │   ├── statistics.routes.ts
│   │   └── admin.routes.ts
│   │
│   ├── controllers/           # Thin HTTP adapters
│   │   ├── auth.controller.ts
│   │   ├── mood.controller.ts
│   │   └── ...
│   │
│   ├── middlewares/
│   │   ├── authenticate.ts
│   │   ├── authorize.ts
│   │   ├── rateLimiter.ts
│   │   ├── validate.ts
│   │   ├── errorHandler.ts
│   │   └── requestLogger.ts
│   │
│   ├── validators/            # Zod / Express Validator schemas
│   │   ├── auth.validator.ts
│   │   ├── mood.validator.ts
│   │   └── ...
│   │
│   ├── application/           # Use case services
│   │   ├── services/
│   │   │   ├── AuthService.ts
│   │   │   ├── MoodService.ts
│   │   │   ├── ImageService.ts
│   │   │   ├── StatisticsService.ts
│   │   │   └── ...
│   │   └── mappers/           # Entity → public DTO (anonymity stripping)
│   │       ├── mood.mapper.ts
│   │       └── ...
│   │
│   ├── domain/                # Core business layer (no framework imports)
│   │   ├── entities/
│   │   │   ├── Mood.ts
│   │   │   ├── User.ts
│   │   │   └── ...
│   │   ├── value-objects/
│   │   │   ├── MoodCategory.ts
│   │   │   └── ...
│   │   ├── ports/             # Repository and adapter interfaces
│   │   │   ├── IMoodRepository.ts
│   │   │   ├── IImageStorage.ts
│   │   │   └── ...
│   │   ├── services/          # Pure domain logic
│   │   │   └── AnonymityPolicy.ts
│   │   └── errors/
│   │       └── DomainError.ts
│   │
│   ├── infrastructure/
│   │   ├── database/
│   │   │   ├── connection.ts
│   │   │   ├── models/        # Mongoose schemas
│   │   │   │   ├── Mood.model.ts
│   │   │   │   └── ...
│   │   │   └── repositories/  # Port implementations
│   │   │       ├── MongooseMoodRepository.ts
│   │   │       └── ...
│   │   ├── storage/
│   │   │   └── R2ImageStorage.ts
│   │   ├── auth/
│   │   │   ├── JwtTokenService.ts
│   │   │   └── BcryptPasswordHasher.ts
│   │   └── logging/
│   │       └── Logger.ts
│   │
│   ├── config/
│   │   ├── env.ts             # Validated environment loader
│   │   └── cors.ts
│   │
│   ├── constants/
│   │   ├── roles.ts
│   │   ├── errorCodes.ts
│   │   └── pagination.ts
│   │
│   ├── types/
│   │   ├── express.d.ts
│   │   └── dto/
│   │
│   └── utils/
│       ├── asyncHandler.ts
│       └── pagination.ts
│
├── tests/
│   ├── unit/                  # Domain and application service tests
│   ├── integration/           # API + in-memory DB tests
│   └── fixtures/
│
├── package.json
├── tsconfig.json
└── .env.example
```

**Organization rules:**

- `domain/` has **zero** imports from `express`, `mongoose`, or AWS/R2 SDKs.
- `application/services/` imports `domain/` ports, not Mongoose models.
- `infrastructure/` implements ports and is wired via dependency injection at `app.ts` startup.
- `controllers/` and `routes/` never import from `infrastructure/database/models/` directly.
- Anonymity mapping happens in `application/mappers/` before any public response leaves the backend.

### Cross-Cutting: Shared Package (Optional)

```
packages/shared/
├── schemas/                   # Zod schemas used by frontend and backend
├── types/                     # Shared DTO type definitions
└── constants/                 # Error codes, roles
```

Introduce when schema duplication becomes a maintenance burden. Not required for Phase 1.

---

## Related Documents

| Document | Relationship to this architecture |
|----------|-----------------------------------|
| [`README.md`](../README.md) | Authoritative project overview and stack |
| [`SPECS.md`](../SPECS.md) | Requirements this architecture must satisfy |
| [`DESIGN.md`](../DESIGN.md) | UI pages and components mapped to frontend structure |
| [`docs/api.md`](./api.md) | REST endpoint contracts (to be authored) |
| [`docs/database.md`](./database.md) | Mongoose schemas and indexes (to be authored) |
| [`docs/authentication.md`](./authentication.md) | JWT and refresh strategy |
| [`docs/cloudflare-r2.md`](./cloudflare-r2.md) | R2 bucket and presigned URL configuration |
| [`docs/security.md`](./security.md) | Threat model and policies |
| [`docs/deployment.md`](./deployment.md) | Environment setup and CI/CD |
| [`.cursor/rules/architecture.mdc`](../.cursor/rules/architecture.mdc) | AI enforcement of layer boundaries |

### Architectural Decision Records

Significant deviations from this document or the README stack must be recorded here as ADRs:

| ADR | Title | Status |
|-----|-------|--------|
| ADR-001 | Clean Architecture with Express and React | Accepted |
| ADR-002 | Stateless JWT authentication | Accepted |
| ADR-003 | Private R2 bucket with presigned URLs | Accepted |
| ADR-004 | TanStack Query for server state | Accepted |
| ADR-005 | TypeScript on frontend and backend | Accepted |
| ADR-006 | Feature-based frontend organization | Accepted |
| ADR-007 | Repository pattern for all database access | Accepted |

---

## Document Maintenance

| Event | Action |
|-------|--------|
| New feature in SPECS | Update data flows, folder structure, and services |
| API designed in `docs/api.md` | Cross-reference route and service tables |
| Database designed in `docs/database.md` | Update repository and model sections |
| Open decision resolved | Remove TBD notes; update ADR if needed |
| Implementation divergence found | Log in `PROJECT_AUDIT.md`; add ADR |

---

*This architecture document derives from [`README.md`](../README.md), [`SPECS.md`](../SPECS.md), and [`DESIGN.md`](../DESIGN.md). All implementation must conform to Clean Architecture layer boundaries defined here and in `.cursor/rules/architecture.mdc`.*
