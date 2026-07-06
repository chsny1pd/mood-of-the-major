# Mood of the Major — Deployment Guide

> **Document type:** Production deployment and operations specification  
> **Status:** Draft v1.0  
> **Authority:** Derives from [`architecture.md`](./architecture.md), [`backend.md`](./backend.md), [`frontend.md`](./frontend.md), [`cloudflare-r2.md`](./cloudflare-r2.md), and [`security.md`](./security.md). Where conflict exists, `architecture.md` takes precedence for deployment topology; `security.md` takes precedence for security and secret policies.

---

## Table of Contents

1. [Deployment Philosophy](#deployment-philosophy)
2. [Environments](#environments)
3. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
4. [Backend Deployment (Railway)](#backend-deployment-railway)
5. [MongoDB Atlas Configuration](#mongodb-atlas-configuration)
6. [Cloudflare R2 Configuration](#cloudflare-r2-configuration)
7. [Environment Variables](#environment-variables)
8. [Secret Management](#secret-management)
9. [CI/CD Pipeline](#cicd-pipeline)
10. [GitHub Actions Workflow](#github-actions-workflow)
11. [Health Checks](#health-checks)
12. [Logging](#logging)
13. [Monitoring](#monitoring)
14. [Error Tracking](#error-tracking)
15. [Backup Strategy](#backup-strategy)
16. [Rollback Strategy](#rollback-strategy)
17. [Scaling Strategy](#scaling-strategy)
18. [Cost Optimization](#cost-optimization)
19. [Production Checklist](#production-checklist)
20. [Related Documents](#related-documents)

---

## Deployment Philosophy

Mood of the Major is deployed as **independently scalable services** on managed cloud platforms. Each runtime component maps to its optimal host — the frontend on Vercel, the backend on Railway, persistence on MongoDB Atlas, and media on Cloudflare R2 (`architecture.md` Deployment Topology).

### Core Principles

| Principle | Implication |
|-----------|-------------|
| **Separate deployments** | Frontend and backend deploy independently; they communicate only over HTTPS REST (`architecture.md`). |
| **Managed infrastructure** | Minimize operational overhead — no self-hosted databases, object storage, or TLS termination (`architecture.md` Scalability). |
| **Environment isolation** | Development, staging, and production use separate databases, R2 buckets, and secrets (`backend.md` Environment Separation, `cloudflare-r2.md` Environment isolation). |
| **Secrets never in source control** | All credentials live in platform secret managers and GitHub encrypted secrets (`security.md` Secret Management). |
| **Fail fast on misconfiguration** | Backend exits at startup if required production secrets are missing (`backend.md` Environment Configuration). |
| **Security by default** | TLS everywhere, private R2 buckets, Atlas IP allowlisting, strict CORS (`security.md`). |
| **CI before CD** | Pull requests run lint, type-check, and tests before any deployment (`architecture.md` CI/CD). |
| **Documented rollback** | Every production deploy has a defined rollback path (`security.md` Production Checklist). |
| **Stateless API** | Backend horizontal scaling requires no shared in-memory session store (`architecture.md` ADR-002). |
| **Binary bypass** | Image uploads go client → R2 directly; Railway never stores image bytes (`cloudflare-r2.md`). |

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

| Component | Platform | Rationale |
|-----------|----------|-----------|
| **Frontend SPA** | Vercel | Optimized React/Vite hosting, preview deployments, global CDN (`frontend.md` Technology Stack). |
| **Backend API** | Railway | Simple Node.js deployment, environment management, horizontal scaling (`backend.md` Technology Stack). |
| **Database** | MongoDB Atlas | Managed MongoDB with backups, monitoring, IP allowlisting (`architecture.md`). |
| **Image storage** | Cloudflare R2 | S3-compatible private storage; zero egress fees to Cloudflare CDN (`cloudflare-r2.md`). |
| **CI/CD** | GitHub Actions | Automated build, test, and deploy on repository events (`architecture.md`). |

### Repository Layout at Deploy Time

```
mood-of-the-major/
├── frontend/          → Vercel project (root directory: frontend)
├── backend/           → Railway project (root directory: backend)
└── .github/workflows/ → GitHub Actions pipeline definitions
```

Documentation lives at repository root; application code deploys from `frontend/` and `backend/` independently.

---

## Environments

Three environments are supported (`architecture.md` Environment Variables, `backend.md` Environment Separation).

### Development

| Property | Value |
|----------|-------|
| **Purpose** | Local engineering, feature branches, AI-assisted development |
| **Frontend** | Local Vite dev server (`http://localhost:5173`) or optional Vercel preview |
| **Backend** | Local Node.js process or shared dev Railway service |
| **Database** | `mood_of_the_major_dev` on Atlas (shared dev cluster acceptable) |
| **R2 bucket** | Development bucket with `development/` object prefix |
| **TLS** | HTTP permitted locally; production secrets prohibited (`security.md`) |
| **CORS** | Includes `http://localhost:5173` |
| **Log level** | `debug` (`backend.md` Logging Strategy) |
| **Deploy trigger** | Manual / local only — not auto-deployed from `main` |

Development uses `.env` files (gitignored) for local secrets. Never use production credentials locally.

### Staging

| Property | Value |
|----------|-------|
| **Purpose** | Pre-production QA; mirrors production configuration |
| **Frontend** | Vercel staging project or preview branch deployment |
| **Backend** | Railway staging service |
| **Database** | `mood_of_the_major_staging` on dedicated Atlas cluster or database |
| **R2 bucket** | Staging bucket with `staging/` object prefix |
| **TLS** | HTTPS enforced |
| **CORS** | Staging Vercel origin only (`security.md` CORS) |
| **Log level** | `info` |
| **Deploy trigger** | Vercel/Railway preview or staging deploy on PR; production on merge to `main`. Optional `develop` integration branch is not required in v1. |
| **Data** | Seed data; no production user data |

Staging validates integrations end-to-end before production promotion — auth flows, R2 upload, feeds, statistics, admin routes.

### Production

| Property | Value |
|----------|-------|
| **Purpose** | Live environment serving end users |
| **Frontend** | Vercel production project |
| **Backend** | Railway production service |
| **Database** | `mood_of_the_major` on production Atlas cluster |
| **R2 bucket** | Production bucket with `production/` object prefix |
| **TLS** | TLS 1.2+ mandatory on all public URLs (`security.md`) |
| **CORS** | Production Vercel origin only |
| **Log level** | `info` — `debug` disabled |
| **Deploy trigger** | Merge to `main` via GitHub Actions |
| **Uptime target** | 99.5% (`architecture.md` references NFR-AVAIL-001) |

Production requires all items in [Production Checklist](#production-checklist) before launch.

### Environment Comparison Matrix

| Aspect | Development | Staging | Production |
|--------|-------------|---------|------------|
| Atlas database | `_dev` | `_staging` | production name |
| R2 bucket | Dev bucket | Staging bucket | Production bucket |
| JWT secrets | Dev-only | Staging-only | Production-only |
| `NODE_ENV` | `development` | `staging` | `production` |
| `VITE_APP_ENV` | `development` | `staging` | `production` |
| Atlas backups | Optional | Enabled | Enabled + verified |
| IP allowlist | Relaxed / dev IPs | Railway staging IPs | Railway production IPs |
| Rate limits | Relaxed | Production-like | Production values |
| Monitoring | Console | Basic platform | Full monitoring stack |

---

## Frontend Deployment (Vercel)

The frontend is a React 19 + Vite SPA deployed to Vercel (`frontend.md` Technology Stack, `architecture.md`).

### Vercel Project Setup

| Setting | Value |
|---------|-------|
| **Framework preset** | Vite |
| **Root directory** | `frontend` |
| **Build command** | `npm run build` (or `pnpm build` / `yarn build` per package manager) |
| **Output directory** | `dist` |
| **Install command** | `npm ci` |
| **Node.js version** | LTS (20.x or 22.x — match backend) |

### Build-Time Configuration

| Requirement | Detail |
|-------------|--------|
| **API URL** | `VITE_API_BASE_URL` must point to the correct backend for each environment |
| **Environment label** | `VITE_APP_ENV` set per environment (`development`, `staging`, `production`) |
| **No backend secrets** | Only `VITE_*` variables — never JWT secrets, MongoDB URI, or R2 keys (`security.md`, `frontend.md`) |

Vite embeds `VITE_*` values at **build time**. Changing `VITE_API_BASE_URL` requires a **rebuild and redeploy** — not a runtime config change.

### Routing (SPA)

Vercel must serve `index.html` for all client-side routes (`frontend.md` Routing Strategy):

| Route pattern | Behavior |
|---------------|----------|
| `/feed`, `/admin/*`, `/mood/:id`, etc. | Rewrite to `/index.html` for React Router |
| Static assets | Served from `dist/assets/` with cache headers |

Configure SPA fallback in Vercel project settings or `vercel.json` at implementation time.

### Preview Deployments

| Feature | Usage |
|---------|-------|
| **PR previews** | Vercel auto-deploys preview URLs per pull request |
| **Preview API** | Point `VITE_API_BASE_URL` to staging backend or isolated preview API |
| **CORS** | Staging backend `CORS_ALLOWED_ORIGINS` must include preview URL pattern if PR previews call API |

Preview deployments support design review and QA without affecting production.

### Security Headers (Vercel)

Frontend security headers are set on Vercel per `security.md` §Secure HTTP Headers:

| Header | Purpose |
|--------|---------|
| `Content-Security-Policy` | Restrict script, style, and connect sources |
| `Strict-Transport-Security` | HTTPS enforcement |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` or `SAMEORIGIN` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | Disable unused browser features |

CSP `connect-src` must include the backend API origin (`VITE_API_BASE_URL`) and R2 presigned URL domains for image upload/download.

### Custom Domain

| Environment | Domain pattern (example) |
|-------------|--------------------------|
| Production | `app.moodofthemajor.app` (exact TBD at provisioning) |
| Staging | `staging.moodofthemajor.app` |
| API (backend) | `api.moodofthemajor.app` / `api.staging.moodofthemajor.app` |

Vercel handles TLS certificate provisioning automatically for custom domains.

### Deployment Flow

1. GitHub Actions CI passes on merge to target branch.
2. Vercel receives webhook or GitHub Actions deploy trigger.
3. Vercel installs dependencies in `frontend/`.
4. Build runs with environment-specific `VITE_*` variables.
5. `dist/` output deployed to Vercel CDN edge network.
6. Previous deployment remains available for instant rollback in Vercel dashboard.

---

## Backend Deployment (Railway)

The backend is an Express.js + TypeScript API deployed to Railway (`backend.md` Technology Stack).

### Railway Project Setup

| Setting | Value |
|---------|-------|
| **Root directory** | `backend` |
| **Start command** | `node dist/index.js` (after `npm run build`) or `npm start` per package.json |
| **Build command** | `npm run build` (TypeScript compile) |
| **Watch paths** | `backend/**` only — frontend changes do not trigger backend redeploy |
| **Health check path** | `/health` or `/ready` (see [Health Checks](#health-checks)) |
| **Port** | Railway injects `PORT` — application must bind to `process.env.PORT` |

### Startup Sequence

Per `backend.md` Environment Configuration:

1. Parse and validate environment variables via `config/env.ts`.
2. If `NODE_ENV=production` and required secret missing → **exit with error** (fail fast).
3. Connect to MongoDB Atlas via Mongoose connection pool.
4. Wire dependency injection — repositories, adapters, services, controllers.
5. Register Express middleware chain (Helmet, CORS, rate limiter, auth, error handler).
6. Listen on `PORT`.

A failed startup must not serve partial traffic. Railway restarts the process on crash.

### Process Model

| Property | Value |
|----------|-------|
| **Runtime** | Node.js |
| **Stateless** | No in-memory session store; JWT + refresh token hash on `users` document |
| **Horizontal scaling** | Multiple Railway replicas behind Railway load balancer (`backend.md` Scalability Strategy) |
| **TLS** | Terminated at Railway edge — application receives HTTP internally |

### Networking

| Rule | Detail |
|------|--------|
| **Public URL** | Railway-generated domain or custom domain with TLS |
| **MongoDB access** | Outbound only to Atlas — Atlas IP allowlist includes Railway egress IPs |
| **R2 access** | Outbound HTTPS to Cloudflare R2 S3-compatible endpoint |
| **CORS** | `CORS_ALLOWED_ORIGINS` must match Vercel frontend URL exactly |

### Background Jobs

Scheduled background work (statistics aggregation, orphan image cleanup, trending recalculation) is introduced per `docs/roadmap.md` — **Sprint 5** for statistics jobs, **Sprint 7** for R2 orphan cleanup and hardening. The initial Railway web service does not run cron until those sprints; protect future job endpoints with a service API key.

| Model | Fit |
|-------|-----|
| Railway cron → internal job endpoint | Simplest for v1 jobs |
| Separate Railway worker service | Isolated job processing |
| BullMQ + Redis | Higher scale with retries |

Job endpoints must be protected by service API key — never public.

### Deployment Flow

1. GitHub Actions CI passes on merge.
2. Railway builds `backend/` — install, compile TypeScript, prune dev dependencies.
3. Railway deploys new container with environment variables from Railway secrets.
4. Health check passes on `/health` or `/ready`.
5. Railway routes traffic to new deployment.
6. Previous deployment image retained for rollback.

---

## MongoDB Atlas Configuration

MongoDB Atlas is the sole persistence layer (`architecture.md`, `backend.md`).

### Cluster Provisioning

| Environment | Cluster recommendation |
|-------------|------------------------|
| **Development** | Shared M0/M2 sandbox or dedicated small cluster |
| **Staging** | Dedicated M10 (or equivalent) — production-like |
| **Production** | Dedicated M10+ with replica set; scale tier based on load testing |

Each environment uses a **separate database name** per `backend.md`:

| Environment | Database name |
|-------------|---------------|
| Development | `mood_of_the_major_dev` |
| Staging | `mood_of_the_major_staging` |
| Production | `mood_of_the_major` |

### Network Access

Per `security.md` MongoDB Injection Protection and Production Checklist:

| Rule | Detail |
|------|--------|
| **IP allowlist** | Restrict to Railway backend egress IP addresses only (`NFR-SEC-007`) |
| **No public 0.0.0.0/0** | Never allow unrestricted internet access in staging or production |
| **Development exception** | Developer IPs may be allowlisted for local development only |
| **VPC peering** | Future option for stricter network isolation at scale |

Obtain Railway static egress IPs (or use Railway's documented IP ranges) and add to Atlas Network Access list. Update allowlist when Railway scaling changes egress.

### Database User

| Property | Value |
|----------|-------|
| **Username** | Application-specific (e.g., `mood-api-prod`) |
| **Password** | High-entropy; stored as `MONGODB_URI` in Railway secrets |
| **Role** | `readWrite` on application database only — not `atlasAdmin` |
| **Connection string** | Stored in `MONGODB_URI`; includes retryWrites and w=majority |

### Connection Pooling

Per `backend.md` Performance Considerations:

| Setting | Intent |
|---------|--------|
| **Pool size** | Tune per Railway instance count — avoid connection exhaustion |
| **Single pool per instance** | Mongoose connection created once at startup |
| **Stateless scaling** | Each Railway replica maintains its own pool |

### Indexes and Migrations

- Indexes defined in application Mongoose models per `database.md` (referenced by architecture).
- Schema migrations run as versioned scripts during deploy or as manual Atlas operations.
- Staging receives migrations before production.

### Atlas Features to Enable

| Feature | Environment | Purpose |
|---------|-------------|---------|
| **Automated backups** | Staging, Production | Point-in-time recovery (`NFR-AVAIL-002`) |
| **Backup retention** | Production | Minimum 7 days; prefer 30 days for production |
| **Performance Advisor** | Production | Index recommendations |
| **Slow query logging** | Staging, Production | Feed p95 investigation |
| **Alerts** | Production | Connection spikes, disk usage, replication lag |

---

## Cloudflare R2 Configuration

Image storage is configured per `cloudflare-r2.md`. One **private bucket per environment**.

### Bucket Provisioning

| Environment | Bucket name pattern | Object prefix |
|-------------|---------------------|---------------|
| Development | `mood-of-the-major-dev` (example) | `development/` |
| Staging | `mood-of-the-major-staging` (example) | `staging/` |
| Production | `mood-of-the-major-prod` (example) | `production/` |

Exact bucket names are set via `R2_BUCKET_NAME` in Railway per environment.

### Bucket Security

| Setting | Value |
|---------|-------|
| **Public access** | Disabled — no public ACLs (`cloudflare-r2.md` Private Bucket Strategy) |
| **Bucket policy** | Deny anonymous `GetObject` and `PutObject` |
| **API credentials** | `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` in Railway only |
| **Client exposure** | Presigned and signed URLs only — never R2 API keys to browser |

### CORS Configuration

R2 bucket CORS must allow frontend origins (`cloudflare-r2.md`, `security.md`):

| Setting | Value |
|---------|-------|
| **Allowed origins** | Mirror `CORS_ALLOWED_ORIGINS` — Vercel frontend URLs per environment |
| **Allowed methods** | `PUT` (presigned upload), `GET` (signed download), `HEAD` |
| **Allowed headers** | `Content-Type`, `Content-Length` |
| **Expose headers** | `ETag` (optional, for upload confirm) |
| **Max age** | 86400 seconds |

Staging CORS includes staging Vercel origin. Production CORS includes production Vercel origin only.

### Object Key Layout

Canonical path per `cloudflare-r2.md`:

```
{environment}/moods/{userId}/{timestamp}-{uuid}.{ext}
```

Example production key:

```
production/moods/665a1b2c3d4e5f6789012347/20260705143000-a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg
```

### URL TTLs (Operational Reference)

| URL type | TTL |
|----------|-----|
| Presigned upload (PUT) | 15 minutes |
| Signed download (GET) | 1 hour |
| Orphan cleanup | 24 hours after unlinked upload |

### R2 API Endpoint

| Variable | Purpose |
|----------|---------|
| `R2_ACCOUNT_ID` | Cloudflare account identifier |
| `R2_PUBLIC_URL` | S3-compatible endpoint URL for SDK |
| `R2_BUCKET_NAME` | Target bucket per environment |

Backend `R2ImageStorage` adapter uses these to generate presigned URLs — configured at Railway, never on Vercel.

### Lifecycle and Cleanup

| Job | Schedule | Action |
|-----|----------|--------|
| Orphan image cleanup | Every 6 hours (future) | Delete R2 objects for unlinked `moodimages` older than 24h |
| Deleted image purge | Every 6 hours (future) | `DeleteObject` for soft-deleted `moodimages` |
| `temp/` prefix (future) | Daily lifecycle rule | Auto-expire after 1 day |

Initial deployment may rely on scheduled backend jobs rather than R2 lifecycle policies.

---

## Environment Variables

Complete catalog aligned with `architecture.md` §Environment Variables, `backend.md` Environment Configuration, `security.md` §Environment Variables, and `frontend.md` API Communication.

### Backend — Railway

#### Secrets (never commit, never expose to frontend)

| Variable | Required | Description |
|----------|:--------:|-------------|
| `MONGODB_URI` | ✓ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✓ | Access token HMAC signing key (≥ 256 bits entropy) |
| `JWT_REFRESH_SECRET` | ✓ | Refresh token hashing/signing (separate from access secret) |
| `R2_ACCESS_KEY_ID` | ✓ | Cloudflare R2 API access key |
| `R2_SECRET_ACCESS_KEY` | ✓ | Cloudflare R2 API secret |

#### Configuration (non-secret)

| Variable | Required | Default / notes |
|----------|:--------:|-----------------|
| `NODE_ENV` | ✓ | `development` \| `staging` \| `production` |
| `PORT` | ✓ | Injected by Railway |
| `JWT_EXPIRES_IN` | ✓ | `15m` (900 seconds) |
| `BCRYPT_ROUNDS` | | `12` |
| `R2_ACCOUNT_ID` | ✓ | Cloudflare account ID |
| `R2_BUCKET_NAME` | ✓ | Environment-specific bucket name |
| `R2_PUBLIC_URL` | ✓ | R2 S3-compatible endpoint URL |
| `CORS_ALLOWED_ORIGINS` | ✓ | Comma-separated Vercel origins (no trailing slashes) |
| `LOG_LEVEL` | | `info` (production), `debug` (development) |
| `AGGREGATION_THRESHOLD_MIN` | | `5` (`security.md` resolves OD-010) |
| `RATE_LIMIT_AUTH_WINDOW_MS` | | Per `api.md` rate limit tables |
| `RATE_LIMIT_AUTH_MAX` | | `10` per 15 min for login/register |
| `RATE_LIMIT_GENERAL_MAX` | | `300` per min per IP |
| `ALLOWED_EMAIL_DOMAINS` | | Optional university domain restriction |

Rate limit variables follow patterns documented in `api.md` §API Security. Exact names defined in `backend/constants/rateLimits.ts` at implementation.

### Frontend — Vercel

| Variable | Required | Description |
|----------|:--------:|-------------|
| `VITE_API_BASE_URL` | ✓ | Backend REST API origin (e.g., `https://api.moodofthemajor.app`) |
| `VITE_APP_ENV` | ✓ | `development` \| `staging` \| `production` |
| `VITE_*` (feature flags) | | Optional toggles — all public |

**Rule:** No backend secrets in any `VITE_*` variable (`security.md`, `frontend.md`).

### Environment-Specific Values (Example Matrix)

| Variable | Development | Staging | Production |
|----------|-------------|---------|------------|
| `VITE_API_BASE_URL` | `http://localhost:3000` | `https://api.staging.moodofthemajor.app` | `https://api.moodofthemajor.app` |
| `VITE_APP_ENV` | `development` | `staging` | `production` |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | `https://staging.moodofthemajor.app` | `https://app.moodofthemajor.app` |
| `R2_BUCKET_NAME` | dev bucket | staging bucket | prod bucket |
| `LOG_LEVEL` | `debug` | `info` | `info` |

Exact hostnames are finalized at infrastructure provisioning. API paths always include `/api/v1` prefix on the backend.

### `.env.example` Files

At implementation time, commit **key-only** example files:

| File | Contents |
|------|----------|
| `backend/.env.example` | All backend variable names with empty or placeholder values |
| `frontend/.env.example` | `VITE_API_BASE_URL`, `VITE_APP_ENV` |

Never commit files with real secret values.

---

## Secret Management

Per `security.md` §Secret Management.

### Storage Locations

| Secret category | Platform | Access |
|-----------------|----------|--------|
| Backend secrets | Railway environment variables (encrypted) | Backend service only |
| Frontend public config | Vercel environment variables | Build-time injection |
| CI/CD credentials | GitHub encrypted secrets | GitHub Actions only |
| Local development | `.env` files (gitignored) | Developer machine only |

### Secret Inventory

| Secret | Platform | Rotation policy |
|--------|----------|-----------------|
| `MONGODB_URI` | Railway | On credential rotation or security incident |
| `JWT_SECRET` | Railway | Manual rotation; invalidates all access tokens |
| `JWT_REFRESH_SECRET` | Railway | Rotate with JWT_SECRET on incident |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Railway | Rotate via Cloudflare dashboard; update Railway |
| Vercel deploy token | GitHub Secrets | Rotate annually or on team change |
| Railway deploy token | GitHub Secrets | Rotate annually or on team change |

### Rules

| Rule | Detail |
|------|--------|
| **Never in git** | No `.env` with real values; no secrets in documentation |
| **Environment separation** | Production secrets never used in development or staging |
| **Minimum exposure** | Frontend receives only `VITE_*` public variables |
| **CI/CD injection** | Secrets passed at deploy time — not baked into build artifacts |
| **Rotation procedure** | Document who rotates, when, and verification steps after rotation |
| **Emergency rotation** | JWT secret rotation invalidates all sessions — plan communication |

### Prohibited Practices

- Logging secrets, tokens, or connection strings.
- Embedding secrets in client bundle or `VITE_*` variables.
- Sharing production secrets via chat, email, or tickets without encryption.
- Using `0.0.0.0/0` Atlas access to avoid IP management.
- Storing R2 credentials on Vercel.

### Future: Centralized Secret Management

`security.md` Future Security Improvements notes HashiCorp Vault or sealed secrets for centralized rotation beyond platform env vars — not required for v1.

---

## CI/CD Pipeline

Per `architecture.md` deployment model and `security.md` CI/CD requirements.

### Pipeline Stages

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Trigger   │───►│    Build    │───►│    Test     │───►│   Deploy    │
│  (PR/push)  │    │ lint+types  │    │  unit+e2e   │    │ Vercel+Rail │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### Trigger Rules

| Event | Actions |
|-------|---------|
| **Pull request** | Lint, type-check, unit tests, dependency audit — **no deploy** |
| **Merge to `main`** | Full CI + deploy backend to Railway production + frontend to Vercel production |
| **Merge to `develop`** (if used) | Full CI + deploy to staging environments |
| **Manual workflow** | Optional `workflow_dispatch` for staging redeploy or hotfix |

### Quality Gates (PR)

All must pass before merge:

| Gate | Tool | Scope |
|------|------|-------|
| Lint | ESLint | `frontend/`, `backend/` |
| Type check | TypeScript (`tsc --noEmit`) | `frontend/`, `backend/` |
| Unit tests | Test runner (Vitest/Jest per implementation) | `frontend/`, `backend/` |
| Dependency audit | `npm audit` or equivalent | Both packages (`NFR-SEC-008`) |

Failing CI blocks merge to protected branches.

### Deploy Gates (Merge)

| Gate | Verification |
|------|--------------|
| CI green | All PR checks passed on merge commit |
| Backend health | `/health` returns 200 after Railway deploy |
| Smoke test (optional) | Authenticated ping to `/api/v1/auth/me` on staging before prod promote |

### Branch Protection

| Branch | Protection |
|--------|------------|
| `main` | Require PR, require CI pass, no direct push |
| `develop` | Require PR, require CI pass (if used) |

### Independent Deploy Paths

| Change scope | Deploy target |
|--------------|---------------|
| `frontend/**` only | Vercel only (path filter in workflow) |
| `backend/**` only | Railway only |
| Both | Both services in parallel |

Path filters prevent unnecessary redeploys when only documentation changes.

---

## GitHub Actions Workflow

Workflow files live in `.github/workflows/` at repository root. The following describes the **intended workflow design** — implementation creates YAML matching this specification.

### Workflow: `ci.yml` (Pull Request)

| Property | Value |
|----------|-------|
| **Trigger** | `pull_request` to `main` or `develop` |
| **Concurrency** | Cancel in-progress runs for same PR |

#### Jobs

| Job | Steps |
|-----|-------|
| **frontend-ci** | Checkout → setup Node → `npm ci` in `frontend/` → lint → typecheck → test → audit |
| **backend-ci** | Checkout → setup Node → `npm ci` in `backend/` → lint → typecheck → test → audit |

Jobs run **in parallel**. Both must succeed.

### Workflow: `deploy-staging.yml` (Optional)

| Property | Value |
|----------|-------|
| **Trigger** | Push to `develop` or manual `workflow_dispatch` |
| **Depends on** | CI checks (inline or reusable workflow) |

#### Jobs

| Job | Steps |
|-----|-------|
| **deploy-backend-staging** | Railway deploy with staging secrets |
| **deploy-frontend-staging** | Vercel deploy with staging `VITE_*` variables |

### Workflow: `deploy-production.yml`

| Property | Value |
|----------|-------|
| **Trigger** | Push to `main` |
| **Concurrency** | One production deploy at a time |

#### Jobs

| Job | Steps |
|-----|-------|
| **deploy-backend-production** | Authenticate to Railway → deploy `backend/` → wait for health check |
| **deploy-frontend-production** | Authenticate to Vercel → deploy `frontend/` with production `VITE_*` |

Jobs may run in parallel after CI verification. Backend deploy should complete health check before announcing deploy success.

### Required GitHub Secrets

| Secret | Purpose |
|--------|---------|
| `RAILWAY_TOKEN` | Railway CLI/API deploy authentication |
| `VERCEL_TOKEN` | Vercel CLI deploy authentication |
| `VERCEL_ORG_ID` | Vercel team/org identifier |
| `VERCEL_PROJECT_ID` | Vercel frontend project identifier |

Backend runtime secrets (`MONGODB_URI`, JWT, R2) are **not** stored in GitHub — they live in Railway environment configuration. GitHub secrets are for **deploy authentication** only.

### Reusable Workflow Pattern (Recommended)

| Workflow | Purpose |
|----------|---------|
| `ci-reusable.yml` | Shared lint/test jobs called by PR and deploy workflows |
| `deploy-reusable.yml` | Parameterized deploy by environment |

Reduces duplication between staging and production pipelines.

### Notifications (Future)

| Event | Channel |
|-------|---------|
| Deploy success/failure | Slack, email, or GitHub deployment status |
| CI failure on `main` | Alert on-call engineer |

---

## Health Checks

Per `backend.md` Future Backend Improvements — health endpoints support Railway probes and operational monitoring.

### Endpoints

| Endpoint | Purpose | Auth | Success response |
|----------|---------|------|------------------|
| `GET /health` | Liveness — process is running | Public | `200 { "status": "ok" }` |
| `GET /ready` | Readiness — dependencies available | Public | `200` when MongoDB connected; `503` when not |

Implement in backend delivery layer at implementation time. Paths are not under `/api/v1` — they are infrastructure endpoints.

### `/health` (Liveness)

| Check | Included |
|-------|----------|
| HTTP server responding | ✓ |
| MongoDB connection | Optional (lightweight ping) |
| R2 connectivity | Not required — avoids false negatives |

Railway liveness probe uses `/health`. Failure restarts the container.

### `/ready` (Readiness)

| Check | Included |
|-------|----------|
| MongoDB connection active | ✓ |
| Mongoose connection state `connected` | ✓ |
| R2 | Optional HEAD on bucket — defer to avoid probe latency |

Railway readiness probe uses `/ready`. Traffic not routed until readiness passes.

### Frontend Health

| Check | Method |
|-------|--------|
| Vercel deployment | Platform verifies build output and edge availability |
| Synthetic monitor (future) | External ping to `/` expecting `200` |

SPA health is primarily a hosting platform concern — no custom backend-style health endpoint on Vercel.

### Post-Deploy Verification

| Step | Action |
|------|--------|
| 1 | `GET /health` → 200 |
| 2 | `GET /ready` → 200 |
| 3 | `GET /api/v1/faculties` → 200 (public read) |
| 4 | Frontend loads at Vercel URL |
| 5 | Browser network tab shows API calls to correct `VITE_API_BASE_URL` |

---

## Logging

Aligned with `architecture.md` §Logging Strategy, `backend.md` §Logging Strategy, and `security.md` §Logging Strategy.

### Backend Logging (Railway)

| Property | Value |
|----------|-------|
| **Format** | Structured JSON in production |
| **Destination** | Railway stdout → Railway log aggregation |
| **Default level** | `info` (production), `debug` (development) |
| **Correlation** | `requestId` on every request — returned in error responses |

#### What to Log

| Event | Fields |
|-------|--------|
| HTTP request complete | `requestId`, method, path, status, duration, `userId` if auth |
| Auth failure | `requestId`, IP, path — never password |
| Admin moderation | `adminId`, action, target type, target id |
| Rate limit hit | IP or `userId`, endpoint |
| R2 failure | `requestId`, operation — object key server-side only |
| Startup | Environment, port, MongoDB connection success |

#### What Never to Log

| Data | Reason |
|------|--------|
| Passwords, JWTs, refresh tokens | Credential exposure |
| Full signed R2 URLs | Temporary access credentials |
| `authorId` with mood content in standard logs | Anonymity risk |

### Frontend Logging

| Property | Value |
|----------|-------|
| **Production** | Minimal `console.error` for unexpected errors — no PII |
| **Development** | Verbose logging permitted |
| **API errors** | Log `requestId` from error envelope for support correlation |
| **Never log** | Tokens, passwords, full API responses with user data |

### Audit Logs vs Application Logs

| Type | Storage | Retention |
|------|---------|-----------|
| Application logs | Railway stdout | Platform default (30–90 days typical) |
| Audit logs | MongoDB `auditlogs` | Minimum 2 years (`security.md`) |

Application logs are for debugging and operations. Audit logs are for compliance and admin accountability — separate systems.

---

## Monitoring

Monitoring ensures production availability and performance against targets (`architecture.md` NFR-PERF-*, NFR-AVAIL-*).

### Platform-Native Monitoring

| Platform | Built-in metrics |
|----------|------------------|
| **Railway** | CPU, memory, network, deployment history, crash restarts |
| **Vercel** | Build times, edge requests, bandwidth, Web Vitals |
| **MongoDB Atlas** | Connections, opcounters, query execution times, disk I/O, replication lag |
| **Cloudflare R2** | Storage usage, request counts (via Cloudflare dashboard) |

### Application Metrics to Track

| Metric | Target / alert threshold |
|--------|--------------------------|
| API feed p95 latency | ≤ 500 ms (`NFR-PERF-001`) |
| Presign p95 latency | ≤ 200 ms (`NFR-PERF-002`) |
| Statistics dashboard p95 | ≤ 2 s (`NFR-PERF-004`) |
| Error rate (5xx) | Alert if > 1% over 5 minutes |
| Auth failure rate | Alert on spike — possible brute force |
| Rate limit hits | Monitor for abuse patterns |
| MongoDB connections | Alert near pool exhaustion |
| R2 presign failures | Alert on sustained errors |

### Uptime Monitoring

| Check | Frequency | Target |
|-------|-----------|--------|
| Backend `/health` | 1 minute | 99.5% uptime |
| Frontend `/` | 1 minute | 99.5% uptime |
| API public endpoint | 5 minutes | `GET /api/v1/faculties` returns 200 |

Use external synthetic monitoring (e.g., UptimeRobot, Better Uptime, Pingdom) — not implemented in application code.

### Alerting Routing

| Severity | Response |
|----------|----------|
| **Critical** (API down, DB unreachable) | Immediate on-call notification |
| **Warning** (elevated error rate, slow queries) | Review within business hours |
| **Info** (deploy success, backup complete) | Log channel only |

Define incident response contact before production launch (`security.md` Production Checklist).

### Future Observability

`backend.md` Future Backend Improvements:

| Enhancement | Purpose |
|-------------|---------|
| OpenTelemetry traces | End-to-end request tracing |
| Datadog / Grafana | Unified dashboards |
| Custom metrics endpoint | Prometheus-compatible `/metrics` |

Not required for initial deployment.

---

## Error Tracking

Error tracking captures unhandled exceptions and client-side crashes for post-incident analysis.

### Backend Error Tracking

| Layer | Behavior |
|-------|----------|
| **Global error handler** | Catches all errors; returns safe JSON envelope (`security.md` Error Exposure Strategy) |
| **500 errors** | Full stack logged server-side at `error` level — never in API response |
| **Unhandled rejections** | Log at `error`; process may exit for critical failures |

#### Future Integration

| Service | Usage |
|---------|-------|
| **Sentry** (recommended) | Capture unhandled exceptions with `requestId`, `userId`, release version |
| **Railway log alerts** | Pattern match on `error` level log lines |

Configure Sentry DSN as Railway secret at implementation. Tag events with `environment: production|staging`.

### Frontend Error Tracking

| Layer | Behavior |
|-------|----------|
| **Error Boundary** | Catches render errors; shows recovery UI (`frontend.md` Error Handling) |
| **TanStack Query errors** | Surfaced to UI — optional report to error tracking |
| **Axios interceptor** | Normalizes API errors; logs `requestId` in development |

#### Future Integration

| Service | Usage |
|---------|-------|
| **Sentry** | React error boundary integration, source maps uploaded on Vercel build |
| **Vercel Web Vitals** | Performance regression detection |

Frontend Sentry DSN is a **public** `VITE_SENTRY_DSN` — not a secret.

### Error Tracking Rules

| Rule | Detail |
|------|--------|
| **No PII in error reports** | Scrub emails, tokens, post content from breadcrumbs |
| **Include release version** | Git SHA or semver in Sentry release tag |
| **Separate projects** | Staging and production Sentry projects or environments |
| **Source maps** | Upload from CI for readable stack traces — restrict access |

---

## Backup Strategy

Aligned with `architecture.md` (NFR-AVAIL-002), `backend.md`, and `security.md` Production Checklist.

### MongoDB Atlas Backups

| Environment | Policy |
|-------------|--------|
| **Production** | Continuous cloud backup enabled; minimum 7-day retention; prefer 30 days |
| **Staging** | Daily snapshots enabled |
| **Development** | Optional — non-critical data |

#### Backup Verification

| Activity | Frequency |
|----------|-----------|
| Restore drill to temporary cluster | Quarterly |
| Verify backup completion in Atlas | Weekly review |
| Document restore procedure | Before production launch |

#### Point-in-Time Recovery

Atlas continuous backup enables restore to any point within retention window. Use for:

- Accidental data deletion
- Bad migration
- Security incident requiring known-good state

### Application Data Not in Atlas

| Data | Backup approach |
|------|-----------------|
| **R2 images** | R2 durability (11 nines); no separate backup required for v1 |
| **Audit logs** | In Atlas — covered by database backup |
| **Railway config** | Document env vars separately; secrets in Railway dashboard |
| **Vercel config** | Infrastructure as documentation; `vercel.json` in git |

### R2 Considerations

R2 objects are the authoritative binary store. Deletion is intentional via soft-delete + background job (`cloudflare-r2.md`). Accidental mass deletion recovery:

- Atlas metadata (`moodimages.objectKey`) restored from DB backup
- R2 objects may require Cloudflare support for object recovery if hard-deleted — prefer soft-delete workflow

### Backup Responsibilities

| Role | Responsibility |
|------|----------------|
| **Platform (Atlas)** | Automated snapshot execution |
| **Engineering** | Enable backups, verify retention, quarterly restore drill |
| **Operations** | Document and test restore runbook |

---

## Rollback Strategy

Every production deployment must have a defined rollback path (`security.md` references this document).

### Frontend Rollback (Vercel)

| Method | Speed | Procedure |
|--------|-------|-----------|
| **Instant rollback** | < 1 minute | Vercel dashboard → Deployments → select previous deployment → Promote to Production |
| **Git revert** | 5–15 minutes | Revert commit on `main` → CI → auto-deploy previous code state |

Vercel preserves deployment history. Rollback does not require rebuild if promoting a previous deployment.

**Caution:** If rollback crosses a `VITE_API_BASE_URL` change, verify frontend and backend compatibility.

### Backend Rollback (Railway)

| Method | Speed | Procedure |
|--------|-------|-----------|
| **Railway rollback** | 2–5 minutes | Railway dashboard → Deployments → rollback to previous deployment |
| **Git revert** | 5–15 minutes | Revert commit on `main` → CI → redeploy |

Railway retains previous container images. Rollback restores previous application code and env var snapshot at time of that deployment.

### Database Rollback

| Scenario | Approach |
|----------|----------|
| **Bad migration (forward fix preferred)** | Write corrective migration; deploy forward |
| **Catastrophic migration** | Atlas point-in-time restore to new cluster; update `MONGODB_URI`; verify data |
| **Accidental data delete** | Point-in-time restore or collection-level restore from snapshot |

Database rollback is **high impact** — requires maintenance window and communication. Prefer forward-fix migrations in most cases.

### R2 Rollback

R2 has no deployment rollback. Object changes are immediate:

| Scenario | Approach |
|----------|----------|
| **Bad deploy affecting upload logic** | Roll back backend; orphaned uploads cleaned by 24h job |
| **Accidental bucket policy change** | Revert policy in Cloudflare dashboard immediately |

### Rollback Decision Matrix

| Symptom | First action |
|---------|--------------|
| Frontend UI broken | Vercel promote previous deployment |
| API 5xx spike after deploy | Railway rollback |
| Data corruption | Atlas point-in-time restore (maintenance window) |
| Auth broken after JWT change | Roll back backend; may require users to re-login |
| CORS errors after deploy | Verify `CORS_ALLOWED_ORIGINS`; hotfix env var or rollback |

### Post-Rollback

1. Confirm `/health` and `/ready` return 200.
2. Smoke test critical paths: login, feed, create mood, image upload.
3. Document incident in `PROJECT_AUDIT.md`.
4. Root-cause fix forward on branch — do not redeploy broken commit.

---

## Scaling Strategy

Aligned with `architecture.md` Scalability, `backend.md` Scalability Strategy, and `frontend.md` Future Scalability.

### Frontend Scaling (Vercel)

| Dimension | Strategy |
|-----------|----------|
| **Traffic** | Vercel CDN edge network — automatic global distribution |
| **Build** | Vercel handles concurrent builds; no manual scaling |
| **Bundle size** | Route-level code splitting reduces per-user download (`frontend.md` Performance) |

Frontend scaling is **fully managed** by Vercel. No manual replica configuration.

### Backend Scaling (Railway)

| Dimension | Strategy |
|-----------|----------|
| **Horizontal replicas** | Add Railway instances behind load balancer (`NFR-SCALE-003`) |
| **Stateless design** | JWT auth — no sticky sessions required |
| **Connection pool** | Tune Mongoose pool per replica to avoid Atlas connection limit |
| **Rate limiting** | Future: Redis-backed limiter for multi-instance consistency (`backend.md`) |

#### Scaling Triggers

| Signal | Action |
|--------|--------|
| CPU > 70% sustained | Add replica |
| p95 latency > 500 ms on feeds | Add replica + review indexes |
| Memory pressure | Add replica or increase instance size |

### Database Scaling (Atlas)

| Dimension | Strategy |
|-----------|----------|
| **Vertical** | Upgrade cluster tier (M10 → M20 → M30) |
| **Read scaling** | Read replicas for statistics queries (future) |
| **Horizontal** | Shard on `{ facultyId, createdAt }` when single shard outgrown (`database.md` referenced in architecture) |
| **Indexes** | Primary performance lever — review Atlas Performance Advisor |

### R2 Scaling (Cloudflare)

| Dimension | Strategy |
|-----------|----------|
| **Storage** | Automatic — no capacity planning for object count |
| **Bandwidth** | Direct client ↔ R2 bypasses Railway (`NFR-SCALE-002`) |
| **Request rate** | Cloudflare handles; monitor via dashboard |

### Scaling Prerequisites Checklist

Before adding backend replicas:

- [ ] Stateless JWT — no in-memory session store
- [ ] Atlas connection limit accommodates `replicas × poolSize`
- [ ] Rate limiter compatible with multi-instance (or accept per-instance limits in v1)
- [ ] Background jobs idempotent — safe on any instance
- [ ] Railway egress IPs documented in Atlas allowlist

---

## Cost Optimization

Aligned with `cloudflare-r2.md` §Cost Optimization and managed-platform philosophy.

### Platform Cost Levers

| Service | Optimization |
|---------|--------------|
| **Vercel** | Hobby/Pro tier based on team size; preview deployments limited on busy repos |
| **Railway** | Right-size instance; scale replicas only when metrics justify |
| **MongoDB Atlas** | Start M10; scale tier based on Atlas metrics — avoid over-provisioning dev |
| **Cloudflare R2** | Zero egress to Cloudflare CDN; orphan cleanup prevents storage creep |
| **GitHub Actions** | Path filters reduce CI minutes; cache `node_modules` between runs |

### Architecture-Driven Savings

| Decision | Savings |
|----------|---------|
| **Direct R2 upload** | Railway bandwidth near zero for images (`cloudflare-r2.md`) |
| **Pre-aggregated statistics** | Avoid expensive live MongoDB aggregations on every dashboard load |
| **Cursor pagination** | Bounded query sizes — no unbounded memory |
| **Private R2 bucket** | No accidental public egress abuse |
| **Stateless API** | Scale Railway replicas incrementally — no large single instance |
| **Separate env buckets** | No test data accumulation in production bucket |
| **Orphan cleanup (24h)** | Prevents abandoned upload storage creep (`BR-IMG-004`) |
| **5 MB / 4 images cap** | Bounds per-post storage (`cloudflare-r2.md`) |

### Development Cost Controls

| Practice | Detail |
|----------|--------|
| Atlas M0 for dev | Free tier for non-production |
| Pause dev Railway service | When not in active development |
| R2 dev bucket lifecycle | Optional auto-expire old test objects |
| Limit Vercel preview deploys | Configure ignored build step for docs-only PRs |

### Monitoring Costs

Track monthly spend per platform. Alert on unexpected R2 storage growth (orphan job failure) or Atlas storage spikes.

---

## Production Checklist

Consolidated pre-launch checklist from `security.md` Production Checklist, `backend.md`, `frontend.md`, and `cloudflare-r2.md`. Complete all items before serving end users in a **commercial or high-traffic production** launch.

### Classroom project scope

**Mood of the Major** is deployed as a **classroom / academic demo**. The full checklist below remains the engineering reference; the **required subset** for this project is smaller.

| Required for classroom | Waived (document only) |
|------------------------|-------------------------|
| Railway prod: `NODE_ENV=production`, JWT secrets, CORS = Vercel prod URL | Dedicated staging environment |
| Vercel prod: `VITE_API_BASE_URL` → Railway API | Custom domains |
| Atlas with backups; R2 private bucket + prod CORS | Branch protection, rollback drills |
| CI green; post-deploy smoke on production | Uptime monitors, Sentry DSN, pentest |
| Manual QA on local (or production smoke) | k6 staging benchmarks, incident on-call |

**Sign-off record:** [`docs/production-checklist-audit.md`](./production-checklist-audit.md) (updated when platform config is confirmed).

For a future commercial launch, walk every unchecked item in the sections below.

### Infrastructure

- [ ] MongoDB Atlas production cluster provisioned with automated backups
- [ ] Atlas IP allowlist restricted to Railway production egress IPs
- [ ] Separate Atlas database, R2 bucket, and secrets for production
- [ ] Railway production service configured with all required environment variables
- [ ] Vercel production project configured with `VITE_API_BASE_URL` pointing to production API
- [ ] Custom domains configured with TLS on Vercel and Railway
- [ ] `NODE_ENV=production` on Railway
- [ ] CORS allowlist contains only production Vercel origin
- [ ] R2 bucket public access disabled
- [ ] R2 CORS configured for production frontend origin only

### Deployment Pipeline

- [ ] GitHub Actions CI runs lint, type-check, and tests on every PR
- [ ] Dependency vulnerability scanning enabled in CI
- [ ] Merge to `main` deploys to Railway and Vercel production
- [ ] Branch protection enabled on `main`
- [ ] Rollback procedure tested (Vercel promote + Railway rollback)
- [ ] Post-deploy smoke test documented and executed

### Health and Operations

- [ ] `GET /health` returns 200 on production backend
- [ ] `GET /ready` returns 200 when MongoDB connected
- [ ] Railway health check configured
- [ ] External uptime monitor on API and frontend
- [ ] Structured JSON logging enabled (`LOG_LEVEL=info`)
- [ ] `requestId` present in error responses and logs
- [ ] Incident response contact defined
- [ ] Quarterly Atlas backup restore drill scheduled

### Security

- [ ] All secrets in Railway/Vercel/GitHub — none in repository
- [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` unique, high-entropy (≥ 256 bits)
- [ ] Refresh token delivered as HttpOnly, Secure, SameSite=Strict cookie
- [ ] Helmet enabled on Express API
- [ ] Rate limiting active on auth, write, and feed endpoints
- [ ] `AGGREGATION_THRESHOLD_MIN` set to ≥ 5
- [ ] No stack traces or R2/MongoDB internals in API responses
- [ ] Frontend CSP configured on Vercel
- [ ] Presigned upload TTL 15 minutes; signed download TTL 1 hour

### Application Verification

- [ ] Registration and login flow works end-to-end
- [ ] Mood feed loads with cursor pagination
- [ ] Create mood with image upload (presign → PUT → confirm → publish) works
- [ ] Signed image URLs display in feed and detail
- [ ] Statistics dashboard respects aggregation threshold
- [ ] Admin routes reject non-administrator users
- [ ] Public API responses contain no `authorId` or `email`

### Monitoring and Error Tracking

- [ ] Railway and Atlas alerts configured
- [ ] Error tracking service connected (Sentry or equivalent) — backend and frontend
- [ ] Deploy notifications configured

---

## Related Documents

| Document | Deployment relevance |
|----------|---------------------|
| [`architecture.md`](./architecture.md) | Deployment topology, env var catalog, CI/CD overview |
| [`backend.md`](./backend.md) | Railway setup, startup, env separation, health endpoints |
| [`frontend.md`](./frontend.md) | Vercel build, `VITE_*` variables, SPA routing |
| [`cloudflare-r2.md`](./cloudflare-r2.md) | Bucket setup, CORS, object keys, TTLs |
| [`security.md`](./security.md) | Secrets, CORS, TLS, production security checklist |
| [`authentication.md`](./authentication.md) | JWT, refresh cookie, CORS credentials (referenced for cookie deploy config) |
| [`api.md`](./api.md) | API base path `/api/v1`, rate limits (referenced for env tuning) |

---

## Document Maintenance

| Event | Action |
|-------|--------|
| New environment variable | Update Environment Variables and platform setup sections |
| Platform change (host migration) | Update topology diagram and deployment sections |
| New health/monitoring tool | Update Monitoring and Error Tracking |
| Incident or rollback | Update Rollback Strategy with lessons learned |
| Cost review | Update Cost Optimization |
| Production launch | Verify all Production Checklist items |

---

*This document is the definitive deployment and operations guide for Mood of the Major. All infrastructure provisioning and CI/CD implementation must conform to these specifications.*
