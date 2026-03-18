# Rork Prompt — EIS Command Center iOS App

> **PREREQUISITE:** Before using this prompt in Rork, you need to add a mobile authentication endpoint to your EIS Dashboard server. See the "Server-Side Setup" section at the bottom of this file. Once that endpoint is deployed, set your Rork Environment Variable `EIS_API_BASE_URL` to your deployed server URL (e.g. `https://your-eis-dashboard.vercel.app`).

---

## The Prompt (copy everything below this line into Rork)

---

Build a native iOS app called **"EIS Command Center"** — a personal management companion for a Rolls-Royce Civil Aerospace EIS (Entry Into Service) Dashboard. This app connects to my existing REST API backend to display real-time airline scorecard data, service line statuses, gate reviews, and notifications. The app is built for a single admin user (me) to monitor and manage 30+ airline EIS programmes from my iPhone.

**Primary goal: the best possible user experience.** This should feel like the pinnacle of iOS 26 design — a showcase of Apple's new Liquid Glass / glassmorphism design language. Every surface should feel alive, translucent, and premium. Prioritise smooth interactions, fluid animations, beautiful depth, and thoughtful spacing over adding extra features. Make the app feel alive and responsive.

**Target user:** A senior aerospace programme manager who needs clarity, speed, and at-a-glance status visibility while on the move. The mood should be: futuristic, airy, luminous, and ultra-premium — like looking through the glass cockpit of a next-generation aircraft.

