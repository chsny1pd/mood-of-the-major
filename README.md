# Mood of the Major

> A production-ready, anonymous social platform for university students to share emotions, experiences, and daily thoughts — and to visualize the emotional atmosphere across faculties and majors.

---

## Table of Contents

1. [Project Description](#project-description)
2. [Project Goals](#project-goals)
3. [Target Users](#target-users)
4. [Key Features](#key-features)
5. [Technology Stack](#technology-stack)
6. [High-Level Architecture Overview](#high-level-architecture-overview)
7. [Project Folder Overview](#project-folder-overview)
8. [Development Philosophy](#development-philosophy)
9. [Coding Standards Overview](#coding-standards-overview)
10. [Security Overview](#security-overview)
11. [Image Storage Strategy (Cloudflare R2)](#image-storage-strategy-cloudflare-r2)
12. [Deployment Overview](#deployment-overview)
13. [Development Workflow](#development-workflow)
14. [Project Roadmap](#project-roadmap)
15. [Future Improvements](#future-improvements)
16. [License](#license)
17. [Contributors](#contributors)

---

## Project Description

**Mood of the Major** is a full-stack anonymous social platform designed for university students. Students can anonymously share their emotions, feelings, experiences, and daily thoughts while allowing the broader community to visualize the overall emotional atmosphere of each faculty and major.

Beyond social interaction, the platform provides statistics and analytics to help students, faculty advisors, and administrators better understand student well-being trends over time.

The application is built following **Clean Architecture** principles and production-ready best practices. All user-uploaded images are stored in **Cloudflare R2** with private bucket access and presigned URL workflows. Authentication is handled via **JWT**, and the entire stack is designed for scalability, maintainability, and security from day one.

---

## Project Goals

| Goal | Description |
|------|-------------|
| **Safe anonymous expression** | Provide a trusted space where students can share honestly without fear of social judgment or identity exposure. |
| **Community emotional awareness** | Surface the collective mood of faculties and majors so students feel less alone and communities can respond thoughtfully. |
| **Data-informed well-being** | Offer aggregated statistics and trend visualizations that support understanding of student emotional health — without compromising individual privacy. |
| **Production-grade engineering** | Deliver a maintainable, testable, and secure codebase that can evolve with real-world usage and team growth. |
| **Scalable infrastructure** | Use managed cloud services (MongoDB Atlas, Cloudflare R2, Vercel, Railway) to minimize operational overhead while supporting growth. |

---

## Target Users

### Primary Users

- **University students** — Post anonymously, browse mood feeds, react, comment, bookmark, and explore emotional trends within their faculty or major.
- **Student community members** — Discover trending emotions, search and filter content, and engage with posts relevant to their academic context.

### Secondary Users

- **Faculty advisors and student affairs staff** — Review aggregated statistics and dashboards to identify well-being patterns (not individual identities).
- **Platform administrators** — Moderate content, manage reports, oversee system health, and configure platform policies.

### Out of Scope (Initial Release)

- Public, non-university audiences
- Identity-linked social networking features
- Direct messaging between users

---

## Key Features

### Core Platform

| Feature | Description |
|---------|-------------|
| **User Authentication** | Secure registration and login with JWT-based session management. |
| **Anonymous Posting** | Students publish mood posts without revealing their identity to other users. |
| **Mood Feed** | A personalized stream of recent anonymous posts across the platform. |
| **Faculty Feed** | Filtered feed showing emotional content scoped to a specific faculty. |
| **Major Feed** | Filtered feed scoped to a specific academic major. |
| **Mood Categories** | Structured classification of emotional content (e.g., stress, joy, anxiety, gratitude). |

### Engagement

| Feature | Description |
|---------|-------------|
| **Image Upload** | Attach images to posts via secure, presigned upload flows to Cloudflare R2. |
| **Comment System** | Threaded or flat anonymous comments on posts. |
| **Reaction System** | Lightweight emotional reactions to posts and comments. |
| **Bookmark System** | Save posts for personal reference. |
| **Search** | Full-text or filtered search across posts and metadata. |
| **Filtering** | Filter by faculty, major, mood category, date range, and other criteria. |
| **Pagination** | Cursor-based pagination on all list endpoints and feeds. |

### Analytics & Administration

| Feature | Description |
|---------|-------------|
| **Statistics Dashboard** | Aggregated mood metrics, distributions, and time-series visualizations. |
| **Trending Emotions** | Surface currently popular or rising emotional themes within communities. |
| **Admin Dashboard** | Administrative tools for moderation, user management, and platform oversight. |
| **Report System** | Allow users to flag inappropriate content for admin review. |
| **Notification System** | In-app or push notifications for relevant activity (scope to be defined in requirements). |

---

## Technology Stack

### Frontend

| Technology | Role |
|------------|------|
| **React 19** | UI library with modern concurrent features and improved rendering. |
| **Vite** | Fast development server and optimized production builds. |
| **Tailwind CSS** | Utility-first styling for consistent, responsive design. |
| **React Router** | Client-side routing and navigation. |
| **Axios** | HTTP client for API communication. |
| **TanStack Query** | Server-state management, caching, and background synchronization. |
| **React Hook Form** | Performant form handling with minimal re-renders. |
| **Zod** | Runtime schema validation shared between forms and API contracts. |

### Backend

| Technology | Role |
|------------|------|
| **Express.js** | Lightweight, flexible HTTP server framework. |
| **MongoDB Atlas** | Managed document database for flexible schema evolution. |
| **Mongoose** | ODM for schema definition, validation, and query building. |
| **JWT** | Stateless authentication tokens for API access. |
| **bcrypt** | Secure password hashing. |
| **Express Validator / Zod** | Request validation at the API boundary. |

### Storage

| Technology | Role |
|------------|------|
| **Cloudflare R2** | S3-compatible object storage for user-uploaded images. |
| **Private Bucket** | No public read access; all object access is mediated by the backend. |
| **Presigned Upload URL** | Clients upload directly to R2 without exposing bucket credentials. |
| **Signed Download URL** | Time-limited URLs for authorized image retrieval. |

### Deployment & CI/CD

| Service | Role |
|---------|------|
| **Vercel** | Frontend hosting with edge CDN and preview deployments. |
| **Railway** | Backend API hosting with environment management. |
| **MongoDB Atlas** | Managed database cluster with automated backups. |
| **Cloudflare R2** | Durable image storage with global edge network. |
| **GitHub** | Source control and collaboration. |
| **GitHub Actions** | Continuous integration, testing, and deployment pipelines. |

---

## High-Level Architecture Overview

Mood of the Major follows **Clean Architecture**, separating concerns into distinct layers that depend inward — outer layers depend on inner layers, never the reverse.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                       │
│              React 19 + Vite + Tailwind CSS                     │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS (REST API)
┌────────────────────────────▼────────────────────────────────────┐
│                     API Layer (Express.js)                      │
│         Routes → Controllers → Middleware → Validators          │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                   Application / Use Case Layer                  │
│      Business rules, orchestration, authorization logic         │
└────────────┬───────────────────────────────┬────────────────────┘
             │                               │
┌────────────▼──────────────┐   ┌────────────▼────────────────────┐
│    Domain Layer           │   │    Infrastructure Layer           │
│  Entities, value objects  │   │  MongoDB (Mongoose), R2, JWT,   │
│  Domain services          │   │  bcrypt, external integrations  │
└───────────────────────────┘   └─────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Responsibility |
|-------|----------------|
| **Presentation (Frontend)** | UI rendering, user interaction, client-side validation, API consumption via TanStack Query. |
| **API (Backend)** | HTTP routing, request/response formatting, authentication middleware, input validation. |
| **Application** | Use-case orchestration — coordinates domain logic and infrastructure without framework coupling. |
| **Domain** | Core business entities, rules, and interfaces (ports) independent of any framework or database. |
| **Infrastructure** | Concrete implementations of ports — database repositories, R2 storage adapter, auth token service. |

### Key Architectural Decisions

- **Monorepo documentation, separate deployments** — Frontend and backend are independently deployable services communicating over a REST API.
- **Anonymous-by-design** — Identity is managed for authentication and moderation purposes only; it is never exposed in public-facing content.
- **Private media storage** — Images never reside on the application server; all uploads flow through presigned URLs to R2.
- **Validation at boundaries** — Zod (and/or Express Validator) enforces contracts at both the API ingress and the frontend form layer.

### Data Flow (Simplified)

1. User authenticates → receives JWT.
2. User creates a post → backend validates, persists metadata to MongoDB.
3. If an image is attached → backend issues a presigned upload URL → client uploads directly to R2 → backend records the object reference.
4. Feeds and dashboards query aggregated data from MongoDB; images are served via signed download URLs on demand.

---

## Project Folder Overview

This repository uses **documentation-first development** with application code in `frontend/` and `backend/`. CI runs via `.github/workflows/ci.yml`.

```
mood-of-the-major/
│
├── README.md                  # This file — single source of truth
├── SPECS.md                   # Functional and non-functional specifications
├── DESIGN.md                  # UI/UX design principles and visual language
├── frontend/                  # React 19 + Vite SPA
├── backend/                   # Express + TypeScript API
├── TODO.md                    # Active development task tracker
├── PROJECT_AUDIT.md           # Periodic architecture and quality audits
│
├── docs/                      # Detailed technical documentation
│   ├── requirements.md        # Business rules and resolved open decisions
│   ├── project-overview.md    # Extended project context and vision
│   ├── architecture.md        # Deep-dive architecture decisions and diagrams
│   ├── database.md            # Data modeling guidelines and conventions
│   ├── api.md                 # API design standards and endpoint catalog
│   ├── frontend.md            # Frontend architecture and component guidelines
│   ├── backend.md             # Backend structure, layers, and conventions
│   ├── authentication.md      # Auth flows, JWT strategy, and session policy
│   ├── cloudflare-r2.md       # R2 bucket setup, presigned URL workflows
│   ├── deployment.md          # Environment setup and deployment procedures
│   ├── security.md            # Threat model, policies, and compliance notes
│   └── roadmap.md             # Phased delivery plan with milestones
│
├── .cursor/                   # AI-assisted development guidance
│   └── rules/
│       ├── architecture.mdc   # Clean Architecture enforcement rules
│       ├── backend.mdc        # Backend coding and layering rules
│       ├── frontend.mdc       # Frontend patterns and component rules
│       ├── database.mdc       # Database and Mongoose conventions
│       ├── security.mdc       # Security-first development rules
│       ├── api.mdc            # API design and versioning rules
│       ├── ui.mdc             # UI/UX consistency rules
│       └── coding-style.mdc   # General code style and formatting rules
│
└── .github/
    └── workflows/             # GitHub Actions CI/CD pipeline definitions
```

### Document Hierarchy

| Document | Purpose | Audience |
|----------|---------|----------|
| `README.md` | Project entry point and authoritative overview | Everyone |
| `SPECS.md` | What the system must do | Product, engineering |
| `DESIGN.md` | How the system should look and feel | Design, frontend |
| `docs/*.md` | Deep technical references | Engineering |
| `.cursor/rules/*.mdc` | AI pair-programming guardrails | Developers, AI agents |
| `TODO.md` | Sprint-level task tracking | Engineering |
| `PROJECT_AUDIT.md` | Quality and architecture reviews | Tech lead, architects |

---

## Development Philosophy

### Principles

1. **Documentation before code** — Every feature begins with a written requirement and architectural decision. The README and `docs/` directory are authoritative.
2. **Clean Architecture** — Business logic lives in the domain and application layers, free from framework and database dependencies.
3. **Security by default** — Authentication, input validation, and least-privilege access are non-negotiable baseline requirements, not afterthoughts.
4. **Privacy by design** — Anonymity is a first-class architectural constraint, not a UI toggle.
5. **Incremental delivery** — Ship small, verifiable increments aligned with the roadmap phases.
6. **Test what matters** — Prioritize tests for business rules, auth flows, and data integrity over superficial coverage metrics.
7. **Convention over configuration** — Establish clear patterns early (documented in `.cursor/rules/`) so the codebase stays consistent as the team grows.

### Decision-Making Framework

When evaluating technical choices, prefer options that:

- Reduce coupling between layers
- Are well-supported by the chosen stack
- Can be understood and maintained by a small team
- Scale horizontally without redesign
- Align with the documented security and privacy requirements

---

## Coding Standards Overview

Detailed standards are maintained in `.cursor/rules/coding-style.mdc` and layer-specific rule files. The following summarizes project-wide expectations.

### General

| Standard | Guideline |
|----------|-----------|
| **Language** | TypeScript for both frontend and backend (recommended; to be confirmed in specs). |
| **Formatting** | Consistent formatting enforced via Prettier and ESLint. |
| **Naming** | `camelCase` for variables/functions, `PascalCase` for components/classes, `kebab-case` for file names where conventional. |
| **Comments** | Code should be self-documenting; comments explain *why*, not *what*. |
| **Error handling** | Structured error responses from the API; no silent failures; no leaking of internal stack traces to clients. |

### Frontend

- Functional components with hooks; no class components.
- Colocate component-specific styles and tests.
- Server state managed exclusively through TanStack Query; avoid duplicating API data in local state.
- Forms validated with Zod schemas shared with backend contracts where possible.

### Backend

- Thin controllers — delegate to use-case/application services.
- Repository pattern for all database access; no direct Mongoose calls in controllers.
- All routes protected by authentication middleware unless explicitly public.
- Request validation runs before any business logic executes.

### Git Conventions

| Element | Convention |
|---------|------------|
| **Branch naming** | `feature/`, `fix/`, `docs/`, `chore/` prefixes |
| **Commit messages** | Conventional Commits format (`feat:`, `fix:`, `docs:`, `chore:`, etc.) |
| **Pull requests** | Require description, linked issue, and passing CI checks |

---

## Security Overview

Security is a cross-cutting concern documented in depth in `docs/security.md` and enforced via `.cursor/rules/security.mdc`.

### Authentication & Authorization

- Passwords hashed with **bcrypt** using industry-standard cost factors.
- **JWT** tokens with defined expiration, refresh strategy, and secure storage guidance for the client.
- Role-based access control (RBAC) distinguishing regular users and administrators.
- All authenticated endpoints validate token integrity before processing requests.

### Data Protection

- **HTTPS everywhere** — TLS enforced in production for all client-server and service-to-service communication.
- **Input validation** — All API inputs validated at the boundary; reject unexpected fields.
- **Output sanitization** — Prevent XSS in user-generated content rendered on the frontend.
- **Rate limiting** — Protect authentication and posting endpoints from abuse.
- **CORS** — Strict origin allowlisting in production.

### Anonymity & Privacy

- Public-facing content must never include personally identifiable information.
- Aggregated analytics must meet minimum group sizes to prevent de-anonymization.
- Admin access to identity-linked data is logged and restricted.

### Infrastructure Security

- Environment variables and secrets managed through platform secret stores (Railway, Vercel) — never committed to source control.
- Cloudflare R2 bucket is **private**; no public ACLs on objects.
- Database access restricted to backend service IP allowlists via MongoDB Atlas network rules.
- Dependency vulnerability scanning integrated into CI/CD.

### Content Safety

- Report system for user-flagged content.
- Admin moderation tools with audit trail.
- Automated safeguards (rate limits, content length limits) as a first line of defense.

---

## Image Storage Strategy (Cloudflare R2)

All user-uploaded images are stored in **Cloudflare R2**, keeping binary data off the application server and database.

### Design Principles

| Principle | Rationale |
|-----------|-----------|
| **Private bucket** | Objects are never publicly accessible; prevents hotlinking and unauthorized access. |
| **Presigned upload** | Clients upload directly to R2, reducing server bandwidth and latency. |
| **Signed download** | Time-limited URLs ensure only authorized users can view images. |
| **Metadata in MongoDB** | Only object keys, MIME types, and upload metadata are stored in the database — not file binaries. |

### Upload Flow

```
Client                    Backend API                  Cloudflare R2
  │                           │                            │
  │── Request upload URL ────►│                            │
  │                           │── Generate presigned URL ─►│
  │◄── Presigned upload URL ──│                            │
  │── PUT image (direct) ─────────────────────────────────►│
  │── Confirm upload ────────►│                            │
  │                           │── Store object reference   │
  │◄── Success ───────────────│    in MongoDB              │
```

### Download Flow

```
Client                    Backend API                  Cloudflare R2
  │                           │                            │
  │── Request image ─────────►│                            │
  │                           │── Authorize & generate ───►│
  │◄── Signed download URL ───│    signed URL              │
  │── GET image (direct) ──────────────────────────────────►│
```

Detailed configuration, bucket policies, and CORS settings are documented in `docs/cloudflare-r2.md`.

---

## Deployment Overview

Each service is deployed independently to its optimal platform.

| Component | Platform | Rationale |
|-----------|----------|-----------|
| **Frontend** | Vercel | Optimized for React/Vite SPAs, automatic preview deployments, global CDN. |
| **Backend API** | Railway | Simple Node.js deployment, environment management, horizontal scaling. |
| **Database** | MongoDB Atlas | Managed MongoDB with backups, monitoring, and IP allowlisting. |
| **Image Storage** | Cloudflare R2 | Cost-effective S3-compatible storage with zero egress fees to Cloudflare CDN. |

### Environments

| Environment | Purpose |
|-------------|---------|
| **Development** | Local development with local or shared dev database. |
| **Staging** | Pre-production environment mirroring production configuration for QA. |
| **Production** | Live environment serving end users. |

### CI/CD Pipeline (GitHub Actions)

- **On pull request** — Lint, type-check, and run test suites.
- **On merge to main** — Deploy backend to Railway and frontend to Vercel.
- **Secrets management** — All credentials stored as GitHub encrypted secrets and platform environment variables.

Full deployment procedures, environment variable catalogs, and rollback strategies are documented in `docs/deployment.md`.

---

## Development Workflow

### Getting Started

**Prerequisites:** Node.js 20+, npm, MongoDB (local or Atlas)

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run dev          # http://localhost:3000 — /health, /ready, /api/v1

# Seed reference data (requires MongoDB running)
npm run seed

# Frontend (separate terminal)
cd frontend
cp .env.example .env   # uses Vite proxy to backend at /api/v1
npm install
npm run dev          # http://localhost:5173
```

Try auth: **Join** → register → redirects to `/feed`. Sign out from header.

**Quality checks:** `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` in each package.

### Current Phase: Sprint 6 Admin Dashboard (complete) → Sprint 7 Hardening (next)

1. Review this README and `docs/roadmap.md` for milestone scope.
2. Track active tasks in `TODO.md`.
3. Follow `.cursor/rules/` and layer docs when implementing features.

**Statistics QA (local or staging):**

```bash
cd backend
npm run seed              # reference data
npm run seed:sample-moods # demo moods for aggregation (optional)
npm run qa:statistics     # run aggregation job + verify dashboard output
```

**Staging aggregation (cron or manual):** `POST /api/v1/internal/jobs/aggregate-statistics` with header `x-service-api-key: $SERVICE_API_KEY`. Schedule daily at 01:00 UTC on Railway.

### Branching Strategy

```
main          ← production-ready, protected
  └── develop ← integration branch (optional, to be decided)
        ├── feature/mood-feed
        ├── feature/auth-system
        └── fix/upload-validation
```

### Code Review Expectations

- All changes require a pull request with at least one reviewer approval.
- PRs must reference the relevant documentation section or issue.
- No merge with failing CI checks.
- Security-sensitive changes require explicit review against `docs/security.md`.

### AI-Assisted Development

This project uses Cursor with rule files in `.cursor/rules/` to maintain consistency. AI agents must:

- Read `README.md` and relevant `docs/` files before generating code.
- Follow Clean Architecture layer boundaries.
- Never bypass security or validation requirements.
- Update documentation when architectural decisions change.

---

## Project Roadmap

Delivery is organized into phases. Detailed milestones and timelines are maintained in `docs/roadmap.md`.

### Phase 1 — Foundation

- [ ] Project documentation complete (`README`, `SPECS`, `docs/`)
- [ ] Architecture and API design finalized
- [ ] Development environment and CI/CD pipeline established
- [ ] Authentication system
- [ ] Core anonymous posting with mood categories

### Phase 2 — Engagement

- [ ] Mood, faculty, and major feeds
- [ ] Image upload via Cloudflare R2
- [ ] Comment and reaction systems
- [ ] Search, filtering, and pagination
- [ ] Bookmark system

### Phase 3 — Analytics & Administration

- [ ] Statistics dashboard
- [ ] Trending emotions
- [ ] Admin dashboard
- [ ] Report and moderation system
- [ ] Notification system

### Phase 4 — Production Hardening

- [ ] Performance optimization and load testing
- [ ] Security audit and penetration testing
- [ ] Monitoring, logging, and alerting
- [ ] Production deployment and launch

---

## Future Improvements

The following items are intentionally deferred beyond the initial roadmap. They will be evaluated based on user feedback and platform maturity.

| Area | Potential Enhancement |
|------|----------------------|
| **Real-time features** | WebSocket-based live feed updates and notification delivery. |
| **Advanced analytics** | Machine-learning-driven sentiment analysis and predictive well-being indicators. |
| **Mobile application** | Native or React Native companion app for iOS and Android. |
| **Multi-university support** | Tenant isolation for deploying the platform across multiple institutions. |
| **Internationalization (i18n)** | Multi-language support for diverse student populations. |
| **Accessibility (a11y)** | WCAG 2.1 AA compliance audit and remediation. |
| **Export & reporting** | CSV/PDF export of aggregated statistics for institutional research. |
| **Integration APIs** | Webhooks and public APIs for third-party student information systems. |
| **Content recommendations** | Personalized feed ranking based on engagement patterns (privacy-preserving). |

---

## License

> License terms are pending final determination by the project maintainers.
>
> A `LICENSE` file will be added to this repository once the open-source or proprietary status of the project is decided.

---

## Contributors

> This project is in its initial planning phase. Contributor guidelines, a `CONTRIBUTING.md` file, and a list of team members will be added as the project team is formed.

| Role | Name | Status |
|------|------|--------|
| Project Lead | *TBD* | Planned |
| Backend Lead | *TBD* | Planned |
| Frontend Lead | *TBD* | Planned |
| Design Lead | *TBD* | Planned |

---

*This README is the single source of truth for the Mood of the Major project. All future documentation, specifications, and implementation work must align with the principles, architecture, and standards defined here.*
