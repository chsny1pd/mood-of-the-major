# Mood of the Major — Testing Strategy

> **Document type:** Quality assurance and testing specification  
> **Status:** Draft v1.0  
> **Authority:** Derives from [`backend.md`](./backend.md), [`frontend.md`](./frontend.md), [`api.md`](./api.md), [`security.md`](./security.md), and [`deployment.md`](./deployment.md). Where conflict exists, [`security.md`](./security.md) takes precedence for security-related test requirements.

---

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Testing Pyramid](#testing-pyramid)
3. [Backend Testing](#backend-testing)
4. [Frontend Testing](#frontend-testing)
5. [API Testing](#api-testing)
6. [Database Testing](#database-testing)
7. [Performance Testing](#performance-testing)
8. [Security Testing](#security-testing)
9. [Accessibility Testing](#accessibility-testing)
10. [Manual QA Checklist](#manual-qa-checklist)
11. [Regression Testing](#regression-testing)
12. [Test Data Strategy](#test-data-strategy)
13. [Future CI Testing Pipeline](#future-ci-testing-pipeline)
14. [Best Practices](#best-practices)
15. [Related Documents](#related-documents)

---

## Testing Philosophy

Mood of the Major is an **anonymous social platform** where trust, privacy, and correctness are inseparable. Testing must prove that anonymity is enforced in API responses, that authorization cannot be bypassed from the client, and that the system behaves predictably under normal and adversarial conditions — not merely that individual functions return expected values.

### Guiding Principles

| Principle | Testing implication |
|-----------|---------------------|
| **Backend is authoritative** | Tests validate server-side enforcement of anonymity, RBAC, and business rules — not UI hiding alone (`NFR-PRIV-003`). |
| **Clean Architecture testability** | Domain and application services are tested with mock repositories; infrastructure is tested separately (`backend.md` Repository Pattern). |
| **Contract alignment** | API tests assert shapes, status codes, and error codes defined in `api.md`. |
| **Fail closed** | Auth failures, validation failures, and ambiguous authorization must be tested as denial — never silent bypass (`security.md`). |
| **Defense in depth** | Security controls are tested at multiple layers: middleware, services, mappers, and repositories. |
| **Fast feedback** | Unit tests run on every PR; slower integration and E2E tests run in CI before merge and on staging. |
| **No secrets in tests** | Test fixtures use synthetic credentials; real production secrets never appear in test code or CI logs. |
| **Meaningful coverage** | Prioritize business rules, anonymity, auth, and data integrity over trivial coverage metrics (`NFR-MAINT-006`). |

### What Testing Must Prove

| Concern | Primary proof |
|---------|---------------|
| Anonymity | Public DTOs and feed responses contain no `authorId`, `userId`, or `email`. |
| Authorization | Protected routes reject missing JWT; admin routes reject student role; ownership enforced in services. |
| Data integrity | Cascades, unique constraints, denormalized counters, and soft deletes behave correctly. |
| API contract | Success envelopes, error envelopes, pagination cursors, and threshold responses match `api.md`. |
| Upload security | Presign rejects invalid MIME and oversized files; confirm verifies R2 object existence. |
| Client UX | Forms, guards, loading states, and error mapping produce correct user-facing behavior. |

### What Testing Does Not Replace

| Activity | Owner |
|----------|-------|
| Production security audit / penetration test | Phase 4 roadmap (`security.md`) |
| WCAG 2.1 AA formal audit | Deferred `NFR-UX-005`; v1 prevents preventable barriers |
| Load testing at full production scale | Staging benchmarks; capacity planning separate |
| Manual empathy and design review | QA against `DESIGN.md` copy and states |

### Priority Order (NFR-MAINT-006)

1. Domain and application service unit tests — business rules, thresholds, anonymity policies.
2. Auth flow integration tests — register, login, logout, refresh, token revocation.
3. Data integrity tests — cascades, unique constraints, counter updates.
4. Public DTO contract tests — no identity fields in anonymous responses.
5. Frontend auth flow and form validation tests.
6. End-to-end critical path tests on staging.

---

## Testing Pyramid

The test suite follows a **pyramid distribution**: many fast unit tests at the base, fewer integration tests in the middle, and a small set of high-value end-to-end tests at the top. This balances speed, cost, and confidence.

```
                    ┌─────────────┐
                    │     E2E     │  Critical user journeys (staging)
                    │   (few)     │
               ┌────┴─────────────┴────┐
               │     Integration       │  HTTP + DB + mocked externals
               │       (some)          │
          ┌────┴───────────────────────┴────┐
          │          Unit Tests               │  Domain, services, utils, components
          │            (many)                 │
          └───────────────────────────────────┘
```

### Unit Testing

**Scope:** Smallest testable units in isolation, with dependencies mocked or stubbed.

| Layer | What to unit test | Mock strategy |
|-------|-------------------|---------------|
| **Domain** | `AnonymityPolicy`, `AggregationThresholdPolicy`, `MoodEditPolicy`, domain errors | No mocks — pure logic |
| **Application services** | Business rules, ownership, cooldowns, threshold gating | Mock repository ports (`IMoodRepository`, etc.) |
| **Mappers** | Public DTO stripping of identity fields; admin DTO shape | Domain entities as input |
| **Validators** | Zod schema acceptance and rejection | Valid/invalid fixture objects |
| **Middleware** | Auth parsing, role assertion (with mocked `next`) | Mock JWT service, mock request/response |
| **Frontend utils** | Sanitization, error mapping, token helpers, formatters | Pure input/output |
| **Frontend components** | Presentational components with props | Mock callbacks; no TanStack Query |
| **Frontend hooks** | Isolated hook logic where extractable | Mock services and QueryClient |

**Characteristics:**

- Run in milliseconds per test.
- Execute on every pull request in CI.
- No network, no real MongoDB, no real R2.
- Primary vehicle for regression of business rules (`BR-*`, `FR-*` traceability).

**Anti-pattern:** Unit tests that boot Express, connect to MongoDB, or call live APIs — those belong in integration tests.

### Integration Testing

**Scope:** Multiple layers working together — typically HTTP request through middleware, controller, service, and either an in-memory/test database or mocked external adapters.

| Category | What is real | What is mocked |
|----------|--------------|----------------|
| **HTTP route integration** | Express app, middleware chain, controllers | Repositories or test MongoDB |
| **Repository integration** | Mongoose models, test MongoDB | Nothing (or minimal) |
| **Auth integration** | Full auth middleware + `AuthService` | Test user fixtures in DB |
| **R2 integration** | `ImageService` orchestration | `IImageStorage` mock or LocalStack-style stub |
| **Frontend service integration** | `apiClient` interceptors, envelope parsing | MSW (Mock Service Worker) or test server |

**Characteristics:**

- Slower than unit tests; run in CI on every PR.
- Use dedicated test database (`mood_of_the_major_test`) or ephemeral MongoDB (e.g., in-memory or Docker in CI).
- Reset database state between tests or use isolated fixtures per suite.
- Prove middleware ordering: CORS → rate limit → authenticate → authorize → validate → controller.

**Backend test layout** (per `backend.md`):

```
backend/tests/
├── unit/
├── integration/
└── fixtures/
```

### End-to-End Testing

**Scope:** Full system exercised through the browser (or API-only E2E where UI is out of scope), against a deployed or locally orchestrated stack.

| Journey | Coverage intent |
|---------|-----------------|
| Register → login → create mood → view in feed | Core student loop |
| Image upload (presign → PUT → confirm → publish) | R2 three-step flow |
| Guest feed → attempt protected action → login redirect | Route guards + API auth |
| Admin login → report queue → resolve report | Admin moderation path |
| Token expiry → silent refresh → retry request | Session continuity |
| Statistics page with threshold suppression | Threshold UX + API |

**Characteristics:**

- Run against **staging** environment (preferred) or local docker-compose stack.
- Fewest in count — reserve for critical paths and release gates.
- Slower and flakier; retry policies and explicit waits required.
- Not required on every PR save — run on merge to `develop`/`main` and before production promote.

**Tooling (at implementation):** Playwright or Cypress for browser E2E; optional API-only E2E with supertest against running server.

---

## Backend Testing

The backend follows Clean Architecture (`backend.md`). Tests respect layer boundaries: domain and services never require Express; controllers never require real MongoDB.

### Routes

Routes declare middleware chains and delegate to controllers — tests verify **wiring**, not business logic.

| Test focus | Method |
|------------|--------|
| Middleware attachment | Integration: assert protected routes return `401` without JWT |
| Path and method mapping | Integration: correct HTTP method + path reaches expected handler |
| Route grouping under `/api/v1` | Integration: all routes prefixed correctly |
| Public vs protected classification | Integration: public feeds accessible without auth; `/admin/*` requires admin JWT |
| No business logic in routes | Code review + absence of direct repository imports in route files |

**Do not test:** Business rule outcomes in route files — test via service or integration tests through the full stack.

### Controllers

Controllers are thin HTTP adapters. Tests verify extraction, delegation, and response envelope — not business rules.

| Test focus | Method |
|------------|--------|
| Validated input passed to service | Unit: mock service; assert called with plain arguments |
| Success response envelope | Integration: `{ success: true, data, meta? }` shape |
| HTTP status codes | Integration: `201` on create, `200` on read, etc. |
| Error propagation | Unit/integration: thrown domain errors reach `errorHandler` |
| No Mongoose in controllers | Static analysis / lint rule |
| Async error handling | Controller wrapped with `asyncHandler`; unhandled rejections caught |

### Services

Application services are the **primary unit test target** (`backend.md` Testing Priorities).

| Service area | Key test cases |
|--------------|----------------|
| `AuthService` | Register hashes password; login generic failure; suspended user blocked; email normalized |
| `MoodService` | Create with tags/images; edit window 24h; owner-only edit/delete; anonymity in return path |
| `CommentService` | Thread depth ≤ 3; comment count increment/decrement |
| `ReactionService` | Upsert one reaction per user; summary counts updated; no identity in response |
| `BookmarkService` | Duplicate bookmark → conflict; bookmark list includes removed moods |
| `StatisticsService` | `meetsThreshold` gating when count < `AGGREGATION_THRESHOLD_MIN` |
| `ImageService` | Presign validates MIME/size; confirm checks ownership; delete soft-deletes |
| `ReportService` | Cooldown duplicate; reporter hidden from author |
| `AdminService` | Moderation writes audit log; identity access triggers audit |

**Pattern:** Inject mock repositories implementing domain ports. Assert thrown `DomainError` types and codes match `api.md` error catalog.

### Repositories

Repository tests use a **test MongoDB instance** (integration tier).

| Test focus | Method |
|------------|--------|
| CRUD operations | Create, read, update, soft-delete per collection |
| Projection profiles | `publicProfile` excludes `authorId`; `adminProfile` includes it |
| Cursor pagination | Feed queries return correct `nextCursor` encoding |
| Soft delete filters | Public reads exclude `deletedAt` and inactive status |
| Unique constraints | Duplicate bookmark, duplicate reaction per user |
| Denormalized counters | `$inc` on `commentCount`, `reactionSummary` |
| Parameterized queries | No raw user input in query operators |

**Do not:** Call repositories from controller tests directly — go through services or HTTP integration tests.

### Authentication

| Test case | Expected outcome |
|-----------|------------------|
| Missing `Authorization` header on protected route | `401 AUTH_REQUIRED` |
| Malformed JWT | `401 AUTH_INVALID_TOKEN` |
| Expired JWT | `401 AUTH_EXPIRED_TOKEN` |
| Valid JWT with suspended user | `401` or `403 ACCOUNT_SUSPENDED` |
| `tokenVersion` mismatch after password change | `401 AUTH_INVALID_TOKEN` |
| Refresh token rotation | New access token issued; old refresh invalidated |
| Refresh token reuse detection | All sessions revoked |
| Login wrong password | `401 AUTH_INVALID_CREDENTIALS` — generic message |
| Login rate limit exceeded | `429 RATE_LIMIT_EXCEEDED` |
| Register duplicate email | `422 EMAIL_ALREADY_EXISTS` |
| bcrypt rounds applied | Hash stored, not plaintext |

Test JWT validation in `authenticate` middleware in isolation and as part of auth integration suites.

### Authorization

| Test case | Expected outcome |
|-----------|------------------|
| Student hits `POST /api/v1/moods` | `201` with valid JWT |
| Guest hits `POST /api/v1/moods` | `401` |
| Student hits `GET /api/v1/admin/dashboard` | `403 INSUFFICIENT_ROLE` |
| Administrator hits admin routes | `200` |
| Student edits another user's mood | `403 NOT_OWNER` |
| Owner edits mood after 24h window | `403 EDIT_WINDOW_EXPIRED` |
| Student views signed image URL for mood they can view | `200` |
| Unauthorized user requests image URL | `403` |
| Advisor/advisor statistics access | Per `OD-009` when resolved |

Ownership checks must be tested in **application services**, not only middleware.

### Validation

Multi-layer validation per `backend.md` and `security.md`:

| Layer | Test approach |
|-------|---------------|
| **API ingress (Zod)** | Unknown fields rejected; invalid ObjectId params → `400`/`422`; shape violations → `422 VALIDATION_FAILED` with `details` |
| **Application service** | Business rules: max 4 images, tag count, report cooldown, edit window |
| **Domain services** | Threshold and anonymity invariants |
| **Mongoose schema** | Persistence-level enum and required field enforcement |

| Feature | Key validation tests |
|---------|---------------------|
| Auth | Password 8–128 chars; email format; optional domain allowlist |
| Mood | Content 1–5000 chars; ≥1 tag; `primaryTagId` in `tagIds` |
| Comment | Content 1–2000 chars; `parentId` depth ≤ 3 |
| Image | MIME allowlist; ≤ 5 MB; dimensions on confirm |
| Report | Reason enum; description max 1000 chars |

Assert error envelope: `{ success: false, error: { code, message, details?, requestId } }`.

### Cloudflare R2 Integration

Backend never receives image binaries (`FR-IMG-007`). Tests focus on orchestration and the `IImageStorage` port.

| Stage | Test focus | Mock strategy |
|-------|------------|---------------|
| **Presign** | MIME rejection; size rejection; pending `moodimages` row created; response excludes R2 secrets | Mock `IImageStorage.generatePresignedUploadUrl` |
| **Confirm** | Uploader-only; HEAD object success/failure; status → `confirmed` | Mock `headObject` |
| **Download URL** | Authorization to view parent mood; `confirmed` status required; URL not persisted in DB | Mock `generateSignedDownloadUrl` |
| **Delete** | Soft-delete metadata; delete job enqueued | Mock `deleteObject` |
| **Orphan cleanup** (future job) | Unlinked pending images older than 24h marked orphaned | Integration with fixtures |

Integration tests must assert:

- No R2 bucket names or object keys in client-facing error messages.
- Presigned URL TTL and signed download TTL match operational values (15 min / 1 hour).
- Object key format follows `{environment}/moods/{userId}/{timestamp}-{uuid}.{ext}`.

Optional: contract tests against R2 dev bucket in staging-only pipeline (not PR CI).

---

## Frontend Testing

The frontend is a presentation layer (`frontend.md`). Tests prove correct rendering, state management, and API integration — not authoritative business rule enforcement.

### Components

| Component tier | Test approach |
|----------------|---------------|
| **Shared primitives** (`components/`) | Render with props; assert DOM, accessibility attributes, loading/skeleton variants |
| **Feature components** | Render with mock data; assert anonymity (no author name/avatar) |
| **Presentational purity** | Leaf components have no TanStack Query — test with static props |
| **Interactive behavior** | User events (click, keyboard); callback invocation |
| **Sanitization** | User content passed through `sanitize.ts` before render — XSS strings neutralized |

**Priority components:** MoodCard, CommentCard, EmptyState, ErrorBanner, UploadImage, Modal, StatisticsCard (threshold state), AuthGuardPrompt.

**Snapshot tests:** Use sparingly for stable anonymous DTO rendering — assert absence of identity fields, not full DOM snapshots that churn on styling.

### Pages

Pages are thin orchestration shells. Test at page level only when verifying **composition**:

| Test focus | Method |
|------------|--------|
| Page renders layout + feature components | Integration with mocked hooks |
| Route params passed to features | `moodId`, `facultyId`, `majorId` from router |
| Loading / error / empty states delegated | Mock hook return values |
| No direct Axios in pages | Lint / code review |

Prefer testing feature containers and hooks over full page trees when equivalent coverage exists.

### Forms

All forms use React Hook Form + Zod (`frontend.md` Forms).

| Form | Test cases |
|------|------------|
| Register | Rejects short password; requires letter+digit; shows inline errors on blur |
| Login | Required fields; generic error on `AUTH_INVALID_CREDENTIALS` |
| Create mood | Character count; tag required; blocks submit with pending uploads |
| Comment | Length limits; submit disabled while pending |
| Report | Reason enum required; description max length |
| Change password | New password rules; current password required |

| Layer | Authority | Test intent |
|-------|-----------|-------------|
| Client Zod | UX only | Field errors before API call |
| API `VALIDATION_FAILED` | Server | `details` mapped to `setError` on fields |

Test that valid field values are preserved on submission failure (`DESIGN.md`).

### Hooks

| Hook category | Test approach |
|---------------|---------------|
| **Feature hooks** (`useMoodFeed`, `useCreateMood`, etc.) | Wrap in `QueryClientProvider`; mock services; assert query keys, invalidation |
| **Auth hooks** (`useAuth`, `useRequireAuth`) | Mock AuthContext; assert redirect logic |
| **Upload hook** (`useImageUpload`) | State machine: select → presign → progress → confirm → `imageIds` |
| **Cross-feature hooks** (`useDisclosure`, `useMediaQuery`) | Isolated behavior |

Use TanStack Query test utilities; set `retry: false` to avoid flaky retries.

### API Layer

Services in `services/` wrap `apiClient` — no React imports.

| Test focus | Method |
|------------|--------|
| Request paths match `api.md` | Unit with mocked Axios |
| Bearer token attachment | Interceptor adds header except `/auth/login`, `/auth/register` |
| Envelope unwrapping | `{ success, data, meta }` → typed return |
| Error normalization | Axios error → `ApiError` with `code`, `requestId` |
| Refresh on `401 AUTH_EXPIRED_TOKEN` | Interceptor calls refresh once and retries |
| Refresh failure | Tokens cleared; redirect to login (mock `window.location`) |
| `withCredentials: true` on refresh | Cookie sent for `/auth/refresh` |

MSW recommended for integration tests of service + interceptor behavior.

### Routing

| Test focus | Method |
|------------|--------|
| `GuestGuard` | Authenticated user redirected from `/login`, `/register` |
| `AuthGuard` | Guest redirected to `/login?returnUrl=...` |
| `AdminGuard` | Non-admin redirected from `/admin/*` |
| `StudentGuard` | Non-student blocked from `/create` |
| `RoleGuard` | Statistics access per role (`OD-009`) |
| 404 catch-all | Unknown path renders Not Found page |
| Lazy loading | Admin routes in separate chunk (build analysis, not unit test) |

Use React Router memory router in tests with mocked AuthContext.

### Authentication Flow

End-to-end auth UX tests (integration or E2E):

| Flow | Assertions |
|------|------------|
| Register → redirect to feed | Token stored; `['auth', 'me']` populated |
| Login with returnUrl | Navigate to preserved path after success |
| Logout | Tokens cleared; protected routes redirect |
| Expired access token mid-session | Silent refresh; request succeeds |
| Refresh failure | Redirect login; no infinite retry loop |
| Suspended account | Appropriate error message |
| Guest protected action | AuthGuardPrompt or redirect |

Verify access token not in `localStorage` for refresh; refresh via HttpOnly cookie is browser/E2E concern.

---

## API Testing

API tests treat `api.md` as the **contract specification**. Tests are organized by outcome category and run as backend HTTP integration tests (supertest or equivalent) against a test app instance.

### Success Cases

For each endpoint group, test happy paths:

| Domain | Representative success tests |
|--------|------------------------------|
| Auth | Register `201`; login `200`; logout `200`; refresh `200`; `/auth/me` `200` |
| Faculties / majors | List and detail `200`; slug and ObjectId resolution |
| Moods | Create `201`; feed `200` with cursor meta; detail `200`; patch `200`; delete `200` |
| Comments | List paginated; create `201`; threading with `parentId` |
| Reactions | Upsert `200`; remove `200`; public counts `200` |
| Bookmarks | Create `201`; list `200`; delete `200` |
| Images | Presign `201`; confirm `200`; signed URL `200` |
| Reports | Submit `201` |
| Statistics | Dashboard `200`; threshold-met responses include distribution |
| Admin | Dashboard, users, reports, audit logs `200` for administrator |

Assert:

- `success: true`
- Required fields present per anonymous DTO definitions
- ISO 8601 UTC date strings
- Pagination meta: `limit`, `nextCursor`, `hasMore`
- `isBookmarked` and `userReaction` only when authenticated

### Validation Errors

| Test case | HTTP | Code |
|-----------|------|------|
| Missing required body fields | `422` | `VALIDATION_FAILED` |
| Unknown body fields on strict schema | `422` | `VALIDATION_FAILED` |
| Invalid ObjectId in path | `400` or `422` | `VALIDATION_FAILED` |
| Mood content too long | `422` | `VALIDATION_FAILED` |
| Invalid MIME on presign | `422` | `INVALID_MIME_TYPE` |
| File too large on presign | `422` | `FILE_TOO_LARGE` |
| Confirm without R2 object | `422` | `UPLOAD_NOT_FOUND_IN_R2` |
| Search query too short | `422` | `VALIDATION_FAILED` |

Assert `details` array contains `field` and `message` for field-level errors.

### Authentication Errors

| Test case | HTTP | Code |
|-----------|------|------|
| No token on protected route | `401` | `AUTH_REQUIRED` |
| Invalid JWT signature | `401` | `AUTH_INVALID_TOKEN` |
| Expired JWT | `401` | `AUTH_EXPIRED_TOKEN` |
| Wrong login credentials | `401` | `AUTH_INVALID_CREDENTIALS` |
| Invalid refresh token | `401` | `AUTH_INVALID_TOKEN` |

Assert generic login message — no email enumeration.

### Authorization Errors

| Test case | HTTP | Code |
|-----------|------|------|
| Student on admin route | `403` | `INSUFFICIENT_ROLE` |
| Non-owner mood edit | `403` | `NOT_OWNER` |
| Edit window expired | `403` | `EDIT_WINDOW_EXPIRED` |
| Suspended user login | `403` | `ACCOUNT_SUSPENDED` |
| Image URL without view permission | `403` | `FORBIDDEN` |
| Guest on authenticated search | `401` | `AUTH_REQUIRED` |

### Rate Limiting

Per `api.md` and `security.md`:

| Endpoint group | Limit | Test approach |
|----------------|-------|---------------|
| `POST /auth/login`, `/auth/register` | 10 / 15 min / IP | Send 11 requests; assert `429` on 11th |
| `POST /moods`, `/comments` | 30 / hour / user | Exceed per-user limit with valid JWT |
| `GET` feeds | 120 / min / user | Burst requests; assert `429` |
| General API | 300 / min / IP | IP-based cap |

Assert:

- HTTP `429`
- Code `RATE_LIMIT_EXCEEDED`
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Optional `Retry-After`

Rate limit tests may use shortened windows via test env configuration.

### File Upload

API-level upload tests (presign and confirm — not binary through Express):

| Test case | Expected |
|-----------|----------|
| Valid presign request | `201` with `imageId`, `uploadUrl`, `uploadHeaders`, `expiresAt` |
| Invalid MIME | `422 INVALID_MIME_TYPE` |
| Oversized file metadata | `422 FILE_TOO_LARGE` |
| Unauthenticated presign | `401` |
| Non-student presign | `403` |
| Confirm as non-uploader | `403` |
| Confirm success | `200`; status `confirmed` |
| Delete unlinked image | `200`; soft-delete scheduled |

Direct PUT to R2 is tested in E2E or staging integration — not in unit/API tests against Express.

---

## Database Testing

Database tests run against a **dedicated test database** — never production or shared development data.

### CRUD

| Collection | CRUD test focus |
|------------|-----------------|
| `users` | Create with hash; update profile; soft-delete; status suspend |
| `moods` | Create with `authorId`; soft-delete; status transitions |
| `comments` | Create; soft-delete; parent linkage |
| `reactions` | Upsert; delete; unique per user per target |
| `bookmarks` | Create; delete; unique per user per mood |
| `moodimages` | Pending → confirmed → deleted lifecycle |
| `reports` | Create pending; admin resolve |
| `notifications` | Create; mark read; delete |
| `tags` | Admin CRUD; deactivate (no hard delete with references) |
| `auditlogs` | Append-only create; no update/delete in normal ops |

### Relationships

| Relationship | Test intent |
|--------------|-------------|
| Mood → moodtags → tags | Tags linked on create; primary tag flagged |
| Mood → comments | Cascade soft-delete or retention policy |
| Mood → moodimages | Link on publish; cascade on mood delete |
| Mood → reactions | Summary denormalization |
| User → bookmarks → moods | Join for bookmark list including removed public moods |
| Faculty → majors | Major belongs to faculty; filter by facultyId |
| Report → mood/comment | Target reference integrity |

Use MongoDB transactions where multi-document writes occur (mood + moodtags create).

### Aggregation Pipelines

Statistics and trending read pre-aggregated collections — test pipeline logic in repository or job modules:

| Pipeline | Test focus |
|----------|------------|
| Daily statistics upsert | Idempotent job; correct date bucketing UTC |
| Emotion statistics | Distribution counts; `meetsThreshold` flag |
| Trending calculation | Delta and direction; threshold enforcement |
| Faculty mood summary | Partial summary when below threshold |

Prefer **fixture datasets** with known counts (e.g., 4 moods → threshold not met; 5 → met).

### Indexes

| Test type | Method |
|-----------|--------|
| Index existence | Schema sync or migration test asserts indexes created |
| Query plans (staging) | Explain on feed, search, cursor pagination queries |
| Compound indexes | Feed cursor `(createdAt, _id)` supports pagination |
| Text index | Search on `moods.content` returns expected matches |
| Unique indexes | Duplicate key error on bookmark/reaction violation |

Index performance validation is part of performance testing; correctness of indexed queries is integration-tested with representative data volumes.

---

## Performance Testing

Aligned with `NFR-PERF-*` and `backend.md` Performance Considerations.

### Targets

| Operation | p95 target | Test environment |
|-----------|------------|------------------|
| Feed read | ≤ 500 ms | Staging with production-like data volume |
| Presign URL | ≤ 200 ms | Staging / load test |
| Statistics dashboard | ≤ 2 s | Staging |
| Frontend Lighthouse (key pages) | ≥ 80 | Vercel preview or staging |

### Approach

| Phase | Activity |
|-------|----------|
| **Development** | Avoid anti-patterns (unbounded `find`, live full-scan aggregations) via code review |
| **Integration** | Assert pagination limits enforced (default 20, max 50) |
| **Staging benchmark** | k6, Artillery, or similar against `/moods/feed`, `/images/upload-url`, `/statistics/dashboard` |
| **Frontend** | Lighthouse CI on feed and create mood pages |
| **Database** | Atlas slow query log review; explain plans for feed and search |

### Scenarios

| Scenario | Metrics |
|----------|---------|
| Concurrent feed readers | p95 latency, error rate |
| Burst mood creation | Rate limit behavior; write latency |
| Dashboard under load | Parallel statistics reads |
| Cursor pagination depth | Stable latency on page 10+ |
| Signed URL cache (frontend) | Reduced repeat fetches before `expiresAt` |

Performance regressions block release if p95 exceeds targets by agreed margin (e.g., 20%) on staging benchmarks.

---

## Security Testing

Security testing implements `security.md` Production Checklist and threat model verification.

### Automated Security Tests

| Area | Tests |
|------|-------|
| **Anonymity** | Snapshot/contract: public mood, comment, feed responses exclude identity fields |
| **Auth bypass** | All protected routes reject unauthenticated requests |
| **RBAC** | Admin routes reject student; student cannot access admin DTOs |
| **Ownership** | Cross-user edit/delete returns `403 NOT_OWNER` |
| **JWT** | Expired, tampered, wrong `alg`, wrong `tokenVersion` rejected |
| **Rate limits** | Auth and write endpoints enforce limits |
| **Input validation** | NoSQL injection payloads rejected (`{ "$gt": "" }` on string fields) |
| **Error exposure** | `500` responses contain no stack trace, bucket names, or object keys |
| **Upload** | MIME allowlist; size cap; presign requires auth |
| **Threshold** | Statistics below minimum return suppressed data |
| **Audit** | Admin identity access creates audit log with `identityAccessed: true` |

### Dependency Security

Per `NFR-SEC-008` and `deployment.md`:

- `npm audit` in GitHub Actions on every PR for `frontend/` and `backend/`.
- Failing high/critical vulnerabilities block merge (policy at implementation).

### Manual / Periodic Security Activity

| Activity | Timing |
|----------|--------|
| Production checklist walkthrough | Pre-launch |
| Penetration test | Phase 4 before launch (`security.md`) |
| CORS verification | Staging — unknown origin blocked |
| Secret scan | Pre-commit or CI — no credentials in repo |
| Atlas IP allowlist review | Each Railway egress change |

### Frontend Security Tests

| Test | Intent |
|------|--------|
| Sanitization utility | XSS payloads do not execute |
| No `dangerouslySetInnerHTML` on user content | Lint or grep gate |
| Token storage | Refresh not in `localStorage` |
| Error UI | No stack traces or storage internals displayed |

---

## Accessibility Testing

Full WCAG 2.1 AA audit is deferred (`NFR-UX-005`); v1 tests prevent **preventable barriers** (`frontend.md` Accessibility).

### Automated Accessibility

| Tool | Scope |
|------|-------|
| axe-core (jest-axe or Playwright) | Key pages: feed, create mood, login, statistics |
| eslint-plugin-jsx-a11y | CI lint gate |

### Manual Accessibility Checks

| Requirement | Verification |
|-------------|--------------|
| Keyboard navigation | Tab order; modal focus trap; Escape closes |
| Icon buttons | `aria-label` present |
| Form labels | `htmlFor` / `id` association |
| Error messages | `aria-describedby` linking fields to errors |
| Landmarks | `nav`, `main`, `complementary` |
| Toast announcements | `aria-live="polite"` |
| Color contrast | Spot check light and dark themes |
| Touch targets | ≥ 44×44px on mobile views |
| Reduced motion | Animations respect `prefers-reduced-motion` |

### Component-Level Tests

Assert accessible names on: Navbar links, ReactionPicker, Modal, AccountMenu, MoodCard interactive controls, admin Table actions.

---

## Manual QA Checklist

Execute on **staging** before production promotion in a full commercial launch. For the **classroom deployment**, execution on **local** (`npm run dev`) with production smoke test is sufficient — see [`docs/production-checklist-audit.md`](./production-checklist-audit.md). Complements automated tests with design and UX verification.

### Authentication and Session

- [ ] Register new student account
- [ ] Login with valid credentials
- [ ] Login failure shows generic message (no field hints)
- [ ] Logout clears session
- [ ] Token refresh works during long session
- [ ] Suspended account cannot login
- [ ] Guest redirected from `/create` with returnUrl preserved

### Student Core Flows

- [ ] Global feed loads with pagination (load more / infinite scroll)
- [ ] Faculty and major feeds filter correctly
- [ ] Create mood with tags and text
- [ ] Create mood with up to 4 images (presign → upload → confirm → publish)
- [ ] Mood detail shows comments and reactions
- [ ] Add comment and threaded reply (depth limit enforced in UI)
- [ ] React to mood and comment; counts update
- [ ] Bookmark mood; view bookmarks list
- [ ] Search with filters (authenticated)
- [ ] Report mood or comment
- [ ] Trending page loads

### Anonymity and Privacy

- [ ] No usernames, avatars, or emails on public mood/comment cards
- [ ] Statistics show "Insufficient data" when below threshold
- [ ] Public API responses (browser network tab) contain no `authorId`

### Images

- [ ] Invalid file type rejected before upload
- [ ] Oversized file rejected
- [ ] Upload progress displayed
- [ ] Images render in feed and detail via signed URLs
- [ ] Broken image placeholder and retry on failure

### Statistics

- [ ] Dashboard loads within acceptable time
- [ ] Scope selector (platform / faculty / major) works
- [ ] Charts and KPIs match threshold state
- [ ] Dark mode readable

### Admin

- [ ] Non-admin cannot access `/admin`
- [ ] Report queue lists pending reports
- [ ] Resolve report with moderation action
- [ ] User suspend / reinstate
- [ ] Admin mood view shows identity (admin only)
- [ ] Audit log records moderation and identity access

### Error and Loading States

- [ ] Feed skeleton on initial load
- [ ] Empty states with appropriate CTAs
- [ ] Error banner with retry on feed failure
- [ ] Form preserves content on submit failure
- [ ] Rate limit shows calm cooldown message

### Cross-Browser and Responsive

- [ ] Chrome, Firefox, Safari (or Edge)
- [ ] Mobile viewport: bottom nav, filter drawer
- [ ] Desktop: sidebar and layout

---

## Regression Testing

Regression testing ensures new changes do not break existing behavior.

### Automated Regression

| Suite | Trigger | Scope |
|-------|---------|-------|
| Unit tests | Every PR | Domain, services, utils, components |
| Integration tests | Every PR | API routes, auth, repositories |
| Contract tests | Every PR | Public DTO shape, error codes |
| E2E smoke | Merge to `main` / staging deploy | Critical paths |
| Lighthouse | Weekly or pre-release | Frontend performance budget |

### Regression Triggers for Expanded Testing

Run full manual QA checklist when changing:

- Authentication or JWT strategy
- Anonymity mappers or public projections
- Rate limiting configuration
- R2 upload/download flow
- Statistics aggregation or threshold logic
- Admin moderation or audit logging
- CORS or CSP configuration

### Bug Fix Protocol

Every production bug fix includes:

1. A test that reproduces the bug (fails before fix).
2. Fix implementation.
3. Test passes — permanently guards against recurrence.

---

## Test Data Strategy

### Principles

| Rule | Detail |
|------|--------|
| **Isolation** | Tests use dedicated fixtures — never production data |
| **Deterministic** | Fixed seeds for IDs, dates, and counts where possible |
| **Minimal** | Smallest dataset that proves the behavior |
| **Anonymity-safe** | Fixture emails and names are synthetic (`test-*@example.com`) |
| **Cleanup** | Reset test DB between suites or use transactions |

### Backend Fixtures

Located in `backend/tests/fixtures/`:

| Fixture type | Contents |
|--------------|----------|
| Users | Student, administrator, advisor, suspended user |
| Faculties / majors | Active reference data |
| Tags | Emotion tags with slugs and color tokens |
| Moods | With and without images; varied timestamps for pagination |
| Threshold datasets | Exactly 4 vs 5 moods for threshold boundary tests |
| Images | Pending, confirmed, orphaned `moodimages` metadata |

Factory helpers create entities through repositories or direct model inserts — prefer repository path to match production code.

### Frontend Fixtures

| Fixture type | Usage |
|--------------|-------|
| Anonymous mood DTOs | Component and hook tests |
| API mock handlers (MSW) | Service and integration tests |
| Auth context states | Guest, student, admin session mocks |
| Error responses | Per `api.md` error codes |

### Environment-Specific Data

| Environment | Data policy |
|-------------|-------------|
| **Test (CI)** | Ephemeral; seeded per run |
| **Development** | Local seed script; disposable |
| **Staging** | Realistic volume; no production copies; reset on schedule |
| **Production** | No test accounts with weak passwords; no debug endpoints |

### Sensitive Data

Never commit real passwords, JWT secrets, or Atlas URIs. CI uses GitHub Actions secrets for integration tests requiring external services — minimal scope.

---

## Future CI Testing Pipeline

Current CI per `deployment.md`: lint, type-check, unit tests, dependency audit on PR; deploy on merge. The following describes the **target mature pipeline** at implementation.

### Pull Request Pipeline

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Lint +     │   │    Unit      │   │ Integration  │   │   Security   │
│  Typecheck   │──►│    Tests     │──►│    Tests     │──►│    Audit     │
│ (parallel)   │   │ (parallel)   │   │  (MongoDB)   │   │  npm audit   │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
         frontend-ci                          backend-ci
                    (jobs run in parallel)
```

| Job | Gates |
|-----|-------|
| `frontend-ci` | ESLint, `tsc --noEmit`, Vitest/Jest, npm audit |
| `backend-ci` | ESLint, `tsc --noEmit`, unit + integration tests, npm audit |
| Optional | axe accessibility on changed pages |
| Optional | Contract test job comparing responses to `api.md` schemas |

### Merge to Staging

| Step | Action |
|------|--------|
| Deploy | Railway staging + Vercel staging |
| Smoke | Health checks + authenticated API ping |
| E2E | Playwright suite against staging URL |
| Manual | QA subset or full checklist for release candidates |

### Merge to Production

| Step | Action |
|------|--------|
| Require | Green CI + staging E2E + manual sign-off |
| Deploy | Railway + Vercel production |
| Post-deploy | Smoke test script (health, faculties, login, feed) |
| Monitor | Error rate and latency alerts first 30 minutes |

### Planned Enhancements

| Enhancement | Purpose |
|-------------|---------|
| **Reusable workflows** | `ci-reusable.yml` shared by PR and deploy (`deployment.md`) |
| **Path filters** | Skip CI when only `docs/**` changes |
| **Coverage reporting** | PR comments with coverage delta (thresholds on critical paths) |
| **Lighthouse CI** | Performance regression gate |
| **k6 staging benchmarks** | Weekly scheduled performance run |
| **Visual regression** | Optional Chromatic for design-critical components |
| **Shared Zod contract tests** | When `packages/shared` exists — frontend/backend schema parity |
| **MongoDB in CI** | Docker service container for integration tests |
| **Staging seed + E2E** | Automated data seed before Playwright run |
| **Sentry release tracking** | Tie test runs to deploy SHA |

### Test Runner Selection

| Package | Recommended runner |
|---------|-------------------|
| Backend | Vitest or Jest with supertest for HTTP |
| Frontend | Vitest + React Testing Library |
| E2E | Playwright |
| API load | k6 or Artillery |

Exact choice documented in package.json at implementation — strategy assumes modern JS test tooling with TypeScript support.

---

## Best Practices

### General

| Practice | Rationale |
|----------|-----------|
| Test behavior, not implementation | Refactor-safe suites |
| One assertion focus per test | Clear failure diagnosis |
| Descriptive test names | Document intent (`should reject presign when MIME is application/pdf`) |
| Arrange-Act-Assert | Consistent structure |
| Avoid test interdependence | Order-independent execution |
| Fail fast in CI | Run unit tests before integration |

### Backend

| Practice | Rationale |
|----------|-----------|
| Mock ports, not Mongoose in service tests | Clean Architecture (`backend.md`) |
| Test domain without I/O | Fast, pure business rule coverage |
| HTTP tests through full middleware chain | Proves wiring and auth order |
| Assert error codes, not messages only | Contract stability (`api.md`) |
| Never assert on internal fields in public DTO tests | Anonymity guarantee |

### Frontend

| Practice | Rationale |
|----------|-----------|
| Test presentational components with props | No TanStack Query in leaf tests |
| Mock services in hook tests | Isolates data layer |
| Use `QueryClient` with `retry: false` | Reduces flakiness |
| Test error code → user message mapping | `utils/errors.ts` coverage |
| Prefer user-event over fireEvent | Realistic interactions |

### CI and Maintenance

| Practice | Rationale |
|----------|-----------|
| Tests run in GitHub Actions on every PR | `INT-DEP-005`, `deployment.md` |
| Block merge on failing tests | Protected branches |
| Keep tests close to code | `backend/tests/`, `features/*/__tests__/` |
| Update tests when `api.md` changes | Contract sync |
| Flaky test policy | Fix or quarantine immediately — no ignored failures |

### Anti-Patterns

| Anti-pattern | Why avoid |
|--------------|-----------|
| Testing anonymity only in UI | Backend must strip identity (`BR-ANON-001`) |
| E2E for every edge case | Slow, brittle — use unit/integration |
| Shared mutable test state | Order-dependent failures |
| Production database in tests | Data corruption and privacy risk |
| Skipping auth tests on "internal" routes | Security gap |
| Coverage chasing with meaningless tests | False confidence |
| Hard-coded dates without clock mock | Time-dependent flakiness |

---

## Related Documents

| Document | Testing relevance |
|----------|-------------------|
| [`backend.md`](./backend.md) | Layer boundaries, test folder structure, testing priorities |
| [`frontend.md`](./frontend.md) | Component patterns, auth flow, form validation, testing priorities |
| [`api.md`](./api.md) | Contract for API and error code tests |
| [`security.md`](./security.md) | Security test requirements, production checklist |
| [`deployment.md`](./deployment.md) | CI/CD gates, environments, staging E2E target |
| [`authentication.md`](./authentication.md) | JWT and refresh flows for auth tests |
| [`cloudflare-r2.md`](./cloudflare-r2.md) | Upload/download TTLs and limits for image tests |
| [`database.md`](./database.md) | Schema, indexes, relationships for DB tests |
| [`SPECS.md`](../SPECS.md) | Requirement traceability (`FR-*`, `NFR-*`, `BR-*`) |

---

## Document Maintenance

| Event | Action |
|-------|--------|
| New API endpoint | Add API test cases; update contract tests |
| Auth policy change | Update auth and E2E test sections |
| New error code | Add to validation/auth test tables |
| Performance target change | Update performance testing section |
| CI workflow implementation | Sync Future CI Pipeline with actual workflows |
| Production incident | Add regression test requirement to checklist |
| Open decision resolved (`OD-002`, `OD-009`) | Update route and authorization test cases |

---

*This document defines the complete testing strategy for Mood of the Major. All test implementation must align with these specifications and the architecture described in the related engineering documents.*
