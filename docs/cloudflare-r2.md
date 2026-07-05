# Mood of the Major — Cloudflare R2 Storage Architecture

> **Document type:** Object storage architecture specification  
> **Status:** Draft v1.0  
> **Authority:** Derives from [`README.md`](../README.md), [`SPECS.md`](../SPECS.md), [`DESIGN.md`](../DESIGN.md), [`architecture.md`](./architecture.md), [`database.md`](./database.md), [`api.md`](./api.md), and [`authentication.md`](./authentication.md). Where conflict exists, `README.md` takes precedence.

---

## Table of Contents

1. [Storage Philosophy](#storage-philosophy)
2. [Why Cloudflare R2](#why-cloudflare-r2)
3. [Private Bucket Strategy](#private-bucket-strategy)
4. [Upload Flow](#upload-flow)
5. [Download Flow](#download-flow)
6. [Delete Flow](#delete-flow)
7. [Folder Structure](#folder-structure)
8. [Object Naming Strategy](#object-naming-strategy)
9. [File Validation](#file-validation)
10. [Security](#security)
11. [Database Integration](#database-integration)
12. [Performance Considerations](#performance-considerations)
13. [Cost Optimization](#cost-optimization)
14. [Error Handling](#error-handling)
15. [Future Improvements](#future-improvements)
16. [Related Documents](#related-documents)

---

## Storage Philosophy

Mood of the Major treats **object storage as infrastructure, not application state**. User-uploaded images are binary assets with a separate lifecycle from mood posts, comments, and analytics. The backend orchestrates access; it never becomes a file server.

### Core Principles

| Principle | Rationale |
|-----------|-----------|
| **Private by default** | Objects are never publicly readable. All access is mediated by the backend through time-limited signed URLs (`FR-IMG-003`, `BR-IMG-003`). |
| **Direct client upload** | Clients upload binary data directly to R2 via presigned PUT URLs. Image bytes do not persist on or transit through the Railway application server for storage (`FR-IMG-007`, `INT-R2-002`). |
| **Metadata in MongoDB** | Only object keys, MIME types, sizes, and upload status are stored in the `moodimages` collection — never file binaries (`INT-DB-003`, `FR-IMG-004`). |
| **Authorization is a business rule** | Whether a user may upload or view an image is decided in the application layer (`ImageService`), not by bucket ACLs alone (`architecture.md` ADR-003). |
| **Ephemeral URLs** | Presigned and signed URLs are generated on demand and never persisted in the database (`database.md` Cloudflare R2 Integration). |
| **Environment isolation** | Development, staging, and production each use separate R2 buckets (`architecture.md` Environment Variables). |

### Separation of Concerns

```
┌─────────────────────────────────────────────────────────────┐
│  Application (Express / ImageService)                       │
│  Authorize · validate · issue URLs · record metadata          │
├─────────────────────────────────────────────────────────────┤
│  MongoDB (moodimages)                                       │
│  objectKey · mimeType · status · moodId · uploadedBy        │
├─────────────────────────────────────────────────────────────┤
│  Cloudflare R2 (private bucket)                             │
│  Binary image bytes only                                    │
└─────────────────────────────────────────────────────────────┘
```

The R2 bucket stores **what** was uploaded. MongoDB stores **who** uploaded it, **whether** it is linked to a mood, and **how** to authorize future access. Public API responses expose neither storage internals nor uploader identity.

---

## Why Cloudflare R2

Cloudflare R2 is the mandated object storage layer for Mood of the Major (`README.md` Technology Stack, `INT-R2-001`).

| Factor | Benefit |
|--------|---------|
| **S3-compatible API** | Standard presigned URL workflows; familiar SDK patterns in the infrastructure adapter (`IImageStorage` port). |
| **Zero egress fees to Cloudflare CDN** | Cost-effective image delivery at scale (`README.md` Deployment Overview). |
| **Independent scaling** | Storage growth does not increase Railway memory, disk, or bandwidth (`NFR-SCALE-002`). |
| **Global edge network** | Durable storage with low-latency retrieval once authorized. |
| **Managed operations** | No self-hosted MinIO or filesystem maintenance; aligns with managed-cloud philosophy (`ASM-003`). |
| **Private bucket model** | Native support for denying public reads; all access via signed URLs matches security requirements (`NFR-SEC` threat mitigation for bucket credential exposure). |

### Alternatives Considered (Not Selected)

| Alternative | Why not |
|-------------|---------|
| **MongoDB GridFS** | Violates `INT-DB-003`; bloats documents; poor feed performance |
| **Railway filesystem** | Not durable across deploys; does not scale horizontally |
| **Public CDN bucket** | Violates `BR-IMG-003`; enables hotlinking and unauthorized access |
| **Application server proxy** | Violates `FR-IMG-007`; increases latency and server load |

---

## Private Bucket Strategy

The project uses a **single private Cloudflare R2 bucket per environment**. No object is world-readable.

### Bucket Configuration

| Property | Policy |
|----------|--------|
| **Public access** | Disabled — no public ACLs, no public bucket policy allowing anonymous `GetObject` |
| **Bucket name** | Configured via `R2_BUCKET_NAME` environment variable (`architecture.md`) |
| **Credentials** | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` stored in Railway secrets only (`NFR-SEC-006`) |
| **Client exposure** | R2 API keys are **never** sent to the browser. Clients receive only time-limited presigned URLs (`SPECS.md` §10.1 threat mitigation). |
| **CORS** | Configured to allow `PUT` from Vercel frontend origins for presigned uploads; `GET` for signed downloads. Exact origins mirror `CORS_ALLOWED_ORIGINS`. |

### Access Model

| Actor | R2 access method |
|-------|------------------|
| **Backend (Railway)** | Full SDK access via API keys — used to generate presigned URLs, head objects, delete objects |
| **Browser client** | Presigned PUT (upload) or signed GET (download) only — scoped to one object, time-limited |
| **Unauthenticated users** | No direct R2 access |
| **Public internet** | No permanent URLs; bucket rejects unsigned requests |

### What Private Means in Practice

- Objects cannot be accessed by guessing a URL.
- There is no CDN path that bypasses backend authorization for mood images.
- Even if an `objectKey` leaks in logs or errors, it is useless without a valid signed URL (`NFR-SEC-009` — never expose keys in client error copy).

---

## Upload Flow

Implements `INT-R2-002`, `FR-IMG-002`, `FR-IMG-006`, `FR-IMG-007`. API contracts in `api.md` §Image APIs.

### Sequence

```
Client
  │
  │  POST /api/v1/images/upload-url
  │  { fileName, mimeType, fileSizeBytes }
  ▼
Backend
  │
  │  · Authenticate JWT (student role)
  │  · Validate MIME type and file size
  │  · Generate object key
  │  · Create moodimages record (status: pending)
  │  · Generate presigned PUT URL
  ▼
Generate Presigned Upload URL
  │
  │  Returns: imageId, uploadUrl, uploadMethod, uploadHeaders, expiresAt, objectKey
  ▼
Client
  │
  │  PUT image binary directly to uploadUrl
  │  (Content-Type header must match declared mimeType)
  ▼
Upload directly to Cloudflare R2
  │
  │  Object stored at objectKey in private bucket
  ▼
Client
  │
  │  POST /api/v1/images/:imageId/confirm
  ▼
Backend
  │
  │  · Verify object exists in R2 (head object)
  │  · Optionally read dimensions
  │  · Update moodimages: status → confirmed, confirmedAt
  ▼
Save Object Key in MongoDB
  │
  │  moodimages.objectKey persisted (already set at presign)
  │  Image ready for linking via imageIds on POST /moods
  ▼
Client
  │
  │  POST /api/v1/moods { ..., imageIds: [imageId] }
  │  Backend links moodId on confirmed images
```

### Flow Properties

| Property | Value |
|----------|-------|
| **Binary path** | Client → R2 only. Railway never buffers the file for persistence. |
| **Presign performance** | Target **200 ms p95** (`NFR-PERF-002`). |
| **Upload URL lifetime** | **15 minutes** from issuance |
| **Record before upload** | `moodimages` row created at presign with `status: pending` so `objectKey` is reserved |
| **Confirm required** | Upload is not usable in a mood until confirm succeeds (`FR-IMG-008`) |
| **Ownership** | Only the uploader (`uploadedBy`) may confirm or delete before publish |

### Client UX (DESIGN.md)

The Upload Image component shows per-file progress during the PUT to R2. Users see validation errors for type and size **before** the presign request. Storage internals (bucket name, raw object keys) are not shown in the UI.

---

## Download Flow

Implements `INT-R2-003`, `FR-IMG-005`. API: `GET /api/v1/images/:imageId/url`.

### Sequence

```
Client
  │
  │  GET /api/v1/images/:imageId/url
  │  Authorization: Bearer <accessToken>
  ▼
Backend
  │
  │  · Authenticate JWT
  │  · Load moodimages by imageId
  │  · Authorize: user may view parent mood OR is uploader
  │  · Verify image status is confirmed (not pending/orphaned/deleted)
  ▼
Generate Signed URL
  │
  │  Returns: { url, expiresAt }
  ▼
Client
  │
  │  GET image from signed URL (direct to R2)
  ▼
Access Image
  │
  │  Browser renders image in Mood Card, gallery, or thumbnail
```

### Flow Properties

| Property | Value |
|----------|-------|
| **No permanent URLs** | Every view requires a fresh signed URL or an unexpired cached URL (`BR-IMG-003`) |
| **Download URL lifetime** | **1 hour** from issuance |
| **Authorization context** | User must be able to view the mood the image belongs to; bookmark owners may view images on bookmarked removed moods (`FR-BMK-004`) |
| **URL storage** | Signed URLs are never written to MongoDB |
| **Feed behavior** | Mood feed returns `images: [{ id, sortOrder }]` only; client fetches signed URLs per image when rendering |

### Caching Guidance

The frontend may cache signed URLs in TanStack Query until `expiresAt`. Before expiry, reuse the URL; after expiry, request a new one. Do not persist signed URLs in `localStorage`.

---

## Delete Flow

Implements `FR-IMG-009`, `BR-IMG-004`. Deletes are **soft in MongoDB first**, then **hard in R2** via background processing.

### User-Initiated Image Delete

API: `DELETE /api/v1/images/:imageId`

```
1. Client requests delete (uploader or administrator)
       │
       ▼
2. Backend verifies ownership / admin role
       │
       ▼
3. moodimages.status → deleted
   moodimages.deletedAt → now
       │
       ▼
4. Background job: DeleteObject on R2 for objectKey
       │
       ▼
5. Job confirms deletion; row retained for audit or hard-removed per policy
```

### Mood Delete Cascade

When a mood is deleted (`DELETE /api/v1/moods/:moodId`):

```
1. moods.status → deleted_by_author | moderated_removed
   moods.deletedAt → now
       │
       ▼
2. All moodimages where moodId matches → status: deleted, deletedAt set
       │
       ▼
3. moods.imageCount updated; images hidden from public API
       │
       ▼
4. Background job deletes each objectKey from R2
```

### Orphan Cleanup (`BR-IMG-004`)

Images uploaded but never linked to a published mood:

```
1. Scheduled job queries moodimages where:
     · moodId is null
     · status is pending or confirmed
     · createdAt older than orphan TTL (24 hours)
       │
       ▼
2. status → orphaned
       │
       ▼
3. DeleteObject in R2
       │
       ▼
4. Remove or archive moodimages row
```

Orphans occur when a user uploads images but abandons post creation, or post creation fails after confirm.

### Admin Moderation

Administrators may delete images on moderated content via the same `DELETE /api/v1/images/:imageId` path with administrator authorization. Admin mood removal triggers the same cascade as author delete.

---

## Folder Structure

Objects are organized by **environment prefix**, **content type folder**, and **user scope**. This keeps buckets navigable for operations and supports lifecycle policies per prefix.

### Layout

```
{bucket}/
├── {environment}/
│   ├── moods/
│   │   └── {userId}/
│   │       └── {timestamp}-{uuid}.{ext}
│   ├── avatars/
│   │   └── {userId}/
│   │       └── {timestamp}-{uuid}.{ext}
│   └── temp/
│       └── {userId}/
│           └── {timestamp}-{uuid}.{ext}
```

### Environment Prefix

| Value | Usage |
|-------|-------|
| `development` | Local and shared dev bucket |
| `staging` | Pre-production QA |
| `production` | Live user content |

Each deployment environment uses a **separate bucket**; the prefix provides an additional namespace guard within shared operational tooling.

### Folder Purposes

| Folder | Purpose | Current usage |
|--------|---------|---------------|
| **`moods/`** | Images attached to mood posts | **Primary** — all `FR-IMG-*` uploads use this path |
| **`avatars/`** | Profile or identity images | **Reserved** — not used in v1; `DESIGN.md` prohibits avatars on anonymous public content |
| **`temp/`** | Short-lived staging before confirm | **Optional** — pending uploads may use `temp/` until confirm moves metadata to `moods/` path; if key is assigned at presign, `moods/` is used directly with `status: pending` in MongoDB (preferred v1 approach) |

### v1 Canonical Path

For Phase 2 implementation, mood post images use:

```
{environment}/moods/{userId}/{timestamp}-{uuid}.{ext}
```

Example:

```
production/moods/665a1b2c3d4e5f6789012347/20260705143000-a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg
```

The `temp/` prefix remains available for future multi-step upload flows. The `avatars/` prefix is reserved for authenticated profile features outside anonymous feeds.

---

## Object Naming Strategy

Object keys must be **globally unique**, **non-guessable**, and **immutable** after creation.

### Components

| Component | Source | Purpose |
|-----------|--------|---------|
| **Environment** | Deployment config | Isolates dev/staging/prod within operational tooling |
| **Folder** | Content type (`moods`, `avatars`, `temp`) | Lifecycle and policy grouping |
| **userId** | JWT `sub` at presign | Scopes objects to uploader; supports orphan cleanup queries |
| **Timestamp** | UTC `YYYYMMDDHHmmss` at presign | Ordering, debugging, collision entropy |
| **UUID** | Random UUID v4 | Uniqueness guarantee |
| **Extension** | Derived from validated MIME type | `.jpg`, `.png`, `.webp` — not from client file name alone |

### UUID

- UUID v4 is generated server-side at presign time.
- The UUID is unpredictable — object keys cannot be enumerated.
- A new upload always receives a new UUID; objects are never overwritten in place.

### Timestamp

- Format: `YYYYMMDDHHmmss` in UTC (`BR-STAT-002` timezone policy applies to all platform timestamps).
- Embedded in the key for operational sorting and support investigations.
- Not relied upon for uniqueness alone — UUID provides that guarantee.

### Collision Prevention

| Mechanism | Detail |
|-----------|--------|
| **UUID v4** | ~122 bits of randomness — collision probability negligible |
| **MongoDB unique index** | `{ objectKey: 1 }` unique on `moodimages` prevents duplicate DB references (`database.md`) |
| **Server-side key generation** | Clients never choose the object key — only the backend assigns it at presign |
| **Immutable keys** | Once written to R2, the key does not change; replacement upload creates a new key and new `moodimages` row |

### Key Validation Rules

Stored keys must:

- Be non-empty
- Not contain `..` path traversal
- Not start with `/`
- Match pattern approved in application validator before persistence

---

## File Validation

Validation occurs at **multiple layers** per `architecture.md` Validation Strategy and `BR-IMG-001`, `BR-IMG-002`.

### Validation Layers

| Layer | Checks |
|-------|--------|
| **Client (Upload Image component)** | MIME type, file size — immediate UX feedback (`DESIGN.md`, `NFR-UX-002`) |
| **API presign (`POST /images/upload-url`)** | MIME allowlist, file size, authenticated student role |
| **R2 PUT** | Content-Type header enforced by presigned URL conditions |
| **API confirm (`POST /images/:imageId/confirm`)** | Object exists in R2; optional size match via head object |
| **Mongoose schema** | `mimeType` enum, `fileSizeBytes` positive integer |

### Allowed MIME Types

**Resolves `BR-IMG-001`.** Only these MIME types are accepted:

| MIME type | Extension | Usage |
|-----------|-----------|-------|
| `image/jpeg` | `.jpg` | Photographs, camera uploads |
| `image/png` | `.png` | Screenshots, graphics with transparency |
| `image/webp` | `.webp` | Efficient modern format |

All other types — including `image/gif`, `image/svg+xml`, `image/heic`, and `application/pdf` — are rejected at presign with `422 INVALID_MIME_TYPE`.

### Maximum File Size

**Resolves `OD-006` (file size portion).**

| Limit | Value |
|-------|-------|
| **Per image** | **5 MB** (5,242,880 bytes) |
| **API JSON body** | 1 MB (separate limit — image bytes do not pass through API) |

Oversized files are rejected at presign with `422 FILE_TOO_LARGE`. The client should validate size before requesting a presigned URL to avoid unnecessary API calls.

### Maximum Images Per Post

| Limit | Value |
|-------|-------|
| **Per mood post** | **4 images** |

This resolves the count portion of `OD-006`. The create-mood validator rejects `imageIds` arrays longer than 4. Each image must be a `confirmed` `moodimages` document owned by the caller and not yet linked to another mood.

### Image Dimensions

| Rule | Value |
|------|-------|
| **Maximum width** | 4096 px |
| **Maximum height** | 4096 px |
| **Minimum width** | 50 px |
| **Minimum height** | 50 px |
| **Enforcement (v1)** | On confirm — backend reads dimensions from R2 object metadata or image header; rejects if outside bounds with `422 INVALID_IMAGE_DIMENSIONS` |
| **Storage** | Confirmed `width` and `height` optional fields on `moodimages` (`database.md`) |

Dimension validation protects against decompression bombs and abnormally small tracking pixels. Client-side dimension checks are recommended but not required — the backend is authoritative.

### Original File Name

- `originalFileName` from the client is stored on `moodimages` for support/debug purposes.
- It is **not** used in the object key.
- It is **not** exposed in public API responses.

---

## Security

### Signed URLs

| URL type | HTTP method | Issued when | Purpose |
|----------|-------------|-------------|---------|
| **Presigned upload URL** | `PUT` | `POST /images/upload-url` | Authorize one direct client upload to one object key |
| **Signed download URL** | `GET` | `GET /images/:imageId/url` | Authorize one direct client download after access check |

Both URL types are generated by the backend R2 adapter using server-side API credentials. The signing algorithm follows S3-compatible presigned URL semantics.

### Expiration

| URL type | TTL | Rationale |
|----------|-----|-----------|
| **Presigned upload** | **15 minutes** | Enough for mobile uploads; limits exposure if URL is leaked |
| **Signed download** | **1 hour** | Balances repeated feed views against link sharing risk |

Expired URLs return `403` from R2. The client must request a new signed URL from the backend. Expiration timestamps are returned as `expiresAt` in API responses (`api.md`).

### Private Access

| Control | Implementation |
|---------|----------------|
| **Bucket policy** | Deny all public `s3:GetObject` without signature |
| **No public ACLs** | README Infrastructure Security; objects are private |
| **Credential isolation** | R2 keys only on Railway; never in Vercel build env |
| **Presign conditions** | Upload URL bound to specific key, method, and Content-Type |
| **Authorization before sign** | Download URLs issued only after `ImageService` verifies mood visibility |
| **Admin access** | Administrators use the same signed URL flow; no separate public admin CDN |
| **Error responses** | Never include bucket names, raw object keys, or signed URL internals in error messages (`NFR-SEC-009`) |
| **Logging** | Log `objectKey` on R2 failures server-side only — never log full signed URLs (`architecture.md` Logging Strategy) |

### Threat Mitigations

| Threat | Mitigation |
|--------|------------|
| Bucket credential theft | Presigned URLs only to clients; keys in Railway secrets |
| Unauthorized image access | Private bucket + authorization check before signed GET |
| Hotlinking | Time-limited signed URLs; no permanent public links |
| MIME confusion attacks | Allowlist at presign; Content-Type condition on PUT URL |
| Oversized upload abuse | Size validated before presign; optional head-object size check on confirm |

---

## Database Integration

### MoodImages Collection

The `moodimages` collection (`database.md` §5) is the **system of record** for image metadata. It links application logic to R2 objects.

| Stored in MongoDB | Stored in R2 |
|-------------------|--------------|
| `objectKey` | Binary image bytes |
| `mimeType`, `fileSizeBytes` | |
| `status`, `moodId`, `sortOrder` | |
| `uploadedBy` (internal) | |
| `width`, `height` (optional) | |
| `_id` (API image reference) | |

### Object Key

| Property | Detail |
|----------|--------|
| **Field** | `moodimages.objectKey` |
| **Format** | `{environment}/moods/{userId}/{timestamp}-{uuid}.{ext}` |
| **Uniqueness** | Unique index on `objectKey` |
| **Set at** | Presign time, before client PUT |
| **Immutable** | Never updated after creation |

### Metadata

| Field | When set | Notes |
|-------|----------|-------|
| `uploadedBy` | Presign | Internal; links to `users._id` |
| `status` | `pending` → `confirmed` → `deleted` / `orphaned` | Drives API visibility |
| `moodId` | On mood publish | Null during draft upload phase |
| `sortOrder` | On mood publish | Display order for multi-image gallery |
| `confirmedAt` | On successful confirm | After R2 head-object verification |
| `fileSizeBytes` | Presign request body | Declared size; verified on confirm |
| `mimeType` | Presign request body | Must match PUT Content-Type |
| `originalFileName` | Presign request body | Internal only |
| `width`, `height` | Confirm (optional) | Populated if dimension read succeeds |
| `deletedAt` | Delete | Triggers R2 cleanup job |

### Status Lifecycle

```
pending ──confirm──► confirmed ──link moodId──► (in use)
   │                    │
   │                    └──delete──► deleted ──job──► R2 removed
   │
   └──orphan TTL──► orphaned ──job──► R2 removed
```

### API Integration

| API response field | Source |
|--------------------|--------|
| `imageId` | `moodimages._id` |
| `images[].id` on mood DTO | `moodimages._id` |
| `images[].sortOrder` | `moodimages.sortOrder` |
| Signed `url` | Generated at read time from `objectKey` — not stored |

Public mood responses never include `objectKey`, `uploadedBy`, or `originalFileName`.

---

## Performance Considerations

| Concern | Strategy |
|---------|----------|
| **Presign latency** | Target **200 ms p95** (`NFR-PERF-002`). Minimize work in presign handler: validate, generate UUID, single DB insert, sign URL. |
| **Upload bandwidth** | Direct client→R2 bypasses Railway entirely (`NFR-SCALE-002`). |
| **Download bandwidth** | Same — signed GET goes direct to R2. |
| **Feed performance** | Mood feed returns image IDs only; lazy-fetch signed URLs per visible card (`NFR-PERF-001`). |
| **Connection pooling** | R2 SDK client instantiated once per Railway instance. |
| **Head object on confirm** | Single HEAD request; acceptable latency for confirm endpoint. |
| **Background deletes** | R2 `DeleteObject` runs in async job — not on critical request path. |
| **Horizontal scaling** | Stateless presign and sign operations scale with Railway replicas (`NFR-SCALE-003`). |
| **Client progress** | Upload Image component shows per-file progress during PUT (`DESIGN.md` Loading States). |

### Graceful Degradation

When R2 is temporarily unavailable (`NFR-AVAIL-003`):

- Presign and confirm endpoints return `500` with generic message.
- Client shows calm upload error with retry (`DESIGN.md` Error States).
- No partial mood publishes with missing image verification.

---

## Cost Optimization

| Strategy | Detail |
|----------|--------|
| **Zero egress to Cloudflare** | R2 has no egress fees to Cloudflare CDN — prefer Cloudflare network paths (`README.md`). |
| **No binary on Railway** | Eliminates double bandwidth (client→server→storage). |
| **Orphan cleanup** | Scheduled job removes unused objects within 24 hours (`BR-IMG-004`) — prevents storage creep from abandoned uploads. |
| **Delete cascade** | Mood deletion removes associated R2 objects — no indefinite orphan storage. |
| **Separate buckets per environment** | Prevents test data accumulation in production bucket. |
| **Reasonable size cap** | 5 MB per image limits storage per object. |
| **4 images per mood cap** | Bounds storage per post. |
| **No image transformations in v1** | Store single original; avoid duplicate variants (thumbnail, full) until needed. |
| **Lifecycle policies (future)** | Optional R2 lifecycle rules to purge `temp/` prefix after 1 day. |

---

## Error Handling

### API Error Codes (Image Domain)

Aligned with `api.md` Shared Schemas:

| Code | HTTP | When |
|------|------|------|
| `INVALID_MIME_TYPE` | 422 | MIME not in allowlist at presign |
| `FILE_TOO_LARGE` | 422 | `fileSizeBytes` exceeds 5 MB |
| `INVALID_IMAGE_DIMENSIONS` | 422 | Dimensions outside bounds on confirm |
| `UPLOAD_NOT_FOUND_IN_R2` | 422 | Confirm failed — object not in bucket |
| `RESOURCE_NOT_FOUND` | 404 | `imageId` does not exist or not visible |
| `NOT_OWNER` | 403 | User is not uploader for confirm/delete |
| `FORBIDDEN` | 403 | User cannot view parent mood for signed URL |
| `RATE_LIMIT_EXCEEDED` | 429 | Upload URL requests throttled |
| `INTERNAL_ERROR` | 500 | R2 SDK failure, unexpected error |

### Backend Behavior

| Scenario | Handling |
|----------|----------|
| **R2 unavailable at presign** | Return `500 INTERNAL_ERROR`; log at `error` with `objectKey` operation context; do not create `moodimages` row if sign fails after insert — use transaction or compensating delete |
| **R2 unavailable at confirm** | Return `500`; `moodimages` remains `pending`; client may retry confirm |
| **PUT fails client-side** | Client shows per-file error; user may retry presign flow (new `imageId`) |
| **Confirm after expired presign window** | If object exists in R2 but confirm delayed, confirm may still succeed if row is `pending` |
| **Delete R2 object not found** | Treat as success (idempotent delete); update MongoDB status |

### Client Behavior (DESIGN.md)

| Scenario | User-facing behavior |
|----------|---------------------|
| **Type/size rejection** | Inline error before upload starts |
| **Upload failure** | Per-file message with retry and remove options |
| **Image display failure** | Broken image placeholder; retry load via new signed URL |
| **Expired signed URL** | Transparent re-fetch of `GET /images/:id/url` |

Never expose `objectKey`, bucket name, or R2 error XML in user-facing copy.

---

## Future Improvements

Aligned with README Future Improvements and items deferred beyond Phase 2.

| Area | Enhancement |
|------|-------------|
| **Image transformations** | On-the-fly resize via Cloudflare Images or worker-based thumbnails for feed performance |
| **WebP conversion** | Server-side normalize uploads to WebP for storage efficiency |
| **Virus/malware scanning** | Scan objects on confirm before marking `confirmed` |
| **Content moderation vision** | Automated NSFW detection on upload; quarantine prefix before publish |
| **CDN custom domain** | Serve signed URLs through a branded `media.` subdomain |
| **Lifecycle policies** | Automatic expiration rules on `temp/` and `orphaned` prefixes |
| **Multipart upload** | Support files larger than 5 MB with S3 multipart presign for future media types |
| **Audio/video moods** | Extend folder structure (`media/`) — noted in `DESIGN.md` Future UI |
| **Avatar storage** | Activate `avatars/` prefix if profile images are added for authenticated-only settings |
| **Cross-region replication** | R2 replication for disaster recovery if uptime requirements tighten |
| **Upload resumption** | Client resume interrupted PUT with multipart or ranged upload |
| **Per-university buckets** | Tenant-isolated buckets for multi-university support (`ASM-004` future) |

---

## Related Documents

| Document | Content |
|----------|---------|
| [`README.md`](../README.md) | Image storage strategy overview |
| [`SPECS.md`](../SPECS.md) | `FR-IMG-*`, `BR-IMG-*`, `INT-R2-*` requirements |
| [`architecture.md`](./architecture.md) | `IImageStorage` port, data flows, env vars |
| [`database.md`](./database.md) | `moodimages` collection schema |
| [`api.md`](./api.md) | Image API endpoints and error codes |
| [`authentication.md`](./authentication.md) | Upload authorization (student role, JWT) |
| [`deployment.md`](./deployment.md) | R2 bucket provisioning (to be authored) |
| [`security.md`](./security.md) | Threat model (to be authored) |
| [`DESIGN.md`](../DESIGN.md) | Upload Image component UX |

---

## Resolved Open Decisions

| ID | Resolution in this document |
|----|----------------------------|
| `OD-006` | Max file size: **5 MB**; max images per post: **4** |
| `BR-IMG-001` | MIME allowlist: `image/jpeg`, `image/png`, `image/webp` |
| Object key format | `{environment}/moods/{userId}/{timestamp}-{uuid}.{ext}` |
| Upload URL TTL | **15 minutes** |
| Download URL TTL | **1 hour** |
| Orphan TTL | **24 hours** |

---

## Document Maintenance

| Event | Action |
|-------|--------|
| Limit or MIME change | Update File Validation; sync `api.md` and `database.md` |
| New folder prefix | Update Folder Structure and object key format |
| R2 SDK or bucket policy change | Update Private Bucket Strategy |
| Performance incident | Update Performance Considerations; log in `PROJECT_AUDIT.md` |

---

*This document defines the complete Cloudflare R2 storage architecture for Mood of the Major. All image storage implementation must conform to these specifications.*
