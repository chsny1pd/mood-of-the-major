# Mood of the Major — Frontend Architecture

> **Document type:** Frontend engineering specification  
> **Status:** Draft v1.0  
> **Authority:** Derives from [`README.md`](../README.md), [`SPECS.md`](../SPECS.md), [`DESIGN.md`](../DESIGN.md), [`architecture.md`](./architecture.md), [`database.md`](./database.md), [`api.md`](./api.md), [`authentication.md`](./authentication.md), [`cloudflare-r2.md`](./cloudflare-r2.md), [`security.md`](./security.md), and [`backend.md`](./backend.md). Where conflict exists, `README.md` takes precedence.

---

## Table of Contents

1. [Frontend Philosophy](#frontend-philosophy)
2. [Technology Stack](#technology-stack)
3. [Folder Structure](#folder-structure)
4. [Feature-Based Architecture](#feature-based-architecture)
5. [Routing Strategy](#routing-strategy)
6. [Layout Architecture](#layout-architecture)
7. [State Management Strategy](#state-management-strategy)
8. [API Communication](#api-communication)
9. [Forms](#forms)
10. [Components](#components)
11. [Styling](#styling)
12. [Accessibility](#accessibility)
13. [Performance Optimization](#performance-optimization)
14. [Error Handling](#error-handling)
15. [Loading Strategy](#loading-strategy)
16. [Security Responsibilities](#security-responsibilities)
17. [Cloudflare R2 Integration](#cloudflare-r2-integration)
18. [Future Scalability](#future-scalability)
19. [Best Practices](#best-practices)
20. [Related Documents](#related-documents)

---

## Frontend Philosophy

The Mood of the Major frontend is a **single-page application (SPA)** that renders a calm, trustworthy experience for university students to share emotions anonymously and explore collective campus mood. The frontend is the **presentation layer** in Clean Architecture — it consumes the REST API, reflects design intent from `DESIGN.md`, and must never become the authoritative enforcement point for anonymity, authorization, or business rules (`NFR-PRIV-003`, `architecture.md`).

### Guiding Principles

| Principle | Frontend implication |
|-----------|---------------------|
| **Anonymity is visible in what is absent** | Never render avatars, usernames, or profile links on public content. Trust anonymous DTOs from the API; do not infer or display identity (`DESIGN.md`, `BR-ANON-001`). |
| **API is authoritative** | Render what the backend returns. Client-side hiding of fields is insufficient — but sanitization and safe rendering remain mandatory (`NFR-SEC-003`). |
| **Server state is centralized** | All API data flows through TanStack Query. Do not duplicate feeds, moods, or statistics in local state or Context (`README.md` Coding Standards). |
| **Feature isolation** | Domain-oriented modules (feed, mood, auth) keep changes localized (`architecture.md` ADR-006). |
| **Design system fidelity** | Visual language, layouts, and interaction patterns follow `DESIGN.md` — warmth without trivializing pain, clarity over cleverness. |
| **States are first-class** | Every data-fetching view handles loading, empty, and error states (`NFR-UX-003`). |
| **Mobile-first** | Students primarily use phones on campus (`DESIGN.md` Responsive Design Strategy, `NFR-UX-001`). |
| **Security-aware presentation** | Tokens stored per `authentication.md`; user content sanitized; no secrets in client bundle (`NFR-SEC-006`). |
| **Thin pages, rich features** | Route-level pages compose layouts and feature modules — pages contain no direct HTTP calls. |
| **Convention over configuration** | Predictable folder layout so engineers and AI agents locate logic quickly. |

### What the Frontend Owns

| Responsibility | Owner |
|----------------|-------|
| UI rendering and responsive layout | React components and layouts |
| Client-side routing and navigation | React Router |
| Form interaction and inline validation UX | React Hook Form + Zod |
| Server-state caching and synchronization | TanStack Query |
| HTTP transport and token attachment | Axios + interceptors |
| Client-side content sanitization before render | Shared utilities |
| Theme preference (light/dark/system) | ThemeContext + localStorage |
| Session presence UI (logged-in vs guest) | AuthContext |
| Direct R2 binary upload transport | Browser PUT to presigned URLs |
| Loading, empty, and error presentation | Shared UI patterns per `DESIGN.md` |

### What the Frontend Does Not Own

| Concern | Owner |
|---------|-------|
| Business rules (anonymity stripping, thresholds, ownership) | Backend application services |
| JWT signing and validation | Backend |
| Password hashing | Backend (bcrypt) |
| MongoDB persistence | Backend repositories |
| R2 credential management and authorization | Backend `ImageService` |
| Aggregation threshold enforcement | Backend `StatisticsService` |
| Audit logging | Backend `auditlogs` collection |
| Rate limiting enforcement | Backend middleware |

### Product Surfaces

The frontend implements three experiential shells defined in `DESIGN.md` and `architecture.md`:

| Surface | Layout | Primary users |
|---------|--------|---------------|
| **Public / marketing** | Landing Layout | Guests |
| **Student application** | Application Layout (Student) | Authenticated students (and advisors for statistics) |
| **Administration** | Admin Layout | Administrators |

---

## Technology Stack

The frontend stack is mandated by `README.md` and `SPECS.md` §9.5. Deviations require an ADR in `architecture.md`.

| Technology | Role |
|------------|------|
| **React 19** | UI library |
| **Vite** | Build tool and dev server |
| **Tailwind CSS** | Utility-first styling |
| **React Router** | Client-side routing |
| **Axios** | HTTP client |
| **TanStack Query** | Server-state management |
| **React Hook Form** | Form state and submission |
| **Zod** | Runtime schema validation |
| **TypeScript** | Type safety (`NFR-MAINT-005`) |

### Why React 19 Was Selected

| Factor | Rationale |
|--------|-----------|
| **Mandated stack** | Required by `README.md` and `SPECS.md` §9.5 — no substitution without ADR. |
| **Concurrent rendering** | Modern concurrent features support responsive feeds and non-blocking updates during data fetches. |
| **Ecosystem maturity** | TanStack Query, React Router, React Hook Form, and Tailwind integrate cleanly with the React model. |
| **Component composition** | Feature-based architecture maps naturally to composable trees — pages, layouts, feature components, shared primitives (`architecture.md` Frontend Architecture). |
| **Team familiarity** | Widely understood patterns lower onboarding cost for a small team. |
| **Vercel deployment** | Optimized hosting for React SPAs with preview deployments and CDN (`INT-DEP-001`). |

React 19 is chosen as the **view layer only**. Business logic equivalent to anonymity enforcement or aggregation thresholds must not live in components (`NFR-MAINT-002`).

### Why Vite Was Selected

| Factor | Rationale |
|--------|-----------|
| **Development speed** | Fast HMR and dev server — critical for iterative UI work aligned with `DESIGN.md`. |
| **Production builds** | Optimized bundling with tree-shaking and code-splitting support for route-based lazy loading (`NFR-PERF-003`). |
| **TypeScript native** | First-class TS support matches `NFR-MAINT-005`. |
| **Environment variables** | `VITE_*` prefix convention for public build-time config (`architecture.md` Frontend env vars). |
| **Simplicity** | Lighter than webpack-based setups; matches SPA scope without SSR complexity in v1. |

### Why Tailwind CSS Was Selected

| Factor | Rationale |
|--------|-----------|
| **Design mandate** | `DESIGN.md` specifies Tailwind CSS as the implementation layer for visual intent. |
| **Responsive design** | Utility classes support mobile-first breakpoints defined in `DESIGN.md` §Responsive Design Strategy (`NFR-UX-001`). |
| **Design tokens** | Semantic colors, typography, and spacing map to Tailwind theme extension for light/dark modes (`DESIGN.md` §Dark Mode Strategy). |
| **Consistency** | Repeated utility patterns enforce component consistency across student and admin shells. |
| **No CSS-in-JS overhead** | Keeps bundle lean; styles colocated in JSX class names. |
| **Rapid iteration** | Matches documentation-first delivery — design tokens can evolve without large CSS file refactors. |

### Why React Router Was Selected

| Factor | Rationale |
|--------|-----------|
| **SPA navigation** | Client-side routing without full page reloads — required for feed browsing and admin tables. |
| **Layout nesting** | Supports nested routes with layout outlets — Public, Auth, Student, and Admin shells (`DESIGN.md` Navigation Structure). |
| **Route guards** | Declarative protected routes for authentication and admin role checks. |
| **Lazy loading** | `React.lazy` + route-level code splitting integrates with React Router route definitions. |
| **URL as navigation state** | Faculty, major, mood detail, and admin sections map to bookmarkable paths per `DESIGN.md` site map. |
| **Ecosystem standard** | De facto routing solution for React SPAs; aligns with `architecture.md` page/route table. |

### Why Axios Was Selected

| Factor | Rationale |
|--------|-----------|
| **Mandated integration** | Required by `INT-API-002` and `README.md`. |
| **Interceptors** | Centralized JWT attachment, token refresh on `401 AUTH_EXPIRED_TOKEN`, and error envelope normalization (`authentication.md` §Session Strategy). |
| **Request/response transforms** | Map API `{ success, data, error }` envelope to typed results. |
| **Credentials support** | `withCredentials: true` for HttpOnly refresh cookie on `/auth/refresh` (`authentication.md` §Refresh Token Strategy). |
| **Cancellation** | AbortController support for stale request cleanup on route change. |
| **Mature error handling** | Consistent HTTP status and error body access for TanStack Query integration. |

Axios is the **sole HTTP client**. Feature services wrap the shared `apiClient` instance — components and hooks do not instantiate Axios directly.

### Why TanStack Query Was Selected

| Factor | Rationale |
|--------|-----------|
| **Mandated server state** | Required by `INT-API-002`, `README.md`, and `architecture.md` ADR-004. |
| **Caching** | Stale-while-revalidate reduces redundant feed and statistics API calls (`NFR-PERF-001`, `NFR-PERF-003`). |
| **Built-in loading/error** | `isLoading`, `isError`, `error` drive UI states per `NFR-UX-003`. |
| **Mutations and invalidation** | Create mood, react, bookmark — invalidate related query keys after success. |
| **Pagination** | `useInfiniteQuery` for cursor-based feed pagination (`api.md` resolves `OD-005`). |
| **Deduplication** | Parallel components requesting the same mood detail share one fetch. |
| **No Redux for API data** | Explicitly avoided per `architecture.md` State Management Strategy. |

TanStack Query is **authoritative for all server-derived data**. It does not store JWT tokens — AuthContext owns session state.

### Why React Hook Form Was Selected

| Factor | Rationale |
|--------|-----------|
| **Performance** | Minimal re-renders during typing — important for post creation and comment input on mobile. |
| **Zod integration** | `@hookform/resolvers/zod` connects forms to shared validation schemas (`NFR-UX-002`, `NFR-COMPAT-003`). |
| **Field-level errors** | Maps API `details` array to field errors on submission failure. |
| **Form state isolation** | Keeps ephemeral form state out of TanStack Query and Context. |
| **Mandated stack** | Required by `README.md` and `SPECS.md` §9.5. |

### Why Zod Was Selected

| Factor | Rationale |
|--------|-----------|
| **Runtime validation** | Validates form input at submit and on blur — catches errors before API round-trip (`NFR-UX-002`). |
| **Shared contracts** | Schemas mirror backend validators where practical (`NFR-COMPAT-003`) — `registerSchema`, `createMoodSchema`, `commentSchema`, `reportSchema`. |
| **Type inference** | TypeScript types derived from schemas reduce DTO drift. |
| **API error mapping** | Validation error `details` from API align with Zod field paths. |
| **Mandated stack** | Required across frontend and backend validation strategy (`architecture.md` §Validation Strategy). |

---

## Folder Structure

The frontend lives in `frontend/` at repository root (`architecture.md`). The structure below is the **production-ready target** at implementation time.

```
frontend/
├── public/                      # Static files served as-is (favicon, robots.txt)
├── src/
│   ├── app/                     # Application bootstrap
│   │   ├── App.tsx              # Root component
│   │   ├── router.tsx           # Route definitions and lazy imports
│   │   └── providers.tsx        # QueryClientProvider, AuthProvider, ThemeProvider
│   │
│   ├── pages/                   # Thin route-level views (one per URL)
│   │   ├── LandingPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── FeedPage.tsx
│   │   ├── FacultyFeedPage.tsx
│   │   ├── MajorFeedPage.tsx
│   │   ├── CreateMoodPage.tsx
│   │   ├── MoodDetailPage.tsx
│   │   ├── SearchResultsPage.tsx
│   │   ├── BookmarksPage.tsx
│   │   ├── TrendingPage.tsx
│   │   ├── StatisticsPage.tsx
│   │   ├── NotificationsPage.tsx
│   │   └── admin/
│   │       ├── AdminOverviewPage.tsx
│   │       ├── ReportQueuePage.tsx
│   │       ├── ContentModerationPage.tsx
│   │       ├── UserManagementPage.tsx
│   │       └── AuditLogPage.tsx
│   │
│   ├── layouts/
│   │   ├── PublicLayout.tsx
│   │   ├── AuthLayout.tsx
│   │   ├── StudentLayout.tsx
│   │   └── AdminLayout.tsx
│   │
│   ├── features/                # Domain-oriented feature modules
│   │   ├── landing/
│   │   ├── auth/
│   │   ├── feed/
│   │   ├── faculty/
│   │   ├── major/
│   │   ├── mood/
│   │   ├── comments/
│   │   ├── reactions/
│   │   ├── bookmarks/
│   │   ├── search/
│   │   ├── statistics/
│   │   ├── notifications/
│   │   ├── upload/
│   │   └── admin/
│   │
│   ├── components/              # Shared cross-feature UI primitives
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── MoodCard.tsx
│   │   ├── CommentCard.tsx
│   │   ├── EmotionBadge.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   ├── Pagination.tsx
│   │   ├── Skeleton.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ErrorBanner.tsx
│   │   └── ...
│   │
│   ├── hooks/                   # Shared hooks (cross-feature)
│   │   ├── useAuth.ts
│   │   ├── useRequireAuth.ts
│   │   ├── useTheme.ts
│   │   ├── useMediaQuery.ts
│   │   └── useDisclosure.ts
│   │
│   ├── services/                # HTTP API wrappers (no React)
│   │   ├── apiClient.ts
│   │   ├── authService.ts
│   │   ├── moodService.ts
│   │   ├── imageService.ts
│   │   ├── commentService.ts
│   │   ├── reactionService.ts
│   │   ├── bookmarkService.ts
│   │   ├── searchService.ts
│   │   ├── statisticsService.ts
│   │   ├── adminService.ts
│   │   └── notificationService.ts
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   │
│   ├── lib/                     # Third-party client configuration
│   │   ├── queryClient.ts       # TanStack Query defaults
│   │   └── axios.ts             # Optional: apiClient factory re-export
│   │
│   ├── utils/
│   │   ├── sanitize.ts          # Safe rendering of user content
│   │   ├── format.ts            # Relative timestamps, number abbreviation
│   │   ├── token.ts             # Access token read/write/clear
│   │   ├── errors.ts            # API error code → user message mapping
│   │   └── validation.ts        # Shared Zod schema fragments
│   │
│   ├── assets/                    # Fonts, illustrations, static icons
│   ├── types/
│   │   ├── api/                 # Request/response DTOs mirroring api.md
│   │   ├── domain/              # Frontend domain models
│   │   └── auth/                # Session, role enum
│   ├── constants/
│   │   ├── routes.ts
│   │   ├── queryKeys.ts
│   │   ├── errorMessages.ts
│   │   └── roles.ts
│   └── styles/
│       ├── index.css            # Tailwind directives, global base
│       └── tokens.css           # CSS custom properties for design tokens
│
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```

### Directory Responsibilities

#### `app/`

| Responsibility | Detail |
|----------------|--------|
| Bootstrap the SPA | Mount React root, wrap providers |
| Define router | All route paths, lazy imports, layout nesting, route guards |
| Provider composition | QueryClient, AuthContext, ThemeContext — single composition root |
| Global error boundary | Top-level render error fallback |

**Must not:** Contain feature UI, API calls, or business logic.

#### `pages/`

| Responsibility | Detail |
|----------------|--------|
| One component per route | Maps 1:1 to URLs in `DESIGN.md` site map |
| Compose layouts + features | Import feature components and shared UI; pass route params |
| Remain thin | No Axios calls, no TanStack Query hooks unless trivial page-level orchestration |

Pages are **orchestration shells** — data fetching hooks typically live in feature modules and are called from pages or feature container components.

#### `layouts/`

| Responsibility | Detail |
|----------------|--------|
| Persistent chrome | Navbar, sidebar, footer, bottom nav per shell |
| Outlet rendering | React Router `<Outlet />` for nested child routes |
| Role-based visibility | Hide Create CTA for guests; show admin entry for administrators |
| Responsive behavior | Collapse sidebar to drawer on mobile per `DESIGN.md` |

Layouts do not fetch server data except auth/session presence from AuthContext.

#### `features/`

| Responsibility | Detail |
|----------------|--------|
| Domain isolation | Self-contained modules per product area (feed, mood, admin) |
| Feature components | UI specific to one domain (`MoodFeedList`, `CreateMoodForm`, `ReportModal`) |
| Feature hooks | TanStack Query and mutation hooks colocated with domain |
| Feature schemas | Zod form schemas for that domain |
| Public exports | `index.ts` barrel exports the feature's public API |

See [Feature-Based Architecture](#feature-based-architecture).

#### `components/`

| Responsibility | Detail |
|----------------|--------|
| Shared UI primitives | Reusable across two or more features (`DESIGN.md` §Component Design) |
| Presentational bias | Receive data via props; no TanStack Query in leaf components |
| Design system building blocks | Button, Modal, MoodCard, EmotionBadge, Skeleton, EmptyState |

Feature-specific UI that is not reused belongs in `features/<name>/components/`, not here.

#### `hooks/`

| Responsibility | Detail |
|----------------|--------|
| Cross-feature hooks | `useAuth`, `useTheme`, `useMediaQuery`, `useDisclosure` |
| Auth guards | `useRequireAuth` — redirect logic for protected actions |

Feature-specific data hooks (`useMoodFeed`, `useCreateMood`) live in `features/<name>/hooks/`.

#### `services/`

| Responsibility | Detail |
|----------------|--------|
| Thin API wrappers | Map to `docs/api.md` endpoints; no React imports |
| Shared Axios instance | `apiClient` with interceptors for JWT and errors |
| Typed request/response | Return typed promises matching `types/api/` |

Services are called by TanStack Query hooks — never directly from presentational components.

#### `contexts/`

| Responsibility | Detail |
|----------------|--------|
| Global low-churn state only | Auth session, theme preference |
| Minimal surface | Avoid prop-drilling for auth and theme exclusively |

**Do not create:** `FeedContext`, `MoodContext`, or any context holding API data.

#### `lib/`

| Responsibility | Detail |
|----------------|--------|
| Third-party configuration | TanStack Query client defaults (`staleTime`, `retry`, global error handler) |
| Client factory setup | Centralized configuration separate from feature code |

#### `utils/`

| Responsibility | Detail |
|----------------|--------|
| Pure functions | Sanitization, formatting, token helpers, error message mapping |
| No React | Usable in services, hooks, and components |
| Error mapping | Translate `error.code` from API to `DESIGN.md` §Error States copy |

#### `assets/`

| Responsibility | Detail |
|----------------|--------|
| Static build-time assets | Logo, empty-state illustrations, font files, icon sets |
| Imported by components | Bundled by Vite |

User-uploaded images are **not** assets — they load from signed R2 URLs at runtime.

#### `types/`

| Responsibility | Detail |
|----------------|--------|
| `types/api/` | DTOs mirroring `api.md` request and response shapes |
| `types/domain/` | Frontend models: Mood, Comment, MoodCategory, Faculty, Major |
| `types/auth/` | UserSession, Role enum (`student`, `administrator`, `advisor`) |

Public DTO types **exclude** `authorId`, `userId`, and `email` by design (`BR-ANON-001`). Type definitions document this exclusion so engineers do not add identity fields during mapping.

#### `constants/`

| Responsibility | Detail |
|----------------|--------|
| `routes.ts` | Path constants matching router and `DESIGN.md` site map |
| `queryKeys.ts` | TanStack Query key factory |
| `errorMessages.ts` | User-facing strings keyed by API error code |
| `roles.ts` | Role string constants matching `database.md` and `authentication.md` |

### Organization Rules

| Rule | Rationale |
|------|-----------|
| `pages/` import from `features/`, `layouts/`, `components/` | Thin page pattern |
| Feature folders do not import sibling features directly | Shared code goes to `components/`, `hooks/`, `services/`, or `utils/` |
| Presentational components receive data via props | Container hooks fetch; leaves render |
| Colocate feature tests under `features/<name>/__tests__/` or `frontend/tests/` | Per `architecture.md` |
| Optional `packages/shared` for Zod schemas | Future monorepo workspace (`architecture.md`) |

---

## Feature-Based Architecture

Each feature module is a **self-contained vertical slice** aligned with product domains (`architecture.md` §Feature-Based Organization). A feature owns its UI, data hooks, schemas, and optionally thin service re-exports.

### Standard Feature Module Structure

```
features/<feature-name>/
├── components/       # Feature-specific UI
├── hooks/            # TanStack Query and mutation hooks
├── schemas/          # Zod form validation schemas
├── types/            # Feature-specific types (if not in global types/)
└── index.ts          # Public exports only
```

### Feature Catalog

| Feature | Scope | Key pages / surfaces |
|---------|-------|----------------------|
| `landing` | Marketing, trust-building, auth CTAs | Landing Page |
| `auth` | Register, login, logout, session bootstrap | Register, Login |
| `feed` | Mood feed, pagination, feed-level filters | Mood Feed (`/feed`) |
| `faculty` | Faculty feed, faculty page header | Faculty Feed (`/faculty/:facultyId`) |
| `major` | Major feed, major page header | Major Feed (`/major/:majorId`) |
| `mood` | Create, detail, edit (if supported) | Create Mood, Mood Detail |
| `comments` | Comment list and input | Mood Detail (comments section) |
| `reactions` | Reaction picker and counts | Mood Card, Mood Detail, Comment Card |
| `bookmarks` | Bookmark toggle and list | Bookmarks page, Mood Card |
| `search` | Search bar integration and results | Search Results |
| `statistics` | Dashboard, trending, charts | Statistics, Trending |
| `notifications` | Notification inbox (Phase 3) | Notifications |
| `upload` | Image upload component and orchestration hook | Create Mood, Upload Image |
| `admin` | Report queue, moderation, users, audit | All `/admin/*` pages |

### Isolation Rules

| Rule | Detail |
|------|--------|
| **No cross-feature imports** | `features/feed` must not import from `features/mood` directly |
| **Shared extraction threshold** | When two features need the same UI or hook, move to `components/`, `hooks/`, or `services/` |
| **Single responsibility** | Each feature maps to one product domain in `SPECS.md` functional requirements |
| **Public API via index** | Other layers import from `features/<name>` barrel — not deep paths |
| **Hooks call services** | Feature hooks use `services/` wrappers — not raw Axios |
| **Query keys namespaced** | Keys prefixed by domain: `['moods', ...]`, `['admin', ...]` |

### Shared vs Feature Components

| Location | When to use |
|----------|-------------|
| `components/` | Used by 2+ features — Navbar, MoodCard, Modal, Pagination (`DESIGN.md` §Component Design) |
| `features/<name>/components/` | Used only within one domain — `MoodFeedList`, `AdminReportTable`, `CreateMoodForm` |

### Container / Presentational Pattern

| Layer | Responsibility |
|-------|----------------|
| **Page or feature container** | Calls TanStack Query hooks; handles loading/error; passes props down |
| **Presentational component** | Renders UI from props; emits events via callbacks |
| **Leaf shared component** | No data fetching; no context except theme |

Presentational components must **not** embed TanStack Query hooks. This keeps Storybook-style testing and reuse viable.

---

## Routing Strategy

Routing is defined in `src/app/router.tsx` using React Router. Paths align with `DESIGN.md` §Navigation Structure site map and `architecture.md` page table.

### Route Map

| Path | Page | Layout | Access |
|------|------|--------|--------|
| `/` | Landing | PublicLayout | Public |
| `/register` | Register | AuthLayout | Public (redirect if authenticated) |
| `/login` | Login | AuthLayout | Public (redirect if authenticated) |
| `/feed` | Mood Feed | StudentLayout | Public read; enhanced when authenticated (`OD-002`) |
| `/faculty/:facultyId` | Faculty Feed | StudentLayout | Public |
| `/major/:majorId` | Major Feed | StudentLayout | Public |
| `/create` | Create Mood | StudentLayout | Protected — student |
| `/mood/:moodId` | Mood Detail | StudentLayout | Public; bookmark exception needs auth |
| `/search` | Search Results | StudentLayout | Protected — authenticated (`api.md`) |
| `/bookmarks` | Bookmarks | StudentLayout | Protected — student |
| `/trending` | Trending | StudentLayout | Public |
| `/statistics` | Statistics | StudentLayout | Protected — role-gated (`OD-009`) |
| `/notifications` | Notifications | StudentLayout | Protected — authenticated (Phase 3) |
| `/admin` | Admin Overview | AdminLayout | Admin only |
| `/admin/reports` | Report Queue | AdminLayout | Admin only |
| `/admin/content` | Content Moderation | AdminLayout | Admin only |
| `/admin/users` | User Management | AdminLayout | Admin only |
| `/admin/categories` | Mood Categories | AdminLayout | Admin only (optional) |
| `/admin/health` | Platform Health | AdminLayout | Admin only (Phase 3+) |
| `/admin/audit` | Audit Log | AdminLayout | Admin only |
| `*` | Not Found | Minimal layout | Public |

`:facultyId` and `:majorId` accept ObjectId or slug per `api.md`.

### Public Routes

Routes accessible without a valid JWT. Optional authentication may enhance responses (e.g., `isBookmarked`, feed personalization per `FR-FEED-007`).

| Category | Routes |
|----------|--------|
| Marketing | `/` |
| Auth entry | `/register`, `/login` |
| Feeds (read) | `/feed`, `/faculty/:facultyId`, `/major/:majorId` |
| Mood detail (active moods) | `/mood/:moodId` |
| Trending | `/trending` |
| Reference data | Faculties/majors consumed via API on public pages |

Guest feed access level may be limited (e.g., truncated `limit` per `api.md` feed endpoint) — final policy TBD (`OD-002`). UI shows auth prompts when guests attempt protected actions (`DESIGN.md` Auth Guard Prompt).

### Protected Routes

Routes requiring a valid access JWT. Unauthenticated users redirect to `/login` with `returnUrl` preserved.

| Category | Routes | Role |
|----------|--------|------|
| Content creation | `/create` | `student` |
| Search | `/search` | Authenticated |
| Bookmarks | `/bookmarks` | `student` |
| Notifications | `/notifications` | Authenticated |
| Statistics | `/statistics` | `student`, `advisor`, `administrator` (per `OD-009`) |
| Profile actions | Account menu routes | Self |

Protected status is enforced **server-side** — route guards improve UX but are not a security boundary.

### Admin Routes

All paths under `/admin/*` require JWT with `role: administrator` (`BR-AUTH-002`, `authentication.md`).

| Behavior | Detail |
|----------|--------|
| Non-admin authenticated users | Redirect to `/feed` with access denied message |
| Unauthenticated users | Redirect to `/login` |
| Layout | AdminLayout — separate shell from student UI (`DESIGN.md` Admin Dashboard) |
| No student Create CTA | Admin shell hides post creation actions |

Administrators use a **persistent left sidebar** — not the student bottom navigation pattern.

### 404 Handling

| Scenario | Behavior |
|----------|----------|
| Unknown path | Render Not Found page with link to `/feed` or `/` |
| Deleted mood (`404` from API) | Show `DESIGN.md` copy: "This mood doesn't exist or was removed." with back navigation |
| Invalid faculty/major slug | Faculty/Major not found empty state |

The catch-all route (`*`) renders a dedicated Not Found page — not a blank screen.

### Lazy Loading

| Scope | Strategy |
|-------|----------|
| **Route-level** | `React.lazy` + `Suspense` for every page component |
| **Admin bundle** | Admin pages lazy-loaded as a group — students never download admin code on initial load |
| **Statistics charts** | Chart libraries lazy-loaded within Statistics feature if heavy |
| **Fallback** | Route-level Suspense fallback — app shell skeleton or minimal spinner |

Eager-load only: `app/`, layouts, auth bootstrap, and critical shared components needed for first paint.

### Route Guards

Route guards are implemented as **layout-level wrapper components** or **route loader checks** — not inline in every page.

| Guard | Responsibility |
|-------|----------------|
| `GuestGuard` | Redirect authenticated users away from `/login`, `/register` to `/feed` |
| `AuthGuard` | Redirect unauthenticated users to `/login?returnUrl=...` |
| `StudentGuard` | Assert `role === student` for content creation routes |
| `AdminGuard` | Assert `role === administrator` for `/admin/*` |
| `RoleGuard` | Generic role check for statistics (`OD-009`) |

#### Guard Data Source

| Data | Source |
|------|--------|
| `isAuthenticated` | AuthContext |
| `role` | AuthContext (from JWT claim + `/auth/me` bootstrap) |
| Token validity | Axios interceptor handles expired token refresh before guard sees stale state |

#### Redirect Behavior

| Event | Action |
|-------|--------|
| Guest hits `/create` | Redirect to `/login` with `returnUrl=/create` |
| Expired session mid-action | Interceptor attempts refresh; on failure redirect to `/login` |
| Student hits `/admin` | Redirect to `/feed` with 403-style message |
| Successful login | Navigate to `returnUrl` or default `/feed` |

---

## Layout Architecture

Layouts wrap pages with persistent chrome per `DESIGN.md` §Layout Design. Each layout renders a React Router `<Outlet />` for nested routes.

### Landing Layout (PublicLayout)

| Property | Value |
|----------|-------|
| **Used by** | Landing Page (`/`) |
| **Purpose** | Marketing, trust-building, conversion to registration |
| **Structure** | Header (logo, Login, Register), full-width sections, footer — no sidebar |
| **Navigation** | Minimal — auth CTAs only |
| **Character** | Generous whitespace, centered max-width container (`DESIGN.md` Landing Page) |

No authenticated user chrome — Create button and account menu are absent.

### Application Layout (StudentLayout)

| Property | Value |
|----------|-------|
| **Used by** | Feed, faculty/major feeds, create, detail, search, bookmarks, trending, statistics, notifications |
| **Purpose** | Primary student experience — browse, post, engage |
| **Structure** | Navbar (logo, nav links, search, Create, notifications, account menu); desktop sidebar for feed switching and filters; optional right rail for trending; mobile bottom tab bar |
| **Responsive** | Two-column desktop (sidebar + feed); single column mobile with filter drawer (`DESIGN.md` Dashboard) |
| **Create CTA** | Prominent for authenticated students; hidden for guests |
| **AuthGuard** | Wraps protected child routes |

Student layout is the **default authenticated home** — logo links to `/feed`.

### Authentication Layout (AuthLayout)

| Property | Value |
|----------|-------|
| **Used by** | Register (`/register`), Login (`/login`) |
| **Purpose** | Low-friction credential entry |
| **Structure** | Centered card form; logo links to Landing; desktop optional aside with anonymity reassurance |
| **Max form width** | ~400px for readability (`DESIGN.md` Authentication Pages) |
| **GuestGuard** | Redirects authenticated users to `/feed` |
| **Footer** | Terms/privacy placeholder links |

No application navbar or sidebar — focused auth experience.

### Admin Layout (AdminLayout)

| Property | Value |
|----------|-------|
| **Used by** | All `/admin/*` routes |
| **Purpose** | Moderation, reporting, user management, audit |
| **Structure** | Fixed left sidebar (admin nav with report badge); top bar (page title, admin indicator, logout); main workspace |
| **Character** | Utilitarian density — more compact than student UI (`DESIGN.md` Admin Dashboard) |
| **AdminGuard** | Required on all child routes |
| **No marketing whitespace** | Dense tables and KPI cards |

Admin layout does **not** share student bottom navigation. Administrators see moderation emphasis, not post creation.

### Layout Selection Summary

| Layout | Shell | Primary navigation |
|--------|-------|-------------------|
| PublicLayout | Marketing | Header links only |
| AuthLayout | Credential entry | Logo → Landing |
| StudentLayout | Student app | Navbar + sidebar/bottom nav |
| AdminLayout | Administration | Left sidebar |

---

## State Management Strategy

Per `architecture.md` §State Management Strategy — **server state and client state are strictly separated**.

### Server State — TanStack Query

All data fetched from the REST API is managed exclusively by TanStack Query (`INT-API-002`).

| Concern | TanStack Query feature |
|---------|------------------------|
| Fetching | `useQuery` per resource |
| Feed pagination | `useInfiniteQuery` with cursor from `meta.nextCursor` (`api.md`) |
| Mutations | `useMutation` for create, update, delete, react, bookmark, report |
| Cache invalidation | After mutation, invalidate related keys |
| Loading/error | `isLoading`, `isFetching`, `isError`, `error` |
| Deduplication | Shared keys across components |
| Background refresh | Stale-while-revalidate per `staleTime` config |

#### Query Key Convention

Centralized in `constants/queryKeys.ts`:

| Resource | Key pattern |
|----------|-------------|
| Mood feed | `['moods', 'feed', filters]` |
| Faculty feed | `['moods', 'faculty', facultyId, filters]` |
| Major feed | `['moods', 'major', majorId, filters]` |
| Mood detail | `['moods', moodId]` |
| Comments | `['comments', moodId, cursor]` |
| Bookmarks | `['bookmarks', cursor]` |
| Statistics dashboard | `['statistics', 'dashboard', scope, period]` |
| Trending | `['moods', 'trending', scope, window]` |
| Notifications | `['notifications', filters]` |
| Admin reports | `['admin', 'reports', status, cursor]` |
| Signed image URL | `['images', imageId, 'url']` |
| Current user | `['auth', 'me']` |
| Faculties / majors | `['faculties']`, `['majors', facultyId]` |
| Tags (emotions) | `['tags', 'emotion']` |

#### Stale Time Guidance

| Resource type | `staleTime` intent |
|---------------|-------------------|
| Reference data (faculties, majors, tags) | Long (5–15 minutes) |
| Feeds | Short (30–60 seconds) |
| Mood detail | Medium (1–2 minutes) |
| Statistics | Medium (2–5 minutes) |
| Signed image URLs | Until `expiresAt` minus safety buffer (per `cloudflare-r2.md`) |
| Admin queues | Short (30 seconds) |

#### Invalidation Matrix (intent)

| Mutation | Invalidate |
|----------|------------|
| Create mood | Feed queries, faculty/major feeds if scoped |
| React to mood | Mood detail, feed item, reactions query |
| Bookmark toggle | Bookmarks list, mood detail `isBookmarked` |
| Create comment | Comments list, mood detail `commentCount`, feed |
| Report content | None (reporter sees confirmation only) |
| Admin resolve report | Admin reports, admin dashboard |
| Login / logout | `['auth', 'me']`, user-specific queries on logout |

### Client State — Local and Context

| State type | Storage | Examples |
|------------|---------|----------|
| **Auth session** | AuthContext + secure token storage | `isAuthenticated`, `role`, `user` summary from `/auth/me` |
| **Theme** | ThemeContext + localStorage | `light`, `dark`, `system` (`DESIGN.md` §Dark Mode) |
| **Form state** | React Hook Form internal state | Create mood text, category selection, report form |
| **UI ephemeral** | `useState` / `useDisclosure` | Modal open, filter drawer, reaction picker visibility |
| **Upload progress** | `useImageUpload` hook local state | Per-file progress, pending uploads before publish |
| **Filter UI state** | Local state (optional URL sync future) | Active filter chips before apply |

### UI State

Ephemeral interface state that does not belong in TanStack Query or Context:

| UI state | Management |
|----------|------------|
| Modal open/close | `useDisclosure` or local `useState` |
| Mobile menu / drawer | Local state in layout |
| Reaction picker expanded | Local state on MoodCard / MoodDetail |
| Filter panel collapsed sections | Local state |
| Toast queue | Toast provider / local manager |
| Selected admin table rows | Local state in admin feature |

### Form State

Managed by React Hook Form — isolated from server cache:

| Form | Schema location |
|------|-----------------|
| Register | `features/auth/schemas/registerSchema.ts` |
| Login | `features/auth/schemas/loginSchema.ts` |
| Create mood | `features/mood/schemas/createMoodSchema.ts` |
| Comment | `features/comments/schemas/commentSchema.ts` |
| Report | `features/admin/schemas/reportSchema.ts` or shared report schema |

Form drafts for create mood may be preserved in sessionStorage on network failure (`DESIGN.md` §Error States) — optional enhancement, not server state.

### Authentication State

AuthContext is the **single source of truth** for session presence:

| State | Source |
|-------|--------|
| Access token | In-memory preferred; `sessionStorage` acceptable (`security.md` Client Storage Guidance) |
| Refresh token | HttpOnly cookie — not accessible to JavaScript |
| User profile | TanStack Query `['auth', 'me']` synced into AuthContext on login |
| Login/logout actions | AuthContext methods calling `authService` |

TanStack Query does **not** store tokens. AuthContext and `utils/token.ts` own token lifecycle.

### What Not to Use

| Avoid | Reason |
|-------|--------|
| Redux / Zustand for server data | TanStack Query is authoritative |
| Context for feeds or moods | Creates stale cache; bypasses invalidation |
| Duplicating API data in `useState` | Sync bugs and unnecessary re-fetch |
| Local state for pagination cursors | Cursor belongs in TanStack Query infinite query data |

### Optimistic Updates

Apply only where rollback is safe and anonymity is preserved (`architecture.md`):

| Mutation | Optimistic update |
|----------|-------------------|
| Reactions | Yes — update count; rollback on failure |
| Bookmarks | Yes — toggle icon; rollback on failure |
| Create mood | **No** — wait for server confirmation |
| Create comment | Optional — append with temp ID; prefer wait for server in v1 |
| Report | No |

---

## API Communication

The frontend communicates with the backend exclusively over **HTTPS REST** with JSON payloads (`INT-API-001`, `NFR-COMPAT-002`). Base URL from `VITE_API_BASE_URL`; all paths prefixed `/api/v1` per `api.md`.

### Architecture

```
Component / Page
      │
      ▼
Feature hook (useQuery / useMutation)
      │
      ▼
Service (moodService, authService, ...)
      │
      ▼
apiClient (Axios instance)
      │
      ▼
Backend API (Railway)
```

### apiClient Configuration

| Setting | Value |
|---------|-------|
| `baseURL` | `import.meta.env.VITE_API_BASE_URL` |
| `timeout` | 30 seconds default; 60 seconds for statistics dashboard |
| `headers` | `Content-Type: application/json`, `Accept: application/json` |
| `withCredentials` | `true` — required for refresh cookie (`authentication.md`) |

### Authorization Headers

| Request type | Header |
|--------------|--------|
| Authenticated API calls | `Authorization: Bearer <accessToken>` |
| Token source | Read from memory/sessionStorage via `utils/token.ts` |
| Public read calls | No Authorization header (optional JWT may be attached if session exists for enhanced responses) |
| Refresh call | No Bearer — refresh token sent via HttpOnly cookie |
| R2 presigned PUT | Headers from `uploadHeaders` in presign response — not apiClient |

#### Request Interceptor

1. Attach Bearer token if present and route is not public auth endpoint.
2. Do not attach token to `/auth/login`, `/auth/register`.

#### Response Interceptor

1. Unwrap `{ success, data, meta }` on success.
2. On `401 AUTH_EXPIRED_TOKEN`: call `POST /auth/refresh`, update access token, retry original request once.
3. On refresh failure: clear tokens, redirect to `/login`.
4. On `401 AUTH_INVALID_TOKEN`: clear tokens, redirect to `/login`.
5. Normalize error envelope to typed `ApiError` with `code`, `message`, `details`, `requestId`.

### Error Handling

| Layer | Behavior |
|-------|----------|
| **Interceptor** | Normalize errors; trigger refresh flow |
| **TanStack Query** | `isError` surfaces to UI; `retry` disabled for 4xx, limited for 5xx/network |
| **Mutation onError** | Toast or inline message per `DESIGN.md` |
| **Query global handler** | Optional QueryClient `onError` for logging |

Map `error.code` to user-facing copy via `utils/errors.ts` and `constants/errorMessages.ts` — never display raw API internals (`NFR-SEC-009`).

### Loading

| Pattern | Usage |
|---------|-------|
| `isLoading` | Initial fetch — show skeleton |
| `isFetching` | Background refetch — subtle indicator optional |
| `isPending` (mutation) | Disable submit button, show button spinner |
| `fetchStatus` | Distinguish paused vs fetching for offline (future) |

### Caching

| Setting | Intent |
|---------|--------|
| `staleTime` | Per resource — see State Management |
| `gcTime` (cacheTime) | Default 5 minutes; longer for reference data |
| `refetchOnWindowFocus` | Enabled for feeds and notifications; disabled for statistics during active viewing |
| `refetchOnReconnect` | Enabled |
| `placeholderData` | `keepPreviousData` for pagination filter changes |

### Retries

| Error type | Retry |
|------------|-------|
| Network failure / 5xx | Up to 2 retries with exponential backoff (queries only) |
| 401 (after refresh attempt) | No retry — redirect login |
| 403, 404, 422, 429 | No retry |
| Mutations | No automatic retry — user-initiated retry via UI |

### Pagination Integration

Cursor-based pagination per `api.md` (`OD-005`):

| Aspect | Detail |
|--------|--------|
| Query param | `cursor` opaque string from `meta.nextCursor` |
| Default limit | 20; max 50 |
| Infinite scroll | `useInfiniteQuery` `getNextPageParam: (lastPage) => lastPage.meta.nextCursor` |
| Load more button | Alternative to infinite scroll per `DESIGN.md` Pagination |
| Guest feed | May receive reduced limit per `OD-002` |

### Response Envelope

All API responses follow `api.md` Standard Response Format:

| Success | Failure |
|---------|---------|
| `{ success: true, data, meta? }` | `{ success: false, error: { code, message, details?, requestId } }` |

Services return typed `data` to hooks. Hooks never parse raw Axios response shapes in components.

---

## Forms

Forms implement `NFR-UX-002` — inline validation feedback using Zod schemas. All user input forms use **React Hook Form + Zod resolver**.

### Validation

| Layer | Authority | Purpose |
|-------|-----------|---------|
| **Zod + React Hook Form (client)** | UX only | Immediate field feedback; reduce unnecessary API calls |
| **API ingress (server)** | Authoritative | Final validation; reject unknown fields |

Client validation mirrors server rules where practical (`NFR-COMPAT-003`):

| Form | Key rules (from `api.md`, `authentication.md`) |
|------|------------------------------------------------|
| Register | Email valid, password 8–128 chars with letter+digit, optional faculty/major |
| Login | Email and password required |
| Create mood | Content 1–5000 chars, ≥1 tag, ≤4 images, primary tag in tag set |
| Comment | Content 1–2000 chars |
| Report | Reason code enum, description max 1000 chars |
| Change password | New password rules, must differ from current |

Validation mode: `onBlur` for registration fields; `onSubmit` for login; inline on change for character count displays on mood creation.

### Submission

| Step | Behavior |
|------|----------|
| 1 | Client Zod validation runs via React Hook Form |
| 2 | If invalid — show field errors; do not call API |
| 3 | If valid — `useMutation` or form `onSubmit` calls service |
| 4 | Disable submit and show button loading during request |
| 5 | On success — navigate, invalidate queries, show success toast |
| 6 | On failure — map API errors to fields or global form error |

#### Create Mood with Images

Publish is blocked until all pending uploads are confirmed or removed (`DESIGN.md` Upload Image). Submission order:

1. Upload images (presign → PUT → confirm) — tracked by `useImageUpload`.
2. Submit mood with `imageIds` array of confirmed IDs.

### Error Display

| Error source | Display |
|--------------|---------|
| Zod field validation | Inline below field — red text, field border (`DESIGN.md` Error States) |
| API `VALIDATION_FAILED` with `details` | Map `field` to React Hook Form `setError` |
| API global errors | Form-level banner or toast |
| Auth login failure | Generic "Invalid email or password" — no field-specific hints (`authentication.md`) |
| Rate limit `429` | Calm cooldown message with retry timing |

Preserve valid field values on failure — do not clear the form (`DESIGN.md` Registration journey).

### Anonymity UX on Forms

Post and comment forms display **Anonymity Notice** strip (`DESIGN.md`): "Your name will not be shown." This is presentation only — anonymity is enforced by the API.

---

## Components

Reusable component architecture follows `DESIGN.md` §Component Design and `architecture.md` §Components.

### Component Hierarchy

```
Pages
  └── Layouts
        └── Feature containers (hooks fetch data)
              └── Feature components
                    └── Shared components (primitives)
```

### Shared Components (cross-feature)

From `DESIGN.md` — live in `components/`:

| Component | Purpose |
|-----------|---------|
| **Navbar** | Top navigation, search, Create, notifications, account menu |
| **Sidebar** | Feed switcher, filter sections (desktop) |
| **MoodCard** | Anonymous post summary in feeds |
| **CommentCard** | Anonymous comment display |
| **EmotionBadge** | Mood category visual identifier |
| **StatisticsCard** | Aggregated KPI display |
| **SearchBar** | Initiate search |
| **FilterPanel** | Faculty, major, category, date filters |
| **UploadImage** | Image select, validate, preview, progress |
| **Pagination** | Cursor load-more or page controls |
| **Modal** | Report, confirm delete, admin actions |
| **Toast** | Transient success/error feedback |
| **Button**, **IconButton** | Actions with loading state |
| **TextInput**, **Textarea**, **Select** | Form controls with inline errors |
| **Tabs** | Admin sections, statistics scope |
| **Table** | Admin queues and user lists |
| **Breadcrumb** | Faculty → Major hierarchy |
| **TrendingEmotionChip** | Trending theme highlight |
| **NotificationItem** | In-app alert row |
| **EmptyState** | Zero-data guidance |
| **Skeleton** | Loading placeholders |
| **ErrorBanner** | Page-level fetch failure with retry |
| **AuthGuardPrompt** | Guest auth encouragement modal |
| **AnonymityNotice** | Reassurance on post/comment forms |
| **DateRangePicker** | Statistics and filter date range |
| **ChartContainer** | Chart wrapper with threshold empty state |
| **ReactionPicker** | Emotional reaction selection |
| **AccountMenu** | Logged-in dropdown |
| **ReportForm** | Structured reporting |
| **ConfirmDialog** | Destructive action gate |

### Feature Components (domain-specific)

Live in `features/<name>/components/`:

| Feature | Examples |
|---------|----------|
| `feed` | `MoodFeedList`, `FeedFilters` |
| `mood` | `CreateMoodForm`, `MoodDetailBody`, `ImageGallery` |
| `statistics` | `DistributionChart`, `TimeSeriesChart`, `ScopeSelector` |
| `admin` | `AdminReportTable`, `ModerationDrawer`, `UserStatusPanel` |

### Component Rules

| Rule | Detail |
|------|--------|
| **Presentational purity** | Leaf components receive props; no TanStack Query inside |
| **No identity display** | MoodCard, CommentCard never show author name, avatar, or email |
| **Sanitize user content** | Post body and comments pass through `utils/sanitize.ts` before render |
| **Interactive targets** | Bookmark, reaction, report controls stop propagation on MoodCard click |
| **Accessible names** | Icon-only buttons have `aria-label`; nav items have text labels |
| **Loading variants** | MoodCard, StatisticsCard, Table support skeleton state |
| **Threshold state** | StatisticsCard shows "Insufficient data" when `meetsThreshold: false` |

### Composition Patterns

| Pattern | Usage |
|---------|-------|
| **Compound components** | Modal (overlay, header, body, footer) |
| **Render props / slots** | Layout outlets; optional sidebar slots |
| **Controlled vs uncontrolled** | Form fields controlled via React Hook Form; filters controlled locally until Apply |

---

## Styling

Styling implements `DESIGN.md` visual language using Tailwind CSS. This section defines engineering approach — not pixel-perfect mockups.

### Tailwind CSS Philosophy

| Principle | Application |
|-----------|-------------|
| **Utility-first** | Compose UI from Tailwind utilities in JSX |
| **Design tokens in theme** | Extend `tailwind.config.ts` with semantic colors, fonts, spacing |
| **No arbitrary magic numbers** | Prefer theme scale values for consistency |
| **Colocate styles** | Component-specific class strings live with component — no separate CSS files per component unless necessary |
| **Global base only** | `styles/index.css` — Tailwind directives, resets, focus visible defaults |
| **Dark mode** | `class` strategy on `html` or `body` element toggled by ThemeContext |

### Responsive Design

Mobile-first per `DESIGN.md` §Responsive Design Strategy (`NFR-UX-001`):

| Breakpoint | Tailwind prefix | Primary patterns |
|------------|-----------------|------------------|
| Mobile | default (`< 768px`) | Bottom tab bar, full-bleed cards, filter bottom sheet |
| Tablet | `md:` (`768px+`) | Collapsed sidebar or hamburger, two-column statistics |
| Desktop | `lg:` (`1024px+`) | Full sidebar, feed + optional right rail, admin fixed sidebar |

#### Responsive Rules

| Element | Mobile | Desktop |
|---------|--------|---------|
| Mood Card excerpt | Fewer lines truncated | More lines before ellipsis |
| Create Mood | Full-screen flow | Full page or wide layout |
| Filter Panel | Bottom sheet | Sidebar embedded |
| Admin tables | Horizontal scroll; sticky action column | Full width |
| Statistics charts | Single column stack | Two-column grid |
| Modals | Bottom sheet variant where appropriate | Centered modal |

Touch targets minimum 44×44px equivalent on mobile (`DESIGN.md` Accessibility).

### Dark Mode

First-class theme per `DESIGN.md` §Dark Mode Strategy — not an afterthought inversion.

| Aspect | Implementation |
|--------|----------------|
| **Tokens** | Semantic names: `background`, `surface`, `text-primary`, `text-muted`, `border`, `primary` |
| **Tailwind** | `dark:` variant on all semantic surfaces |
| **Default** | Respect `prefers-color-scheme` on first visit |
| **User override** | Account menu: System / Light / Dark |
| **Persistence** | `localStorage` key for theme preference |
| **Transition** | Brief crossfade ≤ 200ms; disabled under `prefers-reduced-motion` |
| **Category badges** | Desaturated dark-friendly variants per emotion |
| **Charts** | Adjust gridline and label contrast in dark theme |

#### Semantic Token Mapping (intent)

| Token | Light | Dark |
|-------|-------|------|
| Background | Off-white | Deep blue-gray |
| Surface / cards | White | Elevated dark gray |
| Primary text | Near-black | Near-white |
| Muted text | Mid-gray | Light gray |
| Primary brand | Indigo-violet | Lighter tint for contrast |
| Error | Muted rose-red | Adjusted for dark bg contrast |

Define tokens in `tailwind.config.ts` `theme.extend.colors` and optionally `styles/tokens.css` CSS variables for non-Tailwind consumers (charts).

### Design Tokens

Align with `DESIGN.md` §Color Palette and §Typography:

| Category | Tokens |
|----------|--------|
| **Brand** | `primary`, `secondary` |
| **Semantic** | `success`, `warning`, `error`, `info` |
| **Surface** | `background`, `surface`, `border` |
| **Text** | `text-primary`, `text-muted` |
| **Emotion categories** | `emotion-stress`, `emotion-joy`, `emotion-anxiety`, `emotion-gratitude` — mapped from API `colorToken` / tag slug |
| **Typography** | `font-sans` (UI/body), `font-display` (landing hero only) |
| **Type scale** | `text-display`, `text-h1` through `text-small`, `text-label` |
| **Spacing** | Consistent `gap`, `p`, `m` from Tailwind scale |
| **Radius** | `rounded-lg` for cards; `rounded-full` for chips |
| **Shadow** | Subtle elevation on hover for MoodCard |

Emotion badge colors come from API tag `colorToken` where available — fallback to theme defaults by slug.

### Animation

Per `DESIGN.md` §Animation Guidelines:

| Allowed | Duration |
|---------|----------|
| Fade in (feed items, modals) | 150–250ms |
| Slide up (mobile sheets, toasts) | 200–300ms |
| Skeleton shimmer | Low contrast; static under `prefers-reduced-motion` |

Prohibited: confetti on publish, aggressive shake on validation, parallax on feeds.

---

## Accessibility

Accessibility targets usability for diverse students. Full WCAG 2.1 AA audit is deferred (`NFR-UX-005` P2, `README.md` Future Improvements) — v1 decisions must not create preventable barriers (`DESIGN.md` §Accessibility).

### Keyboard Navigation

| Requirement | Implementation |
|-------------|----------------|
| All interactive elements focusable | Native buttons, links, inputs; `tabIndex={0}` only when necessary |
| Logical tab order | DOM order matches visual order |
| Skip link | Optional skip to main content on student layout |
| Modal focus trap | Focus contained in open modals; return focus on close |
| Escape closes | Modals, drawers, reaction picker |
| Feed navigation | MoodCard keyboard activatable; interactive children separately focusable |

### ARIA

| Element | Requirement |
|---------|-------------|
| Icon buttons | `aria-label` describing action |
| Landmarks | `nav`, `main`, `complementary` for sidebar/rails |
| Live regions | Toast announcements via `aria-live="polite"` |
| Loading | `aria-busy` on submitting forms |
| Expanded state | `aria-expanded` on drawers, menus, pickers |
| Current page | `aria-current="page"` on active nav link |

Primary navigation pairs icons with text labels (`DESIGN.md` Icons).

### Contrast

| Requirement | Intent |
|-------------|--------|
| Text readability | Target WCAG AA contrast ratios in both themes |
| Category badges | Text label always present — not color alone (`DESIGN.md`) |
| Error states | Color + text message — not color alone |
| Dark mode | Error/success colors adjusted for dark backgrounds |

### Focus

| Requirement | Implementation |
|-------------|----------------|
| Visible focus indicators | `ring` utilities on interactive elements — never `outline-none` without replacement |
| Focus order | Preserved in modals and dynamic lists |
| Focus management | Move focus to modal title on open; to trigger on close |

### Additional Requirements

| Area | Guideline |
|------|-----------|
| **Motion** | Respect `prefers-reduced-motion` — collapse animations |
| **Touch targets** | Minimum 44×44px on mobile |
| **Forms** | Labels associated with inputs via `htmlFor` / `id` |
| **Errors** | `aria-describedby` linking fields to error messages |
| **Images** | Optional alt text field at post creation (recommended) |
| **Language** | `lang="en"` on `html` (`ASM-006`) |
| **Inclusive copy** | Plain language; actionable error messages (`DESIGN.md`) |

---

## Performance Optimization

Aligned with `NFR-PERF-003` (Lighthouse ≥ 80 on key pages), `NFR-PERF-001`, and `architecture.md` client performance strategy.

### Lazy Loading

| Target | Strategy |
|--------|----------|
| Route pages | `React.lazy` + `Suspense` |
| Admin module | Separate async chunk |
| Chart libraries | Dynamic import in statistics feature |
| Heavy modals | Lazy load admin moderation drawer if large |

### Code Splitting

| Split point | Rationale |
|-------------|-----------|
| Per-route | Vite automatic chunks per lazy route |
| Admin vs student | Students never download admin bundle |
| Vendor | Vite default vendor chunk for react, router, query |

Analyze bundle with `vite build --analyze` during Phase 4 hardening.

### Memoization

| Use | When |
|-----|------|
| `React.memo` | MoodCard in long feeds if re-render profiling shows need |
| `useMemo` | Expensive filter derivations, chart data transforms |
| `useCallback` | Stable handlers passed to memoized children |

Avoid premature memoization — profile first. Default React 19 rendering is sufficient for most views.

### Image Optimization

| Strategy | Detail |
|----------|--------|
| Lazy load images | `loading="lazy"` on feed thumbnails below fold |
| Signed URL cache | TanStack Query caches URLs until `expiresAt` |
| Thumbnail in feed | Single preview image; count badge for multiples (`DESIGN.md` Mood Card) |
| Lightbox | Full resolution loaded on gallery open only |
| Dimensions | Reserve aspect ratio space to prevent layout shift |
| No base64 in DOM | User images from R2 signed URLs only |

Image bytes are not processed client-side beyond display — no client-side resize in v1.

### Virtualization

| Context | Recommendation |
|---------|----------------|
| Long feeds | Consider window virtualization (e.g., virtual list library) if feed exceeds ~50 DOM cards with performance issues |
| Admin tables | Virtualize rows when queue exceeds 100 items |
| Comments | Load more pagination preferred over virtualizing in v1 |

Default: cursor pagination limits DOM size. Add virtualization when profiling warrants — Phase 4 optimization.

### Additional Performance Practices

| Practice | Detail |
|----------|--------|
| TanStack Query deduplication | Prevents duplicate mood detail fetches |
| Debounced search | Debounce search input before navigation to `/search` |
| Avoid unnecessary context | ThemeContext and AuthContext only — prevent broad re-renders |
| Production build | Vite minification, tree-shaking |
| Font loading | `font-display: swap` for web fonts in `assets/` |
| Lighthouse targets | Post creation and mood feed pages ≥ 80 performance score |

---

## Error Handling

Error handling spans network, API, validation, and render failures. User-facing copy follows `DESIGN.md` §Error States — calm, specific, actionable. Never expose stack traces, object keys, or storage internals (`NFR-SEC-009`).

### Error Layers

```
Render error → Error Boundary → fallback UI
Query error → isError → ErrorBanner / EmptyState
Mutation error → onError → Toast / inline form error
Axios interceptor → token refresh / redirect
API validation → setError on form fields
```

### Error Boundary

| Scope | Behavior |
|-------|----------|
| App root | Catch unexpected render errors; show recovery UI with link home |
| Feature optional | Statistics charts may have local boundary — chart failure does not crash page |

Error boundary logs to console in development; production sends to monitoring (future).

### API Error Mapping

| Code | HTTP | UI treatment |
|------|------|--------------|
| `VALIDATION_FAILED` | 422 | Field errors via `details` |
| `AUTH_INVALID_CREDENTIALS` | 401 | Generic login message |
| `AUTH_EXPIRED_TOKEN` | 401 | Silent refresh; else redirect login |
| `FORBIDDEN`, `INSUFFICIENT_ROLE`, `NOT_OWNER` | 403 | Access denied banner |
| `RESOURCE_NOT_FOUND` | 404 | Context-specific not found (mood, faculty) |
| `REPORT_COOLDOWN`, `BOOKMARK_ALREADY_EXISTS` | 409 | Informative toast |
| `RATE_LIMIT_EXCEEDED` | 429 | Cooldown message with timing |
| `FILE_TOO_LARGE`, `INVALID_MIME_TYPE` | 422 | Upload component per-file error |
| `INTERNAL_ERROR` | 500 | Generic retry message |

Include `requestId` in development logs for support correlation — not shown prominently to end users.

### Domain-Specific Error UX

| Context | Behavior |
|---------|----------|
| Post submit failure | Preserve draft text; offer retry (`DESIGN.md`) |
| Upload failure | Per-file error with retry/remove |
| Feed fetch failure | ErrorBanner with retry button |
| Statistics threshold | Distinct from error — "Insufficient data" empty state |
| Offline | Network message; optional offline indicator (future) |

### Admin Errors

Admin UI follows the same calm pattern — no additional technical detail in user-facing copy. Server logs carry diagnostic detail.

---

## Loading Strategy

Loading states implement `NFR-UX-003` and `DESIGN.md` §Loading States. Prefer **skeleton screens** over full-page spinners for content areas.

### Skeletons

| Context | Pattern |
|---------|---------|
| Initial feed load | 3–5 Skeleton MoodCards matching card layout |
| Mood detail | Skeleton post body + comment list |
| Search results | Skeleton cards in results area |
| Statistics charts | Chart-shaped skeleton blocks |
| Admin tables | Row skeletons matching column layout |
| Faculty/major header | Title and chip skeletons |

Skeleton shimmer respects `prefers-reduced-motion` — static gray blocks when reduced motion preferred.

### Spinners

| Context | Pattern |
|---------|---------|
| Button submit | Inline spinner inside button; disable duplicate submit |
| Load more (pagination) | Inline spinner at list bottom |
| Auth submit | Button spinner; fields disabled during request |
| Full-page | App shell hydration only — not for routine content fetch |
| Search bar | Subtle indicator in SearchBar during fetch |

### Empty States

Per `DESIGN.md` §Empty States — turn absence into guidance:

| Context | CTA |
|---------|-----|
| Mood feed (no posts) | Create Mood |
| Faculty/major feed empty | Create Mood, broaden filters |
| Search no results | Clear filters, browse feed |
| Bookmarks empty | Explore feed |
| Comments none | Focus comment input |
| Notifications empty | None — "You're all caught up" |
| Statistics threshold | Explain anonymity protection — no counts |
| Admin report queue empty | None — positive message |
| Guest restricted preview | Register / Login |

Use shared `EmptyState` component: icon/illustration, title, description, single primary CTA.

### Loading State Rules

| Rule | Detail |
|------|--------|
| Never blank screen | Always skeleton, spinner, or empty state |
| Match layout | Skeleton shape mirrors final content to reduce CLS |
| Mutation feedback | Immediate button loading on submit |
| Upload progress | Per-file progress bar in UploadImage — not generic spinner |
| Stale data | Show stale content with subtle `isFetching` indicator where appropriate |
| Admin queue | Show pending count badge in sidebar even while table loads |

---

## Security Responsibilities

The frontend participates in defense-in-depth but is **not** the authoritative security boundary (`security.md`). Backend enforces auth, RBAC, anonymity, and validation.

### Frontend Security Responsibilities

| Responsibility | Implementation |
|----------------|----------------|
| **Token storage** | Access token in-memory preferred; `sessionStorage` acceptable; refresh in HttpOnly cookie only (`authentication.md`, `security.md`) |
| **Token attachment** | Axios interceptor adds Bearer header |
| **Token cleanup** | Clear on logout, refresh failure, invalid token |
| **No secrets in bundle** | Only `VITE_*` public env vars (`NFR-SEC-006`) |
| **XSS prevention** | Sanitize user content before render; avoid `dangerouslySetInnerHTML` (`NFR-SEC-003`) |
| **HTTPS** | Production API URL uses HTTPS only |
| **Route guards** | UX redirect for unauthorized access — server still enforces |
| **Client validation** | Zod forms — UX layer only |
| **Upload validation** | Reject invalid MIME/size before presign request |
| **No R2 credentials** | Client never receives R2 API keys — presigned URLs only |
| **No identity display** | Never render fields not in public DTOs |
| **Error display** | No stack traces or storage internals in UI |
| **CSP compliance** | No inline scripts; Vercel CSP headers on frontend |
| **Logout** | Clear client tokens; call `POST /auth/logout` |
| **Password fields** | `type="password"`; no logging of values |

### What the Frontend Must Not Rely On

| Unsafe assumption | Correct approach |
|-------------------|------------------|
| Hiding `authorId` in UI is enough | API already strips — frontend must not add identity |
| Client-side role check secures admin | Server returns `403` — guard is UX only |
| localStorage for refresh token | HttpOnly cookie only |
| Cached signed URLs forever | Respect `expiresAt`; re-fetch before expiry |
| Client-side ownership for edit/delete | Server returns `403 NOT_OWNER` |

### Dependency Security

| Control | Detail |
|---------|--------|
| CI scanning | `NFR-SEC-008` — npm audit in GitHub Actions |
| Lockfile | Commit `package-lock.json` for reproducible installs |
| Minimal dependencies | Avoid unnecessary packages increasing attack surface |

---

## Cloudflare R2 Integration

Image upload and display follow `cloudflare-r2.md` and `api.md` §Image APIs. The frontend orchestrates the **three-step upload** and **signed URL display** — never handles R2 credentials.

### Image Upload Flow (Frontend)

```
User selects file(s)
      │
      ▼
Client-side validation (MIME, size ≤ 5 MB)
      │
      ▼
POST /api/v1/images/upload-url  (via imageService)
      │
      ▼
Receive: imageId, uploadUrl, uploadMethod, uploadHeaders, expiresAt
      │
      ▼
PUT binary directly to uploadUrl  (NOT via apiClient — raw fetch/Axios to R2 URL)
      │
      ▼
POST /api/v1/images/:imageId/confirm
      │
      ▼
Thumbnail preview (signed URL fetched separately)
      │
      ▼
On mood publish: include imageIds in POST /api/v1/moods
```

#### Upload Hook (`useImageUpload`)

| State | Purpose |
|-------|---------|
| `files` | Selected files with validation status |
| `progress` | Per-file 0–100 during PUT |
| `imageIds` | Confirmed IDs ready for mood creation |
| `errors` | Per-file failure messages |

#### Upload Rules

| Rule | Value |
|------|-------|
| Allowed MIME | `image/jpeg`, `image/png`, `image/webp` |
| Max size | 5 MB per image |
| Max per post | 4 images |
| PUT headers | Use `uploadHeaders` from presign response |
| Direct to R2 | Do not send binary through `apiClient` base URL |
| Publish gate | Block mood submit until uploads confirmed or removed |
| Remove before publish | `DELETE /api/v1/images/:imageId` for unlinked images |

#### Progress UX

Upload Image component shows per-file progress bar (`DESIGN.md` Loading States). Users see validation errors before upload starts. Storage internals (bucket, object key) are never shown.

### Image Display Flow (Frontend)

```
Mood DTO contains images: [{ id, sortOrder }]
      │
      ▼
For each visible image: GET /api/v1/images/:imageId/url
      │
      ▼
TanStack Query caches { url, expiresAt }
      │
      ▼
Render <img src={url} /> in MoodCard / gallery
      │
      ▼
Before expiresAt: reuse cached URL
After expiry: refetch signed URL
```

| Rule | Detail |
|------|--------|
| No permanent URLs | Always fetch via backend authorization |
| Cache in Query | Key `['images', imageId, 'url']` with staleTime until `expiresAt` minus buffer |
| Do not persist URLs | No `localStorage` for signed URLs |
| Display failure | Broken image placeholder with retry |
| Feed performance | Lazy load thumbnails; full image in detail/lightbox |
| User-uploaded images | Neutral border in dark mode — no assumed white background |

### Delete and Cleanup (Frontend)

| Action | API |
|--------|-----|
| Remove image before publish | `DELETE /api/v1/images/:imageId` |
| Mood delete | `DELETE /api/v1/moods/:moodId` — backend cascades image cleanup |

Frontend removes preview from local upload state on delete; invalidates image URL queries.

---

## Future Scalability

Aligned with `README.md` Future Improvements, `SPECS.md` §12, `DESIGN.md` §Future UI Improvements, and `architecture.md`.

### Application Growth

| Area | Strategy |
|------|----------|
| **Feature modules** | New domains add new `features/<name>/` without restructuring |
| **Shared package** | `packages/shared` for Zod schemas and DTO types when duplication burdens (`architecture.md`) |
| **Route additions** | New pages + lazy chunks; extend router and `constants/routes.ts` |
| **i18n** | Future: string extraction, `react-i18n` or similar; `lang` attribute per locale |
| **Multi-university** | Per-tenant branding tokens; `tenantId` header when backend supports |

### Real-Time

| Feature | Frontend approach |
|---------|-------------------|
| Live feed updates | WebSocket or SSE client; TanStack Query invalidation on event (future) |
| Notification count | Poll or subscribe; badge on navbar bell |

Not in v1 scope (`README.md` Future Improvements).

### Mobile

| Feature | Approach |
|---------|----------|
| React Native app | Consume same REST API and JWT; shared types from `packages/shared` |
| Push notifications | Device token registration endpoints (future `api.md`) |

### Performance at Scale

| Technique | When |
|-----------|------|
| Feed virtualization | Long infinite scroll lists |
| Service worker / offline | Optional PWA for read cache (future) |
| Prefetch next page | `prefetchInfiniteQuery` on scroll approach threshold |
| Image CDN transforms | Cloudflare Images resize parameters (future `cloudflare-r2.md`) |

### Analytics UI

| Feature | Approach |
|---------|----------|
| Advanced charts | Lazy-loaded chart library; server pre-aggregated data only |
| Export CSV/PDF | Download from future export endpoint — advisor/admin only |

### Accessibility Maturity

| Feature | Approach |
|---------|----------|
| WCAG 2.1 AA audit | Formal remediation pass (deferred `NFR-UX-005`) |
| High-contrast theme | Additional theme token set |
| Dyslexia-friendly font | Optional `font-dyslexic` toggle |

---

## Best Practices

### Architecture

| Practice | Rationale |
|----------|-----------|
| Thin pages | Data logic in feature hooks |
| Feature isolation | No cross-feature imports |
| Presentational components | Testable, reusable |
| Services without React | Callable from hooks and tests |
| Types mirror `api.md` | Contract alignment |

### Data Fetching

| Practice | Rationale |
|----------|-----------|
| TanStack Query for all API data | `INT-API-002` |
| Query key factory | Consistent invalidation |
| No server data in Context | Avoid stale cache |
| Cursor pagination | `OD-005` resolution |
| Invalidate after mutations | Fresh feeds and counts |

### UI / UX

| Practice | Rationale |
|----------|-----------|
| Skeleton > spinner for content | `DESIGN.md` Loading States |
| Empty states with CTA | `DESIGN.md` Empty States |
| Anonymity notice on forms | `DESIGN.md` |
| Preserve drafts on failure | Emotional content protection |
| Mobile-first breakpoints | `NFR-UX-001` |

### Security

| Practice | Rationale |
|----------|-----------|
| Sanitize before render | `NFR-SEC-003` |
| HttpOnly refresh cookie | XSS mitigation |
| Short-lived access token | Limit exposure |
| Client upload validation | Reduce unnecessary presign calls |
| Never log tokens | `security.md` |

### Code Quality

| Practice | Rationale |
|----------|-----------|
| TypeScript strict mode | `NFR-MAINT-005` |
| ESLint + Prettier | `NFR-MAINT-004` |
| Functional components + hooks | `README.md` Coding Standards |
| Colocate feature tests | Maintainability |
| Conventional Commits | `README.md` Git Conventions |

### Anti-Patterns

| Anti-pattern | Why forbidden |
|--------------|---------------|
| Axios in components | Bypasses interceptors and typing |
| TanStack Query in leaf MoodCard | Couples presentation to data |
| `localStorage` for refresh token | XSS theft risk |
| Duplicating feed in `useState` | Stale data |
| Displaying `authorId` if ever present | Anonymity violation |
| `dangerouslySetInnerHTML` on user content | XSS risk |
| Full page reload for navigation | Breaks SPA model |
| Storing signed R2 URLs in localStorage | Security and expiry issues |
| Business rules in components | `NFR-MAINT-002` layer violation |
| Redux for API cache | TanStack Query is authoritative |

### Testing Priorities

Per `NFR-MAINT-006` and frontend scope:

1. Auth flow — login, logout, guard redirects, token refresh.
2. Form validation — Zod schemas match API rejection cases.
3. Public component snapshots — no identity fields rendered.
4. Upload flow — validation rejects invalid files client-side.
5. Error mapping — API codes produce correct user messages.

---

## Related Documents

| Document | Frontend relevance |
|----------|-------------------|
| [`README.md`](../README.md) | Stack, coding standards, deployment (Vercel) |
| [`SPECS.md`](../SPECS.md) | Functional and non-functional requirements |
| [`DESIGN.md`](../DESIGN.md) | UI/UX, components, layouts, states, tokens |
| [`architecture.md`](./architecture.md) | System architecture, frontend layer model, state strategy |
| [`api.md`](./api.md) | REST contracts for services and types |
| [`authentication.md`](./authentication.md) | JWT, refresh, route protection, token storage |
| [`cloudflare-r2.md`](./cloudflare-r2.md) | Upload/download flows, limits, TTLs |
| [`security.md`](./security.md) | Frontend security responsibilities, CSP, sanitization |
| [`database.md`](./database.md) | DTO shapes, anonymity fields, tag/emotion model |
| [`backend.md`](./backend.md) | Backend boundaries — what frontend must not duplicate |
| [`.cursor/rules/frontend.mdc`](../.cursor/rules/frontend.mdc) | AI implementation guardrails |
| [`.cursor/rules/ui.mdc`](../.cursor/rules/ui.mdc) | UI consistency rules |

---

## Document Maintenance

| Event | Action |
|-------|--------|
| New page in `DESIGN.md` | Add route, page, lazy import |
| New API endpoint | Add service method, hook, types |
| Open decision resolved (`OD-002`, `OD-009`) | Update route guards and access tables |
| Design token change | Update Styling section and `tailwind.config.ts` |
| Performance incident | Update Performance Optimization; log in `PROJECT_AUDIT.md` |
| Stack deviation | ADR in `architecture.md` |

---

*This document defines the complete frontend architecture and engineering guidelines for Mood of the Major. All frontend implementation must conform to these specifications and the design intent in `DESIGN.md`.*
