# Mood of the Major — Product Design

> **Document type:** UI/UX design specification  
> **Status:** Draft v1.0  
> **Authority:** This document derives from [`README.md`](./README.md) and [`SPECS.md`](./SPECS.md). Where conflict exists, `README.md` takes precedence, then `SPECS.md`.

---

## Table of Contents

1. [Product Vision](#product-vision)
2. [Design Philosophy](#design-philosophy)
3. [User Experience Principles](#user-experience-principles)
4. [User Personas](#user-personas)
5. [User Journey](#user-journey)
6. [Navigation Structure](#navigation-structure)
7. [Layout Design](#layout-design)
8. [Component Design](#component-design)
9. [Color Palette](#color-palette)
10. [Typography](#typography)
11. [Icons](#icons)
12. [Responsive Design Strategy](#responsive-design-strategy)
13. [Accessibility](#accessibility)
14. [Empty States](#empty-states)
15. [Loading States](#loading-states)
16. [Error States](#error-states)
17. [Animation Guidelines](#animation-guidelines)
18. [Dark Mode Strategy](#dark-mode-strategy)
19. [Future UI Improvements](#future-ui-improvements)

---

## Product Vision

Mood of the Major is a calm, trustworthy digital space where university students can express how they truly feel — without fear of judgment or exposure. The product design must make anonymity feel **safe and intentional**, not hidden or suspicious.

Visually and experientially, the platform should communicate three ideas at every touchpoint:

1. **You are heard** — Sharing emotions is normalized, welcomed, and easy.
2. **You are not alone** — Feeds, faculty views, and statistics reveal shared emotional landscapes without singling anyone out.
3. **Your privacy is protected** — The interface never surfaces identity, never nudges users toward self-exposure, and treats aggregated data with care.

The design supports both **emotional expression** (posting, reacting, commenting) and **collective understanding** (trending emotions, statistics dashboards). It must feel like a thoughtful campus well-being tool — not a generic social network, not a clinical medical app, and not an anonymous message board associated with harm.

---

## Design Philosophy

### Core Tenets

| Tenet | Design implication |
|-------|-------------------|
| **Anonymity is visible in what is absent** | Never show avatars, usernames, or profile links on public content. Use neutral, consistent anonymous presentation. |
| **Emotion before engagement metrics** | Mood category and content lead each card; reaction counts support context but do not dominate. |
| **Warmth without trivializing pain** | The visual language is approachable and human, but never flippant about stress, anxiety, or difficult experiences. |
| **Clarity over cleverness** | Navigation, labels, and actions use plain language. Students should understand where they are and what will happen when they post. |
| **Progressive disclosure** | Filters, statistics detail, and admin tools reveal complexity only when the user seeks it. |
| **Consistency builds trust** | Components, spacing, and interaction patterns repeat across feeds, detail views, and dashboards. |

### Emotional Tone

The product tone sits between **reflective journal** and **supportive community board**:

- Soft, breathable layouts with generous whitespace
- Mood categories expressed through color and iconography, not alarming defaults
- Microcopy that validates feelings ("Share what's on your mind") rather than demanding performance ("What's your status?")
- Statistics presented as community insight, not surveillance

### Design Constraints (from specifications)

- Public-facing views must never display personally identifiable information (`NFR-PRIV-001`)
- User-generated content must be rendered safely without executing embedded scripts (`NFR-SEC-003`)
- Forms must provide inline validation feedback (`NFR-UX-002`)
- All data-fetching views must handle loading, empty, and error states (`NFR-UX-003`)
- The interface must be responsive across desktop and mobile (`NFR-UX-001`)
- Visual design will be implemented with Tailwind CSS per README; this document defines intent, not class names

---

## User Experience Principles

### 1. Safety First

Users should feel protected before they feel entertained. Registration is required to post, but browsing may be partially open to guests (final access level TBD per `SPECS.md` OD-002). Every destructive or sensitive action — reporting, deleting, logging out — uses clear confirmation patterns.

### 2. Anonymous by Default

There is no profile page, follower count, or public identity surface for students. Bookmarks and personal history are private to the authenticated user. The UI never implies that others can see who posted, commented, or reacted.

### 3. Contextual Belonging

Faculty and major context helps students find emotionally relevant content. Filters and feeds make academic community visible without turning the product into a directory of people.

### 4. Friction Where It Matters

Posting, reporting, and admin moderation actions may require deliberate steps. Casual browsing and reacting remain lightweight. Image upload shows explicit progress so users understand when content is fully published.

### 5. Data with Dignity

Statistics dashboards aggregate emotions respectfully. When data falls below the minimum aggregation threshold (`BR-STAT-001`), the UI explains why numbers are hidden — protecting privacy, not withholding information arbitrarily.

### 6. Recoverable Mistakes

Validation errors are specific and field-level. Network failures offer retry. Upload interruptions can be resumed or cancelled cleanly. Users should never wonder whether their mood was published.

### 7. Role-Appropriate Interfaces

Students see expression and community tools. Administrators see moderation queues and audit-oriented layouts. The two experiences share a design system but not the same navigation emphasis.

---

## User Personas

### Student

| Attribute | Description |
|-----------|-------------|
| **Name (archetype)** | Mina — Second-year Computer Science student |
| **Age** | 19–24 |
| **Goals** | Vent safely about coursework pressure; see that others in her major feel similar stress; occasionally bookmark posts that resonate |
| **Behaviors** | Checks the mood feed between classes; posts anonymously 1–2 times per week; reacts more than she comments |
| **Frustrations** | Fear of being identified in small major groups; overwhelmed by loud, metric-obsessed social apps; unclear moderation when content feels harmful |
| **Needs from the product** | Simple post flow, clear anonymity cues, faculty/major filtering, trending emotions, private bookmarks |
| **Device context** | Primarily mobile on campus; occasional laptop use in the evening |

**Design response:** Mobile-first feeds, prominent "anonymous" reassurance on post creation, mood category badges for quick scanning, minimal steps from feed to post.

---

### Administrator

| Attribute | Description |
|-----------|-------------|
| **Name (archetype)** | Dr. Chen — Student affairs platform administrator |
| **Age** | 30–55 |
| **Goals** | Review reported content quickly; remove policy violations; monitor platform health without browsing individual student identities casually |
| **Behaviors** | Opens admin dashboard daily; processes report queue in batches; suspends accounts only after documented review |
| **Frustrations** | Moderation tools that hide context; no audit trail visibility; student UI patterns reused awkwardly in admin workflows |
| **Needs from the product** | Clear report reasons, content preview, action buttons with confirmation, audit log access, user management table |
| **Device context** | Desktop-first during office hours |

**Design response:** Dense but legible admin tables, sidebar navigation separate from student nav, confirmation modals for destructive actions, timestamps and status chips on reports.

---

> **Note:** Faculty advisors (`SPECS.md` §5.1) share statistics dashboard access with a read-focused experience similar to the Statistics Dashboard layout, without admin moderation tools. Advisor-specific UI may reuse the statistics views with reduced navigation.

---

## User Journey

### First Visit

1. Guest arrives on the **Landing Page** via university link, search, or word of mouth.
2. Hero section communicates purpose: anonymous emotional sharing and community mood visibility.
3. Guest may preview a limited public feed or feature summary (access level TBD).
4. Primary call-to-action: **Register** or **Log in**.
5. Secondary paths: Learn how anonymity works, view trending emotions preview (if publicly available).

**Success signal:** User understands the platform is university-scoped, anonymous, and safe to try.

---

### Registration

1. User navigates to **Register** from landing page or auth prompt on protected action.
2. Form collects required credentials (fields defined in `docs/authentication.md`).
3. Inline validation provides immediate feedback per field.
4. User selects or confirms faculty and major affiliation if required at registration (TBD per `SPECS.md` OD-013).
5. On success, user is authenticated and redirected to the **Mood Feed (Dashboard)** with a brief welcome state optional for first-time users.
6. On failure, field-level errors display without clearing valid inputs.

**Success signal:** Account created; user lands in the main feed ready to browse or post.

---

### Login

1. User opens **Login** page.
2. Enters credentials; validation runs on submit and inline where appropriate.
3. On success, redirect to last intended destination or default **Mood Feed**.
4. On failure, generic error message avoids confirming whether email exists (security best practice).
5. Rate-limited attempts show a calm cooldown message (`FR-AUTH-009`).

**Success signal:** Authenticated session established; navbar reflects logged-in state.

---

### Browse Moods

1. User views **Mood Feed** — chronological or personalized list of anonymous posts.
2. Each post appears as a **Mood Card** with category badge, excerpt, faculty/major context, reaction and comment counts, optional image thumbnail.
3. User scrolls; **Pagination** or infinite scroll loads more content.
4. User may open **Filter Panel** to narrow by faculty, major, category, or date.
5. User may use **Search Bar** for text or metadata search.
6. Tapping a card opens **Mood Detail**.

**Success signal:** User finds relevant emotional content without seeing author identity.

---

### Create Mood

1. User taps **Create Mood** action (navbar button or floating action on mobile).
2. **Create Mood** view opens as page or modal with: text area, required mood category selector, faculty/major association (if applicable).
3. Optional **Upload Image** section available before publish.
4. Inline validation enforces required fields and length limits.
5. User submits; loading state confirms submission in progress.
6. On success, user sees confirmation and is taken to the new **Mood Detail** or back to feed with success toast.
7. Anonymity reminder visible: "Your name will not be shown."

**Success signal:** Post published anonymously with correct category and context.

---

### Upload Image

1. During create (or edit, if supported), user opens **Upload Image** component.
2. User selects image(s) from device; client-side validation shows rejected files immediately (type, size — limits TBD).
3. Component displays upload progress while file transfers via presigned URL flow (user sees progress, not technical detail).
4. Thumbnail preview appears on success.
5. User may remove image before publish.
6. If upload fails, retry and cancel options display clearly.
7. Publish is blocked until pending uploads complete or user removes failed items.

**Success signal:** Image attached to post; preview visible; no exposure of storage internals to user.

---

### Comment

1. From **Mood Detail**, user scrolls to comment section.
2. Authenticated users see **Comment Input** with anonymity reminder.
3. User submits comment; it appears in list without commenter identity.
4. Comment list supports flat or threaded layout (structure TBD); design accommodates both with indentation for threads if enabled.
5. User may report individual comments via overflow menu.

**Success signal:** Comment visible anonymously; counts update on post card when returning to feed.

---

### React

1. On **Mood Card** or **Mood Detail**, user opens reaction control.
2. Predefined emotional reactions display as icon buttons or compact picker.
3. User selects one reaction per post (`FR-REACT-003`); selecting another replaces the previous.
4. Total reaction counts update; individual reactors are never listed.
5. Same pattern applies to comments when comment reactions are enabled.

**Success signal:** Reaction recorded with immediate count feedback, no identity leakage.

---

### Bookmark

1. User taps bookmark control on **Mood Card** or **Mood Detail**.
2. Icon toggles to filled/active state with brief confirmation.
3. User accesses **Bookmarks** page from navbar or profile menu to view saved posts.
4. Removing bookmark toggles icon off.

**Success signal:** Post saved privately; retrievable from bookmarks list.

---

### View Statistics

1. User navigates to **Statistics Dashboard** (students: access TBD; advisors/admins: full access).
2. Dashboard shows scope selector: platform-wide, faculty, or major.
3. **Statistics Cards** and charts display distributions and trends.
4. If aggregation threshold not met, **protected empty state** explains insufficient data.
5. **Trending Emotions** section highlights rising themes for selected scope.
6. Date range filter adjusts time-series views.

**Success signal:** User gains community-level insight without any individual post attribution in charts.

---

### Report Content

1. User opens overflow menu on post or comment → **Report**.
2. **Report Modal** opens with reason categories and optional description.
3. User submits; confirmation acknowledges receipt without revealing report status to content author.
4. Duplicate report within cooldown shows informative message (`FR-RPT-005`).
5. Admin receives item in queue (admin journey).

**Success signal:** User feels heard; reporter identity protected from content author.

---

## Navigation Structure

### Global Navigation Model

The application uses a **top navbar** on all authenticated student pages, with supplementary **sidebar** navigation on desktop for feed switching and filters. Mobile collapses sidebar items into bottom tab bar or hamburger drawer.

Administrators use a **separate admin shell** with persistent left sidebar; they do not share the student bottom navigation pattern.

### Site Map

```
Landing (/)
├── Register (/register)
├── Login (/login)
│
└── Authenticated — Student Shell
    ├── Mood Feed (/feed)                    [default home]
    ├── Faculty Feed (/faculty/:facultyId)
    ├── Major Feed (/major/:majorId)
    ├── Create Mood (/create)
    ├── Mood Detail (/mood/:moodId)
    ├── Search Results (/search)
    ├── Bookmarks (/bookmarks)
    ├── Trending (/trending)
    ├── Statistics (/statistics)
    └── Notifications (/notifications)       [Phase 3]

└── Authenticated — Admin Shell
    ├── Admin Overview (/admin)
    ├── Report Queue (/admin/reports)
    ├── Content Moderation (/admin/content)
    ├── User Management (/admin/users)
    ├── Mood Categories (/admin/categories)   [optional config]
    ├── Platform Health (/admin/health)      [Phase 3+]
    └── Audit Log (/admin/audit)
```

### Page Descriptions & Navigation Flows

| Page | Purpose | Primary entry | Outbound navigation |
|------|---------|---------------|---------------------|
| **Landing** | Marketing, trust-building, auth CTAs | Direct URL | Register, Login, optional public preview |
| **Register** | Account creation | Landing, auth gates | Login link, Mood Feed on success |
| **Login** | Authentication | Landing, protected redirects | Register link, Mood Feed on success |
| **Mood Feed** | Main anonymous post stream | Login default, navbar logo | Mood Detail, Create, Faculty/Major feeds, Search, Filters |
| **Faculty Feed** | Faculty-scoped posts | Navbar, Faculty Page, filters | Mood Detail, Major Feed within faculty |
| **Major Feed** | Major-scoped posts | Navbar, Major Page, filters | Mood Detail, Faculty Feed parent |
| **Create Mood** | New post composition | Navbar CTA, empty state CTA | Mood Detail on success, Feed on cancel |
| **Mood Detail** | Full post, comments, reactions | Any Mood Card | Report, back to originating feed |
| **Search Results** | Query matches | Search Bar | Mood Detail, refine filters |
| **Bookmarks** | Saved posts list | Navbar account menu | Mood Detail |
| **Trending** | Trending emotions summary | Navbar, statistics sidebar | Faculty/Major scoped trending, related feeds |
| **Statistics** | Aggregated charts and metrics | Navbar (role-gated) | Faculty/Major drill-down |
| **Notifications** | In-app activity alerts | Navbar bell icon | Linked Mood Detail or system message |
| **Admin Overview** | Moderation summary KPIs | Admin login redirect | Report Queue, User Management |
| **Report Queue** | Pending user reports | Admin sidebar | Content detail, resolution actions |
| **Content Moderation** | Browse/remove violating posts | Admin sidebar | Mood Detail (admin view with identity for moderation only) |
| **User Management** | Suspend/reinstate accounts | Admin sidebar | User detail panel |
| **Audit Log** | Admin action history | Admin sidebar | Filter by action type, date |

### Navigation Components by Role

| Element | Student | Admin |
|---------|---------|-------|
| Logo / Home | → Mood Feed | → Admin Overview |
| Primary nav links | Feed, Trending, Statistics*, Bookmarks | Reports, Content, Users |
| Create action | Prominent button | Hidden |
| Search | Global search bar | Search within admin tables |
| Notifications | Bell icon (Phase 3) | Alert badge on report count |
| Account menu | Bookmarks, Logout | Logout, switch to student view* |

\*Statistics student access TBD. Admin "student view" only if admins are also students — optional.

---

## Layout Design

### Landing Page

**Purpose:** Convert visitors into registered users; establish trust in anonymity.

**Structure:**

| Zone | Content |
|------|---------|
| **Header** | Logo, Login, Register buttons |
| **Hero** | Headline, subheadline explaining anonymous campus mood sharing, primary Register CTA |
| **Value pillars** | Three columns: Express safely, See community mood, Understand trends |
| **Preview strip** | Optional anonymized sample cards or blurred feed preview (if guest browsing permitted) |
| **How it works** | Step sequence: Register → Share anonymously → Explore faculty mood |
| **Footer** | University scope notice, privacy statement link, copyright |

**Layout character:** Full-width sections, centered content max-width container, generous vertical rhythm. No sidebar.

---

### Authentication Pages (Register / Login)

**Purpose:** Secure, low-friction credential entry.

**Structure:**

| Zone | Content |
|------|---------|
| **Header** | Logo (links to Landing), minimal nav |
| **Center card** | Form title, fields, submit button, link to alternate auth page |
| **Aside (desktop)** | Illustration or anonymity reassurance quote |
| **Footer** | Terms/privacy links placeholder |

**Layout character:** Single-column centered card on mobile; split card + aside on desktop. Maximum form width constrained for readability (~400px form column).

---

### Dashboard (Mood Feed)

**Purpose:** Primary student home — browse anonymous moods.

**Structure:**

| Zone | Content |
|------|---------|
| **Navbar** | Logo, nav links, Search Bar, Create button, notifications, account menu |
| **Subheader strip** | Active feed label, quick faculty/major context chip |
| **Left sidebar (desktop)** | Feed switcher (All / Faculty / Major), Filter Panel collapsed sections |
| **Main column** | Mood Card list with Pagination |
| **Right rail (desktop, optional)** | Trending Emotions compact widget |
| **Mobile** | Filter drawer; bottom nav for Feed, Trending, Create, Bookmarks |

**Layout character:** Two-column on large screens (sidebar + feed); single column on mobile. Feed is the visual focus — sidebars are secondary.

---

### Faculty Page

**Purpose:** Browse moods and emotional context for one faculty.

**Structure:**

| Zone | Content |
|------|---------|
| **Page header** | Faculty name, short description, mood summary chips |
| **Scope bar** | Link to child majors, statistics link for this faculty |
| **Filter Panel** | Major filter, category, date range |
| **Main feed** | Mood Cards filtered to faculty |
| **Sidebar** | Faculty-level trending emotions, statistics teaser |

**Layout character:** Similar to Dashboard with stronger page header branding the faculty context. Breadcrumb: Feed → Faculty Name.

---

### Major Page

**Purpose:** Browse moods scoped to a single major.

**Structure:**

| Zone | Content |
|------|---------|
| **Page header** | Major name, parent faculty link, mood summary chips |
| **Scope bar** | Statistics link for this major |
| **Filter Panel** | Category, date range (major fixed) |
| **Main feed** | Mood Cards filtered to major |
| **Sidebar** | Major-level trending, threshold notice if group small |

**Layout character:** Mirrors Faculty Page with narrower scope. Breadcrumb: Feed → Faculty → Major.

---

### Mood Detail

**Purpose:** Read full post, view images, comment, react, bookmark, report.

**Structure:**

| Zone | Content |
|------|---------|
| **Header** | Back navigation, report overflow menu |
| **Post body** | Emotion Badge, timestamp (relative), faculty/major chips, full text |
| **Image gallery** | One or more images with lightbox expansion |
| **Engagement bar** | Reaction picker, reaction count summary, bookmark |
| **Comments section** | Comment Input, Comment Card list |
| **Footer** | Pagination or load more for long comment threads |

**Layout character:** Single centered column (max-width ~720px) for readability. Comments visually nested below post with clear separation.

---

### Statistics Dashboard

**Purpose:** Visualize aggregated emotional data by scope and time.

**Structure:**

| Zone | Content |
|------|---------|
| **Header** | Title, scope selector (platform / faculty / major), date range |
| **KPI row** | Statistics Cards: total posts in period, dominant category, trend direction |
| **Chart grid** | Distribution chart (by category), time-series line chart |
| **Trending section** | Trending Emotions list with spark indicators |
| **Privacy notice** | Footer note on aggregation thresholds and anonymity |

**Layout character:** Card-based dashboard grid. Charts stack vertically on mobile; two-column chart grid on desktop.

---

### Admin Dashboard

**Purpose:** Moderation, reporting, and platform oversight.

**Structure:**

| Zone | Content |
|------|---------|
| **Left sidebar** | Admin nav items, report count badge |
| **Top bar** | Page title, admin user indicator, logout |
| **Overview (default)** | KPI cards: open reports, actions today, active users |
| **Main workspace** | Table or detail panel depending on section |
| **Report Queue view** | Filterable table: content type, reason, date, status |
| **Detail drawer** | Content preview, moderation actions, audit note field |

**Layout character:** utilitarian density — more compact than student UI. Fixed sidebar on desktop; collapsible drawer on tablet. No marketing whitespace.

---

## Component Design

### Navbar

**Purpose:** Persistent top navigation and global actions.

**Anatomy:** Logo, primary nav links, Search Bar (compact on mobile), Create Mood button, notification bell, account dropdown.

**States:** Default, scrolled (subtle shadow), mobile menu open.

**Behavior:** Create button hidden for guests. Admin users see "Admin" link or separate admin entry in account menu.

---

### Sidebar

**Purpose:** Feed switching and filter access on desktop.

**Variants:**

- **Student feed sidebar** — Feed type links, Filter Panel sections
- **Admin sidebar** — Moderation sections with badge counts

**States:** Expanded, collapsed (icon-only on narrow desktop).

**Behavior:** On mobile, sidebar content moves to drawer triggered by filter or menu icon.

---

### Mood Card

**Purpose:** Summarize one anonymous post in a feed or list.

**Anatomy:**

- Emotion Badge (mood category)
- Post text excerpt (truncated with ellipsis)
- Faculty / major context chips
- Optional image thumbnail (single image preview; count badge if multiple)
- Reaction count cluster (no per-user breakdown)
- Comment count
- Bookmark and overflow (report) actions
- Relative timestamp

**States:** Default, hovered (elevated shadow), bookmarked (filled icon), skeleton loading.

**Behavior:** Entire card navigates to Mood Detail except interactive controls (bookmark, reaction quick-action optional on card).

---

### Comment Card

**Purpose:** Display one anonymous comment.

**Anatomy:**

- Comment text
- Relative timestamp
- Reaction control and count (if enabled)
- Report in overflow menu
- Thread indicator / reply nesting (if threaded model selected)

**States:** Default, hovered, flagged (admin view only).

**Behavior:** No author name or avatar. Replies indent under parent in threaded mode.

---

### Emotion Badge

**Purpose:** Visually identify mood category at a glance.

**Anatomy:** Icon + label (e.g., Stress, Joy, Anxiety, Gratitude). Color derived from category token.

**Variants:** Small (inline in cards), large (Mood Detail header), filter chip (selectable).

**States:** Default, selected (filter context), deactivated (admin category management).

**Behavior:** Every post displays exactly one primary category per `FR-CAT-001` at creation; badge color consistent everywhere.

---

### Statistics Card

**Purpose:** Display one aggregated KPI.

**Anatomy:** Label, large numeric or percentage value, optional delta indicator (up/down vs. prior period), optional sparkline.

**States:** Loaded, threshold-protected (shows "Insufficient data" instead of value), loading skeleton.

**Behavior:** Never displays values that could identify individuals. Respects minimum aggregation threshold visually.

---

### Search Bar

**Purpose:** Initiate text and metadata search.

**Anatomy:** Input field, search icon, clear button when filled, optional keyboard shortcut hint on desktop.

**States:** Empty, focused, filled, loading results, disabled (guest if search restricted).

**Behavior:** Submit navigates to Search Results page. Debounced suggestions optional in future; not required for v1.

---

### Filter Panel

**Purpose:** Narrow feed or search results by structured criteria.

**Anatomy:** Sections for faculty, major, mood category, date range. Apply and reset buttons.

**Variants:** Sidebar embedded (desktop), bottom sheet (mobile).

**States:** Default, active filters applied (badge count on filter trigger), collapsed sections.

**Behavior:** Faculty selection may cascade major options. Active filters show removable chips above feed.

---

### Upload Image Component

**Purpose:** Select, validate, preview, and upload images during post creation.

**Anatomy:** Drop zone or select button, thumbnail previews with remove control, per-file progress bar, aggregate status text.

**States:** Empty, selecting, uploading, success, error (per file), limit reached.

**Behavior:** Shows validation errors for type/size before upload starts. Displays progress during presigned upload. Does not expose storage URLs in raw form to users — previews use authorized display URLs.

---

### Pagination

**Purpose:** Navigate large feed and list result sets.

**Anatomy:** Previous/next controls, page indicator or "Load more" button, optional page size (admin tables).

**Variants:** Cursor-based "Load more" with opaque `cursor` and `meta.hasMore` per `docs/requirements.md` (`OD-005`).

**States:** First page, middle, last page, loading next page.

**Behavior:** Preserves scroll position or scrolls to top on page change — preference documented as scroll-to-top for numbered, maintain position for load-more.

---

### Additional Reusable Components

| Component | Purpose | Key anatomy |
|-----------|---------|-------------|
| **Button** | Primary, secondary, ghost, danger actions | Label, optional icon, loading spinner state |
| **Icon Button** | Compact actions (bookmark, report, close) | Icon only, tooltip on desktop |
| **Text Input / Textarea** | Forms and comment input | Label, field, inline error message |
| **Select / Dropdown** | Category, faculty, major selection | Label, options, keyboard navigable |
| **Modal** | Report, confirm delete, admin actions | Overlay, title, body, action buttons |
| **Toast** | Transient success/error feedback | Message, dismiss, auto-hide |
| **Tabs** | Admin sections, statistics scope | Tab list, active indicator, panel |
| **Table** | Admin queues and user lists | Sortable headers, row actions, empty state |
| **Breadcrumb** | Faculty / Major hierarchy | Linked path segments |
| **Trending Emotion Chip** | Highlight trending theme | Label, trend arrow, optional count band |
| **Notification Item** | In-app alert row | Icon, message, timestamp, unread dot |
| **Empty State** | Zero-data views | Illustration, title, description, CTA |
| **Skeleton** | Loading placeholders | Card, line, chart shapes matching final layout |
| **Error Banner** | Page-level fetch failure | Message, retry button |
| **Auth Guard Prompt** | Guest hits protected action | Modal encouraging login/register |
| **Anonymity Notice** | Reassurance strip | Icon + short copy on post/comment forms |
| **Date Range Picker** | Statistics and filter | Start/end, presets (7d, 30d, semester) |
| **Chart Container** | Wrapper for data visualizations | Title, legend, threshold empty state |
| **Reaction Picker** | Select emotional reaction | Row of reaction icons, one active |
| **Account Menu** | Logged-in dropdown | Bookmarks, logout, admin link if applicable |
| **Report Form** | Structured reporting | Reason radio list, optional description, submit |
| **Confirm Dialog** | Destructive action gate | Clear consequence text, confirm/cancel |

---

## Color Palette

### Color Philosophy

Color supports **emotional clarity** without stereotyping mental health. Categories receive distinct but harmonious hues — never red-for-danger by default for sadness or anxiety. The overall palette balances **warmth** (community, belonging) with **calm** (safety, reflection).

Neutrals carry most of the interface. Category colors appear as accents — badges, chart segments, subtle borders — not full-screen backgrounds. Soft amber ambient glow may appear on marketing, auth, and header surfaces only — never behind every feed card.

Contrast ratios target readable text on all backgrounds; final WCAG 2.1 AA audit is deferred per README Future Improvements, but palette choices should aim for compliance.

### Semantic Color Roles

| Role | Intent | Description |
|------|--------|-------------|
| **Primary** | Brand, primary CTAs | Soft amber-orange (`#EA580C` light / `#FB923C` dark) — warm, calm, approachable |
| **Secondary** | Supporting actions | Warm stone outline / ghost — secondary buttons stay neutral |
| **Background** | Page canvas | Off-white (light) / deep warm stone (dark) |
| **Surface** | Cards, modals | White (light) / elevated gray (dark) |
| **Text primary** | Body and headings | Near-black (light) / near-white (dark) |
| **Text muted** | Timestamps, hints | Mid-gray |
| **Border** | Dividers, inputs | Light gray / subtle dark border |
| **Success** | Confirmations | Soft green |
| **Warning** | Caution states | Amber |
| **Error** | Validation, failures | Muted rose-red (not aggressive crimson) |
| **Info** | Neutral information | Soft blue |

### Mood Category Colors (examples aligned with SPECS)

| Category | Color direction | Rationale |
|----------|-----------------|-----------|
| **Stress** | Dusty orange | Energy without alarm |
| **Joy** | Warm gold | Positive, sunny |
| **Anxiety** | Soft lavender | Tension without stigma |
| **Gratitude** | Sage green | Grounded, appreciative |

Additional categories added by administrators receive colors from an extended harmonious set — never reuse semantically conflicting hues.

---

## Typography

### Philosophy

Typography prioritizes **readability of emotional text** — students write paragraphs, not headlines. The type system balances a distinctive display face for marketing headers with a highly legible sans-serif for body and UI.

### Type Scale (intent)

| Level | Usage | Character |
|-------|-------|-----------|
| **Display** | Landing hero only | Expressive, larger, letter-spaced slightly |
| **H1** | Page titles (Faculty, Statistics, Admin) | Semibold, clear |
| **H2** | Section headers within pages | Semibold |
| **H3** | Card titles, modal titles | Medium weight |
| **Body** | Post content, comments | Regular, comfortable line height (1.6–1.7) |
| **Small** | Timestamps, chips, table metadata | Regular, muted color |
| **Label** | Form labels, uppercase nav section labels | Medium, optional slight tracking |

### Guidelines

- Post body text uses the largest comfortable reading size on mobile (minimum perceived 16px equivalent).
- Truncation on Mood Cards preserves word boundaries where possible.
- Line length on Mood Detail capped via container width for sustained reading comfort.
- Numeric data in statistics uses tabular figures for alignment.
- Thai or multilingual content is future scope; initial UI is English per `SPECS.md` ASM-006.

### Font Pairing Direction

- **UI / body:** Modern humanist sans-serif (e.g., DM Sans, Outfit, or equivalent — final choice at implementation).
- **Display / marketing:** Complementary geometric or serif accent for landing hero only.

---

## Icons

### Icon Philosophy

Icons clarify actions and categories without decorating every surface. They are **simple, rounded, and consistent stroke weight** — preferably from a single icon family.

### Usage by Context

| Context | Icon approach |
|---------|---------------|
| **Navigation** | Outline icons: home/feed, trending, statistics, bookmarks, admin |
| **Actions** | Bookmark, share-not-used, report (flag), more (overflow), search, filter |
| **Reactions** | Distinct expressive icons per reaction type — not generic thumbs-up only |
| **Mood categories** | Paired with Emotion Badge colors |
| **States** | Success check, error alert, empty inbox, upload cloud, loading spinner |
| **Admin** | Shield, users, clipboard, audit log |

### Guidelines

- Icons always paired with text labels for primary navigation (accessibility).
- Icon-only buttons require accessible names (tooltips on desktop, labels in mobile menus).
- Reaction icons must be distinguishable at small sizes and by shape, not color alone.
- No user avatar icons on anonymous content — use neutral anonymous glyph only in system illustrations, never as per-post identity.

---

## Responsive Design Strategy

### Breakpoint Philosophy

A **mobile-first** approach serves students on campus phones. Tablet and desktop add horizontal space for sidebars, multi-column dashboards, and inline filters — never fundamentally different features across breakpoints.

### Desktop (≥ 1024px)

| Pattern | Behavior |
|---------|----------|
| **Navigation** | Full navbar + left sidebar for feeds/filters |
| **Feed** | Center column with optional right rail (trending) |
| **Mood Detail** | Centered reading column with whitespace margins |
| **Statistics** | Multi-column chart grid |
| **Admin** | Fixed sidebar + wide data tables |
| **Create Mood** | Full page or wide modal |

### Tablet (768px – 1023px)

| Pattern | Behavior |
|---------|----------|
| **Navigation** | Collapsed sidebar (icons) or hamburger; search remains in navbar |
| **Feed** | Single column; filter in drawer |
| **Statistics** | Two-column cards stacking to one |
| **Admin** | Collapsible sidebar overlay |
| **Touch** | Larger tap targets on reactions and bookmarks |

### Mobile (< 768px)

| Pattern | Behavior |
|---------|----------|
| **Navigation** | Bottom tab bar (Feed, Trending, Create, Bookmarks) + top bar with search |
| **Feed** | Full-bleed cards, filter via bottom sheet |
| **Mood Detail** | Full width; sticky engagement bar optional |
| **Create Mood** | Full-screen flow; image upload stacked vertically |
| **Statistics** | Single column; scope selectors as horizontal scroll chips |
| **Admin** | Mobile-supported but optimized for tablet+; horizontal scroll tables with sticky action column |

### Responsive Content Rules

- Mood Card excerpts shorten on mobile (fewer lines before truncation).
- Image galleries swipe horizontally on touch devices.
- Modals become bottom sheets on mobile where appropriate (filters, reactions).
- Tables in admin views degrade to card-list pattern on narrow screens if needed (future enhancement).

---

## Accessibility

### Goals

The product should be usable by students with diverse abilities. Full WCAG 2.1 AA compliance audit is a **future improvement** per README (`NFR-UX-005` is P2), but v1 design decisions should not create preventable barriers.

### Requirements

| Area | Guideline |
|------|-----------|
| **Keyboard** | All interactive elements reachable and operable via keyboard; visible focus indicators |
| **Screen readers** | Meaningful labels on icon buttons; landmarks for nav, main, complementary |
| **Color** | Information never conveyed by color alone (category badges include text labels) |
| **Contrast** | Text and interactive elements meet readable contrast in both light and dark modes |
| **Motion** | Respect `prefers-reduced-motion`; essential animation degrades to instant state change |
| **Forms** | Labels associated with inputs; errors announced and linked to fields |
| **Touch targets** | Minimum 44×44px equivalent on mobile interactive elements |
| **Images** | User-uploaded images support optional alt text at post creation (recommended field) |
| **Language** | Page `lang` attribute set to English initially |

### Inclusive Copy

- Avoid idioms that confuse non-native English speakers.
- Error messages describe how to fix the problem, not only what failed.
- Anonymity explanations use plain language, not legal jargon.

---

## Empty States

Empty states turn absence of data into guidance — never blame the user.

| Context | Message direction | CTA |
|---------|-------------------|-----|
| **Mood Feed (no posts)** | "No moods yet. Be the first to share." | Create Mood |
| **Faculty/Major feed (empty)** | "No posts in this community yet." | Create Mood, broaden filters |
| **Search (no results)** | "Nothing matched your search." | Clear filters, browse feed |
| **Bookmarks (empty)** | "You haven't saved any moods yet." | Explore feed |
| **Comments (none)** | "No comments yet. Add your thoughts." | Focus comment input |
| **Notifications (empty)** | "You're all caught up." | None |
| **Statistics (threshold)** | "Not enough data to protect anonymity. Check back when more students have shared." | None or link to feed |
| **Trending (insufficient data)** | "Trends need more activity in this community." | None |
| **Admin report queue (empty)** | "No open reports. Community is in good shape." | None |
| **Guest preview (restricted)** | "Sign in to see more of your campus mood." | Register / Login |

**Visual pattern:** Simple illustration or icon, short title, one sentence description, single primary CTA. No cluttered empty pages.

---

## Loading States

Loading states reassure users that anonymity-sensitive actions (especially post and upload) are processing.

| Context | Pattern |
|---------|---------|
| **Initial feed load** | Skeleton Mood Cards (3–5 placeholders) |
| **Pagination / load more** | Inline spinner at list bottom; skeleton for admin tables |
| **Mood Detail** | Skeleton for post body and comment list |
| **Create Mood submit** | Button loading spinner; disable duplicate submit |
| **Image upload** | Per-file progress bar inside Upload Image Component |
| **Search** | Subtle loading indicator in Search Bar; results area skeleton |
| **Statistics charts** | Chart-shaped skeleton blocks |
| **Admin tables** | Row skeletons or table overlay spinner |
| **Auth submit** | Button spinner; form fields disabled during request |

**Guideline:** Prefer skeleton screens over generic full-page spinners for content areas. Full-page loader acceptable only for initial app shell hydration.

---

## Error States

Errors are calm, specific, and actionable — especially important when students share vulnerable content.

| Context | User-facing direction | Recovery |
|---------|----------------------|----------|
| **Form validation** | Inline field message | Correct field |
| **Auth failure** | Generic "Invalid credentials" | Retry |
| **Rate limit** | "Too many attempts. Try again in X minutes." | Wait |
| **Network failure** | "Connection lost. Your draft is saved locally if applicable." | Retry button |
| **Post submit failure** | "Couldn't publish your mood. Your text is preserved." | Retry submit |
| **Upload failure** | Per-file error with reason (size, type) | Retry or remove file |
| **Image display failure** | Broken image placeholder | Retry load |
| **403 / unauthorized** | "You don't have access to this page." | Link home or login |
| **404** | "This mood doesn't exist or was removed." | Back to feed |
| **500 / server** | "Something went wrong on our end." | Retry, contact support placeholder |
| **Statistics unavailable** | Threshold or server message distinct from empty data | Retry or change scope |
| **Report submit failure** | "Couldn't send report. Please try again." | Retry |

**Admin errors** may include slightly more technical detail in logs, but user-facing admin UI follows the same calm pattern.

**Guideline:** Never expose stack traces, object keys, or storage internals in error copy (`NFR-SEC-009`).

---

## Animation Guidelines

### Philosophy

Motion should feel **gentle and purposeful** — supporting orientation and feedback, never distracting from emotional content. Avoid bouncy, gamified animations that trivialize serious moods.

### Allowed Animations

| Animation | Usage | Duration |
|-----------|-------|----------|
| **Fade in** | New feed items, modal open | 150–250ms |
| **Slide up** | Mobile bottom sheet, toast | 200–300ms |
| **Scale subtle** | Button press feedback | 100ms |
| **Skeleton shimmer** | Loading placeholders | Continuous, low contrast |
| **Count tick** | Reaction count update | Brief number crossfade |
| **Page transition** | Route change | Subtle fade, 150ms |

### Prohibited / Restricted

- Auto-playing loops on content pages
- Parallax scrolling on feeds
- Confetti or celebration effects on post publish (use calm success toast instead)
- Aggressive shake on validation errors (use color + text)

### Reduced Motion

When `prefers-reduced-motion: reduce` is detected, all non-essential animation collapses to instant state change. Skeleton shimmer becomes static gray blocks.

---

## Dark Mode Strategy

### Approach

Dark mode is a **first-class theme**, not an afterthought inversion. Both themes are designed simultaneously using semantic color tokens (background, surface, text, border) rather than hard-coded light values.

### Rationale

- Students browse evenings and late-night study sessions — dark mode reduces eye strain.
- Emotional content reading benefits from low-glare environments.
- Statistics charts require adjusted gridline and label contrast in dark theme.

### Implementation Intent (design level)

| Token | Light mode | Dark mode |
|-------|------------|-----------|
| **Background** | Off-white | Deep blue-gray |
| **Surface / cards** | White | Elevated dark gray |
| **Primary text** | Near-black | Near-white |
| **Muted text** | Mid-gray | Light gray |
| **Primary brand** | Soft amber-orange | Lighter amber tint for contrast |
| **Category badges** | Pastel backgrounds | Desaturated dark-friendly variants |
| **Charts** | Light gridlines | Subtle dark gridlines, bright data colors |

### Theme Switching

- **Default:** Respect `prefers-color-scheme` system setting on first visit.
- **User override:** Toggle in account menu or settings — options: System, Light, Dark.
- **Persistence:** Preference stored locally for return visits.
- **Transition:** Brief crossfade (≤ 200ms) on theme switch; disabled under reduced motion.

### Dark Mode Content Rules

- User-uploaded images display with neutral border, never assumed white background.
- Elevation communicated via subtle border or shadow, not only color lift.
- Error and success colors adjusted for dark background contrast.

---

## Future UI Improvements

Aligned with README Future Improvements and `SPECS.md` out-of-scope items. Not planned for initial design implementation.

| Area | Enhancement |
|------|-------------|
| **Real-time feed** | Live new-post indicators without full page refresh |
| **Push notifications** | Browser push for replies and trends (alongside in-app) |
| **Advanced analytics UI** | Sentiment overlays, predictive trend callouts |
| **Mobile native shell** | React Native app with shared design tokens |
| **Multi-university branding** | Per-tenant logo, colors, and faculty taxonomy |
| **Internationalization** | RTL support, translated strings, locale date formats |
| **WCAG 2.1 AA audit** | Formal remediation pass with third-party review |
| **Personalized feed ranking** | "For you" tab with privacy-preserving relevance |
| **Export UI** | Download statistics as CSV/PDF for advisors |
| **Rich accessibility** | High-contrast theme, dyslexia-friendly font option |
| **Onboarding tour** | First-run coach marks explaining anonymity |
| **Reaction customization** | User-suggested reaction sets per university |
| **Media beyond images** | Audio mood notes or short voice clips (speculative) |
| **Community guidelines hub** | In-app policy and well-being resources page |

---

## Document Maintenance

| Event | Action |
|-------|--------|
| README or SPECS updated | Reconcile personas, journeys, and constraints |
| Open decisions resolved (`SPECS.md` §14) | Update affected layouts and components |
| New page added | Extend site map and navigation table |
| Implementation feedback | Record deviations in `PROJECT_AUDIT.md` |

---

*This design specification derives from [`README.md`](./README.md) and [`SPECS.md`](./SPECS.md). Implementation in React 19, Vite, and Tailwind CSS must follow this document and the rules in `.cursor/rules/ui.mdc`.*
