# Mood of the Major — Authentication & Authorization

> **Document type:** Authentication and authorization architecture  
> **Status:** Draft v1.0  
> **Authority:** Derives from [`README.md`](../README.md), [`SPECS.md`](../SPECS.md), [`DESIGN.md`](../DESIGN.md), [`architecture.md`](./architecture.md), [`database.md`](./database.md), and [`api.md`](./api.md). Where conflict exists, `README.md` takes precedence.

---

## Table of Contents

1. [Authentication Philosophy](#authentication-philosophy)
2. [User Roles](#user-roles)
3. [Registration Flow](#registration-flow)
4. [Login Flow](#login-flow)
5. [Logout Flow](#logout-flow)
6. [Password Hashing Strategy](#password-hashing-strategy)
7. [JWT Strategy](#jwt-strategy)
8. [Refresh Token Strategy](#refresh-token-strategy)
9. [Authorization Strategy](#authorization-strategy)
10. [Anonymous Posting](#anonymous-posting)
11. [Route Protection](#route-protection)
12. [Session Strategy](#session-strategy)
13. [Password Validation Rules](#password-validation-rules)
14. [Email Validation](#email-validation)
15. [Authentication Error Responses](#authentication-error-responses)
16. [Security Considerations](#security-considerations)
17. [Future Authentication Features](#future-authentication-features)
18. [Related Documents](#related-documents)

---

## Authentication Philosophy

Mood of the Major requires users to **authenticate** before they can create content, engage with posts, or access private features — but requires **anonymity** when others view that content. Authentication and anonymity are not opposites; they serve different purposes:

| Concern | Purpose |
|---------|---------|
| **Authentication** | Prove the user is a registered member of the university community; enable ownership, accountability, and moderation |
| **Anonymity** | Prevent other users from seeing who wrote a mood, comment, or reaction |
| **Authorization** | Ensure each user can only perform actions their role and ownership allow |

### Core Principles

1. **JWT-based stateless access** — API instances validate tokens without server-side session stores (`FR-AUTH-002`, `NFR-SCALE-003`).
2. **Passwords never stored in plain text** — bcrypt hashing only (`FR-AUTH-003`).
3. **Validate at every boundary** — Client forms (Zod + React Hook Form), API ingress (Zod / Express Validator), and application services (`FR-AUTH-007`, `NFR-SEC-002`).
4. **Fail closed** — Missing, invalid, or expired tokens reject protected requests (`FR-AUTH-005`).
5. **Identity is internal** — `authorId` and `userId` exist in MongoDB but never appear in public API responses (`BR-ANON-001`, `NFR-PRIV-003`).
6. **Admin identity access is exceptional** — Administrators may view linked identity only for moderation, always audit-logged (`BR-ANON-004`).
7. **HTTPS everywhere** — All token transmission over TLS in production (`NFR-SEC-001`).

Authentication proves **who you are to the system**. Anonymity ensures **others cannot learn who you are from your content**.

---

## User Roles

The platform enforces **role-based access control (RBAC)** (`FR-AUTH-006`). Roles are stored on `users.role` in MongoDB and encoded in the JWT `role` claim.

### Student

| Attribute | Detail |
|-----------|--------|
| **Default role** | Assigned at registration |
| **Database value** | `student` |
| **Primary persona** | Mina — university student (`DESIGN.md`) |
| **Capabilities** | Register, login, create anonymous moods, comment, react, bookmark, search, report content, view feeds |
| **Restrictions** | Cannot access `/api/v1/admin/*`; cannot view other users' identity on public content |
| **Content creation** | Requires `status: active` on user account (`BR-AUTH-001`) |

Students are the only role that may **create** mood posts (`FR-POST-001`). Administrators engage with content for moderation but do not publish anonymous student posts.

### Administrator

| Attribute | Detail |
|-----------|--------|
| **Assignment** | Set manually in database or seed script — not self-selectable at registration |
| **Database value** | `administrator` |
| **Primary persona** | Dr. Chen — student affairs administrator (`DESIGN.md`) |
| **Capabilities** | All student read capabilities plus admin namespace: moderation, report resolution, user management, tag management, audit logs |
| **Identity access** | May view `authorId` and `email` on admin mood endpoints; every such access writes `auditlogs` with `identityAccessed: true` |
| **UI surface** | Separate admin shell (`DESIGN.md` Admin Layout) |

Administrator capabilities require the **administrator role**, not merely a valid JWT (`BR-AUTH-002`).

### Advisor (Reference)

`database.md` documents an optional `advisor` role (`OD-011`). Advisors have statistics read access without moderation tools. This document focuses on **student** and **administrator** as the two primary roles per project requirements; advisor authorization mirrors statistics endpoints documented in `api.md` when enabled.

### Guest (Unauthenticated)

Not a database role. Represents requests without a JWT. Guests may access public read routes only (see [Route Protection](#route-protection)).

---

## Registration Flow

Implements `FR-AUTH-001`. API: `POST /api/v1/auth/register` (`api.md`).

### Sequence

```
Client                         Backend API                    MongoDB
  │                                │                            │
  │── POST /auth/register ────────►│                            │
  │   { email, password,           │── validate (Zod) ──────────│
  │     facultyId?, majorId? }     │── check email unique ─────►│ users
  │                                │◄── not exists ─────────────│
  │                                │── hash password (bcrypt)   │
  │                                │── insert user (student) ──►│ users
  │                                │── issue access JWT         │
  │                                │── issue refresh token      │
  │                                │── store refresh hash ─────►│ users *
  │◄── 201 { user, tokens } ───────│                            │
  │── store access token           │                            │
  │── store refresh (cookie/mem)   │                            │
  │── redirect to Mood Feed        │                            │
```

\* Refresh token hash fields — see [Refresh Token Strategy](#refresh-token-strategy).

### Steps

1. **Client** — User completes register form (`DESIGN.md` Registration journey). React Hook Form validates with Zod before submit (`NFR-UX-002`).
2. **API validation** — Email format, password rules, optional `facultyId` / `majorId` validity (`api.md`).
3. **Email domain check** — If university domain restriction enabled (`OD-014`), reject non-matching domains with `422`.
4. **Uniqueness** — Reject duplicate email among non-deleted users.
5. **Password hash** — bcrypt before any persistence (`FR-AUTH-003`).
6. **User creation** — Insert `users` document: `role: student`, `status: active`.
7. **Token issuance** — Return access JWT + refresh token.
8. **Client redirect** — Navigate to `/feed` (Mood Feed) per `DESIGN.md`.

### Post-Registration State

- User is fully authenticated (no email verification gate in v1 — see [Future Authentication Features](#future-authentication-features)).
- Default `facultyId` / `majorId` from registration form or null until profile update.

---

## Login Flow

Implements `FR-AUTH-002`. API: `POST /api/v1/auth/login` (`api.md`).

### Sequence

```
Client                         Backend API                    MongoDB
  │                                │                            │
  │── POST /auth/login ───────────►│                            │
  │   { email, password }          │── rate limit check         │
  │                                │── find user by email ─────►│ users
  │                                │◄── user + passwordHash ────│
  │                                │── verify status: active    │
  │                                │── bcrypt.compare           │
  │                                │── update lastLoginAt ─────►│ users
  │                                │── issue access JWT         │
  │                                │── issue + store refresh    │
  │◄── 200 { user, tokens } ───────│                            │
```

### Steps

1. **Rate limit** — Enforce 10 requests / 15 min / IP on login (`FR-AUTH-009`, `api.md`).
2. **Lookup user** — Query `users` by normalized email where `deletedAt: null`.
3. **Constant-time failure** — If user not found or password wrong, return identical `401 AUTH_INVALID_CREDENTIALS` (no email enumeration).
4. **Status check** — Reject `suspended` users with `403 ACCOUNT_SUSPENDED`.
5. **Password verify** — bcrypt compare against `passwordHash`.
6. **Update** — Set `lastLoginAt` to current UTC time.
7. **Tokens** — Issue new access + refresh tokens. Optionally invalidate prior refresh tokens on login (configurable policy).
8. **Client** — Store tokens; redirect to intended destination or Mood Feed.

### Failed Login Behavior

- Generic error message: "Invalid email or password."
- Increment rate limit counter; do not reveal whether email exists.
- Log `warn` level auth failure with IP and path — never log password (`architecture.md` Logging Strategy).

---

## Logout Flow

Implements `FR-AUTH-008`. API: `POST /api/v1/auth/logout` (`api.md`).

### Sequence

```
Client                         Backend API                    MongoDB
  │                                │                            │
  │── POST /auth/logout ──────────►│                            │
  │   Authorization: Bearer        │── validate access JWT      │
  │   (+ refresh cookie/body)      │── revoke refresh hash ────►│ users
  │                                │── increment tokenVersion*  │
  │◄── 200 success ────────────────│                            │
  │── clear access token (memory)  │                            │
  │── clear refresh cookie         │                            │
```

### Steps

1. **Authenticate** — Valid access token required (logout while expired still clears client-side tokens client-only).
2. **Server revocation** — Remove or invalidate stored refresh token hash for this session/device.
3. **Optional global logout** — `change-password` and "logout all devices" increment `tokenVersion` to invalidate all outstanding access tokens on next request.
4. **Client cleanup** — Remove access token from memory/`sessionStorage`; clear HttpOnly refresh cookie.

### Client-Only Logout

If access token already expired and refresh fails, client clears local storage without server call — acceptable degraded logout.

---

## Password Hashing Strategy

Implements `FR-AUTH-003`. Passwords are hashed with **bcrypt** before persistence in `users.passwordHash`.

| Property | Value |
|----------|-------|
| **Algorithm** | bcrypt |
| **Cost factor** | 12 rounds default (configurable via `BCRYPT_ROUNDS` env var) |
| **Salt** | Per-password salt generated by bcrypt (embedded in hash string) |
| **Storage** | Only `passwordHash` in `users` collection |
| **Never stored** | Plain text, reversible encryption, or pre-hashed client-side passwords |

### Operations

| Event | Action |
|-------|--------|
| **Registration** | `hash(password)` → store `passwordHash` |
| **Login** | `compare(password, passwordHash)` |
| **Change password** | Verify `currentPassword`, hash `newPassword`, replace `passwordHash` |
| **Delete account** | Verify `password` before soft-delete |

### Rotation

Increasing `BCRYPT_ROUNDS` applies to new hashes only. Re-hash on successful login if rounds increased (optional background migration).

---

## JWT Strategy

Implements `FR-AUTH-002`, `FR-AUTH-004`, `FR-AUTH-005`. Tokens are signed with **HMAC-SHA256** (`HS256`) using server secret.

### Access Token

| Property | Value |
|----------|-------|
| **Format** | JWT (JSON Web Token) |
| **Transport** | `Authorization: Bearer <token>` header |
| **Lifetime** | **15 minutes** (900 seconds) — `JWT_EXPIRES_IN` env var |
| **Purpose** | Authenticate API requests |

#### Access Token Claims

| Claim | Type | Description |
|-------|------|-------------|
| `sub` | string | User `ObjectId` (`userId`) |
| `role` | string | `student`, `administrator`, or `advisor` |
| `typ` | string | Always `access` |
| `tv` | number | Token version — matches `users.tokenVersion` for revocation |
| `iat` | number | Issued at (Unix seconds) |
| `exp` | number | Expiration (Unix seconds) |

**Claims intentionally excluded:** `email`, `name`, `facultyId` — fetch via `GET /auth/me` when needed; reduces PII in token.

#### Access Token Validation (Every Protected Request)

1. Extract Bearer token from `Authorization` header.
2. Verify signature with `JWT_SECRET`.
3. Verify `typ === access`.
4. Verify `exp` not passed.
5. Load user by `sub`; verify `status: active` and `deletedAt: null`.
6. Verify `tv` claim matches `users.tokenVersion` (if revocation enabled).
7. Attach `userId` and `role` to request context (`architecture.md` middleware).
8. Proceed to authorization middleware and route handler.

Failure at any step → `401` without invoking business logic (`BR-AUTH-003`).

### Expiration

| Token | Lifetime | Rationale |
|-------|----------|-----------|
| **Access** | 15 minutes | Limits exposure if token leaked; refreshed transparently |
| **Refresh** | 7 days | Balances UX and security — see [Refresh Token Strategy](#refresh-token-strategy) |

Short access token lifetime supports stateless horizontal scaling without shared session store.

### Secret Management

| Secret | Storage | Rotation |
|--------|---------|----------|
| `JWT_SECRET` | Railway environment variables / secrets manager | Manual rotation with overlap window; invalidate all tokens on emergency rotation |
| `JWT_REFRESH_SECRET` | Separate secret for refresh tokens (recommended) or shared with `typ` discrimination | Same policy |

**Rules (`NFR-SEC-006`):**

- Never commit secrets to source control.
- Production and staging use different secrets.
- Minimum 256 bits of entropy for HS256 secret.
- GitHub Actions inject secrets at deploy time.

---

## Refresh Token Strategy

**Resolves `OD-003`.** Documented here as the authoritative refresh policy referenced by `api.md`.

### Design Decision

| Approach | Choice | Rationale |
|----------|--------|-----------|
| **Token type** | Opaque random string (256-bit) | Revocable server-side; not self-contained |
| **Delivery** | **HttpOnly, Secure, SameSite=Strict** cookie | Mitigates XSS theft (`NFR-SEC-003`); preferred over localStorage |
| **Fallback** | Refresh token in response body for non-browser clients (mobile future) | Same storage rules on device secure enclave |
| **Server storage** | SHA-256 hash stored on `users` document | Enables revocation without new MongoDB collection |
| **Rotation** | Issue new refresh token on every refresh; invalidate previous | Detects token reuse (potential theft) |

**SPA register/login response:** JSON includes `accessToken` and `expiresIn` only. Refresh token is set via `Set-Cookie` — not in the JSON body (`api.md` Register/Login).

### User Document Extensions

Fields on `users` per `database.md` §1:

| Field | Type | Purpose |
|-------|------|---------|
| `tokenVersion` | Number | Incremented on password change, logout-all; invalidates access JWTs |
| `refreshTokenHash` | String | SHA-256 hash of current valid refresh token |
| `refreshTokenExpiresAt` | Date | Refresh token expiry |

For multi-device support (future), replace single hash with bounded array `refreshSessions: [{ hash, expiresAt, userAgent }]` max 5 entries.

### Refresh Flow

API: `POST /api/v1/auth/refresh`

1. Client sends refresh token via HttpOnly cookie (or body for mobile).
2. Server hashes presented token; compares to `users.refreshTokenHash`.
3. Verify `refreshTokenExpiresAt` not passed.
4. Verify user `status: active`.
5. Issue new access JWT.
6. Issue new refresh token; replace hash; extend expiry (7 days sliding).
7. Set new HttpOnly cookie.

**Reuse detection:** If presented refresh hash does not match but user has active refresh session, treat as theft — revoke all refresh tokens and increment `tokenVersion`.

---

## Authorization Strategy

Authentication answers **who** is making the request. Authorization answers **what they may do**.

### Middleware Chain

Per `architecture.md`:

```
Request → cors → rateLimiter → authenticate → authorize(role?) → validate → controller
```

| Middleware | Responsibility |
|------------|----------------|
| `authenticate` | JWT validation; attaches `userId`, `role` |
| `authorize(roles)` | Asserts `role` is in allowed set |
| Application service | Ownership checks (`authorId === userId`), business rules |

### Protected Routes

A route is **protected** when it requires a valid access JWT. The `authenticate` middleware runs before the controller. Missing token → `401 AUTH_REQUIRED`.

### Role-Based Authorization

| Pattern | Usage |
|---------|-------|
| `authorize('student')` | Content creation endpoints |
| `authorize('administrator')` | All `/admin/*` routes |
| `authorize('student', 'administrator')` | Report submission (any authenticated user) |
| `authorize('student', 'advisor', 'administrator')` | Statistics read (per `OD-009`) |
| No `authorize` after `authenticate` | Any authenticated role permitted |

Role in JWT must match `users.role` in database on sensitive operations (re-fetch user for admin actions).

### Ownership Authorization

Separate from role — enforced in **application services**, not middleware:

| Action | Rule |
|--------|------|
| Edit mood | `moods.authorId === userId` OR role `administrator` |
| Delete mood | Same |
| Edit/delete comment | `comments.authorId === userId` OR `administrator` |
| Delete image | `moodimages.uploadedBy === userId` OR `administrator` |
| View bookmarked removed mood | `bookmarks.userId === userId` |

Ownership uses internal `authorId` — never exposed to client for verification.

---

## Anonymous Posting

Anonymous posting is the platform's core product constraint (`NFR-PRIV-003`). It is **not** the same as unauthenticated posting.

### Model

```
┌─────────────────────────────────────────────────────────────┐
│  AUTHENTICATION LAYER                                       │
│  User must be logged in (JWT) to CREATE content             │
│  users._id known to system                                  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  PERSISTENCE LAYER (MongoDB)                                │
│  moods.authorId = users._id  (STORED)                       │
│  comments.authorId = users._id (STORED)                     │
│  reactions.userId = users._id (STORED)                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  API RESPONSE LAYER (public DTO)                            │
│  authorId, userId, email — STRIPPED                         │
│  Only content, tags, counts, timestamps returned            │
└─────────────────────────────────────────────────────────────┘
```

### How Anonymous Posting Works

1. **Student authenticates** — JWT proves identity to backend.
2. **Student creates mood** — `POST /api/v1/moods` with valid JWT.
3. **Backend persists** — `moods.authorId` set to `userId` from JWT `sub`.
4. **Backend responds** — Public anonymous mood DTO without `authorId` (`api.md`).
5. **Other users read feed** — See content without any identity fields (`FR-FEED-004`).
6. **Student edits own mood** — Service compares `moods.authorId` to JWT `sub` server-side; client never receives `authorId` to make this decision.

### Ownership While Hiding Identity

| Need | Mechanism |
|------|-----------|
| **Edit/delete own post** | Server compares `authorId` to JWT `sub`; returns `403 NOT_OWNER` if mismatch |
| **Bookmark private access** | `bookmarks.userId` links user to mood; service authorizes read |
| **Report without exposing reporter** | `reports.reporterId` stored; hidden from content author (`FR-RPT-004`) |
| **Admin moderation** | Admin endpoint `GET /admin/moods/:id` returns `authorId` + `authorEmail`; `auditlogs.identityAccessed: true` |
| **Reaction privacy** | `GET /reactions` returns only caller's `userReaction`, never others' (`api.md`) |

### What Users See (DESIGN.md)

- No avatars, usernames, or profile links on mood cards or comments.
- Anonymity notice on create forms: "Your name will not be shown."
- Statistics never attribute posts to individuals (`FR-STAT-005`).

### Anti-Patterns (Forbidden)

- Returning `authorId` in public feed/detail responses.
- Client-side ownership checks based on visible identity.
- Including email or name in JWT claims visible to frontend decoding.
- Logging `authorId` alongside mood content in standard request logs.

---

## Route Protection

### Public Routes

No JWT required. Optional JWT may enhance response (e.g., `isBookmarked`, feed personalization).

| Method | Endpoint | Notes |
|--------|----------|-------|
| `POST` | `/api/v1/auth/register` | Rate limited |
| `POST` | `/api/v1/auth/login` | Rate limited |
| `POST` | `/api/v1/auth/refresh` | Requires refresh token, not access JWT |
| `GET` | `/api/v1/faculties` | Active faculties |
| `GET` | `/api/v1/faculties/:facultyId` | Faculty details |
| `GET` | `/api/v1/majors` | Major list |
| `GET` | `/api/v1/majors/:majorId` | Major details |
| `GET` | `/api/v1/moods/feed` | Guest limit may apply (`OD-002`) |
| `GET` | `/api/v1/moods/recent` | |
| `GET` | `/api/v1/moods/trending` | Threshold-gated data |
| `GET` | `/api/v1/moods/:moodId` | Active moods; bookmark exception needs auth |
| `GET` | `/api/v1/faculties/:facultyId/moods` | Faculty feed |
| `GET` | `/api/v1/majors/:majorId/moods` | Major feed |
| `GET` | `/api/v1/moods/:moodId/comments` | Comment list |
| `GET` | `/api/v1/comments/:commentId` | |
| `GET` | `/api/v1/reactions` | Counts only |

### Authenticated Routes

Valid access JWT required. Default role: any authenticated active user.

| Method | Endpoint | Additional authorization |
|--------|----------|--------------------------|
| `POST` | `/api/v1/auth/logout` | Self |
| `GET` | `/api/v1/auth/me` | Self |
| `PATCH` | `/api/v1/auth/me` | Self |
| `POST` | `/api/v1/auth/change-password` | Self |
| `DELETE` | `/api/v1/auth/me` | Self |
| `POST` | `/api/v1/moods` | `student` |
| `PATCH` | `/api/v1/moods/:moodId` | Owner or admin |
| `DELETE` | `/api/v1/moods/:moodId` | Owner or admin |
| `GET` | `/api/v1/moods/search` | Authenticated (`api.md`) |
| `POST` | `/api/v1/images/upload-url` | `student` |
| `POST` | `/api/v1/images/:imageId/confirm` | Uploader |
| `DELETE` | `/api/v1/images/:imageId` | Uploader or admin |
| `GET` | `/api/v1/images/:imageId/url` | Authorized viewer |
| `POST` | `/api/v1/moods/:moodId/comments` | `student` |
| `PATCH` | `/api/v1/comments/:commentId` | Owner |
| `DELETE` | `/api/v1/comments/:commentId` | Owner or admin |
| `PUT` | `/api/v1/reactions` | `student` |
| `DELETE` | `/api/v1/reactions` | `student` |
| `POST` | `/api/v1/bookmarks` | `student` |
| `DELETE` | `/api/v1/bookmarks/:moodId` | Owner |
| `GET` | `/api/v1/bookmarks` | Self |
| `GET` | `/api/v1/notifications` | Self |
| `PATCH` | `/api/v1/notifications/:id/read` | Recipient |
| `POST` | `/api/v1/notifications/read-all` | Self |
| `DELETE` | `/api/v1/notifications/:id` | Recipient |
| `POST` | `/api/v1/moods/:moodId/report` | Authenticated |
| `POST` | `/api/v1/comments/:commentId/report` | Authenticated |
| `GET` | `/api/v1/statistics/*` | `student`, `advisor`, `administrator` (per `OD-009`) |
| `GET` | `/api/v1/faculties/:facultyId/statistics` | Same |
| `GET` | `/api/v1/majors/:majorId/statistics` | Same |

### Admin Routes

Valid access JWT with `role: administrator` required. All paths under `/api/v1/admin/`.

| Method | Endpoint |
|--------|----------|
| `GET` | `/api/v1/admin/dashboard` |
| `GET` | `/api/v1/admin/users` |
| `GET` | `/api/v1/admin/users/:userId` |
| `PATCH` | `/api/v1/admin/users/:userId/status` |
| `GET` | `/api/v1/admin/reports` |
| `GET` | `/api/v1/admin/reports/:reportId` |
| `POST` | `/api/v1/admin/reports/:reportId/resolve` |
| `GET` | `/api/v1/admin/tags` |
| `POST` | `/api/v1/admin/tags` |
| `PATCH` | `/api/v1/admin/tags/:tagId` |
| `GET` | `/api/v1/admin/moods/:moodId` |
| `POST` | `/api/v1/admin/moods/:moodId/remove` |
| `GET` | `/api/v1/admin/content/moods` |
| `GET` | `/api/v1/admin/audit-logs` |

Non-admin users receive `403 INSUFFICIENT_ROLE` — not `404` (do not confirm route existence to attackers; optional policy: uniform 404).

---

## Session Strategy

Mood of the Major uses a **stateless access token + server-revocable refresh token** hybrid — not classic server-side sessions.

| Aspect | Strategy |
|--------|----------|
| **Session state** | Encoded in JWT access token claims |
| **No server session store** | Enables Railway horizontal scaling (`NFR-SCALE-003`) |
| **Refresh persistence** | Refresh token hash on `users` document |
| **Client access token storage** | In-memory preferred; `sessionStorage` acceptable; **never** `localStorage` if XSS risk unacceptable — document tradeoff in frontend |
| **Client refresh storage** | HttpOnly cookie (browser); secure storage (mobile) |
| **Session lifetime** | Effectively 7 days with sliding refresh; 15-minute access token cycle |
| **Concurrent sessions** | Allowed (multiple devices) until multi-device `refreshSessions` array implemented |
| **Invalidation triggers** | Logout, password change, admin suspend, token reuse detection, `tokenVersion` bump |

### Frontend Token Lifecycle (DESIGN.md / architecture.md)

1. Login/register → receive access + refresh tokens.
2. Axios interceptor attaches `Authorization: Bearer` on requests.
3. On `401 AUTH_EXPIRED_TOKEN` → call `POST /auth/refresh` → retry original request.
4. On refresh failure → redirect to `/login` (Auth Guard Prompt).
5. Logout → clear tokens + call `POST /auth/logout`.

TanStack Query does not store tokens — AuthContext owns session state.

---

## Password Validation Rules

Enforced at **client** (Zod + React Hook Form) and **server** (API validator) per `FR-AUTH-007`.

| Rule | Requirement |
|------|-------------|
| **Minimum length** | 8 characters |
| **Maximum length** | 128 characters (prevent bcrypt DoS) |
| **Character classes** | At least one letter (A–Z or a–z) and one digit (0–9) |
| **Disallowed** | Empty string, whitespace-only |
| **Recommended** | Special character encouraged but not required in v1 |
| **Common passwords** | Reject top 10,000 common passwords (optional dictionary check at registration) |

### Change Password Additional Rules

- `currentPassword` must verify against existing hash.
- `newPassword` must differ from `currentPassword`.
- On success: increment `tokenVersion`, revoke all refresh tokens.

---

## Email Validation

| Rule | Requirement |
|------|-------------|
| **Format** | RFC 5322 simplified — contains `@`, valid domain part |
| **Length** | Max 254 characters |
| **Normalization** | Lowercase and trim before storage and lookup |
| **Uniqueness** | Unique among users where `deletedAt: null` |
| **Immutability** | Email cannot change via `PATCH /auth/me` in v1 |

### University Domain Restriction (`OD-014`)

| State | Behavior |
|-------|----------|
| **Disabled (default v1)** | Any valid email accepted |
| **Enabled (production)** | Email must match allowlist e.g. `@university.edu` — configured via `ALLOWED_EMAIL_DOMAINS` env var |

When enabled, registration returns `422` with code `EMAIL_DOMAIN_NOT_ALLOWED`.

---

## Authentication Error Responses

Aligned with `api.md` Standard Response Format.

### Error Code Table

| Code | HTTP | When | Client action |
|------|------|------|---------------|
| `AUTH_REQUIRED` | 401 | Protected route, no Authorization header | Redirect to login |
| `AUTH_INVALID_TOKEN` | 401 | Malformed JWT, bad signature | Clear tokens; redirect to login |
| `AUTH_EXPIRED_TOKEN` | 401 | `exp` passed | Attempt refresh; else login |
| `AUTH_INVALID_CREDENTIALS` | 401 | Wrong email/password on login | Show generic message |
| `ACCOUNT_SUSPENDED` | 403 | `users.status: suspended` | Show suspension notice |
| `INSUFFICIENT_ROLE` | 403 | Valid JWT, wrong role | Show access denied |
| `NOT_OWNER` | 403 | Ownership check failed | Show permission error |
| `EMAIL_ALREADY_EXISTS` | 422 | Duplicate registration | Suggest login |
| `EMAIL_DOMAIN_NOT_ALLOWED` | 422 | Domain restriction (`OD-014`) | Show institution notice |
| `VALIDATION_FAILED` | 422 | Password/email validation | Show field errors |
| `RATE_LIMIT_EXCEEDED` | 429 | Auth rate limit hit | Show cooldown message |

### Response Examples

**Invalid credentials:**

```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Invalid email or password.",
    "requestId": "req_abc123"
  }
}
```

**Expired token:**

```json
{
  "success": false,
  "error": {
    "code": "AUTH_EXPIRED_TOKEN",
    "message": "Your session has expired. Please sign in again.",
    "requestId": "req_def456"
  }
}
```

**Validation:**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "One or more fields are invalid.",
    "details": [
      { "field": "password", "message": "Password must be at least 8 characters." }
    ],
    "requestId": "req_ghi789"
  }
}
```

Never include stack traces, MongoDB errors, or password hints (`NFR-SEC-009`).

---

## Security Considerations

### Brute Force Protection

| Control | Implementation |
|---------|----------------|
| **Rate limiting** | 10 login/register attempts per 15 min per IP (`FR-AUTH-009`) |
| **Generic errors** | Same response for wrong email vs wrong password |
| **Account lockout** | Not implemented v1 — rate limit by IP sufficient initially; future: per-email lockout after N failures |
| **Logging** | Warn on repeated failures from same IP |

### Rate Limiting

See `api.md` API Security. Auth endpoints are the strictest tier. Response includes `Retry-After` header on `429`.

### Password Hashing

See [Password Hashing Strategy](#password-hashing-strategy). bcrypt cost 12 balances security and login latency on Railway.

### JWT Validation

| Check | Required |
|-------|----------|
| Signature verification | Yes |
| `exp` not passed | Yes |
| `typ` claim correct | Yes |
| User exists and active | Yes — re-fetch from MongoDB on refresh; cache user status max 60s optional |
| `tokenVersion` match | Yes when revocation enabled |
| Algorithm allowlist | Reject `alg: none`; accept only `HS256` |

### Token Expiration

- Access: 15 minutes — limits blast radius of stolen token.
- Refresh: 7 days sliding — balance UX for daily active students.
- No "remember me" extending beyond refresh lifetime in v1.

### HTTPS

| Environment | Requirement |
|-------------|-------------|
| **Production** | TLS 1.2+ mandatory (`NFR-SEC-001`) |
| **Staging** | HTTPS enforced |
| **Development** | Local HTTP permitted; never use production secrets |

Vercel and Railway terminate TLS at edge/platform. No plain HTTP in production API URLs.

### Secure Headers

Backend responses should include:

| Header | Value |
|--------|-------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` (production) |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Content-Security-Policy` | Restrictive policy on frontend (Vercel); API returns JSON only |

Refresh cookie attributes:

| Attribute | Value |
|-----------|-------|
| `HttpOnly` | true |
| `Secure` | true (production) |
| `SameSite` | `Strict` |
| `Path` | `/api/v1/auth/refresh` (narrow scope) |

### Additional Controls

| Control | Reference |
|---------|-----------|
| **CORS** | Strict origin allowlist (`NFR-SEC-005`) |
| **Input validation** | Zod at API boundary (`NFR-SEC-002`) |
| **Admin audit** | `auditlogs` on identity access (`NFR-SEC-010`) |
| **Suspended users** | Fail authentication and token refresh |
| **Dependency scanning** | CI/CD (`NFR-SEC-008`) |

---

## Future Authentication Features

Not in v1 scope. Documented for architectural planning.

### Google OAuth

- **Flow:** OAuth 2.0 authorization code with PKCE.
- **User linking:** Create or link `users` by email; `passwordHash` optional for OAuth-only accounts.
- **Role assignment:** Default `student`; admin still manual.
- **Anonymity:** Unchanged — OAuth identity never exposed in public content.

### GitHub OAuth

- Same pattern as Google; likely dev/university coding community optional login.
- Require university email binding on first OAuth login if institution policy requires.

### Two-Factor Authentication (2FA)

- TOTP (authenticator app) as second factor after password.
- Store `totpSecret` encrypted on `users` — requires schema extension and ADR.
- Backup codes; admin accounts prioritized for mandatory 2FA.

### Password Reset

- `POST /auth/forgot-password` → email time-limited reset token (single-use, hashed in DB).
- `POST /auth/reset-password` → set new `passwordHash`, increment `tokenVersion`.
- Depends on email delivery service (SendGrid, Resend, etc.).

### Email Verification

- `users.emailVerified: false` at registration; verification email with signed link.
- Restrict posting until verified (configurable).
- Resolves institutional trust without domain-only restriction.

### Single Sign-On (SSO) / SAML

- University SAML 2.0 integration for campus-wide identity.
- Maps SAML attributes to `facultyId` / `majorId`.

### Session Management UI

- List active refresh sessions; revoke per device.
- Requires `refreshSessions` array on `users`.

---

## Related Documents

| Document | Content |
|----------|---------|
| [`api.md`](./api.md) | Auth endpoint contracts, error codes |
| [`database.md`](./database.md) | `users` collection, `authorId` anonymity |
| [`architecture.md`](./architecture.md) | Auth middleware, JwtTokenService, AuthService |
| [`security.md`](./security.md) | Threat model, threshold policies |
| [`SPECS.md`](../SPECS.md) | `FR-AUTH-*`, `BR-AUTH-*`, `BR-ANON-*` |
| [`DESIGN.md`](../DESIGN.md) | Auth pages, anonymity UX |
| [`.cursor/rules/security.mdc`](../.cursor/rules/security.mdc) | AI security guardrails |

---

## Resolved Open Decisions

| ID | Resolution in this document |
|----|----------------------------|
| `OD-003` | Opaque refresh token in HttpOnly cookie; SHA-256 hash on `users`; rotation on refresh; reuse detection |
| `OD-011` | Advisor role documented as statistics-only; student and administrator are primary |
| `OD-014` | Email domain restriction optional via `ALLOWED_EMAIL_DOMAINS` |

Remaining TBD: `OD-002` (guest feed limits — route protection notes), `OD-009` (student statistics access — listed as permitted with TBD note in `api.md`).

---

## Document Maintenance

| Event | Action |
|-------|--------|
| Token lifetime change | Update JWT Strategy and `api.md` |
| New OAuth provider | Add Future → implement section; ADR in `architecture.md` |
| `users` schema extension for tokens | Sync `database.md` §1 |
| New protected route | Update Route Protection tables |

---

*This document defines the complete authentication and authorization architecture for Mood of the Major. All auth implementation must conform to these specifications.*
