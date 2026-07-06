# Mood of the Major — Extended Requirements

> **Document type:** Business rules and open-decision resolution  
> **Status:** Draft v1.0  
> **Authority:** Derives from [`SPECS.md`](../SPECS.md). Where conflict exists, `README.md` takes precedence, then `SPECS.md`, then this document for business-rule detail.

This document captures **resolved business rules** and **remaining open decisions** referenced from `SPECS.md` §14. API contracts live in [`api.md`](./api.md); persistence in [`database.md`](./database.md).

---

## Resolved Decisions

| ID | Decision | Resolution |
|----|----------|------------|
| **OD-001** | TypeScript as project standard | **Confirmed.** TypeScript on frontend and backend (`NFR-MAINT-005`). |
| **OD-002** | Guest / unauthenticated feed access | **Public read** on mood, faculty, major, and trending endpoints without JWT. Guests receive the same anonymous DTOs as authenticated users. **Limits:** default `limit` capped at **10** (max 20); no `isBookmarked`; no feed personalization (`FR-FEED-007`). Full search (`GET /moods/search`) requires authentication. See [`api.md`](./api.md) feed endpoints. |
| **OD-003** | JWT refresh token strategy | **Resolved** in [`authentication.md`](./authentication.md): opaque refresh token, HttpOnly cookie (browser), SHA-256 hash on `users`, rotation on refresh, 7-day sliding expiry. |
| **OD-005** | Pagination strategy | **Cursor-based** on all paginated list endpoints (`limit`, `cursor`, `meta.nextCursor`). See [`api.md`](./api.md) §Pagination. |
| **OD-006** | Image limits | **4 images per mood**, **5 MB** per image, MIME allowlist JPEG/PNG/WebP. See [`cloudflare-r2.md`](./cloudflare-r2.md). |
| **OD-010** | Minimum aggregation threshold | **`AGGREGATION_THRESHOLD_MIN` default 5.** See [`security.md`](./security.md). |
| **OD-012** | Post edit window | **24 hours** from `createdAt`. See [`api.md`](./api.md) Update Mood. |
| **OD-013** | Faculty/major on posts | **Optional** on create. If omitted, application defaults from the author's `users.facultyId` / `users.majorId` when set. If both are provided, `majorId` must belong to `facultyId`. |
| **OD-014** | University email domain restriction | **Configurable** via `ALLOWED_EMAIL_DOMAINS` (comma-separated). When unset, any valid email is accepted. When set, registration rejects non-matching domains with `422`. See [`authentication.md`](./authentication.md). |

---

## Business Rules (Extended)

### BR-CNT-003 — Faculty / major association

- Post creation does not require explicit `facultyId` or `majorId` when the user profile carries affiliation defaults.
- At least one emotion tag remains required (`BR-CNT-002`).

### BR-ENG-001 — Student-only public engagement

Anonymous **comments**, **reactions**, and **bookmarks** are **student-only** write operations. Administrators moderate via the admin namespace; they do not post public comments or reactions as part of normal engagement (`api.md`, `authentication.md` §Route Protection).

### BR-IMG-004 — Orphan cleanup scheduling

- Orphan `moodimages` (unlinked after 24h) must be cleaned per [`cloudflare-r2.md`](./cloudflare-r2.md).
- **Scheduled job** ships in Sprint 7 (roadmap). Until then, ops may run manual cleanup against `status: pending` rows older than TTL.

---

## Open Decisions (Remaining)

| ID | Decision | Target phase | Notes |
|----|----------|--------------|-------|
| **OD-004** | Comment model: threaded vs. flat | Phase 2 | API supports `parentId`; max depth and default UX TBD. |
| **OD-007** | Predefined reaction types | Phase 2 | Default set documented in [`glossary.md`](./glossary.md); admin configurability scope TBD. |
| **OD-008** | Notification triggers and channels | Phase 3 | In-app minimum in v1; push deferred. |
| **OD-009** | Student access to statistics dashboard | Phase 3 | API permits `student` role; product gating TBD. |
| **OD-011** | Advisor role: distinct vs. admin subset | Phase 3 | Schema supports `advisor`; assignment and UI TBD. |

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [`SPECS.md`](../SPECS.md) | Formal FR/NFR requirements |
| [`api.md`](./api.md) | REST contracts |
| [`authentication.md`](./authentication.md) | Auth flows and route protection |
| [`cloudflare-r2.md`](./cloudflare-r2.md) | Image limits and R2 workflows |
| [`security.md`](./security.md) | Aggregation threshold and security policy |
