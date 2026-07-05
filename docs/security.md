# Mood of the Major — Security Architecture

> **Document type:** Security architecture and policy specification  
> **Status:** Draft v1.0  
> **Authority:** Derives from every project document: [`README.md`](../README.md), [`SPECS.md`](../SPECS.md), [`DESIGN.md`](../DESIGN.md), [`architecture.md`](./architecture.md), [`database.md`](./database.md), [`api.md`](./api.md), [`authentication.md`](./authentication.md), and [`cloudflare-r2.md`](./cloudflare-r2.md). Where conflict exists, `README.md` takes precedence.

---

## Table of Contents

1. [Security Philosophy](#security-philosophy)
2. [Authentication Security](#authentication-security)
3. [Authorization](#authorization)
4. [JWT Security](#jwt-security)
5. [Password Hashing](#password-hashing)
6. [Helmet](#helmet)
7. [CORS](#cors)
8. [Rate Limiting](#rate-limiting)
9. [Input Validation](#input-validation)
10. [Sanitization](#sanitization)
11. [MongoDB Injection Protection](#mongodb-injection-protection)
12. [XSS Protection](#xss-protection)
13. [File Upload Security](#file-upload-security)
14. [Cloudflare R2 Security](#cloudflare-r2-security)
15. [Secret Management](#secret-management)
16. [Environment Variables](#environment-variables)
17. [Logging Strategy](#logging-strategy)
18. [Audit Logs](#audit-logs)
19. [Error Exposure Strategy](#error-exposure-strategy)
20. [Secure HTTP Headers](#secure-http-headers)
21. [Production Checklist](#production-checklist)
22. [Future Security Improvements](#future-security-improvements)
23. [Related Documents](#related-documents)

---

## Security Philosophy

Mood of the Major is an **anonymous social platform** for university students. Security must protect three overlapping concerns simultaneously:

| Concern | Goal |
|---------|------|
| **Account security** | Registered users can trust that credentials, sessions, and private data are protected |
| **Content anonymity** | Other users cannot discover who wrote a mood, comment, or reaction |
| **Platform integrity** | Abuse, spam, and policy violations are constrained; administrators can moderate with accountability |

Security is a **cross-cutting architectural constraint**, not a post-implementation layer (`README.md` Development Philosophy: "Security by default"). Every feature is designed with threat mitigation before code is written.

### Core Tenets

1. **Defense in depth** — Multiple validation and authorization layers; no single control is sole protection.
2. **Fail closed** — Invalid auth, failed validation, or ambiguous authorization results in denial — never silent bypass.
3. **Least privilege** — Users, services, and credentials receive minimum access required for their role.
4. **Privacy by design** — Anonymity is enforced in API responses and database projections, not only in UI (`NFR-PRIV-003`).
5. **Secrets never in source control** — All credentials live in platform secret managers (`NFR-SEC-006`).
6. **Validate at boundaries** — Client, API ingress, application services, and persistence each enforce appropriate checks.
7. **Observable accountability** — Admin actions and identity access are audit-logged (`NFR-SEC-010`, `BR-ANON-004`).
8. **HTTPS everywhere** — TLS for all production traffic (`NFR-SEC-001`).

### Threat Model Summary

Aligned with `SPECS.md` §10.1:

| Threat | Primary mitigation |
|--------|-------------------|
| Credential theft | bcrypt, rate limiting, HTTPS |
| Token hijacking | Short JWT TTL, HttpOnly refresh cookie, token version revocation |
| XSS via user content | Output sanitization, CSP, HttpOnly cookies |
| Unauthorized API access | JWT middleware on protected routes |
| Bucket credential exposure | Presigned URLs only; R2 keys server-side only |
| Unauthorized image access | Private R2 bucket + signed download URLs |
| De-anonymization via analytics | Minimum aggregation thresholds (`BR-STAT-001`) |
| Abuse / spam | Rate limits on auth, posting, commenting |
| NoSQL injection | Mongoose parameterized queries, input validation |
| Dependency vulnerabilities | CI/CD scanning (`NFR-SEC-008`) |
| Privilege escalation | RBAC at application layer |
| Information leakage | Structured errors without stack traces (`NFR-SEC-009`) |

---

## Authentication Security

Authentication proves **who the user is to the system**. Full flows are documented in [`authentication.md`](./authentication.md).

### Requirements

| Requirement | Implementation |
|-------------|----------------|
| `FR-AUTH-001` | Registration with validated credentials |
| `FR-AUTH-002` | JWT-based session on login |
| `FR-AUTH-003` | bcrypt password hashing |
| `FR-AUTH-005` | Reject missing/invalid/expired tokens on protected routes |
| `FR-AUTH-009` | Rate limit auth endpoints |
| `BR-AUTH-003` | JWT validated before business logic on every protected request |

### Registration Security

- Email normalized (lowercase, trim) before uniqueness check.
- Duplicate email returns `422 EMAIL_ALREADY_EXISTS` — does not reveal whether account is active vs deleted beyond standard response.
- Optional university domain restriction via `ALLOWED_EMAIL_DOMAINS` (`OD-014` in `authentication.md`).
- Default role `student` — administrator role is never self-assigned.
- Password hashed before any database write.

### Login Security

- **Constant-time failure** — Identical `401 AUTH_INVALID_CREDENTIALS` for wrong email or wrong password (no enumeration).
- **Suspended accounts** — `users.status: suspended` returns `403 ACCOUNT_SUSPENDED`; cannot obtain new tokens.
- **`lastLoginAt`** updated on success for operational monitoring.
- **Rate limited** — 10 attempts per 15 minutes per IP (`api.md`).

### Logout and Session Revocation

- Server invalidates refresh token hash on logout (`FR-AUTH-008`).
- Password change increments `tokenVersion` — invalidates all outstanding access JWTs.
- Refresh token reuse detection revokes all sessions (potential theft signal).

### Brute Force Protection

| Control | v1 status |
|---------|-----------|
| IP rate limiting on login/register | Active |
| Generic error messages | Active |
| Per-email account lockout | Deferred to Future Security Improvements |
| CAPTCHA | Deferred |

---

## Authorization

Authentication answers **who**; authorization answers **what they may do**.

### Role-Based Access Control (RBAC)

Implements `FR-AUTH-006`, `BR-AUTH-002`. Roles stored in `users.role` and JWT `role` claim:

| Role | Database value | Create content | Admin namespace | Statistics |
|------|----------------|:--------------:|:-----------------:|:----------:|
| **Guest** | (no JWT) | — | — | — |
| **Student** | `student` | ✓ | — | TBD (`OD-009`) |
| **Advisor** | `advisor` | — | — | Read |
| **Administrator** | `administrator` | Moderate only | ✓ | ✓ |

Administrator capabilities require `role: administrator` — a valid JWT alone is insufficient (`BR-AUTH-002`).

### Middleware Chain

Per `architecture.md` and `authentication.md`:

```
Request → cors → rateLimiter → authenticate → authorize(role?) → validate → controller → application service
```

| Layer | Responsibility |
|-------|----------------|
| `authenticate` | Parse and validate JWT; attach `userId`, `role` |
| `authorize(roles)` | Assert role membership |
| Application service | Ownership checks, business rules, anonymity mapping |

### Ownership Authorization

Enforced in application services using internal identity fields never exposed to clients:

| Resource | Rule |
|----------|------|
| Edit/delete mood | `moods.authorId === userId` OR administrator |
| Edit/delete comment | `comments.authorId === userId` OR administrator |
| Delete image | `moodimages.uploadedBy === userId` OR administrator |
| View signed image URL | User can view parent mood OR is uploader |
| Bookmarks | `bookmarks.userId === userId` only |
| Notifications | `notifications.userId === userId` only |
| Reports (reporter) | `reports.reporterId` hidden from content author (`FR-RPT-004`) |

### Route Protection Summary

| Class | JWT required | Documented in |
|-------|:------------:|---------------|
| Public read (feeds, faculties, majors) | Optional | `authentication.md` §Route Protection |
| Content creation | Yes (`student`) | `authentication.md` |
| Image upload | Yes (`student`) | `authentication.md` |
| Statistics | Yes | `api.md` |
| Admin (`/api/v1/admin/*`) | Yes (`administrator`) | `authentication.md` |

---

## JWT Security

Detailed token policy in [`authentication.md`](./authentication.md) §JWT Strategy and §Refresh Token Strategy.

### Access Token

| Property | Value |
|----------|-------|
| Algorithm | HS256 (HMAC-SHA256) |
| Transport | `Authorization: Bearer <token>` |
| Lifetime | **15 minutes** (`JWT_EXPIRES_IN`) |
| Claims | `sub`, `role`, `typ: access`, `tv`, `iat`, `exp` |
| Excluded claims | `email`, `name`, `facultyId` — reduces PII in token |

### Refresh Token

| Property | Value |
|----------|-------|
| Type | Opaque random string (256-bit) — not self-contained JWT |
| Delivery | HttpOnly, Secure, SameSite=Strict cookie (browser) |
| Server storage | SHA-256 hash on `users` document |
| Lifetime | **7 days** sliding on refresh |
| Rotation | New refresh token on every refresh; previous invalidated |
| Reuse detection | Mismatch triggers full session revocation + `tokenVersion` bump |

### Validation Requirements (Every Protected Request)

1. Verify signature with `JWT_SECRET`.
2. Verify `typ === access`.
3. Verify `exp` not passed.
4. Reject `alg: none` and non-allowlisted algorithms.
5. Load user by `sub`; verify `status: active`, `deletedAt: null`.
6. Verify `tv` matches `users.tokenVersion`.
7. Attach `userId` and `role` to request — then run authorization.

Failure at any step → `401` without executing business logic (`BR-AUTH-003`).

### Client Storage Guidance

| Token | Recommended storage | Risk |
|-------|---------------------|------|
| Access token | In-memory or `sessionStorage` | XSS can exfiltrate — mitigated by short TTL |
| Refresh token | HttpOnly cookie only | Not accessible to JavaScript (`NFR-SEC-003`) |
| Avoid | `localStorage` for refresh | High XSS exposure |

Frontend Axios interceptor attaches access token; on `401 AUTH_EXPIRED_TOKEN`, call refresh endpoint and retry.

---

## Password Hashing

Implements `FR-AUTH-003`.

| Property | Value |
|----------|-------|
| Algorithm | **bcrypt** |
| Cost factor | **12 rounds** default (`BCRYPT_ROUNDS` env var) |
| Salt | Per-password, generated by bcrypt |
| Storage field | `users.passwordHash` only |
| Never stored | Plain text, client-side pre-hash, reversible encryption |

### Operations

| Event | Action |
|-------|--------|
| Registration | Hash → store |
| Login | `compare` against hash |
| Change password | Verify current, hash new, increment `tokenVersion`, revoke refresh tokens |
| Delete account | Verify password before soft-delete |

### DoS Consideration

Maximum password length **128 characters** prevents bcrypt abuse with extremely long inputs (`authentication.md`).

---

## Helmet

**Helmet** is the Express middleware used to set security-related HTTP response headers on the backend API (`architecture.md` middleware stack). It provides a consistent, maintained implementation of header best practices rather than manual header strings in every route.

### Purpose

| Function | Security benefit |
|----------|------------------|
| Set standard security headers | Reduces common web vulnerabilities (MIME sniffing, clickjacking) |
| Centralize header policy | One configuration point for all API responses |
| Complement manual headers | Works alongside explicit CORS and cookie policies |

### Helmet Configuration Intent

| Helmet feature | Setting | Notes |
|----------------|---------|-------|
| `contentSecurityPolicy` | Disabled or minimal for JSON API | API returns JSON only — CSP primary concern is Vercel frontend |
| `crossOriginEmbedderPolicy` | Compatible with CORS policy | Must not break frontend API calls |
| `crossOriginOpenerPolicy` | `same-origin` | Standard for API |
| `crossOriginResourcePolicy` | `cross-origin` | Allow frontend origin to read responses |
| `dnsPrefetchControl` | Enabled | Reduces passive DNS leakage |
| `frameguard` | `deny` | Prevents API responses from being framed |
| `hidePoweredBy` | Enabled | Removes `X-Powered-By: Express` |
| `hsts` | Enabled in production | See [Secure HTTP Headers](#secure-http-headers) |
| `ieNoOpen` | Enabled | Legacy IE download protection |
| `noSniff` | Enabled | `X-Content-Type-Options: nosniff` |
| `referrerPolicy` | `strict-origin-when-cross-origin` | Limits referrer leakage |
| `xssFilter` | Disabled (deprecated header) | Rely on CSP and sanitization instead |

Helmet runs early in the Express middleware chain — after request logging setup, before route handlers.

### Division of Responsibility

| Surface | Header mechanism |
|---------|------------------|
| **Backend API (Railway)** | Helmet + explicit security headers |
| **Frontend SPA (Vercel)** | Platform headers + Content-Security-Policy for rendered HTML |

---

## CORS

Implements `NFR-SEC-005`.

### Policy

| Environment | Allowed origins |
|-------------|-----------------|
| **Production** | Vercel production frontend URL only (from `CORS_ALLOWED_ORIGINS`) |
| **Staging** | Staging Vercel URL only |
| **Development** | `http://localhost:5173` (Vite default) and local variants |

### Configuration

| Property | Value |
|----------|-------|
| **Methods** | `GET`, `POST`, `PATCH`, `PUT`, `DELETE`, `OPTIONS` |
| **Allowed headers** | `Authorization`, `Content-Type` |
| **Credentials** | `true` — required for HttpOnly refresh cookie |
| **Preflight** | Cached via `Access-Control-Max-Age` (e.g., 86400 seconds) |
| **Wildcard** | `*` never used in production |

### R2 CORS

Cloudflare R2 bucket CORS must allow:

- `PUT` from frontend origins (presigned upload)
- `GET` from frontend origins (signed download)
- Origins mirror `CORS_ALLOWED_ORIGINS` (`cloudflare-r2.md`)

### Rejected Requests

Requests from unknown origins receive no `Access-Control-Allow-Origin` header. Browser blocks the response. Server may still process the request for non-browser clients — JWT validation remains required.

---

## Rate Limiting

Implements `NFR-SEC-004`, `FR-AUTH-009`, `FR-POST-010`, `FR-CMT-007`.

### Limits by Endpoint Group

From `api.md` §API Security:

| Endpoint group | Limit | Key |
|----------------|-------|-----|
| `POST /auth/login`, `POST /auth/register` | 10 / 15 min | IP |
| `POST /moods` | 30 / hour | User |
| `POST /comments` | 30 / hour | User |
| `POST /images/upload-url` | 30 / hour | User |
| `GET` feed endpoints | 120 / min | User |
| General API | 300 / min | IP |

### Response Behavior

| Element | Value |
|---------|-------|
| HTTP status | `429 Too Many Requests` |
| Error code | `RATE_LIMIT_EXCEEDED` |
| Headers | `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` |
| Optional | `Retry-After` header (seconds) |

### Design Rationale

| Concern | Mitigation |
|---------|------------|
| Brute force login | Strict auth tier |
| Spam posting | Per-user write limits |
| Feed scraping | Per-user read limits |
| DDoS volume | Per-IP general cap |

Rate limiting runs in middleware before authentication for public routes (IP-based) and after authentication for user-based limits.

---

## Input Validation

Implements `NFR-SEC-002`, `FR-AUTH-007`. Multi-layer strategy per `architecture.md` §Validation Strategy.

### Validation Layers

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Client (Zod + React Hook Form)                       │
│ Immediate UX; not authoritative                              │
├─────────────────────────────────────────────────────────────┤
│ Layer 2: API ingress (Zod / Express Validator)              │
│ Authoritative shape; reject unknown fields on strict schemas │
├─────────────────────────────────────────────────────────────┤
│ Layer 3: Application / domain services                      │
│ Business rules: ownership, cooldowns, thresholds, RBAC      │
├─────────────────────────────────────────────────────────────┤
│ Layer 4: Mongoose schema validators                           │
│ Last-resort persistence integrity                            │
└─────────────────────────────────────────────────────────────┘
```

### API Boundary Rules

- All request bodies, query params, and path params validated before controller logic.
- **Reject unknown fields** on strict schemas — prevents mass-assignment surprises.
- Max JSON body size: **1 MB** (image bytes bypass API via R2).
- Shared Zod schemas between frontend and backend where practical (`NFR-COMPAT-003`).

### Validated Domains

| Domain | Key constraints |
|--------|-----------------|
| Auth | Email format, password rules, domain allowlist |
| Moods | Content 1–5000 chars, required tags, image count ≤ 4 |
| Comments | Content 1–2000 chars, thread depth ≤ 3 |
| Images | MIME allowlist, size ≤ 5 MB, dimensions |
| Reports | Reason code enum, description max 1000 chars |
| Admin | Role-gated; action enums from controlled vocabulary |

### Anonymity Is Not Input Validation

Stripping `authorId` from responses is enforced in **DTO mappers and repository projections** — not by hoping clients ignore fields (`BR-ANON-001`).

---

## Sanitization

### Backend

| Content type | Policy |
|--------------|--------|
| **Post/comment text** | HTML stripped on write or escaped on read — no raw HTML stored for rendering |
| **Report descriptions** | Plain text only; length capped |
| **Admin notes** | Plain text; admin-only visibility |
| **Search queries** | Validated and length-limited before MongoDB text search |

### Frontend

Implements `NFR-SEC-003`:

- User-generated content sanitized before rendering in React components (`architecture.md` utilities).
- Never use `dangerouslySetInnerHTML` without sanitization pipeline.
- URLs in user content are not auto-linked without scheme allowlist (future hardening).

### What Is Not Sanitized Away

- Emotional text content (the product purpose) — only dangerous markup and scripts are removed.
- Mood category names and institutional reference data from trusted database sources.

---

## MongoDB Injection Protection

MongoDB injection (NoSQL injection) occurs when user input is interpreted as query operators (e.g., `$gt`, `$where`) rather than literal values.

### Primary Defenses

| Defense | Implementation |
|---------|----------------|
| **ODM parameterization** | Mongoose casts types and uses parameterized queries — never concatenate user input into query strings |
| **Input validation** | Zod/Express Validator rejects unexpected types and shapes at API boundary |
| **ObjectId validation** | Path params like `:moodId` validated as 24-char hex before queries |
| **No `$where` / `$function`** | Prohibited in repository queries — use standard operators only |
| **No raw user JSON in queries** | Never pass `req.body` or `req.query` directly to `find()` |
| **Strict schema mode** | Mongoose schemas reject fields not in schema where appropriate |
| **Least privilege DB user** | Atlas user has `readWrite` on app database only — not `dbAdmin` |

### Repository Pattern

All database access flows through repository implementations (`NFR-MAINT-003`). Controllers and services never construct ad hoc MongoDB queries from unvalidated request objects.

### Operator Injection Example (Forbidden)

Accepting `{ "email": { "$gt": "" } }` as a login query would match all users. Validation requires `email` to be a string; Mongoose cast enforces type at query boundary.

### Atlas Network Security

MongoDB Atlas network access restricted to Railway backend IP allowlists (`NFR-SEC-007`). Database is not publicly reachable.

---

## XSS Protection

Cross-site scripting (XSS) allows attackers to execute scripts in another user's browser.

### Defense Layers

| Layer | Control |
|-------|---------|
| **Output encoding** | React escapes text by default; sanitize HTML if rich content ever added |
| **Content sanitization** | Frontend sanitization utility for rendered user content (`NFR-SEC-003`) |
| **CSP (frontend)** | Content-Security-Policy on Vercel restricts script sources |
| **HttpOnly refresh cookie** | Refresh token not readable by JavaScript even if XSS occurs |
| **Short access JWT TTL** | 15-minute window limits stolen access token utility |
| **No secrets in JWT claims** | Email and PII excluded from access token payload |
| **XSS-safe error messages** | API errors are JSON — no reflected HTML error pages |

### User-Generated Content Surfaces

| Surface | Risk | Mitigation |
|---------|------|------------|
| Mood post body | Stored XSS | Sanitize on render; backend strips HTML on write |
| Comments | Stored XSS | Same |
| Search results | Reflected XSS | Query validated; results rendered as text |
| Image alt text (optional) | Attribute injection | Validate length; escape on render |
| Admin content preview | Stored XSS | Admin-only; still sanitize to protect admin sessions |

### Design Alignment

`DESIGN.md` prohibits exposing storage internals or stack traces in error copy. Error messages are plain text in toast/banner components.

---

## File Upload Security

Image uploads are a high-risk surface. Full storage architecture in [`cloudflare-r2.md`](./cloudflare-r2.md).

### Threat Model

| Threat | Mitigation |
|--------|------------|
| Malware upload | MIME allowlist; images only — no executables |
| Oversized files | 5 MB cap at presign |
| Decompression bomb | Dimension limits (4096×4096 max) on confirm |
| Unauthorized upload | JWT + `student` role required |
| Server storage abuse | Direct-to-R2 — bytes never touch Railway disk |
| Hotlinking | Private bucket; signed URLs only |
| MIME spoofing | Allowlist at presign; Content-Type condition on presigned PUT |

### Upload Rules

| Rule | Value |
|------|-------|
| Allowed MIME | `image/jpeg`, `image/png`, `image/webp` only |
| Max size | 5 MB per image |
| Max per post | 4 images |
| Max dimensions | 4096 × 4096 px |
| Min dimensions | 50 × 50 px |
| Filename in key | Server-generated — client `fileName` not used in object path |

### Authorization

- Presign: authenticated student only.
- Confirm: uploader only.
- Download: user authorized to view parent mood.
- Delete: uploader or administrator.

---

## Cloudflare R2 Security

Implements `INT-R2-001` through `INT-R2-004`, `FR-IMG-003`, `BR-IMG-003`. See [`cloudflare-r2.md`](./cloudflare-r2.md) §Security.

### Summary

| Control | Policy |
|---------|--------|
| Bucket access | Private — no public reads |
| Client credentials | Never exposed — presigned/signed URLs only |
| Upload URL TTL | 15 minutes |
| Download URL TTL | 1 hour |
| URL persistence | Never stored in MongoDB |
| Object keys | Server-generated; non-guessable (UUID + timestamp) |
| CORS | Restricted to frontend origins |
| Orphan cleanup | 24-hour TTL — prevents abandoned upload accumulation |
| Error exposure | No bucket names or object keys in client errors |

### Credential Scope

R2 API keys on Railway only. Keys grant access to single environment bucket. Rotated on compromise or scheduled policy.

---

## Secret Management

Implements `NFR-SEC-006`.

### Principles

| Rule | Detail |
|------|--------|
| **Never in git** | No `.env` files with real values committed; `.env.example` has keys only |
| **Platform secret stores** | Railway (backend), Vercel (frontend public vars), GitHub encrypted secrets (CI/CD) |
| **Environment separation** | Production, staging, development use different secrets |
| **Minimum exposure** | Frontend receives only `VITE_*` public variables — never backend secrets |
| **Rotation** | Manual rotation with documented procedure; emergency rotation invalidates all JWTs |
| **CI/CD injection** | GitHub Actions passes secrets at deploy — not baked into images |

### Secret Inventory

| Secret | Platform | Purpose |
|--------|----------|---------|
| `MONGODB_URI` | Railway | Database connection |
| `JWT_SECRET` | Railway | Access token signing |
| `JWT_REFRESH_SECRET` | Railway | Refresh token signing (recommended separate) |
| `R2_ACCESS_KEY_ID` | Railway | R2 API access |
| `R2_SECRET_ACCESS_KEY` | Railway | R2 API secret |
| GitHub Actions secrets | GitHub | Deploy credentials |

### Prohibited Practices

- Logging secrets, tokens, or connection strings.
- Embedding secrets in client bundle.
- Sharing production secrets in chat, email, or documentation.
- Using production secrets in development.

---

## Environment Variables

Catalog aligned with `architecture.md` §Environment Variables. Values are set per environment in platform consoles.

### Backend Secrets (Railway)

| Variable | Sensitivity | Purpose |
|----------|---------------|---------|
| `MONGODB_URI` | **Secret** | Atlas connection string |
| `JWT_SECRET` | **Secret** | Access token HMAC key (≥ 256 bits entropy) |
| `JWT_REFRESH_SECRET` | **Secret** | Refresh token operations |
| `R2_ACCESS_KEY_ID` | **Secret** | Cloudflare R2 |
| `R2_SECRET_ACCESS_KEY` | **Secret** | Cloudflare R2 |

### Backend Configuration (Non-secret)

| Variable | Purpose |
|----------|---------|
| `NODE_ENV` | `development` \| `staging` \| `production` |
| `PORT` | HTTP listen port |
| `JWT_EXPIRES_IN` | Access token lifetime (default 15m) |
| `BCRYPT_ROUNDS` | bcrypt cost (default 12) |
| `R2_ACCOUNT_ID` | Cloudflare account |
| `R2_BUCKET_NAME` | Environment bucket name |
| `R2_PUBLIC_URL` | S3-compatible endpoint |
| `CORS_ALLOWED_ORIGINS` | Comma-separated frontend origins |
| `RATE_LIMIT_*` | Rate limit windows and caps |
| `LOG_LEVEL` | `info` production; `debug` development |
| `ALLOWED_EMAIL_DOMAINS` | Optional registration domain restriction |
| `AGGREGATION_THRESHOLD_MIN` | Minimum group size for statistics (see below) |

### Frontend (Vercel)

| Variable | Sensitivity | Purpose |
|----------|---------------|---------|
| `VITE_API_BASE_URL` | Public | Backend API origin |
| `VITE_APP_ENV` | Public | Environment label |

### Aggregation Threshold

**Resolves `OD-010`.**

| Property | Value |
|----------|-------|
| **Variable** | `AGGREGATION_THRESHOLD_MIN` |
| **Default** | **5** |
| **Meaning** | Statistics, trending, and faculty/major summaries suppress counts when the group has fewer than 5 contributing moods in the scope/period |
| **Enforcement** | Aggregation jobs set `meetsThreshold` on `emotionstatistics` and `dailystatistics`; API returns threshold-not-met response (`BR-STAT-001`, `FR-STAT-006`) |
| **Rationale** | Prevents de-anonymization in small majors or low-activity periods (`NFR-PRIV-002`) |

---

## Logging Strategy

Aligned with `architecture.md` §Logging Strategy.

### Goals

| Goal | Requirement |
|------|-------------|
| Debuggability | `requestId` correlation across logs and error responses |
| Security | Never log passwords, JWTs, or PII in plain text |
| Auditability | Admin identity access and moderation logged |
| Operations | Structured JSON in production for Railway aggregation |

### Log Levels

| Level | Production usage |
|-------|------------------|
| `error` | Unhandled exceptions, R2/DB connection failures |
| `warn` | Rate limit hits, repeated auth failures, threshold suppression |
| `info` | Request completed, admin actions, startup |
| `debug` | Development only |

### What to Log

| Event | Fields |
|-------|--------|
| HTTP request | `requestId`, method, path, status, duration, `userId` if authenticated |
| Auth failure | `requestId`, IP, path — **not** password |
| Admin moderation | `adminId`, action, target type, target id, timestamp |
| Admin identity access | `adminId`, resource, reason, timestamp |
| R2 failure | `requestId`, operation — object key server-side only, never signed URL |
| Rate limit hit | IP or `userId`, endpoint |

### What Never to Log

| Data | Reason |
|------|--------|
| Passwords or bcrypt hashes | Credential exposure |
| Full JWT or refresh tokens | Session hijacking |
| Request bodies with credentials | Credential exposure |
| `authorId` linked to mood content in standard request logs | Anonymity risk |
| Signed R2 URLs | Contain temporary access credentials |
| Full email in bulk access logs | PII minimization — use `userId` |

### Request ID

- Generated per request (UUID).
- Returned in error response envelope as `requestId`.
- Included in all server logs for that request.

---

## Audit Logs

Implements `FR-ADMIN-005`, `BR-ANON-004`, `NFR-SEC-010`. Persisted in MongoDB `auditlogs` collection (`database.md` §15).

### Purpose

Audit logs provide **durable, queryable accountability** for administrative actions — separate from ephemeral application logs.

### Events Requiring Audit Entries

| Action | `action` value example | `identityAccessed` |
|--------|------------------------|:------------------:|
| View mood with author identity | `identity.view` | `true` |
| Remove mood (admin) | `mood.remove` | per context |
| Remove comment (admin) | `comment.remove` | per context |
| Resolve report | `report.resolve` | `false` |
| Suspend user | `user.suspend` | `true` |
| Reinstate user | `user.reinstate` | `true` |
| View user detail (admin) | `user.view` | `true` |
| Configure tag/category | `tag.update` | `false` |

### Audit Record Properties

| Field | Purpose |
|-------|---------|
| `adminId` | Acting administrator |
| `action` | Controlled vocabulary |
| `targetType` / `targetId` | Affected entity |
| `identityAccessed` | `true` when author/reporter identity was viewed |
| `metadata` | Structured context (prior status, reason) |
| `createdAt` | Immutable timestamp |

### Audit Log Security

| Property | Policy |
|----------|--------|
| **Mutability** | Append-only — no updates or deletes in normal operations |
| **Access** | Administrators only via `GET /api/v1/admin/audit-logs` |
| **Retention** | Minimum **2 years** (configurable) |
| **Separation** | Not a substitute for application logs — both are maintained |

### Student Privacy

Students cannot query audit logs. Audit entries may contain identity information — admin-only by design.

---

## Error Exposure Strategy

Implements `NFR-SEC-009`.

### Principles

1. **Consistent envelope** — All errors use `{ success: false, error: { code, message, details?, requestId } }`.
2. **Safe messages** — Human-readable text safe for client display.
3. **No internals** — Stack traces, file paths, MongoDB errors, R2 bucket names, and object keys never in responses.
4. **Correlation** — `requestId` helps support without exposing internals.
5. **Generic 500** — Unexpected errors return `INTERNAL_ERROR` with generic message; full detail logged server-side only.

### HTTP Status Mapping

| Category | Status | Example codes |
|----------|--------|---------------|
| Validation | 422 | `VALIDATION_FAILED` |
| Authentication | 401 | `AUTH_REQUIRED`, `AUTH_EXPIRED_TOKEN` |
| Authorization | 403 | `FORBIDDEN`, `INSUFFICIENT_ROLE`, `NOT_OWNER` |
| Not found | 404 | `RESOURCE_NOT_FOUND` |
| Conflict | 409 | `REPORT_COOLDOWN`, `BOOKMARK_ALREADY_EXISTS` |
| Rate limit | 429 | `RATE_LIMIT_EXCEEDED` |
| Server | 500 | `INTERNAL_ERROR` |

### Authentication Error Specifics

- Login failure: generic "Invalid email or password" — no hint which field failed.
- Token errors: distinct codes for client retry logic (`AUTH_EXPIRED_TOKEN` → refresh).

### Frontend Alignment

`DESIGN.md` §Error States — calm, actionable copy. Never show stack traces or storage internals. Admin UI follows same user-facing pattern; additional detail in server logs only.

---

## Secure HTTP Headers

### Backend API Headers

Set via **Helmet** and explicit middleware on Railway:

| Header | Value | Purpose |
|--------|-------|---------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Force HTTPS (production) |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limit referrer leakage |
| `X-Powered-By` | Removed | Hide Express fingerprint |
| `Cache-Control` | `no-store` on auth endpoints | Prevent token caching |

### Frontend Headers (Vercel)

| Header | Purpose |
|--------|---------|
| `Content-Security-Policy` | Restrict script, style, connect sources |
| `Strict-Transport-Security` | HTTPS enforcement |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` or `SAMEORIGIN` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | Disable unused browser features (camera, microphone, geolocation) |

### Cookie Security (Refresh Token)

| Attribute | Value |
|-----------|-------|
| `HttpOnly` | `true` |
| `Secure` | `true` (production) |
| `SameSite` | `Strict` |
| `Path` | `/api/v1/auth/refresh` |

### TLS

| Environment | Requirement |
|-------------|-------------|
| Production | TLS 1.2+ mandatory (`NFR-SEC-001`) |
| Staging | HTTPS enforced |
| Development | HTTP permitted locally; production secrets prohibited |

Vercel and Railway terminate TLS at platform edge.

---

## Production Checklist

Pre-launch security verification aligned with Phase 4 (`SPECS.md` §11) and `README.md` Security Overview.

### Infrastructure

- [ ] MongoDB Atlas IP allowlist restricted to Railway backend IPs (`NFR-SEC-007`)
- [ ] Separate Atlas cluster and R2 bucket for production
- [ ] All secrets in Railway/Vercel/GitHub — none in repository
- [ ] `NODE_ENV=production` on Railway
- [ ] TLS enforced on all public URLs
- [ ] CORS allowlist contains only production Vercel origin
- [ ] R2 bucket public access disabled
- [ ] R2 CORS configured for production frontend origin only

### Authentication & Sessions

- [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` are unique, high-entropy (≥ 256 bits)
- [ ] Access token TTL 15 minutes
- [ ] Refresh token delivered as HttpOnly, Secure, SameSite=Strict cookie
- [ ] `tokenVersion` revocation active on password change and logout
- [ ] bcrypt cost factor 12
- [ ] Rate limiting active on auth, write, and feed endpoints
- [ ] Suspended users cannot authenticate

### Application Security

- [ ] Helmet enabled on Express API
- [ ] Input validation on all API endpoints
- [ ] Unknown fields rejected on strict schemas
- [ ] Public mood/comment DTOs contain no identity fields (automated test)
- [ ] Ownership checks in application services — not client-side
- [ ] Administrator routes require `administrator` role
- [ ] Aggregation threshold configured (`AGGREGATION_THRESHOLD_MIN` ≥ 5)

### Content & Upload Security

- [ ] User content sanitized on frontend render
- [ ] Image MIME allowlist enforced at presign
- [ ] Image size and dimension limits enforced
- [ ] Presigned upload URLs expire in 15 minutes
- [ ] Signed download URLs expire in 1 hour
- [ ] Orphan image cleanup job scheduled

### Logging & Audit

- [ ] Structured JSON logging in production
- [ ] `requestId` in errors and logs
- [ ] Passwords and tokens excluded from logs
- [ ] Admin moderation writes `auditlogs` entries
- [ ] Admin identity access sets `identityAccessed: true`
- [ ] Audit log retention policy documented (≥ 2 years)

### CI/CD & Dependencies

- [ ] GitHub Actions runs lint, type-check, tests on PR (`INT-DEP-005`)
- [ ] Dependency vulnerability scanning in CI (`NFR-SEC-008`)
- [ ] No failing security checks on merge to main

### Error Handling

- [ ] No stack traces in API responses
- [ ] No MongoDB/R2 internals in client error messages
- [ ] Generic `500` message for unexpected errors

### Privacy & Anonymity

- [ ] Public feeds exclude `authorId`, `email`, `userId`
- [ ] Statistics suppress data below aggregation threshold
- [ ] Reporter identity hidden from content authors
- [ ] Reaction lists show counts only — not per-user breakdown

### Operational

- [ ] Atlas automated backups enabled (`NFR-AVAIL-002`)
- [ ] Deployment rollback procedure documented (`docs/deployment.md`)
- [ ] Incident response contact defined
- [ ] Security audit scheduled (Phase 4 roadmap)

---

## Future Security Improvements

Aligned with `authentication.md` §Future Authentication Features, `README.md` Future Improvements, and `SPECS.md` §12 out-of-scope items that affect security.

| Area | Enhancement |
|------|-------------|
| **Two-factor authentication (2FA)** | TOTP for administrators (priority) and optional for students |
| **OAuth / SSO** | Google OAuth, university SAML 2.0 — identity never exposed in public content |
| **Email verification** | Confirm email ownership before posting |
| **Password reset** | Secure token-based reset flow with email delivery |
| **Per-email account lockout** | After N failed logins — complement to IP rate limiting |
| **CAPTCHA** | On registration and login after rate limit threshold |
| **Web Application Firewall** | Cloudflare WAF in front of API and frontend |
| **Security headers audit** | Third-party scan of Vercel + Railway headers |
| **Penetration testing** | Phase 4 professional pentest before launch |
| **WCAG security** | Accessibility audit may surface focus-stealing and phishing vectors |
| **Content Security Policy hardening** | Stricter nonce-based CSP on frontend |
| **Automated moderation** | Keyword flagging, ML-based content classification |
| **GDPR / data export** | User data export and right-to-erasure workflows |
| **Multi-device session management** | List and revoke active refresh sessions per user |
| **HashiCorp Vault / sealed secrets** | Centralized secret rotation beyond platform env vars |
| **SIEM integration** | Export audit logs and security events to institutional monitoring |
| **Bug bounty** | Post-launch responsible disclosure program |

### Compliance (TBD)

| Area | Status |
|------|--------|
| University data governance | Policies TBD with institution (`SPECS.md` §10.2) |
| GDPR / data protection | Requirements TBD — deletion and retention policies |
| FERPA (US) | Evaluate if mood data constitutes education records |

---

## Related Documents

| Document | Security content |
|----------|------------------|
| [`README.md`](../README.md) | Security overview, infrastructure security |
| [`SPECS.md`](../SPECS.md) | `NFR-SEC-*`, `NFR-PRIV-*`, `BR-ANON-*`, `BR-AUTH-*`, threat model |
| [`authentication.md`](./authentication.md) | JWT, refresh, route protection, password rules |
| [`api.md`](./api.md) | Rate limits, CORS, error codes, API security |
| [`architecture.md`](./architecture.md) | Middleware chain, logging, validation layers |
| [`database.md`](./database.md) | Anonymity projections, `auditlogs` schema |
| [`cloudflare-r2.md`](./cloudflare-r2.md) | R2 private bucket, upload/download security |
| [`DESIGN.md`](../DESIGN.md) | Error states, anonymity UX, upload validation UX |
| [`.cursor/rules/security.mdc`](../.cursor/rules/security.mdc) | AI security guardrails |

---

## Resolved Open Decisions

| ID | Resolution in this document |
|----|----------------------------|
| `OD-010` | `AGGREGATION_THRESHOLD_MIN` default: **5** |

---

## Document Maintenance

| Event | Action |
|-------|--------|
| New threat identified | Update threat model and mitigations |
| Rate limit change | Sync with `api.md` |
| New secret variable | Update Environment Variables and Production Checklist |
| Auth policy change | Sync with `authentication.md` |
| Pentest findings | Add checklist items; log in `PROJECT_AUDIT.md` |

---

*This document defines the complete security architecture for Mood of the Major. All implementation must conform to these policies and the requirements in `SPECS.md`.*
