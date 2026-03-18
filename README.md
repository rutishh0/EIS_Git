# EIS Command Center

**Rolls-Royce Civil Aerospace -- Entry Into Service Management Dashboard**

A full-stack web application that replaces the legacy Excel-based EIS Metric Tool and Power BI reports with a real-time, collaborative dashboard for tracking airline Entry Into Service (EIS) readiness across 20+ service lines, multiple engine programmes, and five global regions.

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Getting Started](#getting-started)
4. [Project Structure](#project-structure)
5. [Architecture](#architecture)
6. [Database Schema](#database-schema)
7. [Pages and Routes](#pages-and-routes)
8. [Components](#components)
9. [Data Layer](#data-layer)
10. [Authentication and Authorisation](#authentication-and-authorisation)
11. [Notification System](#notification-system)
12. [Filtering System](#filtering-system)
13. [Service Line Categories](#service-line-categories)
14. [Off-Plan Detection and Dispute Workflow](#off-plan-detection-and-dispute-workflow)
15. [API Reference](#api-reference)
16. [Excel Import and Export](#excel-import-and-export)
17. [Design System](#design-system)
18. [Shared Utility Functions](#shared-utility-functions)
19. [Environment Variables](#environment-variables)
20. [Deployment](#deployment)
21. [Development Conventions](#development-conventions)
22. [Troubleshooting](#troubleshooting)

---

## Overview

The EIS Command Center is an operational dashboard used by the Rolls-Royce Civil Aerospace EIS team to monitor and manage the readiness of airline customers transitioning to new Trent engine programmes. Each airline has a scorecard with 22 service lines (Product Agreement, TotalCare, IP Spares, EHM, Customer Training, Flight Ops, etc.), each tracked with a RAG (Red/Amber/Green/Complete/N/A) status, free-text status descriptions, and comments.

### Key Capabilities

- **Regional Summary Heatmap**: A Power BI-style matrix view showing all airlines against all service lines, colour-coded by RAG status. Hover for status text, click for full comments.
- **Category Tab Views**: Dedicated pages for Contracts, Technical Availability, Maintenance, Customer Support, and Asset Availability -- each showing only the service lines relevant to that team.
- **Off-Plan Detection**: Automatic flagging when any service line is RED and the airline's EIS date is within six months. Alerts are sent to the assigned EIS Lead.
- **Dispute Workflow**: Users can dispute a RED status with a written note. The dispute creates notifications for the EIS Lead and all admins, who can confirm or override the status.
- **Past EIS Archive**: View completed and past-EIS programmes with their final service line statuses.
- **Quarterly Timeline**: A Gantt-style chart showing all active programmes plotted against their EIS dates, rendered in quarterly intervals.
- **Real-Time Alerts**: Persistent notification system with mark-as-read, dismiss, and mark-all-read. Notifications target EIS Leads specifically for their assigned programmes.
- **Inline Editing**: Editors and admins can change RAG statuses, update status text, and edit comments directly from the heatmap or scorecard detail views.
- **Admin Panel**: User management (create, edit, deactivate, delete), Excel import with validation feedback, and a paginated audit log.
- **Global Filters**: Persistent filter bar (Region, Engine Type, RAG Status) stored in URL search parameters so filtered views are shareable and bookmarkable.
- **Command Palette**: Ctrl+K global search to find airlines and navigate between pages instantly.
- **Excel Import/Export**: Import scorecards from the legacy EIS Metric Tool Excel workbooks; export filtered data as XLSX.

### Users and Roles

The system supports three roles:

| Role | Permissions |
|------|-------------|
| **ADMIN** | Full access: manage users, import data, edit all scorecards, view audit log, resolve disputes |
| **EDITOR** | Edit scorecards, change RAG statuses, add comments, raise disputes |
| **VIEWER** | Read-only access to all dashboards and data |

The default admin account is seeded as `admin` / `admin123`.

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | TypeScript | 5.x |
| React | React | 19.2.3 |
| Database | PostgreSQL | 16 |
| ORM | Prisma | 6.19.2 |
| Authentication | NextAuth.js (Credentials provider) | 4.24.13 |
| Styling | Tailwind CSS | 4.x |
| UI Components | shadcn/ui (Radix primitives) | -- |
| Icons | Lucide React | 0.577.0 |
| Charts | Recharts | 3.7.0 |
| Forms | React Hook Form + Zod | 7.71.2 / 4.3.6 |
| Date Utilities | date-fns | 4.1.0 |
| Excel | SheetJS (xlsx) | 0.18.5 |
| Toast Notifications | Sonner | 2.0.7 |
| Command Palette | cmdk | 1.1.1 |
| Password Hashing | bcryptjs | 3.0.3 |
| Fonts | Outfit (body), JetBrains Mono (data) | Google Fonts |

---

## Getting Started

### Prerequisites

- **Docker Desktop** (for the PostgreSQL database container)
- **Node.js** 20.x or later
- **npm** 9.x or later

### One-Command Startup

From the `eis-dashboard` directory, run:

```bat
start.bat
```

This automated script performs all seven steps:

1. Creates the `.env` file from `.env.example` if it does not exist, patching in the correct Docker Postgres credentials.
2. Kills any stale Next.js dev server occupying port 3000.
3. Starts or creates the `eis-postgres` Docker container (PostgreSQL 16 on port 5432).
4. Waits up to 30 seconds for the database to become ready.
5. Runs `npm install` if `node_modules` is absent (which also triggers `prisma generate` via the `postinstall` hook). If `node_modules` exists but the Prisma client is missing, it regenerates it.
6. Pushes the Prisma schema to the database (`prisma db push`) and seeds it with 22 service lines and the default admin user.
7. Starts the Next.js dev server at `http://localhost:3000`.

### Manual Startup

If you prefer to run each step individually:

```bash
# 1. Start PostgreSQL
docker run -d --name eis-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=eis_dashboard \
  -p 5432:5432 postgres:16

# 2. Install dependencies
npm install

# 3. Push schema and seed
npx prisma db push --skip-generate --accept-data-loss
npx prisma db seed

# 4. Start dev server
npm run dev
```

Open `http://localhost:3000` and log in with `admin` / `admin123`.

### Environment Variables

Create a `.env` file in the project root (or let `start.bat` create it for you):

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/eis_dashboard"
NEXTAUTH_SECRET="dev-secret-change-in-production-abc123xyz"
NEXTAUTH_URL="http://localhost:3000"
```

See the [Environment Variables](#environment-variables) section for all supported variables.

---

## Project Structure

```
eis-dashboard/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout (fonts, AuthProvider, Toaster)
│   ├── globals.css                   # Design system tokens and utilities
│   ├── login/
│   │   └── page.tsx                  # Login page
│   ├── (dashboard)/                  # Authenticated route group
│   │   ├── layout.tsx                # Sidebar + content layout
│   │   ├── loading.tsx               # Skeleton loading state
│   │   ├── error.tsx                 # Error boundary
│   │   ├── page.tsx                  # Command Center (dashboard)
│   │   ├── regional-summary/         # Heatmap of all service lines
│   │   ├── contracts/                # PA and TCA view
│   │   ├── technical-availability/   # EHM, DACs, LRU, LRP
│   │   ├── maintenance/              # IP Tooling, On-Wing Tech, etc.
│   │   ├── customer-support/         # Training, Field Support, etc.
│   │   ├── asset-availability/       # IP Spares, PAS, NDSES, Transport
│   │   ├── airlines/                 # Redirects to /regional-summary
│   │   │   └── [id]/                 # Scorecard detail (dynamic route)
│   │   ├── timeline/                 # Quarterly Gantt chart
│   │   ├── past-eis/                 # Archived/completed programmes
│   │   ├── alerts/                   # Notification centre
│   │   ├── notifications/            # Redirects to /alerts
│   │   ├── reports/                  # Export and reporting
│   │   └── admin/
│   │       ├── users/                # User CRUD
│   │       ├── import/               # Excel import
│   │       └── audit-log/            # Audit trail
│   └── api/                          # API routes
│       ├── auth/[...nextauth]/       # NextAuth endpoints
│       ├── airlines/                 # Airline CRUD
│       ├── notifications/            # Notification CRUD
│       ├── import/                   # Excel import endpoint
│       ├── export/                   # XLSX export endpoint
│       ├── cron/notifications/       # Cron-triggered notification generation
│       ├── admin/users/              # User management API
│       │   └── [id]/                 # Single user operations
│       └── scorecards/[id]/
│           ├── route.ts              # Scorecard header CRUD
│           ├── service-lines/        # Service line status updates
│           │   └── dispute/          # Dispute raise/resolve
│           └── gate-reviews/         # Legacy gate review endpoint
├── components/
│   ├── auth/
│   │   └── login-form.tsx            # Login form component
│   ├── eis/                          # All EIS-specific components (26 files)
│   │   ├── app-sidebar.tsx           # Collapsible sidebar navigation
│   │   ├── filter-bar.tsx            # Persistent URL-driven filter bar
│   │   ├── command-menu.tsx          # Ctrl+K global search
│   │   ├── heatmap-table.tsx         # RAG heatmap table (Power BI style)
│   │   ├── data-table.tsx            # Reusable sortable/searchable/paginated table
│   │   ├── category-page-client.tsx  # Shared client for all category pages
│   │   ├── dashboard-client.tsx      # Command Center UI
│   │   ├── scorecard-detail-client.tsx # Scorecard detail with inline editing
│   │   ├── timeline-client.tsx       # Quarterly Gantt chart
│   │   ├── alerts-client.tsx         # Notification centre UI
│   │   ├── past-eis-client.tsx       # Past EIS archive UI
│   │   ├── reports-client.tsx        # Reports and export UI
│   │   ├── admin-users-client.tsx    # User management UI
│   │   ├── admin-import-client.tsx   # Excel import UI
│   │   ├── admin-audit-client.tsx    # Audit log UI
│   │   ├── page-header.tsx           # Consistent page header
│   │   ├── rag-badge.tsx             # RAG status indicator
│   │   ├── engine-badge.tsx          # Engine type badge
│   │   ├── countdown-timer.tsx       # EIS countdown with urgency colours
│   │   ├── stat-card.tsx             # KPI card
│   │   ├── empty-state.tsx           # Empty state placeholder
│   │   ├── confirm-dialog.tsx        # Destructive action confirmation
│   │   ├── comment-popover.tsx       # Click-to-view comments popover
│   │   ├── dispute-dialog.tsx        # Raise dispute dialog
│   │   ├── airlines-client.tsx       # Legacy (unused, kept for reference)
│   │   └── notifications-client.tsx  # Legacy (unused, kept for reference)
│   └── ui/                           # shadcn/ui primitives (~50 files)
├── lib/
│   ├── auth.ts                       # NextAuth configuration
│   ├── auth-provider.tsx             # SessionProvider wrapper
│   ├── db.ts                         # Prisma client singleton
│   ├── utils.ts                      # Shared utilities and constants
│   ├── actions/
│   │   └── scorecard.ts              # Server actions for mutations
│   ├── excel/
│   │   ├── parser.ts                 # Excel file parser
│   │   └── mapper.ts                 # Parsed data to DB mapper
│   ├── notifications/
│   │   └── engine.ts                 # Notification generation engine
│   ├── queries/
│   │   ├── dashboard.ts              # Dashboard KPIs and stats
│   │   ├── category.ts               # Category page data, off-plan, past EIS
│   │   ├── scorecard.ts              # Scorecard queries
│   │   ├── timeline.ts               # Timeline data
│   │   ├── notifications.ts          # User notifications
│   │   └── audit.ts                  # Audit log queries
│   └── generated/prisma/             # Auto-generated Prisma client
├── prisma/
│   ├── schema.prisma                 # Database schema (8 models, 7 enums)
│   └── seed.ts                       # Seed: 22 service lines + admin user
├── middleware.ts                      # Auth middleware (redirect unauthenticated)
├── prisma.config.ts                   # Prisma configuration
├── next.config.ts                     # Next.js configuration
├── tsconfig.json                      # TypeScript configuration
├── package.json                       # Dependencies and scripts
├── start.bat                          # One-command local startup script
└── .env                               # Environment variables
```

---

## Architecture

The application follows a three-tier architecture within the Next.js App Router framework:

### Data Flow

```
Browser (Client Components)
    │
    ├── User interactions (clicks, form submissions)
    │       │
    │       ▼
    │   fetch() to API Routes (/api/*)
    │       │
    │       ▼
    │   API Route Handlers (validation, auth check, Prisma mutations)
    │       │
    │       ▼
    │   PostgreSQL Database
    │
    ├── Page navigation
    │       │
    │       ▼
    │   Server Components (page.tsx files)
    │       │
    │       ▼
    │   Prisma Queries (lib/queries/*.ts)
    │       │
    │       ▼
    │   PostgreSQL Database
    │       │
    │       ▼
    │   Props passed to Client Components
    │       │
    │       ▼
    │   React rendering in browser
```

### Server Components vs Client Components

Every page is a **server component** that fetches data using Prisma queries and passes it as props to a **client component** (suffixed with `-client.tsx`). This pattern ensures:

- Database queries run server-side with zero client bundle cost.
- Date objects and Prisma types are serialised via `JSON.parse(JSON.stringify(...))` before being passed to the client.
- Client components handle interactivity (state, event handlers, mutations).
- After any mutation, the client calls `router.refresh()` to re-run the server component and fetch fresh data.

### Layout Hierarchy

```
app/layout.tsx (Root)
  ├── Outfit + JetBrains Mono fonts
  ├── AuthProvider (SessionProvider from next-auth)
  ├── Toaster (Sonner)
  └── children
      ├── app/login/page.tsx (no dashboard layout)
      └── app/(dashboard)/layout.tsx
            ├── AppSidebar (collapsible sidebar navigation)
            └── <main> (scrollable content area)
                  └── children (page content)
```

---

## Database Schema

The database is PostgreSQL, managed by Prisma ORM. The schema contains 8 models and 7 enums.

### Entity Relationship Overview

```
User ──1:N──► Scorecard (as EIS Lead)
User ──1:N──► AuditLog
User ──1:N──► Notification

Airline ──1:1──► Scorecard

Scorecard ──1:N──► GateReview (legacy, hidden from UI)
Scorecard ──1:N──► ServiceLineStatus
Scorecard ──1:N──► AuditLog
Scorecard ──1:N──► Notification

ServiceLine ──1:N──► ServiceLineStatus
```

### Models

**User** (`users` table) -- System users with role-based access.

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| username | String (unique) | Login username |
| passwordHash | String | bcrypt-hashed password |
| displayName | String | Display name |
| email | String? (unique) | Optional email |
| role | UserRole | ADMIN, EDITOR, or VIEWER |
| isActive | Boolean | Whether the account is active |
| createdAt | DateTime | Account creation timestamp |
| updatedAt | DateTime | Last modification timestamp |

**Airline** (`airlines` table) -- Airline customers.

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| name | String (unique) | Airline name (e.g., "Swiss", "Air France") |
| region | Region | EUROPE, MEA, APAC, GREATER_CHINA, or AMERICAS |
| createdAt | DateTime | Record creation timestamp |

**Scorecard** (`scorecards` table) -- One scorecard per airline, tracking EIS readiness.

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| airlineId | String (unique) | Foreign key to Airline |
| engineType | String | Engine programme (e.g., "Trent XWB-97") |
| eisDate | DateTime? | Target Entry Into Service date |
| eisDateTbc | Boolean | Whether the EIS date is "To Be Confirmed" |
| eisRisk | EisRisk | NO_RISK, YES_CUSTOMER, or YES_RR |
| eisLeadId | String? | Foreign key to User (assigned EIS Lead) |
| orderDetails | String? | Order details text |
| status | ScorecardStatus | ACTIVE, CLOSED, or ON_HOLD |
| lastUpdatedAt | DateTime | Last data modification timestamp |
| lastUpdatedById | String? | Who last modified the scorecard |
| createdAt | DateTime | Record creation timestamp |

**ServiceLine** (`service_lines` table) -- The 22 service line definitions.

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| name | String (unique) | Service line name (e.g., "Product Agreement") |
| category | ServiceLineCategory | STANDARD or ADDITIONAL |
| sortOrder | Int | Display order |
| guidanceText | String? | Guidance text for editors |

**ServiceLineStatus** (`service_line_statuses` table) -- The RAG status of a specific service line for a specific scorecard. This is the core data table.

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| scorecardId | String | Foreign key to Scorecard |
| serviceLineId | String | Foreign key to ServiceLine |
| ragStatus | RagStatus | C, G, A, R, or NA |
| statusText | String? | Brief status description |
| comments | String? | Detailed comments |
| isDisputed | Boolean | Whether the status is currently disputed |
| disputeNote | String? | Dispute justification text |
| disputedAt | DateTime? | When the dispute was raised |
| disputedById | String? | Who raised the dispute |
| updatedAt | DateTime | Last modification timestamp |

Unique constraint: `(scorecardId, serviceLineId)` -- one status per service line per scorecard.

**GateReview** (`gate_reviews` table) -- Legacy gate review data. Retained in the schema for backward compatibility but hidden from the UI.

**AuditLog** (`audit_logs` table) -- Immutable audit trail of all data changes.

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| userId | String | Who made the change |
| scorecardId | String? | Which scorecard was changed |
| action | String | Action type (e.g., "update", "create", "import") |
| fieldChanged | String? | Which field was modified |
| oldValue | String? | Previous value |
| newValue | String? | New value |
| changedAt | DateTime | Timestamp |

**Notification** (`notifications` table) -- User-targeted notifications.

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| userId | String | Target user |
| type | NotificationType | See Notification System section |
| title | String | Notification title |
| message | String | Notification body |
| scorecardId | String? | Related scorecard |
| isRead | Boolean | Whether the user has read it |
| isDismissed | Boolean | Whether the user has dismissed it |
| createdAt | DateTime | Creation timestamp |

### Enums

| Enum | Values | Description |
|------|--------|-------------|
| UserRole | ADMIN, EDITOR, VIEWER | Access control levels |
| ScorecardStatus | ACTIVE, CLOSED, ON_HOLD | Scorecard lifecycle state |
| RagStatus | C, G, A, R, NA | Complete, Green, Amber, Red, Not Applicable |
| EisRisk | NO_RISK, YES_CUSTOMER, YES_RR | EIS risk classification |
| Region | EUROPE, MEA, APAC, GREATER_CHINA, AMERICAS | Geographic regions |
| ServiceLineCategory | STANDARD, ADDITIONAL | Service line classification |
| NotificationType | EIS_APPROACHING, SCORECARD_OVERDUE, STATUS_DEGRADED, GATE_DUE, OFF_PLAN, PAST_EIS, DISPUTE_RAISED, DISPUTE_RESOLVED, SCORECARD_UPDATED | Alert categories |

---

## Pages and Routes

The application has 18 page routes organised into public, dashboard, and admin sections.

### Public Routes

| Route | Page | Description |
|-------|------|-------------|
| `/login` | Login | Username/password authentication form |

### Dashboard Routes (Authenticated)

All routes under `(dashboard)/` require authentication. Unauthenticated users are redirected to `/login`.

| Route | Page | Server Data Source | Description |
|-------|------|-------------------|-------------|
| `/` | Command Center | `getDashboardStats`, `getOffPlanPrograms`, `getRecentComments`, `getCategoryData`, `getUserNotifications` | KPIs, off-plan alerts, recent comments, quick heatmap, system status |
| `/regional-summary` | Regional Summary | `getCategoryData(allServiceLines)` | Full heatmap of all 22 service lines across all active programmes |
| `/contracts` | Contracts | `getCategoryData(["Product Agreement", "TotalCare Agreement"])` | PA and TCA detail view with status text and comments |
| `/technical-availability` | Technical Availability | `getCategoryData(["EHM", "DACs/ Lifing Insight", "LRU Management", "LRP Management"])` | EHM, DACs, LRU, and LRP management status |
| `/maintenance` | Maintenance | `getCategoryData(["IP Tooling", "Spare Engine - Dedicated", "On-Wing Tech Support", "Engine Split"])` | Tooling, on-wing support, spare engine, and engine split status |
| `/customer-support` | Customer Support | `getCategoryData(["Customer Training", "Field Support", "Airline Facility Readiness", "Flight Ops"])` | Training, field support, facility readiness, and flight ops status |
| `/asset-availability` | Asset Availability | `getCategoryData(["IP Spares", "PAS", "NDSES", "Transportation - Routine", "Transportation - Remote"])` | Spares, PAS, NDSES, and transportation status |
| `/airlines` | -- | -- | Redirects to `/regional-summary` |
| `/airlines/[id]` | Scorecard Detail | `getScorecardByAirlineId(id)` | Full scorecard view with inline editing, dispute UI, countdown timer |
| `/timeline` | EIS Timeline | `getTimelineData()` | Quarterly Gantt chart of all active programmes |
| `/past-eis` | Past EIS Archive | `getPastEISPrograms()` | Completed and past-EIS programmes with final statuses |
| `/alerts` | Alerts | `getUserNotifications(userId)`, `getUnreadCount(userId)` | Notification centre with filtering, persistence, and actions |
| `/notifications` | -- | -- | Redirects to `/alerts` |
| `/reports` | Reports | `prisma.airline.findMany(...)` | Export configuration and download (Fleet, Scorecard, Audit) |

### Admin Routes (ADMIN Role Only)

| Route | Page | Server Data Source | Description |
|-------|------|-------------------|-------------|
| `/admin/users` | User Management | `prisma.user.findMany(...)` | Create, edit, deactivate, and delete users |
| `/admin/import` | Excel Import | -- | Upload and import EIS Metric Tool Excel workbooks |
| `/admin/audit-log` | Audit Log | `getAuditLogs({ page })` | Paginated, filterable audit trail |

---

## Components

### Page-Level Client Components (11)

These are the primary UI components, one per page. Each receives server-fetched data as props.

| Component | File | Used By |
|-----------|------|---------|
| `DashboardClient` | `dashboard-client.tsx` | `/` |
| `CategoryPageClient` | `category-page-client.tsx` | Regional Summary, Contracts, Technical Availability, Maintenance, Customer Support, Asset Availability |
| `ScorecardDetailClient` | `scorecard-detail-client.tsx` | `/airlines/[id]` |
| `TimelineClient` | `timeline-client.tsx` | `/timeline` |
| `PastEISClient` | `past-eis-client.tsx` | `/past-eis` |
| `AlertsClient` | `alerts-client.tsx` | `/alerts` |
| `ReportsClient` | `reports-client.tsx` | `/reports` |
| `AdminUsersClient` | `admin-users-client.tsx` | `/admin/users` |
| `AdminImportClient` | `admin-import-client.tsx` | `/admin/import` |
| `AdminAuditClient` | `admin-audit-client.tsx` | `/admin/audit-log` |

### Navigation and Layout Components (3)

| Component | File | Description |
|-----------|------|-------------|
| `AppSidebar` | `app-sidebar.tsx` | Collapsible sidebar with four navigation groups (Main, Service Lines, Operations, Admin), user menu, and sign-out. Collapses to icon-only mode with tooltips. Admin section only visible to ADMIN users. |
| `FilterBar` | `filter-bar.tsx` | Persistent horizontal filter bar with Region, Engine Type, and RAG Status popover checkboxes. Filter state is stored in URL search parameters for bookmarkability. Exports the `useFilterParams()` hook. |
| `CommandMenu` | `command-menu.tsx` | Ctrl+K / Cmd+K global search dialog. Searches airlines by name, provides quick navigation to all pages, and quick actions (Create Airline, Export Report). |

### Data Display Components (2)

| Component | File | Description |
|-----------|------|-------------|
| `HeatmapTable` | `heatmap-table.tsx` | The core Power BI-style heatmap. Renders a table with fixed columns (Customer, Engine, EIS Date, EIS Lead) and dynamic columns for each service line. Each RAG cell is a coloured bar; hover shows status text as a tooltip; click opens a CommentPopover. Sticky first column for horizontal scroll. Disputed statuses show a warning icon. |
| `DataTable` | `data-table.tsx` | Generic reusable table with TypeScript generics. Supports column sorting (asc/desc toggle), text search across configurable keys, client-side pagination, row click handlers, and empty state display. |

### Primitive UI Components (9)

| Component | File | Description |
|-----------|------|-------------|
| `PageHeader` | `page-header.tsx` | Consistent page title with optional description and right-aligned action slot. |
| `RAGBadge` | `rag-badge.tsx` | Coloured dot + optional label for RAG statuses. Two sizes: sm (6px) and md (8px). |
| `EngineBadge` | `engine-badge.tsx` | Engine type badge with colour-coded left border. |
| `CountdownTimer` | `countdown-timer.tsx` | Days-until-EIS display with urgency colouring. Shows "TBC", "PAST EIS", "OFF PLAN" badges as appropriate. |
| `StatCard` | `stat-card.tsx` | KPI card with icon, value, label, optional trend indicator, and click handler. |
| `EmptyState` | `empty-state.tsx` | Centred placeholder with icon, title, description, and optional action button. |
| `ConfirmDialog` | `confirm-dialog.tsx` | Confirmation modal for destructive actions. Supports loading state and destructive variant. |
| `CommentPopover` | `comment-popover.tsx` | Click-to-open popover showing service line status text and comments. Supports inline editing with save. |
| `DisputeDialog` | `dispute-dialog.tsx` | Modal dialog for raising disputes against RED service line statuses. Requires a minimum 10-character justification note. |

---

## Data Layer

### Query Files

All server-side data fetching is centralised in `lib/queries/`:

| File | Exports | Description |
|------|---------|-------------|
| `dashboard.ts` | `getDashboardStats()`, `getPortfolioOverview()`, `getSystemStatus()`, `getHeatmapData()` | KPIs (total active, at-risk, approaching EIS, overdue), portfolio data, system status |
| `category.ts` | `getCategoryData(serviceLines, filters?)`, `getOffPlanPrograms()`, `getPastEISPrograms()`, `getRecentComments(limit)` | Category page heatmap data with optional region/engine/date/RAG filtering. Off-plan detection (RED + less than 6 months). Past EIS archive. Recent comments feed. |
| `scorecard.ts` | `getScorecardByAirlineId(id)`, `getAllAirlines()` | Full scorecard with all service line statuses and dispute fields. All airlines for listing. |
| `timeline.ts` | `getTimelineData()` | Active scorecards with EIS dates for the Gantt chart. |
| `notifications.ts` | `getUserNotifications(userId, limit?)`, `getUnreadCount(userId)` | User-targeted notifications with scorecard relations. |
| `audit.ts` | `getAuditLogs({ page })` | Paginated audit log entries with user and scorecard relations. |

### Mutation Pattern

All data mutations flow through API routes (`/api/*`). The client components use this pattern:

```typescript
const handleSave = async () => {
  try {
    const res = await fetch(`/api/scorecards/${id}/service-lines`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceLineStatusId, ragStatus: "G" }),
    });
    if (!res.ok) throw new Error("Failed to save");
    toast.success("Status updated");
    router.refresh();
  } catch (err) {
    toast.error("Failed to update status");
  }
};
```

The `router.refresh()` call re-runs the server component, which re-fetches data from the database, ensuring the UI always shows the latest state.

---

## Authentication and Authorisation

### Authentication

The application uses **NextAuth.js** with the **Credentials provider**. Users authenticate with a username and password. Passwords are hashed using bcrypt (12 rounds).

Configuration: `lib/auth.ts`

- Session strategy: JWT (24-hour max age)
- The JWT token contains `id`, `username`, and `role`
- Custom sign-in page: `/login`

### Middleware

`middleware.ts` uses NextAuth's `withAuth` wrapper to protect all routes except:
- `/login`
- `/api/auth/*`
- Static assets (`_next/static`, `_next/image`, `favicon.ico`)

Unauthenticated requests are redirected to `/login`.

### Role-Based Access

- **Admin-only pages** (`/admin/*`): The server component checks `session?.user?.role === "ADMIN"` and redirects non-admins to `/`.
- **Edit permissions**: The scorecard detail page passes a `canEdit` prop that is `true` only for ADMIN and EDITOR roles.
- **Admin-only sidebar items**: The AppSidebar only renders the Admin navigation group when the session role is ADMIN.

---

## Notification System

The notification system has two components: a **generation engine** that creates notifications based on business rules, and a **persistence layer** that allows users to read, dismiss, and manage their notifications.

### Notification Types

| Type | Trigger | Target | Description |
|------|---------|--------|-------------|
| `EIS_APPROACHING` | EIS date within 12, 9, 6, or 3 months | EIS Lead (or all admins/editors if no lead) | Warns about approaching EIS milestones |
| `SCORECARD_OVERDUE` | Scorecard not updated in 30+ days | EIS Lead (or all admins/editors) | Prompts the lead to update the scorecard |
| `OFF_PLAN` | Any service line is RED and EIS within 6 months | EIS Lead | Flags off-plan programmes requiring intervention |
| `PAST_EIS` | EIS date has passed but scorecard is still ACTIVE | EIS Lead | Prompts the lead to close or update the scorecard |
| `DISPUTE_RAISED` | A user raises a dispute on a RED status | EIS Lead + all admins | Notifies relevant stakeholders of the dispute |
| `DISPUTE_RESOLVED` | An admin/lead resolves a dispute | The user who raised the dispute | Confirms the resolution |
| `SCORECARD_UPDATED` | A scorecard is edited | EIS Lead | Account-level notification for leads |
| `STATUS_DEGRADED` | A service line status degrades | EIS Lead | Warns about worsening status |

### Generation Engine

`lib/notifications/engine.ts` exports `generateNotifications()`. This function:

1. Queries all ACTIVE scorecards with their airline, EIS lead, and service line statuses.
2. For each scorecard, evaluates all notification rules.
3. Deduplicates by checking for existing notifications with the same title/type created within the last month.
4. Targets the EIS Lead specifically when one is assigned; falls back to all admin/editor users otherwise.

The engine is invoked by the cron endpoint at `GET /api/cron/notifications`.

### Persistence API

`PATCH /api/notifications` supports three operations:

| Body | Action |
|------|--------|
| `{ markAllRead: true }` | Marks all of the current user's notifications as read |
| `{ id, read: true }` | Marks a single notification as read |
| `{ id, dismissed: true }` | Dismisses a notification (hides it from the UI) |

---

## Filtering System

The `FilterBar` component provides persistent, URL-driven filtering across all category pages and the dashboard.

### URL Parameters

| Parameter | Format | Example |
|-----------|--------|---------|
| `region` | Comma-separated region codes | `?region=EUROPE,APAC` |
| `engine` | Comma-separated engine types | `?engine=Trent+XWB-97,Trent+7000` |
| `rag` | Comma-separated RAG statuses | `?rag=R,A` |
| `eisFrom` | ISO date string | `?eisFrom=2025-01-01` |
| `eisTo` | ISO date string | `?eisTo=2027-12-31` |

### Usage in Components

Pages import the `useFilterParams()` hook from `filter-bar.tsx`:

```typescript
import { useFilterParams } from "@/components/eis/filter-bar";

const { regions, engines, ragStatuses } = useFilterParams();
```

Server-side queries in `lib/queries/category.ts` accept an optional `FilterParams` object and apply Prisma `where` clauses accordingly.

---

## Service Line Categories

The 22 service lines are organised into five categories that map to the Power BI tabs. This mapping is defined in `lib/utils.ts` as the `SERVICE_LINE_CATEGORIES` constant.

| Category | Service Lines |
|----------|---------------|
| **Contracts** | Product Agreement, TotalCare Agreement |
| **Technical Availability** | EHM, DACs/ Lifing Insight, LRU Management, LRP Management |
| **Maintenance** | IP Tooling, Spare Engine - Dedicated, On-Wing Tech Support, Engine Split |
| **Customer Support** | Customer Training, Field Support, Airline Facility Readiness, Flight Ops |
| **Asset Availability** | IP Spares, PAS, NDSES, Transportation - Routine, Transportation - Remote |

Service lines not in any category (Overhaul Services, Bespoke Service, Bespoke Service 2) appear only on the Regional Summary page, which shows all service lines.

The `getCategoryForServiceLine(name)` utility performs a reverse lookup from service line name to category.

---

## Off-Plan Detection and Dispute Workflow

### Off-Plan Detection

A programme is considered **off-plan** when:
1. Any of its service line statuses has `ragStatus === "R"` (RED), AND
2. The EIS date is within 180 days (approximately 6 months), AND
3. The scorecard is ACTIVE

The `getOffPlanStatus(ragStatuses, eisDate)` utility function in `lib/utils.ts` returns `{ isOffPlan: boolean, daysUntil: number | null }`.

Off-plan programmes are:
- Highlighted on the Command Center with a prominent red-bordered section
- Counted in the "Off Plan" KPI card
- Flagged with an "OFF PLAN" badge on the CountdownTimer component
- Targeted by the `OFF_PLAN` notification type

### Dispute Workflow

When a service line is RED and the programme is off-plan, editors can raise a dispute:

1. **Raise**: The user clicks "Dispute" on the scorecard detail, enters a justification note (minimum 10 characters), and submits. This calls `POST /api/scorecards/[id]/service-lines/dispute`.
   - The `ServiceLineStatus` is updated: `isDisputed=true`, `disputeNote`, `disputedAt`, `disputedById`.
   - `DISPUTE_RAISED` notifications are sent to the EIS Lead and all admins.
   - An audit log entry is created.

2. **Review**: The EIS Lead or an admin sees the dispute notification and navigates to the scorecard.

3. **Resolve**: The reviewer calls `PATCH /api/scorecards/[id]/service-lines/dispute` with either:
   - `{ resolution: "confirmed" }` -- The RED status is confirmed as accurate. `isDisputed` is cleared.
   - `{ resolution: "overridden", newRagStatus: "A" }` -- The status is changed (e.g., to Amber). `isDisputed` is cleared.
   - A `DISPUTE_RESOLVED` notification is sent to the original disputer.

---

## API Reference

### Authentication

| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/auth/[...nextauth]` | NextAuth.js endpoints (CSRF, session, signin, signout) |

### Airlines

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/api/airlines` | Create a new airline with scorecard | ADMIN, EDITOR |

### Scorecards

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/api/scorecards/[id]` | Get scorecard by ID | Any |
| PATCH | `/api/scorecards/[id]` | Update scorecard header (EIS date, risk, notes) | ADMIN, EDITOR |
| PATCH | `/api/scorecards/[id]/service-lines` | Update service line status (RAG, statusText, comments) | ADMIN, EDITOR |
| POST | `/api/scorecards/[id]/service-lines/dispute` | Raise a dispute on a RED status | Any authenticated |
| PATCH | `/api/scorecards/[id]/service-lines/dispute` | Resolve a dispute (confirm or override) | ADMIN, EIS Lead |

### Notifications

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/api/notifications` | Get user's notifications | Any |
| PATCH | `/api/notifications` | Mark read, dismiss, or mark all read | Any |
| GET | `/api/cron/notifications` | Trigger notification generation | Cron secret |

### Admin

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/api/admin/users` | List all users | ADMIN |
| POST | `/api/admin/users` | Create a new user | ADMIN |
| PATCH | `/api/admin/users/[id]` | Update user (displayName, email, role, isActive) | ADMIN |
| DELETE | `/api/admin/users/[id]` | Delete a user | ADMIN |

### Import/Export

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/api/import` | Import an Excel workbook (base64 encoded) | ADMIN |
| GET | `/api/export` | Export data as XLSX (supports query params for filtering) | Any |

---

## Excel Import and Export

### Import

The admin import page (`/admin/import`) allows uploading EIS Metric Tool Excel workbooks. The import pipeline is:

1. **Upload**: The file is read as base64 and sent to `POST /api/import`.
2. **Parse**: `lib/excel/parser.ts` uses SheetJS to extract airline data, service line statuses, and metadata from the workbook.
3. **Map**: `lib/excel/mapper.ts` transforms the parsed data into the database schema format, mapping column headers to service line names.
4. **Upsert**: Airlines and scorecards are created or updated. Service line statuses are upserted with the `(scorecardId, serviceLineId)` unique constraint.
5. **Audit**: Each import operation is logged in the audit trail.
6. **Response**: The API returns counts of created, updated, and skipped records.

### Export

The export endpoint at `GET /api/export` generates XLSX workbooks. It supports these query parameters:

| Parameter | Description |
|-----------|-------------|
| `format` | `XLSX` (default) or `JSON` |
| `airlineId` | Export a single scorecard |
| `region` | Filter by region |

---

## Design System

### Theme

The application uses a dark theme with teal accents, defined in `app/globals.css`:

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#08090a` | Page background |
| `--card` | `#101214` | Card/panel background |
| `--foreground` | `#e8eaed` | Primary text |
| `--primary` | `#00d4aa` | Teal accent (links, active states) |
| `--border` | `#2a2d32` | Borders and dividers |
| `--muted-foreground` | `#6b7280` | Secondary text |
| `--destructive` | `#ef4444` | Error states |
| `--accent` | `#f59e0b` | Amber highlights |

### RAG Colours

| Status | Colour | Hex | Label |
|--------|--------|-----|-------|
| R | Red | `#ff4757` | CRITICAL |
| A | Amber | `#ffa502` | AT RISK |
| G | Green | `#2ed573` | ON TRACK |
| C | Blue outline + green tick | `#70a1ff` border, `#2ed573` tick | COMPLETE |
| NA | Grey | `#57606f` | N/A |

### Engine Colours

| Engine | Colour |
|--------|--------|
| Trent XWB-97 | `#00d4aa` (teal) |
| Trent XWB-84 | `#70a1ff` (blue) |
| Trent XWB-84 EP | `#a29bfe` (purple) |
| Trent 7000 | `#ffa502` (amber) |
| Trent 700 | `#ff6b81` (pink) |
| Trent 1000 | `#2ed573` (green) |

### Typography

- **Body**: Outfit (Google Fonts), weights 300-700
- **Data/Numbers**: JetBrains Mono (Google Fonts), weights 400-600

### CSS Utilities

| Class | Description |
|-------|-------------|
| `.panel` | Card-style container with `bg-card`, `border`, and `rounded-lg` |
| `.text-gradient` | Teal-to-green gradient text effect |
| `.glow-teal` | Subtle teal box-shadow glow |
| `.border-glow` | Teal border glow |
| `.data-cell` | Tabular number formatting with letter-spacing |
| `.focus-ring` | Accessible focus-visible ring style |
| `.filter-bar` | Horizontal flex container for filter controls |

---

## Shared Utility Functions

All shared utilities are in `lib/utils.ts`:

| Function | Signature | Description |
|----------|-----------|-------------|
| `cn()` | `(...inputs: ClassValue[]) => string` | Tailwind class merging (clsx + tailwind-merge) |
| `getRegionDisplay()` | `(region: string) => string` | Converts enum value to display name (e.g., `GREATER_CHINA` to `Greater China`) |
| `computeOverallRAG()` | `(ragStatuses: string[]) => string` | Computes overall RAG from array: R beats A beats G; all C/NA returns C |
| `formatEISDate()` | `(date, tbc?) => string` | Formats date for EIS display; returns "TBC" if tbc is true |
| `formatDate()` | `(date) => string` | Generic date formatter (dd MMM yyyy, en-GB) |
| `getDaysUntil()` | `(date) => number \| null` | Days from now until the given date |
| `getRAGDisplay()` | `(rag: string) => { color, label, bg }` | Returns colour, label, and background for a RAG status |
| `getOffPlanStatus()` | `(ragStatuses, eisDate) => { isOffPlan, daysUntil }` | Determines if a programme is off-plan (RED + within 180 days) |
| `isPastEIS()` | `(eisDate, status) => boolean` | Checks if an ACTIVE scorecard has passed its EIS date |
| `getCategoryForServiceLine()` | `(name) => string \| null` | Reverse lookup: service line name to category |

### Constants

| Constant | Type | Description |
|----------|------|-------------|
| `SERVICE_LINE_CATEGORIES` | `Record<string, string[]>` | Maps 5 category names to their service line arrays |
| `ALL_ENGINE_TYPES` | `readonly string[]` | All 6 Trent engine types |
| `ALL_REGIONS` | `readonly string[]` | All 5 geographic regions |
| `engineColors` | `Record<string, string>` | Engine type to hex colour mapping |
| `regionDisplay` | `Record<string, string>` | Region enum to display name mapping |

---

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/eis_dashboard` |
| `NEXTAUTH_SECRET` | Yes | Secret for JWT signing | `generate-with-openssl-rand-base64-32` |
| `NEXTAUTH_URL` | Yes | Base URL of the application | `http://localhost:3000` |
| `CRON_SECRET` | No | Secret for the cron notification endpoint | Any secure string |

---

## Deployment

### Vercel (Recommended)

1. Push the repository to GitHub.
2. Import into Vercel.
3. Add environment variables in the Vercel dashboard.
4. Set up a Vercel Postgres database or connect an external PostgreSQL instance.
5. Vercel will automatically run `prisma generate` via the `postinstall` script.
6. Set up a Vercel Cron Job to call `GET /api/cron/notifications` on a schedule (e.g., hourly).

### Docker

A Docker deployment would require:
1. A `Dockerfile` with Node.js 20, `npm install`, `prisma generate`, and `next build`.
2. A `docker-compose.yml` with the Next.js app and PostgreSQL services.
3. Environment variables passed via Docker secrets or environment.

### Database Migrations

The project uses `prisma db push` for schema synchronisation in development. For production, consider using `prisma migrate` with versioned migration files:

```bash
npx prisma migrate dev --name descriptive_name
npx prisma migrate deploy  # in production
```

---

## Development Conventions

### File Naming

- Pages: `app/(dashboard)/[route-name]/page.tsx`
- Client components: `components/eis/[name]-client.tsx`
- Shared components: `components/eis/[name].tsx`
- Queries: `lib/queries/[domain].ts`
- API routes: `app/api/[resource]/route.ts`

### Component Pattern

Every dashboard page follows the same pattern:

```tsx
// page.tsx (Server Component)
export const dynamic = "force-dynamic";

import { getDataForPage } from "@/lib/queries/...";
import { PageClient } from "@/components/eis/page-client";

export default async function Page() {
  const data = await getDataForPage();
  return <PageClient data={JSON.parse(JSON.stringify(data))} />;
}
```

```tsx
// page-client.tsx (Client Component)
"use client"

export function PageClient({ data }: Props) {
  // Interactive UI with useState, event handlers, fetch mutations
}
```

### Code Style

- TypeScript strict mode.
- `"use client"` directive on all client components.
- No inline styles; Tailwind CSS utility classes only.
- Shared logic in `lib/utils.ts`, not duplicated across components.
- Toast notifications (Sonner) for all mutation feedback.
- `router.refresh()` after every successful mutation.
- All destructive actions require `ConfirmDialog` confirmation.

---

## Troubleshooting

### Common Issues

**"Docker is not running"**
Start Docker Desktop before running `start.bat`.

**"Port 5432 already in use"**
Another PostgreSQL instance or application is using port 5432. Either stop it or change the port in the `docker run` command and `.env` file.

**"Module not found" or import errors**
Run `npm install` to ensure all dependencies are present. Run `npx prisma generate` to regenerate the Prisma client after schema changes.

**"isDismissed does not exist in type"**
The Prisma client needs regeneration. Delete `lib/generated/prisma/` and run `npx prisma generate --no-hints`.

**"Authentication failed against database server"**
The `DATABASE_URL` environment variable has incorrect credentials. Ensure it matches the Docker container's `POSTGRES_USER` and `POSTGRES_PASSWORD`.

**Build warnings about "middleware file convention"**
This is a Next.js 16 deprecation warning for the `middleware.ts` file. The middleware still functions correctly; the warning can be ignored for now.

**Slow first page load**
The first request after starting the dev server triggers Turbopack compilation, which can take 5-15 seconds. Subsequent loads are near-instant.

### Resetting the Database

To completely reset the database and start fresh:

```bash
docker stop eis-postgres
docker rm eis-postgres
# Then run start.bat again, which will recreate the container
```

### Viewing Raw Database

To connect to the PostgreSQL database directly:

```bash
docker exec -it eis-postgres psql -U postgres -d eis_dashboard
```

Useful queries:
```sql
SELECT name, region FROM airlines ORDER BY name;
SELECT a.name, s.engine_type, s.eis_date, s.status FROM scorecards s JOIN airlines a ON a.id = s.airline_id;
SELECT sl.name, sls.rag_status, sls.status_text FROM service_line_statuses sls JOIN service_lines sl ON sl.id = sls.service_line_id WHERE sls.scorecard_id = 'xxx';
```

---

## Component API Reference

This section provides the props interface and usage details for every shared component.

### PageHeader

```typescript
interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode  // Rendered on the right side for action buttons
}
```

Usage:
```tsx
<PageHeader title="Regional Summary" description="Overview of all service lines">
  <Button variant="outline" size="sm">Export</Button>
</PageHeader>
```

Renders a flex row with a bottom border separator and `mb-6` spacing. The title is rendered as an `h1` with `text-2xl font-semibold`. The description is `text-sm text-muted-foreground`. Children are flex-aligned to the right.

### RAGBadge

```typescript
interface RAGBadgeProps {
  status: string       // "R", "A", "G", "C", or "NA"
  showLabel?: boolean  // default: false
  size?: "sm" | "md"  // default: "md"
}
```

The badge renders a coloured dot followed by an optional label. Uses `getRAGDisplay()` internally for colour resolution. Size `sm` renders a 6px dot with `text-xs`; `md` renders an 8px dot with `text-sm`. The background colour is the RAG colour at 15% opacity. The **Complete (C)** status is rendered differently: an outlined pill with a blue (`#70a1ff`) border, transparent background, and a green (`#2ed573`) checkmark icon instead of a dot.

### EngineBadge

```typescript
interface EngineBadgeProps {
  engine: string  // e.g., "Trent XWB-97"
}
```

Renders a compact badge with the engine name and a left-border coloured by the engine's assigned colour from the `engineColors` map. Falls back to `#57606f` (grey) for unknown engine types. Background is `bg-secondary`, text is `text-xs`.

### CountdownTimer

```typescript
interface CountdownTimerProps {
  eisDate: Date | string | null
  eisDateTbc?: boolean
  showOffPlan?: boolean       // default: true
  ragStatuses?: string[]      // used for off-plan calculation
}
```

Displays the number of days until the EIS date with urgency-based colouring:

| Condition | Display | Colour |
|-----------|---------|--------|
| `eisDateTbc` is true | "TBC" | Grey |
| `eisDate` is null | "---" | Grey |
| Days < 0 | "PAST EIS" badge | Red |
| Days 0--90, has RED status, `showOffPlan` | "{days}d" + "OFF PLAN" badge | Red |
| Days 0--90 | "{days}d" | Red |
| Days 91--180 | "{days}d" | Amber |
| Days > 180 | "{days}d" | Green |

### StatCard

```typescript
interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  description?: string
  trend?: "up" | "down" | "neutral"
  accentColor?: string     // CSS colour for left border
  onClick?: () => void
}
```

Renders a panel card with the icon on the left (32x32, with tinted background) and value + title on the right. The value uses `font-mono text-2xl font-bold`. The title uses `text-xs text-muted-foreground uppercase tracking-wider`. If `onClick` is provided, the card is clickable with a hover lift effect and `cursor-pointer`. The `accentColor` adds a 3px left border.

### EmptyState

```typescript
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}
```

Centred flex column with 60vh minimum height. The icon is rendered at 48x48 with `text-muted-foreground`. An optional action button is rendered as a `Button` with `variant="outline"`.

### ConfirmDialog

```typescript
interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string         // default: "Confirm"
  variant?: "default" | "destructive"  // default: "default"
  onConfirm: () => void
  loading?: boolean
}
```

Uses shadcn/ui `Dialog` with `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, and `DialogFooter`. The confirm button uses the specified variant and shows a `Loader2` spinner when `loading` is true. The cancel button calls `onOpenChange(false)`.

### CommentPopover

```typescript
interface CommentPopoverProps {
  statusText: string | null
  comments: string | null
  serviceLineName: string
  ragStatus: string
  canEdit?: boolean
  onSave?: (statusText: string, comments: string) => void
  children: React.ReactNode  // Trigger element
}
```

Wraps its `children` in a `Popover` trigger. When opened, shows:
1. A header with the service line name and a `RAGBadge`.
2. The `statusText` in a bordered section (or an editable `Textarea` if `canEdit`).
3. The `comments` in a bordered section (or an editable `Textarea` if `canEdit`).
4. A "Save" button that appears only when content has been modified, calling `onSave`.

This component is primarily used inside `HeatmapTable` to make each RAG cell interactive.

### DisputeDialog

```typescript
interface DisputeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  serviceLineName: string
  airlineName: string
  currentStatus: string
  onSubmit: (note: string) => Promise<void>
  loading?: boolean
}
```

A modal dialog for raising disputes. Shows context (service line name, airline, current RED status) and requires a minimum 10-character justification note in a `Textarea`. Validation feedback is shown below the textarea. The "Submit Dispute" button is disabled until the note meets the minimum length and calls the async `onSubmit` handler.

### HeatmapTable

```typescript
interface HeatmapTableProps {
  data: HeatmapRow[]
  serviceLineNames: string[]
  canEdit?: boolean
  onStatusChange?: (statusId: string, newStatus: string) => Promise<void>
  onCommentSave?: (statusId: string, statusText: string, comments: string) => Promise<void>
  showEisLead?: boolean
}
```

The most complex component. Renders a horizontally scrollable table where:
- **Fixed columns**: Customer (sticky, linked to `/airlines/[id]`), Engine Type (with `EngineBadge`), EIS Date (with `CountdownTimer`), optionally EIS Lead.
- **Dynamic columns**: One per service line name from `serviceLineNames`.
- **RAG cells**: Each cell renders a coloured bar (40px x 18px) using the RAG colour from `getRAGDisplay()`. The **Complete (C)** status renders as an outlined tile with a blue (`#70a1ff`) border and a green (`#2ed573`) checkmark centred inside, rather than a filled bar. NA/missing statuses render a grey, low-opacity bar.
- **Hover**: Native `title` attribute shows the `statusText`.
- **Click**: Opens a `CommentPopover` with the full `statusText`, `comments`, and optional edit capability.
- **Disputed indicators**: Cells with `isDisputed === true` show a small `AlertTriangle` icon overlay.
- **Sorting**: Clicking the Customer column header toggles alphabetical sort.
- **Scrolling**: The table container uses `overflow-x-auto`. The Customer column is `sticky left-0 z-10` with a `bg-card` background to prevent bleed-through during horizontal scroll.

### DataTable

```typescript
interface Column<T> {
  key: string
  header: string
  render?: (item: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchable?: boolean
  searchPlaceholder?: string
  searchKeys?: string[]
  pageSize?: number          // default: 20
  emptyMessage?: string
  onRowClick?: (item: T) => void
}
```

A fully generic data table. The `Column.render` function allows custom cell rendering (e.g., rendering a `RAGBadge` or a `Link`). Sorting compares values as strings by default, with automatic numeric detection. The search function filters across all `searchKeys` (or all column keys if not specified) using case-insensitive substring matching. Pagination shows "Showing X--Y of Z" with Previous/Next buttons.

### FilterBar

```typescript
interface FilterBarProps {
  showServiceLineFilter?: boolean
  showRAGFilter?: boolean
}
```

Exported hook:
```typescript
function useFilterParams(): {
  regions: string[]
  engines: string[]
  eisFrom: string | null
  eisTo: string | null
  ragStatuses: string[]
}
```

The filter bar reads from and writes to URL search parameters using `useSearchParams()` and `useRouter().push()`. Each filter is a `Popover` with checkboxes. Active filters are shown as `Badge` components with individual remove buttons. A "Clear all" button appears when any filters are active.

### AppSidebar

The sidebar maintains a `collapsed` state via `useState`. When collapsed, the sidebar shrinks from 256px to 64px, text labels are hidden, and `Tooltip` components show on hover. Navigation items are organised into four groups:

| Group | Items | Visibility |
|-------|-------|------------|
| Main | Command Center, Regional Summary | All users |
| Service Lines | Contracts, Technical Availability, Maintenance, Customer Support, Asset Availability | All users |
| Operations | Timeline, Past EIS, Alerts, Reports | All users |
| Admin | Users, Import, Audit Log | ADMIN only |

Active state detection uses `usePathname()` to highlight the current route. The footer shows user initials, display name, role, and a sign-out button.

### CommandMenu

Listens for `Ctrl+K` / `Cmd+K` keyboard events and toggles a `CommandDialog` from shadcn/ui (built on cmdk). When opened, it fetches the airline list from `/api/airlines` and renders three command groups:
- **Pages**: Static list of all navigable pages.
- **Quick Actions**: Create Airline, Export Report.
- **Airlines**: Dynamic list of airlines, searchable by name.

Selecting an item navigates using `router.push()`.

---

## Page-by-Page Detailed Description

### Command Center (`/`)

The dashboard homepage provides an at-a-glance overview of the entire EIS portfolio.

**Layout sections (top to bottom):**

1. **Page Header** with "Command Center" title and a live system status indicator (green pulsing dot with "Online" label, active programme count, and last sync timestamp).

2. **KPI Row** -- four `StatCard` components in a responsive grid:
   - **Total Active**: Count of scorecards with `status === 'ACTIVE'`. Teal accent. Icon: `Activity`.
   - **Off Plan**: Count of programmes where any service line is RED and EIS is within 180 days. Red accent. Clicking navigates to `/regional-summary?rag=R`. Icon: `AlertTriangle`.
   - **At Risk**: Count of programmes with at least one AMBER service line. Amber accent. Icon: `XCircle`.
   - **Approaching EIS**: Count of programmes with EIS date within 6 months. Blue accent. Icon: `Clock`.

3. **Off-Plan Alerts** -- Only shown when `offPlanPrograms.length > 0`. A panel with a red left border listing each off-plan programme. Each row shows the airline name (linked to its scorecard), an `EngineBadge`, a `CountdownTimer`, and pills listing which service lines are RED.

4. **Two-Column Layout**:
   - **Left (2/3 width): Portfolio Status** -- A table showing the top 10 active programmes with Customer (linked), Engine, EIS Date, and an overall RAG badge computed via `computeOverallRAG()`. A "View All" link goes to `/regional-summary`.
   - **Right (1/3 width): Recent Comments** -- The most recent service line comments (up to 8). Each entry shows the airline name (linked), a `RAGBadge`, the service line name, truncated comment text, and a relative timestamp.

5. **System Status Bar** -- A compact inline status showing the online indicator, active programme count, and last sync date.

### Regional Summary (`/regional-summary`)

The full heatmap view showing all 22 service lines across all active programmes. This is the primary operational view that replaces the Power BI Regional Summary.

Uses `CategoryPageClient` with all service lines. The `FilterBar` appears at the top with Region, Engine Type, and RAG Status filters. The `HeatmapTable` renders the full matrix.

### Category Pages (`/contracts`, `/technical-availability`, `/maintenance`, `/customer-support`, `/asset-availability`)

Each category page uses the same `CategoryPageClient` component with a different subset of service lines. The page title and description are category-specific. All include the `FilterBar` and `HeatmapTable`.

### Scorecard Detail (`/airlines/[id]`)

The most complex page, providing full visibility and edit capabilities for a single airline's scorecard.

**Sections:**
1. **Header** -- Airline name, region, engine badge, EIS date with countdown, risk level, EIS Lead name, order details. An "Edit" button (visible to ADMIN/EDITOR) toggles inline editing of the header fields.
2. **Overall RAG** -- Computed from all service line statuses using `computeOverallRAG()`.
3. **Service Lines (Standard)** -- Table of the 11 standard service lines with RAG badge (clickable to change via dropdown), status text (editable), comments (editable), and dispute button where applicable.
4. **Service Lines (Additional)** -- Table of the 11 additional service lines with the same editing capabilities.
5. **Footer** -- Last updated timestamp and export button.

**Inline Editing Flow:**
- Click a RAG badge to open a dropdown with R, A, G, C, NA options.
- Click status text or comments to reveal an editable textarea.
- Changes are saved via `PATCH /api/scorecards/[id]/service-lines`.
- `toast.success()` on save, `router.refresh()` to reload data.

**Dispute Flow:**
- Off-plan service lines (RED + EIS within 180 days) show an "OFF PLAN" badge and a "Dispute" button.
- The "Dispute" button opens `DisputeDialog`.
- Submission calls `POST /api/scorecards/[id]/service-lines/dispute`.

### Quarterly Timeline (`/timeline`)

A Gantt-style horizontal chart showing all active programmes plotted against their EIS dates.

**Features:**
- X-axis shows quarters (Q1 '25, Q2 '25, etc.) with dashed vertical grid lines.
- Zoom levels: 1 Year (4 quarters), 2 Years (8), 3 Years (12), All.
- A bright teal "TODAY" vertical line marks the current date.
- Each programme is a horizontal bar from today to its EIS date, coloured by overall RAG.
- Hover shows airline name, engine type, EIS date, and days remaining.
- Click navigates to the scorecard detail.
- The `FilterBar` enables region and engine type filtering.
- Programmes are sorted by EIS date.

### Past EIS Archive (`/past-eis`)

Shows programmes that have completed their EIS process or passed their EIS date.

Query: Scorecards where `status === 'CLOSED'` or `eisDate < now()`.

Displays a `DataTable` with columns: Customer (linked), Engine Type, EIS Date, EIS Lead, Status (CLOSED=green badge, ACTIVE=amber "Past EIS" badge), Overall RAG. Searchable by airline name.

### Alerts (`/alerts`)

The notification centre with real-time persistence.

**Features:**
- Filter tabs: All, Unread, Off Plan, Disputes, EIS Approaching -- each showing a count.
- Summary stat cards: Unread count, Off-Plan alerts count, Dispute count.
- Notification cards: colour-coded by type, showing icon, title (bold if unread), message, time ago, and action buttons.
- Actions: "View Scorecard" (link), "Dismiss" (hides), "Mark Read".
- "Mark All Read" button in the page header.
- All actions persist via `PATCH /api/notifications`.
- Dismissed notifications are filtered out of the display.
- Type-specific actions: "Review Dispute" for DISPUTE_RAISED, "Update/Close Scorecard" for PAST_EIS.

### Reports (`/reports`)

Export configuration and download.

Three report types:
1. **Fleet Export** -- All airlines as XLSX. Config: region and engine type multi-select filters.
2. **Scorecard Export** -- Single airline XLSX. Config: airline dropdown, include service lines/comments checkboxes.
3. **Audit Export** -- Audit log XLSX. Config: date range inputs.

The export button opens a new tab to `/api/export` with query parameters.

### Admin: User Management (`/admin/users`)

Full CRUD for user accounts. Accessible to ADMIN users only.

**Features:**
- Stats row: total users, active users, admin count, editor count.
- `DataTable` with searchable user list.
- **Create User dialog**: username, display name, email, password (min 6 chars), role select.
- **Edit User dialog**: pre-filled form for display name, email, role, active status.
- **Delete User**: `ConfirmDialog` with destructive variant.
- All operations call the `/api/admin/users` endpoints.

### Admin: Excel Import (`/admin/import`)

Upload and import EIS Metric Tool Excel workbooks.

**Features:**
- Drag-and-drop upload zone with file picker fallback.
- File validation: `.xlsx`/`.xls` type, maximum 10 MB size.
- Real upload with loading spinner (not fake progress).
- On success: displays created/updated/skipped counts from the API response.
- On error: displays validation error messages.
- Link to audit log for import history.

### Admin: Audit Log (`/admin/audit-log`)

Paginated, filterable audit trail of all data changes.

**Features:**
- Stats: total entries (from `total` prop), breakdown by action type.
- Search input and action type filter (client-side on current page).
- Timeline-style display: each entry shows timestamp, user avatar, action icon (colour-coded), airline name, field changed, old/new value diff.
- Link-based pagination with `?page=N` URL parameters.

---

## Security Considerations

### Authentication Security

- Passwords are hashed with bcrypt at 12 rounds, making brute-force attacks computationally infeasible.
- JWT tokens expire after 24 hours, requiring re-authentication.
- The `NEXTAUTH_SECRET` must be a strong random value in production (generate with `openssl rand -base64 32`).

### Authorisation

- All API routes check for a valid session via `getServerSession(authOptions)`.
- Admin-only routes verify `session.user.role === "ADMIN"` and return 403 for non-admin users.
- The dispute resolution endpoint verifies that the caller is either an admin or the scorecard's EIS Lead.
- Service line edits require ADMIN or EDITOR role (checked on the server side).

### Data Access

- The middleware redirects all unauthenticated requests to `/login`, except for the auth API endpoints and static assets.
- Admin pages perform role checks in the server component and redirect non-admins to `/`.
- Notifications are scoped to the current user (`where: { userId }`) -- users cannot read or modify other users' notifications.

### Input Validation

- The dispute endpoint validates that a `serviceLineStatusId` and `note` are provided and that the status belongs to the specified scorecard.
- User creation validates required fields (username, displayName, password with minimum 6 characters).
- File upload validates file type (`.xlsx`/`.xls`) and size (10 MB maximum) on both client and server.

---

## Performance Considerations

### Server Components

All page-level data fetching happens in server components, which means:
- No waterfall requests from the browser -- all queries execute in parallel via `Promise.all()`.
- Zero client-side JavaScript bundle cost for data fetching logic.
- Prisma queries run directly against the database without an intermediate HTTP hop.

### Database Indexing

The Prisma schema includes indexes on frequently queried columns:
- `audit_logs`: indexed on `scorecardId`, `userId`, and `changedAt`.
- `notifications`: composite index on `(userId, isRead)` and index on `createdAt`.
- `scorecards`: `airlineId` has a unique index.
- `service_line_statuses`: composite unique index on `(scorecardId, serviceLineId)`.

### Client-Side Optimisation

- The `FilterBar` uses URL search parameters instead of React state, avoiding unnecessary re-renders.
- The `HeatmapTable` uses sticky positioning for the first column instead of duplicating the DOM.
- The `DataTable` uses client-side pagination to avoid re-fetching for page navigation within a result set.
- The `CommandMenu` fetches airlines lazily (only when the menu is opened).

### Build Output

The production build generates:
- 12 static pages (login, error boundary, redirects, etc.).
- 18+ dynamic pages (server-rendered on demand).
- Total compiled output: ~20 seconds with Turbopack.

---

## Seed Data Reference

The database seed (`prisma/seed.ts`) creates:

### Default Admin User

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `admin123` |
| Display Name | System Admin |
| Email | admin@rollsroyce.com |
| Role | ADMIN |

### 22 Service Lines

#### Standard (11)

| # | Name | Guidance |
|---|------|----------|
| 1 | Product Agreement | Legally binding PA document. DEG reference for Product Agreement. |
| 2 | TotalCare Agreement | TotalCare Agreement, service level offerings. |
| 3 | IP Spares | Expendables, Rotables, Repairables provisioning. RSPL provided to customer. |
| 4 | IP Tooling | Line Maintenance Tooling orders. 9-month lead time assumed for scoring. |
| 5 | Spare Engine - Dedicated | Dedicated spare engines per Product Agreement. Includes tooling delivery. |
| 6 | EHM | Engine Health Monitoring / Rolls-Royce Care trend monitoring setup. |
| 7 | DACs/ Lifing Insight | Life Limited Parts monitoring and DACs briefing. MS5 Non Executive Operation readiness. |
| 8 | Overhaul Services | Overhaul shop identification, audits, and approvals. |
| 9 | Customer Training | Line and base maintenance training courses. Booking status relative to EIS date. |
| 10 | Field Support | AST (Account Service Team) headcount and onboarding. |
| 11 | Airline Facility Readiness | AMM task capability, tooling, approvals, and facilities. |

#### Additional (11)

| # | Name | Guidance |
|---|------|----------|
| 12 | PAS | Parts Availability Service. Alternative to purchasing spare LRU/LRP parts. |
| 13 | LRU Management | Line Replaceable Units repair/exchange management. Demand loaded into SORB. |
| 14 | LRP Management | Line Replaceable Parts repair/replacement management. |
| 15 | NDSES | Non-Dedicated Spare Engine Service. Lease engine pool service. |
| 16 | Transportation - Routine | Engine transport between main base and overhaul shop. |
| 17 | Transportation - Remote | Transport from remote site locations to overhaul shops. |
| 18 | On-Wing Tech Support | OSD 24/7 troubleshooting support. On-wing technical support readiness. |
| 19 | Engine Split | Trent XWB specific LP/Core split for air freight. |
| 20 | Flight Ops | FOST pilot briefing and technical support for flight operations. |
| 21 | Bespoke Service | Custom service line slot 1. Define as needed per airline contract. |
| 22 | Bespoke Service 2 | Custom service line slot 2. Define as needed per airline contract. |

---

## RAG Status Logic

### Individual Service Line

Each `ServiceLineStatus` has a `ragStatus` field with one of five values:

| Status | Meaning | Visual | Action Required |
|--------|---------|--------|-----------------|
| **C** (Complete) | Service line is fully set up and ready for EIS | Blue-outlined tile with green checkmark | None |
| **G** (Green) | On track, no issues | Green dot | Standard monitoring |
| **A** (Amber) | At risk, requires attention | Amber dot | Follow up with responsible team |
| **R** (Red) | Critical issue, intervention needed | Red dot | Immediate escalation |
| **NA** (Not Applicable) | This service line does not apply to this airline | Grey dot | None |

### Overall RAG Computation

The `computeOverallRAG()` function in `lib/utils.ts` computes the overall RAG for a scorecard from its service line statuses using the "worst wins" principle:

1. If any status is **R** --> overall is **R**
2. Else if any status is **A** --> overall is **A**
3. Else if all statuses are **C** or **NA** --> overall is **C**
4. Otherwise --> overall is **G**

### Off-Plan Classification

A programme is classified as "Off Plan" when:
- At least one service line has `ragStatus === "R"`, AND
- The `eisDate` is within 180 days of today (approximately 6 months), AND
- The scorecard status is `ACTIVE`

Off-Plan programmes receive:
- An `OFF_PLAN` notification to the EIS Lead
- An "OFF PLAN" badge on the countdown timer
- A prominent listing on the Command Center dashboard
- The ability for users to raise disputes

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-03-05 | 1.0 | Initial build: light theme, sidebar navigation, gate review system |
| 2026-03-06 | 2.0 | Frontend upgrade: dark cockpit theme, top navigation, all pages restyled |
| 2026-03-18 | 3.0 | Full rebuild v2: Power BI-style category tabs, collapsible sidebar, quarterly timeline, removed gates, off-plan detection, dispute workflow, past EIS archive, account-level notifications, working CRUD for all admin pages, comment accessibility, global filter bar |
