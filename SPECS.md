# Mood of the Major — System Specifications

> **Document type:** Functional and non-functional specifications  
> **Status:** Draft v1.0  
> **Authority:** This document derives from and must not contradict [`README.md`](./README.md). Where conflict exists, `README.md` takes precedence.

---

## Table of Contents

1. [Purpose & Scope](#1-purpose--scope)
2. [References & Document Hierarchy](#2-references--document-hierarchy)
3. [System Context](#3-system-context)
4. [Glossary](#4-glossary)
5. [User Roles & Permissions](#5-user-roles--permissions)
6. [Functional Requirements](#6-functional-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Business Rules & Constraints](#8-business-rules--constraints)
9. [Data & Integration Requirements](#9-data--integration-requirements)
10. [Security & Privacy Requirements](#10-security--privacy-requirements)
11. [Acceptance Criteria by Phase](#11-acceptance-criteria-by-phase)
12. [Out of Scope](#12-out-of-scope)
13. [Assumptions & Dependencies](#13-assumptions--dependencies)
14. [Open Decisions](#14-open-decisions)
15. [Requirement Traceability](#15-requirement-traceability)

---

## 1. Purpose & Scope

### 1.1 Purpose

This specification defines **what** the Mood of the Major system must do and **how well** it must perform. It translates the project vision in `README.md` into testable, traceable requirements for product, design, and engineering teams.

### 1.2 Scope

This document covers:

- Functional behavior for all in-scope features listed in the README
- Non-functional quality attributes (performance, security, scalability, maintainability)
- Role-based access expectations at a behavioral level
- Integration requirements for MongoDB Atlas, Cloudflare R2, and deployment platforms
- Phased delivery criteria aligned with the project roadmap

This document does **not** cover:

- API endpoint definitions (see `docs/api.md` — to be authored)
- Database schemas or collection designs (see `docs/database.md` — to be authored)
- UI mockups or visual design (see `DESIGN.md` — to be authored)
- Application source code

### 1.3 Audience

| Audience | Use of this document |
|----------|----------------------|
| Product / stakeholders | Validate feature scope and priorities |
| Engineering | Implement and test against requirements |
| Design | Understand user-facing behavior constraints |
| QA | Derive test cases and acceptance criteria |
| AI agents | Generate code aligned with documented behavior |

---

## 2. References & Document Hierarchy

| Document | Relationship |
|----------|--------------|
| [`README.md`](./README.md) | **Primary source of truth** — goals, stack, architecture, roadmap |
| `SPECS.md` (this file) | Formal requirements derived from README |
| [`docs/requirements.md`](./docs/requirements.md) | Extended requirements detail (future) |
| [`docs/architecture.md`](./docs/architecture.md) | Architectural decisions and layer design |
| [`docs/api.md`](./docs/api.md) | API contracts (future) |
| [`docs/database.md`](./docs/database.md) | Data modeling (future) |
| [`docs/security.md`](./docs/security.md) | Threat model and security policies |
| [`docs/authentication.md`](./docs/authentication.md) | Auth flows and JWT strategy |
| [`docs/cloudflare-r2.md`](./docs/cloudflare-r2.md) | Image storage configuration |
| [`DESIGN.md`](./DESIGN.md) | UI/UX design language |

---

## 3. System Context

Mood of the Major is a full-stack anonymous social platform for university students. Students share emotions, feelings, experiences, and daily thoughts anonymously. The community visualizes the emotional atmosphere of faculties and majors. Aggregated statistics support understanding of student well-being without exposing individual identities.

### 3.1 System Boundaries

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Mood of the Major                          │
│  ┌─────────────┐    REST API    ┌─────────────┐                     │
│  │  Frontend   │◄──────────────►│   Backend   │                     │
│  │ React/Vite  │                │  Express.js │                     │
│  └─────────────┘                └──────┬──────┘                     │
│                                        │                             │
│                         ┌──────────────┼──────────────┐             │
│                         ▼              ▼              ▼             │
│                   MongoDB Atlas   Cloudflare R2   (Future services)  │
└──────────────────────────────────────────────────────────────────────┘
         ▲                                          │
         │ HTTPS                                    │ Managed by
         │                                          │ Vercel / Railway
    University students,                            │
    advisors, administrators                          ▼
                                              GitHub Actions (CI/CD)
```

### 3.2 External Actors

| Actor | Interaction |
|-------|-------------|
| **Student (authenticated)** | Register, login, post, engage, browse feeds, bookmark, search, report |
| **Student (unauthenticated)** | Limited access to public-facing content as defined per feature |
| **Faculty advisor / student affairs** | View aggregated statistics dashboards (no individual identity exposure) |
| **Administrator** | Moderate content, manage reports, oversee users and platform health |
| **CI/CD pipeline** | Automated build, test, and deploy on GitHub Actions |

### 3.3 Architectural Constraint

All implementation must follow **Clean Architecture** as defined in `README.md`: presentation, API, application, domain, and infrastructure layers with inward-only dependencies. Business rules must not depend on frameworks or databases.

---

## 4. Glossary

| Term | Definition |
|------|------------|
| **Anonymous post** | Content published by an authenticated user where the author's identity is not visible to other users |
| **Mood post** | A user-created entry expressing emotion, experience, or daily thought, optionally tagged with a mood category |
| **Mood category** | A structured classification of emotional content (e.g., stress, joy, anxiety, gratitude) |
| **Faculty** | An academic division within the university (e.g., Faculty of Engineering) |
| **Major** | A specific field of study within a faculty |
| **Feed** | A chronologically or algorithmically ordered list of mood posts |
| **Reaction** | A lightweight emotional response attached to a post or comment |
| **Presigned upload URL** | A time-limited URL authorizing direct client upload to Cloudflare R2 |
| **Signed download URL** | A time-limited URL authorizing authorized retrieval of an object from R2 |
| **RBAC** | Role-based access control distinguishing at minimum regular users and administrators |
| **Aggregation threshold** | Minimum group size required before statistics are displayed, to prevent de-anonymization |

---

## 5. User Roles & Permissions

### 5.1 Role Definitions

| Role | Description |
|------|-------------|
| **Guest** | Unauthenticated visitor with access limited to explicitly public capabilities |
| **Student** | Authenticated university student — primary platform user |
| **Advisor** | Authenticated staff member with access to aggregated analytics only |
| **Administrator** | Platform operator with moderation, reporting, and system oversight capabilities |

> **Note:** Whether Advisor is a distinct role or a permission subset of Administrator will be finalized in `docs/authentication.md`. At minimum, the system must support **Student** and **Administrator** roles per README.

### 5.2 Permission Matrix (Behavioral)

| Capability | Guest | Student | Advisor | Admin |
|------------|:-----:|:-------:|:-------:|:-----:|
| Register / login | — | ✓ | ✓ | ✓ |
| View mood feed | TBD | ✓ | ✓ | ✓ |
| Create anonymous post | — | ✓ | — | — |
| Upload image to post | — | ✓ | — | — |
| Comment on post | — | ✓ | — | ✓ |
| React to post/comment | — | ✓ | — | ✓ |
| Bookmark post | — | ✓ | — | ✓ |
| Search and filter posts | TBD | ✓ | ✓ | ✓ |
| View faculty/major feeds | TBD | ✓ | ✓ | ✓ |
| View statistics dashboard | — | TBD | ✓ | ✓ |
| View trending emotions | TBD | ✓ | ✓ | ✓ |
| Report content | — | ✓ | ✓ | ✓ |
| Receive notifications | — | ✓ | TBD | ✓ |
| Moderate content | — | — | — | ✓ |
| Manage reports | — | — | — | ✓ |
| Manage users | — | — | — | ✓ |
| Access identity-linked audit data | — | — | — | ✓ (logged) |

Legend: ✓ = allowed, — = not allowed, TBD = access level to be defined in feature specification.

---

## 6. Functional Requirements

Requirements use the ID format `FR-<domain>-<nnn>`. Priority: **P0** (must-have for phase), **P1** (should-have), **P2** (nice-to-have).

---

### 6.1 User Authentication (`FR-AUTH`)

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-AUTH-001 | P0 | The system shall allow new users to register with credentials validated at both client and server boundaries. |
| FR-AUTH-002 | P0 | The system shall authenticate users via JWT-based session management upon successful login. |
| FR-AUTH-003 | P0 | The system shall hash passwords using bcrypt before persistence. Plain-text passwords must never be stored. |
| FR-AUTH-004 | P0 | The system shall issue JWT tokens with defined expiration. Token refresh strategy shall be documented in `docs/authentication.md`. |
| FR-AUTH-005 | P0 | The system shall reject requests to protected resources when the JWT is missing, invalid, or expired. |
| FR-AUTH-006 | P0 | The system shall enforce RBAC, distinguishing regular users and administrators at minimum. |
| FR-AUTH-007 | P0 | The system shall validate all authentication inputs at the API boundary using Express Validator and/or Zod. |
| FR-AUTH-008 | P1 | The system shall provide a secure logout mechanism that invalidates client-side token storage. |
| FR-AUTH-009 | P1 | The system shall rate-limit authentication endpoints to mitigate brute-force attacks. |

---

### 6.2 Anonymous Posting (`FR-POST`)

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-POST-001 | P0 | Authenticated students shall create mood posts containing text content. |
| FR-POST-002 | P0 | Mood posts shall not expose the author's identity to other users in any public-facing view. |
| FR-POST-003 | P0 | Students shall assign one or more mood categories to a post from a predefined set. |
| FR-POST-004 | P0 | Students shall associate a post with a faculty and/or major context where applicable. |
| FR-POST-005 | P0 | The system shall validate post content (length, allowed characters, required fields) before persistence. |
| FR-POST-006 | P0 | The system shall timestamp posts at creation and preserve immutable creation metadata. |
| FR-POST-007 | P1 | Students shall edit their own posts within a policy window (window duration: TBD in `docs/requirements.md`). |
| FR-POST-008 | P1 | Students shall delete their own posts, with associated comments and reactions handled per business rules. |
| FR-POST-009 | P0 | Administrators shall remove posts that violate platform policies, with actions recorded in an audit trail. |
| FR-POST-010 | P0 | The system shall rate-limit post creation to prevent spam and abuse. |

---

### 6.3 Feeds (`FR-FEED`)

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-FEED-001 | P0 | The system shall provide a **Mood Feed** — a stream of recent anonymous posts across the platform. |
| FR-FEED-002 | P0 | The system shall provide a **Faculty Feed** filtered to posts associated with a selected faculty. |
| FR-FEED-003 | P0 | The system shall provide a **Major Feed** filtered to posts associated with a selected major. |
| FR-FEED-004 | P0 | All feeds shall return posts without author identity exposed to end users. |
| FR-FEED-005 | P0 | All feeds shall support pagination (cursor- or offset-based — strategy TBD in `docs/api.md`). |
| FR-FEED-006 | P1 | Feeds shall display mood category, faculty/major context, reaction counts, and comment counts per post. |
| FR-FEED-007 | P1 | The Mood Feed shall support personalization based on the authenticated student's faculty/major affiliation. |
| FR-FEED-008 | P2 | Feeds shall support sorting options (e.g., newest, most reacted) where defined in `docs/api.md`. |

---

### 6.4 Mood Categories (`FR-CAT`)

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-CAT-001 | P0 | The system shall maintain a predefined set of mood categories (e.g., stress, joy, anxiety, gratitude). |
| FR-CAT-002 | P0 | Mood categories shall be selectable during post creation and usable as filter criteria. |
| FR-CAT-003 | P1 | Mood categories shall be manageable by administrators (add, deactivate — not delete if referenced). |
| FR-CAT-004 | P0 | Mood categories shall appear in statistics and trending emotion calculations. |

---

### 6.5 Image Upload (`FR-IMG`)

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-IMG-001 | P0 | Authenticated students shall attach one or more images to a mood post (count limit: TBD). |
| FR-IMG-002 | P0 | Image uploads shall use presigned upload URLs issued by the backend; clients upload directly to Cloudflare R2. |
| FR-IMG-003 | P0 | The R2 bucket shall be private with no public read access on objects. |
| FR-IMG-004 | P0 | The system shall store only object references and metadata (e.g., object key, MIME type) in MongoDB — never file binaries. |
| FR-IMG-005 | P0 | Image retrieval shall use signed download URLs with time-limited authorization. |
| FR-IMG-006 | P0 | The system shall validate image type and size before issuing a presigned upload URL. |
| FR-IMG-007 | P0 | Images shall never be stored on or transit through the application server for persistence. |
| FR-IMG-008 | P1 | The system shall reject upload confirmation if the object does not exist in R2 or fails integrity checks. |
| FR-IMG-009 | P1 | Deleting a post shall trigger cleanup of associated R2 objects per documented retention policy. |

---

### 6.6 Comment System (`FR-CMT`)

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-CMT-001 | P0 | Authenticated students shall add anonymous comments to mood posts. |
| FR-CMT-002 | P0 | Comments shall not expose the commenter's identity to other users. |
| FR-CMT-003 | P0 | The system shall validate comment content before persistence. |
| FR-CMT-004 | P1 | The comment model shall support either threaded or flat structure (decision TBD in `docs/requirements.md`). |
| FR-CMT-005 | P1 | Students shall delete their own comments within policy constraints. |
| FR-CMT-006 | P0 | Administrators shall remove comments that violate platform policies, with audit logging. |
| FR-CMT-007 | P0 | The system shall rate-limit comment creation. |

---

### 6.7 Reaction System (`FR-React`)

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-REACT-001 | P0 | Authenticated students shall react to mood posts with predefined emotional reactions. |
| FR-REACT-002 | P1 | Authenticated students shall react to comments with predefined emotional reactions. |
| FR-REACT-003 | P0 | Each user shall maintain at most one reaction per target (post or comment); changing reaction updates the existing one. |
| FR-REACT-004 | P0 | Reaction counts shall be visible on posts and comments without exposing who reacted. |
| FR-REACT-005 | P1 | The set of available reactions shall be configurable by administrators. |

---

### 6.8 Bookmark System (`FR-BMK`)

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-BMK-001 | P1 | Authenticated students shall bookmark mood posts for personal reference. |
| FR-BMK-002 | P1 | Students shall view a list of their bookmarked posts. |
| FR-BMK-003 | P1 | Students shall remove bookmarks. |
| FR-BMK-004 | P1 | Bookmarked posts remain accessible to the student even if removed from active feeds (within retention policy). |

---

### 6.9 Search, Filtering & Pagination (`FR-SRCH`)

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-SRCH-001 | P1 | Users shall search posts by text content and/or metadata. |
| FR-SRCH-002 | P0 | Users shall filter posts by faculty. |
| FR-SRCH-003 | P0 | Users shall filter posts by major. |
| FR-SRCH-004 | P0 | Users shall filter posts by mood category. |
| FR-SRCH-005 | P1 | Users shall filter posts by date range. |
| FR-SRCH-006 | P0 | All list endpoints and feeds shall support pagination. |
| FR-SRCH-007 | P0 | Search and filter results shall not expose author identity. |
| FR-SRCH-008 | P1 | Combined filters (faculty + category + date range) shall be supported. |

---

### 6.10 Statistics Dashboard (`FR-STAT`)

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-STAT-001 | P0 | The system shall provide aggregated mood metrics viewable on a statistics dashboard. |
| FR-STAT-002 | P0 | Statistics shall include mood distribution breakdowns by category. |
| FR-STAT-003 | P0 | Statistics shall include time-series visualizations of mood trends. |
| FR-STAT-004 | P0 | Statistics shall be scoped by faculty and/or major. |
| FR-STAT-005 | P0 | Aggregated data shall never expose individual user identity. |
| FR-STAT-006 | P0 | Statistics shall enforce a minimum aggregation threshold to prevent de-anonymization. |
| FR-STAT-007 | P1 | Advisors and administrators shall access statistics dashboards; student access level TBD. |
| FR-STAT-008 | P1 | Dashboard data shall reflect near-real-time aggregates (freshness target: TBD in NFR section). |

---

### 6.11 Trending Emotions (`FR-TREND`)

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-TREND-001 | P1 | The system shall surface trending emotional themes based on recent post and reaction activity. |
| FR-TREND-002 | P1 | Trending emotions shall be scoped by faculty, major, or platform-wide context. |
| FR-TREND-003 | P1 | Trending calculations shall use aggregated data only — no individual post attribution in trending views. |
| FR-TREND-004 | P2 | Trending emotions shall indicate rising vs. declining themes where algorithm permits. |

---

### 6.12 Admin Dashboard (`FR-ADMIN`)

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-ADMIN-001 | P0 | Administrators shall access a dedicated admin dashboard. |
| FR-ADMIN-002 | P0 | The dashboard shall list reported content awaiting review. |
| FR-ADMIN-003 | P0 | Administrators shall approve, dismiss, or action reported content. |
| FR-ADMIN-004 | P0 | Administrators shall view and manage user accounts (suspend, reinstate — actions TBD). |
| FR-ADMIN-005 | P0 | All administrative actions shall be recorded in an audit trail with timestamp and actor. |
| FR-ADMIN-006 | P1 | The dashboard shall display platform health indicators (error rates, active users — metrics TBD). |
| FR-ADMIN-007 | P1 | Administrators shall configure platform policies (rate limits, content length — scope TBD). |

---

### 6.13 Report System (`FR-RPT`)

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-RPT-001 | P0 | Authenticated users shall report posts and comments for inappropriate content. |
| FR-RPT-002 | P0 | Reports shall capture reason category and optional description. |
| FR-RPT-003 | P0 | Reports shall enter a review queue accessible to administrators. |
| FR-RPT-004 | P0 | Reporters shall not be identified to the reported content author. |
| FR-RPT-005 | P1 | The system shall prevent duplicate reports from the same user on the same content within a cooldown window. |
| FR-RPT-006 | P0 | Administrators shall resolve reports with documented outcomes (removed, dismissed, warned). |

---

### 6.14 Notification System (`FR-NOTIF`)

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-NOTIF-001 | P1 | The system shall deliver notifications for relevant user activity. |
| FR-NOTIF-002 | P1 | Notification delivery shall support at minimum in-app notifications; push notifications are optional for initial release. |
| FR-NOTIF-003 | P1 | Notifications shall not reveal identity information inconsistent with anonymity rules. |
| FR-NOTIF-004 | P2 | Users shall configure notification preferences. |

> **Note:** Specific notification triggers and channels are to be defined in `docs/requirements.md` per README.

---

## 7. Non-Functional Requirements

Requirements use the ID format `NFR-<domain>-<nnn>`.

### 7.1 Performance (`NFR-PERF`)

| ID | Priority | Requirement |
|----|----------|-------------|
| NFR-PERF-001 | P0 | API responses for feed and read operations shall complete within **500 ms** at p95 under expected load (target load: TBD). |
| NFR-PERF-002 | P0 | Image presigned URL generation shall complete within **200 ms** at p95. |
| NFR-PERF-003 | P1 | The frontend shall achieve a Lighthouse performance score ≥ **80** on key pages (post creation, mood feed). |
| NFR-PERF-004 | P1 | Statistics dashboard queries shall complete within **2 s** at p95 for standard date ranges. |
| NFR-PERF-005 | P2 | The system shall support horizontal scaling of the backend on Railway without architectural changes. |

### 7.2 Scalability (`NFR-SCALE`)

| ID | Priority | Requirement |
|----|----------|-------------|
| NFR-SCALE-001 | P0 | The system shall use MongoDB Atlas for managed, horizontally scalable document storage. |
| NFR-SCALE-002 | P0 | Image storage shall scale independently via Cloudflare R2 without backend storage growth. |
| NFR-SCALE-003 | P1 | The architecture shall support increased concurrent users through stateless JWT authentication and horizontal API scaling. |
| NFR-SCALE-004 | P1 | Feed pagination shall prevent unbounded result sets regardless of total post volume. |

### 7.3 Availability & Reliability (`NFR-AVAIL`)

| ID | Priority | Requirement |
|----|----------|-------------|
| NFR-AVAIL-001 | P0 | Production services shall target **99.5%** uptime (excluding planned maintenance). |
| NFR-AVAIL-002 | P0 | MongoDB Atlas automated backups shall be enabled for production. |
| NFR-AVAIL-003 | P1 | The system shall degrade gracefully when R2 is temporarily unavailable (queued uploads or clear error messaging). |
| NFR-AVAIL-004 | P1 | Deployment rollback procedures shall be documented in `docs/deployment.md`. |

### 7.4 Security (`NFR-SEC`)

| ID | Priority | Requirement |
|----|----------|-------------|
| NFR-SEC-001 | P0 | All production traffic shall use HTTPS/TLS. |
| NFR-SEC-002 | P0 | All API inputs shall be validated at the boundary; unexpected fields shall be rejected. |
| NFR-SEC-003 | P0 | User-generated content rendered in the frontend shall be sanitized to prevent XSS. |
| NFR-SEC-004 | P0 | Authentication and high-frequency write endpoints shall be rate-limited. |
| NFR-SEC-005 | P0 | CORS shall enforce strict origin allowlisting in production. |
| NFR-SEC-006 | P0 | Secrets shall be stored in platform secret managers (Railway, Vercel, GitHub encrypted secrets) — never in source control. |
| NFR-SEC-007 | P0 | MongoDB Atlas network access shall be restricted to backend service IP allowlists. |
| NFR-SEC-008 | P0 | Dependency vulnerability scanning shall run in CI/CD via GitHub Actions. |
| NFR-SEC-009 | P0 | API error responses shall not leak internal stack traces or sensitive system details. |
| NFR-SEC-010 | P0 | Admin access to identity-linked data shall be logged and restricted to administrator role. |

### 7.5 Privacy & Anonymity (`NFR-PRIV`)

| ID | Priority | Requirement |
|----|----------|-------------|
| NFR-PRIV-001 | P0 | Public-facing content shall never include personally identifiable information. |
| NFR-PRIV-002 | P0 | Aggregated analytics shall enforce minimum group sizes before display. |
| NFR-PRIV-003 | P0 | Anonymity shall be an architectural constraint, not merely a UI presentation choice. |
| NFR-PRIV-004 | P0 | Identity shall be managed for authentication and moderation only. |
| NFR-PRIV-005 | P1 | Data retention and deletion policies shall be documented in `docs/security.md`. |

### 7.6 Maintainability (`NFR-MAINT`)

| ID | Priority | Requirement |
|----|----------|-------------|
| NFR-MAINT-001 | P0 | The codebase shall follow Clean Architecture layer boundaries as defined in README. |
| NFR-MAINT-002 | P0 | Business logic shall reside in domain and application layers, not in controllers or UI components. |
| NFR-MAINT-003 | P0 | All database access shall go through the repository pattern — no direct ODM calls in controllers. |
| NFR-MAINT-004 | P0 | Code formatting shall be enforced via Prettier and ESLint. |
| NFR-MAINT-005 | P1 | TypeScript shall be used for both frontend and backend (recommended per README; confirmed as project standard). |
| NFR-MAINT-006 | P1 | Tests shall prioritize business rules, auth flows, and data integrity. |

### 7.7 Usability (`NFR-UX`)

| ID | Priority | Requirement |
|----|----------|-------------|
| NFR-UX-001 | P0 | The frontend shall be responsive across desktop and mobile viewports. |
| NFR-UX-002 | P0 | Forms shall provide inline validation feedback using Zod schemas. |
| NFR-UX-003 | P1 | Loading, empty, and error states shall be handled for all data-fetching views (TanStack Query). |
| NFR-UX-004 | P1 | Visual design shall follow guidelines in `DESIGN.md` once authored. |
| NFR-UX-005 | P2 | The platform shall target WCAG 2.1 AA compliance (deferred to Future Improvements per README). |

### 7.8 Compatibility (`NFR-COMPAT`)

| ID | Priority | Requirement |
|----|----------|-------------|
| NFR-COMPAT-001 | P0 | The frontend shall support latest two major versions of Chrome, Firefox, Safari, and Edge. |
| NFR-COMPAT-002 | P0 | The REST API shall communicate over HTTPS with JSON payloads. |
| NFR-COMPAT-003 | P1 | Zod schemas shall be shared between frontend forms and backend validation where practical. |

---

## 8. Business Rules & Constraints

### 8.1 Anonymity Rules

| Rule ID | Rule |
|---------|------|
| BR-ANON-001 | A mood post's author identity must not appear in any API response or UI element visible to non-administrator users. |
| BR-ANON-002 | Comments and reactions must not reveal the acting user's identity to other non-administrator users. |
| BR-ANON-003 | Search results, feeds, and trending views must never include author-identifying fields. |
| BR-ANON-004 | Administrators may access identity-linked data solely for moderation; all such access must be audit-logged. |

### 8.2 Content Rules

| Rule ID | Rule |
|---------|------|
| BR-CNT-001 | Post and comment text shall have configurable maximum length enforced at validation. |
| BR-CNT-002 | Mood category assignment is required at post creation. |
| BR-CNT-003 | Faculty and/or major association rules shall be defined in `docs/requirements.md` (required vs. optional). |
| BR-CNT-004 | Deleted or moderated content shall not appear in public feeds but may be retained for audit purposes. |

### 8.3 Image Rules

| Rule ID | Rule |
|---------|------|
| BR-IMG-001 | Only image MIME types approved in `docs/cloudflare-r2.md` shall be accepted. |
| BR-IMG-002 | Maximum file size per image shall be enforced before presigned URL issuance. |
| BR-IMG-003 | Direct public URLs to R2 objects are prohibited; all access is via signed URLs. |
| BR-IMG-004 | Orphaned R2 objects (upload confirmed but post creation failed) shall be cleaned up per scheduled job policy. |

### 8.4 Analytics Rules

| Rule ID | Rule |
|---------|------|
| BR-STAT-001 | Statistics shall only include data from groups meeting the minimum aggregation threshold. |
| BR-STAT-002 | Time-series data shall use consistent timezone handling (timezone: TBD, default UTC recommended). |
| BR-STAT-003 | Trending emotion algorithms shall be documented and versioned when changed. |

### 8.5 Authentication Rules

| Rule ID | Rule |
|---------|------|
| BR-AUTH-001 | Only authenticated students may create posts, comments, reactions, and bookmarks. |
| BR-AUTH-002 | Administrator capabilities require the administrator role — not merely authentication. |
| BR-AUTH-003 | JWT tokens must be validated on every request to protected endpoints before business logic executes. |

---

## 9. Data & Integration Requirements

### 9.1 Persistence

| ID | Requirement |
|----|-------------|
| INT-DB-001 | All structured application data shall be persisted in **MongoDB Atlas** via **Mongoose**. |
| INT-DB-002 | Schema definitions, indexing strategy, and conventions shall be documented in `docs/database.md`. |
| INT-DB-003 | The database shall store image metadata only — never binary image data. |
| INT-DB-004 | Repository interfaces shall be defined in the domain layer; Mongoose implementations in infrastructure. |

### 9.2 Object Storage

| ID | Requirement |
|----|-------------|
| INT-R2-001 | All user-uploaded images shall be stored in a **private Cloudflare R2** bucket. |
| INT-R2-002 | Upload flow: client requests presigned URL → uploads to R2 → confirms with backend → backend stores reference. |
| INT-R2-003 | Download flow: client requests image → backend authorizes → issues signed URL → client fetches from R2. |
| INT-R2-004 | R2 configuration, CORS, and bucket policies shall be documented in `docs/cloudflare-r2.md`. |

### 9.3 Frontend ↔ Backend Communication

| ID | Requirement |
|----|-------------|
| INT-API-001 | Frontend and backend shall communicate via **REST API** over HTTPS. |
| INT-API-002 | The frontend shall use **Axios** for HTTP and **TanStack Query** for server-state management. |
| INT-API-003 | API contracts shall be defined in `docs/api.md` before endpoint implementation. |
| INT-API-004 | API responses shall use structured error formats without internal detail leakage. |

### 9.4 Deployment Integrations

| ID | Requirement |
|----|-------------|
| INT-DEP-001 | Frontend shall be deployed to **Vercel**. |
| INT-DEP-002 | Backend API shall be deployed to **Railway**. |
| INT-DEP-003 | CI/CD shall be managed via **GitHub Actions** in `.github/workflows/`. |
| INT-DEP-004 | Three environments shall be supported: development, staging, production. |
| INT-DEP-005 | On pull request: lint, type-check, and test. On merge to main: deploy to Railway and Vercel. |

### 9.5 Technology Stack Compliance

All implementations must use the technology stack defined in `README.md`. Deviations require an architectural decision record in `docs/architecture.md`.

| Layer | Required technologies |
|-------|----------------------|
| Frontend | React 19, Vite, Tailwind CSS, React Router, Axios, TanStack Query, React Hook Form, Zod |
| Backend | Express.js, MongoDB Atlas, Mongoose, JWT, bcrypt, Express Validator and/or Zod |
| Storage | Cloudflare R2 (private bucket, presigned upload, signed download) |
| CI/CD | GitHub, GitHub Actions |

---

## 10. Security & Privacy Requirements

This section consolidates security requirements for traceability. Full threat modeling lives in `docs/security.md`.

### 10.1 Threat Mitigation Summary

| Threat | Mitigation |
|--------|------------|
| Credential theft | bcrypt hashing, rate limiting, HTTPS |
| Token hijacking | JWT expiration, secure client storage guidance |
| XSS via user content | Output sanitization on render |
| Unauthorized API access | JWT middleware on all protected routes |
| Bucket credential exposure | Presigned URLs only; no client-side R2 credentials |
| Unauthorized image access | Private bucket + signed download URLs |
| De-anonymization via analytics | Minimum aggregation thresholds |
| Abuse / spam | Rate limits on auth, posting, commenting |
| Dependency vulnerabilities | CI/CD scanning |
| Privilege escalation | RBAC enforced at application layer |

### 10.2 Compliance Considerations

| Area | Status |
|------|--------|
| University data governance | Policies TBD with institution |
| GDPR / data protection | Requirements TBD in `docs/security.md` |
| Content moderation obligations | Addressed via report system and admin dashboard |
| Audit logging for admin actions | Required (FR-ADMIN-005, NFR-SEC-010) |

---

## 11. Acceptance Criteria by Phase

Aligned with the README roadmap. A phase is complete when all P0 requirements for that phase pass acceptance testing.

### Phase 1 — Foundation

| Criterion | Related requirements |
|-----------|---------------------|
| Documentation scaffold complete (`README`, `SPECS`, `docs/`) | — |
| Architecture and API design finalized | INT-API-003, NFR-MAINT-001 |
| CI/CD pipeline runs lint, type-check, and tests on PR | INT-DEP-003, INT-DEP-005 |
| Users can register, login, and receive JWT | FR-AUTH-001 through FR-AUTH-007 |
| Students can create anonymous posts with mood categories | FR-POST-001 through FR-POST-006, FR-CAT-001 |
| Posts do not expose author identity | FR-POST-002, BR-ANON-001, NFR-PRIV-001 |

### Phase 2 — Engagement

| Criterion | Related requirements |
|-----------|---------------------|
| Mood, faculty, and major feeds operational | FR-FEED-001 through FR-FEED-005 |
| Image upload via R2 presigned flow works end-to-end | FR-IMG-001 through FR-IMG-007 |
| Comments and reactions functional and anonymous | FR-CMT-001 through FR-CMT-003, FR-REACT-001, FR-REACT-003 |
| Search, filtering, and pagination operational | FR-SRCH-002 through FR-SRCH-007 |
| Bookmark system functional | FR-BMK-001 through FR-BMK-003 |

### Phase 3 — Analytics & Administration

| Criterion | Related requirements |
|-----------|---------------------|
| Statistics dashboard displays aggregated metrics | FR-STAT-001 through FR-STAT-006 |
| Trending emotions surfaced | FR-TREND-001 through FR-TREND-003 |
| Admin dashboard operational with moderation tools | FR-ADMIN-001 through FR-ADMIN-005 |
| Report system end-to-end (report → review → resolve) | FR-RPT-001 through FR-RPT-006 |
| Notification system delivers in-app notifications | FR-NOTIF-001, FR-NOTIF-002 |

### Phase 4 — Production Hardening

| Criterion | Related requirements |
|-----------|---------------------|
| Performance targets met under load test | NFR-PERF-001 through NFR-PERF-004 |
| Security audit completed with findings resolved | NFR-SEC-001 through NFR-SEC-010 |
| Monitoring, logging, and alerting operational | FR-ADMIN-006, NFR-AVAIL-001 |
| Production deployment live on Vercel + Railway + Atlas + R2 | INT-DEP-001, INT-DEP-002 |

---

## 12. Out of Scope

Per README — the following are explicitly excluded from the initial release:

| Item | Rationale |
|------|-----------|
| Public, non-university audiences | Platform is university-scoped |
| Identity-linked social networking | Contradicts anonymity-by-design |
| Direct messaging between users | Deferred; moderation and privacy complexity |
| Real-time WebSocket feeds | Listed under Future Improvements |
| Machine-learning sentiment analysis | Future Improvements |
| Native mobile applications | Future Improvements |
| Multi-university tenant isolation | Future Improvements |
| Internationalization (i18n) | Future Improvements |
| WCAG 2.1 AA compliance audit | Future Improvements (NFR-UX-005 is P2) |
| CSV/PDF export of statistics | Future Improvements |
| Third-party integration APIs / webhooks | Future Improvements |
| Privacy-preserving content recommendations | Future Improvements |

---

## 13. Assumptions & Dependencies

### 13.1 Assumptions

| ID | Assumption |
|----|------------|
| ASM-001 | Users have access to a modern web browser and stable internet connection. |
| ASM-002 | The university provides or approves a list of faculties and majors for platform configuration. |
| ASM-003 | Cloudflare R2, MongoDB Atlas, Vercel, and Railway accounts are provisioned before deployment phase. |
| ASM-004 | A single university instance is deployed initially (multi-university is future scope). |
| ASM-005 | Students authenticate with email/password; SSO integration is not in initial scope unless decided otherwise. |
| ASM-006 | English is the initial UI language. |

### 13.2 Dependencies

| Dependency | Required for |
|------------|--------------|
| MongoDB Atlas cluster | All data persistence |
| Cloudflare R2 bucket | Image upload and retrieval |
| Railway project | Backend API hosting |
| Vercel project | Frontend hosting |
| GitHub repository + Actions | Source control and CI/CD |
| `docs/api.md` | API implementation (Phase 1 gate) |
| `docs/database.md` | Data layer implementation (Phase 1 gate) |
| `docs/authentication.md` | Auth implementation (Phase 1) |
| `docs/cloudflare-r2.md` | Image storage implementation (Phase 2) |
| `DESIGN.md` | UI implementation consistency |

---

## 14. Open Decisions

The following items are intentionally marked TBD and must be resolved in downstream documents before implementation of the affected feature.

| ID | Decision | Target document | Blocking phase |
|----|----------|-----------------|----------------|
| OD-001 | TypeScript confirmation as project standard | This spec (recommended: yes) | Phase 1 |
| OD-002 | Guest/unauthenticated feed access level | `docs/requirements.md` | Phase 1 |
| OD-003 | JWT refresh token strategy | `docs/authentication.md` | Phase 1 |
| OD-004 | Comment model: threaded vs. flat | `docs/requirements.md` | Phase 2 |
| OD-005 | Pagination strategy: cursor vs. offset | `docs/api.md` | Phase 2 |
| OD-006 | Maximum images per post and file size limits | `docs/cloudflare-r2.md` | Phase 2 |
| OD-007 | Predefined reaction types | `docs/requirements.md` | Phase 2 |
| OD-008 | Notification triggers and channels | `docs/requirements.md` | Phase 3 |
| OD-009 | Student access to statistics dashboard | `docs/requirements.md` | Phase 3 |
| OD-010 | Minimum aggregation threshold value | `docs/security.md` | Phase 3 |
| OD-011 | Advisor role: distinct role vs. admin permission | `docs/authentication.md` | Phase 3 |
| OD-012 | Post edit window duration | `docs/requirements.md` | Phase 2 |
| OD-013 | Faculty/major association: required vs. optional on posts | `docs/requirements.md` | Phase 1 |
| OD-014 | University email domain restriction for registration | `docs/authentication.md` | Phase 1 |

---

## 15. Requirement Traceability

### 15.1 README Goals → Requirements

| README goal | Supporting requirements |
|-------------|------------------------|
| Safe anonymous expression | FR-POST-002, FR-CMT-002, NFR-PRIV-001–004, BR-ANON-001–004 |
| Community emotional awareness | FR-FEED-001–003, FR-TREND-001–003, FR-CAT-004 |
| Data-informed well-being | FR-STAT-001–008, BR-STAT-001–003 |
| Production-grade engineering | NFR-MAINT-001–006, INT-API-003 |
| Scalable infrastructure | NFR-SCALE-001–004, INT-DEP-001–002, INT-R2-001 |

### 15.2 README Features → Requirement domains

| README feature | Requirement section |
|----------------|---------------------|
| User Authentication | §6.1 FR-AUTH |
| Anonymous Posting | §6.2 FR-POST |
| Mood Feed | §6.3 FR-FEED |
| Faculty Feed | §6.3 FR-FEED |
| Major Feed | §6.3 FR-FEED |
| Mood Categories | §6.4 FR-CAT |
| Image Upload | §6.5 FR-IMG |
| Comment System | §6.6 FR-CMT |
| Reaction System | §6.7 FR-REACT |
| Bookmark System | §6.8 FR-BMK |
| Search | §6.9 FR-SRCH |
| Filtering | §6.9 FR-SRCH |
| Pagination | §6.9 FR-SRCH |
| Statistics Dashboard | §6.10 FR-STAT |
| Trending Emotions | §6.11 FR-TREND |
| Admin Dashboard | §6.12 FR-ADMIN |
| Report System | §6.13 FR-RPT |
| Notification System | §6.14 FR-NOTIF |

### 15.3 Document Maintenance

| Event | Action |
|-------|--------|
| README updated | Review and reconcile this document |
| New feature proposed | Add FR-* requirement with priority and phase |
| Decision resolved (§14) | Update requirement from TBD to concrete; remove OD entry |
| API/database designed | Cross-reference FR-* IDs in `docs/api.md` and `docs/database.md` |
| Phase completed | Verify acceptance criteria (§11) against test results |

---

*This specification is derived from [`README.md`](./README.md). All implementation, design, and downstream documentation must remain consistent with both documents.*
