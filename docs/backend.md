# Mood of the Major — Backend Architecture

> **Document type:** Backend engineering specification  
> **Status:** Draft v1.0  
> **Authority:** Derives from [`README.md`](../README.md), [`SPECS.md`](../SPECS.md), [`DESIGN.md`](../DESIGN.md), [`architecture.md`](./architecture.md), [`database.md`](./database.md), [`api.md`](./api.md), [`authentication.md`](./authentication.md), [`cloudflare-r2.md`](./cloudflare-r2.md), and [`security.md`](./security.md). Where conflict exists, `README.md` takes precedence.

---

## Table of Contents

1. [Backend Philosophy](#backend-philosophy)
2. [Technology Stack](#technology-stack)
3. [Folder Structure](#folder-structure)
4. [Clean Architecture](#clean-architecture)
5. [Request Lifecycle](#request-lifecycle)
6. [API Layer](#api-layer)
7. [Business Layer](#business-layer)
8. [Data Layer](#data-layer)
9. [Validation Strategy](#validation-strategy)
10. [Error Handling Strategy](#error-handling-strategy)
11. [Logging Strategy](#logging-strategy)
12. [Environment Configuration](#environment-configuration)
13. [Performance Considerations](#performance-considerations)
14. [Scalability Strategy](#scalability-strategy)
15. [Security Responsibilities](#security-responsibilities)
16. [Cloudflare R2 Integration](#cloudflare-r2-integration)
17. [Background Jobs (Future)](#background-jobs-future)
18. [Best Practices](#best-practices)
19. [Future Backend Improvements](#future-backend-improvements)
20. [Related Documents](#related-documents)

---

## Backend Philosophy

The Mood of the Major backend is a **stateless REST API** that orchestrates business rules, persistence, and external integrations. It is the authoritative enforcement point for anonymity, authorization, validation, and data integrity — the frontend renders what the API returns, but the API decides what is safe to expose (`NFR-PRIV-003`).

### Guiding Principles

| Principle | Backend implication |
|-----------|---------------------|
| **Clean Architecture** | Business rules live in domain and application layers; Express and Mongoose are replaceable details (`NFR-MAINT-001`). |
| **Thin delivery layer** | Routes and controllers translate HTTP ↔ use cases — they do not contain business logic (`README.md` Coding Standards). |
| **Security by default** | JWT validation, input validation, and RBAC run before use case execution (`BR-AUTH-003`, `NFR-SEC-002`). |
| **Anonymity in the API** | Public DTOs strip `authorId`, `userId`, and `email` — not merely hidden in UI (`BR-ANON-001`). |
| **Repository pattern** | All MongoDB access through repository implementations — no Mongoose in controllers (`NFR-MAINT-003`). |
| **Private media** | Image binaries never touch the server; R2 access is mediated via presigned URLs (`FR-IMG-007`). |
| **Fail fast on config** | Missing production secrets prevent startup (`architecture.md` Configuration). |
| **Structured errors** | Consistent JSON error envelope; no internal leakage (`NFR-SEC-009`). |
| **Convention over configuration** | Predictable folder layout and naming so engineers and AI agents locate logic quickly. |

### What the Backend Owns

| Responsibility | Owner |
|----------------|-------|
| HTTP API contract (`/api/v1/*`) | API layer |
| Authentication and authorization | Middleware + application services |
| Business rules and orchestration | Application services |
| Domain invariants (anonymity, thresholds) | Domain layer |
| MongoDB persistence | Infrastructure repositories |
| R2 presign/sign/delete | Infrastructure `IImageStorage` adapter |
| JWT issuance and bcrypt | Infrastructure auth adapters |
| Audit log persistence | `AuditLogRepository` |
| Rate limiting and CORS | Middleware |
| Background job triggers (future) | Scheduled workers |

### What the Backend Does Not Own

| Concern | Owner |
|---------|-------|
| UI rendering and UX states | Frontend (React/Vite) |
| Client-side form UX validation | Frontend (Zod + React Hook Form) |
| Direct R2 binary upload/download transport | Browser client (presigned URLs) |
| TLS termination | Railway platform |
| Frontend CSP and static hosting | Vercel |

---

## Technology Stack

The backend stack is mandated by `README.md` and `SPECS.md` §9.5. Deviations require an ADR in `architecture.md`.

| Technology | Role |
|------------|------|
| **Node.js** | JavaScript runtime on Railway |
| **TypeScript** | Type safety across layers (`NFR-MAINT-005`) |
| **Express.js** | HTTP server and routing framework |
| **MongoDB Atlas** | Managed document database |
| **Mongoose** | ODM for schemas, validation, and queries |
| **JWT** | Stateless access authentication |
| **bcrypt** | Password hashing |
| **Zod** | Request validation and env schema |
| **Express Validator** | Optional complement to Zod at API boundary |
| **Helmet** | Security HTTP headers (`security.md`) |
| **Cloudflare R2 SDK** | S3-compatible object storage adapter |

### Why Express.js Was Selected

Express.js is the HTTP framework for this project because it best matches deployment, architecture, and team constraints:

| Factor | Rationale |
|--------|-----------|
| **Railway compatibility** | First-class Node.js hosting with simple process model — no container orchestration required for v1 (`INT-DEP-002`). |
| **Clean Architecture fit** | Express acts as a thin **delivery layer** on the outside. Routes and controllers map HTTP to use cases without coupling business logic to the framework (`architecture.md` ADR-001). |
| **Ecosystem maturity** | Extensive middleware ecosystem for JWT auth, rate limiting, CORS, Helmet, and validation — all required by `security.md`. |
| **Team scalability** | Well-understood patterns; extensive documentation lowers onboarding cost for a small team (`README.md` Development Philosophy). |
| **Stateless REST** | Express handles stateless request/response cycles naturally — aligns with JWT auth and horizontal scaling (`NFR-SCALE-003`). |
| **Flexibility without opinion** | Unlike full-stack frameworks, Express does not impose ORM or project structure — Clean Architecture folder layout remains explicit. |
| **Performance adequacy** | I/O-bound workload (MongoDB, R2 signing) suits Node.js event loop; feed p95 target 500 ms is achievable with indexed queries (`NFR-PERF-001`). |

Express is **not** chosen for real-time features (WebSocket feeds are future scope per `README.md` Future Improvements). When those arrive, Express may coexist with a separate WebSocket service or upgrade path — documented as future backend improvement.

---

## Folder Structure

The backend lives in `backend/` at repository root (`architecture.md`). The structure below is the **production-ready target** at implementation time.

```
backend/
├── src/
│   ├── index.ts                 # Process entry — starts HTTP server
│   ├── app.ts                   # Express app factory, middleware, DI wiring
│   │
│   ├── routes/                  # HTTP routing only
│   ├── controllers/             # Thin HTTP adapters
│   ├── middlewares/             # Cross-cutting HTTP concerns
│   ├── validators/              # Zod / Express Validator schemas
│   │
│   ├── application/             # Use case layer
│   │   ├── services/            # Application services (use cases)
│   │   └── mappers/           # Entity → public/admin DTO
│   │
│   ├── domain/                  # Business core (no framework imports)
│   │   ├── entities/
│   │   ├── value-objects/
│   │   ├── ports/
│   │   ├── services/
│   │   └── errors/
│   │
│   ├── infrastructure/          # Port implementations
│   │   ├── database/
│   │   │   ├── connection.ts
│   │   │   ├── models/
│   │   │   └── repositories/
│   │   ├── storage/
│   │   ├── auth/
│   │   └── logging/
│   │
│   ├── config/
│   ├── constants/
│   ├── types/
│   └── utils/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│
├── package.json
├── tsconfig.json
└── .env.example
```

### Layer Responsibilities

#### `routes/`

| Responsibility | Detail |
|----------------|--------|
| Map HTTP method + path to controller method | Per `docs/api.md` contracts |
| Attach middleware chains | CORS, rate limit, auth, validate |
| Group by feature domain | `auth`, `moods`, `comments`, `reactions`, `bookmarks`, `search`, `statistics`, `images`, `reports`, `admin`, `notifications` |
| Export route aggregator | `routes/index.ts` mounts all groups under `/api/v1` |

**Must not:** Contain business logic, database queries, or response mapping beyond delegation.

#### `controllers/`

| Responsibility | Detail |
|----------------|--------|
| Extract validated input from `req` | Body, params, query after middleware validation |
| Invoke application service | One controller method → one service method |
| Map result to HTTP response | Status code + `{ success, data, meta }` envelope |
| Propagate errors | Async wrapper passes to `errorHandler` |

**Must not:** Import Mongoose models, call repositories directly, or implement anonymity rules inline.

#### `application/services/` (Services)

| Responsibility | Detail |
|----------------|--------|
| Implement use cases | One public method per user-facing operation |
| Enforce business rules | `BR-*` rules from `SPECS.md` |
| Coordinate repositories and adapters | Via domain port interfaces |
| Throw domain errors | Mapped by global error handler |
| Trigger audit log writes | On admin identity access and moderation |

**Must not:** Import Express `Request`/`Response` types or depend on HTTP concepts.

#### `infrastructure/database/repositories/` (Repositories)

| Responsibility | Detail |
|----------------|--------|
| Implement domain port interfaces | e.g., `IMoodRepository` → `MongooseMoodRepository` |
| Encapsulate Mongoose queries | Projections, indexes, aggregations |
| Map documents ↔ domain entities | At repository boundary |
| Enforce projection profiles | `publicProfile` excludes identity fields |

**Must not:** Be called from controllers directly — only from application services.

#### `infrastructure/database/models/` (Models)

| Responsibility | Detail |
|----------------|--------|
| Define Mongoose schemas | Field types, indexes, timestamps per `database.md` |
| Persistence-level validation | Last-resort integrity |
| Collection mapping | 15 collections per `database.md` catalog |

**Must not:** Be treated as domain entities or returned directly in API responses.

#### `middlewares/`

| Middleware | Responsibility |
|------------|----------------|
| `requestLogger` | Assign `requestId`; log request metadata |
| Helmet (via `app.ts`) | Security headers (`security.md`) |
| `cors` | Origin allowlist |
| `rateLimiter` | Per-IP and per-user limits (`api.md`) |
| `authenticate` | JWT validation; attach `userId`, `role` |
| `authorize` | RBAC role assertion |
| `validate` | Run Zod schema on request |
| `errorHandler` | Global error → JSON envelope |

#### `validators/`

| Responsibility | Detail |
|----------------|--------|
| Zod schemas per feature | `auth.validator.ts`, `mood.validator.ts`, etc. |
| Reject unknown fields | On strict schemas (`NFR-SEC-002`) |
| Mirror frontend schemas | Where practical (`NFR-COMPAT-003`) |

#### `utils/`

| Utility | Purpose |
|---------|---------|
| `asyncHandler` | Wrap async controllers for error propagation |
| Pagination helpers | Cursor encode/decode (`api.md` cursor strategy) |
| Date/time helpers | UTC normalization (`BR-STAT-002`) |

#### `config/`

| Module | Purpose |
|--------|---------|
| `env.ts` | Load and validate environment variables at startup |
| `cors.ts` | CORS options per environment |

Fails fast in production if required secrets are missing.

#### `constants/`

| File | Contents |
|------|----------|
| `roles.ts` | `student`, `administrator`, `advisor` |
| `errorCodes.ts` | Machine-readable codes matching `api.md` |
| `pagination.ts` | Default limit 20, max 50 |
| `rateLimits.ts` | Thresholds per endpoint group |

#### `types/`

| Path | Purpose |
|------|---------|
| `express.d.ts` | Extend `Request` with `userId`, `role`, `requestId` |
| `dto/` | API request/response TypeScript shapes |
| `domain/` | Framework-agnostic entity types |

#### `domain/` (Supporting Clean Architecture)

| Subfolder | Purpose |
|-----------|---------|
| `entities/` | Core business objects (`Mood`, `User`) |
| `value-objects/` | `MoodCategory`, pagination cursor |
| `ports/` | `IMoodRepository`, `IImageStorage`, `IAuthTokenService` |
| `services/` | Pure logic e.g., `AnonymityPolicy`, threshold checks |
| `errors/` | `DomainError` hierarchy |

#### `infrastructure/` (Adapters)

| Subfolder | Purpose |
|-----------|---------|
| `storage/R2ImageStorage.ts` | Implements `IImageStorage` |
| `auth/JwtTokenService.ts` | JWT sign/verify |
| `auth/BcryptPasswordHasher.ts` | Password hash/compare |
| `logging/Logger.ts` | Structured JSON logger |

### Dependency Injection

At `app.ts` startup:

1. Instantiate infrastructure adapters and repositories.
2. Inject port implementations into application services.
3. Inject services into controllers.
4. Mount routes with controller references.

No global singletons for repositories — explicit wiring aids testing.

---

## Clean Architecture

Implements `README.md` High-Level Architecture and `NFR-MAINT-001`.

### Dependency Direction

Dependencies point **inward**. Outer layers depend on inner abstractions; the domain depends on nothing external.

```
HTTP Request
     │
     ▼
┌─────────────────────────────────────────┐
│  Delivery: routes, controllers,         │
│  middlewares, validators                │
└─────────────────┬───────────────────────┘
                  │ depends on
                  ▼
┌─────────────────────────────────────────┐
│  Application: services, mappers         │
└─────────────────┬───────────────────────┘
                  │ depends on
                  ▼
┌─────────────────────────────────────────┐
│  Domain: entities, ports, domain        │
│  services, errors                       │
└─────────────────┬───────────────────────┘
                  ▲
                  │ implements
┌─────────────────┴───────────────────────┐
│  Infrastructure: Mongoose repos, R2,    │
│  JWT, bcrypt, logger                    │
└─────────────────────────────────────────┘
```

**Forbidden imports:**

| From | Must never import |
|------|-------------------|
| `domain/` | `express`, `mongoose`, R2 SDK |
| `application/` | `express`, Mongoose models |
| `controllers/` | Mongoose models, R2 SDK |
| `routes/` | Application services directly (go through controllers) |

### Separation of Concerns

| Concern | Layer | Example |
|---------|-------|---------|
| HTTP status codes | Controller | `201` on mood create |
| JWT parsing | Middleware | `authenticate` |
| Role check | Middleware + service | `authorize('administrator')` |
| Ownership check | Application service | `authorId === userId` |
| Anonymity stripping | Mapper | Remove `authorId` from public DTO |
| Aggregation threshold | Domain service + StatisticsService | `meetsThreshold` gating |
| MongoDB query | Repository | Feed pagination query |
| Presigned URL | R2 adapter | Called by `ImageService` |

Violations — anonymity only in React, Mongoose in controllers — are architectural defects (`NFR-MAINT-002`).

### Repository Pattern

Implements `INT-DB-004`, `NFR-MAINT-003`.

| Concept | Detail |
|---------|--------|
| **Port** | Interface in `domain/ports/` — e.g., `IMoodRepository.findPublicFeed(filters, cursor)` |
| **Adapter** | `MongooseMoodRepository` in `infrastructure/database/repositories/` |
| **Projection profiles** | `publicProfile` strips identity; `adminProfile` includes `authorId` with audit trigger |
| **Testing** | Services tested with in-memory mock repositories |
| **Swappability** | MongoDB could be replaced without changing application services |

Repository catalog aligned with `database.md` collections:

| Port | Implementation | Collection |
|------|----------------|------------|
| `IUserRepository` | `MongooseUserRepository` | `users` |
| `IMoodRepository` | `MongooseMoodRepository` | `moods` |
| `ICommentRepository` | `MongooseCommentRepository` | `comments` |
| `IReactionRepository` | `MongooseReactionRepository` | `reactions` |
| `IBookmarkRepository` | `MongooseBookmarkRepository` | `bookmarks` |
| `IReportRepository` | `MongooseReportRepository` | `reports` |
| `INotificationRepository` | `MongooseNotificationRepository` | `notifications` |
| `ITagRepository` | `MongooseTagRepository` | `tags` |
| `IMoodImageRepository` | `MongooseMoodImageRepository` | `moodimages` |
| `IEmotionStatisticsRepository` | `MongooseEmotionStatisticsRepository` | `emotionstatistics` |
| `IDailyStatisticsRepository` | `MongooseDailyStatisticsRepository` | `dailystatistics` |
| `IAuditLogRepository` | `MongooseAuditLogRepository` | `auditlogs` |
| `IFacultyRepository` | `MongooseFacultyRepository` | `faculties` |
| `IMajorRepository` | `MongooseMajorRepository` | `majors` |

### Service Layer

Application services are the **use case entry point** — one service per domain area:

| Service | Primary use cases |
|---------|-------------------|
| `AuthService` | Register, login, logout, refresh, change password |
| `MoodService` | Create, update, delete, get detail, feeds |
| `CommentService` | Create, list, update, delete comments |
| `ReactionService` | Upsert/remove reactions; update denormalized counts |
| `BookmarkService` | Add, remove, list bookmarks |
| `SearchService` | Full-text search with filters |
| `StatisticsService` | Dashboard metrics with threshold enforcement |
| `TrendingService` | Trending emotion calculation |
| `ImageService` | Presign upload, confirm, signed download, delete |
| `ReportService` | Submit, admin queue, resolve |
| `AdminService` | User management, moderation, dashboard KPIs |
| `NotificationService` | Create, list, mark read (Phase 3) |

Service method pattern:

1. Receive domain inputs (not HTTP objects).
2. Validate business rules (ownership, cooldowns, limits).
3. Call repositories and adapters.
4. Return domain result or DTO-ready entity.
5. Throw typed `DomainError` on failure.

---

## Request Lifecycle

End-to-end flow from HTTP request to HTTP response.

### Lifecycle Diagram

```
Client HTTPS Request
        │
        ▼
┌───────────────────┐
│ Railway TLS       │  Terminate TLS
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ requestLogger     │  Generate requestId
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ Helmet            │  Security headers
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ cors              │  Origin check
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ rateLimiter       │  Abuse prevention
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ authenticate      │  JWT (if protected route)
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ authorize         │  RBAC (if required)
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ validate          │  Zod schema
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ Controller        │  Extract input → call service
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ Application       │  Business rules, orchestration
│ Service           │
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ Repository /      │  MongoDB, R2, JWT, bcrypt
│ Adapter           │
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ Mapper (if read)  │  Strip identity for public DTO
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ Controller        │  Format { success, data, meta }
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ JSON HTTP         │  2xx / 4xx / 5xx
│ Response          │
└───────────────────┘

(Errors at any step → errorHandler → JSON error envelope)
```

### Lifecycle Rules

| Rule | Detail |
|------|--------|
| Auth before business logic | `BR-AUTH-003` |
| Validation before service | Shape at middleware; rules in service |
| No anonymous bypass | Public routes explicitly listed in `authentication.md` |
| Errors never skip handler | All async controllers wrapped |
| `requestId` in all error responses | Correlation for support and logs |

### Representative Flows

| Operation | Service | Repositories / adapters |
|-----------|---------|-------------------------|
| Login | `AuthService` | `IUserRepository`, `BcryptPasswordHasher`, `JwtTokenService` |
| Create mood | `MoodService` | `IMoodRepository`, `ITagRepository`, `IMoodImageRepository` |
| Mood feed | `MoodService` | `IMoodRepository` (public projection) |
| Upload presign | `ImageService` | `IMoodImageRepository`, `IImageStorage` |
| Statistics dashboard | `StatisticsService` | `IEmotionStatisticsRepository`, `IDailyStatisticsRepository` |
| Admin remove mood | `AdminService` | `IMoodRepository`, `IAuditLogRepository` |

---

## API Layer

The API layer is the **HTTP delivery boundary** — routes, controllers, middlewares, and validators.

### Routes → Controllers

| Pattern | Detail |
|---------|--------|
| **Registration** | `router.post('/moods', authenticate, authorize('student'), validate(createMoodSchema), moodController.create)` |
| **Path prefix** | All routes under `/api/v1` (`api.md` versioning) |
| **Route file** | One file per domain; aggregated in `routes/index.ts` |
| **Contract source** | `docs/api.md` is authoritative for paths, methods, and auth |

Routes declare **which** middleware runs and **which** controller method handles the request. They do not parse bodies or format responses.

### Controller Responsibilities

| Step | Action |
|------|--------|
| 1 | Read validated data from `req` (body, params, query) |
| 2 | Read `userId` and `role` from request context (if authenticated) |
| 3 | Call single service method with plain arguments |
| 4 | On success: return `res.status(XXX).json({ success: true, data, meta })` |
| 5 | On failure: throw or `next(error)` — never format errors inline |

### Response Envelope

All success responses follow `api.md` Standard Response Format:

| Field | Required |
|-------|----------|
| `success` | `true` |
| `data` | Resource or array |
| `meta` | Optional — pagination cursor, counts, threshold notices |

### Public vs Admin Responses

| Context | Mapper |
|---------|--------|
| Student/public endpoints | `application/mappers/` — anonymous DTO |
| Admin endpoints | Admin DTO — may include `authorId`; triggers audit on identity fields |

---

## Business Layer

The business layer comprises **application services**, **mappers**, and **domain** logic.

### Application Services

Services orchestrate use cases without knowing about HTTP:

| Category | Examples |
|----------|----------|
| **Authorization** | Verify `authorId === userId` for edit/delete |
| **Anonymity** | Delegate mapping to mappers; never return identity in public methods |
| **Validation rules** | Edit window 24h (`OD-012`), report cooldown, max 4 images |
| **Threshold enforcement** | `StatisticsService` checks `AGGREGATION_THRESHOLD_MIN` (`security.md`) |
| **Denormalization** | Update `commentCount`, `reactionSummary` on write |
| **Cascades** | Mood delete → image soft-delete → R2 cleanup job enqueue |
| **Audit** | `AdminService` writes `auditlogs` on moderation and identity access |

### Domain Services

Pure logic without I/O — testable in isolation:

| Service | Responsibility |
|---------|----------------|
| `AnonymityPolicy` | Rules for which fields are public vs internal |
| `AggregationThresholdPolicy` | Whether counts may be returned for a scope |
| `MoodEditPolicy` | Whether edit window is still open |

### Mappers

Located in `application/mappers/`:

| Mapper | Transforms |
|--------|------------|
| `mood.mapper` | Domain mood → public anonymous DTO |
| `comment.mapper` | Domain comment → anonymous DTO |
| `admin.mood.mapper` | Domain mood → admin DTO with identity |

Mappers are the **last line** before public responses leave the backend (`BR-ANON-001`).

---

## Data Layer

The data layer is **infrastructure** — Mongoose models and repository implementations.

### Repository → MongoDB Communication

| Practice | Detail |
|----------|--------|
| **Connection** | Single Mongoose connection pool per Railway instance (`database.md` Best Practices) |
| **Queries** | Parameterized via Mongoose — never string-concatenated user input (`security.md`) |
| **Projections** | `.select()` excludes `authorId` on public queries |
| **Indexes** | Use compound indexes from `database.md` Index Strategy |
| **Soft deletes** | Filter `deletedAt: null` and `status: active` on public reads |
| **Transactions** | Use MongoDB transactions for multi-document writes where needed (mood + moodtags create) |
| **Aggregations** | Statistics pipelines in repository or dedicated query modules — not in controllers |

### Entity Mapping

```
Mongoose Document  ←→  Domain Entity  ←→  Public DTO
     (model)            (repository)       (mapper)
```

Models define **persistence shape**. Entities define **business shape**. Mappers define **API shape**.

### Collection Access Rules

| Rule | Detail |
|------|--------|
| 15 collections only | Per `database.md` — new collections require ADR |
| No binary images | `moodimages` metadata only (`INT-DB-003`) |
| Append-only audit | `auditlogs` never updated or deleted |
| Atlas network | IP allowlist for Railway only (`NFR-SEC-007`) |

---

## Validation Strategy

Multi-layer validation per `architecture.md` and `security.md`.

### Layers

| Layer | Location | Validates |
|-------|----------|-----------|
| **1. API ingress** | `validators/` + `validate` middleware | Shape, types, required fields, unknown field rejection |
| **2. Application service** | `application/services/` | Business rules: ownership, cooldowns, limits, RBAC |
| **3. Domain** | `domain/services/` | Invariants: threshold, anonymity policy |
| **4. Persistence** | Mongoose schemas | Type constraints, enums, required fields |

Client-side Zod validation (`NFR-UX-002`) is UX only — **not authoritative**.

### Strict Schema Policy

- Reject unexpected body fields on create/update endpoints (`NFR-SEC-002`).
- Validate `ObjectId` path params as 24-character hex before queries.
- Normalize email (lowercase, trim) in `AuthService` after API validation.

### Feature Validation Summary

| Feature | Key server rules |
|---------|------------------|
| Auth | Email format, password 8–128 chars, domain allowlist optional |
| Mood | Content 1–5000 chars, ≥1 tag, ≤4 images |
| Comment | Content 1–2000 chars, thread depth ≤3 |
| Image | MIME allowlist, ≤5 MB, dimensions on confirm |
| Report | Reason enum, cooldown duplicate check |
| Statistics | Scope params; threshold applied on read |

---

## Error Handling Strategy

Per `architecture.md`, `api.md`, and `security.md` Error Exposure Strategy.

### Error Types

| Type | HTTP | Source |
|------|------|--------|
| `ValidationError` | 422 | Middleware or service |
| `DomainError` | 403 / 404 / 409 / 422 | Application service |
| `AuthenticationError` | 401 | `authenticate` middleware |
| `AuthorizationError` | 403 | `authorize` or service ownership |
| `RateLimitError` | 429 | `rateLimiter` |
| `UnknownError` | 500 | Unhandled — logged at `error` |

### Error Envelope

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Human-safe message.",
    "details": [],
    "requestId": "req_abc123"
  }
}
```

### Propagation

Services throw typed errors → controller does not catch → `errorHandler` maps to HTTP + envelope.

**Never expose:** stack traces, MongoDB errors, R2 bucket names, object keys, JWT internals (`NFR-SEC-009`).

### Error Code Catalog

Authoritative list in `api.md` Shared Schemas and `constants/errorCodes.ts`.

---

## Logging Strategy

Per `architecture.md` and `security.md`.

### Configuration

| Environment | `LOG_LEVEL` |
|-------------|-------------|
| Production | `info` |
| Development | `debug` |

Structured **JSON logs** in production for Railway log aggregation.

### Per-Request Logging

| Field | Logged |
|-------|--------|
| `requestId` | Always |
| Method, path, status, duration | Always |
| `userId` | If authenticated |
| IP | On auth failures and rate limits |

### Security Logging Rules

| Log | Do not log |
|-----|------------|
| Admin moderation actions | Passwords, JWTs, refresh tokens |
| R2 operation failures (operation + key server-side) | Signed URLs |
| Threshold suppression | `authorId` with mood content in standard logs |

### Audit vs Application Logs

| Type | Storage | Purpose |
|------|---------|---------|
| Application logs | Railway stdout | Operations, debugging |
| Audit logs | MongoDB `auditlogs` | Compliance, admin accountability |

---

## Environment Configuration

Loaded and validated at startup via `config/env.ts`. Full catalog in `architecture.md` and `security.md`.

### Required Secrets (Production)

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | Atlas connection |
| `JWT_SECRET` | Access token signing |
| `JWT_REFRESH_SECRET` | Refresh token operations |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 |

### Key Configuration

| Variable | Default / notes |
|----------|---------------|
| `NODE_ENV` | `production` on Railway |
| `JWT_EXPIRES_IN` | `15m` |
| `BCRYPT_ROUNDS` | `12` |
| `CORS_ALLOWED_ORIGINS` | Vercel frontend URL |
| `AGGREGATION_THRESHOLD_MIN` | `5` (`OD-010`) |
| `LOG_LEVEL` | `info` |
| `RATE_LIMIT_*` | Per `api.md` |

### Startup Behavior

1. Parse environment variables.
2. Validate with Zod schema.
3. If `NODE_ENV=production` and required secret missing → **exit with error**.
4. Connect MongoDB.
5. Wire dependency injection.
6. Listen on `PORT`.

### Environment Separation

| Environment | Database | R2 bucket | Secrets |
|-------------|----------|-----------|---------|
| Development | `mood_of_the_major_dev` | Dev bucket | Local `.env` (gitignored) |
| Staging | `mood_of_the_major_staging` | Staging bucket | Railway staging |
| Production | `mood_of_the_major` | Production bucket | Railway production |

---

## Performance Considerations

Aligned with `SPECS.md` §7.1 `NFR-PERF-*`.

| Target | Requirement | Backend approach |
|--------|-------------|------------------|
| Feed read p95 | 500 ms (`NFR-PERF-001`) | Indexed queries, denormalized counts, cursor pagination, projection-only fields |
| Presign p95 | 200 ms (`NFR-PERF-002`) | Minimal work: validate, insert pending row, sign URL |
| Statistics p95 | 2 s (`NFR-PERF-004`) | Read pre-aggregated `emotionstatistics` / `dailystatistics` — no live full scans |
| Dashboard | Single combined endpoint | `GET /statistics/dashboard` parallelizes reads |

### Query Optimization

| Pattern | Implementation |
|---------|----------------|
| Feed pagination | Cursor on `(createdAt, _id)` per `api.md` |
| Default page size | 20; max 50 |
| Denormalized counters | `commentCount`, `reactionSummary` on `moods` — atomic `$inc` |
| Text search | MongoDB text index on `moods.content` |
| Connection pool | Mongoose pool sized per instance count |

### What Not to Do

| Anti-pattern | Impact |
|--------------|--------|
| Live aggregating all moods for dashboard | Violates 2 s p95 |
| Populating `authorId` on feed queries | Wasted IO + anonymity risk |
| Buffering image uploads through Express | Violates `FR-IMG-007`; adds latency |
| Unbounded `find()` without limit | Violates `NFR-SCALE-004` |

---

## Scalability Strategy

Aligned with `SPECS.md` §7.2 `NFR-SCALE-*`.

| Dimension | Strategy |
|-----------|----------|
| **API throughput** | Stateless JWT — horizontal scale Railway instances (`NFR-SCALE-003`) |
| **Database** | MongoDB Atlas replica set; indexed queries; future sharding on `{ facultyId, createdAt }` (`database.md`) |
| **Media** | R2 scales independently; uploads bypass API bandwidth (`NFR-SCALE-002`) |
| **Feed volume** | Mandatory cursor pagination (`NFR-SCALE-004`) |
| **Statistics** | Pre-computed collections; nightly batch jobs |
| **Session state** | No server-side session store — refresh token hash on `users` only |

### Horizontal Scaling Checklist

- [ ] No in-memory user session state
- [ ] Rate limiter backed by Redis or sticky-less compatible store (future if multi-instance)
- [ ] MongoDB connection pool per instance
- [ ] Idempotent background jobs safe to run on any instance

---

## Security Responsibilities

The backend is the **authoritative security enforcement point**. Policy details in [`security.md`](./security.md).

### Backend-Owned Controls

| Control | Implementation layer |
|---------|---------------------|
| JWT authentication | `authenticate` middleware |
| RBAC | `authorize` middleware + services |
| Ownership checks | Application services |
| Rate limiting | `rateLimiter` middleware |
| CORS | `cors` middleware |
| Helmet headers | `app.ts` |
| Input validation | `validators/` + services |
| NoSQL injection prevention | Repositories + validation |
| Anonymity stripping | Mappers + repository projections |
| bcrypt password hashing | `BcryptPasswordHasher` adapter |
| Audit logging | `AuditLogRepository` on admin actions |
| R2 credential isolation | `R2ImageStorage` adapter — keys never in responses |
| Error sanitization | `errorHandler` middleware |
| Aggregation threshold | `StatisticsService` + `AGGREGATION_THRESHOLD_MIN` |

### Security Testing Priorities

Per `NFR-MAINT-006` and `security.md` Production Checklist:

1. Public DTO snapshots contain no identity fields.
2. Protected routes reject missing JWT.
3. Admin routes reject student role.
4. Rate limits trigger on auth endpoints.
5. Presign rejects invalid MIME and oversized files.

---

## Cloudflare R2 Integration

Full storage architecture in [`cloudflare-r2.md`](./cloudflare-r2.md). Backend role via `ImageService` and `IImageStorage` adapter (`R2ImageStorage`).

### Backend Responsibilities — Upload

| Step | Backend action |
|------|----------------|
| 1 | Authenticate student (`POST /images/upload-url`) |
| 2 | Validate MIME (`image/jpeg`, `image/png`, `image/webp`), size ≤ 5 MB |
| 3 | Generate object key: `{environment}/moods/{userId}/{timestamp}-{uuid}.{ext}` |
| 4 | Create `moodimages` row: `status: pending`, store `objectKey` |
| 5 | Generate presigned PUT URL (15-minute TTL) via R2 adapter |
| 6 | Return `imageId`, `uploadUrl`, `uploadHeaders`, `expiresAt` to client |
| 7 | On confirm: HEAD object in R2, validate existence and optional dimensions |
| 8 | Update `moodimages`: `status: confirmed`, `confirmedAt` |
| 9 | On mood publish: link `moodId`, set `sortOrder` |

**Backend does not:** Receive or store image binary data.

### Backend Responsibilities — Download

| Step | Backend action |
|------|----------------|
| 1 | Authenticate user (`GET /images/:imageId/url`) |
| 2 | Load `moodimages` by ID |
| 3 | Authorize: user can view parent mood or is uploader |
| 4 | Verify `status: confirmed` |
| 5 | Generate signed GET URL (1-hour TTL) from `objectKey` |
| 6 | Return `{ url, expiresAt }` — never persist URL in MongoDB |

### Backend Responsibilities — Delete

| Trigger | Backend action |
|---------|----------------|
| User/admin delete image | Soft-delete `moodimages`; enqueue R2 `DeleteObject` |
| Mood delete cascade | Soft-delete all mood images; enqueue R2 deletes |
| Orphan job (24h TTL) | Mark `orphaned`; delete from R2; remove/archive row |

### Port Interface

`IImageStorage` in `domain/ports/` defines:

| Method | Purpose |
|--------|---------|
| `generatePresignedUploadUrl` | PUT URL for object key |
| `generateSignedDownloadUrl` | GET URL for object key |
| `headObject` | Confirm existence and metadata on upload confirm |
| `deleteObject` | Remove object on delete/orphan jobs |

---

## Background Jobs (Future)

No background job runner is mandated for Phase 1–2 API delivery. The following **scheduled tasks** are architecturally planned and referenced across `database.md`, `cloudflare-r2.md`, and `SPECS.md`.

### Planned Jobs

| Job | Schedule | Responsibility |
|-----|----------|----------------|
| **Daily statistics aggregation** | 01:00 UTC daily | Upsert `dailystatistics` and `emotionstatistics` (`database.md`) |
| **Trending recalculation** | After daily stats or hourly | Update trending windows (`FR-TREND-*`) |
| **Orphan image cleanup** | Every 6 hours | Delete R2 objects for unlinked `moodimages` older than 24h (`BR-IMG-004`) |
| **Deleted image purge** | Every 6 hours | R2 `DeleteObject` for `moodimages` with `status: deleted` |
| **Notification dispatch** | Event-driven or polling (Phase 3) | Deliver in-app notifications (`FR-NOTIF-*`) |
| **Session/token cleanup** | Daily | Remove expired refresh token metadata (future multi-device) |

### Execution Model (Future)

| Option | Fit |
|--------|-----|
| **Railway cron** | Simple scheduled HTTP ping to internal admin job endpoint |
| **Dedicated worker process** | Separate Railway service running job scheduler |
| **Queue-based** | BullMQ + Redis for retries and visibility (higher scale) |

### Job Design Principles

| Principle | Detail |
|-----------|--------|
| **Idempotent** | Upsert keys on statistics; safe to rerun |
| **Off critical path** | R2 deletes and aggregations never block API requests |
| **Logged** | Job start/end, records processed, failures at `info`/`error` |
| **Threshold-aware** | Statistics jobs set `meetsThreshold` using `AGGREGATION_THRESHOLD_MIN` |
| **No identity in job output** | Aggregations use counts only (`FR-STAT-005`) |

### Internal Job Endpoint (Future)

Protected admin or service-token endpoint (e.g., `POST /api/v1/internal/jobs/daily-statistics`) — not exposed publicly. Authenticated via service API key in Railway secrets.

---

## Best Practices

### Architecture

| Practice | Rationale |
|----------|-----------|
| Thin controllers | `NFR-MAINT-002` — logic in services |
| Repository-only DB access | `NFR-MAINT-003` — testable, swappable |
| Domain layer purity | No framework imports — stable business rules |
| Dependency injection at startup | Explicit wiring; mockable in tests |
| One use case per service method | Predictable boundaries |

### API

| Practice | Rationale |
|----------|-----------|
| Consistent response envelope | `api.md` contract |
| Cursor pagination on all lists | `OD-005` resolution |
| ISO 8601 UTC dates | `api.md` consistency |
| Role checks on every write | `BR-AUTH-002` |

### Data

| Practice | Rationale |
|----------|-----------|
| Public projection excludes identity | `BR-ANON-001` |
| Soft delete user content | Moderation and audit (`BR-CNT-004`) |
| Atomic counter updates | Feed performance |
| UTC date bucketing | `BR-STAT-002` |

### Security

| Practice | Rationale |
|----------|-----------|
| Validate before service | Fail fast |
| Generic login errors | No email enumeration |
| Audit admin identity access | `BR-ANON-004` |
| Never log tokens or passwords | `security.md` |

### Operations

| Practice | Rationale |
|----------|-----------|
| Fail fast on missing secrets | Prevent broken production deploy |
| Structured JSON logs | Railway aggregation |
| `requestId` everywhere | Incident correlation |
| `.env.example` without values | Onboarding without secret leak |

### Testing Priorities

Per `NFR-MAINT-006`:

1. Domain and application service unit tests (business rules, thresholds, anonymity).
2. Auth flow integration tests.
3. Data integrity tests (cascades, unique constraints).
4. Public DTO contract tests (no identity fields).

### Anti-Patterns

| Anti-pattern | Why forbidden |
|--------------|---------------|
| Mongoose in controllers | Layer violation |
| Business logic in routes | Untestable, duplicated |
| Returning `authorId` in feeds | Anonymity violation |
| Storing signed R2 URLs in DB | Expiry and security risk |
| Global mutable state for auth | Breaks horizontal scale |
| Skipping validation on "internal" endpoints | Security gap |

---

## Future Backend Improvements

Aligned with `README.md` Future Improvements, `SPECS.md` §12, and `security.md` §Future Security Improvements.

| Area | Enhancement |
|------|-------------|
| **WebSocket / SSE** | Real-time feed and notifications (`NFR-AVAIL` future) |
| **Job queue** | Redis + BullMQ for reliable background processing |
| **Rate limit store** | Redis for distributed rate limiting across Railway instances |
| **Atlas Search** | Replace text index for better search relevance |
| **Read replicas** | Offload statistics reads to secondary Atlas nodes |
| **Caching layer** | Redis cache for hot feeds and trending (with careful invalidation) |
| **OpenAPI generation** | Auto-generate from Zod schemas and route definitions |
| **GraphQL** | Not planned — REST remains canonical (`INT-API-001`) |
| **Microservices split** | Separate statistics worker or notification service at scale |
| **Multi-tenant** | `tenantId` on all queries — university isolation |
| **Observability** | OpenTelemetry traces, Datadog/Sentry integration |
| **API versioning** | `/api/v2` when breaking changes required |
| **Shared package** | `packages/shared` for Zod schemas with frontend (`architecture.md`) |
| **Email service** | Password reset, verification notifications |
| **ML moderation** | Content classification pipeline on write |
| **Health endpoints** | `GET /health` and `GET /ready` for Railway probes |

---

## Related Documents

| Document | Backend relevance |
|----------|-------------------|
| [`architecture.md`](./architecture.md) | System-wide architecture, data flows, folder structure |
| [`api.md`](./api.md) | REST contracts the backend implements |
| [`database.md`](./database.md) | Mongoose schemas, indexes, aggregation jobs |
| [`authentication.md`](./authentication.md) | JWT, refresh, route protection |
| [`cloudflare-r2.md`](./cloudflare-r2.md) | R2 upload/download/delete responsibilities |
| [`security.md`](./security.md) | Security policies the backend enforces |
| [`SPECS.md`](../SPECS.md) | Requirements traceability (`FR-*`, `NFR-*`, `BR-*`) |
| [`README.md`](../README.md) | Stack, coding standards, deployment |
| [`.cursor/rules/backend.mdc`](../.cursor/rules/backend.mdc) | AI implementation guardrails |

---

## Document Maintenance

| Event | Action |
|-------|--------|
| New API endpoint | Add route, controller, service; update `api.md` |
| New collection | Requires ADR — update repositories |
| Layer boundary change | Update Clean Architecture section; ADR in `architecture.md` |
| New background job | Add to Background Jobs section |
| Performance incident | Update Performance Considerations; log in `PROJECT_AUDIT.md` |

---

*This document defines the complete backend architecture and engineering guidelines for Mood of the Major. All backend implementation must conform to Clean Architecture boundaries described here and in `architecture.md`.*
