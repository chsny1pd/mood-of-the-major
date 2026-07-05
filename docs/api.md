# Mood of the Major — API Specification

> **Document type:** REST API contract  
> **Status:** Draft v1.0  
> **Base URL:** `https://api.{environment}.moodofthemajor.app/api/v1` (exact host in `docs/deployment.md`)  
> **Authority:** Derives from [`README.md`](../README.md), [`SPECS.md`](../SPECS.md), [`DESIGN.md`](../DESIGN.md), [`architecture.md`](./architecture.md), and [`database.md`](./database.md). Where conflict exists, `README.md` takes precedence.

---

## Table of Contents

1. [API Design Philosophy](#api-design-philosophy)
2. [Standard Response Format](#standard-response-format)
3. [API Security](#api-security)
4. [Authentication APIs](#authentication-apis)
5. [Faculty APIs](#faculty-apis)
6. [Major APIs](#major-apis)
7. [Mood APIs](#mood-apis)
8. [Image APIs](#image-apis)
9. [Comment APIs](#comment-apis)
10. [Reaction APIs](#reaction-apis)
11. [Bookmark APIs](#bookmark-apis)
12. [Notification APIs](#notification-apis)
13. [Report APIs](#report-apis)
14. [Statistics APIs](#statistics-apis)
15. [Admin APIs](#admin-apis)
16. [Shared Schemas](#shared-schemas)
17. [Future APIs](#future-apis)
18. [Related Documents](#related-documents)

---

## API Design Philosophy

### REST

The API follows **REST** principles (`INT-API-001`, `NFR-COMPAT-002`):

- Resources are nouns (moods, comments, faculties)
- HTTP methods express actions on resources
- Stateless requests; session state carried via JWT
- JSON request and response bodies
- HATEOAS-lite via `_links` on list responses (optional pagination cursors)

### Versioning

| Rule | Detail |
|------|--------|
| **URL versioning** | All routes prefixed with `/api/v1` |
| **Breaking changes** | Require `/api/v2`; v1 maintained for deprecation period |
| **Non-breaking additions** | New optional fields, new endpoints within v1 |
| **Header** | `Accept: application/json` required |

### Consistency

- All endpoints return the [Standard Response Format](#standard-response-format)
- Public mood/comment/reaction responses use **anonymous DTOs** — never `authorId`, `userId`, or `email` (`BR-ANON-001`, `BR-ANON-002`)
- Dates are **ISO 8601 UTC** strings (e.g., `2026-07-05T14:30:00.000Z`)
- IDs are MongoDB ObjectId strings (24 hex characters)
- Slugs used in URLs where noted (faculties, majors, tags) for readability; ObjectId also accepted where documented

### Resource Naming

| Convention | Example |
|------------|---------|
| Plural nouns | `/moods`, `/comments`, `/faculties` |
| kebab-case in paths | `/emotion-statistics`, `/audit-logs` |
| Nested sub-resources | `/moods/:moodId/comments` |
| Actions as sub-paths | `/reports/:id/resolve` (admin) |
| No verbs in top-level paths | ✓ `/auth/login` (auth namespace exception) |

### HTTP Methods

| Method | Usage |
|--------|-------|
| `GET` | Read resource(s); idempotent |
| `POST` | Create resource or non-idempotent action |
| `PUT` | Full replace (rare; prefer PATCH) |
| `PATCH` | Partial update |
| `DELETE` | Remove resource (soft delete where documented) |

### HTTP Status Codes

| Code | Meaning | When used |
|------|---------|-----------|
| `200` | OK | Successful GET, PATCH, DELETE, action endpoints |
| `201` | Created | POST creating new resource |
| `204` | No Content | Logout success (optional) |
| `400` | Bad Request | Malformed JSON, invalid parameter type |
| `401` | Unauthorized | Missing/invalid/expired JWT |
| `403` | Forbidden | Valid JWT but insufficient role or ownership |
| `404` | Not Found | Resource does not exist or not visible |
| `409` | Conflict | Duplicate bookmark, duplicate report in cooldown |
| `422` | Unprocessable Entity | Validation failed, business rule violation |
| `429` | Too Many Requests | Rate limit exceeded (`FR-AUTH-009`, `NFR-SEC-004`) |
| `500` | Internal Server Error | Unexpected server failure (`NFR-SEC-009`) |

### Response Format

See [Standard Response Format](#standard-response-format). All success responses wrap payloads in `{ success: true, data, meta? }`.

### Error Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "One or more fields are invalid.",
    "details": [
      { "field": "content", "message": "Content is required." }
    ],
    "requestId": "req_abc123xyz"
  }
}
```

Never includes stack traces or internal paths (`NFR-SEC-009`).

### Pagination

**Decision (resolves `OD-005`):** Cursor-based pagination on all list endpoints.

| Query param | Type | Description |
|-------------|------|-------------|
| `limit` | integer | Page size; default `20`, max `50` |
| `cursor` | string | Opaque cursor from previous `meta.nextCursor`; omit for first page |

**Response meta:**

```json
{
  "meta": {
    "limit": 20,
    "nextCursor": "eyJjcmVhdGVkQXQiO...",
    "hasMore": true
  }
}
```

Cursor encodes `(createdAt, _id)` sort position per `database.md` index strategy.

### Filtering

Filter via query parameters on list endpoints:

| Param pattern | Example |
|---------------|---------|
| `facultyId` | Filter moods by faculty |
| `majorId` | Filter moods by major |
| `tagId` or `tagSlug` | Filter by emotion category |
| `from` / `to` | ISO date range on `createdAt` |
| `status` | Admin-only content status |

Combined filters use AND logic (`FR-SRCH-008`).

### Sorting

| Param | Values | Default |
|-------|--------|---------|
| `sort` | `newest`, `oldest`, `most_reacted`, `most_commented` | `newest` |

Maps to indexed fields: `createdAt`, `lastActivityAt`, `reactionSummary` totals.

### Searching

| Endpoint | Param | Description |
|----------|-------|-------------|
| `GET /moods/search` | `q` | Full-text search on mood content (`FR-SRCH-001`) |
| | `facultyId`, `majorId`, `tagSlug`, `from`, `to` | Combined filters |

Minimum `q` length: 2 characters.

---

## Standard Response Format

### Success

```json
{
  "success": true,
  "data": { },
  "meta": { }
}
```

- `data` — Resource object or array (required)
- `meta` — Pagination, counts, threshold notices (optional)

### Failure (Generic)

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested mood does not exist or was removed.",
    "requestId": "req_abc123xyz"
  }
}
```

### Validation Error

HTTP `422`. Code: `VALIDATION_FAILED`. `details` array with `field` and `message`.

### Authentication Error

HTTP `401`. Codes: `AUTH_REQUIRED`, `AUTH_INVALID_TOKEN`, `AUTH_EXPIRED_TOKEN`, `AUTH_INVALID_CREDENTIALS`.

### Authorization Error

HTTP `403`. Codes: `FORBIDDEN`, `INSUFFICIENT_ROLE`, `NOT_OWNER`.

### Server Error

HTTP `500`. Code: `INTERNAL_ERROR`. Generic message only.

### Threshold Notice (Statistics)

HTTP `200` with suppressed data:

```json
{
  "success": true,
  "data": {
    "scope": { "type": "major", "id": "...", "name": "Computer Science" },
    "meetsThreshold": false,
    "message": "Not enough data to protect anonymity. Check back later.",
    "distribution": []
  }
}
```

---

## API Security

### JWT

| Property | Value |
|----------|-------|
| **Header** | `Authorization: Bearer <accessToken>` |
| **Access token TTL** | 15 minutes (configurable) |
| **Refresh token** | HttpOnly cookie or body per `docs/authentication.md` (`OD-003`) |
| **Claims** | `sub` (userId), `role`, `iat`, `exp` |
| **Validation** | Every protected route before business logic (`BR-AUTH-003`) |

### Rate Limiting

| Endpoint group | Limit |
|----------------|-------|
| `POST /auth/login`, `POST /auth/register` | 10 requests / 15 min / IP |
| `POST /moods`, `POST /comments` | 30 requests / hour / user |
| `GET` feed endpoints | 120 requests / min / user |
| General API | 300 requests / min / IP |

Response headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`. HTTP `429` when exceeded.

### Input Validation

- Zod and/or Express Validator at API boundary (`NFR-SEC-002`)
- Reject unknown body fields on strict schemas
- Max body size: 1 MB (JSON); image bytes upload directly to R2

### Sanitization

- Text fields stored as provided; HTML stripped on write or escaped on read
- Frontend additionally sanitizes render (`NFR-SEC-003`)

### Authorization

| Role | Capabilities |
|------|--------------|
| `guest` | Public read endpoints only (see per-endpoint) |
| `student` | Create content, engage, bookmarks, reports |
| `advisor` | Statistics read (TBD scope `OD-011`) |
| `administrator` | Admin namespace, moderation, identity on audit |

### CORS

- Production: allowlist Vercel frontend origin only (`NFR-SEC-005`)
- Methods: `GET, POST, PATCH, DELETE, OPTIONS`
- Headers: `Authorization, Content-Type`
- Credentials: enabled if refresh token uses cookies

---

## Authentication APIs

### Register

| | |
|---|---|
| **Purpose** | Create a new student account (`FR-AUTH-001`) |
| **Method** | `POST` |
| **Endpoint** | `/api/v1/auth/register` |
| **Authentication** | No |
| **Authorization** | Public |

**Request Body:**

```json
{
  "email": "student@university.edu",
  "password": "SecurePass123!",
  "facultyId": "665a1b2c3d4e5f6789012345",
  "majorId": "665a1b2c3d4e5f6789012346"
}
```

**Validation Rules:**

- `email`: valid email, max 254, lowercase; domain restriction per `OD-014` when enabled
- `password`: min 8 chars, at least one letter and one number
- `facultyId`: optional; valid active faculty if provided
- `majorId`: optional; must belong to `facultyId` if both provided

**Success Response:** `201`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "665a1b2c3d4e5f6789012347",
      "email": "student@university.edu",
      "role": "student",
      "facultyId": "665a1b2c3d4e5f6789012345",
      "majorId": "665a1b2c3d4e5f6789012346"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 900,
      "refreshToken": "rt_..."
    }
  }
}
```

**Error Responses:** `400`, `422` (`EMAIL_ALREADY_EXISTS`, `VALIDATION_FAILED`), `429`

**Business Rules:** Password hashed with bcrypt before persist (`FR-AUTH-003`). Default role `student`.

**Related Collections:** `users`, `faculties`, `majors`

---

### Login

| | |
|---|---|
| **Purpose** | Authenticate and receive JWT (`FR-AUTH-002`) |
| **Method** | `POST` |
| **Endpoint** | `/api/v1/auth/login` |
| **Authentication** | No |
| **Authorization** | Public |

**Request Body:**

```json
{
  "email": "student@university.edu",
  "password": "SecurePass123!"
}
```

**Validation Rules:** `email` and `password` required.

**Success Response:** `200` — Same token shape as register.

**Error Responses:** `401` (`AUTH_INVALID_CREDENTIALS` — generic message, no email enumeration), `403` (`ACCOUNT_SUSPENDED`), `429`

**Business Rules:** Suspended users cannot login. Rate limited (`FR-AUTH-009`).

**Related Collections:** `users`

---

### Logout

| | |
|---|---|
| **Purpose** | End session; invalidate refresh token (`FR-AUTH-008`) |
| **Method** | `POST` |
| **Endpoint** | `/api/v1/auth/logout` |
| **Authentication** | Yes |
| **Authorization** | Any authenticated user |

**Request Body:** `{}` (empty) or `{ "refreshToken": "rt_..." }` if not cookie-based.

**Success Response:** `200`

```json
{
  "success": true,
  "data": { "message": "Logged out successfully." }
}
```

**Error Responses:** `401`

**Business Rules:** Client must clear access token storage. Refresh token invalidated server-side when refresh strategy uses token store.

**Related Collections:** `users`

---

### Refresh Token

| | |
|---|---|
| **Purpose** | Obtain new access token without re-login (`FR-AUTH-004`, `OD-003`) |
| **Method** | `POST` |
| **Endpoint** | `/api/v1/auth/refresh` |
| **Authentication** | Refresh token (cookie or body) |
| **Authorization** | Valid refresh token holder |

**Request Body:**

```json
{
  "refreshToken": "rt_..."
}
```

**Validation Rules:** Valid, non-revoked refresh token.

**Success Response:** `200`

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

**Error Responses:** `401` (`AUTH_INVALID_TOKEN`, `AUTH_EXPIRED_TOKEN`)

**Business Rules:** Rotate refresh token if rotation policy enabled in `docs/authentication.md`.

**Related Collections:** `users`

---

### Get Current User

| | |
|---|---|
| **Purpose** | Return authenticated user's profile |
| **Method** | `GET` |
| **Endpoint** | `/api/v1/auth/me` |
| **Authentication** | Yes |
| **Authorization** | Any authenticated user |

**Request Parameters:** None

**Success Response:** `200`

```json
{
  "success": true,
  "data": {
    "id": "665a1b2c3d4e5f6789012347",
    "email": "student@university.edu",
    "role": "student",
    "facultyId": "665a1b2c3d4e5f6789012345",
    "majorId": "665a1b2c3d4e5f6789012346",
    "faculty": { "id": "...", "name": "Faculty of Engineering", "slug": "engineering" },
    "major": { "id": "...", "name": "Computer Science", "slug": "computer-science" },
    "createdAt": "2026-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:** `401`

**Business Rules:** Returns only the caller's own profile. Never other users' data.

**Related Collections:** `users`, `faculties`, `majors`

---

### Update Profile

| | |
|---|---|
| **Purpose** | Update affiliation and preferences |
| **Method** | `PATCH` |
| **Endpoint** | `/api/v1/auth/me` |
| **Authentication** | Yes |
| **Authorization** | Self only |

**Request Body:**

```json
{
  "facultyId": "665a1b2c3d4e5f6789012345",
  "majorId": "665a1b2c3d4e5f6789012346",
  "notificationPreferences": {
    "inApp": true,
    "email": false
  }
}
```

**Validation Rules:** All fields optional; `majorId` must match `facultyId` when both set.

**Success Response:** `200` — Updated user object (same shape as Get Current User).

**Error Responses:** `401`, `403`, `422`

**Business Rules:** Cannot change `role` or `email` via this endpoint.

**Related Collections:** `users`

---

### Change Password

| | |
|---|---|
| **Purpose** | Update password for authenticated user |
| **Method** | `POST` |
| **Endpoint** | `/api/v1/auth/change-password` |
| **Authentication** | Yes |
| **Authorization** | Self only |

**Request Body:**

```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecure456!"
}
```

**Validation Rules:** `newPassword` same rules as registration password.

**Success Response:** `200` — `{ "message": "Password updated successfully." }`

**Error Responses:** `401`, `422` (`INVALID_CURRENT_PASSWORD`)

**Business Rules:** bcrypt re-hash; optionally invalidate all refresh tokens.

**Related Collections:** `users`

---

### Delete Account

| | |
|---|---|
| **Purpose** | Soft-delete user account (future GDPR) |
| **Method** | `DELETE` |
| **Endpoint** | `/api/v1/auth/me` |
| **Authentication** | Yes |
| **Authorization** | Self only |

**Request Body:**

```json
{
  "password": "SecurePass123!",
  "confirm": true
}
```

**Validation Rules:** `confirm` must be `true`; password required for verification.

**Success Response:** `200` — `{ "message": "Account scheduled for deletion." }`

**Error Responses:** `401`, `422`

**Business Rules:** Sets `users.deletedAt`; content retention per `BR-CNT-004`. Existing moods may remain anonymized.

**Related Collections:** `users`

---

## Faculty APIs

### List Faculties

| | |
|---|---|
| **Purpose** | Return active faculties for pickers and navigation |
| **Method** | `GET` |
| **Endpoint** | `/api/v1/faculties` |
| **Authentication** | Optional (`OD-002` — public read permitted) |
| **Authorization** | Public |

**Request Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `includeInactive` | boolean | Admin only; default `false` |

**Success Response:** `200`

```json
{
  "success": true,
  "data": [
    {
      "id": "665a1b2c3d4e5f6789012345",
      "name": "Faculty of Engineering",
      "slug": "engineering",
      "code": "ENG",
      "majorCount": 12
    }
  ]
}
```

**Error Responses:** `401` (if `includeInactive` without admin)

**Business Rules:** Only `isActive: true` unless admin flag.

**Related Collections:** `faculties`, `majors`

---

### Faculty Details

| | |
|---|---|
| **Purpose** | Faculty page header and context (`DESIGN.md` Faculty Page) |
| **Method** | `GET` |
| **Endpoint** | `/api/v1/faculties/:facultyId` |
| **Authentication** | Optional |
| **Authorization** | Public |

**Request Parameters:** `facultyId` — ObjectId or `slug`

**Success Response:** `200`

```json
{
  "success": true,
  "data": {
    "id": "665a1b2c3d4e5f6789012345",
    "name": "Faculty of Engineering",
    "slug": "engineering",
    "description": "Engineering programs and community.",
    "majors": [
      { "id": "...", "name": "Computer Science", "slug": "computer-science" }
    ],
    "moodSummary": {
      "activeMoodCount": 1240,
      "topEmotions": [
        { "tagSlug": "stress", "name": "Stress", "rank": 1 }
      ]
    }
  }
}
```

**Error Responses:** `404`

**Business Rules:** `moodSummary` respects aggregation threshold; may return partial summary.

**Related Collections:** `faculties`, `majors`, `emotionstatistics`

---

### Faculty Statistics

| | |
|---|---|
| **Purpose** | Faculty-scoped statistics (`FR-STAT-004`) |
| **Method** | `GET` |
| **Endpoint** | `/api/v1/faculties/:facultyId/statistics` |
| **Authentication** | Yes |
| **Authorization** | `student` (TBD `OD-009`), `advisor`, `administrator` |

**Request Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `period` | string | `7d`, `30d`, `90d`, `all` — default `30d` |
| `from` / `to` | ISO date | Custom range (overrides period) |

**Success Response:** `200` — See [Statistics Response Shape](#statistics-response-shape).

**Error Responses:** `401`, `403`, `404`

**Business Rules:** `meetsThreshold` enforced (`BR-STAT-001`). Reads `emotionstatistics`, `dailystatistics`.

**Related Collections:** `faculties`, `emotionstatistics`, `dailystatistics`, `tags`

---

## Major APIs

### List Majors

| | |
|---|---|
| **Purpose** | List majors, optionally filtered by faculty |
| **Method** | `GET` |
| **Endpoint** | `/api/v1/majors` |
| **Authentication** | Optional |
| **Authorization** | Public |

**Request Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `facultyId` | string | Filter by faculty ObjectId or slug |

**Success Response:** `200`

```json
{
  "success": true,
  "data": [
    {
      "id": "665a1b2c3d4e5f6789012346",
      "facultyId": "665a1b2c3d4e5f6789012345",
      "name": "Computer Science",
      "slug": "computer-science"
    }
  ]
}
```

**Related Collections:** `majors`, `faculties`

---

### Major Details

| | |
|---|---|
| **Purpose** | Major page header (`DESIGN.md` Major Page) |
| **Method** | `GET` |
| **Endpoint** | `/api/v1/majors/:majorId` |
| **Authentication** | Optional |
| **Authorization** | Public |

**Request Parameters:** `majorId` — ObjectId or `slug` (with optional `?facultySlug=` disambiguation)

**Success Response:** `200`

```json
{
  "success": true,
  "data": {
    "id": "665a1b2c3d4e5f6789012346",
    "name": "Computer Science",
    "slug": "computer-science",
    "faculty": { "id": "...", "name": "Faculty of Engineering", "slug": "engineering" },
    "moodSummary": {
      "activeMoodCount": 320,
      "meetsThreshold": true
    }
  }
}
```

**Error Responses:** `404`

**Related Collections:** `majors`, `faculties`, `moods`

---

### Major Statistics

| | |
|---|---|
| **Purpose** | Major-scoped statistics |
| **Method** | `GET` |
| **Endpoint** | `/api/v1/majors/:majorId/statistics` |
| **Authentication** | Yes |
| **Authorization** | `student` (TBD `OD-009`), `advisor`, `administrator` |

**Request Parameters:** Same as Faculty Statistics.

**Success Response:** `200` — Statistics response shape with `scope.type: "major"`.

**Business Rules:** Stricter threshold risk for small majors — always enforce `meetsThreshold`.

**Related Collections:** `majors`, `emotionstatistics`, `dailystatistics`

---

## Mood APIs

### Public Mood Object (Anonymous DTO)

All public mood responses use this shape — **no author identity**:

```json
{
  "id": "665a1b2c3d4e5f6789012348",
  "content": "Feeling overwhelmed with finals week...",
  "faculty": { "id": "...", "name": "Faculty of Engineering", "slug": "engineering" },
  "major": { "id": "...", "name": "Computer Science", "slug": "computer-science" },
  "tags": [
    { "id": "...", "slug": "stress", "name": "Stress", "isPrimary": true }
  ],
  "commentCount": 5,
  "reactionSummary": { "empathy": 12, "support": 8 },
  "imageCount": 1,
  "images": [
    { "id": "...", "sortOrder": 0 }
  ],
  "isBookmarked": false,
  "createdAt": "2026-07-05T08:00:00.000Z",
  "lastActivityAt": "2026-07-05T10:30:00.000Z"
}
```

`isBookmarked` present only when authenticated.

---

### Create Mood

| | |
|---|---|
| **Purpose** | Publish anonymous mood post (`FR-POST-001`) |
| **Method** | `POST` |
| **Endpoint** | `/api/v1/moods` |
| **Authentication** | Yes |
| **Authorization** | `student` |

**Request Body:**

```json
{
  "content": "Today was a good day despite the exam stress.",
  "facultyId": "665a1b2c3d4e5f6789012345",
  "majorId": "665a1b2c3d4e5f6789012346",
  "tagIds": ["665a1b2c3d4e5f6789012349"],
  "primaryTagId": "665a1b2c3d4e5f6789012349",
  "imageIds": ["665a1b2c3d4e5f6789012350"]
}
```

**Validation Rules:**

- `content`: required, 1–5000 chars (`BR-CNT-001`)
- `tagIds`: at least one active emotion tag (`BR-CNT-002`, `FR-POST-003`)
- `primaryTagId`: must be in `tagIds`
- `facultyId` / `majorId`: per `OD-013`; defaults from user profile if omitted
- `imageIds`: optional; each must be `confirmed` `moodimages` owned by caller, unlinked

**Success Response:** `201` — Anonymous mood DTO.

**Error Responses:** `401`, `422`, `429`

**Business Rules:** `authorId` stored internally; stripped from response (`BR-ANON-001`). Creates `moodtags` rows. Rate limited (`FR-POST-010`).

**Related Collections:** `moods`, `moodtags`, `tags`, `moodimages`, `users`

---

### Update Mood

| | |
|---|---|
| **Purpose** | Edit own mood within policy window (`FR-POST-007`) |
| **Method** | `PATCH` |
| **Endpoint** | `/api/v1/moods/:moodId` |
| **Authentication** | Yes |
| **Authorization** | Owner (`student`) or `administrator` |

**Request Body:**

```json
{
  "content": "Updated thoughts after talking to friends.",
  "tagIds": ["665a1b2c3d4e5f6789012349", "665a1b2c3d4e5f6789012351"],
  "primaryTagId": "665a1b2c3d4e5f6789012349"
}
```

**Validation Rules:** Same as create for provided fields. Edit window: 24 hours from `createdAt` (`OD-012` default).

**Success Response:** `200` — Anonymous mood DTO with `editedAt`.

**Error Responses:** `401`, `403` (`NOT_OWNER`, `EDIT_WINDOW_EXPIRED`), `404`, `422`

**Related Collections:** `moods`, `moodtags`

---

### Delete Mood

| | |
|---|---|
| **Purpose** | Soft-delete own mood (`FR-POST-008`) |
| **Method** | `DELETE` |
| **Endpoint** | `/api/v1/moods/:moodId` |
| **Authentication** | Yes |
| **Authorization** | Owner or `administrator` |

**Success Response:** `200` — `{ "message": "Mood deleted successfully." }`

**Error Responses:** `401`, `403`, `404`

**Business Rules:** Sets `status: deleted_by_author` or `moderated_removed`; `deletedAt` set. Cascades image delete job. Comments soft-deleted or retained per policy.

**Related Collections:** `moods`, `moodimages`, `comments`, `auditlogs` (if admin)

---

### Get Mood

| | |
|---|---|
| **Purpose** | Mood detail page (`DESIGN.md` Mood Detail) |
| **Method** | `GET` |
| **Endpoint** | `/api/v1/moods/:moodId` |
| **Authentication** | Optional (required for bookmarked removed mood access) |
| **Authorization** | Public for active moods; owner bookmark exception (`FR-BMK-004`) |

**Success Response:** `200` — Full anonymous mood DTO.

**Error Responses:** `404`

**Business Rules:** Never returns `authorId` in public response. Admin uses `/api/v1/admin/moods/:moodId`.

**Related Collections:** `moods`, `moodtags`, `tags`, `moodimages`, `bookmarks`

---

### Feed (Mood Feed)

| | |
|---|---|
| **Purpose** | Global mood feed (`FR-FEED-001`) |
| **Method** | `GET` |
| **Endpoint** | `/api/v1/moods/feed` |
| **Authentication** | Optional (`OD-002` — authenticated recommended for personalization) |
| **Authorization** | Public read (limited preview for guests) |

**Request Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `limit`, `cursor` | | Pagination |
| `sort` | string | `newest` (default), `most_reacted`, `most_commented` |
| `tagSlug` | string | Filter by emotion |
| `from`, `to` | ISO date | Date range |

**Success Response:** `200`

```json
{
  "success": true,
  "data": [ { "id": "...", "content": "...", "tags": [], "commentCount": 0, "reactionSummary": {} } ],
  "meta": { "limit": 20, "nextCursor": "...", "hasMore": true }
}
```

**Business Rules:** No author identity (`FR-FEED-004`). Personalization by user faculty/major when authenticated (`FR-FEED-007`). Guests may receive truncated `limit` (e.g., max 10).

**Related Collections:** `moods`, `moodtags`, `tags`

---

### Faculty Feed

| | |
|---|---|
| **Purpose** | Faculty-scoped feed (`FR-FEED-002`) |
| **Method** | `GET` |
| **Endpoint** | `/api/v1/faculties/:facultyId/moods` |
| **Authentication** | Optional |
| **Authorization** | Public |

**Request Parameters:** Pagination, `sort`, `tagSlug`, `majorId`, `from`, `to`

**Success Response:** `200` — Paginated anonymous mood array.

**Related Collections:** `moods`, `faculties`

---

### Major Feed

| | |
|---|---|
| **Purpose** | Major-scoped feed (`FR-FEED-003`) |
| **Method** | `GET` |
| **Endpoint** | `/api/v1/majors/:majorId/moods` |
| **Authentication** | Optional |
| **Authorization** | Public |

**Request Parameters:** Pagination, `sort`, `tagSlug`, `from`, `to`

**Success Response:** `200` — Paginated anonymous mood array.

**Related Collections:** `moods`, `majors`

---

### Trending

| | |
|---|---|
| **Purpose** | Trending emotions (`FR-TREND-001`) |
| **Method** | `GET` |
| **Endpoint** | `/api/v1/moods/trending` |
| **Authentication** | Optional |
| **Authorization** | Public |

**Request Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `scope` | string | `platform`, `faculty`, `major` — default `platform` |
| `scopeId` | string | Required when scope is faculty or major |
| `window` | string | `7d` (default), `30d` |

**Success Response:** `200`

```json
{
  "success": true,
  "data": {
    "scope": { "type": "platform" },
    "window": "7d",
    "trending": [
      {
        "tag": { "slug": "stress", "name": "Stress" },
        "moodCount": 145,
        "delta": 23,
        "direction": "rising",
        "meetsThreshold": true
      }
    ],
    "calculatedAt": "2026-07-05T12:00:00.000Z"
  }
}
```

**Business Rules:** Aggregated only; no individual posts (`FR-TREND-003`). Threshold enforced.

**Related Collections:** `dailystatistics`, `emotionstatistics`, `tags`

---

### Recent

| | |
|---|---|
| **Purpose** | Most recent moods (alias for feed with fixed sort) |
| **Method** | `GET` |
| **Endpoint** | `/api/v1/moods/recent` |
| **Authentication** | Optional |
| **Authorization** | Public |

**Request Parameters:** `limit` (default 10, max 20), `facultyId`, `majorId`

**Success Response:** `200` — Mood array without cursor (fixed small set).

**Related Collections:** `moods`

---

### Search

| | |
|---|---|
| **Purpose** | Full-text and metadata search (`FR-SRCH-001`) |
| **Method** | `GET` |
| **Endpoint** | `/api/v1/moods/search` |
| **Authentication** | Yes |
| **Authorization** | `student`, `advisor`, `administrator` |

**Request Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Search query, min 2 chars |
| `facultyId`, `majorId`, `tagSlug` | | Filters |
| `from`, `to` | ISO date | Date range |
| `limit`, `cursor` | | Pagination |

**Success Response:** `200` — Paginated anonymous moods.

**Business Rules:** No author in results (`BR-ANON-003`, `FR-SRCH-007`).

**Related Collections:** `moods` (text index)

---

### Filter

Filtering is **not a separate endpoint** — implemented via query parameters on:

- `GET /moods/feed`
- `GET /faculties/:facultyId/moods`
- `GET /majors/:majorId/moods`
- `GET /moods/search`

See [Filtering](#filtering) and `FR-SRCH-002` through `FR-SRCH-008`.

---

### Pagination

See [Pagination](#pagination). Applies to all list endpoints above.

---

## Image APIs

### Generate Presigned Upload URL

| | |
|---|---|
| **Purpose** | Start direct R2 upload flow (`FR-IMG-002`) |
| **Method** | `POST` |
| **Endpoint** | `/api/v1/images/upload-url` |
| **Authentication** | Yes |
| **Authorization** | `student` |

**Request Body:**

```json
{
  "fileName": "photo.jpg",
  "mimeType": "image/jpeg",
  "fileSizeBytes": 204800
}
```

**Validation Rules:**

- `mimeType`: allowlist `image/jpeg`, `image/png`, `image/webp` (`BR-IMG-001`)
- `fileSizeBytes`: ≤ 5 MB default (`OD-006` — exact in `cloudflare-r2.md`)

**Success Response:** `201`

```json
{
  "success": true,
  "data": {
    "imageId": "665a1b2c3d4e5f6789012350",
    "uploadUrl": "https://...r2.cloudflarestorage.com/...",
    "uploadMethod": "PUT",
    "uploadHeaders": {
      "Content-Type": "image/jpeg"
    },
    "expiresAt": "2026-07-05T09:15:00.000Z",
    "objectKey": "production/uploads/.../uuid.jpg"
  }
}
```

**Error Responses:** `401`, `422` (`INVALID_MIME_TYPE`, `FILE_TOO_LARGE`), `429`

**Business Rules:** Creates `moodimages` with `status: pending`. Never returns R2 secret keys. Target p95 200ms (`NFR-PERF-002`).

**Related Collections:** `moodimages`, `users`

---

### Confirm Image Upload

| | |
|---|---|
| **Purpose** | Verify R2 object and mark image confirmed (`FR-IMG-008`) |
| **Method** | `POST` |
| **Endpoint** | `/api/v1/images/:imageId/confirm` |
| **Authentication** | Yes |
| **Authorization** | Uploader |

**Request Body:** `{}`

**Success Response:** `200`

```json
{
  "success": true,
  "data": {
    "id": "665a1b2c3d4e5f6789012350",
    "status": "confirmed",
    "confirmedAt": "2026-07-05T09:10:00.000Z"
  }
}
```

**Error Responses:** `404`, `422` (`UPLOAD_NOT_FOUND_IN_R2`)

**Related Collections:** `moodimages`

---

### Delete Image

| | |
|---|---|
| **Purpose** | Remove image before or after mood publish |
| **Method** | `DELETE` |
| **Endpoint** | `/api/v1/images/:imageId` |
| **Authentication** | Yes |
| **Authorization** | Uploader or `administrator` |

**Success Response:** `200` — `{ "message": "Image deleted." }`

**Business Rules:** Soft delete; schedules R2 removal (`FR-IMG-009`).

**Related Collections:** `moodimages`

---

### Get Signed Download URL

| | |
|---|---|
| **Purpose** | Authorized image viewing (`FR-IMG-005`, `INT-R2-003`) |
| **Method** | `GET` |
| **Endpoint** | `/api/v1/images/:imageId/url` |
| **Authentication** | Yes (or optional for public mood images — policy: authenticated) |
| **Authorization** | User can view parent mood or own upload |

**Success Response:** `200`

```json
{
  "success": true,
  "data": {
    "url": "https://...r2.cloudflarestorage.com/...?X-Amz-Signature=...",
    "expiresAt": "2026-07-05T10:00:00.000Z"
  }
}
```

**Error Responses:** `401`, `403`, `404`

**Business Rules:** Time-limited URL; never store in DB (`BR-IMG-003`).

**Related Collections:** `moodimages`, `moods`

---

### Image Validation

Validation occurs within **Generate Presigned Upload URL** (pre-upload) and **Confirm** (post-upload). No separate public endpoint.

| Check | Stage |
|-------|-------|
| MIME allowlist | Presign request |
| File size | Presign request |
| Object exists in R2 | Confirm |
| Ownership | All image endpoints |

---

## Comment APIs

### List Comments

| | |
|---|---|
| **Purpose** | Comments on mood detail |
| **Method** | `GET` |
| **Endpoint** | `/api/v1/moods/:moodId/comments` |
| **Authentication** | Optional |
| **Authorization** | Public for active moods |

**Request Parameters:** `limit`, `cursor`, `sort` (`oldest`, `newest`)

**Success Response:** `200`

```json
{
  "success": true,
  "data": [
    {
      "id": "665a1b2c3d4e5f6789012352",
      "content": "You're not alone in this.",
      "parentId": null,
      "depth": 0,
      "reactionSummary": { "support": 3 },
      "createdAt": "2026-07-05T09:00:00.000Z"
    }
  ],
  "meta": { "limit": 20, "nextCursor": null, "hasMore": false }
}
```

**Business Rules:** No `authorId` (`BR-ANON-002`).

**Related Collections:** `comments`, `moods`

---

### Create Comment

| | |
|---|---|
| **Purpose** | Add anonymous comment (`FR-CMT-001`) |
| **Method** | `POST` |
| **Endpoint** | `/api/v1/moods/:moodId/comments` |
| **Authentication** | Yes |
| **Authorization** | `student` |

**Request Body:**

```json
{
  "content": "Sending support your way.",
  "parentId": null
}
```

**Validation Rules:**

- `content`: 1–2000 chars
- `parentId`: optional; valid comment on same mood for threading (`FR-CMT-004`, `OD-004` supports threaded)

**Success Response:** `201` — Anonymous comment object.

**Error Responses:** `401`, `404`, `422`, `429`

**Business Rules:** Increments `moods.commentCount`. Rate limited (`FR-CMT-007`).

**Related Collections:** `comments`, `moods`

---

### Get Comment

| | |
|---|---|
| **Purpose** | Single comment by ID |
| **Method** | `GET` |
| **Endpoint** | `/api/v1/comments/:commentId` |
| **Authentication** | Optional |
| **Authorization** | Public |

**Success Response:** `200` — Anonymous comment DTO.

**Related Collections:** `comments`

---

### Update Comment

| | |
|---|---|
| **Purpose** | Edit own comment (if enabled) |
| **Method** | `PATCH` |
| **Endpoint** | `/api/v1/comments/:commentId` |
| **Authentication** | Yes |
| **Authorization** | Owner |

**Request Body:** `{ "content": "Updated comment text." }`

**Success Response:** `200` — Updated comment DTO.

**Error Responses:** `403`, `422`

**Related Collections:** `comments`

---

### Delete Comment

| | |
|---|---|
| **Purpose** | Soft-delete own comment (`FR-CMT-005`) |
| **Method** | `DELETE` |
| **Endpoint** | `/api/v1/comments/:commentId` |
| **Authentication** | Yes |
| **Authorization** | Owner or `administrator` |

**Success Response:** `200`

**Business Rules:** Decrements `moods.commentCount`. Admin deletion audit-logged (`FR-CMT-006`).

**Related Collections:** `comments`, `moods`, `auditlogs`

---

### Replies

Threaded replies use **Create Comment** with `parentId` set. List endpoint returns flat list with `parentId` and `depth` for client nesting (`DESIGN.md` Comment Card).

**Max depth:** 3 levels (application constant).

---

### Pagination

Cursor pagination on `GET /moods/:moodId/comments` per global strategy.

---

## Reaction APIs

### Add or Update Reaction

| | |
|---|---|
| **Purpose** | Set reaction on mood or comment (`FR-REACT-001`, `FR-REACT-003`) |
| **Method** | `PUT` |
| **Endpoint** | `/api/v1/reactions` |
| **Authentication** | Yes |
| **Authorization** | `student` |

**Request Body:**

```json
{
  "targetType": "mood",
  "targetId": "665a1b2c3d4e5f6789012348",
  "reactionType": "empathy"
}
```

**Validation Rules:**

- `targetType`: `mood` | `comment`
- `reactionType`: active allowlist — `empathy`, `support`, `relate`, `solidarity` (`OD-007` default set)
- `targetId`: valid active target

**Success Response:** `200`

```json
{
  "success": true,
  "data": {
    "targetType": "mood",
    "targetId": "665a1b2c3d4e5f6789012348",
    "reactionType": "empathy",
    "reactionSummary": { "empathy": 13, "support": 8 }
  }
}
```

**Business Rules:** Upsert — one reaction per user per target. Updates `reactionSummary` on target. Never exposes who reacted (`FR-REACT-004`).

**Related Collections:** `reactions`, `moods`, `comments`

---

### Remove Reaction

| | |
|---|---|
| **Purpose** | Remove user's reaction |
| **Method** | `DELETE` |
| **Endpoint** | `/api/v1/reactions` |
| **Authentication** | Yes |
| **Authorization** | `student` |

**Request Body:**

```json
{
  "targetType": "mood",
  "targetId": "665a1b2c3d4e5f6789012348"
}
```

**Success Response:** `200` — Updated `reactionSummary` counts.

**Related Collections:** `reactions`, `moods`, `comments`

---

### Get Reactions

| | |
|---|---|
| **Purpose** | Reaction counts for a target (public) |
| **Method** | `GET` |
| **Endpoint** | `/api/v1/reactions` |
| **Authentication** | Optional |
| **Authorization** | Public |

**Request Parameters:** `targetType`, `targetId`

**Success Response:** `200`

```json
{
  "success": true,
  "data": {
    "targetType": "mood",
    "targetId": "665a1b2c3d4e5f6789012348",
    "reactionSummary": { "empathy": 12, "support": 8 },
    "userReaction": "empathy"
  }
}
```

`userReaction` included only when authenticated — reveals caller's own reaction only, not others.

**Related Collections:** `reactions`

---

## Bookmark APIs

### Bookmark Mood

| | |
|---|---|
| **Purpose** | Save mood privately (`FR-BMK-001`) |
| **Method** | `POST` |
| **Endpoint** | `/api/v1/bookmarks` |
| **Authentication** | Yes |
| **Authorization** | `student` |

**Request Body:**

```json
{
  "moodId": "665a1b2c3d4e5f6789012348"
}
```

**Success Response:** `201`

```json
{
  "success": true,
  "data": {
    "id": "665a1b2c3d4e5f6789012353",
    "moodId": "665a1b2c3d4e5f6789012348",
    "createdAt": "2026-07-05T10:00:00.000Z"
  }
}
```

**Error Responses:** `409` (`BOOKMARK_ALREADY_EXISTS`)

**Related Collections:** `bookmarks`, `moods`

---

### Remove Bookmark

| | |
|---|---|
| **Purpose** | Unbookmark (`FR-BMK-003`) |
| **Method** | `DELETE` |
| **Endpoint** | `/api/v1/bookmarks/:moodId` |
| **Authentication** | Yes |
| **Authorization** | Owner |

**Success Response:** `200`

**Related Collections:** `bookmarks`

---

### List Bookmarks

| | |
|---|---|
| **Purpose** | User's saved moods (`FR-BMK-002`) |
| **Method** | `GET` |
| **Endpoint** | `/api/v1/bookmarks` |
| **Authentication** | Yes |
| **Authorization** | Self only |

**Request Parameters:** `limit`, `cursor`

**Success Response:** `200` — Paginated anonymous mood DTOs (joined from `moods`).

**Business Rules:** Includes moods removed from public feed if user bookmarked (`FR-BMK-004`).

**Related Collections:** `bookmarks`, `moods`

---

## Notification APIs

### Get Notifications

| | |
|---|---|
| **Purpose** | In-app notification inbox (`FR-NOTIF-001`) |
| **Method** | `GET` |
| **Endpoint** | `/api/v1/notifications` |
| **Authentication** | Yes |
| **Authorization** | Self |

**Request Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `isRead` | boolean | Filter read/unread |
| `limit`, `cursor` | | Pagination |

**Success Response:** `200`

```json
{
  "success": true,
  "data": [
    {
      "id": "665a1b2c3d4e5f6789012354",
      "type": "mood_activity",
      "title": "Activity on a mood you engaged with",
      "body": "Someone commented on a post you reacted to.",
      "relatedEntityType": "mood",
      "relatedEntityId": "665a1b2c3d4e5f6789012348",
      "isRead": false,
      "createdAt": "2026-07-05T11:00:00.000Z"
    }
  ],
  "meta": { "unreadCount": 3, "limit": 20, "nextCursor": null, "hasMore": false }
}
```

**Business Rules:** No identity in body (`FR-NOTIF-003`).

**Related Collections:** `notifications`

---

### Read Notification

| | |
|---|---|
| **Purpose** | Mark single notification read |
| **Method** | `PATCH` |
| **Endpoint** | `/api/v1/notifications/:notificationId/read` |
| **Authentication** | Yes |
| **Authorization** | Recipient |

**Success Response:** `200` — Updated notification with `isRead: true`, `readAt`.

**Related Collections:** `notifications`

---

### Read All

| | |
|---|---|
| **Purpose** | Mark all notifications read |
| **Method** | `POST` |
| **Endpoint** | `/api/v1/notifications/read-all` |
| **Authentication** | Yes |
| **Authorization** | Self |

**Success Response:** `200` — `{ "markedCount": 12 }`

**Related Collections:** `notifications`

---

### Delete Notification

| | |
|---|---|
| **Purpose** | Remove notification from inbox |
| **Method** | `DELETE` |
| **Endpoint** | `/api/v1/notifications/:notificationId` |
| **Authentication** | Yes |
| **Authorization** | Recipient |

**Success Response:** `200`

**Related Collections:** `notifications`

---

## Report APIs

### Report Mood

| | |
|---|---|
| **Purpose** | Flag mood for moderation (`FR-RPT-001`) |
| **Method** | `POST` |
| **Endpoint** | `/api/v1/moods/:moodId/report` |
| **Authentication** | Yes |
| **Authorization** | `student`, `advisor`, `administrator` |

**Request Body:**

```json
{
  "reasonCode": "spam",
  "description": "Repeated promotional content."
}
```

**Validation Rules:**

- `reasonCode`: `harassment`, `spam`, `self_harm`, `hate_speech`, `other`
- `description`: optional, max 1000 chars

**Success Response:** `201`

```json
{
  "success": true,
  "data": {
    "id": "665a1b2c3d4e5f6789012355",
    "status": "pending",
    "message": "Thank you. Your report has been received."
  }
}
```

**Error Responses:** `409` (`REPORT_COOLDOWN` — `FR-RPT-005`)

**Business Rules:** Reporter hidden from content author (`FR-RPT-004`).

**Related Collections:** `reports`, `moods`

---

### Report Comment

| | |
|---|---|
| **Purpose** | Flag comment (`FR-RPT-001`) |
| **Method** | `POST` |
| **Endpoint** | `/api/v1/comments/:commentId/report` |
| **Authentication** | Yes |
| **Authorization** | Authenticated users |

**Request Body / Responses:** Same shape as Report Mood.

**Related Collections:** `reports`, `comments`

---

### List Reports (Admin)

| | |
|---|---|
| **Purpose** | Admin report queue (`FR-ADMIN-002`) |
| **Method** | `GET` |
| **Endpoint** | `/api/v1/admin/reports` |
| **Authentication** | Yes |
| **Authorization** | `administrator` |

**Request Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | `pending` (default), `resolved_removed`, `resolved_dismissed`, `resolved_warned` |
| `targetType` | string | `mood`, `comment` |
| `limit`, `cursor` | | Pagination |

**Success Response:** `200`

```json
{
  "success": true,
  "data": [
    {
      "id": "665a1b2c3d4e5f6789012355",
      "targetType": "mood",
      "targetId": "665a1b2c3d4e5f6789012348",
      "reasonCode": "spam",
      "description": "...",
      "status": "pending",
      "contentPreview": "Truncated mood text...",
      "createdAt": "2026-07-05T11:30:00.000Z"
    }
  ],
  "meta": { "pendingCount": 8, "limit": 20, "nextCursor": "...", "hasMore": true }
}
```

**Business Rules:** `reporterId` available in admin detail endpoint only, not in list by default.

**Related Collections:** `reports`, `moods`, `comments`

---

### Resolve Report

| | |
|---|---|
| **Purpose** | Admin resolution (`FR-RPT-006`) |
| **Method** | `POST` |
| **Endpoint** | `/api/v1/admin/reports/:reportId/resolve` |
| **Authentication** | Yes |
| **Authorization** | `administrator` |

**Request Body:**

```json
{
  "status": "resolved_removed",
  "resolutionNote": "Violates community guidelines section 3.2.",
  "removeContent": true
}
```

**Validation Rules:**

- `status`: `resolved_removed`, `resolved_dismissed`, `resolved_warned`

**Success Response:** `200` — Updated report object.

**Business Rules:** Writes `auditlogs`. May trigger mood/comment moderation.

**Related Collections:** `reports`, `auditlogs`, `moods`, `comments`

---

## Statistics APIs

### Statistics Response Shape

```json
{
  "success": true,
  "data": {
    "scope": { "type": "faculty", "id": "...", "name": "Faculty of Engineering" },
    "period": { "from": "2026-06-05T00:00:00.000Z", "to": "2026-07-05T00:00:00.000Z" },
    "meetsThreshold": true,
    "kpis": {
      "totalMoods": 1240,
      "totalComments": 3400,
      "totalReactions": 8900,
      "dominantEmotion": { "slug": "stress", "name": "Stress", "percentage": 34.2 }
    },
    "distribution": [
      { "tag": { "slug": "stress", "name": "Stress" }, "count": 424, "percentage": 34.2, "rank": 1 }
    ],
    "timeSeries": [
      { "date": "2026-07-01T00:00:00.000Z", "moodCount": 45, "commentCount": 120, "reactionCount": 310 }
    ],
    "calculatedAt": "2026-07-05T12:00:00.000Z"
  }
}
```

When `meetsThreshold: false`, `distribution` and counts are omitted or null per [Threshold Notice](#threshold-notice-statistics).

---

### Overall Statistics

| | |
|---|---|
| **Purpose** | Platform-wide dashboard (`FR-STAT-001`) |
| **Method** | `GET` |
| **Endpoint** | `/api/v1/statistics/overview` |
| **Authentication** | Yes |
| **Authorization** | `student` (TBD `OD-009`), `advisor`, `administrator` |

**Request Parameters:** `period`, `from`, `to`

**Success Response:** `200` — Statistics response with `scope.type: platform`.

**Related Collections:** `emotionstatistics`, `dailystatistics`

---

### Faculty Statistics

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/statistics/faculties/:facultyId` |

Same as `GET /faculties/:facultyId/statistics` — canonical path above; this alias for statistics namespace.

---

### Major Statistics

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/statistics/majors/:majorId` |

Alias for `GET /majors/:majorId/statistics`.

---

### Emotion Statistics

| | |
|---|---|
| **Purpose** | Emotion distribution breakdown (`FR-STAT-002`) |
| **Method** | `GET` |
| **Endpoint** | `/api/v1/statistics/emotions` |
| **Authentication** | Yes |
| **Authorization** | `student`, `advisor`, `administrator` |

**Request Parameters:** `scope`, `scopeId`, `period`

**Success Response:** `200` — `{ distribution: [...], meetsThreshold }`

**Related Collections:** `emotionstatistics`, `tags`

---

### Daily Statistics

| | |
|---|---|
| **Purpose** | Daily time-series (`FR-STAT-003`) |
| **Method** | `GET` |
| **Endpoint** | `/api/v1/statistics/daily` |
| **Authentication** | Yes |
| **Authorization** | `student`, `advisor`, `administrator` |

**Request Parameters:** `scope`, `scopeId`, `from`, `to`, `tagSlug` (optional)

**Success Response:** `200` — `{ timeSeries: [...], meetsThreshold }`

**Related Collections:** `dailystatistics`

---

### Weekly Statistics

| | |
|---|---|
| **Purpose** | 7-day rolled-up metrics |
| **Method** | `GET` |
| **Endpoint** | `/api/v1/statistics/weekly` |
| **Authentication** | Yes |
| **Authorization** | `student`, `advisor`, `administrator` |

**Request Parameters:** `scope`, `scopeId`, `tagSlug`

**Success Response:** `200` — Aggregated KPIs + distribution for rolling 7 days.

**Related Collections:** `dailystatistics`, `emotionstatistics`

---

### Monthly Statistics

| | |
|---|---|
| **Purpose** | 30-day / calendar month metrics |
| **Method** | `GET` |
| **Endpoint** | `/api/v1/statistics/monthly` |
| **Authentication** | Yes |
| **Authorization** | `student`, `advisor`, `administrator` |

**Request Parameters:** `scope`, `scopeId`, `month` (YYYY-MM optional)

**Success Response:** `200` — Monthly aggregates.

**Related Collections:** `dailystatistics`, `emotionstatistics`

---

### Dashboard

| | |
|---|---|
| **Purpose** | Combined dashboard payload for Statistics page (`DESIGN.md`) |
| **Method** | `GET` |
| **Endpoint** | `/api/v1/statistics/dashboard` |
| **Authentication** | Yes |
| **Authorization** | `student`, `advisor`, `administrator` |

**Request Parameters:** `scope`, `scopeId`, `period` (default `30d`)

**Success Response:** `200`

```json
{
  "success": true,
  "data": {
    "overview": { "kpis": {}, "meetsThreshold": true },
    "distribution": [],
    "timeSeries": [],
    "trending": [],
    "topFaculties": [],
    "mostUsedEmotions": []
  }
}
```

**Business Rules:** Single request for Statistics Dashboard; backend may parallel-read statistics collections. p95 target 2s (`NFR-PERF-004`).

**Related Collections:** `emotionstatistics`, `dailystatistics`, `faculties`, `tags`

---

### Top Active Faculties (included in Dashboard)

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/statistics/faculties/top` |
| **Authentication** | Yes |
| **Authorization** | `student`, `advisor`, `administrator` |

**Request Parameters:** `window` (`7d`, `30d`), `limit` (default 10)

**Success Response:** `200`

```json
{
  "success": true,
  "data": [
    {
      "faculty": { "id": "...", "name": "Faculty of Engineering", "slug": "engineering" },
      "activityScore": 4520,
      "moodCount": 890,
      "meetsThreshold": true
    }
  ]
}
```

**Related Collections:** `dailystatistics`, `faculties`

---

### Most Used Emotions (included in Dashboard)

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/statistics/emotions/top` |
| **Authentication** | Yes |
| **Authorization** | `student`, `advisor`, `administrator` |

**Request Parameters:** `scope`, `scopeId`, `period`

**Success Response:** `200` — Ordered emotion list with counts and percentages.

**Related Collections:** `emotionstatistics`, `tags`

---

## Admin APIs

All admin routes require `Authorization: Bearer` with `role: administrator` (`BR-AUTH-002`).

---

### Admin Dashboard

| | |
|---|---|
| **Purpose** | Admin overview KPIs (`FR-ADMIN-001`, `FR-ADMIN-006`) |
| **Method** | `GET` |
| **Endpoint** | `/api/v1/admin/dashboard` |
| **Authentication** | Yes |
| **Authorization** | `administrator` |

**Success Response:** `200`

```json
{
  "success": true,
  "data": {
    "openReports": 8,
    "actionsToday": 14,
    "activeUsers24h": 320,
    "moodsCreated24h": 145,
    "recentActions": []
  }
}
```

**Related Collections:** `reports`, `auditlogs`, `moods`, `users`

---

### Manage Users — List

| | |
|---|---|
| **Purpose** | User management table (`FR-ADMIN-004`) |
| **Method** | `GET` |
| **Endpoint** | `/api/v1/admin/users` |
| **Authentication** | Yes |
| **Authorization** | `administrator` |

**Request Parameters:** `status`, `role`, `q` (email search), `limit`, `cursor`

**Success Response:** `200` — Paginated user list with `id`, `email`, `role`, `status`, `faculty`, `major`, `createdAt`, `lastLoginAt`.

**Related Collections:** `users`

---

### Manage Users — Get Detail

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/admin/users/:userId` |

**Success Response:** `200` — Full user detail + activity summary.

**Business Rules:** Identity access audit-logged (`BR-ANON-004`).

**Related Collections:** `users`, `auditlogs`

---

### Manage Users — Suspend / Reinstate

| | |
|---|---|
| **Method** | `PATCH` |
| **Endpoint** | `/api/v1/admin/users/:userId/status` |

**Request Body:** `{ "status": "suspended", "reason": "Repeated violations." }`

**Success Response:** `200`

**Business Rules:** Writes `auditlogs`.

**Related Collections:** `users`, `auditlogs`

---

### Manage Reports

See [List Reports (Admin)](#list-reports-admin) and [Resolve Report](#resolve-report).

**Get Report Detail:**

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/admin/reports/:reportId` |

Includes `reporterId` (admin only), full content snapshot, target metadata.

---

### Manage Tags

| | |
|---|---|
| **Purpose** | Mood category (emotion tag) CRUD (`FR-CAT-003`) |
| **Method** | `GET` |
| **Endpoint** | `/api/v1/admin/tags` |
| **Authentication** | Yes |
| **Authorization** | `administrator` |

**Request Parameters:** `type` (default `emotion`), `includeInactive`

**List Success Response:** `200` — All tags with `isActive`, `sortOrder`, `colorToken`, `iconKey`.

---

### Create Tag

| | |
|---|---|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/admin/tags` |

**Request Body:**

```json
{
  "name": "Burnout",
  "slug": "burnout",
  "type": "emotion",
  "colorToken": "dusty-orange",
  "iconKey": "burnout"
}
```

**Success Response:** `201`

---

### Update Tag

| | |
|---|---|
| **Method** | `PATCH` |
| **Endpoint** | `/api/v1/admin/tags/:tagId` |

**Request Body:** `{ "name": "...", "isActive": false, "sortOrder": 5 }`

**Business Rules:** Cannot hard-delete tags with `moodtags` references — deactivate only.

**Related Collections:** `tags`, `moodtags`

---

### Moderation — Get Mood (Admin View)

| | |
|---|---|
| **Purpose** | Mood with identity for moderation |
| **Method** | `GET` |
| **Endpoint** | `/api/v1/admin/moods/:moodId` |
| **Authentication** | Yes |
| **Authorization** | `administrator` |

**Success Response:** `200`

```json
{
  "success": true,
  "data": {
    "id": "...",
    "content": "...",
    "authorId": "665a1b2c3d4e5f6789012347",
    "authorEmail": "student@university.edu",
    "status": "active",
    "reportCount": 2,
    "tags": [],
    "createdAt": "..."
  }
}
```

**Business Rules:** `identityAccessed: true` in `auditlogs` on this read (`BR-ANON-004`).

**Related Collections:** `moods`, `users`, `auditlogs`

---

### Moderation — Remove Mood

| | |
|---|---|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/admin/moods/:moodId/remove` |

**Request Body:** `{ "reason": "Policy violation.", "moderationNote": "..." }`

**Success Response:** `200` — Sets `status: moderated_removed`.

**Related Collections:** `moods`, `auditlogs`

---

### Moderation — List Content

| | |
|---|---|
| **Purpose** | Browse flagged/high-report content |
| **Method** | `GET` |
| **Endpoint** | `/api/v1/admin/content/moods` |
| **Authentication** | Yes |
| **Authorization** | `administrator` |

**Request Parameters:** `status`, `minReportCount`, `limit`, `cursor`

**Related Collections:** `moods`, `reports`

---

### Audit Logs

| | |
|---|---|
| **Purpose** | Admin action history (`FR-ADMIN-005`) |
| **Method** | `GET` |
| **Endpoint** | `/api/v1/admin/audit-logs` |
| **Authentication** | Yes |
| **Authorization** | `administrator` |

**Request Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `adminId` | string | Filter by admin |
| `action` | string | e.g., `mood.remove`, `identity.view` |
| `targetType` | string | |
| `identityAccessed` | boolean | |
| `from`, `to` | ISO date | |
| `limit`, `cursor` | | Pagination |

**Success Response:** `200`

```json
{
  "success": true,
  "data": [
    {
      "id": "665a1b2c3d4e5f6789012356",
      "adminId": "...",
      "adminEmail": "admin@university.edu",
      "action": "mood.remove",
      "targetType": "mood",
      "targetId": "...",
      "identityAccessed": true,
      "metadata": { "priorStatus": "active" },
      "createdAt": "2026-07-05T14:00:00.000Z"
    }
  ],
  "meta": { "limit": 50, "nextCursor": "...", "hasMore": true }
}
```

**Related Collections:** `auditlogs`, `users`

---

## Shared Schemas

### Tag (Public)

```json
{
  "id": "665a1b2c3d4e5f6789012349",
  "slug": "stress",
  "name": "Stress",
  "colorToken": "dusty-orange",
  "iconKey": "stress"
}
```

### Faculty (Public)

```json
{
  "id": "665a1b2c3d4e5f6789012345",
  "name": "Faculty of Engineering",
  "slug": "engineering"
}
```

### Major (Public)

```json
{
  "id": "665a1b2c3d4e5f6789012346",
  "name": "Computer Science",
  "slug": "computer-science",
  "facultyId": "665a1b2c3d4e5f6789012345"
}
```

### Error Codes Reference

| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION_FAILED` | 422 | Input validation error |
| `AUTH_REQUIRED` | 401 | No token provided |
| `AUTH_INVALID_CREDENTIALS` | 401 | Login failed |
| `AUTH_INVALID_TOKEN` | 401 | Bad JWT |
| `AUTH_EXPIRED_TOKEN` | 401 | Expired JWT |
| `FORBIDDEN` | 403 | Access denied |
| `INSUFFICIENT_ROLE` | 403 | Wrong role |
| `NOT_OWNER` | 403 | Not resource owner |
| `RESOURCE_NOT_FOUND` | 404 | Not found |
| `EMAIL_ALREADY_EXISTS` | 422 | Registration duplicate |
| `REPORT_COOLDOWN` | 409 | Duplicate report |
| `BOOKMARK_ALREADY_EXISTS` | 409 | Duplicate bookmark |
| `EDIT_WINDOW_EXPIRED` | 403 | Mood edit too late |
| `FILE_TOO_LARGE` | 422 | Image size exceeded |
| `INVALID_MIME_TYPE` | 422 | Image type not allowed |
| `UPLOAD_NOT_FOUND_IN_R2` | 422 | Confirm failed |
| `ACCOUNT_SUSPENDED` | 403 | User suspended |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Future APIs

Aligned with README Future Improvements — not implemented in v1.

| API area | Planned endpoints | Notes |
|----------|-------------------|-------|
| **Push notifications** | `POST /api/v1/devices/register`, `DELETE /api/v1/devices/:token` | FCM/APNs tokens on `users` |
| **Mobile API** | Same v1 routes | Native clients consume identical contracts |
| **AI emotion analysis** | `POST /api/v1/admin/moods/:id/analyze` (internal) | Suggested tags; never auto-public |
| **Recommendation engine** | `GET /api/v1/moods/for-you` | Privacy-preserving ranking |
| **Realtime APIs** | `WebSocket /api/v1/ws` or SSE `GET /api/v1/events` | Live feed and notifications |
| **Export** | `GET /api/v1/statistics/export?format=csv` | Advisor/admin only |
| **Webhooks** | `POST /api/v1/admin/webhooks` | Institution integrations |
| **Multi-tenant** | `X-University-Id` header | Tenant isolation on all routes |

---

## Related Documents

| Document | Content |
|----------|---------|
| [`database.md`](./database.md) | Collection schemas this API persists to |
| [`architecture.md`](./architecture.md) | Layer mapping, services, error strategy |
| [`authentication.md`](./authentication.md) | JWT refresh details (`OD-003`) |
| [`cloudflare-r2.md`](./cloudflare-r2.md) | Presigned URL TTLs, MIME list (`OD-006`) |
| [`security.md`](./security.md) | Rate limits, threshold (`OD-010`) |
| [`SPECS.md`](../SPECS.md) | Requirement IDs (`FR-*`, `BR-*`) |
| [`.cursor/rules/api.mdc`](../.cursor/rules/api.mdc) | AI implementation guardrails |

---

## Document Maintenance

| Event | Action |
|-------|--------|
| Open decision resolved | Update affected endpoint auth/body |
| New endpoint | Add full specification block |
| Breaking change | Bump `/api/v2` |
| Database field change | Sync with `database.md` |

---

## Resolved Open Decisions (this document)

| ID | Resolution |
|----|------------|
| `OD-005` | Cursor-based pagination on all list endpoints |
| `OD-007` | Default reaction types: `empathy`, `support`, `relate`, `solidarity` |
| `OD-012` | Default mood edit window: 24 hours from `createdAt` |

Decisions `OD-002`, `OD-003`, `OD-009`, `OD-013`, `OD-014` remain as documented TBDs in endpoint authorization and validation notes.

---

*This document is the complete REST API specification for Mood of the Major v1. All frontend services and backend routes must implement these contracts.*
