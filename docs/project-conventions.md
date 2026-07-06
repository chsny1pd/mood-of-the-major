# Mood of the Major — Project Conventions

> **Document type:** Engineering conventions and contributor standards  
> **Status:** Draft v1.0  
> **Authority:** Derives from [`backend.md`](./backend.md), [`frontend.md`](./frontend.md), [`security.md`](./security.md), and [`testing-strategy.md`](./testing-strategy.md). Where conflict exists, [`README.md`](../README.md) takes precedence for stack and git conventions referenced therein.

---

## Table of Contents

1. [Purpose](#purpose)
2. [General Principles](#general-principles)
3. [Repository Structure](#repository-structure)
4. [Folder Naming Convention](#folder-naming-convention)
5. [File Naming Convention](#file-naming-convention)
6. [Variable Naming Convention](#variable-naming-convention)
7. [Function Naming Convention](#function-naming-convention)
8. [Component Naming Convention](#component-naming-convention)
9. [Hook Naming Convention](#hook-naming-convention)
10. [API Route Naming Convention](#api-route-naming-convention)
11. [MongoDB Collection Naming Convention](#mongodb-collection-naming-convention)
12. [Environment Variable Naming](#environment-variable-naming)
13. [Type Naming](#type-naming)
14. [Constant Naming](#constant-naming)
15. [Import Order](#import-order)
16. [Code Formatting](#code-formatting)
17. [Documentation Standards](#documentation-standards)
18. [Git Workflow](#git-workflow)
19. [Error Handling Convention](#error-handling-convention)
20. [Logging Convention](#logging-convention)
21. [Security Convention](#security-convention)
22. [Testing Convention](#testing-convention)
23. [Dependency Management](#dependency-management)
24. [Code Review Checklist](#code-review-checklist)
25. [AI Assistant Rules](#ai-assistant-rules)
26. [Future Conventions](#future-conventions)
27. [Related Documents](#related-documents)

---

## Purpose

This document defines the **engineering conventions** that every human contributor and AI assistant must follow when working on Mood of the Major. Its goals are:

| Goal | How conventions help |
|------|----------------------|
| **Consistency** | Engineers and AI agents locate logic predictably across backend and frontend. |
| **Maintainability** | Clean Architecture boundaries, naming, and patterns reduce coupling and regression risk. |
| **Production quality** | Security, validation, anonymity, and testing standards are encoded as repeatable habits — not optional polish. |
| **Onboarding speed** | New contributors read one document plus layer-specific specs (`backend.md`, `frontend.md`) and produce compatible code immediately. |

Conventions here are **normative**. Deviations require explicit discussion and, for architectural or stack changes, an ADR in `architecture.md`. When a convention conflicts with a requirement in `SPECS.md` or `README.md`, the requirement wins.

---

## General Principles

### Readability

Code is read far more often than it is written. Prefer clear names, small functions, and explicit structure over clever shortcuts.

| Guideline | Application |
|-----------|-------------|
| Name for intent | `findPublicFeed` not `getData` |
| One responsibility per function | Service methods map to one use case |
| Avoid deep nesting | Early returns in controllers and guards |
| Match surrounding style | New code should read as if written by the same author |

### Simplicity

Use the simplest correct solution. Do not add abstractions, helpers, or configuration for hypothetical future needs.

| Prefer | Avoid |
|--------|-------|
| Inline logic for one-off cases | Single-use utility wrappers |
| Existing repository or service methods | Duplicate business rules in controllers or components |
| Framework defaults | Custom build or routing machinery without ADR |

### Consistency

Follow established patterns in this repository before inventing new ones. Backend and frontend each have documented folder layouts — extend them, do not parallel them.

| Area | Source of truth |
|------|-----------------|
| Backend layers | `backend.md` Clean Architecture |
| Frontend features | `frontend.md` Feature-Based Architecture |
| API contracts | `api.md` |
| Security policy | `security.md` |
| Tests | `testing-strategy.md` |

### DRY (Don't Repeat Yourself)

Duplicate logic drifts and breaks anonymity or auth guarantees.

| Rule | Detail |
|------|--------|
| Business rules live once | Application services and domain services — not in routes, controllers, or React components |
| Shared validation | Zod schemas colocated per feature; future `packages/shared` for cross-stack schemas |
| Shared UI | Extract to `components/` when used by two or more features |
| Error codes | Single catalog in `constants/errorCodes.ts` matching `api.md` |

DRY does **not** mean merging unrelated concerns into mega-files. Prefer duplication over incorrect abstraction.

### SOLID

Apply pragmatically within Clean Architecture:

| Principle | Project interpretation |
|-----------|------------------------|
| **S** — Single responsibility | One controller method → one service method; one feature module → one product domain |
| **O** — Open/closed | Extend via new services/repositories; avoid modifying domain invariants for one endpoint hack |
| **L** — Liskov substitution | Repository implementations honor port interfaces completely |
| **I** — Interface segregation | Domain ports are focused (`IMoodRepository`, `IImageStorage`) — not god interfaces |
| **D** — Dependency inversion | Application layer depends on ports; infrastructure implements them |

### Clean Architecture

Both backend and frontend respect layer boundaries (`backend.md`, `frontend.md`).

**Backend dependency direction:** Delivery (routes, controllers) → Application (services, mappers) → Domain (entities, ports) ← Infrastructure (repositories, R2, JWT).

**Forbidden imports (backend):**

| From | Must never import |
|------|-------------------|
| `domain/` | Express, Mongoose, R2 SDK |
| `application/` | Express, Mongoose models |
| `controllers/` | Mongoose models, R2 SDK |
| `routes/` | Application services directly |

**Frontend layering:** Pages → layouts → feature containers (hooks) → presentational components. Services have no React imports. TanStack Query owns server state; AuthContext owns session only.

---

## Repository Structure

The monorepo separates deployable applications, documentation, and automation. Each top-level area has a single responsibility.

```
mood-of-the-major/
├── backend/                 # Express API (Railway)
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── validators/
│   │   ├── application/     # services, mappers
│   │   ├── domain/          # entities, ports, domain services, errors
│   │   ├── infrastructure/  # database, storage, auth, logging
│   │   ├── config/
│   │   ├── constants/
│   │   ├── types/
│   │   └── utils/
│   └── tests/
│       ├── unit/
│       ├── integration/
│       └── fixtures/
│
├── frontend/                # React SPA (Vercel)
│   ├── public/
│   └── src/
│       ├── app/             # bootstrap, router, providers
│       ├── pages/
│       ├── layouts/
│       ├── features/        # domain modules
│       ├── components/      # shared UI
│       ├── hooks/
│       ├── services/
│       ├── contexts/
│       ├── lib/
│       ├── utils/
│       ├── types/
│       ├── constants/
│       ├── assets/
│       └── styles/
│
├── docs/                    # Engineering specifications
├── .github/workflows/       # CI/CD (at implementation)
├── README.md
└── SPECS.md
```

| Path | Deploy target | Notes |
|------|---------------|-------|
| `backend/` | Railway | Root directory for backend service |
| `frontend/` | Vercel | Root directory for frontend project |
| `docs/` | Not deployed | Authoritative specs; update with behavioral changes |

Documentation changes do not trigger application redeploys. Application changes must stay within the correct package root.

---

## Folder Naming Convention

| Context | Convention | Examples |
|---------|------------|----------|
| **Backend top-level** | lowercase, singular role names | `routes/`, `controllers/`, `middlewares/` |
| **Backend domain** | lowercase plural or concept | `entities/`, `ports/`, `value-objects/` |
| **Backend infrastructure** | lowercase by adapter type | `database/repositories/`, `storage/`, `auth/` |
| **Frontend features** | lowercase kebab-case | `features/mood/`, `features/admin/` |
| **Frontend shared** | lowercase plural | `components/`, `hooks/`, `services/`, `pages/` |
| **Frontend admin pages** | nested under `pages/admin/` | `pages/admin/ReportQueuePage.tsx` |
| **Tests** | `unit/`, `integration/`, `fixtures/` (backend); `__tests__/` colocated or `frontend/tests/` | Per `testing-strategy.md` |

Do not create parallel folders that duplicate an existing layer (e.g., `helpers/` when `utils/` exists). Do not place business logic in `utils/` — use services or domain.

---

## File Naming Convention

| Artifact | Convention | Examples |
|----------|------------|----------|
| **Backend TypeScript** | camelCase with role suffix | `mood.controller.ts`, `auth.service.ts`, `mood.validator.ts` |
| **Backend repository** | Entity + Repository | `MongooseMoodRepository.ts` implements `IMoodRepository` |
| **Backend middleware** | camelCase descriptive | `authenticate.ts`, `rateLimiter.ts`, `errorHandler.ts` |
| **Backend entry** | lowercase | `index.ts`, `app.ts` |
| **Frontend pages** | PascalCase + `Page` | `FeedPage.tsx`, `AdminOverviewPage.tsx` |
| **Frontend layouts** | PascalCase + `Layout` | `StudentLayout.tsx`, `AdminLayout.tsx` |
| **Frontend components** | PascalCase | `MoodCard.tsx`, `CreateMoodForm.tsx` |
| **Frontend services** | camelCase + `Service` | `moodService.ts`, `authService.ts` |
| **Frontend schemas** | camelCase + `Schema` | `createMoodSchema.ts`, `registerSchema.ts` |
| **Frontend hooks** | camelCase with `use` prefix file optional | `useMoodFeed.ts` in `hooks/` |
| **Constants modules** | camelCase plural concept | `errorCodes.ts`, `queryKeys.ts`, `routes.ts` |
| **Barrel exports** | `index.ts` | `features/mood/index.ts` |
| **Tests** | same base + `.test.ts` or `.spec.ts` | `mood.service.test.ts`, `MoodCard.test.tsx` |
| **Docs** | kebab-case | `project-conventions.md`, `testing-strategy.md` |

One primary export per file for controllers, services, and components unless the file is a deliberate barrel (`index.ts`).

---

## Variable Naming Convention

| Scope | Convention | Examples |
|-------|------------|----------|
| **JavaScript/TS variables** | camelCase | `userId`, `moodId`, `nextCursor`, `isLoading` |
| **Booleans** | `is`, `has`, `should`, `can` prefix | `isAuthenticated`, `hasMore`, `meetsThreshold` |
| **Collections** | plural nouns | `moods`, `tagIds`, `imageIds` |
| **MongoDB document fields** | camelCase | `authorId`, `createdAt`, `reactionSummary` |
| **Environment values** | SCREAMING_SNAKE_CASE | `process.env.JWT_SECRET` |
| **React state** | camelCase | `[isOpen, setIsOpen]` |
| **Unused parameters** | `_` prefix | `_req`, `_next` when intentionally unused |

Avoid abbreviations except widely understood ones (`id`, `url`, `dto`, `req`, `res`). Never use single-letter names except loop indices.

**Identity fields:** `authorId`, `userId`, and `email` exist in internal/backend code only — never assign to public DTO variable names exposed to clients without mapper stripping.

---

## Function Naming Convention

| Layer | Pattern | Examples |
|-------|---------|----------|
| **Service use cases** | verb + noun | `createMood`, `findPublicFeed`, `resolveReport` |
| **Repository ports** | verb + scope | `findById`, `findPublicFeed`, `softDelete` |
| **Controllers** | mirror service method | `create`, `getById`, `list` — thin delegation |
| **Mappers** | `to` + target shape | `toPublicMoodDto`, `toAdminMoodDto` |
| **Validators** | schema export names | `createMoodSchema`, `loginSchema` |
| **Utils** | verb phrase | `sanitizeContent`, `encodeCursor`, `mapApiError` |
| **Middleware factories** | descriptive noun | `authenticate`, `authorize`, `validate` |
| **Event handlers (React)** | `handle` + action | `handleSubmit`, `handleBookmarkToggle` |
| **Async wrappers** | `asyncHandler` | Wraps controller async functions |

Use **async** only when the function awaits I/O. Domain services remain synchronous when pure.

Avoid generic names: `process`, `handleData`, `doWork`.

---

## Component Naming Convention

React components use **PascalCase** and descriptive product language aligned with `DESIGN.md`.

| Category | Naming | Examples |
|----------|--------|----------|
| **Shared UI** | Noun or noun phrase | `Modal`, `EmptyState`, `EmotionBadge` |
| **Feature-specific** | Domain + role | `MoodFeedList`, `CreateMoodForm`, `AdminReportTable` |
| **Guards** | Role + `Guard` | `AuthGuard`, `AdminGuard`, `GuestGuard` |
| **Layout** | Shell + `Layout` | `StudentLayout`, `PublicLayout` |
| **Pages** | Route concept + `Page` | `MoodDetailPage`, `StatisticsPage` |

| Rule | Detail |
|------|--------|
| One component per file | File name matches default export |
| Presentational components | Receive data via props; no TanStack Query in leaf components |
| No identity in public UI | MoodCard, CommentCard never display author name or avatar |

Compound components (Modal) may export subcomponents from the same file when they are always used together.

---

## Hook Naming Convention

Custom hooks **must** start with `use` (React rules of hooks).

| Category | Location | Examples |
|----------|----------|----------|
| **Cross-feature** | `src/hooks/` | `useAuth`, `useRequireAuth`, `useTheme`, `useDisclosure` |
| **Feature data** | `features/<name>/hooks/` | `useMoodFeed`, `useCreateMood`, `useImageUpload` |
| **TanStack Query** | `use` + resource + action | `useMoodDetail`, `useInfiniteMoodFeed` |

| Rule | Detail |
|------|--------|
| Hooks call services | Not raw Axios |
| Query keys from factory | `constants/queryKeys.ts` — not string literals scattered in hooks |
| Mutations invalidate explicitly | Related keys listed in mutation `onSuccess` |

Do not create hooks that duplicate TanStack Query cache in `useState`.

---

## API Route Naming Convention

All HTTP routes follow `api.md` REST conventions. Backend route files group by domain under `/api/v1`.

| Rule | Convention | Example |
|------|------------|---------|
| **Version prefix** | `/api/v1` on all routes | `/api/v1/moods` |
| **Resources** | plural nouns | `/moods`, `/comments`, `/faculties` |
| **Path segments** | kebab-case | `/audit-logs`, `/emotion-statistics` |
| **Nested resources** | parent → child | `/moods/:moodId/comments` |
| **Actions** | verb as sub-path on resource | `/admin/reports/:reportId/resolve` |
| **Auth namespace exception** | `/auth/login`, `/auth/register` | Allowed auth verbs |
| **Admin namespace** | `/api/v1/admin/*` | Administrator role required |
| **Infrastructure** | outside `/api/v1` | `/health`, `/ready` |

| HTTP method | Usage |
|-------------|-------|
| `GET` | Read; idempotent |
| `POST` | Create or non-idempotent action |
| `PATCH` | Partial update |
| `PUT` | Upsert (reactions) or full replace (rare) |
| `DELETE` | Remove or soft-delete |

Route registration pattern (conceptual): middleware chain declared on route — `authenticate`, `authorize('student')`, `validate(schema)`, `controller.method`. Routes do not contain business logic.

---

## MongoDB Collection Naming Convention

Collections use **lowercase plural** (or established compound names) per `backend.md` repository catalog. Mongoose model names are PascalCase singular; collection names are explicit where they differ.

| Collection | Domain entity | Notes |
|------------|---------------|-------|
| `users` | User | Auth and profile |
| `moods` | Mood | Core content |
| `comments` | Comment | Threaded replies |
| `reactions` | Reaction | Upsert per user per target |
| `bookmarks` | Bookmark | User-private |
| `reports` | Report | Moderation queue |
| `notifications` | Notification | Phase 3 inbox |
| `tags` | Tag | Emotion categories |
| `moodimages` | MoodImage | Metadata only — no binary |
| `moodtags` | MoodTag | Join collection (when used) |
| `emotionstatistics` | EmotionStatistics | Pre-aggregated |
| `dailystatistics` | DailyStatistics | Pre-aggregated |
| `auditlogs` | AuditLog | Append-only |
| `faculties` | Faculty | Reference data |
| `majors` | Major | Reference data |

| Rule | Detail |
|------|--------|
| New collections | Require ADR — 15 collections are baseline |
| Field names | camelCase |
| Timestamps | `createdAt`, `updatedAt`, `deletedAt` where applicable |
| Soft delete | Filter `deletedAt: null` on public reads |
| Identity | `authorId`, `uploadedBy`, `reporterId` — internal only |

All database access goes through **repository implementations** — never Mongoose models in controllers.

---

## Environment Variable Naming

| Surface | Convention | Examples |
|---------|------------|----------|
| **Backend secrets** | SCREAMING_SNAKE_CASE | `MONGODB_URI`, `JWT_SECRET`, `R2_SECRET_ACCESS_KEY` |
| **Backend config** | SCREAMING_SNAKE_CASE | `NODE_ENV`, `CORS_ALLOWED_ORIGINS`, `AGGREGATION_THRESHOLD_MIN` |
| **Frontend public** | `VITE_` prefix + SCREAMING_SNAKE | `VITE_API_BASE_URL`, `VITE_APP_ENV` |
| **Rate limits** | `RATE_LIMIT_*` prefix | Per `api.md` / `constants/rateLimits.ts` |

| Rule | Detail |
|------|--------|
| Validate at startup | Backend `config/env.ts` with Zod — fail fast in production |
| Never commit values | `.env.example` keys only; real values in Railway/Vercel/local gitignored `.env` |
| Never frontend secrets | No JWT, MongoDB, or R2 keys in `VITE_*` |
| Environment separation | Dev, staging, production use different secrets and buckets |

Document new variables in `backend/.env.example`, `frontend/.env.example`, and the relevant architecture doc.

---

## Type Naming

TypeScript strict mode is required (`NFR-MAINT-005`).

| Kind | Convention | Examples |
|------|------------|----------|
| **Interfaces (ports)** | `I` prefix for domain ports | `IMoodRepository`, `IImageStorage` |
| **Domain entities** | PascalCase noun | `Mood`, `User`, `Comment` |
| **DTOs (API)** | PascalCase + role | `PublicMoodDto`, `CreateMoodRequest` |
| **Zod inferred types** | PascalCase | `type CreateMoodInput = z.infer<typeof createMoodSchema>` |
| **Enums / unions** | PascalCase type name; values per API | `Role`, `ReactionType`, `ReportReasonCode` |
| **Express augmentation** | `express.d.ts` | Extend `Request` with `userId`, `role`, `requestId` |
| **Error types** | PascalCase + `Error` | `DomainError`, `ValidationError`, `AuthenticationError` |
| **Generic params** | Single uppercase letter | `T`, `K`, `V` — sparingly |

Public DTO types **exclude** `authorId`, `userId`, and `email` by design. Type definitions should document this exclusion so engineers do not widen public types accidentally.

Prefer `interface` for object shapes that may be extended; `type` for unions, aliases, and inferred schema types.

---

## Constant Naming

| Location | Convention | Examples |
|----------|------------|----------|
| **Backend `constants/`** | SCREAMING_SNAKE for primitives | `AGGREGATION_THRESHOLD_MIN`, `DEFAULT_PAGE_LIMIT` |
| **Error codes** | SCREAMING_SNAKE strings matching `api.md` | `VALIDATION_FAILED`, `NOT_OWNER` |
| **Roles** | lowercase string values | `student`, `administrator`, `advisor` in `roles.ts` |
| **Frontend routes** | SCREAMING_SNAKE path constants | `ROUTES.FEED`, `ROUTES.ADMIN_REPORTS` |
| **Query keys** | factory functions returning readonly tuples | `queryKeys.moods.feed(filters)` |
| **Magic numbers** | Named constants | Max images per post, edit window hours |

Do not inline repeated literals (pagination limits, MIME allowlists, rate limit counts) — centralize in `constants/`.

---

## Import Order

Consistent import order improves readability and reduces merge noise. ESLint import sorting rules apply at implementation (`NFR-MAINT-004`).

**Recommended order (both packages):**

1. External dependencies (Node built-ins, npm packages)
2. Internal absolute/alias imports by layer (domain → application → infrastructure on backend; app → features → components on frontend)
3. Relative imports (parent directories before siblings)
4. Type-only imports (`import type { ... }`) — grouped with their module or at end per linter config
5. Side-effect imports last (e.g., `import './styles/index.css'`)

**Backend layer import rules:**

- Import direction follows Clean Architecture — never import outward from domain.
- Controllers import services only — not repositories.
- Services import ports — not Mongoose models.

**Frontend import rules:**

- Pages import from `features/`, `layouts/`, `components/` — not deep sibling feature paths.
- Features import from barrel `features/<name>` when crossing module boundaries within allowed directions.
- Services must not import React.
- Presentational components must not import services or hooks that fetch data.

Use `import type` for types erased at compile time. Avoid wildcard imports except for intentional barrel re-exports.

---

## Code Formatting

Formatting is **automated and non-negotiable** — debates belong in linter config, not pull requests.

| Tool | Scope |
|------|-------|
| **Prettier** | Formatting — quotes, semicolons, line width, trailing commas |
| **ESLint** | Linting — correctness, import rules, React hooks, a11y plugin on frontend |
| **TypeScript** | `strict: true` — no implicit any in new code |

### Formatting Philosophy

| Principle | Detail |
|-----------|--------|
| **Automate** | Run format on save and in CI; no manual style edits |
| **Diff minimalism** | Do not reformat unrelated files in feature PRs |
| **Line length** | Prettier default (typically 80–100) — break long JSX naturally |
| **Semicolons** | Per Prettier project config — consistent file-wide |
| **Quotes** | Single or double per Prettier config — never mixed |
| **Trailing commas** | Enabled for cleaner diffs on multiline structures |

Backend and frontend may share root Prettier config or per-package config — values must not conflict across packages. Type-check (`tsc --noEmit`) runs in CI before merge.

---

## Documentation Standards

### JSDoc

Use JSDoc sparingly for **non-obvious** public APIs — not for every function.

| Use JSDoc | Skip JSDoc |
|-----------|------------|
| Port interfaces and their methods | Self-explanatory private helpers |
| Complex utility functions | Standard CRUD service methods |
| Exported constants with business meaning | Generated or obvious types |
| `@throws` on service methods throwing domain errors | React presentational components |

Keep JSDoc in sync with behavior. Prefer clear naming over comment explanation.

### Markdown

Engineering specs live in `docs/`. Follow existing document structure:

| Element | Convention |
|---------|------------|
| Title | `# Project — Topic` with document type blockquote |
| Authority line | Lists source documents |
| Tables | For rules, matrices, and comparisons |
| Code blocks | For JSON envelopes and folder trees — not application source |
| Maintenance section | When and how to update the doc |

Update the relevant spec when behavior changes — `api.md` for endpoints, `backend.md` for layer rules, etc.

### Comments

| Good comment | Bad comment |
|--------------|-------------|
| Why aggregation threshold is checked here | What the next line obviously does |
| Non-obvious business rule reference (`BR-STAT-001`) | Commented-out dead code |
| Workaround with ticket/issue link | Apologies or jokes |

No commented-out code in merged PRs. Remove or restore — do not leave stale blocks.

### README Updates

Update `README.md` when:

- Stack or deployment target changes
- Local development setup steps change
- New top-level package or script is added
- Git or contribution workflow changes

Keep README high-level; detailed rules belong in `docs/`.

---

## Git Workflow

Aligned with `README.md` Git Conventions and deployment branch model.

### Branch Naming

| Pattern | Usage |
|---------|-------|
| `main` | Production-ready; protected |
| `develop` | Optional staging integration branch |
| `feature/<short-description>` | New features — e.g., `feature/mood-edit-window` |
| `fix/<short-description>` | Bug fixes — e.g., `fix/feed-pagination-cursor` |
| `docs/<short-description>` | Documentation-only — e.g., `docs/testing-strategy` |
| `chore/<short-description>` | Tooling, deps, CI — e.g., `chore/eslint-config` |

Use lowercase kebab-case after the prefix. Keep names short and descriptive.

### Commit Message Convention

Use **Conventional Commits** (`frontend.md` Best Practices):

```
<type>(<optional scope>): <short summary>

<optional body>

<optional footer>
```

| Type | Usage |
|------|-------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code change without behavior change |
| `test` | Tests only |
| `chore` | Build, deps, tooling |
| `perf` | Performance improvement |

Summary in imperative mood: "add mood edit policy" not "added". Reference requirement IDs in body when useful: `FR-POST-007`, `NFR-SEC-002`.

### Pull Request Guidelines

| Requirement | Detail |
|-------------|--------|
| **Scope** | One logical change per PR — easier review and rollback |
| **Description** | What, why, and how to test |
| **Linked issues** | Reference issue or spec requirement when applicable |
| **CI green** | Lint, type-check, tests, audit pass |
| **No unrelated changes** | No drive-by refactors or formatting sweeps |
| **Docs** | Update specs if API, architecture, or conventions change |
| **Screenshots** | UI changes include before/after or screen recording |
| **Breaking changes** | Explicitly called out; require ADR and API version plan |

Protected branches require PR approval and passing CI before merge. Documentation-only PRs may skip deploy but still run applicable CI gates.

---

## Error Handling Convention

Unified error handling across backend and frontend (`backend.md`, `frontend.md`, `security.md`).

### Backend

| Rule | Detail |
|------|--------|
| **Typed errors** | Services throw `DomainError` hierarchy — controllers do not catch for formatting |
| **Global handler** | `errorHandler` middleware maps errors to HTTP + JSON envelope |
| **Envelope** | `{ success: false, error: { code, message, details?, requestId } }` |
| **Never expose** | Stack traces, MongoDB errors, R2 bucket names, object keys, JWT internals |
| **requestId** | Every error response includes correlation ID |
| **Async controllers** | Wrapped with `asyncHandler` — rejections propagate to handler |

| Error type | Typical HTTP |
|------------|--------------|
| `ValidationError` | 422 |
| `AuthenticationError` | 401 |
| `AuthorizationError` | 403 |
| `DomainError` (not found) | 404 |
| `DomainError` (conflict) | 409 |
| `RateLimitError` | 429 |
| Unknown | 500 `INTERNAL_ERROR` generic message |

### Frontend

| Rule | Detail |
|------|--------|
| **Map by code** | `utils/errors.ts` + `constants/errorMessages.ts` — not raw API messages for users |
| **Forms** | API `details` → React Hook Form `setError` |
| **Queries** | `isError` → ErrorBanner / EmptyState |
| **Mutations** | `onError` → Toast |
| **Error boundary** | App root catches render failures |
| **No stack traces in UI** | Calm copy per design intent |

Login failures show generic "Invalid email or password" — no enumeration.

---

## Logging Convention

Per `backend.md` and `security.md` Logging Strategy.

### Backend Application Logs

| Property | Value |
|----------|-------|
| **Format** | Structured JSON in production |
| **Level** | `info` production; `debug` development |
| **Correlation** | `requestId` on every request and error |

| Log | Do not log |
|-----|------------|
| Request complete: method, path, status, duration, `userId` if auth | Passwords, JWTs, refresh tokens |
| Auth failure: IP, path | Request bodies with credentials |
| Admin action: `adminId`, action, target | `authorId` with mood content in standard logs |
| R2 failure: operation (key server-side only) | Signed URLs |

### Frontend

| Environment | Policy |
|-------------|----------|
| Production | Minimal `console.error` — no PII |
| Development | Verbose allowed |
| API errors | Log `requestId` for support — not shown prominently to users |

### Audit Logs

Admin accountability uses MongoDB `auditlogs` — **separate** from application stdout logs. Append-only; administrators query via admin API only.

---

## Security Convention

Every contributor follows `security.md` as non-optional policy.

### Mandatory Rules

| Rule | Detail |
|------|--------|
| **Fail closed** | Invalid auth or validation → deny |
| **Backend authoritative** | Anonymity, RBAC, thresholds enforced server-side |
| **Validate at boundaries** | Zod at API ingress; business rules in services |
| **Reject unknown fields** | Strict schemas on create/update |
| **No secrets in git** | Ever |
| **bcrypt** | Passwords — cost factor 12 default |
| **JWT** | Short access TTL; refresh in HttpOnly cookie |
| **Ownership in services** | Not client-side checks alone |
| **Sanitize render** | Frontend user content through `sanitize.ts` |
| **No `dangerouslySetInnerHTML`** | On user content without pipeline |
| **Rate limits** | Auth, write, and feed endpoints |
| **Aggregation threshold** | `AGGREGATION_THRESHOLD_MIN` default 5 |

### Layer Responsibilities

| Concern | Owner |
|---------|-------|
| JWT validation | `authenticate` middleware |
| RBAC | `authorize` middleware + services |
| Public DTO anonymity | Mappers + repository projections |
| Upload MIME/size | Presign validation + client pre-check |
| CORS | Backend allowlist — production frontend only |

Security fixes include a regression test when feasible (`testing-strategy.md` bug fix protocol).

---

## Testing Convention

Follow `testing-strategy.md` for full strategy. Summary of **mandatory habits**:

| Rule | Detail |
|------|--------|
| **Pyramid** | Many unit tests; fewer integration; few E2E |
| **PR CI** | Unit + integration run on every PR |
| **Priority** | Domain/services, auth, anonymity DTOs, data integrity |
| **Backend services** | Mock repository ports — not Mongoose |
| **Backend HTTP** | Full middleware chain in integration tests |
| **Frontend leaves** | Presentational tests with props — no Query in MoodCard |
| **Naming** | `should <expected behavior> when <condition>` |
| **Fixtures** | Synthetic data in `backend/tests/fixtures/` |
| **No production data** | In tests or logs |
| **Bug fixes** | Test that failed before fix |

Colocate feature tests under `features/<name>/__tests__/` or `frontend/tests/`. Every new API endpoint adds contract tests for success and primary error paths.

---

## Dependency Management

| Rule | Detail |
|------|--------|
| **Lockfile** | Commit `package-lock.json` — reproducible CI installs |
| **Minimal deps** | Justify new packages — attack surface and bundle size |
| **Audit in CI** | `npm audit` on PR (`NFR-SEC-008`) |
| **Same major Node** | LTS aligned across frontend and backend (20.x or 22.x) |
| **Stack changes** | Require ADR — React, Express, MongoDB, Vite are mandated |
| **No duplicate HTTP clients** | Axios only on frontend; no second fetch wrapper |
| **Pin critical versions** | Document major upgrades in PR description |

Run install and test in the package directory affected (`frontend/` or `backend/`) — not repo root unless workspace configured.

---

## Code Review Checklist

Reviewers verify conventions — not only correctness.

### Architecture

- [ ] Clean Architecture boundaries respected — no forbidden imports
- [ ] Business logic in services/domain — not routes, controllers, or components
- [ ] Repository pattern for all MongoDB access
- [ ] Frontend: TanStack Query for server state; no duplicate cache in Context

### Security and Privacy

- [ ] Public responses exclude identity fields
- [ ] Auth and authorization tested or obviously enforced
- [ ] Input validated at API boundary
- [ ] No secrets, tokens, or credentials in code or logs
- [ ] User content sanitized before render

### API and Data

- [ ] Matches `api.md` contract — status, envelope, error codes
- [ ] Cursor pagination on new list endpoints
- [ ] Soft deletes and projections handled on public reads

### Quality

- [ ] Tests added or updated for behavior change
- [ ] Types strict — no unnecessary `any`
- [ ] ESLint and Prettier clean
- [ ] Error and loading states handled in UI
- [ ] No unrelated file changes or drive-by refactors

### Documentation

- [ ] Specs updated if behavior or API changed
- [ ] `.env.example` updated if new env vars added

---

## AI Assistant Rules

AI tools (Cursor, Copilot, and similar) must behave as **disciplined contributors** — not as code generators that bypass architecture.

### Always

| Rule | Detail |
|------|--------|
| **Read before write** | Read relevant `docs/` specs and surrounding code before editing |
| **Follow layer boundaries** | Clean Architecture on backend; feature isolation on frontend |
| **Use repository pattern** | All DB access through port implementations |
| **Prefer existing abstractions** | Extend services, components, and utils — do not duplicate |
| **Minimal diff scope** | Change only what the task requires |
| **Match conventions** | Naming, imports, error handling per this document |
| **Validate everywhere** | Never skip server validation because client validates |
| **Test meaningful behavior** | Add or update tests per `testing-strategy.md` |
| **Respect anonymity** | Never return or render `authorId` in public paths |
| **Document behavior changes** | Update relevant markdown specs |

### Never

| Rule | Detail |
|------|--------|
| **Never generate duplicate code** | Search for existing helpers before creating new ones |
| **Never bypass validation** | No shortcut endpoints or "internal" routes without auth |
| **Never modify unrelated files** | No formatting sweeps or opportunistic refactors |
| **Never put business logic in routes/controllers/components** | Services and domain only |
| **Never use Mongoose in controllers** | Repository layer only |
| **Never expose secrets** | In code, comments, tests, or docs |
| **Never use `localStorage` for refresh tokens** | HttpOnly cookie only |
| **Never commit credentials** | Or suggest committing `.env` files |
| **Never weaken security for convenience** | Fail closed |
| **Never skip tests** | For security, auth, or anonymity changes |

### Before Architectural Changes

Ask for clarification or propose an ADR when the change involves:

- New MongoDB collection or layer boundary shift
- New npm dependency or stack substitution
- Breaking API contract change
- New global state pattern (Context, Redux) for server data
- Bypassing R2 presigned upload flow
- Disabling or weakening rate limits, CORS, or validation

Default to the **smallest correct change** that satisfies the task. When specs conflict, `README.md` wins; for security, `security.md` wins.

### Implementation Session Discipline

1. State which docs and files were read.
2. Plan layer placement before writing code.
3. Implement with conventions applied.
4. Run lint, type-check, and relevant tests.
5. Summarize changes and spec updates needed.

---

## Future Conventions

Planned convention evolution — not yet binding:

| Area | Future convention |
|------|-------------------|
| **Shared package** | `packages/shared` for Zod schemas and DTO types — import rules TBD |
| **Monorepo tooling** | npm/pnpm workspaces with unified lint at root |
| **OpenAPI codegen** | Generated client types in frontend `types/api/` from Zod/OpenAPI |
| **Commit scopes** | Standardized scopes: `backend`, `frontend`, `docs`, `ci` |
| **ADR template** | Required file naming in `docs/adr/NNNN-title.md` |
| **i18n** | String key naming and extraction conventions |
| **Semantic versioning** | Release tags aligned with API `/api/v2` breaks |
| **CODEOWNERS** | Path-based review ownership in GitHub |
| **EditorConfig** | Shared indent and charset across editors |
| **API changelog** | `CHANGELOG.md` entries linked to Conventional Commits |

When these land, update this document and notify contributors in README.

---

## Related Documents

| Document | Conventions relevance |
|----------|----------------------|
| [`backend.md`](./backend.md) | Layer structure, naming, forbidden imports |
| [`frontend.md`](./frontend.md) | Feature modules, components, state, routing |
| [`security.md`](./security.md) | Security and logging policy |
| [`testing-strategy.md`](./testing-strategy.md) | Test placement, naming, CI expectations |
| [`api.md`](./api.md) | Route and error code naming |
| [`README.md`](../README.md) | Stack mandate, git conventions, coding standards |
| [`.cursor/rules/`](../.cursor/rules/) | AI guardrails per layer (when present) |

---

## Document Maintenance

| Event | Action |
|-------|--------|
| New folder or layer | Update Repository Structure and Folder Naming |
| New env var pattern | Update Environment Variable Naming |
| CI or git workflow change | Update Git Workflow |
| AI tooling policy change | Update AI Assistant Rules |
| Shared package introduced | Update Import Order and Future Conventions |

---

*This document defines the engineering conventions for Mood of the Major. All contributors and AI assistants must follow these standards alongside the layer-specific specifications in `docs/`.*