**Design language — iOS 26 Glassmorphism / Liquid Glass:**
- Fully embrace the iOS 26 Liquid Glass aesthetic throughout the entire app
- **Translucent glass cards** with frosted glass blur effects (UIVisualEffectView / .ultraThinMaterial / .regularMaterial) — every card and panel should have a glass-like translucency that lets the background subtly bleed through
- **Layered depth:** Use multiple layers of glass at different opacities to create a sense of floating UI elements hovering over rich gradient backgrounds
- **Background meshes:** Use animated mesh gradient backgrounds behind the glass layers — soft gradients shifting between deep navy (#0a1628), midnight blue (#162a4a), steel blue (#2d4a7a), and touches of cyan (#0891b2). These should feel like a slowly breathing aurora or sky at dusk. Subtle and elegant, not distracting.
- **Glass tab bar and navigation bar** — the tab bar and nav bar should also use the frosted glass material, not opaque backgrounds
- **Borders on glass elements:** Very subtle 0.5pt white borders at ~15% opacity on glass cards to give them definition and a polished "glass edge" look
- **Shadows:** Soft, diffused drop shadows beneath glass cards to enhance the floating effect — never harsh or dark
- **Accent colour:** Use a vibrant accent colour of #0ea5e9 (sky blue) for interactive elements, selected states, and highlights — this will pop beautifully against the frosted glass
- **SF Pro font throughout** — use SF Pro Rounded for headings and SF Pro for body text to feel modern
- **Generous spacing:** Lots of breathing room between elements. The UI should feel open and spacious, never cramped
- **Smooth spring animations** on all transitions — pages should slide in with a subtle bounce, cards should scale slightly on press, modals should fade in with a spring
- **Haptic feedback:** Light haptic on pull-to-refresh, selection changes, and tab switches. Medium haptic on sign out confirmation
- **No hard edges or opaque backgrounds anywhere** — everything should feel translucent and layered
- **Vibrancy effects** on text over glass: use .secondary and .tertiary label colours so text adapts to the translucent background
- **Light and dark mode support** — In light mode, the glass should be white-frosted with light mesh gradients (soft whites, light blues, pale greys). In dark mode, the glass is dark-frosted with the deep navy/blue mesh gradients. Both should look stunning.
- **Icon style:** Use SF Symbols throughout, preferring the .fill variant for tab icons and navigation, giving them a modern iOS 26 feel

---

### Authentication

The app authenticates against my existing server using a token-based API.

**Login endpoint:**
- `POST {EIS_API_BASE_URL}/api/mobile/auth`
- Request body: `{ "username": "string", "password": "string" }`
- Success response (200): `{ "token": "jwt-string", "user": { "id": "string", "username": "string", "displayName": "string", "email": "string|null", "role": "ADMIN|EDITOR|VIEWER", "jobTitle": "string|null", "managedAirlines": [{ "id": "string", "name": "string" }] } }`
- Error response (401): `{ "error": "Invalid credentials" }`

**All subsequent API requests** must include the header: `Authorization: Bearer {token}`

Store the token securely in the iOS Keychain. If a request returns 401, redirect to the login screen.

Use the environment variable `EIS_API_BASE_URL` for the server URL. Never hardcode it.

---

### Tab Bar Structure (5 tabs)

**Tab 1: Dashboard** (house icon)
**Tab 2: Airlines** (airplane icon)
**Tab 3: Timeline** (calendar icon)
**Tab 4: Notifications** (bell icon with unread badge count)
**Tab 5: Profile** (person icon)

---

### Screen 1: Login

A stunning, full-screen login experience:
- Full-screen animated mesh gradient background — slowly shifting colours between deep navy, midnight blue, and touches of cyan. It should feel like a living, breathing sky.
- A single frosted glass card centred on screen containing:
  - "ROLLS-ROYCE" in a bold, wide-tracked (letter-spaced) SF Pro Rounded font at the top of the card
  - "EIS Command Center" tagline below in lighter weight, muted vibrancy text
  - Username text field with glass-material background and subtle inner glow
  - Password text field (secure entry) with matching glass style
  - "Sign In" button — full-width, vibrant sky blue (#0ea5e9) with rounded corners and a subtle glow/bloom effect behind it
  - Error message area below the button with red-tinted glass background when visible
- The glass login card should have a subtle entrance animation — fade in + scale up with a spring
- No sign-up flow — admin creates accounts on the web dashboard

---

### Screen 2: Dashboard (Home Tab)

Fetches data from two API calls on load:

**API 1 — Dashboard stats:**
`GET {EIS_API_BASE_URL}/api/mobile/dashboard`
Returns: `{ "totalActive": number, "atRisk": number, "approachingEis": number, "overdueScorecards": number }`

**API 2 — Portfolio overview:**
`GET {EIS_API_BASE_URL}/api/mobile/portfolio`
Returns an array of scorecard summaries:
```json
[{
  "id": "string",
  "airlineId": "string",
  "customer": "string",
  "engineType": "string",
  "region": "EUROPE|MEA|APAC|GREATER_CHINA|AMERICAS",
  "eisLead": "string",
  "eisDate": "ISO-date-string|null",
  "eisDateTbc": boolean,
  "eisRisk": "NO_RISK|YES_CUSTOMER|YES_RR",
  "status": "ACTIVE|CLOSED|ON_HOLD",
  "lastUpdatedAt": "ISO-date-string",
  "overallRag": "C|G|A|R",
  "redCount": number,
  "amberCount": number,
  "greenCount": number,
  "completeCount": number
}]
```

**Layout:**
- Animated mesh gradient background behind everything (consistent with the app-wide glass theme)
- Greeting at top: "Good morning, {displayName}" (use time-of-day greeting) in large SF Pro Rounded bold, with vibrancy
- 4 KPI metric cards in a 2x2 grid, each a **frosted glass card** with:
  - A large bold number (SF Pro Rounded, heavy weight)
  - A small label below
  - A subtle coloured tint on the glass matching the metric's meaning:
    - "Active Programmes" — totalActive count — neutral/white tinted glass
    - "At Risk" — atRisk count — red tinted glass (#ef4444 at ~10% over the frost)
    - "EIS < 6 Months" — approachingEis count — amber tinted glass (#f59e0b at ~10%)
    - "Overdue Updates" — overdueScorecards count — orange tinted glass (#f97316 at ~10%)
  - Each card should have a press-down scale animation when tapped
- Below the KPI cards: a section titled "Portfolio at a Glance" on a larger glass panel, showing a scrollable list of the first 10 airlines sorted by EIS date ascending
- Each airline row shows: airline name, engine type, EIS date (or "TBC"), and an overall RAG status dot — rows separated by subtle glass dividers
- Tapping an airline row navigates to the Scorecard Detail screen with a smooth push transition
- Pull-to-refresh on the entire screen with haptic feedback

**RAG colour system (use throughout the entire app):**
- C (Complete) = #3b82f6 (blue)
- G (Green) = #22c55e (green)
- A (Amber) = #f59e0b (amber/yellow)
- R (Red) = #ef4444 (red)
- NA (Not Applicable) = #6b7280 (grey)

---

### Screen 3: Airlines (Airlines Tab)

`GET {EIS_API_BASE_URL}/api/mobile/portfolio`
(Same endpoint as dashboard portfolio)

**Layout:**
- Search bar at top with glass-material background and search icon — feels like an iOS 26 native search field
- Segmented filter control below search: "All" | "Active" | "At Risk" | "On Hold" — use a glass-style segmented control with the selected segment having a brighter glass highlight
- Region filter pills: "All Regions" | "Europe" | "MEA" | "APAC" | "Greater China" | "Americas" — horizontally scrollable glass capsule pills, selected one gets accent colour tint
- Airline cards in a vertical list, each card is a **frosted glass card** showing:
  - Airline name (bold, large, SF Pro Rounded)
  - Engine type (smaller, secondary vibrancy label)
  - Region badge (small glass capsule pill)
  - EIS date with countdown (e.g. "15 Mar 2027 — 342 days") or "TBC" if eisDateTbc is true
  - EIS risk indicator: if YES_CUSTOMER or YES_RR, show a small warning SF Symbol with "Customer Risk" or "RR Risk" in an amber-tinted glass pill
  - Overall RAG status — a glowing coloured dot using the RAG colour system, with a subtle bloom/glow effect
  - Mini RAG summary bar: a thin horizontal bar with frosted segments of red/amber/green/blue/grey based on the counts — this looks like a glass progress bar
- Cards should have a press-down spring animation when tapped
- Tapping a card navigates to the Scorecard Detail screen
- Pull-to-refresh with haptic

---

### Screen 4: Scorecard Detail (push navigation from Airlines or Dashboard)

`GET {EIS_API_BASE_URL}/api/mobile/scorecards/{airlineId}`
Returns:
```json
{
  "id": "string",
  "airlineId": "string",
  "airlineName": "string",
  "region": "string",
  "engineType": "string",
  "eisDate": "ISO-date-string|null",
  "eisDateTbc": boolean,
  "eisRisk": "NO_RISK|YES_CUSTOMER|YES_RR",
  "eisLeadName": "string|null",
  "orderDetails": "string|null",
  "status": "ACTIVE|CLOSED|ON_HOLD",
  "lastUpdatedAt": "ISO-date-string",
  "gateReviews": [{
    "gateNumber": 1-6,
    "planDate": "ISO-date-string|null",
    "actualDate": "ISO-date-string|null",
    "outcome": "string|null"
  }],
  "serviceLineStatuses": [{
    "id": "string",
    "serviceLineName": "string",
    "serviceLineCategory": "STANDARD|ADDITIONAL",
    "ragStatus": "C|G|A|R|NA",
    "statusText": "string|null",
    "comments": "string|null",
    "isDisputed": boolean,
    "disputeNote": "string|null"
  }]
}
```

**Layout (scrollable, mesh gradient background behind all sections):**

**Section 1 — Header Card (large frosted glass card):**
- Large airline name at top (SF Pro Rounded, heavy weight)
- Status badge in a glass capsule pill (ACTIVE = green-tinted glass, CLOSED = grey, ON_HOLD = amber)
- Info grid on the glass card showing: Engine Type, Region, EIS Lead, Order Details — use a 2-column layout with label/value pairs, labels in secondary vibrancy
- **EIS countdown centrepiece:** if eisDate is set, show a large, prominent countdown in the centre of the card — the number of days in huge bold text with a subtle colour glow behind it (green glow for >180 days, amber glow for 90-180, red glow for <90). The EIS date shown below in smaller text. If eisDateTbc, show "EIS Date: TBC" in a muted style. This countdown should feel like the hero element of the screen.
- EIS Risk indicator if not NO_RISK — shown as a small warning glass pill

**Section 2 — Gate Reviews (frosted glass card):**
- Title: "Gate Reviews" with a subtle SF Symbol icon
- Horizontal stepper showing gates 1-6 as connected circles on a glass rail
- Each gate circle: filled with a green glow if actualDate exists, outlined in accent blue with glass fill if planDate is in the future, outlined in red with pulsing subtle glow if planDate is in the past and no actualDate (overdue)
- Below the stepper, a scrollable row of small glass mini-cards for each gate: "Gate {n}" with plan date and actual date (or "Pending")

**Section 3 — Service Lines Standard (frosted glass card):**
- Title: "Standard Service Lines" with a count badge in a glass capsule
- List of service lines where category is STANDARD
- Each row shows: service line name, RAG status as a glowing coloured dot, and status text (if any) in secondary label colour
- If isDisputed is true, show a small amber warning SF Symbol
- Tapping a row expands it with a smooth animation to show the full comments and dispute note inside a slightly darker glass inset
- Rows separated by ultra-thin glass dividers

**Section 4 — Service Lines Additional (frosted glass card, collapsed by default):**
- Title: "Additional Service Lines" with a count badge
- Same layout as standard, but for category ADDITIONAL
- Collapsed by default with a "Show Additional" glass toggle button — animates open with a spring

**Section 5 — RAG Summary (frosted glass card):**
- A horizontal stacked bar chart made of frosted glass segments, each tinted with the RAG colour — the bar itself should look like a coloured glass tube
- Labels below in a row: "X Red, X Amber, X Green, X Complete, X N/A" with matching coloured dots

---

### Screen 5: Timeline (Timeline Tab)

`GET {EIS_API_BASE_URL}/api/mobile/portfolio`
(Reuse portfolio data)

**Layout:**
- Mesh gradient background
- A vertical timeline view showing all airlines with EIS dates, sorted chronologically
- The timeline spine is a thin vertical glass line with a subtle glow
- Each entry is a small frosted glass card branching off the timeline, connected by a glass node circle (coloured by the airline's overall RAG status with a glow)
- Each card shows: airline name (bold), engine type (muted), EIS date, and RAG dot
- Group entries by quarter (Q1 2026, Q2 2026, etc.) — quarter headers are glass section headers with the quarter text
- Airlines without an EIS date (TBC) are shown in a separate "Unscheduled" frosted section at the bottom
- Tapping an entry navigates to the Scorecard Detail screen with a smooth transition
- The timeline should feel like a floating glass path through time

---

### Screen 6: Notifications (Notifications Tab)

`GET {EIS_API_BASE_URL}/api/notifications?limit=50`
Returns: `{ "notifications": [{ "id": "string", "type": "string", "title": "string", "message": "string", "scorecardId": "string|null", "isRead": boolean, "createdAt": "ISO-date-string" }], "unreadCount": number }`

**Mark as read:**
`PATCH {EIS_API_BASE_URL}/api/notifications`
Body: `{ "id": "notification-id", "read": true }`

**Mark all read:**
`PATCH {EIS_API_BASE_URL}/api/notifications`
Body: `{ "markAllRead": true }`

**Layout:**
- "Mark All Read" glass capsule button in the top-right corner
- List of notification cards — each is a frosted glass card
- **Unread notifications** have a brighter glass with a subtle sky-blue (#0ea5e9) left edge glow to make them stand out
- **Read notifications** have a dimmer, more muted glass
- Each card shows: notification type SF Symbol icon (in a small tinted glass circle), title (bold), message (secondary vibrancy, 2 lines max), and relative timestamp in the top-right ("2h ago", "Yesterday")
- Notification type SF Symbol icons:
  - EIS_APPROACHING → clock.fill
  - SCORECARD_OVERDUE → exclamationmark.triangle.fill
  - STATUS_DEGRADED → arrow.down.circle.fill
  - GATE_DUE → flag.fill
  - OFF_PLAN → exclamationmark.circle.fill
  - PAST_EIS → calendar.badge.exclamationmark
  - DISPUTE_RAISED → bubble.left.and.exclamationmark.bubble.right.fill
  - DISPUTE_RESOLVED → checkmark.circle.fill
  - SCORECARD_UPDATED → arrow.clockwise.circle.fill
- Swipe left on a notification to reveal a glass "Dismiss" action
- Tapping a notification marks it as read with a subtle fade animation. If it has a scorecardId, navigate to that scorecard detail.
- Pull-to-refresh with haptic
- Show the unread count as a badge on the Notifications tab icon

---

### Screen 7: Profile (Profile Tab)

No API call needed — use the stored user data from login.

**Layout:**
- Mesh gradient background
- Large frosted glass profile card at the top:
  - User avatar circle with initials (derived from displayName) — the circle should have a glass border with a subtle gradient glow
  - Display name (large, bold, SF Pro Rounded)
  - Username (@username style, secondary vibrancy)
  - Job title (if present, tertiary vibrancy)
  - Email (if present, tertiary vibrancy)
  - Role badge in a coloured glass capsule pill (Admin = amber glass, Editor = teal glass, Viewer = grey glass)
- "Managed Airlines" section — a separate frosted glass card below the profile card. If the user has managed airlines, show them as glass capsule pills with an airplane SF Symbol. If none, show "No airlines assigned" in muted text.
- Divider (glass-style thin line)
- "Sign Out" button — a full-width glass button with red-tinted glass and red text. Tapping shows a confirmation dialog (also styled as a glass alert). On confirm, clears the token from Keychain and returns to login screen with a fade transition.
- App version info at the very bottom (small, tertiary vibrancy)

---

### Global Patterns

- **Error handling:** If any API call fails, show an inline glass error card with a red tint, an SF Symbol warning icon, the error message, and a "Retry" glass button. Never show raw error text or crash.
- **Loading states:** Use shimmering glass skeleton placeholders while data loads — the skeletons should have a subtle glass shimmer animation moving across them. Never show a blank screen.
- **Offline handling:** If the device is offline, show a glass banner at the top with a cloud.slash SF Symbol: "You're offline — showing cached data". Serve the last cached response.
- **Pull-to-refresh:** Available on Dashboard, Airlines, Timeline, and Notifications screens. Use haptic feedback.
- **Cache:** Cache API responses locally so the app opens instantly with stale data while refreshing in the background (stale-while-revalidate pattern).
- **Date formatting:** Use relative dates for recent times ("2h ago", "Yesterday") and "15 Mar 2027" format for absolute dates. Use en-GB locale.
- **Empty states:** If a list is empty, show a frosted glass empty state card with a large SF Symbol, a title, and a subtitle (e.g. airplane icon + "No airlines match your filter" + "Try adjusting your search or filters").
- **Haptic feedback:** Light haptic on pull-to-refresh, tab switches, and filter selections. Medium haptic on sign out confirmation.
- **Scroll behaviour:** When scrolling, the glass navigation bar should blur more as content scrolls behind it, creating a dynamic depth effect.

---

### Widget (iOS Home Screen Widget)

Add an iOS home screen widget called "EIS At a Glance" in small and medium sizes. The widgets should embrace iOS 26 widget styling.

**Small widget:** A glass-style widget showing the 4 KPI numbers (Active, At Risk, EIS < 6mo, Overdue) in a 2x2 compact grid. Each number uses the RAG-appropriate colour. Background should be a subtle mesh gradient that matches the system wallpaper through the widget's glass material.

**Medium widget:** Glass-style widget with the 4 KPIs on the left in a compact column, and the top 3 airlines approaching EIS on the right (airline name + days remaining + small RAG coloured dot). Clean divider between left and right sections.

The widget should refresh every 30 minutes using background refresh. Use the dashboard stats and portfolio endpoints.

---

### Important Implementation Notes

- This is a **read-only companion app** for monitoring. There are no create or edit operations from the mobile app — all data management happens on the web dashboard.
- All API responses return JSON.
- The server uses HTTPS.
- The `EIS_API_BASE_URL` environment variable holds the base URL. Never hardcode it.
- The token from login should be stored in the iOS Keychain and included as `Authorization: Bearer {token}` in all requests.
- If any request returns HTTP 401, clear the stored token and redirect to the login screen.

---

## Server-Side Setup (do this BEFORE using the Rork prompt above)

You need to add a few mobile-specific API endpoints to your EIS Dashboard server. Ask Claude Code to:

1. **Add `POST /api/mobile/auth`** — accepts `{username, password}`, validates credentials against the database (same as NextAuth), and returns a signed JWT token + user object (including jobTitle and managedAirlines). This token should be verified by a middleware on all `/api/mobile/*` routes and the existing `/api/notifications` route.

2. **Add `GET /api/mobile/dashboard`** — returns the 4 KPI stats (totalActive, atRisk, approachingEis, overdueScorecards). Protected by Bearer token auth.

3. **Add `GET /api/mobile/portfolio`** — returns the portfolio overview array with calculated overallRag, redCount, amberCount, greenCount, completeCount per scorecard. Protected by Bearer token auth.

4. **Add `GET /api/mobile/scorecards/[airlineId]`** — returns the full scorecard detail including gate reviews and service line statuses. Protected by Bearer token auth.

5. **Update `GET /api/notifications` and `PATCH /api/notifications`** — accept Bearer token auth in addition to the existing session-cookie auth, so the mobile app can access notifications.

6. **Add CORS headers** to allow requests from the mobile app.

These endpoints reuse the same Prisma queries that already exist in `lib/queries/dashboard.ts`, `lib/queries/scorecard.ts`, and `lib/queries/notifications.ts` — they just wrap them with token-based auth instead of session-cookie auth.
