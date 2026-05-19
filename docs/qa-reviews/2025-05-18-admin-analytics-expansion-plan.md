# Admin Analytics Expansion Plan

**Date:** 2025-05-18  
**Status:** ✅ Approved with amendments — see QA Feedback below before implementation

---

## Problem

Every admin analytics endpoint is either **all-time** or **hardcoded 30 days**. Admins cannot ask "how did we do today?" or "what's the 7-day trend in Retail businesses?" or "compare this week to last week." The data is correct but not explorable.

## Design Decisions

### 1. Time Range — query param, not path segment

All analytics endpoints accept a `range` query parameter with presets. No custom `from`/`to` dates in v1 — presets keep the API surface small and the queries predictable.

```
?range=today | yesterday | 7d | 30d | 90d | 1y | all
```

| Value | Window | Granularity for time-series |
|-------|--------|---------------------------|
| `today` | Current calendar day (00:00–now) | Hourly |
| `yesterday` | Previous calendar day | Hourly |
| `7d` | Last 7 days (rolling) | Daily |
| `30d` | Last 30 days (rolling) — default | Daily |
| `90d` | Last 90 days (rolling) | Weekly |
| `1y` | Last 365 days (rolling) | Monthly |
| `all` | All data | Monthly |

**Default:** `30d` on all endpoints that accept `range`.

### 2. Category Filter — optional, on all endpoints

```
?category=Retail | Services | ...
```

Filters analytics to businesses with that `category` value. When omitted, all categories are included. This turns every endpoint into a drill-down tool.

### 3. Comparison — new dedicated endpoint, not a param

Period-over-period comparison (this week vs last week) is a distinct UI concern. Rather than pollute every endpoint with `?compare=true`, we add a single `GET /admin/analytics/comparison` endpoint that returns pre-computed deltas for key metrics.

### 4. Backward compatibility

All existing endpoints keep their current behavior when called without new params. `range` defaults to `30d` (matching current defaults) and `category` defaults to all. Nothing breaks.

---

## Endpoint Map — Current → Proposed

### Group A: Time-series (accept `range`, return arrays)

| Endpoint | Current | Proposed |
|----------|---------|----------|
| `GET /admin/analytics/revenue-growth` | 30d hardcoded | `?range=` + `?category=` |
| `GET /admin/analytics/signups` | 30d hardcoded | `?range=` + `?category=` |
| `GET /admin/analytics/transactions-volume` | **NEW** | Daily transaction counts, `?range=` + `?category=` + `?type=sale|purchase|expense` |

### Group B: Aggregates (accept `range`, return single objects)

| Endpoint | Current | Proposed |
|----------|---------|----------|
| `GET /admin/analytics/average-volume` | All-time | `?range=` + `?category=` |
| `GET /admin/analytics/platform-debt` | Current snapshot | `?range=` for debt created in period; keep current snapshot as default |
| `GET /admin/analytics/top-businesses` | All-time top 10 | `?range=` + `?category=` + `?limit=N` |

### Group C: Snapshots (accept `category`, time not applicable)

