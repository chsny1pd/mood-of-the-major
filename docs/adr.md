# Mood of the Major — Architecture Decision Records

> **Document type:** Architecture Decision Record (ADR) log  
> **Status:** Draft v1.0  
> **Authority:** Derives from [`architecture.md`](./architecture.md), [`database.md`](./database.md), [`backend.md`](./backend.md), [`frontend.md`](./frontend.md), [`security.md`](./security.md), and [`deployment.md`](./deployment.md). Where conflict exists, [`README.md`](../README.md) takes precedence for stack mandates.

---

## Table of Contents

1. [Purpose](#purpose)
2. [ADR Format](#adr-format)
3. [Decision Index](#decision-index)
4. [ADR-001 — React + Vite](#adr-001--react--vite)
5. [ADR-002 — Express.js instead of NestJS](#adr-002--expressjs-instead-of-nestjs)
6. [ADR-003 — MongoDB Atlas instead of PostgreSQL](#adr-003--mongodb-atlas-instead-of-postgresql)
7. [ADR-004 — Cloudflare R2 instead of Firebase Storage or AWS S3](#adr-004--cloudflare-r2-instead-of-firebase-storage-or-aws-s3)
8. [ADR-005 — JWT Authentication](#adr-005--jwt-authentication)
9. [ADR-006 — Clean Architecture](#adr-006--clean-architecture)
10. [ADR-007 — Repository Pattern](#adr-007--repository-pattern)
11. [ADR-008 — Feature-Based Frontend Structure](#adr-008--feature-based-frontend-structure)
12. [ADR-009 — Tailwind CSS](#adr-009--tailwind-css)
13. [ADR-010 — Vercel + Railway Deployment](#adr-010--vercel--railway-deployment)
14. [ADR-011 — Private Cloudflare R2 Bucket](#adr-011--private-cloudflare-r2-bucket)
15. [ADR-012 — Anonymous Posting Design](#adr-012--anonymous-posting-design)
16. [ADR-013 — Precomputed Statistics](#adr-013--precomputed-statistics)
17. [ADR-014 — Soft Delete Strategy](#adr-014--soft-delete-strategy)
18. [ADR-015 — Future Architectural Decisions](#adr-015--future-architectural-decisions)
19. [ADR-016 — Anonymous Interest Groups Collections](#adr-016--anonymous-interest-groups-collections)
20. [Related Documents](#related-documents)

---

## Purpose

This document records **major architectural decisions** for Mood of the Major — the choices that shape the stack, boundaries, data model, security posture, and deployment topology. Each record captures context, the decision made, alternatives considered, consequences, and future considerations.

ADRs exist so that:

- Contributors and AI assistants understand **why** the system is built this way, not only **how**.
- Stack or boundary changes require explicit review rather than silent drift.
- Onboarding engineers can trace requirements (`SPECS.md`) to architectural rationale.

New significant decisions must be appended to this document with the next available ADR number. Trivial implementation choices do not require ADRs.

---

## ADR Format

Each record follows this structure:

| Section | Content |
|---------|---------|
| **Title** | Short descriptive name |
| **Status** | `Accepted`, `Proposed`, `Deprecated`, or `Superseded` |
| **Context** | Problem, constraints, and forces driving the decision |
| **Decision** | What was chosen and how it applies to this project |
| **Alternatives Considered** | Options evaluated and why they were not selected |
| **Consequences** | Positive, negative, and neutral outcomes |
| **Future Considerations** | When or how the decision may be revisited |

---

## Decision Index

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-001](#adr-001--react--vite) | React + Vite for the frontend SPA | Accepted |
| [ADR-002](#adr-002--expressjs-instead-of-nestjs) | Express.js instead of NestJS for the backend API | Accepted |
| [ADR-003](#adr-003--mongodb-atlas-instead-of-postgresql) | MongoDB Atlas instead of PostgreSQL | Accepted |
| [ADR-004](#adr-004--cloudflare-r2-instead-of-firebase-storage-or-aws-s3) | Cloudflare R2 instead of Firebase Storage or AWS S3 | Accepted |
| [ADR-005](#adr-005--jwt-authentication) | JWT authentication | Accepted |
| [ADR-006](#adr-006--clean-architecture) | Clean Architecture | Accepted |
| [ADR-007](#adr-007--repository-pattern) | Repository pattern for database access | Accepted |
| [ADR-008](#adr-008--feature-based-frontend-structure) | Feature-based frontend structure | Accepted |
| [ADR-009](#adr-009--tailwind-css) | Tailwind CSS for styling | Accepted |
| [ADR-010](#adr-010--vercel--railway-deployment) | Vercel + Railway deployment | Accepted |
| [ADR-011](#adr-011--private-cloudflare-r2-bucket) | Private Cloudflare R2 bucket | Accepted |
| [ADR-012](#adr-012--anonymous-posting-design) | Anonymous posting design | Accepted |
| [ADR-013](#adr-013--precomputed-statistics) | Precomputed statistics | Accepted |
| [ADR-014](#adr-014--soft-delete-strategy) | Soft delete strategy | Accepted |
| [ADR-015](#adr-015--future-architectural-decisions) | Future architectural decisions (tracking) | Proposed |
| [ADR-016](#adr-016--anonymous-interest-groups-collections) | Anonymous interest groups (`groups`, `groupmembers`) | Accepted |

> **Note:** `architecture.md` contains a shorter inline ADR table with different numbering (e.g., JWT as ADR-002 there). **This document (`docs/adr.md`) is the authoritative ADR log** with the numbering above.

---

## ADR-001 — React + Vite

### Status

**Accepted**

### Context

Mood of the Major requires a responsive single-page application for students, advisors, and administrators. The product involves data-heavy views (feeds, statistics dashboards, admin tables), frequent client-side navigation, and mobile-first usage on campus (`NFR-UX-001`). The stack is mandated by `README.md` and `SPECS.md` §9.5.

Forces:

- Fast local development iteration aligned with `DESIGN.md` UI work.
- Route-level code splitting for performance (`NFR-PERF-003`).
- Strong ecosystem for forms, server-state caching, and routing.
- Deployment optimized for static SPAs on Vercel (`INT-DEP-001`).
- TypeScript across client and server (`NFR-MAINT-005`).

### Decision

Use **React 19** as the UI library and **Vite** as the build tool and dev server for the frontend SPA in `frontend/`.

- React handles component composition for pages, layouts, features, and shared UI.
- Vite provides HMR, production bundling with tree-shaking, and native TypeScript support.
- React Router handles client-side routing; TanStack Query, Axios, React Hook Form, and Zod integrate with the React model (documented in companion ADRs and `frontend.md`).

React is the **view layer only** — business rules for anonymity, thresholds, and authorization remain on the backend.

### Alternatives Considered

| Alternative | Why not chosen |
|-------------|----------------|
| **Next.js** | SSR/SSG adds complexity not required for v1 SPA; Vercel hosts Vite SPAs efficiently without App Router overhead. |
| **Vue / Svelte** | Not mandated by `SPECS.md` §9.5; would require ADR and team retraining. |
| **Create React App / Webpack** | Slower dev experience; Vite is lighter and matches project performance goals. |
| **Remix** | Full-stack framework couples routing to server patterns; project uses separate Express API on Railway. |

### Consequences

**Positive:**

- Mature ecosystem: TanStack Query, React Router, React Hook Form, Tailwind integrate cleanly.
- Concurrent rendering supports responsive feeds during data fetches.
- Vite enables route-based lazy loading — admin bundle separate from student paths.
- Vercel-first deployment with preview URLs for PR review.

**Negative:**

- No SSR for SEO on public marketing pages — acceptable for authenticated student app focus; landing page is lightweight.
- Build-time `VITE_*` env vars require redeploy to change API URL.

**Neutral:**

- Team must enforce layer boundaries so React components do not accumulate business logic (`NFR-MAINT-002`).

### Future Considerations

- React Native mobile app may consume the same REST API (`frontend.md` Future Scalability).
- Optional SSR or meta-framework migration would require new ADR if SEO becomes critical.
- Shared component library or design-system package if admin and student shells diverge further.

---

## ADR-002 — Express.js instead of NestJS

### Status

**Accepted**

### Context

The backend is a stateless REST API orchestrating business rules, MongoDB persistence, JWT auth, and Cloudflare R2 presigning. It deploys on Railway as a Node.js process (`INT-DEP-002`). The architecture requires a **thin HTTP delivery layer** on the outside of Clean Architecture — routes and controllers map HTTP to use cases without coupling business logic to the framework.

Forces:

- Small team; low onboarding cost (`README.md` Development Philosophy).
- I/O-bound workload (MongoDB, R2 signing) suits Node.js event loop; feed p95 target 500 ms (`NFR-PERF-001`).
- Horizontal scaling via stateless JWT (`NFR-SCALE-003`).
- Rich middleware ecosystem for JWT, rate limiting, CORS, Helmet, validation (`security.md`).

### Decision

Use **Express.js** with TypeScript as the HTTP framework for the backend API in `backend/`.

Express acts exclusively as the **delivery layer**:

- Routes declare middleware chains and delegate to controllers.
- Controllers call application services — no Mongoose or business logic in routes/controllers.
- Dependency injection wires repositories and adapters at `app.ts` startup.

NestJS is not adopted.

### Alternatives Considered

| Alternative | Why not chosen |
|-------------|----------------|
| **NestJS** | Opinionated module/DI/decorator model imposes structure that overlaps with explicit Clean Architecture folders; higher ceremony for a small team; Railway deployment is equally viable but adds framework learning curve without clear v1 benefit. |
| **Fastify** | Faster raw throughput but smaller middleware ecosystem for required security stack; team familiarity favors Express. |
| **Hono / Koa** | Lighter but less universal documentation for JWT, rate limit, and validation patterns. |
| **Serverless functions (Vercel/Netlify)** | Split endpoints complicate shared middleware, DI, and connection pooling; Railway single process fits stateful Mongoose pool model. |

### Consequences

**Positive:**

- First-class Railway Node.js hosting with simple process model.
- Flexibility — Clean Architecture folder layout stays explicit; no ORM imposed by framework.
- Extensive middleware for all `security.md` requirements.
- Well-understood patterns for AI-assisted and human contributors.

**Negative:**

- No built-in OpenAPI generation or module boundaries — discipline enforced by docs and code review.
- Real-time WebSocket features are future scope; may require separate service (`backend.md` Future Backend Improvements).

**Neutral:**

- Performance adequacy depends on indexed MongoDB queries, not framework raw speed.

### Future Considerations

- WebSocket/SSE for live feeds may coexist with Express or move to dedicated service.
- OpenAPI generation from Zod schemas (`backend.md` Future Backend Improvements).
- Evaluate Fastify if middleware parity and profiling justify migration — requires ADR.

---

## ADR-003 — MongoDB Atlas instead of PostgreSQL

### Status

**Accepted**

### Context

The application persists users, anonymous moods, comments, reactions, bookmarks, reports, notifications, tags, statistics rollups, and audit logs — **15 collections** with document-shaped entities, variable metadata, and heavy read patterns on feeds and pre-aggregated statistics (`INT-DB-001`, `database.md`).

Forces:

- Flexible schema evolution during early product growth.
- Aggregation pipelines for statistics, trending, and dashboards (`FR-STAT-*`, `FR-TREND-*`).
- Managed operations: backups, monitoring, IP allowlisting (`NFR-AVAIL-002`, `NFR-SEC-007`).
- Repository pattern via Mongoose in infrastructure layer (`INT-DB-004`).
- **No binary image storage in the database** (`INT-DB-003`).

### Decision

Use **MongoDB Atlas** as the sole structured persistence layer, accessed through **Mongoose** ODM and repository implementations.

- Database name per environment: `mood_of_the_major`, `mood_of_the_major_staging`, `mood_of_the_major_dev`.
- Exactly 15 collections as cataloged in `database.md`; new collections require ADR.
- Hybrid normalization: references for independent entities; denormalized counters on `moods` for feed performance; pre-aggregated `emotionstatistics` and `dailystatistics` for dashboard reads.

PostgreSQL is not adopted.

### Alternatives Considered

| Alternative | Why not chosen |
|-------------|----------------|
| **PostgreSQL (RDS/Supabase)** | Relational model fits normalized data but adds migration overhead for evolving mood/tag/notification schemas; aggregation for statistics and trending is expressible but document model maps naturally to mood/comment content; stack mandate favors MongoDB (`INT-DB-001`). |
| **PostgreSQL + JSONB** | Hybrid complexity without clear v1 benefit over native documents. |
| **Firestore** | Vendor coupling for primary DB; aggregation and complex queries less flexible than MongoDB pipelines for statistics requirements. |
| **Self-hosted MongoDB** | Atlas reduces operational burden; backups and IP allowlisting are production requirements. |

### Consequences

**Positive:**

- Document model matches moods, comments, notifications with optional fields.
- Aggregation framework supports statistics jobs and trending (`database.md` Aggregation Strategy).
- Atlas horizontal scaling and replica sets as volume grows (`NFR-SCALE-001`).
- Mongoose implements repository ports without leaking into domain layer.

**Negative:**

- No native foreign-key constraints — referential integrity enforced in application services.
- Unique constraints and transactions require careful application design (multi-document writes for mood + moodtags).
- SQL-oriented tooling and reporting less familiar to some contributors.

**Neutral:**

- Text search via MongoDB text index; Atlas Search migration possible at scale.

### Future Considerations

- Sharding on `{ facultyId, createdAt }` if single shard outgrown (`database.md` Future Scalability).
- Read replicas for statistics reads.
- Multi-tenant `tenantId` prefix on all queries for multi-university isolation.

---

## ADR-004 — Cloudflare R2 instead of Firebase Storage or AWS S3

### Status

**Accepted**

### Context

Students attach up to four images per mood (JPEG, PNG, WebP; max 5 MB each). Image bytes must **not** pass through or persist on the Railway backend (`FR-IMG-007`, `INT-DB-003`). Storage must scale independently of API compute (`NFR-SCALE-002`). Metadata lives in MongoDB `moodimages`; binaries live in object storage.

Forces:

- S3-compatible API for presigned PUT/GET from browser.
- Cost control — especially egress for image-heavy feeds.
- Environment-isolated buckets (dev, staging, production).
- Integration with backend `IImageStorage` adapter in Clean Architecture.

### Decision

Use **Cloudflare R2** as the exclusive object storage provider for user-uploaded images.

- Backend `R2ImageStorage` implements `IImageStorage` port.
- Upload flow: presign → client PUT directly to R2 → confirm via HEAD object.
- Download flow: backend authorizes → issues signed GET URL → client fetches from R2.
- One private bucket per environment with `{environment}/moods/{userId}/{timestamp}-{uuid}.{ext}` object keys.

Firebase Storage and AWS S3 are not adopted as primary image stores.

### Alternatives Considered

| Alternative | Why not chosen |
|-------------|----------------|
| **Firebase Storage** | Ties storage to Firebase ecosystem; project uses JWT + Express + MongoDB stack, not Firebase Auth/Firestore; less alignment with Railway backend credential model. |
| **AWS S3** | Mature and S3-compatible but egress costs higher for image-heavy student feeds; R2 offers zero egress to Cloudflare CDN and competitive storage pricing (`deployment.md` Cost Optimization). |
| **GridFS / MongoDB binary** | Violates `INT-DB-003`; BSON 16 MB limit; degrades feed performance. |
| **Railway volume / local disk** | Not horizontally scalable; violates direct-upload architecture; ephemeral containers. |
| **Vercel Blob** | Couples storage to frontend host; backend authorization and presign logic still required; less control over bucket policies. |

### Consequences

**Positive:**

- Uploads bypass Railway bandwidth — API only signs URLs (presign p95 200 ms target).
- R2 scales storage independently of Atlas and Railway.
- S3-compatible SDK works with existing Node.js adapter patterns.
- Cost optimization via zero egress to Cloudflare CDN paths.

**Negative:**

- Separate Cloudflare account and credential rotation discipline.
- R2 CORS must mirror frontend origins per environment.
- Background jobs required for orphan and deleted object cleanup.

**Neutral:**

- MongoDB stores metadata only in `moodimages` — dual system of record (metadata vs binary).

### Future Considerations

- Cloudflare Images transforms for thumbnails (`database.md` Future Scalability).
- Lifecycle policies for `temp/` prefix auto-expiry.
- See [ADR-011](#adr-011--private-cloudflare-r2-bucket) for private bucket access model.

---

## ADR-005 — JWT Authentication

### Status

**Accepted**

### Context

Registered users authenticate to create moods, comment, react, bookmark, and access private features. The API must scale horizontally without a shared in-memory session store (`NFR-SCALE-003`). Authentication must run before business logic on every protected route (`BR-AUTH-003`). Session hijacking and credential theft are primary threats (`security.md` Threat Model).

Forces:

- Stateless API on Railway with multiple replicas.
- Role-based access: `student`, `advisor`, `administrator`.
- Short-lived access tokens; refresh without re-login.
- HttpOnly refresh cookie to reduce XSS token theft (`NFR-SEC-003`).

### Decision

Use **JWT (JSON Web Tokens)** for access authentication with **bcrypt** password hashing.

| Element | Policy |
|---------|--------|
| Access token | HS256 JWT, 15-minute TTL, `Authorization: Bearer` header |
| Claims | `sub` (userId), `role`, `typ: access`, `tv` (tokenVersion), `iat`, `exp` — no email in token |
| Refresh token | Opaque 256-bit string in HttpOnly, Secure, SameSite=Strict cookie |
| Validation | Signature, expiry, `tokenVersion` match, user `status: active` on every protected request |
| Revocation | Logout invalidates refresh hash; password change bumps `tokenVersion` |

Server-side session store (Redis sessions) is not used for v1 access auth.

### Alternatives Considered

| Alternative | Why not chosen |
|-------------|----------------|
| **Server-side sessions (Redis)** | Requires shared session store for horizontal scale — added infrastructure; JWT statelessness matches Railway scaling model (`deployment.md`). |
| **Session cookies only** | Same Redis dependency; less suitable for future mobile API clients consuming identical REST contract. |
| **OAuth-only (no local accounts)** | Out of scope for v1; university SSO deferred (`security.md` Future Security Improvements). |
| **Paseto / PASETO** | Less ecosystem maturity in Express middleware than JWT; HS256 JWT sufficient with short TTL and refresh rotation. |
| **Opaque access tokens + token store** | Reintroduces server lookup on every request — acceptable for refresh but avoided for access at scale. |

### Consequences

**Positive:**

- Stateless horizontal scaling — any Railway replica validates JWT.
- Mobile clients can use same Bearer token model.
- Short access TTL limits stolen token window; refresh in HttpOnly cookie mitigates XSS.

**Negative:**

- Immediate access token revocation requires `tokenVersion` check (DB read per request).
- JWT secret rotation invalidates all sessions — requires planned procedure.
- Token size overhead vs session ID on every request.

**Neutral:**

- Refresh token rotation and reuse detection add application complexity.

### Future Considerations

- OAuth / university SAML SSO (`security.md` Future Security Improvements).
- Multi-device session management UI.
- Redis blocklist for instant access token revocation at very high security requirement.

---

## ADR-006 — Clean Architecture

### Status

**Accepted**

### Context

Mood of the Major has non-trivial business rules that must outlive framework and infrastructure choices (`architecture.md` Why Clean Architecture):

- Anonymity enforcement in API responses (`BR-ANON-001` through `BR-ANON-003`).
- Aggregation thresholds before returning statistics (`BR-STAT-001`).
- Role-based authorization (`SPECS.md` §5).
- Image access authorization as business logic, not storage configuration.

Forces:

- Testability without HTTP, MongoDB, or R2 (`NFR-MAINT-001`, `NFR-MAINT-006`).
- Replaceable Express, Mongoose, and R2 adapters.
- AI and human contributors must locate logic predictably.

### Decision

Adopt **Clean Architecture** (Ports and Adapters) for the backend, with a presentation-layer analogue on the frontend.

**Backend dependency direction:**

```
Routes / Controllers / Middlewares / Validators  (delivery)
        ↓
Application Services / Mappers                   (use cases)
        ↓
Domain Entities / Ports / Domain Services        (core)
        ↑ implements
Infrastructure: Mongoose repos, R2, JWT, bcrypt  (adapters)
```

**Forbidden:** Domain imports Express or Mongoose; controllers import Mongoose models; routes call services directly skipping controllers.

**Frontend:** Pages and presentational components consume API DTOs; business rules are not reimplemented in React (`NFR-PRIV-003`).

### Alternatives Considered

| Alternative | Why not chosen |
|-------------|----------------|
| **Classic MVC (Fat controllers)** | Business logic in controllers becomes untestable and duplicates anonymity rules; violates `NFR-MAINT-002`. |
| **Transaction Script** | Procedural handlers without domain layer — anonymity and threshold rules scatter. |
| **Hexagonal without explicit domain folder** | Less clear port boundaries for AI agents and reviewers. |
| **Microservices** | Operational overhead disproportionate for v1 monolith; single Express API on Railway. |

### Consequences

**Positive:**

- Business rules testable with mock repositories.
- Framework upgrades isolated to outer layers.
- Clear code review criteria for layer violations.

**Negative:**

- More files and indirection than small CRUD apps.
- DI wiring at startup requires discipline.
- Steeper initial setup than monolithic Express handlers.

**Neutral:**

- Frontend Clean Architecture is lighter — primarily separation of pages, features, services, and hooks.

### Future Considerations

- Extract statistics worker to separate Railway service at scale.
- Shared `packages/shared` for Zod schemas crossing client and server boundaries.
- ADR required for any layer boundary change.

---

## ADR-007 — Repository Pattern

### Status

**Accepted**

### Context

All MongoDB access must be encapsulated, testable, and swappable (`INT-DB-004`, `NFR-MAINT-003`). Controllers and application services must not construct ad hoc Mongoose queries — preventing NoSQL injection, anonymity leaks via wrong projections, and untestable database coupling.

Forces:

- 15 collections with distinct public vs admin projection profiles (`database.md`).
- Public queries exclude `authorId` and identity fields.
- Application services unit-tested with in-memory mock repositories.

### Decision

Implement the **Repository Pattern** for all database access:

- **Ports:** Interfaces in `domain/ports/` — e.g., `IMoodRepository`, `IUserRepository`, `IImageStorage` (storage adapter, not MongoDB).
- **Adapters:** `MongooseMoodRepository` and siblings in `infrastructure/database/repositories/`.
- **Projection profiles:** `publicProfile` strips identity; `adminProfile` includes `authorId` with audit trigger.
- **Wiring:** Repositories injected into application services at startup — no global singletons.

Controllers and routes **never** import Mongoose models.

### Alternatives Considered

| Alternative | Why not chosen |
|-------------|----------------|
| **Active Record (Mongoose models in controllers)** | Couples HTTP layer to persistence; anonymity projections duplicated; untestable (`NFR-MAINT-003` violation). |
| **Generic repository (`IRepository<T>`)** | Loses domain-specific query methods (`findPublicFeed`, cursor pagination) — leaky abstraction. |
| **Query objects only (no interfaces)** | Harder to mock in service tests; ports document contract explicitly. |
| **Prisma / TypeORM** | Stack mandate is Mongoose on MongoDB; migration would require ADR-003 supersession. |

### Consequences

**Positive:**

- Services tested with mock ports — fast unit tests.
- MongoDB could be replaced without changing application services.
- Centralized place for indexes, aggregations, and projection enforcement.

**Negative:**

- Mapper boilerplate between Mongoose documents, domain entities, and DTOs.
- Repository catalog must stay synced with 15 collections.

**Neutral:**

- Mongoose models remain in infrastructure — not domain entities.

### Future Considerations

- Read-model repositories for statistics if CQRS split emerges.
- Atlas Search adapter as separate repository method behind port.

---

## ADR-008 — Feature-Based Frontend Structure

### Status

**Accepted**

### Context

The frontend spans many product domains: auth, feeds, faculty/major scoping, mood creation, comments, reactions, bookmarks, search, statistics, notifications, admin moderation, and image upload. Changes to one domain should not scatter across unrelated folders (`architecture.md` ADR-006 reference, `frontend.md`).

Forces:

- Three experiential shells: public, student, admin (`DESIGN.md`).
- TanStack Query hooks colocated with domain UI.
- No cross-feature imports — shared code extracted to `components/`, `hooks/`, `services/`.
- Thin pages compose features; pages contain no direct HTTP calls.

### Decision

Organize the frontend under **`features/<domain-name>/`** vertical slices:

```
features/<name>/
├── components/
├── hooks/
├── schemas/
├── types/        (optional)
└── index.ts      (public barrel exports)
```

Shared cross-feature UI lives in `components/`; cross-feature hooks in `hooks/`; API wrappers in `services/`.

Pages in `pages/` import from feature barrels and layouts — not deep sibling feature paths.

### Alternatives Considered

| Alternative | Why not chosen |
|-------------|----------------|
| **Layer-first (all components/, all hooks/)** | Changes to feed touch many top-level folders; hard to ownership-boundary features. |
| **Atomic Design only** | Does not map to product domains (feed vs admin vs statistics). |
| **Monolithic `src/` flat structure** | Does not scale past initial pages; merge conflicts increase. |
| **Nx monorepo packages per feature** | Overhead for v1 team size; folder convention sufficient. |

### Consequences

**Positive:**

- Localized changes — feed work stays in `features/feed/`.
- Clear public API via `index.ts` barrels.
- Admin code lazy-loaded separately from student bundle.

**Negative:**

- Discipline required to extract shared code when second feature needs it.
- Risk of duplicate logic if extraction threshold ignored.

**Neutral:**

- Feature count grows with Phase 3 notifications — pattern scales by adding folders.

### Future Considerations

- `packages/shared` for Zod schemas shared with backend.
- Feature flags per domain without restructuring folders.

---

## ADR-009 — Tailwind CSS

### Status

**Accepted**

### Context

The UI must implement `DESIGN.md` visual language: mobile-first responsive layouts, light/dark themes, semantic emotion badge colors, calm loading/error states, and consistent spacing across student and admin shells (`NFR-UX-001`).

Forces:

- `DESIGN.md` specifies Tailwind CSS as the implementation layer.
- Rapid iteration during documentation-first delivery.
- No CSS-in-JS bundle overhead.
- Design tokens for dark mode (`DESIGN.md` §Dark Mode Strategy).

### Decision

Use **Tailwind CSS** as the sole styling approach for the frontend:

- Utility-first classes in JSX.
- Semantic tokens extended in `tailwind.config.ts` (`primary`, `surface`, `emotion-*`, typography scale).
- Global base in `styles/index.css`; optional CSS variables in `styles/tokens.css`.
- `dark:` variant for all semantic surfaces; `class` strategy on `html`/`body` via ThemeContext.

Separate CSS-in-JS libraries and component-scoped CSS files per component are not standard for v1.

### Alternatives Considered

| Alternative | Why not chosen |
|-------------|----------------|
| **CSS Modules** | More files; slower iteration vs utilities; `DESIGN.md` mandates Tailwind. |
| **Styled Components / Emotion** | CSS-in-JS runtime/bundle cost; team standard is utilities. |
| **Bootstrap / MUI** | Opinionated visual language conflicts with custom calm/trust `DESIGN.md` intent. |
| **Plain CSS / SCSS** | Harder to enforce responsive and token consistency at scale. |

### Consequences

**Positive:**

- Colocated styles with components; fast HMR with Vite.
- Mobile-first breakpoints match `DESIGN.md` responsive strategy.
- Theme extension centralizes brand and emotion colors.

**Negative:**

- Long class strings in JSX — mitigated by component extraction and Prettier plugins.
- Designers must think in utility/token vocabulary.

**Neutral:**

- Chart libraries may need non-Tailwind styling hooks.

### Future Considerations

- High-contrast accessibility theme as additional token set.
- Optional `@tailwindcss/typography` for long-form content if added.

---

## ADR-010 — Vercel + Railway Deployment

### Status

**Accepted**

### Context

The system has two independently deployable runtimes — React SPA and Express API — plus managed MongoDB Atlas and Cloudflare R2. The team prioritizes **minimal operational overhead**, TLS termination by platform, environment isolation, and CI/CD from GitHub (`deployment.md` Deployment Philosophy).

Forces:

- Frontend: global CDN, SPA routing, preview deployments (`INT-DEP-001`).
- Backend: Node.js process, env secrets, horizontal replicas, health checks (`INT-DEP-002`).
- Separate scaling of UI and API.
- No self-hosted TLS, databases, or object storage.

### Decision

Deploy components to **managed platforms**:

| Component | Platform |
|-----------|----------|
| Frontend (`frontend/`) | **Vercel** |
| Backend (`backend/`) | **Railway** |
| Database | **MongoDB Atlas** |
| Image storage | **Cloudflare R2** |
| CI/CD | **GitHub Actions** |

- Frontend and backend deploy **independently** — path filters in CI prevent unnecessary redeploys.
- Environments: development (local), staging, production — separate Atlas databases, R2 buckets, JWT secrets.
- Merge to `main` triggers production deploy after CI green.

Single-platform full-stack hosting (e.g., Railway for both, or AWS ECS for everything) is not adopted for v1.

### Alternatives Considered

| Alternative | Why not chosen |
|-------------|----------------|
| **Railway for frontend + backend** | Vercel optimized for React/Vite CDN, preview URLs, and edge static assets — superior frontend DX (`frontend.md`). |
| **AWS (ECS/Lambda/S3/CloudFront)** | Higher operational complexity; team size favors managed PaaS. |
| **Render / Fly.io for both** | Viable but stack docs and cost model already aligned to Vercel + Railway pairing. |
| **Docker Compose self-hosted** | Violates managed infrastructure principle; on-call burden. |
| **Heroku** | Similar to Railway but Vercel pairing is documented and cost-optimized for SPA. |

### Consequences

**Positive:**

- Each service scales on optimal host — Vercel CDN for static assets; Railway for API compute.
- Preview deployments on Vercel for PR review.
- Platform handles TLS, certificates, and basic monitoring.

**Negative:**

- Multi-vendor operational surface — secrets in Railway, Vercel, Cloudflare, Atlas, GitHub.
- `VITE_API_BASE_URL` baked at build time — frontend/backend URL coordination required per environment.
- CORS must allowlist exact Vercel origins per environment.

**Neutral:**

- Documentation at repo root does not deploy — only `frontend/` and `backend/` paths trigger CD.

### Future Considerations

- Dedicated Railway worker for background jobs (statistics, orphan cleanup).
- Redis on Railway for distributed rate limiting across replicas.
- Custom domains finalized at infrastructure provisioning.

---

## ADR-011 — Private Cloudflare R2 Bucket

### Status

**Accepted**

### Context

User-uploaded mood images are sensitive. Public bucket URLs would enable hotlinking, unauthorized access, and enumeration. The threat model includes bucket credential exposure and unauthorized image access (`security.md`). Images are viewed only in context of authorized mood access.

Forces:

- Client never receives R2 API keys — presigned URLs only (`INT-R2-001`).
- Time-limited upload (15 min) and download (1 hr) URLs.
- Never persist signed URLs in MongoDB (`BR-IMG-003`).
- CORS restricted to frontend origins for PUT/GET from browser.

### Decision

Configure Cloudflare R2 buckets as **private** — no public ACLs, no anonymous `GetObject` or `PutObject`.

| Control | Policy |
|---------|--------|
| Bucket access | Private; deny anonymous reads/writes |
| Upload | Presigned PUT after backend MIME/size validation |
| Download | Signed GET after backend authorization check |
| Object keys | Server-generated; non-guessable (UUID + timestamp) |
| URL TTL | Upload 15 minutes; download 1 hour |
| Credentials | `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` on Railway only |

Public CDN URLs to raw objects without authorization are not used.

### Alternatives Considered

| Alternative | Why not chosen |
|-------------|----------------|
| **Public bucket with obscure URLs** | Security through obscurity fails; hotlinking and enumeration risk. |
| **Public bucket + Cloudflare Workers auth** | Adds edge complexity; presigned URL model sufficient for v1. |
| **Firebase Storage security rules** | Not using Firebase stack (see ADR-004). |
| **S3 public-read with bucket policy exceptions** | Misconfiguration risk; private + presign is fail-closed default. |
| **Serve images through Express proxy** | Violates `FR-IMG-007`; adds Railway bandwidth and latency. |

### Consequences

**Positive:**

- Every image view requires backend authorization — aligns with mood access rules.
- Stolen URL expires within TTL — not permanent links.
- R2 keys never exposed to browser or MongoDB.

**Negative:**

- Extra API round-trip to fetch signed URL before rendering each image.
- TanStack Query must cache URLs until `expiresAt` minus safety buffer.
- R2 CORS configuration required per environment.

**Neutral:**

- Frontend orchestrates PUT to presigned URL outside `apiClient` base URL.

### Future Considerations

- Cloudflare WAF in front of R2 endpoints.
- Shorter download TTL for highly sensitive deployments.
- Image watermarking or blur for moderated content previews — application layer.

---

## ADR-012 — Anonymous Posting Design

### Status

**Accepted**

### Context

The product promise is **anonymous mood sharing** among university students. Users authenticate to post (`BR-AUTH-001`) but other users must not discover who wrote a mood, comment, or reaction (`BR-ANON-001`, `NFR-PRIV-003`). Administrators need identity for moderation with audit accountability (`BR-ANON-004`).

Forces:

- Ownership checks for edit/delete require internal `authorId`.
- Public feeds must never leak identity fields.
- UI hiding alone is insufficient — API and database projections are authoritative.
- Statistics must not enable de-anonymization in small groups (`BR-STAT-001`).

### Decision

Implement **server-enforced anonymous posting**:

| Layer | Mechanism |
|-------|-----------|
| **Storage** | `moods.authorId`, `comments.authorId`, `reactions.userId` stored internally — never in public API |
| **Repository** | `publicProfile` projections exclude identity fields |
| **Application mappers** | Strip `authorId`, `userId`, `email` from public DTOs before response |
| **Frontend** | Render anonymous DTOs only; no avatars, usernames, or profile links on public content |
| **Admin** | Identity visible on admin endpoints; `auditlogs.identityAccessed: true` on identity views |
| **Reactions** | Counts only publicly — `userReaction` reveals caller's own reaction only, not others |

Authentication is required to create content; anonymity applies to **visibility**, not to whether the system knows the author.

### Alternatives Considered

| Alternative | Why not chosen |
|-------------|----------------|
| **Pseudonymous display names** | Conflicts with product intent — true anonymity without personas (`DESIGN.md`). |
| **Client-only hiding of authorId** | Bypassable via API inspection; violates `NFR-PRIV-003`. |
| **Fully unauthenticated posting** | Enables abuse; no accountability path for moderation and rate limits. |
| **End-to-end encrypted posts** | Key management and search/statistics incompatible with v1 requirements. |
| **Separate anonymous identity per post** | Complex key rotation; unnecessary for threat model. |

### Consequences

**Positive:**

- Trustworthy anonymity for students sharing sensitive emotions.
- Clear separation: public DTO vs admin DTO vs internal entity.
- Automated tests assert no identity in public responses.

**Negative:**

- Every new endpoint must pass mapper review — regression risk if skipped.
- Admin moderation requires explicit audit logging.
- Bookmark/report flows must not leak reporter to content author.

**Neutral:**

- Users still authenticate — anonymity is from peers, not from the platform.

### Future Considerations

- Aggregation threshold tuning (`AGGREGATION_THRESHOLD_MIN`, default 5) for small majors.
- GDPR erasure workflows while retaining anonymized content (`BR-CNT-004`).
- Formal privacy audit of all public endpoints.

---

## ADR-013 — Precomputed Statistics

### Status

**Accepted**

### Context

Statistics dashboards, faculty/major summaries, and trending emotions require aggregations across large mood volumes. Live aggregation on every dashboard request violates the **2 second p95** target (`NFR-PERF-004`) and risks inconsistent results under load. Small-group counts enable de-anonymization (`BR-STAT-001`, `NFR-PRIV-002`).

Forces:

- Dashboard combines KPIs, distribution, time series, trending (`GET /statistics/dashboard`).
- Nightly and periodic batch jobs acceptable — statistics tolerate slight staleness.
- Threshold gating must be applied consistently (`meetsThreshold` flag).
- Feed reads remain separate — feeds use indexed queries on `moods`, not live full scans.

### Decision

**Precompute statistics** into dedicated MongoDB collections:

| Collection | Purpose |
|------------|---------|
| `emotionstatistics` | Emotion distribution by scope and period |
| `dailystatistics` | UTC day-bucketed rollups for time series and trending |

- **Scheduled jobs** (daily 01:00 UTC and trending recalculation) upsert pre-aggregated documents.
- **API reads** query precomputed collections — not live `$group` across all `moods` on dashboard load.
- **`meetsThreshold`** set during job write; API suppresses counts when false.
- **`algorithmVersion`** on documents supports reproducibility (`BR-STAT-003`).

Live aggregation reserved for admin diagnostics or future internal tools — not student-facing dashboard hot path.

### Alternatives Considered

| Alternative | Why not chosen |
|-------------|----------------|
| **Live aggregation on every request** | Violates p95 2s; scales poorly with mood volume. |
| **Materialized views in PostgreSQL** | Stack is MongoDB (ADR-003); precomputed collections serve same role. |
| **Redis cache of live query results** | Cache invalidation complex; job-based rollups simpler for daily/weekly periods. |
| **Client-side aggregation** | Requires downloading raw mood data — anonymity and bandwidth violation. |
| **Third-party analytics (Mixpanel)** | External PII risk; cannot replace in-product statistics UX. |

### Consequences

**Positive:**

- Predictable dashboard latency from indexed reads on statistics collections.
- Threshold enforced once at job write and again at API read.
- Trending deltas computed from `dailystatistics` windows.

**Negative:**

- Data staleness until next job run — acceptable per product requirements.
- Background job infrastructure required (Railway cron or worker — future).
- Job failures must be monitored — stale `calculatedAt` alerts.

**Neutral:**

- Denormalized counters on `moods` (`commentCount`, `reactionSummary`) serve feeds — separate from statistics collections.

### Future Considerations

- Hourly trending refresh for near-real-time widgets.
- BullMQ + Redis for reliable job retries.
- Read replicas offload statistics queries from primary Atlas node.

---

## ADR-014 — Soft Delete Strategy

### Status

**Accepted**

### Context

User-generated content (moods, comments, images) and accounts may be deleted by authors, removed by admins, or deactivated for moderation. Hard deletes destroy audit trails, complicate bookmark access (`FR-BMK-004`), and lose moderation history. Reports and audit logs require immutability.

Forces:

- Public feeds must exclude deleted content (`BR-CNT-004`).
- Admin needs history for resolved reports and audit compliance (`NFR-SEC-010`).
- R2 object cleanup asynchronous after soft delete.
- Reference data (faculties, majors, tags) deactivate rather than hard delete when referenced.

### Decision

Apply **soft delete** (or equivalent) per collection type as defined in `database.md` Soft Delete Strategy:

| Collection | Strategy |
|------------|----------|
| `moods`, `comments`, `moodimages`, `users` | `deletedAt` timestamp + `status` enum |
| `faculties`, `majors`, `tags` | Deactivate via `isActive: false` |
| `reactions`, `bookmarks` | Hard delete on user action (unique pair removed) |
| `reports` | Status transitions only — never hard deleted |
| `auditlogs` | Append-only — never deleted in normal ops |
| Statistics collections | Upsert overwrite by job — not user delete |

Public queries filter `deletedAt: null` and active status. Mood delete cascades: soft-delete comments/images, enqueue R2 cleanup.

### Alternatives Considered

| Alternative | Why not chosen |
|-------------|----------------|
| **Hard delete all user content** | Loses moderation evidence; breaks bookmark exception for removed moods. |
| **Soft delete everywhere including bookmarks** | Bookmarks are private pairs — hard delete on unbookmark is simpler. |
| **Archive tables (move deleted rows)** | Higher migration complexity; `deletedAt` on same collection sufficient for v1. |
| **Temporal tables / PostgreSQL history** | MongoDB stack uses application-level soft delete pattern. |

### Consequences

**Positive:**

- Moderation and audit retain context.
- Authors can delete; admins can remove with `moderated_removed` status.
- Bookmarked removed moods still accessible to owner (`FR-BMK-004`).

**Negative:**

- Storage grows — deleted documents remain indexed unless archived later.
- Queries must always include soft-delete filters — omission is a bug.
- R2 cleanup depends on background jobs for soft-deleted `moodimages`.

**Neutral:**

- `status` distinguishes author delete vs admin moderation vs hidden pending review.

### Future Considerations

- Cold storage archive for moods deleted > N years.
- GDPR hard purge job with ADR for data retention policy.
- TTL on notifications collection for old read items.

---

## ADR-015 — Future Architectural Decisions

### Status

**Proposed** (tracking document — not a single decision)

### Context

Several capabilities are documented as future scope in `README.md`, `SPECS.md` §12, `backend.md`, `frontend.md`, `security.md`, and `deployment.md`. Each requires a dedicated ADR before implementation if it changes stack, boundaries, or data model.

### Decision

The following topics are **recognized but not yet decided**. When implementation begins, create a new ADR (ADR-016+) with full format.

| Topic | Trigger for ADR | Leading options |
|-------|-------------------|-----------------|
| **TanStack Query vs alternatives** | Already accepted in architecture — formal ADR-016 if replaced | Keep TanStack Query |
| **Shared `packages/shared` monorepo** | Schema duplication burden | npm workspaces with shared Zod |
| **Background job runner** | Statistics/orphan jobs in production | Railway cron, BullMQ + Redis, dedicated worker |
| **Distributed rate limiting** | Multi-replica Railway without per-instance limits | Redis-backed limiter |
| **WebSocket / SSE real-time feeds** | Live feed requirement | Separate WS service vs Express upgrade |
| **OAuth / university SSO** | Institution mandates SAML | Passport strategies, external IdP |
| **Atlas Search** | Text search relevance insufficient | Replace text index |
| **Read replicas** | Statistics load on primary | Atlas secondary reads |
| **Multi-tenant isolation** | Multi-university deployment | `tenantId` on all queries |
| **API `/api/v2`** | Breaking contract change | Versioned routes with deprecation period |
| **Microservices split** | Statistics or notification scale | Separate Railway services |
| **Redis session blocklist** | Stricter immediate JWT revocation | Token deny list |
| **WCAG 2.1 AA formal compliance** | Accessibility audit | Remediation pass |
| **Mobile React Native app** | Native app launch | Shared types, same JWT API |
| **ML content moderation** | Auto-flag pipeline | Internal classification service |
| **GraphQL API** | Not planned — REST canonical | N/A unless requirements change |
| **New MongoDB collection** | Feature exceeds 15-collection lock | See ADR-016 for groups |
| **Platform migration** | Cost or compliance driver | Re-evaluate Vercel/Railway/Atlas/R2 |

### Alternatives Considered

N/A — this ADR is a **backlog tracker**, not a choice among options.

---

## ADR-016 — Anonymous Interest Groups Collections

### Status

**Accepted**

### Context

Students need optional interest/support rooms for anonymous mood sharing beyond faculty/major feeds. The database catalog was locked at 15 collections; user-created groups require dedicated membership storage and cannot be modeled safely as tags alone (authorization, cover media, create limits, owner kick).

### Decision

Add two collections and one mood FK:

| Collection | Purpose |
|------------|---------|
| `groups` | Group catalog: name, description, optional `coverImageUrl`, `ownerId`, denormalized `memberCount`, status |
| `groupmembers` | Membership edges: `groupId`, `userId`, `role` (`owner` \| `member`) |

- `moods.groupId` optional ObjectId — posts scoped to a group are excluded from global/faculty/major feeds.
- Create limit: **3** owned groups per user; join count unlimited; join is open (no approval).
- Public APIs expose member **count** only; owner-only member list may include `displayName` for kick moderation.
- Collection total becomes **17**.

### Alternatives Considered

| Alternative | Why not chosen |
|-------------|----------------|
| Tag-only “groups” | Cannot enforce membership gates or ownership cleanly |
| Embed members on `groups` | Unbounded array growth; hard to query “my groups” |
| Full Facebook clone | Out of product scope (chat, events, public member directories) |

### Consequences

- Positive: Clear authZ boundary; reuses mood engagement stack inside groups.
- Negative: Two more collections and feed filter complexity (`groupId: null` on public feeds).
- Neutral: Cover images stored as URL string initially (R2 cover prefix can follow later).

### Future Considerations

Approval-based join, group post sharing to main feed, R2-backed cover uploads.

---

## Related Documents

| Document | Relationship |
|----------|--------------|
| [`architecture.md`](./architecture.md) | System architecture; inline ADR summary (superseded by this log for numbering) |
| [`backend.md`](./backend.md) | Express, Clean Architecture, repository details |
| [`frontend.md`](./frontend.md) | React, Vite, Tailwind, feature structure rationale |
| [`database.md`](./database.md) | MongoDB, soft delete, anonymity storage, precomputed stats |
| [`security.md`](./security.md) | JWT, private R2, anonymity security policy |
| [`deployment.md`](./deployment.md) | Vercel, Railway, environment isolation |
| [`README.md`](../README.md) | Authoritative stack mandate |
| [`SPECS.md`](../SPECS.md) | Requirements traceability (`FR-*`, `NFR-*`, `BR-*`) |

---

## Document Maintenance

| Event | Action |
|-------|--------|
| Stack or boundary change | Add or update ADR; set prior ADR to `Superseded` if replaced |
| Open decision resolved | Move from ADR-015 tracker to new numbered ADR |
| Rejected proposal | ADR status `Rejected` with rationale |
| Implementation contradicts ADR | Fix code or supersede ADR — do not silently diverge |

---

*This document is the authoritative Architecture Decision Record log for Mood of the Major. All significant architectural changes must be recorded here before or alongside implementation.*
