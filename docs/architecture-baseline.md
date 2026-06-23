# Neighbours Club — Current Architecture Baseline

**Document type:** Read-only technical inventory. Describes what exists in the
committed codebase as of 2026-06-22. No proposals, no "should", no design
speculation. Where a capability does not exist, this document says so plainly.

**Audience:** Onboarding engineers, pilot-readiness reviewers, anyone who needs
to know what is actually built before extending it.

**Source of truth:** The files listed in each section were read directly to
produce this document. Code snippets are excerpted from those files with line
numbers; nothing is reconstructed from memory.

---

## Table of contents

1. [Tech stack summary](#1-tech-stack-summary)
2. [Database schema and state management](#2-database-schema-and-state-management)
   - [2.1 Users and roles](#21-users-and-roles)
   - [2.2 Delivery order state machine](#22-delivery-order-state-machine)
   - [2.3 Group-buy order state machine](#23-group-buy-order-state-machine)
   - [2.4 The CP ledger](#24-the-cp-ledger)
3. [Core logistics and frontend structure](#3-core-logistics-and-frontend-structure)
   - [3.1 Order tracking page](#31-order-tracking-page)
   - [3.2 Driver feed](#32-driver-feed)
   - [3.3 Kitchen dashboard](#33-kitchen-dashboard)
   - [3.4 Delivery component map](#34-delivery-component-map)
4. [Dispatch cron sweep](#4-dispatch-cron-sweep)
5. [Vercel cron schedule](#5-vercel-cron-schedule)
6. [Architectural gaps (what does NOT exist)](#6-architectural-gaps-what-does-not-exist)

---

## 1. Tech stack summary

| Layer | Technology |
|---|---|
| Framework | Next.js 16 App Router, TypeScript strict mode |
| ORM | Prisma with PostgreSQL (Neon / Vercel Postgres in production) |
| Auth | Auth.js v5, Credentials provider, JWT session strategy |
| Payments | Stripe (manual capture for group buy; immediate capture for delivery) |
| Email | Resend |
| AI | Google Gemini 2.5 Flash (Notes summarization, risk scoring, category tagging) |
| Styling | Tailwind CSS |
| Scheduled jobs | Vercel Cron (see §5) |
| Package manager | npm |
| Deployment | Vercel (serverless — no persistent server process, no Docker) |
| Local dev DB | Native Windows PostgreSQL (not containerized); Neon in production |

Route protection lives in `proxy.ts` (Next.js 16 convention). Middleware is
not used for route protection.

---

## 2. Database schema and state management

Source file: `prisma/schema.prisma`

### 2.1 Users and roles

The `User` model is a single table covering all participant types. Role
differentiation is carried by a `Role` enum column with four values:

```prisma
// prisma/schema.prisma

enum Role {
  MEMBER            // Regular customer (default)
  ADMIN
  RESTAURANT_OWNER
  COURIER
}

model User {
  id               String  @id @default(cuid())
  email            String  @unique
  passwordHash     String
  name             String
  firstName        String?
  phone            String?
  role             Role    @default(MEMBER)
  stripeCustomerId String? @unique

  // Delivery address (snapshot fields on User, copied to DeliveryOrder.deliveryAddress JSON at order time)
  deliveryAddressLine1  String?
  deliveryAddressLine2  String?
  deliveryAddressCity   String?
  deliveryAddressPostal String?

  neighbourhoodId String?
  neighbourhood   Neighbourhood? @relation(fields: [neighbourhoodId], references: [id])

  hasCompletedOnboarding Boolean @default(false)

  // Driver fields — only meaningful when role = COURIER
  isOnline     Boolean @default(false)
  restaurantId String? // set when role = RESTAURANT_OWNER

  // ... relations omitted for brevity

  wallet Wallet?
}
```

**Key points:**
- There is **one User table** for all roles. Role is a single enum column, not
  a separate entity.
- A COURIER user also has a **separate `DeliveryDriver` record** (one-to-one
  via `userId`). The User row carries `isOnline`; the DeliveryDriver row
  carries the more granular `DriverStatus` enum and `activeOrderId`.
- **No compliance-documentation modeling exists** — there are no tables or
  columns for consent records, data-processing agreements, background-check
  status, courier contracts, or insurance documentation. These are absent.

The `DeliveryDriver` model:

```prisma
model DeliveryDriver {
  id            String          @id @default(uuid())
  userId        String          @unique
  user          User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  status        DriverStatus    @default(OFFLINE)
  vehicleType   VehicleType     @default(CAR)
  activeOrderId String?         @unique  // one active delivery per driver
  activeOrder   DeliveryOrder?  @relation("ActiveDriverOrder", fields: [activeOrderId], references: [id])
  deliveries    DeliveryOrder[] @relation("HistoricalDriverOrders")
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
}

enum DriverStatus {
  OFFLINE
  AVAILABLE
  ON_DELIVERY
}

enum VehicleType {
  CAR
  BIKE
  SCOOTER
  FOOT
}
```

`activeOrderId @unique` enforces that a driver can hold at most one active
delivery at a time at the database level.

---

### 2.2 Delivery order state machine

The `DeliveryOrder` model is the core of the delivery vertical.

```prisma
model DeliveryOrder {
  id     String @id @default(cuid())
  userId String
  restaurantId String
  driverId     String?        // set when INTERNAL driver claims the order
  activeDriver DeliveryDriver? @relation("ActiveDriverOrder")

  items Json   // snapshot of cart at order time (prices locked)

  subtotal    Decimal @db.Decimal(10, 2)
  deliveryFee Decimal @db.Decimal(10, 2)
  serviceFee  Decimal @db.Decimal(10, 2)
  tax         Decimal @db.Decimal(10, 2)
  tip         Decimal @db.Decimal(10, 2)
  tipPct      Int?
  total       Decimal @db.Decimal(10, 2)

  status          DeliveryOrderStatus @default(PENDING_PAYMENT)
  fulfillmentType FulfillmentType     @default(INTERNAL)
  pickupPin       String?  // 4-digit PIN; set on INTERNAL claim, or by Uber stub
  cancellationReason String?
  needsAdminReview   Boolean @default(false)

  // CP delivery-fee waiver
  cpWaiverApplied  Boolean  @default(false)
  cpWaivedAmount   Decimal? @db.Decimal(10, 2)
  cpWaiverSettled  Boolean  @default(false)
  cpWaiverCost     Int?

  // CP secret-menu redemption
  cpRedemptionSettled Boolean @default(false)
  redemptionKey       String? @unique  // concurrency guard: "{orderId}:{itemId}"

  stripePaymentIntentId String? @unique
  deliveryAddress       Json    // address snapshot; decoupled from User address

  // Courier tracking
  courierJobId       String?   // Uber Direct delivery ID (real) or stub jobId
  courierRequestedAt DateTime? // when createJob was called

  // Timing
  dispatchStartedAt   DateTime?
  estimatedDeliveryAt DateTime?
  acceptedAt          DateTime?
  cookingStartedAt    DateTime?
  readyAt             DateTime?
  pickedUpAt          DateTime?
  deliveredAt         DateTime?

  // Photo proof (fields exist; no upload endpoint implemented yet)
  pickupPhotoUrl  String?
  dropoffPhotoUrl String?
}
```

**Status enum — all values:**

```prisma
enum DeliveryOrderStatus {
  PENDING_PAYMENT   // Stripe PaymentIntent created; awaiting webhook confirmation
  PENDING           // Payment confirmed; sitting in kitchen queue, no driver claimed
  ACCEPTED          // Internal driver claimed the order; kitchen knows courier is lined up
  AWAITING_COURIER  // Escalated to Uber Direct (or stub); searching for a courier
  COURIER_ASSIGNED  // Uber driver locked in and en route to restaurant
  COOKING           // Kitchen actively preparing
  READY             // Food bagged; awaiting pickup by courier
  PICKED_UP         // In transit
  DELIVERED         // Terminal success
  CANCELLED         // Terminal failure
}

enum FulfillmentType {
  INTERNAL    // Internal driver pool (pilot default)
  UBER_DIRECT // Uber Direct API (currently a stub — see §6)
}
```

**Internal courier claim flow** (source: `app/delivery/driver/actions/driverActions.ts`):

The `getAvailableOrders` server action queries:

```typescript
// app/delivery/driver/actions/driverActions.ts

const orders = await prisma.deliveryOrder.findMany({
  where: {
    status: DeliveryOrderStatus.PENDING,
    driverId: null,
    fulfillmentType: FulfillmentType.INTERNAL,
  },
  orderBy: { createdAt: "asc" }, // FIFO — oldest first
})
```

Only `PENDING` orders with no driver assigned and `INTERNAL` fulfillment type
appear in the driver feed.

`acceptOrder` uses an atomic conditional `updateMany` to prevent two drivers
claiming the same order simultaneously:

```typescript
// app/delivery/driver/actions/driverActions.ts

const updated = await tx.deliveryOrder.updateMany({
  where: {
    id: orderId,
    status: DeliveryOrderStatus.PENDING,
    driverId: null,          // both conditions must hold atomically
  },
  data: {
    status: DeliveryOrderStatus.ACCEPTED,
    driverId: driver.id,
    acceptedAt: new Date(),
    pickupPin,               // 4-digit PIN generated before the tx
  },
})

if (updated.count === 0) {
  return { success: false, error: "Order already taken." }
}

// Claim succeeded — update DeliveryDriver record in the same tx
await tx.deliveryDriver.update({
  where: { id: driver.id },
  data: {
    status: DriverStatus.ON_DELIVERY,
    activeOrderId: orderId,
  },
})
```

If `count === 0`, another driver won the race and the order is no longer
available. The transaction rolls back both writes.

**Payment settlement** (source: `lib/delivery/settlement.ts`):

`settleDeliveryPayment(orderId)` is called by both the Stripe webhook handler
and the dev-only trigger (`/api/dev/settle-delivery-payment`). It transitions
`PENDING_PAYMENT → PENDING`, sets `dispatchStartedAt`, and burns CP for the
fee waiver if applicable. Both call sites use the same function — they cannot
diverge.

---

### 2.3 Group-buy order state machine

The group-buy vertical uses a separate pair of models: `Deal` and `Order`.
The `Order` IS the pledge — there is no separate pledge model.

```
DealStatus:  DRAFT → OPEN → CLOSING_SUCCESS → FULFILLING → COMPLETED
                          ↘ CLOSING_FAILED
                          ↘ CANCELLED

OrderStatus: PENDING_AUTHORIZATION → AUTHORIZED → CAPTURED → PICKED_UP
                                               ↘ CAPTURE_FAILED
                                  ↘ VOIDED
                                  ↘ REFUNDED
                                  ↘ NO_SHOW
```

Key invariant: **Stripe webhook is the sole authority for order state
transitions.** The join endpoint creates orders as `PENDING_AUTHORIZATION`.
Only the webhook handler (`/api/stripe/webhook`) promotes them to `AUTHORIZED`,
`CAPTURED`, or `VOIDED`. No client-reported state is trusted.

A `(userId, dealId)` `@@unique` constraint on `Order` enforces one order per
user per deal. If a user leaves and rejoins, the existing row is updated (not
re-inserted).

---

### 2.4 The CP ledger

Source files: `lib/cp/core.ts`, `lib/cp/types.ts`, `lib/cp/econ-params.ts`,
`lib/cp/content-faucet.ts`, `lib/cp/phi.ts`, `lib/cp/rewards.ts`

**Ledger model:**

```prisma
model Wallet {
  id        String   @id @default(cuid())
  userId    String   @unique
  balanceCP Int      @default(0)  // cached running total; ledger is authoritative
  ledger    WalletLedger[]
}

model WalletLedger {
  id          String   @id @default(cuid())
  walletId    String
  amount      Int      // positive = earn, negative = burn (SINGLE-ENTRY, SIGNED)
  reason      String
  referenceId String
  createdAt   DateTime @default(now())

  @@unique([walletId, referenceId, reason])  // idempotency gate
  @@map("wallet_ledger")
}
```

This is a **single-entry signed-integer ledger**, not double-entry. Each earn
or burn writes one row with a positive or negative `amount`. The
`@@unique([walletId, referenceId, reason])` constraint is the idempotency
gate: a duplicate write (e.g., webhook retry) hits a Prisma `P2002` unique
violation and is caught and returned as `{ ok: true, deduped: true }`.

**`earnCP` and `burnCP`** (source: `lib/cp/core.ts`) each open their own
`$transaction` and **cannot accept an external transaction**. They do not
accept a `tx` argument; callers cannot compose them into a larger transaction.

`earnCP` protocol:
1. Upsert wallet (idempotent).
2. Insert ledger row *first* (idempotency gate — if this fails with P2002, the
   transaction rolls back before the balance is touched).
3. Increment `Wallet.balanceCP` only if the ledger insert succeeded.

`burnCP` protocol:
1. Upsert wallet.
2. Insert ledger row as `-amount`.
3. Conditional `updateMany` with `WHERE balanceCP >= amount` (overdraft guard).
   If `count === 0`, throws `InsufficientBalanceError`, rolling back both the
   ledger insert and the decrement — neither is committed.

The **content faucet** (`lib/cp/content-faucet.ts`) is a **separate,
dedicated path** from `earnCP`. It uses `SELECT … FOR UPDATE` on the wallet
row to serialize concurrent reads for the same user, preventing the race where
two simultaneous first-reads both see `n=0` and both mint the full first-read
reward:

```typescript
// lib/cp/content-faucet.ts (inside $transaction)
await tx.$queryRaw`SELECT id FROM "Wallet" WHERE id = ${wallet.id} FOR UPDATE`
```

**CP reasons** (closed union, `lib/cp/types.ts`):

```typescript
type CPReason =
  | 'verified_read'        // diminishing faucet: 100 → 33 → 8 → 8 → 8 → 0+
  | 'tier_bridge'          // group-buy tier advancement (not yet wired)
  | 'delivery_fee_waiver'  // 500 CP burned at delivery checkout
  | 'group_buy_reward'     // 330 CP per captured group-buy order (lib/cp/rewards.ts)
  | 'signup_bonus'         // not yet wired
  | 'secret_menu_redeem'   // 1,000 CP burned to unlock a secret menu item
  | 'donation'             // civic sink — not yet built
  | 'manual_grant'         // dev/admin only
```

**EconParam** (source: `lib/cp/econ-params.ts`):

All tunable economy values live in the `econ_params` table (key/value pairs).
The accessor (`getEconParam`, `getAllEconParams`) is the only sanctioned read
path. In-code fallbacks equal the seeded pilot values so a missing row
degrades gracefully.

| Key | Pilot fallback | Meaning |
|---|---|---|
| `content_faucet_read_1` | 100 | CP for 1st verified read per day |
| `content_faucet_read_2` | 33 | CP for 2nd verified read |
| `content_faucet_read_3to5` | 8 | CP for reads 3–5 |
| `content_faucet_daily_cap` | 185 | Daily cap on content faucet CP |
| `daily_total_earn_cap` | 650 | Daily cap across all faucets |
| `weekly_total_earn_cap` | 2600 | Weekly cap across all faucets |
| `phi_target_low` | 0.9 | Φ lower band |
| `phi_target_high` | 1.1 | Φ upper band |
| `phi_alarm_threshold` | 1.15 | Φ alarm level |
| `cap_reset_timezone` | `America/Toronto` | Timezone for daily/weekly cap windows |
| `note_high_risk_threshold` | 5 | riskScore at or above which a note is HIGH-risk |
| `cp_to_dollar_rate` | `1` | Stored as `'1'` (cents per CP, i.e. $0.01/CP = 100 CP → $1) |

**Φ (phi)** — the inflation measurement instrument (source: `lib/cp/phi.ts`):

`measurePhi()` computes two values over a rolling 7-day window:
- `structuralPhi`: structural emitted (excluding `manual_grant` and other
  admin adjustment reasons) ÷ burned. **Primary inflation signal.**
- `phi`: raw emitted (all reasons) ÷ burned. Secondary diagnostic.

`measurePhi` is **pure read** — it never writes to the ledger, never adjusts
any balance, and is safe to call for monitoring. The throttle (automatically
clamping faucet rates when Φ exceeds the alarm threshold) is **explicitly not
built**. The admin economy page at `/admin/economy` displays Φ in
measure-only mode with a "Throttle NOT active" banner.

---

## 3. Core logistics and frontend structure

### 3.1 Order tracking page

Source: `app/delivery/checkout/confirmation/page.tsx`

The customer tracking page is a client component that **polls** the
`getDeliveryOrderStatus` server action. There are no WebSockets, no SSE, and
no push notifications.

Poll interval logic:
- While `PENDING_PAYMENT`: every **2 seconds** for up to 30 seconds (15
  attempts), then falls back to 10-second polling. After the fast-poll window
  expires a "payment is being processed" reassurance banner is shown.
- All other statuses: every **10 seconds**.
- Terminal states (`DELIVERED`, `CANCELLED`): polling stops.

The tracking UI is a 5-step progress stepper that maps backend statuses to
customer-visible stages:

| Customer stage | Backend statuses |
|---|---|
| Order received | `PENDING_PAYMENT`, `PENDING` |
| Finding a courier | `ACCEPTED`, `AWAITING_COURIER`, `COURIER_ASSIGNED` |
| Preparing your food | `COOKING`, `READY` |
| On the way | `PICKED_UP` |
| Delivered | `DELIVERED` |

**No map is shown.** The tracking page displays a status message and stepper
only. There is no courier location indicator, no ETA countdown timer sourced
from live data, and no embedded map.

**Delivery photo proof**: the page renders `dropoffPhotoUrl` if it is present
and non-null on the order. In practice this field is always `null` — there is
no upload endpoint. The field exists in the schema as a placeholder.

---

### 3.2 Driver feed

Source: `app/delivery/driver/DriverDashboard.tsx`,
`app/delivery/driver/actions/driverActions.ts`

The driver feed is a client component using **TanStack Query** with a
**10-second `refetchInterval`**. It is only active when `status === AVAILABLE`
and `activeOrderId === null`:

```typescript
// app/delivery/driver/DriverDashboard.tsx

const { data: availableOrders = [] } = useQuery({
  queryKey: ["available-orders"],
  queryFn: () => getAvailableOrders(),
  refetchInterval: 10_000,
  enabled: isAvailable && !hasActiveOrder,
})
```

Each `AvailableOrder` card shows: restaurant name, pickup address (the
restaurant's address string), dropoff address (the customer's `street + unit`
from the JSON snapshot), item count, and order total. **No map, no route
preview, no distance estimate.**

The online/offline toggle (`StatusToggle`) updates `DeliveryDriver.status`
optimistically in local state and calls `toggleDriverStatus` server action.

---

### 3.3 Kitchen dashboard

Source: `app/delivery/dashboard/OrderFeed.tsx`,
`app/delivery/dashboard/actions/getActiveOrders.ts`

The kitchen dashboard is a client component using TanStack Query with a
**10-second refetch**. The kitchen feed query:

```typescript
// app/delivery/dashboard/actions/getActiveOrders.ts

const KITCHEN_STATUSES = [
  PENDING, ACCEPTED, AWAITING_COURIER, COURIER_ASSIGNED, COOKING, READY
]

const orders = await prisma.deliveryOrder.findMany({
  where: {
    restaurantId,
    status: { in: KITCHEN_STATUSES },
  },
  orderBy: { createdAt: "asc" },  // FIFO
})
```

The kitchen sees orders from `PENDING` through `READY` (the full pre-delivery
window). Kitchen actions (accept → cooking → ready) update the order status
via server actions in `orderActions.ts`. The `fulfillmentType` and `pickupPin`
are shown in the order card so the kitchen knows whether an internal driver or
Uber courier will pick up, and what PIN to verify.

---

### 3.4 Delivery component map

```
app/delivery/
│
├── page.tsx                          Restaurant grid (RestaurantGrid.tsx)
├── layout.tsx                        Delivery layout wrapper
├── CartProvider.tsx                  Cart state — localStorage only (clears on sign-out)
├── FloatingCartBar.tsx               Floating cart summary bar
│
├── [slug]/                           Restaurant menu page
│   ├── page.tsx                      Server page — fetches restaurant + menu
│   ├── MenuBrowser.tsx               Client component — categories, search, items
│   ├── MenuItemCard.tsx              Individual menu item card
│   ├── SecretMenuSection.tsx         CP-gated secret menu (below regular menu)
│   ├── CategoryTabs.tsx              Horizontal scroll tab filter
│   ├── CartDrawer.tsx                Slide-in cart drawer
│   ├── FloatingCartBar.tsx           Sticky bottom bar with cart total
│   ├── RestaurantHero.tsx            Hero image + info header
│   ├── InfoBar.tsx                   Rating / est. time / delivery info
│   └── MenuSearchBar.tsx             Client-side search filter
│
├── checkout/
│   ├── page.tsx                      Server page wrapper
│   ├── CheckoutPage.tsx              Client: address, tip, CP waiver toggle, Stripe Elements
│   └── confirmation/
│       └── page.tsx                  Client: order tracker (polling, no map)
│
├── dashboard/                        Kitchen — RESTAURANT_OWNER only
│   ├── page.tsx                      Server page (auth redirect)
│   ├── layout.tsx                    Layout with auth guard
│   ├── DashboardShell.tsx            Top-level shell + QueryProvider
│   ├── OrderFeed.tsx                 TanStack Query feed (10s poll)
│   ├── OrderCard.tsx                 Per-order card with status actions
│   ├── DashboardContext.tsx          Shared state for optimistic updates
│   └── actions/
│       ├── getActiveOrders.ts        Kitchen feed query
│       ├── orderActions.ts           Accept/cooking/ready/cancel mutations
│       └── refundAndCancelOrder.ts   Cancel + Stripe refund
│
├── driver/                           Driver app — COURIER only
│   ├── page.tsx                      Server page wrapper
│   ├── layout.tsx                    Layout with auth guard
│   ├── DriverDashboard.tsx           Online toggle + available order feed
│   └── actions/
│       ├── driverActions.ts          getAvailableOrders, acceptOrder, toggleStatus
│   └── orders/[id]/
│       ├── page.tsx                  Active trip page
│       ├── ActiveTripView.tsx        Trip flow: PIN entry → pickup → deliver
│       └── actions/
│           └── tripActions.ts        markPickedUp, markDelivered mutations
│
└── actions/
    ├── createOrder.ts                Create DeliveryOrder + Stripe PaymentIntent
    ├── redeemSecretItem.ts           CP burn + zero-fiat order creation
    └── getOrderStatus.ts             Polling target for confirmation page
```

**Admin surfaces (delivery-related):**
- `/admin/notes` — Notes editorial review queue (approve/reject/retract)
- `/admin/corrections` — NoteCorrection acknowledgement and right-of-reply
- `/admin/economy` — Φ readout (ADMIN-gated; measure-only, throttle NOT active)
- `/api/admin/*` — Group-buy admin API routes (deal/supplier/order management)

**Prototype routes (not linked from live navigation, candidates for deletion):**
The following directories predate the delivery vertical and contain early mock
UI. They are not connected to any live nav link:
- `app/restaurants/` — early restaurant listing prototype
- `app/menu/` — early menu view prototype
- `app/driver/` — early driver page prototype
- `app/partner/` — early partner/kitchen/management dashboard prototypes
- `app/checkout/` — early checkout prototype

---

## 4. Dispatch cron sweep

Source: `lib/dispatch/sweep.ts`, `lib/dispatch/escalation-config.ts`,
`app/api/dispatch/cron-sweep/route.ts`

The dispatch cron (`/api/dispatch/cron-sweep`) runs every minute (see §5). The
route handler authenticates via `x-cron-secret`, then calls `runSweep()`.

`runSweep` has three phases:

**Phase 1 — PENDING → AWAITING_COURIER (Uber escalation)** — gated behind
`ENABLE_UBER_ESCALATION` environment variable (default: not set / `false`).

```typescript
// lib/dispatch/escalation-config.ts

export function isUberEscalationEnabled(): boolean {
  return process.env.ENABLE_UBER_ESCALATION === 'true'
}

export function getEscalationTimeoutMs(): number {
  const raw = process.env.UBER_ESCALATION_TIMEOUT_MINUTES
  const minutes = raw !== undefined ? parseInt(raw, 10) : NaN
  return (Number.isFinite(minutes) && minutes >= 1 ? minutes : 3) * 60 * 1000
}
```

When disabled (pilot default), Phase 1 logs a message and skips. Unclaimed
`PENDING/INTERNAL` orders remain on the internal driver feed indefinitely.
When enabled, orders with `dispatchStartedAt` older than the timeout (default
3 minutes) and `driverId === null` are escalated by calling
`shippingAdapter.createJob()`, transitioning them to `AWAITING_COURIER`.

**Phase 2 — AWAITING_COURIER → COURIER_ASSIGNED (stub simulation only)** —
gated behind `USE_SHIPPING_STUB === 'true'`. Advances orders whose
`courierRequestedAt` is older than 20 seconds. In production this transition
would come from a real Uber webhook; Phase 2 does not run in a live
environment.

**Phase 3 — Uber stub auto-completion (stub / dev only)** — also gated behind
`USE_SHIPPING_STUB === 'true'`. Simulates `READY → PICKED_UP` (after 2
minutes) and `PICKED_UP → DELIVERED` (after 3 minutes) for Uber-fulfillment
orders, so the full lifecycle can be exercised in dev without a real courier.

---

## 5. Vercel cron schedule

Source: `vercel.json`

All cron paths are protected by `x-cron-secret` matching the `CRON_SECRET`
env var.

| Path | Schedule (UTC) | Purpose |
|---|---|---|
| `/api/dispatch/cron-sweep` | Every minute (`* * * * *`) | Dispatch state machine sweep (phases 1–3) |
| `/api/cron/close-deals` | Daily at 04:00 UTC | Group-buy deal closure (capture/void, CP vesting) |
| `/api/cron/cleanup-pending-orders` | Daily at 05:00 UTC | Void stale `PENDING_AUTHORIZATION` group-buy orders |
| `/api/cron/send-pickup-reminders` | Daily at 13:00 UTC | Pickup reminder emails for group-buy |
| `/api/cron/ingest-notes` | Daily at 10:00 UTC | RSS + Open Ottawa ingest → Gemini summarize |
| `/api/cron/send-daily-digest` | Daily at 11:00 UTC | Subscriber digest email |

---

## 6. Architectural gaps (what does NOT exist)

This section is the most important part of the document. It exists to prevent
engineers from assuming capabilities that are absent.

### Geospatial

- **No PostGIS extension.** The database uses standard PostgreSQL (Neon). No
  geospatial extension is installed or configured.
- **No latitude/longitude columns** on any model. Restaurant, User, and
  DeliveryOrder have only plain text address strings (or JSON address
  snapshots).
- **No radius or proximity queries.** There is no "restaurants near me", no
  "drivers within X km", and no geofencing. Restaurant listing shows all
  active restaurants in the neighbourhood with no distance filtering.
- **No route optimization or ETA calculation.** Estimated delivery time is a
  static `estimatedMinMin`/`estimatedMinMax` range stored on the Restaurant
  row, not computed from distance.

### Live location / real-time transport

- **No live GPS telemetry.** Drivers do not broadcast their location. The
  `DeliveryDriver` model has no coordinate columns. No location is ever
  written to the database.
- **No WebSockets.** The application has no WebSocket server or long-poll
  endpoint. All real-time effects are achieved via client-side polling (2s or
  10s intervals depending on context).
- **No Server-Sent Events (SSE).** There is no SSE endpoint. Confirmed: the
  tracking page uses `setTimeout`-based polling; the driver feed and kitchen
  dashboard use TanStack Query's `refetchInterval`.
- **No push notifications** (no FCM, no Web Push, no APNS integration).

### Mapping

- **No third-party mapping API integrated.** No Mapbox, Google Maps, Leaflet,
  or equivalent library is installed or used anywhere in the codebase. The
  tracking page and driver feed show text addresses only; no map tile is
  rendered.

### Uber Direct integration

- **The Uber Direct adapter is a stub.** `lib/shipping/uberAdapter.ts` exports
  a `UberStubAdapter` class that simulates Uber behaviour in-process using a
  module-level `Map`. It generates fake job IDs (`uber_sim_{timestamp}_{6digits}`),
  fake pickup PINs, and simulates a 20-second assignment delay. Job state lives
  in server memory and is lost on process restart.
- No real Uber Direct API credentials (`UBER_CLIENT_ID`, `UBER_CLIENT_SECRET`,
  `UBER_CUSTOMER_ID`) are used. None of these env vars are required or
  referenced in the current codebase.
- No real Uber Direct webhook endpoint exists. The `/api/webhooks/uber` route
  does not exist.
- The real Uber Direct adapter swap is documented in comments at the top of
  `lib/shipping/uberAdapter.ts` but is not built.

### Infrastructure

- **No Docker.** Local development runs against a native Windows PostgreSQL
  instance. There is no `docker-compose.yml`, no containerization, and no
  container-based CI.
- **No container orchestration** (Kubernetes, ECS, etc.). The app is fully
  serverless on Vercel.
- **No object storage integration.** `pickupPhotoUrl` and `dropoffPhotoUrl`
  columns exist on `DeliveryOrder` but there is no upload endpoint and no
  storage bucket (S3, Vercel Blob, Cloudinary) configured. The fields are
  always `null` in practice.

### Courier tooling

- **No courier gamification.** There are no acceptance-rate metrics, no
  online-time scoring, no performance tiers, and no courier leaderboards. The
  driver feed is a simple FIFO list with no ranking. Any gamification feature
  of this kind would need to pass the Engagement Pattern Standard before it
  could be built.
- **No driver payout integration.** Stripe Connect is not configured. Drivers
  are not paid through the platform. This is explicitly deferred (see
  `docs/remaining-work-plan.md` item 2.10 and decision D-8).
- **No driver earnings history.** The route `app/api/driver/earnings/today`
  exists but is a stub (the file is in the file list; no payout data exists
  to query).

### Cart persistence

- **Cart is `localStorage`-only.** `app/delivery/CartProvider.tsx` stores cart
  state in browser `localStorage`. The cart is lost on sign-out and on hard
  reload. There is no server-side cart, no session-backed cart, and no cart
  table in the database. This is a known launch blocker (item 1.4 in
  `docs/remaining-work-plan.md`).

### CP economy features not yet wired

The following `CPReason` values are defined in the type union but have no
active code path that triggers them:
- `tier_bridge` — no code calls `earnCP` with this reason.
- `signup_bonus` — no code calls `earnCP` with this reason.
- `donation` — the civic sink is not built (decision D-2 pending).

### Notes features

- **No allegation-about-named-businesses publish path.** Notes with
  `riskScore >= 5` are blocked at the `BLOCKED_NEEDS_FRAMEWORK` status. The
  code gate exists; the path to publishing HIGH-risk notes is not built
  (decision D-5 pending).
- **Feed licensing unresolved** (decision D-1) — CBC Ottawa / Ottawa Citizen
  RSS consumption for commercial summarization has not been reviewed by
  counsel. Notes is not yet live to a real audience.

### Compliance and legal

- **No terms-of-service acceptance tracking.** There is no `tosAcceptedAt`
  column on `User` or any related model.
- **No data-processing consent records.** There is no PIPEDA/GDPR-style
  consent log table.
- Legal placeholder pages exist at `/terms`, `/privacy`, `/refund-policy` but
  have not been reviewed or finalized by counsel.

---

*Document produced from direct file reads on 2026-06-22. Update this document
when a capability in §6 is built out.*