| Endpoint | Current | Proposed |
|----------|---------|----------|
| `GET /admin/analytics/verification-funnel` | All-time | `?category=` (time doesn't make sense for current status) |
| `GET /admin/analytics/feature-adoption` | All-time | `?category=` |
| `GET /admin/analytics/categories` | All-time | No change (this IS the category breakdown) |
| `GET /admin/analytics/active-businesses` | 24h+30d | `?range=` + `?category=` — returns single active count for the period |

### Group D: New endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /admin/analytics/comparison` | Period-over-period deltas for key metrics |
| `GET /admin/analytics/transactions-volume` | Transaction count trends (not just revenue) |
| `GET /admin/analytics/revenue-by-category` | Revenue broken down by business category for a time range |

---

## Detailed Endpoint Specifications

### `GET /admin/analytics/revenue-growth`

**Query params:** `range` (default: `30d`), `category` (optional)

**Response shape (unchanged):**
```json
[
  { "date": "2026-05-17T00:00:00.000Z", "total": 150000 },
  { "date": "2026-05-16T00:00:00.000Z", "total": 120500 }
]
```

**Behavior:**
- `range=today` → hourly buckets for current day
- `range=7d|30d` → daily buckets
- `range=90d` → weekly buckets (Mon–Sun)
- `range=1y|all` → monthly buckets
- `category=Retail` → only transactions from businesses with `category = 'Retail'`

### `GET /admin/analytics/signups`

**Query params:** `range` (default: `30d`), `category` (optional)

**Response shape (unchanged):**
```json
[
  { "date": "2026-05-17T00:00:00.000Z", "count": 12 }
]
```

Same range/bucket logic as revenue-growth.

### `GET /admin/analytics/transactions-volume` *(new)*

**Query params:** `range` (default: `30d`), `category` (optional), `type` (optional: `sale|purchase|expense`)

**Response:**
```json
[
  { "date": "2026-05-17T00:00:00.000Z", "count": 340, "totalAmount": 150000 }
]
```

Similar to revenue-growth but adds transaction counts. The `type` filter lets you see "only sales" or "only expenses."

### `GET /admin/analytics/comparison` *(new)*

**Query params:** `range` (default: `7d`), `category` (optional)

**Response:**
```json
{
  "period": { "start": "2026-05-11T00:00:00.000Z", "end": "2026-05-18T00:00:00.000Z" },
  "previous": { "start": "2026-05-04T00:00:00.000Z", "end": "2026-05-11T00:00:00.000Z" },
  "metrics": {
    "revenue": { "current": 1250000, "previous": 1100000, "delta": 150000, "deltaPercent": 13.6 },
    "transactions": { "current": 3400, "previous": 3100, "delta": 300, "deltaPercent": 9.7 },
    "signups": { "current": 45, "previous": 38, "delta": 7, "deltaPercent": 18.4 },
    "activeBusinesses": { "current": 89, "previous": 82, "delta": 7, "deltaPercent": 8.5 }
  }
}
```

This is the "dashboard summary" endpoint — one call gives the admin a comparison card view.

### `GET /admin/analytics/revenue-by-category` *(new)*

**Query params:** `range` (default: `30d`)

**Response:**
```json
[
  { "category": "Retail", "totalRevenue": 850000, "transactionCount": 2300 },
  { "category": "Services", "totalRevenue": 400000, "transactionCount": 1100 },
  { "category": null, "totalRevenue": 0, "transactionCount": 0 }
]
```

Revenue breakdown by business category — lets the admin see which industries drive the platform.

---

## Implementation Plan

### Phase 1 — Shared utility (1 file, 0 new endpoints)

Create `api/src/admin/analytics.utils.ts` with two helpers:

```typescript
interface TimeWindow {
  start: Date;
  end: Date;
  granularity: 'hour' | 'day' | 'week' | 'month';
  dateTrunc: string;       // PostgreSQL DATE_TRUNC unit
  bucketFormat: string;    // for response date formatting
}

function resolveTimeRange(range: string): TimeWindow;
function buildCategoryFilter(category?: string): { businessId: { in: string[] } } | {};
```

This is pure logic — no DB calls. All existing endpoints import it.

### Phase 2 — Retrofit existing endpoints (add `range` + `category`)

Update these 4 endpoints to accept and use the new params:

| Endpoint | Effort | Notes |
|----------|--------|-------|
| `revenue-growth` | Small | Already uses raw SQL, just swap hardcoded 30 for computed window |
| `signups` | Small | Same pattern |
| `active-businesses` | Small | Replace two hardcoded windows with one computed window |
| `average-volume` | Small | Add WHERE clause on transaction createdAt |
| `top-businesses` | Medium | Add WHERE + LIMIT param |
| `platform-debt` | Small | Add WHERE on debt createdAt for range mode |

### Phase 3 — New endpoints

| Endpoint | Effort | Notes |
|----------|--------|-------|
| `transactions-volume` | Small | Near-copy of revenue-growth with COUNT added |
| `revenue-by-category` | Medium | JOIN businesses + transactions, GROUP BY category |
| `comparison` | Medium | Runs two windows, computes deltas |

### Phase 4 — Category filter on snapshot endpoints

| Endpoint | Effort |
|----------|--------|
| `verification-funnel` | Small — add `WHERE category = ?` |
| `feature-adoption` | Small — add `WHERE category = ?` |

---

## What the Admin Dashboard Looks Like After

```
┌─────────────────────────────────────────────────────────┐
│  [Today] [7d] [30d] [90d] [1y] [All]   Category: [All ▾] │
├─────────────────────────────────────────────────────────┤
│  Revenue: ₦1.25M  ↑13.6% vs last period                 │
│  Transactions: 3,400  ↑9.7%                             │
│  Signups: 45  ↑18.4%                                    │
│  Active: 89 businesses  ↑8.5%                           │
├──────────────────────────┬──────────────────────────────┤
│  Revenue Chart (30d)     │  Revenue by Category          │
│  ▁▂▃▅▂▄▆█▅▃...          │  Retail      ₦850K  ████████  │
│                          │  Services    ₦400K  ████      │
│                          │  Uncategorized ₦0   ░░░░      │
├──────────────────────────┼──────────────────────────────┤
│  Top Businesses (30d)    │  Signups Chart (30d)          │
│  1. Mega Mart   ₦450K   │  ▁▂▁▃▂▁▄▂...                 │
│  2. Best Goods  ₦320K   │                               │
│  3. City Shop   ₦280K   │                               │
└──────────────────────────┴──────────────────────────────┘
```

One `comparison` call for the hero cards, one `revenue-growth` call for the chart, one `revenue-by-category` call for the breakdown, one `top-businesses` call, one `signups` call. **5 API calls, full dashboard.**

---

## What We Skip (v2 candidates)

| Idea | Why skip for now |
|------|-----------------|
| Custom date picker (`?from=&to=`) | Adds query complexity; presets cover 95% of use cases |
| Export CSV/PDF | Separate feature, needs file generation infra |
| Revenue by payment method | `paymentMethod` is nullable, data quality not reliable yet |
| Geographic breakdown (state/city) | `state`/`city` fields are sparse (only 3 test businesses have them) |
| Staff activity analytics | No staff action tracking in DB yet |
| Real-time WebSocket push | Separate infrastructure concern |

---

## Summary

| Phase | What | New endpoints | Touched endpoints | Est. lines |
|-------|------|---------------|-------------------|------------|
| 1 | Shared time-range utility | 0 | 0 | ~50 |
| 2 | Retrofit range + category on existing | 0 | 6 | ~120 |
| 3 | New endpoints | 3 | 0 | ~150 |
| 4 | Category filter on snapshots | 0 | 3 | ~30 |
| **Total** | | **3 new** | **9 updated** | **~350** |

The entire plan is additive — zero breaking changes, all existing endpoints keep their current behavior as defaults.

---

## QA Feedback — 2025-05-18

> **Verdict:** 🟡 Approved with amendments. Resolve the 4 items below before or during Phase 1–2 implementation.

---

### 🟡 Amendment 1 — `active-businesses` response shape must not break

**Issue:** The current endpoint returns `{ dau: number, mau: number }`. The plan proposes changing it to "a single active count for the period" when `range` is applied. This is a breaking change to the response contract, contradicting the "zero breaking changes" commitment.

**Resolution:** Keep the `{ dau, mau }` shape permanently:
- `dau` always means distinct businesses active in the last 24 hours (it's a fixed metric, not range-dependent).
- `mau` becomes the distinct business count over the selected `range` (defaulting to 30d, matching current behavior).

This preserves backward compatibility and gives the admin both the daily pulse and the period-wide activity in one call.

---

### 🟡 Amendment 2 — `platform-debt` range semantics are wrong

**Issue:** The plan says `range` filters by `createdAt` on debts. But this endpoint returns *currently outstanding* debt (status = OPEN). Filtering by creation date would hide old unpaid debt — exactly what an admin needs to see. A debt created 8 months ago that's still OPEN is relevant to today's snapshot, regardless of when it was created.

**Resolution:** On this endpoint, `range` should filter by `updatedAt` (recently modified OPEN debts) — or, simpler and more correct: **drop `range` from this endpoint entirely**. It only accepts `category`. The current snapshot behavior (all OPEN debt) is already correct for the endpoint's purpose. If time-filtered debt is needed later, add a separate `debt-aging` or `debt-timeline` endpoint in v2.

---

### 🟡 Amendment 3 — `comparison` deltaPercent must handle division by zero

**Issue:** When the previous period has zero for a metric (e.g., zero signups on a new platform), `(current - 0) / 0 * 100` produces `Infinity` or a division error. The spec doesn't define the fallback.

**Resolution:** Add this rule to the `comparison` endpoint spec:

| Previous value | Current value | `delta` | `deltaPercent` |
|---------------|---------------|---------|---------------|
| 0 | 0 | `0` | `0` |
| 0 | > 0 | `current` | `null` |
| > 0 | any | `current - previous` | `((current - previous) / previous) * 100` (rounded to 1 decimal) |

Frontend should render `null` as "—" or "New" rather than attempting to display a percentage.

---

### 🔵 Amendment 4 — Field naming consistency

**Issue:** `revenue-growth` uses `total` for the amount field. The new `transactions-volume` endpoint uses `totalAmount` for the same concept. Inconsistent naming across endpoints that return the same kind of data.

**Resolution:** Use `total` in `transactions-volume` to match `revenue-growth`:

```json
[
  { "date": "2026-05-17T00:00:00.000Z", "count": 340, "total": 150000 }
]
```

If `count` and `total` together are ambiguous in the array context, rename `count` to `transactionCount` — but keep the amount field as `total` for consistency with the existing endpoint.

---

### 🔵 Amendment 5 — Cap `top-businesses` `?limit=`

**Issue:** No upper bound on `limit`. An unbounded or maliciously large value (`?limit=99999`) could return a massive result set and strain the DB.

**Resolution:** Apply `Math.min(limit, 100)` server-side. Default stays at 10.

---

### ✅ Confirmed — no action needed

- **Phase ordering (1→2→3→4)** is correct. Build the utility first, retrofit existing endpoints, then add new ones.
- **Preset ranges, not custom dates** — smart v1 constraint. Covers 95% of use cases.
- **`comparison` as a dedicated endpoint** — right call. Keeps individual endpoints simple.
- **Granularity mapping** (hourly→daily→weekly→monthly) is well-chosen and prevents oversized responses.
- **`buildCategoryFilter` utility** — DRY and testable in isolation.
- **v2 skip list** — honest and well-reasoned. "Data quality not reliable yet" is the right bar.
- **5 API calls for the full dashboard** — reasonable call budget. No N+1 needed on the frontend.
- **~350 lines estimated** — realistic for this scope.
