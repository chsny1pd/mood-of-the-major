# Mood of the Major — Database Design

> **Document type:** MongoDB schema and data modeling specification  
> **Status:** Draft v1.0  
> **Authority:** This document derives from [`README.md`](../README.md), [`SPECS.md`](../SPECS.md), [`DESIGN.md`](../DESIGN.md), and [`architecture.md`](./architecture.md). Where conflict exists, `README.md` takes precedence, then `SPECS.md`, then `architecture.md`, then `DESIGN.md`.  
> **ODM:** Mongoose on **MongoDB Atlas**  
> **Collections:** Exactly **15** — no additional collections without an ADR in `architecture.md`

---

## Table of Contents

1. [Database Design Philosophy](#database-design-philosophy)
2. [Global Conventions](#global-conventions)
3. [Collection Catalog](#collection-catalog)
4. [Collection Specifications](#collection-specifications)
5. [Collection Relationships](#collection-relationships)
6. [Index Strategy](#index-strategy)
7. [Soft Delete Strategy](#soft-delete-strategy)
8. [Timestamp Strategy](#timestamp-strategy)
9. [Anonymous Posting Strategy](#anonymous-posting-strategy)
10. [Cloudflare R2 Integration](#cloudflare-r2-integration)
11. [Aggregation Strategy](#aggregation-strategy)
12. [Future Scalability](#future-scalability)
13. [Best Practices](#best-practices)
14. [Related Documents](#related-documents)

---

## Database Design Philosophy

### Why MongoDB Was Selected

MongoDB Atlas is the mandated persistence layer (`INT-DB-001`, `NFR-SCALE-001`). It fits Mood of the Major for these reasons:

| Factor | Rationale |
|--------|-----------|
| **Document model** | Moods, comments, and notifications are naturally document-shaped with variable fields (optional images, multiple tags, evolving metadata). |
| **Flexible schema evolution** | Tags, notification types, and moderation fields can evolve without rigid migrations during early product growth. |
| **Aggregation framework** | Statistics, trending emotions, and dashboard metrics require `$match`, `$group`, and `$bucket` pipelines across large mood volumes (`FR-STAT-*`, `FR-TREND-*`). |
| **Horizontal scaling** | Atlas supports sharding and replica sets as post volume and concurrent read load grow (`NFR-SCALE-001`). |
| **Managed operations** | Automated backups, monitoring, and IP allowlisting reduce operational burden (`NFR-AVAIL-002`, `NFR-SEC-007`). |
| **Repository pattern fit** | Mongoose implements domain repository ports in the infrastructure layer (`INT-DB-004`) without coupling domain entities to the driver. |

MongoDB is **not** used for binary image storage. That responsibility belongs exclusively to Cloudflare R2 (`INT-DB-003`).

### Normalization vs Embedding

The schema uses a **hybrid approach** — normalized references for entities with independent lifecycles, selective denormalization for read-heavy paths.

| Pattern | When used | Examples |
|---------|-----------|----------|
| **Reference (normalize)** | Entity has its own lifecycle, is shared, or must be queried independently | `Users`, `Faculties`, `Majors`, `Tags`, `MoodImages` |
| **Junction collection** | Many-to-many relationships with queryable edges | `MoodTags`, `Bookmarks` |
| **Denormalized counters** | High-frequency reads on feeds; updated on write | `Moods.commentCount`, `Moods.reactionSummary` |
| **Pre-aggregated statistics** | Expensive analytics queries; tolerates slight staleness | `EmotionStatistics`, `DailyStatistics` |
| **Embed (limited)** | Small, bounded, always-read-with-parent data | Not used for comments (unbounded growth); comments are a separate collection |

**Avoid embedding** comments, reactions, or images inside `Moods` documents. Unbounded arrays cause document growth, complicate pagination, and degrade feed query performance (`NFR-PERF-001`, `NFR-SCALE-004`).

### Reference Strategy

| Rule | Detail |
|------|--------|
| **Primary keys** | MongoDB `ObjectId` on all collections (`_id`) |
| **Foreign keys** | Stored as `ObjectId` fields with naming convention `<entity>Id` (e.g., `facultyId`, `moodId`) |
| **Referential integrity** | Enforced at application layer (Mongoose middleware optional); MongoDB has no native FK constraints |
| **Population** | Mongoose `.populate()` used sparingly in admin paths only; public feeds use projections without joins to `Users` |
| **Cascades** | Handled in application services: deleting a mood soft-deletes comments, marks images for R2 cleanup, preserves `AuditLogs` |
| **Orphan prevention** | `MoodImages` may exist briefly without `moodId` during upload-then-publish flow (`BR-IMG-004`) |

### Scalability Considerations

| Concern | Strategy |
|---------|----------|
| **Feed reads** | Compound indexes on `Moods` for `(status, createdAt)` + scope filters; denormalized counts avoid per-card aggregation |
| **Write amplification** | Counter updates on `Moods` when comments/reactions change — acceptable tradeoff for read latency |
| **Statistics** | Background jobs write to `EmotionStatistics` and `DailyStatistics`; dashboard reads precomputed docs (`NFR-PERF-004`) |
| **Text search** | MongoDB text index on `Moods.content` for `FR-SRCH-001`; compound filters use B-tree indexes |
| **Sharding (future)** | Shard key candidate: `{ facultyId: 1, createdAt: 1 }` on `Moods` if single-university deployment outgrows one shard |
| **Pagination** | All list queries use indexed sort fields; **cursor pagination** on `(createdAt, _id)` per `docs/api.md` (`OD-005` resolved) |
| **Connection pooling** | Mongoose pool sized per Railway instance; stateless API allows horizontal scale (`NFR-SCALE-003`) |

---

## Global Conventions

| Convention | Value |
|------------|-------|
| **Database name** | `mood_of_the_major` (suffix `_staging`, `_dev` per environment) |
| **Collection names** | Lowercase plural: `users`, `faculties`, `majors`, `moods`, `moodimages`, `comments`, `reactions`, `reports`, `notifications`, `bookmarks`, `tags`, `moodtags`, `emotionstatistics`, `dailystatistics`, `auditlogs` |
| **Field naming** | `camelCase` |
| **IDs** | `ObjectId` unless noted |
| **Timestamps** | See [Timestamp Strategy](#timestamp-strategy) |
| **Enums** | Stored as lowercase string slugs (e.g., `active`, `pending`, `mood`) |
| **Public queries** | Always filter `deletedAt: null` and `status: active` (or equivalent) on user-generated content |
| **Timezone** | All date bucketing in UTC (`BR-STAT-002`) |

---

## Collection Catalog

| # | Collection | Primary purpose |
|---|------------|-----------------|
| 1 | `users` | Authentication identity, role, affiliation |
| 2 | `faculties` | University faculty reference data |
| 3 | `majors` | Academic major reference data |
| 4 | `moods` | Anonymous mood posts |
| 5 | `moodimages` | R2 image metadata (no binaries) |
| 6 | `comments` | Anonymous comments on moods |
| 7 | `reactions` | One reaction per user per target |
| 8 | `reports` | User-flagged content for moderation |
| 9 | `notifications` | In-app user notifications |
| 10 | `bookmarks` | Private user-to-mood saves |
| 11 | `tags` | Mood categories (emotions) and future tag types |
| 12 | `moodtags` | Many-to-many mood ↔ tag links |
| 13 | `emotionstatistics` | Pre-aggregated emotion metrics by scope |
| 14 | `dailystatistics` | Time-bucketed daily rollups |
| 15 | `auditlogs` | Append-only admin action audit trail |

> **Mapping note:** SPECS mood categories (`FR-CAT-*`) are implemented as `tags` documents with `type: emotion`. The domain port is **`ITagRepository`**, implemented by `MongooseTagRepository` on the `tags` collection.

---

## Collection Specifications

---

### 1. Users (`users`)

#### Purpose

Stores authenticated user accounts. Identity exists for authentication, authorization, ownership checks, moderation, and private features (bookmarks). **Never exposed in public mood/comment/reaction API responses** (`BR-ANON-001`, `NFR-PRIV-004`).

#### Fields

| Field | Data Type | Required | Optional | Default | Description |
|-------|-----------|:--------:|:--------:|---------|-------------|
| `_id` | ObjectId | ✓ | | auto | Primary key |
| `email` | String | ✓ | | | Login identifier; lowercase normalized |
| `passwordHash` | String | ✓ | | | bcrypt hash (`FR-AUTH-003`); never returned via API |
| `role` | String | ✓ | | `student` | `student`, `administrator`, `advisor` (advisor TBD per `OD-011`) |
| `facultyId` | ObjectId | | ✓ | `null` | User's affiliated faculty |
| `majorId` | ObjectId | | ✓ | `null` | User's affiliated major |
| `status` | String | ✓ | | `active` | `active`, `suspended` |
| `lastLoginAt` | Date | | ✓ | `null` | Updated on successful login |
| `tokenVersion` | Number | ✓ | | `0` | Incremented on password change, logout-all, refresh reuse; invalidates access JWTs (`tv` claim) |
| `refreshTokenHash` | String | | ✓ | `null` | SHA-256 hash of current valid refresh token (`docs/authentication.md`) |
| `refreshTokenExpiresAt` | Date | | ✓ | `null` | Refresh token expiry (7-day sliding window) |
| `notificationPreferences` | Object | | ✓ | `{}` | Phase 3 preferences (`FR-NOTIF-004`) |
| `createdAt` | Date | ✓ | | auto | |
| `updatedAt` | Date | ✓ | | auto | |
| `deletedAt` | Date | | ✓ | `null` | Soft delete for account deactivation (future GDPR) |

#### Validation Rules

- `email`: valid email format, max 254 characters, unique among non-deleted users
- `passwordHash`: non-empty; plaintext never stored
- `role`: enum `student` | `administrator` | `advisor`
- `status`: enum `active` | `suspended`
- `facultyId`: if present, must reference existing active `faculties` document
- `majorId`: if present, must reference existing active `majors` document; `major.facultyId` should match `facultyId` when both set
- `tokenVersion`: non-negative integer; incremented atomically on revocation events
- `refreshTokenHash`: null when no active refresh session
- `refreshTokenExpiresAt`: must be in the future when `refreshTokenHash` is set

#### Indexes

| Index | Type | Purpose |
|-------|------|---------|
| `{ email: 1 }` | Unique (partial: `deletedAt: null`) | Login lookup |
| `{ role: 1, status: 1 }` | Compound | Admin user management queries |
| `{ facultyId: 1, majorId: 1 }` | Compound | Affiliation analytics (admin) |

#### Relationships

| Direction | Collection | Cardinality |
|-----------|------------|-------------|
| `facultyId` → | `faculties` | many-to-one |
| `majorId` → | `majors` | many-to-one |
| ← `authorId` | `moods` | one-to-many |
| ← `authorId` | `comments` | one-to-many |
| ← `userId` | `reactions` | one-to-many |
| ← `userId` | `bookmarks` | one-to-many |
| ← `reporterId` | `reports` | one-to-many |
| ← `userId` | `notifications` | one-to-many |
| ← `uploadedBy` | `moodimages` | one-to-many |
| ← `adminId` | `auditlogs` | one-to-many |

#### Referenced Collections

`faculties`, `majors`

#### Business Rules

- Only `active` users may authenticate (`BR-AUTH-001`)
- `administrator` role required for moderation capabilities (`BR-AUTH-002`)
- Suspended users cannot create content; existing content retention per `BR-CNT-004`
- Email domain restriction: optional `ALLOWED_EMAIL_DOMAINS` env var per `docs/authentication.md` (`OD-014` resolved)
- Admin user queries may return `email` and affiliation; public endpoints never return other users' data

---

### 2. Faculties (`faculties`)

#### Purpose

Reference data for university faculties. Scopes feeds, filters, statistics, and user affiliation (`FR-FEED-002`, `FR-STAT-004`).

#### Fields

| Field | Data Type | Required | Optional | Default | Description |
|-------|-----------|:--------:|:--------:|---------|-------------|
| `_id` | ObjectId | ✓ | | auto | Primary key |
| `name` | String | ✓ | | | Display name (e.g., "Faculty of Engineering") |
| `slug` | String | ✓ | | | URL-safe identifier; unique |
| `code` | String | | ✓ | `null` | Short institutional code |
| `description` | String | | ✓ | `null` | Optional summary for faculty page header |
| `isActive` | Boolean | ✓ | | `true` | Inactive faculties hidden from pickers |
| `sortOrder` | Number | | ✓ | `0` | Display ordering |
| `createdAt` | Date | ✓ | | auto | |
| `updatedAt` | Date | ✓ | | auto | |

#### Validation Rules

- `name`: 2–120 characters, trimmed
- `slug`: lowercase alphanumeric + hyphens, unique, 2–80 characters
- `code`: max 20 characters if present

#### Indexes

| Index | Type | Purpose |
|-------|------|---------|
| `{ slug: 1 }` | Unique | Route param lookup `/faculty/:slug` |
| `{ isActive: 1, sortOrder: 1 }` | Compound | Active faculty lists |

#### Relationships

| Direction | Collection | Cardinality |
|-----------|------------|-------------|
| ← `facultyId` | `majors` | one-to-many |
| ← `facultyId` | `users` | one-to-many |
| ← `facultyId` | `moods` | one-to-many |

#### Referenced Collections

None (root reference entity)

#### Business Rules

- Seeded at deployment; managed by administrators
- Cannot hard-delete if referenced — deactivate via `isActive: false`
- Faculty page (`DESIGN.md`) reads from this collection for header and feed scope

---

### 3. Majors (`majors`)

#### Purpose

Reference data for academic majors within a faculty. Scopes major feeds and statistics (`FR-FEED-003`).

#### Fields

| Field | Data Type | Required | Optional | Default | Description |
|-------|-----------|:--------:|:--------:|---------|-------------|
| `_id` | ObjectId | ✓ | | auto | Primary key |
| `facultyId` | ObjectId | ✓ | | | Parent faculty |
| `name` | String | ✓ | | | Display name |
| `slug` | String | ✓ | | | URL-safe; unique within faculty |
| `code` | String | | ✓ | `null` | Institutional program code |
| `isActive` | Boolean | ✓ | | `true` | |
| `sortOrder` | Number | | ✓ | `0` | |
| `createdAt` | Date | ✓ | | auto | |
| `updatedAt` | Date | ✓ | | auto | |

#### Validation Rules

- `name`: 2–120 characters
- `slug`: unique in combination with `facultyId`
- `facultyId`: must reference active `faculties` document

#### Indexes

| Index | Type | Purpose |
|-------|------|---------|
| `{ facultyId: 1, slug: 1 }` | Unique compound | Major route lookup |
| `{ facultyId: 1, isActive: 1, sortOrder: 1 }` | Compound | Major list per faculty |

#### Relationships

| Direction | Collection | Cardinality |
|-----------|------------|-------------|
| `facultyId` → | `faculties` | many-to-one |
| ← `majorId` | `users` | one-to-many |
| ← `majorId` | `moods` | one-to-many |

#### Referenced Collections

`faculties`

#### Business Rules

- Major must belong to exactly one faculty
- Major feed filters `moods` where `majorId` matches
- Deactivate via `isActive: false`; no hard delete if moods reference major

---

### 4. Moods (`moods`)

#### Purpose

Core content entity — anonymous mood posts containing text, optional images (via `moodimages`), tags, and academic context (`FR-POST-*`).

#### Fields

| Field | Data Type | Required | Optional | Default | Description |
|-------|-----------|:--------:|:--------:|---------|-------------|
| `_id` | ObjectId | ✓ | | auto | Primary key |
| `authorId` | ObjectId | ✓ | | | **Internal only** — ref `users`; stripped from public DTOs |
| `content` | String | ✓ | | | Post body text |
| `facultyId` | ObjectId | | ✓ | `null` | Faculty context (`FR-POST-004`; required/optional TBD `OD-013`) |
| `majorId` | ObjectId | | ✓ | `null` | Major context |
| `status` | String | ✓ | | `active` | `active`, `hidden`, `moderated_removed`, `deleted_by_author` |
| `commentCount` | Number | ✓ | | `0` | Denormalized count of active comments |
| `reactionSummary` | Object | ✓ | | `{}` | Map of `emoji → count` (e.g., `{ "💙": 12, "🔥": 3 }`) |
| `imageCount` | Number | ✓ | | `0` | Denormalized count of confirmed images |
| `primaryTagId` | ObjectId | | ✓ | `null` | Denormalized primary emotion tag for feed badge display |
| `reportCount` | Number | ✓ | | `0` | Open + resolved reports count (admin signal) |
| `lastActivityAt` | Date | ✓ | | `createdAt` | Updated on comment/reaction; feed sort option |
| `editedAt` | Date | | ✓ | `null` | Set on author edit within policy window (`FR-POST-007`) |
| `moderatedAt` | Date | | ✓ | `null` | Admin removal timestamp |
| `moderatedBy` | ObjectId | | ✓ | `null` | Admin user ref |
| `moderationNote` | String | | ✓ | `null` | Internal admin note |
| `createdAt` | Date | ✓ | | auto | Immutable creation time (`FR-POST-006`) |
| `updatedAt` | Date | ✓ | | auto | |
| `deletedAt` | Date | | ✓ | `null` | Soft delete timestamp |

#### Validation Rules

- `content`: 1–5000 characters (max configurable via `BR-CNT-001`); no empty whitespace-only
- `authorId`: required; valid `users` ref with role `student` for creation
- `status`: enum as listed
- At least one emotion tag required via `moodtags` at creation (`BR-CNT-002`, `FR-POST-003`)
- `facultyId` / `majorId`: if present, must reference active documents; `majorId.facultyId` must equal `facultyId` when both set
- `reactionSummary` values: non-negative integers

#### Indexes

| Index | Type | Purpose |
|-------|------|---------|
| `{ status: 1, createdAt: -1 }` | Compound | Global mood feed |
| `{ status: 1, facultyId: 1, createdAt: -1 }` | Compound | Faculty feed |
| `{ status: 1, majorId: 1, createdAt: -1 }` | Compound | Major feed |
| `{ status: 1, primaryTagId: 1, createdAt: -1 }` | Compound | Category filter |
| `{ status: 1, lastActivityAt: -1 }` | Compound | Activity sort (`FR-FEED-008`) |
| `{ authorId: 1, createdAt: -1 }` | Compound | Author's own posts (owner delete/edit) |
| `{ content: "text" }` | Text | Full-text search (`FR-SRCH-001`) |
| `{ createdAt: -1, _id: -1 }` | Compound | Cursor pagination |

#### Relationships

| Direction | Collection | Cardinality |
|-----------|------------|-------------|
| `authorId` → | `users` | many-to-one (internal) |
| `facultyId` → | `faculties` | many-to-one |
| `majorId` → | `majors` | many-to-one |
| `primaryTagId` → | `tags` | many-to-one |
| `moderatedBy` → | `users` | many-to-one |
| ← `moodId` | `moodimages` | one-to-many |
| ← `moodId` | `moodtags` | one-to-many |
| ← `moodId` | `comments` | one-to-many |
| ← target | `reactions` | one-to-many (polymorphic) |
| ← `moodId` | `bookmarks` | one-to-many |
| ← target | `reports` | one-to-many (polymorphic) |

#### Referenced Collections

`users`, `faculties`, `majors`, `tags`

#### Business Rules

- Public feeds query `status: active` AND `deletedAt: null` (`BR-CNT-004`)
- `authorId` never included in public repository projections (`BR-ANON-001`)
- Authors may edit/delete own moods (`FR-POST-007`, `FR-POST-008`); delete sets `status` and `deletedAt`
- Admin removal sets `status: moderated_removed`, writes `auditlogs` (`FR-POST-009`, `FR-ADMIN-005`)
- Default `facultyId`/`majorId` from author's profile at creation if not explicitly set (application layer)
- Rate limiting enforced at API — not stored in document (`FR-POST-010`)
- Bookmarked mood remains readable to bookmark owner even if removed from public feeds (`FR-BMK-004`) — service checks bookmark ownership

---

### 5. MoodImages (`moodimages`)

#### Purpose

Stores **metadata only** for images uploaded to Cloudflare R2. No binary data (`INT-DB-003`, `FR-IMG-004`).

#### Fields

| Field | Data Type | Required | Optional | Default | Description |
|-------|-----------|:--------:|:--------:|---------|-------------|
| `_id` | ObjectId | ✓ | | auto | Primary key |
| `uploadedBy` | ObjectId | ✓ | | | Ref `users` — uploader (internal) |
| `moodId` | ObjectId | | ✓ | `null` | Linked mood; null during pre-publish upload |
| `objectKey` | String | ✓ | | | R2 object key (unique path in bucket) |
| `originalFileName` | String | | ✓ | `null` | Client file name (not exposed publicly) |
| `mimeType` | String | ✓ | | | e.g., `image/jpeg`, `image/png`, `image/webp` |
| `fileSizeBytes` | Number | ✓ | | | Validated before presign (`BR-IMG-002`) |
| `status` | String | ✓ | | `pending` | `pending`, `confirmed`, `orphaned`, `deleted` |
| `sortOrder` | Number | ✓ | | `0` | Display order within mood (multi-image) |
| `width` | Number | | ✓ | `null` | Optional dimensions after confirm |
| `height` | Number | | ✓ | `null` | |
| `confirmedAt` | Date | | ✓ | `null` | R2 head-object verification time |
| `deletedAt` | Date | | ✓ | `null` | Soft delete; triggers R2 cleanup job |
| `createdAt` | Date | ✓ | | auto | |
| `updatedAt` | Date | ✓ | | auto | |

#### Validation Rules

- `objectKey`: unique, non-empty, matches R2 key pattern (no `..`, no leading `/`)
- `mimeType`: must be in approved allowlist (`BR-IMG-001`)
- `fileSizeBytes`: positive integer, ≤ **5 MB** per `docs/cloudflare-r2.md` (`OD-006` resolved)
- `status`: enum as listed
- `moodId`: required when `status: confirmed` on published mood

#### Indexes

| Index | Type | Purpose |
|-------|------|---------|
| `{ objectKey: 1 }` | Unique | Prevent duplicate R2 references |
| `{ moodId: 1, sortOrder: 1 }` | Compound | Images per mood |
| `{ uploadedBy: 1, status: 1, createdAt: -1 }` | Compound | User's pending uploads |
| `{ status: 1, createdAt: 1 }` | Compound | Orphan cleanup job (`BR-IMG-004`) |

#### Relationships

| Direction | Collection | Cardinality |
|-----------|------------|-------------|
| `uploadedBy` → | `users` | many-to-one |
| `moodId` → | `moods` | many-to-one |

#### Referenced Collections

`users`, `moods`

#### Business Rules

- Presigned upload creates `pending` record with `objectKey` before client PUT to R2
- Confirm verifies object exists in R2 (`FR-IMG-008`), sets `confirmed`
- Publish mood links `moodId` on all confirmed images for that draft
- Orphan job: `pending` or `confirmed` without `moodId` older than TTL → `orphaned` → R2 delete
- Mood delete cascades: all images → `deleted`, enqueue R2 removal (`FR-IMG-009`)
- Public API returns image reference IDs only; signed URLs generated at read time — never store signed URLs in DB

---

### 6. Comments (`comments`)

#### Purpose

Anonymous comments on mood posts (`FR-CMT-*`).

#### Fields

| Field | Data Type | Required | Optional | Default | Description |
|-------|-----------|:--------:|:--------:|---------|-------------|
| `_id` | ObjectId | ✓ | | auto | Primary key |
| `moodId` | ObjectId | ✓ | | | Parent mood |
| `authorId` | ObjectId | ✓ | | | **Internal only** — ref `users` |
| `parentId` | ObjectId | | ✓ | `null` | Parent comment for threading (`FR-CMT-004` TBD) |
| `content` | String | ✓ | | | Comment text |
| `status` | String | ✓ | | `active` | `active`, `moderated_removed`, `deleted_by_author` |
| `reactionSummary` | Object | ✓ | | `{}` | Denormalized emoji reaction counts |
| `depth` | Number | ✓ | | `0` | Thread depth (0 = top-level) |
| `moderatedAt` | Date | | ✓ | `null` | |
| `moderatedBy` | ObjectId | | ✓ | `null` | |
| `createdAt` | Date | ✓ | | auto | |
| `updatedAt` | Date | ✓ | | auto | |
| `deletedAt` | Date | | ✓ | `null` | |

#### Validation Rules

- `content`: 1–2000 characters (`BR-CNT-001` configurable)
- `moodId`: must reference active mood (or mood visible in context)
- `parentId`: if set, must reference comment on same `moodId`; `depth` ≤ max thread depth (e.g., 3)
- `authorId`: required; never in public projections

#### Indexes

| Index | Type | Purpose |
|-------|------|---------|
| `{ moodId: 1, status: 1, createdAt: 1 }` | Compound | Comments per mood (flat sort) |
| `{ moodId: 1, parentId: 1, createdAt: 1 }` | Compound | Threaded comment tree |
| `{ authorId: 1, createdAt: -1 }` | Compound | Author delete own comments |

#### Relationships

| Direction | Collection | Cardinality |
|-----------|------------|-------------|
| `moodId` → | `moods` | many-to-one |
| `authorId` → | `users` | many-to-one (internal) |
| `parentId` → | `comments` | many-to-one (self-ref) |
| ← target | `reactions` | one-to-many |
| ← target | `reports` | one-to-many |

#### Referenced Collections

`moods`, `users`, `comments` (self)

#### Business Rules

- Creating comment increments `moods.commentCount`
- `authorId` stripped from public API (`BR-ANON-002`)
- Admin removal: `status: moderated_removed`, audit log (`FR-CMT-006`)
- Reports on comments supported (`FR-RPT-001`)

---

### 7. Reactions (`reactions`)

#### Purpose

Stores emoji reactions on mood posts and comments. Each user may have **up to 7 distinct emoji** per target; one document per `(userId, targetType, targetId, emoji)` (`FR-REACT-001`, `FR-REACT-003`).

#### Fields

| Field | Data Type | Required | Optional | Default | Description |
|-------|-----------|:--------:|:--------:|---------|-------------|
| `_id` | ObjectId | ✓ | | auto | Primary key |
| `userId` | ObjectId | ✓ | | | **Internal only** — ref `users` |
| `targetType` | String | ✓ | | | `mood` or `comment` |
| `targetId` | ObjectId | ✓ | | | Polymorphic ref |
| `emoji` | String | ✓ | | | Unicode emoji grapheme (max 8 UTF-16 code units) |
| `createdAt` | Date | ✓ | | auto | |
| `updatedAt` | Date | ✓ | | auto | Set when reaction row is created (toggle add/remove creates/deletes rows) |

#### Validation Rules

- `targetType`: enum `mood` | `comment`
- `targetId`: must reference existing document of matching type and active status
- `emoji`: single emoji grapheme; ASCII slugs and plain text rejected at API layer
- Unique constraint: one document per `(userId, targetType, targetId, emoji)`
- Application cap: at most **7** documents per `(userId, targetType, targetId)`

#### Indexes

| Index | Type | Purpose |
|-------|------|---------|
| `{ userId: 1, targetType: 1, targetId: 1, emoji: 1 }` | Unique compound | One row per emoji per user per target |
| `{ targetType: 1, targetId: 1 }` | Compound | Summary aggregation fallback |
| `{ userId: 1, targetType: 1, targetId: 1 }` | Compound | Count user reactions on target (limit enforcement) |

#### Relationships

| Direction | Collection | Cardinality |
|-----------|------------|-------------|
| `userId` → | `users` | many-to-one (internal) |
| `targetId` → | `moods` or `comments` | many-to-one (polymorphic) |

#### Referenced Collections

`users`, `moods`, `comments`

#### Business Rules

- `PUT /reactions` **toggles** one emoji: insert and `$inc` summary on add; delete row and decrement on remove if already owned
- Eighth distinct emoji on a target rejected with `REACTION_LIMIT_REACHED` (`422`)
- Application service updates `reactionSummary` on target document (emoji keys)
- Default UI shortcuts `💙`, `🤝`, `🫂`, `✊` are presentation-only; any valid emoji may appear in storage
- Public API returns counts only — never `userId` or per-user reaction lists (`FR-REACT-004`, `BR-ANON-002`)
- Authenticated read returns caller's `userReactions: string[]` only
- Legacy slug `reactionType` values migrated to `emoji` via one-time script (`migrate:reaction-emojis`)

---

### 8. Reports (`reports`)

#### Purpose

User-submitted content flags for admin review queue (`FR-RPT-*`).

#### Fields

| Field | Data Type | Required | Optional | Default | Description |
|-------|-----------|:--------:|:--------:|---------|-------------|
| `_id` | ObjectId | ✓ | | auto | Primary key |
| `reporterId` | ObjectId | ✓ | | | Ref `users` — **hidden from content author** (`FR-RPT-004`) |
| `targetType` | String | ✓ | | | `mood` or `comment` |
| `targetId` | ObjectId | ✓ | | | Polymorphic ref |
| `reasonCode` | String | ✓ | | | e.g., `harassment`, `spam`, `self_harm`, `other` |
| `description` | String | | ✓ | `null` | Optional reporter detail, max 1000 chars |
| `status` | String | ✓ | | `pending` | `pending`, `resolved_removed`, `resolved_dismissed`, `resolved_warned` |
| `resolvedAt` | Date | | ✓ | `null` | |
| `resolvedBy` | ObjectId | | ✓ | `null` | Admin ref |
| `resolutionNote` | String | | ✓ | `null` | Admin internal note |
| `createdAt` | Date | ✓ | | auto | |
| `updatedAt` | Date | ✓ | | auto | |

#### Validation Rules

- `reasonCode`: enum from predefined set
- Duplicate: same `reporterId` + `targetType` + `targetId` within cooldown window rejected (`FR-RPT-005`)
- `targetId`: must reference existing content

#### Indexes

| Index | Type | Purpose |
|-------|------|---------|
| `{ status: 1, createdAt: 1 }` | Compound | Admin report queue (`FR-ADMIN-002`) |
| `{ reporterId: 1, targetType: 1, targetId: 1, createdAt: -1 }` | Compound | Cooldown duplicate check |
| `{ targetType: 1, targetId: 1 }` | Compound | Reports per content (admin) |

#### Relationships

| Direction | Collection | Cardinality |
|-----------|------------|-------------|
| `reporterId` → | `users` | many-to-one |
| `resolvedBy` → | `users` | many-to-one |
| `targetId` → | `moods` or `comments` | many-to-one |

#### Referenced Collections

`users`, `moods`, `comments`

#### Business Rules

- Submission increments `moods.reportCount` when target is mood
- Admin resolution writes `auditlogs` (`FR-RPT-006`, `FR-ADMIN-005`)
- Reporter identity available to admins only, never to content author
- Append-only — reports are never hard-deleted

---

### 9. Notifications (`notifications`)

#### Purpose

In-app notifications for relevant user activity (`FR-NOTIF-*`, Phase 3).

#### Fields

| Field | Data Type | Required | Optional | Default | Description |
|-------|-----------|:--------:|:--------:|---------|-------------|
| `_id` | ObjectId | ✓ | | auto | Primary key |
| `userId` | ObjectId | ✓ | | | Recipient ref `users` |
| `type` | String | ✓ | | | e.g., `mood_activity`, `system`, `moderation` (triggers TBD `OD-008`) |
| `title` | String | ✓ | | | Short headline |
| `body` | String | ✓ | | | Message text — no identity leaks (`FR-NOTIF-003`) |
| `relatedEntityType` | String | | ✓ | `null` | `mood`, `comment`, `report`, etc. |
| `relatedEntityId` | ObjectId | | ✓ | `null` | Deep link target |
| `isRead` | Boolean | ✓ | | `false` | |
| `readAt` | Date | | ✓ | `null` | |
| `createdAt` | Date | ✓ | | auto | |
| `updatedAt` | Date | ✓ | | auto | |

#### Validation Rules

- `body` must not contain reporter/author email or name
- `type`: enum from controlled vocabulary
- `userId`: must reference active user

#### Indexes

| Index | Type | Purpose |
|-------|------|---------|
| `{ userId: 1, isRead: 1, createdAt: -1 }` | Compound | Notification inbox |
| `{ userId: 1, createdAt: -1 }` | Compound | Paginated history |
| `{ createdAt: 1 }` | TTL optional (future) | Auto-expire old notifications after N days |

#### Relationships

| Direction | Collection | Cardinality |
|-----------|------------|-------------|
| `userId` → | `users` | many-to-one |

#### Referenced Collections

`users`; optional logical refs to `moods`, `comments` via `relatedEntityId`

#### Business Rules

- Only recipient may read their notifications
- Mark-read updates `isRead` and `readAt`
- Push delivery (future) uses same documents; delivery channel not stored as duplicate rows
- Notification text authored by application templates — never copy raw user content that could leak identity

---

### 10. Bookmarks (`bookmarks`)

#### Purpose

Private saves linking a user to a mood (`FR-BMK-*`).

#### Fields

| Field | Data Type | Required | Optional | Default | Description |
|-------|-----------|:--------:|:--------:|---------|-------------|
| `_id` | ObjectId | ✓ | | auto | Primary key |
| `userId` | ObjectId | ✓ | | | Ref `users` |
| `moodId` | ObjectId | ✓ | | | Ref `moods` |
| `createdAt` | Date | ✓ | | auto | Bookmark time |

#### Validation Rules

- Unique `(userId, moodId)` pair
- `moodId` must reference existing mood (including moderated-removed for owner bookmark access per `FR-BMK-004`)

#### Indexes

| Index | Type | Purpose |
|-------|------|---------|
| `{ userId: 1, moodId: 1 }` | Unique compound | One bookmark per user per mood |
| `{ userId: 1, createdAt: -1 }` | Compound | User's bookmark list |

#### Relationships

| Direction | Collection | Cardinality |
|-----------|------------|-------------|
| `userId` → | `users` | many-to-one |
| `moodId` → | `moods` | many-to-one |

#### Referenced Collections

`users`, `moods`

#### Business Rules

- Hard delete on unbookmark (no soft delete)
- Bookmark list is private — only `userId` owner may query
- Accessing bookmarked mood uses standard mood read with bookmark ownership check even if mood not in public feed

---

### 11. Tags (`tags`)

#### Purpose

Controlled vocabulary for **mood categories / emotions** (`FR-CAT-*`) and extensible tag types. Replaces a separate "categories" collection per project schema mandate.

#### Fields

| Field | Data Type | Required | Optional | Default | Description |
|-------|-----------|:--------:|:--------:|---------|-------------|
| `_id` | ObjectId | ✓ | | auto | Primary key |
| `name` | String | ✓ | | | Display label (e.g., "Stress", "Joy") |
| `slug` | String | ✓ | | | URL/filter key (e.g., `stress`, `joy`) |
| `type` | String | ✓ | | `emotion` | `emotion` (mood category), future: `topic`, `reaction` |
| `colorToken` | String | | ✓ | `null` | Design system color key (`DESIGN.md` Emotion Badge) |
| `iconKey` | String | | ✓ | `null` | Emoji glyph (or legacy ascii key) shown with the emotion |
| `isActive` | Boolean | ✓ | | `true` | Deactivate instead of delete (`FR-CAT-003`) |
| `sortOrder` | Number | | ✓ | `0` | Picker ordering |
| `createdAt` | Date | ✓ | | auto | |
| `updatedAt` | Date | ✓ | | auto | |

#### Validation Rules

- `slug`: unique per `type`, lowercase alphanumeric + hyphens
- `name`: 2–50 characters
- `type`: enum; `emotion` for mood categories
- Cannot hard-delete if `moodtags` references exist — set `isActive: false`

#### Indexes

| Index | Type | Purpose |
|-------|------|---------|
| `{ type: 1, slug: 1 }` | Unique compound | Filter and seed lookup |
| `{ type: 1, isActive: 1, sortOrder: 1 }` | Compound | Active tag pickers |

#### Relationships

| Direction | Collection | Cardinality |
|-----------|------------|-------------|
| ← `tagId` | `moodtags` | one-to-many |
| ← `primaryTagId` | `moods` | one-to-many (denormalized) |
| ← `tagId` | `emotionstatistics` | one-to-many |
| ← `tagId` | `dailystatistics` | one-to-many |

#### Referenced Collections

None (reference root for tags)

#### Business Rules

- Seed with predefined emotions: stress, joy, anxiety, gratitude (`FR-CAT-001`)
- Admin may add tags and deactivate (`FR-CAT-003`)
- Used in statistics and trending (`FR-CAT-004`)
- `DESIGN.md` Emotion Badge maps to `name`, `colorToken`, `iconKey`

---

### 12. MoodTags (`moodtags`)

#### Purpose

Junction collection linking moods to one or more emotion tags (`FR-POST-003`, `FR-CAT-002`).

#### Fields

| Field | Data Type | Required | Optional | Default | Description |
|-------|-----------|:--------:|:--------:|---------|-------------|
| `_id` | ObjectId | ✓ | | auto | Primary key |
| `moodId` | ObjectId | ✓ | | | Ref `moods` |
| `tagId` | ObjectId | ✓ | | | Ref `tags` (type `emotion`) |
| `isPrimary` | Boolean | ✓ | | `false` | Exactly one `true` per mood — drives `moods.primaryTagId` |
| `createdAt` | Date | ✓ | | auto | |

#### Validation Rules

- Unique `(moodId, tagId)` pair
- At least one `moodtags` row required per mood at creation
- Exactly one `isPrimary: true` per `moodId`
- `tagId` must reference active `tags` where `type: emotion`

#### Indexes

| Index | Type | Purpose |
|-------|------|---------|
| `{ moodId: 1, tagId: 1 }` | Unique compound | Prevent duplicate links |
| `{ tagId: 1, moodId: 1 }` | Compound | Filter moods by category |
| `{ moodId: 1, isPrimary: 1 }` | Compound | Primary tag lookup |

#### Relationships

| Direction | Collection | Cardinality |
|-----------|------------|-------------|
| `moodId` → | `moods` | many-to-one |
| `tagId` → | `tags` | many-to-one |

#### Referenced Collections

`moods`, `tags`

#### Business Rules

- On mood create: insert `moodtags` rows; set `moods.primaryTagId` from `isPrimary` row
- Category filter in feeds joins `moodtags` or queries `moods.primaryTagId` / `moods` + `tagId` (`FR-SRCH-004`)
- Deleting mood soft-deletes mood; `moodtags` rows remain for audit or cascade hard-delete (application choice: hard-delete junction on mood hard purge only)

---

### 13. EmotionStatistics (`emotionstatistics`)

#### Purpose

Pre-computed emotion distribution metrics for dashboard KPIs and distribution charts (`FR-STAT-001`, `FR-STAT-002`, `NFR-PERF-004`).

#### Fields

| Field | Data Type | Required | Optional | Default | Description |
|-------|-----------|:--------:|:--------:|---------|-------------|
| `_id` | ObjectId | ✓ | | auto | Primary key |
| `scopeType` | String | ✓ | | | `platform`, `faculty`, `major` |
| `scopeId` | ObjectId | | ✓ | `null` | `faculties._id` or `majors._id`; null for platform |
| `tagId` | ObjectId | ✓ | | | Emotion tag ref |
| `periodType` | String | ✓ | | | `all_time`, `rolling_7d`, `rolling_30d`, `rolling_90d` |
| `moodCount` | Number | ✓ | | `0` | Moods with this tag in scope/period |
| `percentage` | Number | | ✓ | `null` | Share of total in scope (0–100) |
| `rank` | Number | | ✓ | `null` | Rank among emotions in scope |
| `meetsThreshold` | Boolean | ✓ | | `false` | Whether `moodCount` ≥ aggregation minimum (`BR-STAT-001`) |
| `algorithmVersion` | String | ✓ | | `v1` | Version tag (`BR-STAT-003`) |
| `calculatedAt` | Date | ✓ | | | Last computation timestamp |
| `createdAt` | Date | ✓ | | auto | |
| `updatedAt` | Date | ✓ | | auto | |

#### Validation Rules

- Unique compound: `(scopeType, scopeId, tagId, periodType, algorithmVersion)`
- `scopeId` required when `scopeType` is `faculty` or `major`
- `moodCount` non-negative; `percentage` 0–100 when set
- Public API returns rows only where `meetsThreshold: true` (or masks counts)

#### Indexes

| Index | Type | Purpose |
|-------|------|---------|
| `{ scopeType: 1, scopeId: 1, periodType: 1, tagId: 1 }` | Unique compound | Dashboard lookup |
| `{ scopeType: 1, scopeId: 1, periodType: 1, rank: 1 }` | Compound | Ordered distribution |
| `{ calculatedAt: 1 }` | Single | Staleness monitoring |

#### Relationships

| Direction | Collection | Cardinality |
|-----------|------------|-------------|
| `scopeId` → | `faculties` or `majors` | many-to-one |
| `tagId` → | `tags` | many-to-one |

#### Referenced Collections

`faculties`, `majors`, `tags`

#### Business Rules

- Populated by scheduled aggregation job — not on every API request
- Dashboard reads this collection for pie/bar charts (`DESIGN.md` Statistics Dashboard)
- When `meetsThreshold: false`, API returns category name with "insufficient data" — no counts (`FR-STAT-006`)
- Never stores individual `moodId` or `authorId` — counts only (`FR-STAT-005`)

---

### 14. DailyStatistics (`dailystatistics`)

#### Purpose

UTC day-bucketed rollups for time-series charts, trending deltas, and period comparisons (`FR-STAT-003`, `BR-STAT-002`).

#### Fields

| Field | Data Type | Required | Optional | Default | Description |
|-------|-----------|:--------:|:--------:|---------|-------------|
| `_id` | ObjectId | ✓ | | auto | Primary key |
| `date` | Date | ✓ | | | UTC midnight bucket start |
| `scopeType` | String | ✓ | | | `platform`, `faculty`, `major` |
| `scopeId` | ObjectId | | ✓ | `null` | Scope reference |
| `tagId` | ObjectId | | ✓ | `null` | Emotion tag; null = all emotions combined |
| `moodCount` | Number | ✓ | | `0` | Moods created that day |
| `commentCount` | Number | ✓ | | `0` | Comments that day |
| `reactionCount` | Number | ✓ | | `0` | Reactions that day |
| `activeMoodCount` | Number | ✓ | | `0` | Moods with activity that day |
| `uniqueParticipantCount` | Number | | ✓ | `null` | Distinct internal authors — **never exposed raw**; threshold-gated |
| `meetsThreshold` | Boolean | ✓ | | `false` | Scope-day meets minimum (`BR-STAT-001`) |
| `algorithmVersion` | String | ✓ | | `v1` | |
| `calculatedAt` | Date | ✓ | | | |
| `createdAt` | Date | ✓ | | auto | |
| `updatedAt` | Date | ✓ | | auto | |

#### Validation Rules

- Unique: `(date, scopeType, scopeId, tagId, algorithmVersion)` — use sentinel for null `tagId` in unique index via partial filter or compound with `tagId` subdocument
- `date` must be normalized to UTC 00:00:00
- All counts non-negative

#### Indexes

| Index | Type | Purpose |
|-------|------|---------|
| `{ scopeType: 1, scopeId: 1, date: -1 }` | Compound | Time-series range queries |
| `{ scopeType: 1, scopeId: 1, tagId: 1, date: -1 }` | Compound | Per-emotion time series |
| `{ date: 1, scopeType: 1 }` | Compound | Nightly batch processing |
| `{ calculatedAt: 1 }` | Single | Job monitoring |

#### Relationships

| Direction | Collection | Cardinality |
|-----------|------------|-------------|
| `scopeId` → | `faculties` or `majors` | many-to-one |
| `tagId` → | `tags` | many-to-one |

#### Referenced Collections

`faculties`, `majors`, `tags`

#### Business Rules

- Nightly job aggregates previous UTC day from `moods`, `comments`, `reactions`
- Weekly/monthly views computed by summing daily buckets in application layer or materialized view job
- `uniqueParticipantCount` used only internally for threshold; never returned if below minimum (prevents de-anonymization)
- Supports trending: compare `rolling_7d` sums vs prior window (`FR-TREND-004`)

---

### 15. AuditLogs (`auditlogs`)

#### Purpose

Append-only record of administrative actions and identity-linked access (`FR-ADMIN-005`, `BR-ANON-004`, `NFR-SEC-010`).

#### Fields

| Field | Data Type | Required | Optional | Default | Description |
|-------|-----------|:--------:|:--------:|---------|-------------|
| `_id` | ObjectId | ✓ | | auto | Primary key |
| `adminId` | ObjectId | ✓ | | | Acting administrator ref `users` |
| `action` | String | ✓ | | | e.g., `mood.remove`, `user.suspend`, `report.resolve`, `identity.view` |
| `targetType` | String | ✓ | | | `mood`, `comment`, `user`, `report`, etc. |
| `targetId` | ObjectId | | ✓ | `null` | Affected entity |
| `metadata` | Object | | ✓ | `{}` | Structured context (prior status, reason code, IP) |
| `identityAccessed` | Boolean | ✓ | | `false` | True when admin viewed `authorId` linkage |
| `ipAddress` | String | | ✓ | `null` | Request IP (hashed in production optional) |
| `createdAt` | Date | ✓ | | auto | Immutable timestamp |

#### Validation Rules

- Immutable after insert — no updates or deletes
- `action` from controlled vocabulary
- `adminId` must reference user with role `administrator`

#### Indexes

| Index | Type | Purpose |
|-------|------|---------|
| `{ adminId: 1, createdAt: -1 }` | Compound | Actions by admin |
| `{ targetType: 1, targetId: 1, createdAt: -1 }` | Compound | History per entity |
| `{ action: 1, createdAt: -1 }` | Compound | Filter by action type |
| `{ identityAccessed: 1, createdAt: -1 }` | Compound | Identity access audits |
| `{ createdAt: -1 }` | Single | Chronological admin log |

#### Relationships

| Direction | Collection | Cardinality |
|-----------|------------|-------------|
| `adminId` → | `users` | many-to-one |
| `targetId` → | various | logical polymorphic ref |

#### Referenced Collections

`users`; logical refs to `moods`, `comments`, `reports`, `users`

#### Business Rules

- Every moderation action writes one row minimum (`FR-ADMIN-005`)
- Viewing author identity on mood/comment in admin detail sets `identityAccessed: true`
- Retention: minimum 2 years (configurable); never hard-delete in normal operations
- Separate from application request logs (`architecture.md` Logging Strategy) — this is durable compliance storage

---

## Collection Relationships

### Entity Relationship Overview

```
users ──────────────┬──────────────────────────────────────────┐
  │                 │                                          │
  │ facultyId       │ majorId                                  │
  ▼                 ▼                                          │
faculties ◄─── majors                                          │
  │                 │                                          │
  │                 │                                          │
  └────────┬────────┘                                          │
           │                                                   │
           ▼                                                   │
        moods ◄── authorId (INTERNAL) ──────────────────────────┘
           │
     ┌─────┼─────┬──────────┬────────────┐
     │     │     │          │            │
     ▼     ▼     ▼          ▼            ▼
moodimages  moodtags   comments    bookmarks    reactions
              │           │                       (also → comments)
              ▼           │
            tags          ├── reports ◄── users (reporterId)
                          │
                    notifications ◄── users

emotionstatistics ──► tags, faculties, majors
dailystatistics   ──► tags, faculties, majors

auditlogs ──► users (adminId)
```

### Relationship Matrix

| From | To | Type | FK field | Notes |
|------|-----|------|----------|-------|
| `users` | `faculties` | N:1 | `facultyId` | Affiliation |
| `users` | `majors` | N:1 | `majorId` | Affiliation |
| `majors` | `faculties` | N:1 | `facultyId` | Major belongs to faculty |
| `moods` | `users` | N:1 | `authorId` | **Internal; anonymity** |
| `moods` | `faculties` | N:1 | `facultyId` | Context |
| `moods` | `majors` | N:1 | `majorId` | Context |
| `moods` | `tags` | N:1 | `primaryTagId` | Denormalized primary emotion |
| `moodtags` | `moods` | N:1 | `moodId` | Junction |
| `moodtags` | `tags` | N:1 | `tagId` | Junction |
| `moodimages` | `moods` | N:1 | `moodId` | 0–N images per mood |
| `moodimages` | `users` | N:1 | `uploadedBy` | Uploader (internal) |
| `comments` | `moods` | N:1 | `moodId` | |
| `comments` | `users` | N:1 | `authorId` | **Internal** |
| `comments` | `comments` | N:1 | `parentId` | Threading (optional) |
| `reactions` | `users` | N:1 | `userId` | **Internal** |
| `reactions` | `moods`/`comments` | N:1 | `targetId` | Polymorphic |
| `bookmarks` | `users` | N:1 | `userId` | Private |
| `bookmarks` | `moods` | N:1 | `moodId` | Unique pair |
| `reports` | `users` | N:1 | `reporterId` | Hidden from author |
| `reports` | `moods`/`comments` | N:1 | `targetId` | Polymorphic |
| `notifications` | `users` | N:1 | `userId` | Recipient |
| `emotionstatistics` | `tags` | N:1 | `tagId` | |
| `emotionstatistics` | `faculties`/`majors` | N:1 | `scopeId` | Polymorphic scope |
| `dailystatistics` | `tags` | N:1 | `tagId` | Optional per-tag |
| `dailystatistics` | `faculties`/`majors` | N:1 | `scopeId` | |
| `auditlogs` | `users` | N:1 | `adminId` | Administrator |

### Cardinality Summary

| Relationship | Cardinality |
|--------------|-------------|
| User → Moods authored | 1:N |
| Mood → Images | 1:N (0+ allowed) |
| Mood → Tags | N:M via `moodtags` |
| Mood → Comments | 1:N |
| User → Reaction per target | 1:N (max 7 emoji) |
| User → Bookmark per mood | 1:1 (unique) |
| Faculty → Majors | 1:N |
| Faculty → Moods | 1:N |

---

## Index Strategy

### Design Principles

| Principle | Application |
|-----------|-------------|
| **Query-driven** | Every index supports a documented repository query or aggregation pipeline |
| **ESR rule** | Equality fields first, Sort fields second, Range fields last in compound indexes |
| **Partial indexes** | Unique `email` only where `deletedAt: null`; active content indexes include `status` |
| **Avoid over-indexing** | Each index adds write cost on hot paths (`moods`, `reactions`); review quarterly |
| **Covered projections** | Feed queries project only needed fields; indexes support sort + filter without collection scan |

### Unique Indexes

| Collection | Index | Reason |
|------------|-------|--------|
| `users` | `{ email: 1 }` partial | One account per email |
| `faculties` | `{ slug: 1 }` | URL routing |
| `majors` | `{ facultyId: 1, slug: 1 }` | Scoped slug uniqueness |
| `moodimages` | `{ objectKey: 1 }` | One DB row per R2 object |
| `reactions` | `{ userId: 1, targetType: 1, targetId: 1, emoji: 1 }` | One row per emoji per user per target |
| `bookmarks` | `{ userId: 1, moodId: 1 }` | One bookmark per pair |
| `moodtags` | `{ moodId: 1, tagId: 1 }` | No duplicate tag on mood |
| `tags` | `{ type: 1, slug: 1 }` | Unique tag slugs per type |
| `emotionstatistics` | scope + tag + period compound | One rollup cell |
| `dailystatistics` | date + scope + tag compound | One bucket per day |

### Compound Indexes (Critical Paths)

| Query pattern | Index |
|---------------|-------|
| Global feed, newest first | `moods: { status: 1, createdAt: -1 }` |
| Faculty feed | `moods: { status: 1, facultyId: 1, createdAt: -1 }` |
| Major feed | `moods: { status: 1, majorId: 1, createdAt: -1 }` |
| Filter by emotion | `moodtags: { tagId: 1, moodId: 1 }` + `moods` status filter |
| Comments on mood | `comments: { moodId: 1, status: 1, createdAt: 1 }` |
| Admin report queue | `reports: { status: 1, createdAt: 1 }` |
| User notifications | `notifications: { userId: 1, isRead: 1, createdAt: -1 }` |
| Statistics time range | `dailystatistics: { scopeType: 1, scopeId: 1, date: -1 }` |

### Text Indexes

| Collection | Index | Usage |
|------------|-------|-------|
| `moods` | `{ content: "text" }` | `FR-SRCH-001` full-text search |

**Text search notes:**

- Default language: English (`ASM-006`)
- Combine text search with equality filters on `facultyId`, `majorId`, `status` via compound query pattern
- If text search volume grows, evaluate Atlas Search migration (future scalability)

### Performance Considerations

| Concern | Mitigation |
|---------|------------|
| Feed p95 500ms (`NFR-PERF-001`) | Indexed sorts + denormalized counts; limit page size (default 20) |
| Statistics p95 2s (`NFR-PERF-004`) | Read `emotionstatistics` / `dailystatistics`, not live scan of `moods` |
| Write contention on popular moods | Atomic `$inc` on `reactionSummary` and `commentCount` |
| Large skip offset pagination | Avoid offset pagination; use cursor on `(createdAt, _id)` per `docs/requirements.md` (`OD-005`) |
| Working set memory | Monitor Atlas metrics; archive old `dailystatistics` beyond 2 years to cold storage (future) |

---

## Soft Delete Strategy

| Collection | Strategy | Mechanism | Public visibility |
|------------|----------|-----------|-------------------|
| `users` | **Soft delete** | `deletedAt`, `status: suspended` | Cannot login; content policy per moderation |
| `faculties` | **Deactivate** | `isActive: false` | Hidden from pickers; historical moods retain ref |
| `majors` | **Deactivate** | `isActive: false` | Same as faculties |
| `moods` | **Soft delete** | `deletedAt`, `status` enum | Excluded from feeds (`BR-CNT-004`) |
| `moodimages` | **Soft delete** | `deletedAt`, `status: deleted` | Hidden; R2 object scheduled for removal |
| `comments` | **Soft delete** | `deletedAt`, `status` enum | Excluded from comment lists |
| `reactions` | **Hard delete** | Document removed on unreact | N/A |
| `reports` | **No delete** | Status transitions only | Admin history preserved |
| `notifications` | **Hard delete** (optional TTL) | User dismiss or TTL job | N/A |
| `bookmarks` | **Hard delete** | Document removed on unbookmark | N/A |
| `tags` | **Deactivate** | `isActive: false` | Hidden from pickers; historical stats retain |
| `moodtags` | **Retain** | Kept with soft-deleted mood for audit | N/A |
| `emotionstatistics` | **Overwrite** | Job upserts by key | N/A |
| `dailystatistics` | **Overwrite** | Job upserts by key | N/A |
| `auditlogs` | **Append-only** | Never deleted in normal ops | Admin only |

**Moderation vs author delete:**

| `status` value | Set by | Feed visible |
|----------------|--------|:------------:|
| `active` | default | ✓ |
| `deleted_by_author` | student | ✗ |
| `moderated_removed` | admin | ✗ |
| `hidden` | admin pending review | ✗ |

---

## Timestamp Strategy

### Standard Fields

| Field | Collections | Behavior |
|-------|-------------|----------|
| `createdAt` | All 15 | Set once at insert; **immutable** on `moods` per `FR-POST-006` |
| `updatedAt` | All except `auditlogs` | Mongoose `timestamps: true`; updated on any modification |
| `deletedAt` | `users`, `moods`, `comments`, `moodimages` | Set on soft delete; `null` means active |

### Additional Temporal Fields

| Field | Collection | Purpose |
|-------|------------|---------|
| `editedAt` | `moods` | Author edit within policy window |
| `moderatedAt` | `moods`, `comments` | Admin action time |
| `confirmedAt` | `moodimages` | R2 upload confirmed |
| `readAt` | `notifications` | User read timestamp |
| `resolvedAt` | `reports` | Admin resolution time |
| `lastLoginAt` | `users` | Auth tracking |
| `lastActivityAt` | `moods` | Feed sort by engagement |
| `calculatedAt` | `emotionstatistics`, `dailystatistics` | Aggregation job freshness |
| `date` | `dailystatistics` | UTC bucket key |

### Timezone

All stored dates are **UTC** (`BR-STAT-002`). Application layer converts to local display in frontend. Daily buckets use UTC midnight boundaries.

---

## Anonymous Posting Strategy

### Problem

Students must be authenticated to post (`BR-AUTH-001`), but their identity must not appear to other users (`BR-ANON-001`, `NFR-PRIV-003`). The database must support **ownership** (edit, delete, bookmark) and **moderation** (admin, reports) without enabling **de-anonymization** in public paths.

### Storage Model

| Collection | Identity field | Stored | Public API | Admin API |
|------------|----------------|:------:|:----------:|:---------:|
| `moods` | `authorId` | ✓ | ✗ | ✓ (audit-logged) |
| `comments` | `authorId` | ✓ | ✗ | ✓ (audit-logged) |
| `reactions` | `userId` | ✓ | ✗ | ✗ (counts only) |
| `moodimages` | `uploadedBy` | ✓ | ✗ | ✓ |
| `reports` | `reporterId` | ✓ | ✗ | ✓ |
| `bookmarks` | `userId` | ✓ | ✗ (owner only) | ✗ |

### Enforcement Layers

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Repository projection profiles                           │
│    publicProfile: { exclude authorId, uploadedBy, userId }  │
│    adminProfile:  { include authorId with audit trigger }   │
├─────────────────────────────────────────────────────────────┤
│ 2. Application DTO mappers (architecture.md)                  │
│    Strip identity before response serialization             │
├─────────────────────────────────────────────────────────────┤
│ 3. Automated tests                                          │
│    Assert no identity fields in public DTO snapshots        │
├─────────────────────────────────────────────────────────────┤
│ 4. Statistics gating                                        │
│    meetsThreshold prevents small-N deanonymization          │
└─────────────────────────────────────────────────────────────┘
```

### Ownership Checks

Application services verify `authorId === currentUserId` for edit/delete — without exposing `authorId` in API responses. The check runs server-side only.

### What Public Documents Contain

Public mood documents include: `_id`, `content`, `facultyId`, `majorId`, `primaryTagId` (or expanded tag), `commentCount`, `reactionSummary`, `imageCount`, `createdAt`, `lastActivityAt` — **never** `authorId`, `email`, or derivable identity.

---

## Cloudflare R2 Integration

### Why Images Are NOT Stored in MongoDB

| Reason | Requirement |
|--------|-------------|
| **Binary size** | Images would bloat documents and degrade feed performance |
| **16 MB BSON limit** | Large uploads would exceed MongoDB document limits |
| **Independent scaling** | R2 scales storage without Atlas growth (`NFR-SCALE-002`) |
| **Bandwidth** | Direct client↔R2 upload bypasses Railway (`FR-IMG-007`) |
| **Architecture mandate** | `INT-DB-003`, `BR-IMG-003` |

### MoodImages Collection Role

`moodimages` is the **system of record for image metadata** — the link between application logic and R2 objects:

| Stored in MongoDB | Stored in R2 |
|-------------------|--------------|
| `objectKey` | Binary image bytes |
| `mimeType`, `fileSizeBytes` | |
| `status`, `moodId`, `sortOrder` | |
| `_id` (image reference for API) | |

### Object Key Storage

| Property | Convention |
|----------|------------|
| **Format** | `{environment}/uploads/{userId}/{uuid}.{ext}` — exact pattern in `docs/cloudflare-r2.md` |
| **Uniqueness** | Unique index on `objectKey` |
| **Immutability** | Key does not change after creation; new upload = new row |
| **No URLs in DB** | Never persist presigned or signed URLs — generated ephemeral at API layer |

### Signed URLs

| Operation | URL type | Generated by |
|-----------|----------|--------------|
| Upload | Presigned PUT | Backend `ImageService` → R2 adapter |
| Download | Presigned GET (signed) | Backend after authorization check |
| Lifetime | Short TTL (e.g., 15 min upload, 1 hr download — TBD `cloudflare-r2.md`) | |

API returns signed URL to client; client fetches directly from R2. MongoDB only involved for authorization and `objectKey` lookup.

### Delete Flow

```
1. User or admin deletes mood
       │
       ▼
2. moods.status → deleted; moods.deletedAt → now
       │
       ▼
3. All moodimages for moodId → status: deleted, deletedAt set
       │
       ▼
4. Background job reads deleted moodimages
       │
       ▼
5. R2 DeleteObject for each objectKey
       │
       ▼
6. Optional: hard-remove moodimages rows after R2 confirm (or retain for audit)

Orphan flow (BR-IMG-004):
  pending/confirmed without moodId + age > TTL → orphaned → R2 delete → row removed
```

---

## Aggregation Strategy

All pipelines run as **scheduled background jobs** or **on-demand admin refresh** — not on every student feed request. Descriptions below omit implementation syntax per document scope.

### Dashboard (Platform Overview)

**Source collections:** `emotionstatistics`, `dailystatistics`, `moods` (counts only)

**Pipeline design:**

1. Read `emotionstatistics` where `scopeType: platform`, `periodType: rolling_30d`, `meetsThreshold: true`
2. Sort by `rank` or `moodCount` descending for distribution chart
3. Read `dailystatistics` where `scopeType: platform`, `tagId: null`, last 30 UTC days, `meetsThreshold: true`
4. Sum `moodCount`, `commentCount`, `reactionCount` for KPI cards
5. Return time-series array ordered by `date` ascending for line chart

**Output:** Statistics Dashboard KPI row + charts (`DESIGN.md`)

---

### Faculty Statistics

**Source collections:** `moods`, `moodtags`, `tags`, `dailystatistics`, `emotionstatistics`

**Pipeline design:**

1. Parameter: `facultyId`, date range `[startDate, endDate]`
2. Count active moods where `facultyId` matches and `createdAt` in range and `status: active`
3. If count < aggregation threshold → return threshold-not-met response (`BR-STAT-001`)
4. Join `moodtags` → `tags` where `type: emotion`; group by `tagId`, count moods
5. Compute percentage = tag count / total moods × 100
6. Upsert into `emotionstatistics` with `scopeType: faculty`, `scopeId: facultyId`
7. For time series: group by UTC day from `moods.createdAt`, write/update `dailystatistics`

**Output:** Faculty-scoped distribution + trend (`FR-STAT-004`)

---

### Major Statistics

**Pipeline design:**

1. Same as faculty statistics with `majorId` filter on `moods`
2. `scopeType: major`, `scopeId: majorId` in statistics collections
3. Threshold applied to major population — critical for small majors (de-anonymization risk)

**Output:** Major page sidebar and statistics drill-down

---

### Trending Emotions

**Source collections:** `dailystatistics`, `emotionstatistics`, optionally live `moods` for freshness

**Pipeline design:**

1. Parameter: `scopeType`, `scopeId`, window = last 7 days vs prior 7 days
2. Sum `moodCount` by `tagId` from `dailystatistics` for current window
3. Sum same for prior window
4. Compute delta = current − prior; compute velocity = delta / prior (handle zero prior)
5. Filter tags where `meetsThreshold: true` in current window
6. Sort by delta descending; return top N (e.g., 5) with trend direction indicator (`FR-TREND-004`)
7. Version algorithm; store `algorithmVersion` (`BR-STAT-003`)

**Output:** Trending page and feed right rail widget (`FR-TREND-001`)

---

### Daily Statistics

**Source collections:** `moods`, `comments`, `reactions`

**Pipeline design (nightly job):**

1. For each UTC day D (usually yesterday):
2. For each scope tuple `(platform, null)`, `(faculty, facultyId)`, `(major, majorId)`:
3. Count moods created on D with matching scope
4. Count comments on moods in scope where `comments.createdAt` on D
5. Count reactions on content in scope where `reactions.createdAt` on D
6. Optionally compute `uniqueParticipantCount` from distinct `authorId` / `userId` — **internal only**
7. Set `meetsThreshold` if mood count for scope-day ≥ minimum
8. Upsert `dailystatistics` document for each `(date, scope, tagId)` combination
9. Per-tag buckets: repeat grouping joined with `moodtags` for emotion breakdown

**Schedule:** Daily 01:00 UTC (`BR-STAT-002`)

---

### Weekly Statistics

**Pipeline design:**

1. Sum `dailystatistics` where `date` in last 7 UTC days for given scope
2. Aggregate `moodCount`, `commentCount`, `reactionCount` across days
3. Recompute `meetsThreshold` on weekly total (stricter or same threshold — configurable)
4. May cache as `periodType: rolling_7d` in `emotionstatistics` for fast reads

**Output:** Weekly filter on statistics dashboard date picker

---

### Monthly Statistics

**Pipeline design:**

1. Sum `dailystatistics` for calendar month UTC boundaries
2. Group by `tagId` for monthly emotion distribution
3. Store as `periodType: rolling_30d` or calendar month key in `emotionstatistics`
4. Supports semester views via custom date range in application layer

---

### Top Active Faculties

**Source collections:** `dailystatistics`, `faculties`, `moods`

**Pipeline design:**

1. Parameter: window = last 7 or 30 days
2. From `dailystatistics` where `scopeType: faculty`, `tagId: null`, sum `moodCount` + `commentCount` + `reactionCount` per `scopeId`
3. Join `faculties` for name and slug
4. Filter faculties where sum ≥ threshold
5. Sort by activity score descending; limit top 10
6. Return faculty name, slug, activity score — no user-level data

**Output:** Admin overview KPI or platform trending context

---

### Most Used Emotions

**Source collections:** `emotionstatistics`, `tags`

**Pipeline design:**

1. Read `emotionstatistics` for scope + `periodType: rolling_30d`
2. Filter `meetsThreshold: true`
3. Sort by `moodCount` descending
4. Join `tags` for `name`, `colorToken`, `iconKey`
5. Return ordered list with percentage and rank

**Output:** Statistics distribution chart, Emotion Badge context in trending

---

### Aggregation Threshold Enforcement

| Stage | Behavior |
|-------|----------|
| **Job write** | Set `meetsThreshold` on statistics documents during upsert |
| **API read** | Return counts only when `meetsThreshold: true`; otherwise return category with suppressed counts |
| **Minimum value** | `AGGREGATION_THRESHOLD_MIN` env var; default **5** (`docs/security.md`, `OD-010` resolved) |

---

## Future Scalability

### Multiple Images

**Current support:** `moodimages` collection with `sortOrder` and `imageCount` on `moods` (`FR-IMG-001`).

**Future:** Raise per-mood image limit via configuration; gallery component already designed (`DESIGN.md`). No schema change required — add rows to `moodimages`.

### AI Emotion Analysis

**Future fields (optional):**

| Collection | Field | Purpose |
|------------|-------|---------|
| `moods` | `aiSuggestedTagIds` | ML-proposed tags (advisor-only, never public auto-apply) |
| `moods` | `sentimentScore` | Internal -1 to 1 float |
| `tags` | `type: ai_cluster` | Discovered emotion clusters |

Statistics jobs could incorporate `sentimentScore` averages. Anonymity preserved — no new identity fields.

### Moderation

**Current:** `reports`, `auditlogs`, moderation fields on `moods`/`comments`.

**Future:**

| Enhancement | Schema impact |
|-------------|---------------|
| Auto-flag keywords | `moods.moderationFlags: []` |
| Moderation queue priority | `reports.priority`, `reports.autoFlagged` |
| User strike count | `users.strikeCount` |
| IP ban | New `blockedips` collection — requires ADR (outside current 15) or embed in config |

Prefer application config over new collections until ADR approved.

### Notifications

**Current:** `notifications` collection ready for Phase 3.

**Future:** `users.notificationPreferences` object; optional `notifications.channelDelivery` subdocument for push token metadata on `users` (not new collection).

### Mobile App

**Impact:** None on schema — same REST API and JWT. Optional `users.deviceTokens: []` for push. React Native client consumes identical DTOs.

### Real-Time Features

**Future (README Future Improvements):**

| Feature | Approach |
|---------|----------|
| Live feed updates | Change streams on `moods` via MongoDB Change Streams → WebSocket fanout |
| Live notification count | Poll `notifications` or subscribe to change stream |

Schema unchanged; read path adds pub/sub layer on Railway.

### Multi-University (Tenant Isolation)

**Future:** Add `tenantId` or `universityId` to `users`, `faculties`, `majors`, `moods`, statistics scopes. Compound indexes prefixed with `tenantId`. Single-university assumption today (`ASM-004`).

### Atlas Search

Replace text index on `moods.content` with Atlas Search for relevance ranking and faceted search — no collection structure change.

### Sharding

When `moods` exceeds single-shard capacity, shard key `{ facultyId: 1, createdAt: 1 }` keeps faculty feeds co-located.

---

## Best Practices

### Adopted by This Project

| Practice | Implementation |
|----------|----------------|
| **Repository pattern** | All DB access through Mongoose repository implementations of domain ports (`NFR-MAINT-003`) |
| **Schema validation** | Mongoose schema validators + application Zod at API boundary |
| **Least privilege** | Atlas database user with readWrite on app DB only; no admin credentials in app |
| **Connection pooling** | Mongoose default pool; tune per Railway instance count |
| **Index monitoring** | Review slow query logs in Atlas; use `explain()` in staging |
| **Denormalize deliberately** | `commentCount`, `reactionSummary` on `moods` — update atomically |
| **Idempotent jobs** | Statistics upserts use unique compound keys — safe to rerun |
| **UTC everywhere** | All buckets and ranges in UTC (`BR-STAT-002`) |
| **No binary in DB** | Images in R2 only (`INT-DB-003`) |
| **Append-only audit** | `auditlogs` never updated or deleted |
| **Soft delete user content** | Preserve for moderation and audit (`BR-CNT-004`) |
| **Projection discipline** | Public queries use explicit `.select()` excluding identity fields |
| **Pagination always** | No unbounded `find()` on feeds (`NFR-SCALE-004`) |
| **Environment separation** | Distinct Atlas databases/clusters per dev, staging, production |
| **Backup verification** | Quarterly restore drill on Atlas backup snapshots |
| **Migration discipline** | Schema changes versioned in migration scripts; document in changelog |
| **Seed data** | `faculties`, `majors`, `tags` (emotions) seeded per environment |
| **Secrets** | Connection strings in Railway secrets only (`NFR-SEC-006`) |

### Anti-Patterns to Avoid

| Anti-pattern | Why |
|--------------|-----|
| Embedding unbounded comments in `moods` | Document growth, pagination failure |
| Returning `authorId` in feed API | Violates anonymity (`BR-ANON-001`) |
| Storing presigned URLs | Expire quickly; security risk |
| Live aggregating all moods for dashboard | Violates p95 2s target (`NFR-PERF-004`) |
| Hard-deleting `auditlogs` | Compliance and accountability loss |
| Direct Mongoose in controllers | Violates Clean Architecture (`NFR-MAINT-001`) |
| Skip index on `status` + `createdAt` | Collection scans on every feed load |

---

## Related Documents

| Document | Content |
|----------|---------|
| [`README.md`](../README.md) | Stack, goals, image strategy overview |
| [`SPECS.md`](../SPECS.md) | Functional requirements and business rules |
| [`DESIGN.md`](../DESIGN.md) | UI pages driving query patterns |
| [`architecture.md`](./architecture.md) | Layer boundaries, repositories, data flows |
| [`api.md`](./api.md) | REST contracts referencing these entities (to be authored) |
| [`authentication.md`](./authentication.md) | JWT strategy for `users` |
| [`cloudflare-r2.md`](./cloudflare-r2.md) | Object key format, MIME allowlist, TTLs |
| [`security.md`](./security.md) | Threat model, threshold policies |
| [`deployment.md`](./deployment.md) | Atlas provisioning, connection strings |
| [`.cursor/rules/database.mdc`](../.cursor/rules/database.mdc) | AI enforcement rules |

---

## Document Maintenance

| Event | Action |
|-------|--------|
| New field added | Update collection spec, indexes, relationships |
| Open decision resolved (`OD-010`, `OD-013`) | Update validation and business rules |
| API contract change | Sync with `docs/api.md` |
| Performance issue | Add index or denormalization; record in `PROJECT_AUDIT.md` |
| New collection proposed | Requires ADR — project locked to 15 collections |

---

*This document is the definitive MongoDB schema reference for Mood of the Major. All Mongoose models, repository implementations, and aggregation jobs must conform to these specifications.*
