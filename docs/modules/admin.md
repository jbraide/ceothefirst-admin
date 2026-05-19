# Admin Module

The Admin module provides system-wide management, analytics, and monitoring for the NairaFlow platform. It is **restricted** to users with admin roles (`SUPER_ADMIN`, `SUPPORT_ADMIN`, or `ANALYST`), with permissions gated per endpoint.

---

## 🔐 Authentication & Security

### How Admin Auth Works
Super Admins use a **separate login flow** from business owners. An admin JWT carries:

| Claim | Value | Purpose |
|-------|-------|---------|
| `sub` | Admin's `Admin.id` | Identifies the admin user |
| `businessId` | `"SYSTEM"` | Marks this as a cross-tenant (global) context |
| `role` | `"SUPER_ADMIN" \| "SUPPORT_ADMIN" \| "ANALYST"` | Checked by `RolesGuard` on every admin endpoint |

### Obtaining an Admin Token

**`POST /api/v1/auth/admin/login`**

```json
// Request
{
  "email": "admin@nairaflow.com",
  "password": "admin_password"
}

// Response (wrapped by interceptor)
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  },
  "timestamp": "2026-05-17T12:00:00.000Z"
}
```

The admin token is **short-lived (60 minutes)**. Use the refresh token flow (`POST /api/v1/auth/token/refresh`) to rotate — same mechanism as business users.

### Using the Token

Every admin request requires:
```
Authorization: Bearer <admin_access_token>
```

If the token is missing, expired, or belongs to a non-admin user, you will receive:
```json
{
  "success": false,
  "statusCode": 403,
  "message": "Access denied: Requires one of [SUPER_ADMIN, SUPPORT_ADMIN, ANALYST]",
  "timestamp": "2026-05-17T12:00:00.000Z",
  "path": "/api/v1/admin/..."
}
```

### Context Isolation

The admin operates in a **`SYSTEM` context** — there is no `businessId` scoping. All queries span the entire platform. This means:
- Admin endpoints **cannot** be called with a business owner token.
- Business endpoints **cannot** be called with an admin token.
- The frontend should maintain **separate auth state** for admin vs business sessions (e.g., different localStorage keys or Zustand stores).

### Admin Roles

NairaFlow supports three admin roles with escalating permissions:

| Role | Access |
|------|--------|
| `SUPER_ADMIN` | Full access — manage businesses, manage other admins, view analytics, send notifications |
| `SUPPORT_ADMIN` | Read-only access — view businesses, search, view audit logs, view analytics. Cannot modify businesses or manage admins. |
| `ANALYST` | Analytics only — view dashboard stats and all analytics endpoints. Cannot view business details, search, or audit logs. |

**Role enforcement:** Method-level `@Roles()` decorators gate each endpoint. The class-level default is `SUPER_ADMIN` — endpoints that support additional roles explicitly override this with `@Roles('SUPER_ADMIN', 'SUPPORT_ADMIN', 'ANALYST')` or `@Roles('SUPER_ADMIN', 'SUPPORT_ADMIN')`.

**Role in JWT:** The admin's role is embedded in the JWT (`role` claim) and validated on every request by `RolesGuard`.

**Seeded accounts (dev):**

| Email | Password | Role |
|-------|----------|------|
| `admin@nairaflow.com` | `admin123` | `SUPER_ADMIN` |
| `support@nairaflow.com` | `support123` | `SUPPORT_ADMIN` |
| `analyst@nairaflow.com` | `analyst123` | `ANALYST` |

---

## 📦 Global Response & Error Format

### Success Response Wrapper

Every successful response is wrapped by `ResponseTransformInterceptor`:

```json
{
  "success": true,
  "data": <endpoint-specific payload>,
  "timestamp": "2026-05-17T12:00:00.000Z"
}
```

**The `data` field is what varies per endpoint.** All examples in this document show only the `data` contents for brevity — **you must unwrap `data` on the frontend**.

### Error Response Format

All errors are shaped by `HttpExceptionFilter`:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Human-readable error message",
  "timestamp": "2026-05-17T12:00:00.000Z",
  "path": "/api/v1/admin/businesses/cmxxx/status"
}
```

Common admin error codes:

| Status | Trigger |
|--------|---------|
| `401` | Missing or expired token |
| `403` | Token lacks the required admin role for the endpoint |
| `404` | Business/entity not found (e.g., `toggleBusinessStatus` on a deleted business) |
| `400` | Missing/invalid body fields |

---

## 📊 Dashboard & Global Stats

### Get Platform Overview

**`GET /api/v1/admin/stats`**

Aggregated counts for the admin dashboard hero cards.

**Response (`data`):**

```json
{
  "totalBusinesses": 150,
  "totalTransactions": 45230,
  "totalRevenue": 25400500,
  "activeStaff": 87
}
```

| Field | Type | Description |
|-------|------|-------------|
| `totalBusinesses` | `number` | Count of all registered businesses (active + inactive) |
| `totalTransactions` | `number` | Count of all transactions across all businesses |
| `totalRevenue` | `number` (Decimal) | Sum of all transaction `amount` values (in Naira) |
| `activeStaff` | `number` | Count of staff members with `isActive: true` |

**Status:** `200`

---

## 📈 Analytics Endpoints

All analytics endpoints live under `/api/v1/admin/analytics/*` and require the admin Bearer token.

### Time Range & Category Filtering

Most analytics endpoints accept optional **`range`** and **`category`** query parameters to scope the data.

#### `range` — Time Window Preset

| Value | Window | Granularity |
|-------|--------|-------------|
| `today` | Current calendar day | Hourly |
| `yesterday` | Previous calendar day | Hourly |
| `7d` | Last 7 days | Daily |
| `30d` | Last 30 days **(default)** | Daily |
| `90d` | Last 90 days | Weekly |
| `1y` | Last 365 days | Monthly |
| `all` | All data | Monthly |

- Invalid/unrecognized `range` values **silently fall back** to `30d`.
- The **default** is `30d` on every endpoint that accepts `range`.

#### `category` — Business Category Filter

- Optional string filter, e.g., `?category=Retail`, `?category=Services`.
- When provided, results are scoped to businesses whose `category` field matches exactly.
- When omitted, all categories are included.
- Category names are case-sensitive and must match the stored value.

#### `limit` — Result Cap (Top Businesses only)

- The `GET /admin/analytics/top-businesses` endpoint accepts `?limit=N` (default `10`, max `100`).

#### `type` — Transaction Type Filter (Transactions Volume only)

- The `GET /admin/analytics/transactions-volume` endpoint accepts an optional `?type=` param with one of: `sale`, `purchase`, `expense`.
- When omitted, all transaction types are included.

### Revenue Growth

**`GET /api/v1/admin/analytics/revenue-growth?range=30d&category=Retail`**

Revenue totals over time, grouped by the range's granularity (most recent first).

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `range` | `string` | No | `30d` | One of `today`, `yesterday`, `7d`, `30d`, `90d`, `1y`, `all` |
| `category` | `string` | No | — | Filter by business category (e.g., `Retail`, `Services`) |

**Response (`data`):**
```json
[
  { "date": "2026-05-17T00:00:00.000Z", "total": 150000 },
  { "date": "2026-05-16T00:00:00.000Z", "total": 120500 }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `date` | `string` (ISO 8601) | Truncated to the range's granularity (hour for `today`/`yesterday`, day for `7d`/`30d`, week for `90d`, month for `1y`/`all`) |
| `total` | `number` (Decimal) | Sum of all transaction amounts for that period |

**Frontend notes:**
- The number of entries varies by range (e.g., 24 for `today`, 7 for `7d`, 12 for `1y`).
- Periods with zero revenue **will not appear** — gap-fill on the frontend for chart continuity.
- Sort is descending by date.
- When `category` is provided, only transactions from businesses in that category are counted.

**Status:** `200`

---

### Transactions Volume

**`GET /api/v1/admin/analytics/transactions-volume?range=30d&category=Retail&type=sale`**

Transaction count and total volume trends over time, grouped by the range's granularity.

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `range` | `string` | No | `30d` | One of `today`, `yesterday`, `7d`, `30d`, `90d`, `1y`, `all` |
| `category` | `string` | No | — | Filter by business category (e.g., `Retail`, `Services`) |
| `type` | `string` | No | — | Filter by transaction type: `sale`, `purchase`, or `expense` |

**Response (`data`):**
```json
[
  { "date": "2026-05-17T00:00:00.000Z", "count": 42, "total": 150000 },
  { "date": "2026-05-16T00:00:00.000Z", "count": 38, "total": 120500 }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `date` | `string` (ISO 8601) | Truncated to the range's granularity |
| `count` | `number` (int) | Number of transactions in this period |
| `total` | `number` (Decimal) | Sum of all transaction amounts for this period |

**Frontend notes:**
- Use `count` for a transaction frequency line/bar chart and `total` for a volume overlay.
- When `type` is omitted, all transaction types (sale, purchase, expense) are aggregated together.
- Gap-fill periods with zero activity on the frontend (same pattern as `revenue-growth`).

**Status:** `200`

---

### Daily Signups

**`GET /api/v1/admin/analytics/signups?range=30d&category=Retail`**

Business registration counts over time, grouped by the range's granularity.

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `range` | `string` | No | `30d` | One of `today`, `yesterday`, `7d`, `30d`, `90d`, `1y`, `all` |
| `category` | `string` | No | — | Filter by business category (e.g., `Retail`, `Services`) |

**Response (`data`):**
```json
[
  { "date": "2026-05-17T00:00:00.000Z", "count": 12 },
  { "date": "2026-05-16T00:00:00.000Z", "count": 8 }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `date` | `string` (ISO 8601) | Truncated to the range's granularity (hour for `today`/`yesterday`, day for `7d`/`30d`, week for `90d`, month for `1y`/`all`) |
| `count` | `number` (int) | New businesses created in that period |

**Frontend notes:**
- Gap-fill periods with zero signups on the frontend for chart continuity.
- When `category` is provided, only signups from businesses in that category are counted.

**Status:** `200`

---

### Verification Funnel

**`GET /api/v1/admin/analytics/verification-funnel`**

Breakdown of businesses by their KYC verification status.

**Response (`data`):**
```json
[
  { "verificationStatus": "VERIFIED", "count": 120 },
  { "verificationStatus": "PENDING", "count": 15 },
  { "verificationStatus": "REJECTED", "count": 3 }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `verificationStatus` | `"VERIFIED" \| "PENDING" \| "REJECTED"` | The verification state |
| `count` | `number` (int) | Number of businesses in this state |

**Frontend notes:**
- A status with zero businesses **will not appear** in the array — default to `0` for missing statuses.
- Use this for a funnel chart: PENDING → VERIFIED / REJECTED.

**Status:** `200`

---

### Active Businesses (DAU/MAU Proxy)

**`GET /api/v1/admin/analytics/active-businesses?range=30d&category=Retail`**

Daily and Monthly "Active Users" proxied by distinct businesses with transactions in the relevant window. DAU is always the last 24 hours; MAU varies by the `range` parameter.

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `range` | `string` | No | `30d` | One of `today`, `yesterday`, `7d`, `30d`, `90d`, `1y`, `all` — affects the MAU window |
| `category` | `string` | No | — | Filter by business category (e.g., `Retail`, `Services`) |

**Response (`data`):**
```json
{
  "dau": 45,
  "mau": 130
}
```

| Field | Type | Description |
|-------|------|-------------|
| `dau` | `number` (int) | Distinct businesses with ≥1 transaction in the last **24 hours** (always fixed) |
| `mau` | `number` (int) | Distinct businesses with ≥1 transaction in the window matching the `range` param (e.g., `7d` → last 7 days, `1y` → last 365 days) |

**Frontend notes:**
- This is a **transaction-based proxy**, not login-based. A business that logged in but made no transactions won't count.
- DAU will always be ≤ MAU.
- The "MAU" label is a misnomer when using ranges other than `30d` — treat it as "active businesses in the selected period".
- When `category` is provided, only businesses in that category are counted.

**Status:** `200`

---

### Feature Adoption

**`GET /api/v1/admin/analytics/feature-adoption`**

Percentage of businesses actively using each major feature.

**Response (`data`):**
```json
{
  "totalBusinesses": 150,
  "usingInvoices": 75,
  "usingStaff": 30,
  "usingDebts": 120,
  "percentUsingInvoices": 50.0,
  "percentUsingStaff": 20.0,
  "percentUsingDebts": 80.0
}
```

| Field | Type | Description |
|-------|------|-------------|
| `totalBusinesses` | `number` (int) | Total businesses on the platform |
| `usingInvoices` | `number` (int) | Businesses with ≥1 invoice record |
| `usingStaff` | `number` (int) | Businesses with ≥1 staff member |
| `usingDebts` | `number` (int) | Businesses with ≥1 debt record |
| `percentUsingInvoices` | `number` (float) | `(usingInvoices / totalBusinesses) * 100` |
| `percentUsingStaff` | `number` (float) | `(usingStaff / totalBusinesses) * 100` |
| `percentUsingDebts` | `number` (float) | `(usingDebts / totalBusinesses) * 100` |

**Frontend notes:**
- Percentages are server-rounded to 1 decimal place (e.g., `66.7`).
- When `totalBusinesses` is 0, all fields return `0` with the same shape.

**Status:** `200`

---

### Platform Debt

**`GET /api/v1/admin/analytics/platform-debt?category=Retail`**

Total outstanding (unpaid) debt across all businesses, split by type. Returns current OPEN debts only — no time range parameter.

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `category` | `string` | No | — | Filter by business category (e.g., `Retail`, `Services`) |

**Response (`data`):**
```json
[
  { "type": "receivable", "totalOutstanding": 540000 },
  { "type": "payable", "totalOutstanding": 120000 }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"receivable" \| "payable"` | Debt direction |
| `totalOutstanding` | `number` (Decimal) | `SUM(totalAmount) - SUM(paidAmount)` for OPEN debts of this type |

**Frontend notes:**
- Only debts with `status: "OPEN"` are counted.
- If a type has no open debts, it **will not appear** in the array.
- This endpoint does **not** accept a `range` param — it always returns current outstanding debts.

**Status:** `200`

---

### Average Volume (ARPU Proxy)

**`GET /api/v1/admin/analytics/average-volume?range=30d&category=Retail`**

Average Revenue Per (Active) Business — total platform transaction volume divided by active business count, scoped to the selected time range.

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `range` | `string` | No | `30d` | One of `today`, `yesterday`, `7d`, `30d`, `90d`, `1y`, `all` |
| `category` | `string` | No | — | Filter by business category (e.g., `Retail`, `Services`) |

**Response (`data`):**
```json
{
  "totalBusinesses": 150,
  "totalVolume": 25400500,
  "arpu": 169336.66
}
```

| Field | Type | Description |
|-------|------|-------------|
| `totalBusinesses` | `number` (int) | Active businesses only (`isActive: true`) in the selected range |
| `totalVolume` | `number` (Decimal) | Sum of all transaction amounts within the selected range |
| `arpu` | `number` (float) | `totalVolume / totalBusinesses` |

**Frontend notes:**
- If `totalBusinesses` is 0, `arpu` returns `0`.
- The denominator is **active businesses**, not total businesses.
- Volume and active business count are both scoped to the selected `range`.

**Status:** `200`

---

### Top Businesses

**`GET /api/v1/admin/analytics/top-businesses?range=30d&category=Retail&limit=10`**

Top businesses ranked by total transaction volume within the selected time range.

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `range` | `string` | No | `30d` | One of `today`, `yesterday`, `7d`, `30d`, `90d`, `1y`, `all` |
| `category` | `string` | No | — | Filter by business category (e.g., `Retail`, `Services`) |
| `limit` | `number` (int) | No | `10` | Number of results to return (max `100`) |

**Response (`data`):**
```json
[
  {
    "businessId": "cmny6abc0000...",
    "totalVolume": 4500000,
    "businessName": "Mega Supermarket"
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `businessId` | `string` (CUID) | The business's unique ID |
| `totalVolume` | `number` | Total transaction volume for this business within the selected range |
| `businessName` | `string` | Resolved business name (falls back to `"Unknown"` if name resolution fails) |

**Frontend notes:**
- Results are sorted descending by `totalVolume`.
- Use `limit` to control how many results appear in a leaderboard widget.
- When `category` is provided, only businesses in that category are ranked.

**Status:** `200`

---

### Industry Categories

**`GET /api/v1/admin/analytics/categories`**

Distribution of businesses by their declared category.

**Response (`data`):**
```json
[
  { "category": "Retail", "count": 80 },
  { "category": "Services", "count": 45 },
  { "category": null, "count": 10 }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `category` | `string \| null` | The business category (nullable — businesses can skip this field) |
| `count` | `number` (int) | Count of businesses in this category |

**Frontend notes:**
- `null` means the business has not set a category. Handle this bucket explicitly (e.g., label "Uncategorized").
- Use this for a pie chart or horizontal bar chart.

**Status:** `200`

---

### Revenue by Category

**`GET /api/v1/admin/analytics/revenue-by-category?range=30d`**

Revenue broken down by business category for the selected time range.

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `range` | `string` | No | `30d` | One of `today`, `yesterday`, `7d`, `30d`, `90d`, `1y`, `all` |

**Response (`data`):**
```json
[
  { "category": "Retail", "totalRevenue": 1250000, "transactionCount": 340 },
  { "category": "Services", "totalRevenue": 820000, "transactionCount": 210 },
  { "category": null, "totalRevenue": 150000, "transactionCount": 45 }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `category` | `string \| null` | The business category (`null` for uncategorized businesses) |
| `totalRevenue` | `number` (Decimal) | Sum of all transaction amounts for this category within the range |
| `transactionCount` | `number` (int) | Number of transactions from businesses in this category within the range |

**Frontend notes:**
- Categories with zero revenue/transactions in the selected range **will not appear**.
- Handle `null` categories explicitly (e.g., label "Uncategorized").
- Use this for a horizontal bar chart or donut chart comparing category performance.
- The `transactionCount` field is useful for distinguishing high-value/low-volume from low-value/high-volume categories.

**Status:** `200`

---

### Comparison (Period-over-Period)

**`GET /api/v1/admin/analytics/comparison?range=7d&category=Retail`**

Period-over-period metric comparison for dashboard hero cards. Compares the selected period against the immediately preceding period of equal length.

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `range` | `string` | No | `7d` | One of `today`, `yesterday`, `7d`, `30d`, `90d`, `1y`, `all` — defines the current period length |
| `category` | `string` | No | — | Filter by business category (e.g., `Retail`, `Services`) |

**Response (`data`):**
```json
{
  "period": { "start": "2026-05-11T00:00:00.000Z", "end": "2026-05-17T23:59:59.999Z" },
  "previous": { "start": "2026-05-04T00:00:00.000Z", "end": "2026-05-10T23:59:59.999Z" },
  "metrics": {
    "revenue": {
      "current": 980000,
      "previous": 850000,
      "delta": 130000,
      "deltaPercent": 15.29
    },
    "transactions": {
      "current": 1420,
      "previous": 1380,
      "delta": 40,
      "deltaPercent": 2.90
    },
    "signups": {
      "current": 35,
      "previous": 42,
      "delta": -7,
      "deltaPercent": -16.67
    },
    "activeBusinesses": {
      "current": 95,
      "previous": 90,
      "delta": 5,
      "deltaPercent": 5.56
    }
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `period` | `object` | Date range for the current period |
| `period.start` | `string` (ISO 8601) | Start of the current period |
| `period.end` | `string` (ISO 8601) | End of the current period |
| `previous` | `object` | Date range for the previous (comparison) period |
| `previous.start` | `string` (ISO 8601) | Start of the previous period |
| `previous.end` | `string` (ISO 8601) | End of the previous period |
| `metrics` | `object` | Per-metric comparison data |
| `metrics.revenue` | `object` | Revenue metric comparison |
| `metrics.transactions` | `object` | Transaction count metric comparison |
| `metrics.signups` | `object` | New signups metric comparison |
| `metrics.activeBusinesses` | `object` | Active businesses metric comparison |
| `*.current` | `number` | Value for the current period |
| `*.previous` | `number` | Value for the previous period |
| `*.delta` | `number` | Absolute difference: `current - previous` |
| `*.deltaPercent` | `number \| null` | Percentage change: `(delta / previous) * 100`. **`null`** when `previous` is `0` (division by zero avoided) |

**Frontend notes:**
- This endpoint is designed to power dashboard hero cards with trend indicators (↑ green, ↓ red).
- **Critical:** `deltaPercent` can be `null`. Always guard with a null check before rendering percentage badges:
  ```typescript
  const trend = metric.deltaPercent !== null
    ? `${metric.deltaPercent > 0 ? '+' : ''}${metric.deltaPercent.toFixed(1)}%`
    : '—';
  ```
- When `deltaPercent` is `null`, display a neutral indicator (e.g., dash, "N/A", or hide the trend badge) — do not show "0%" or "+∞".
- The `previous` period is always the same length as `period` and immediately precedes it.
- Use the `period`/`previous` date ranges to label comparison periods in the UI (e.g., "May 11–17 vs May 4–10").

**Status:** `200`

---

## 🏢 Business Management

### List All Businesses

**`GET /api/v1/admin/businesses`**

Paginated list of all registered businesses with search support.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | `number` (int) | `1` | Page number (1-based) |
| `limit` | `number` (int) | `20` | Items per page |
| `search` | `string` | — | Searches `name` (case-insensitive contains) and `ownerPhone` (contains) |

**Response (`data`):**
```json
{
  "results": [
    {
      "id": "cmny6abc0000...",
      "name": "NairaFlow Demo Store",
      "ownerPhone": "08000000000",
      "email": "demo@nairaflow.com",
      "category": "Retail",
      "businessType": "both",
      "state": "Lagos",
      "city": "Ikeja",
      "isActive": true,
      "verificationStatus": "VERIFIED",
      "createdAt": "2026-01-15T00:00:00.000Z",
      "_count": {
        "transactions": 120,
        "products": 45,
        "staff": 2
      }
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

**Business Result Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` (CUID) | Unique business ID |
| `name` | `string` | Business display name |
| `ownerPhone` | `string` | Owner's phone (unique, used for login) |
| `email` | `string \| null` | Optional business email |
| `category` | `string \| null` | Industry category |
| `businessType` | `string \| null` | `"product"`, `"service"`, or `"both"` |
| `state` | `string \| null` | Nigerian state |
| `city` | `string \| null` | City |
| `isActive` | `boolean` | `false` = suspended |
| `verificationStatus` | `"PENDING" \| "VERIFIED" \| "REJECTED"` | KYC status |
| `createdAt` | `string` (ISO 8601) | Registration date |
| `_count.transactions` | `number` (int) | Total transaction count |
| `_count.products` | `number` (int) | Total product count |
| `_count.staff` | `number` (int) | Total staff count |

**Meta Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `total` | `number` (int) | Total matching records |
| `page` | `number` (int) | Current page |
| `limit` | `number` (int) | Items per page |
| `totalPages` | `number` (int) | `Math.ceil(total / limit)` |

**Status:** `200`

---

### Get Business Details

**`GET /api/v1/admin/businesses/:id`**

Deep-dive view of a single business including recent transaction history.

**Response (`data`):**
```json
{
  "id": "cmny6abc0000...",
  "name": "NairaFlow Demo Store",
  "ownerPhone": "08000000000",
  "email": "demo@nairaflow.com",
  "category": "Retail",
  "businessType": "both",
  "state": "Lagos",
  "city": "Ikeja",
  "logoUrl": "https://storage.example.com/logo.png",
  "bankName": "Access Bank",
  "accountNumber": "1234567890",
  "accountName": "Demo Store Ltd",
  "isActive": true,
  "verificationStatus": "VERIFIED",
  "verificationDocs": ["https://storage.example.com/id_card.jpg"],
  "createdAt": "2026-01-15T00:00:00.000Z",
  "_count": {
    "transactions": 120,
    "products": 45,
    "staff": 2,
    "contacts": 15
  },
  "recentTransactions": [
    {
      "id": "cmny6xyz...",
      "type": "sale",
      "amount": "45000",
      "amountPaid": "45000",
      "paymentMethod": "transfer",
      "description": "Bulk purchase",
      "createdAt": "2026-05-17T10:30:00.000Z",
      "lines": [
        {
          "productName": "Cement",
          "qty": 5,
          "unitPrice": "9000",
          "unitCost": "6300"
        }
      ]
    }
  ]
}
```

**Additional fields (vs list endpoint):**

| Field | Type | Description |
|-------|------|-------------|
| `logoUrl` | `string \| null` | Business logo image URL |
| `bankName` | `string \| null` | Bank name for settlements |
| `accountNumber` | `string \| null` | Bank account number |
| `accountName` | `string \| null` | Account holder name |
| `verificationDocs` | `string[]` | Array of document URLs submitted for KYC |
| `_count.contacts` | `number` (int) | Total contacts (customers + suppliers) |
| `recentTransactions` | `Transaction[]` | Last 10 transactions (most recent first) |

**Status:** `200`
**Error:** `404` if business ID not found

---

### Update Business Status (Suspend / Activate)

**`PATCH /api/v1/admin/businesses/:id/status`**

Toggle a business's active state. Suspended businesses cannot perform operations (enforced elsewhere).

**Request Body:**
```json
{
  "isActive": false
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `isActive` | `boolean` | **Yes** | `false` = suspend, `true` = reactivate |

**Response (`data`):**
```json
{
  "id": "cmny6abc0000...",
  "name": "NairaFlow Demo Store",
  "isActive": false
}
```
Returns the full updated `Business` object.

**Side effect:** An `AdminAuditLog` entry is created with:
- `action`: `"BUSINESS_STATUS_TOGGLE"`
- `targetId`: The business ID
- `details`: `"Set isActive to false"`

**Status:** `200`
**Error:** `404` if business not found

---

## 👥 Admin Account Management

These endpoints are restricted to `SUPER_ADMIN` only. They allow creating and managing other admin accounts.

### Create Admin

**`POST /api/v1/admin/admins`**

**Request Body:**
```json
{
  "email": "newadmin@nairaflow.com",
  "password": "SecurePass123",
  "name": "New Admin",
  "role": "SUPPORT_ADMIN"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | `string` (email) | **Yes** | Unique email for login |
| `password` | `string` | **Yes** | Min 8 characters |
| `name` | `string` | **Yes** | Display name |
| `role` | `"SUPER_ADMIN" \| "SUPPORT_ADMIN" \| "ANALYST"` | **Yes** | Permission level |

**Response (`data`):**
```json
{
  "id": "cmxxx...",
  "email": "newadmin@nairaflow.com",
  "name": "New Admin",
  "role": "SUPPORT_ADMIN",
  "createdAt": "2026-05-19T10:00:00.000Z"
}
```

**Status:** `201`
**Error:** `409` if email already exists, `403` if caller is not SUPER_ADMIN

---

### List Admins

**`GET /api/v1/admin/admins`**

Paginated list of all admin accounts.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | `number` (int) | `1` | Page number |
| `limit` | `number` (int) | `20` | Items per page |

**Response (`data`):**
```json
{
  "results": [
    {
      "id": "cmxxx...",
      "email": "admin@nairaflow.com",
      "name": "System Admin",
      "role": "SUPER_ADMIN",
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 3,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

**Status:** `200`

---

### Get Admin Details

**`GET /api/v1/admin/admins/:id`**

**Response (`data`):**
```json
{
  "id": "cmxxx...",
  "email": "admin@nairaflow.com",
  "name": "System Admin",
  "role": "SUPER_ADMIN",
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

**Status:** `200`
**Error:** `404` if admin not found

---

### Update Admin

**`PATCH /api/v1/admin/admins/:id`**

Update an admin's name, role, or active status. All fields are optional — only send what you want to change.

**Request Body:**
```json
{
  "name": "Jane Support Updated",
  "role": "ANALYST"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | No | New display name |
| `role` | `"SUPER_ADMIN" \| "SUPPORT_ADMIN" \| "ANALYST"` | No | New role |
| `isActive` | `boolean` | No | Set `false` to deactivate |

**Response (`data`):** Returns the updated admin object (same shape as Get Admin Details).

**Side effect:** Creates an `ADMIN_UPDATED` audit log entry.

**Status:** `200`
**Error:** `404` if admin not found

---

### Deactivate Admin

**`PATCH /api/v1/admin/admins/:id/deactivate`**

Shortcut to deactivate an admin account (sets `isActive: false`). Deactivated admins cannot log in.

**No request body.**

**Response (`data`):**
```json
{
  "id": "cmxxx...",
  "email": "support@nairaflow.com",
  "name": "Jane Support",
  "role": "SUPPORT_ADMIN"
}
```

**Side effect:** Creates an `ADMIN_DEACTIVATED` audit log entry.

**Status:** `200`
**Error:** `404` if admin not found

---

## ✅ Verification & KYC

### List Pending Verifications

**`GET /api/v1/admin/verifications`**

Returns all businesses awaiting KYC review.

**Response (`data`):**
```json
[
  {
    "id": "cmny6abc0000...",
    "name": "NairaFlow Demo Store",
    "ownerPhone": "08000000000",
    "verificationDocs": ["https://storage.example.com/id_card.jpg"],
    "createdAt": "2026-05-17T00:00:00.000Z"
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` (CUID) | Business ID |
| `name` | `string` | Business display name |
| `ownerPhone` | `string` | Owner's phone number |
| `verificationDocs` | `string[]` | URLs of submitted KYC documents |
| `createdAt` | `string` (ISO 8601) | Business registration date |

**Frontend notes:**
- Only `PENDING` businesses appear. Once verified/rejected, they drop off this list.
- Display `verificationDocs` as clickable image links.
- Consider adding a "days waiting" badge: `daysSince(createdAt)`.

**Status:** `200`

---

### Verify (Approve/Reject) Business

**`PATCH /api/v1/admin/businesses/:id/verify`**

Approve or reject a business's KYC submission.

**Request Body:**
```json
{
  "status": "VERIFIED",
  "notes": "ID document matches business registration details."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | `"VERIFIED" \| "REJECTED"` | **Yes** | The verification decision |
| `notes` | `string` | No | Reviewer notes (accepted but **not currently persisted** — see warning below) |

> ⚠️ **Implementation gap:** The `notes` field is accepted by the controller but is **not stored** in the database. There is no `verificationNotes` column on the `Business` model or any separate audit table for verification decisions. The frontend should still send it (the API won't reject it), but be aware that notes will be lost. This needs a backend fix to either add a `verificationNotes` field to the `Business` model or create a `VerificationAudit` record.

**Response (`data`):**
```json
{
  "id": "cmny6abc0000...",
  "verificationStatus": "VERIFIED",
  "...": "full Business object"
}
```
Returns the updated `Business` object.

**Status:** `200`
**Error:** `404` if business not found

---

## 🔍 Global Search

**`GET /api/v1/admin/search/global?q=<query>`**

Cross-tenant search across multiple entity types. Useful for support lookups (e.g., "find everything related to phone 080xxxx").

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `q` | `string` | **Yes** | Search term — matched against IDs, phone numbers, invoice numbers, and business names |

**Matching logic:**

| Entity | Searched fields | Match type |
|--------|----------------|------------|
| Transactions | `id` | Exact match |
| Invoices | `id`, `invoiceNumber` | Exact match |
| Businesses | `id`, `ownerPhone`, `name` | Exact (`id`), contains (`ownerPhone`), case-insensitive contains (`name`) |

**Response (`data`):**
```json
{
  "transactions": [
    {
      "id": "cmny6abc0000...",
      "businessId": "cmny6xyz...",
      "type": "sale",
      "amount": "45000",
      "amountPaid": "45000",
      "paymentMethod": "cash",
      "contactName": "John Doe",
      "createdAt": "2026-05-17T10:30:00.000Z"
    }
  ],
  "invoices": [
    {
      "id": "cmny6def0000...",
      "invoiceNumber": "INV-001",
      "businessId": "cmny6xyz...",
      "customerName": "Jane Doe",
      "totalAmount": "32000",
      "status": "PENDING",
      "createdAt": "2026-05-17T09:00:00.000Z"
    }
  ],
  "businesses": [
    {
      "id": "cmny6xyz0000...",
      "name": "Mega Supermarket",
      "ownerPhone": "08012345678",
      "email": "mega@example.com",
      "isActive": true,
      "verificationStatus": "VERIFIED",
      "createdAt": "2026-01-15T00:00:00.000Z"
    }
  ]
}
```

**Frontend notes:**
- Each section is capped at **5 results**.
- Results are not paginated — this is a quick lookup tool, not a full search.
- If a section has no matches, it returns an empty array `[]`.
- The response is always present — `{ transactions: [], invoices: [], businesses: [] }` is a valid empty result.

**Status:** `200`
**Error:** `400` if `q` is missing or empty

---

## 📝 Audit Logs

**`GET /api/v1/admin/audit-logs`**

Paginated history of all Super Admin actions. Every status toggle, verification decision, and other admin action is logged here.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | `number` (int) | `1` | Page number (1-based) |
| `limit` | `number` (int) | `50` | Items per page |

**Response (`data`):**
```json
{
  "results": [
    {
      "id": "cmo2abc0000...",
      "adminId": "cmo1xyz0000...",
      "action": "BUSINESS_STATUS_TOGGLE",
      "targetId": "cmny6abc0000...",
      "details": "Set isActive to false",
      "createdAt": "2026-05-17T12:00:00.000Z",
      "admin": {
        "name": "System Admin",
        "email": "admin@nairaflow.com"
      }
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` (CUID) | Audit log entry ID |
| `adminId` | `string` (CUID) | The SuperAdmin who performed the action |
| `action` | `string` | Action type: `BUSINESS_STATUS_TOGGLE`, `BUSINESS_VERIFICATION` |
| `targetId` | `string \| null` | ID of the affected entity (business ID, transaction ID, etc.) |
| `details` | `string \| null` | Human-readable description of the action |
| `createdAt` | `string` (ISO 8601) | When the action was performed |
| `admin.name` | `string` | Admin's display name |
| `admin.email` | `string` | Admin's email |

**Known action types:**

| Action | Logged by | `targetId` |
|--------|-----------|-----------|
| `BUSINESS_STATUS_TOGGLE` | `toggleBusinessStatus` | Business ID |
| `BUSINESS_VERIFICATION` | `verifyBusiness` | Business ID |

> **Note:** The `globalSearch` endpoint does **not** currently call `logAction()`. Only status toggles are logged. If you need search auditing, this must be added.

**Status:** `200`

---

## 📣 Notifications

### Broadcast to All Businesses

**`POST /api/v1/admin/notifications/broadcast`**

Send a push notification to all business owners who have an FCM token registered.

**Request Body:**
```json
{
  "title": "Platform Update",
  "body": "We have added new invoice templates!"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | `string` | **Yes** | Notification title |
| `body` | `string` | **Yes** | Notification body text |

**Response (`data`):**
```json
{
  "success": true,
  "count": 150
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | `boolean` | Always `true` on successful request |
| `count` | `number` (int) | Number of FCM tokens found (NOT the number of successful deliveries) |

> ⚠️ **Implementation gap:** The current implementation only **logs** the broadcast intent (`console.log(...)`) and returns the token count. It does **not** actually send FCM messages. Firebase Cloud Messaging integration needs to be wired in for this to work. The response shape is designed for when it's implemented — the frontend can build against this contract now.

**Status:** `200`

---

### Targeted Notification

**`POST /api/v1/admin/notifications/targeted`**

Send a push notification to a specific business.

**Request Body:**
```json
{
  "businessId": "cmny6abc0000...",
  "title": "Billing Issue",
  "body": "Please update your payment card on file."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `businessId` | `string` (CUID) | **Yes** | Target business ID |
| `title` | `string` | **Yes** | Notification title |
| `body` | `string` | **Yes** | Notification body text |

**Response (`data`):**
```json
{
  "success": true
}
```

**Status:** `200`
**Error:** `404` if the business has no FCM token registered

> ⚠️ Same FCM gap as broadcast — currently logs, does not actually send.

---

## 🗂️ Complete Endpoint Reference

| Method | Endpoint | Purpose | Query Params | Roles | Status |
|--------|----------|---------|-------------|-------|--------|
| `GET` | `/admin/stats` | Platform overview counts | — | All | `200` |
| `GET` | `/admin/analytics/revenue-growth` | Revenue trend (time-ranged) | `range`, `category` | All | `200` |
| `GET` | `/admin/analytics/transactions-volume` | Transaction count & volume trend | `range`, `category`, `type` | All | `200` |
| `GET` | `/admin/analytics/signups` | Registration trend (time-ranged) | `range`, `category` | All | `200` |
| `GET` | `/admin/analytics/verification-funnel` | KYC status breakdown | — | All | `200` |
| `GET` | `/admin/analytics/active-businesses` | DAU/MAU proxy (time-ranged) | `range`, `category` | All | `200` |
| `GET` | `/admin/analytics/feature-adoption` | Feature usage percentages | — | All | `200` |
| `GET` | `/admin/analytics/platform-debt` | Outstanding debt totals | `category` | All | `200` |
| `GET` | `/admin/analytics/average-volume` | ARPU proxy (time-ranged) | `range`, `category` | All | `200` |
| `GET` | `/admin/analytics/top-businesses` | Top N by volume (time-ranged) | `range`, `category`, `limit` | All | `200` |
| `GET` | `/admin/analytics/categories` | Industry distribution | — | All | `200` |
| `GET` | `/admin/analytics/revenue-by-category` | Revenue breakdown by category | `range` | All | `200` |
| `GET` | `/admin/analytics/comparison` | Period-over-period comparison | `range`, `category` | All | `200` |
| `GET` | `/admin/businesses` | List/search all businesses | `q`, `page`, `limit` | Super, Support | `200` |
| `GET` | `/admin/businesses/:id` | Single business details | — | Super, Support | `200` / `404` |
| `PATCH` | `/admin/businesses/:id/status` | Suspend/activate business | — | Super | `200` / `404` |
| `GET` | `/admin/verifications` | Pending KYC list | — | Super, Support | `200` |
| `PATCH` | `/admin/businesses/:id/verify` | Approve/reject KYC | — | Super | `200` / `404` |
| `GET` | `/admin/search/global?q=` | Cross-entity search | `q` | Super, Support | `200` / `400` |
| `GET` | `/admin/audit-logs` | Admin action history | `page`, `limit` | Super, Support | `200` |
| `POST` | `/admin/notifications/broadcast` | Notify all businesses | — | Super | `200` |
| `POST` | `/admin/notifications/targeted` | Notify one business | — | Super | `200` / `404` |
| `POST` | `/admin/admins` | Create admin account | — | Super | `201` / `409` / `403` |
| `GET` | `/admin/admins` | List admin accounts | `page`, `limit` | Super | `200` |
| `GET` | `/admin/admins/:id` | Get admin details | — | Super | `200` / `404` |
| `PATCH` | `/admin/admins/:id` | Update admin account | — | Super | `200` / `404` |
| `PATCH` | `/admin/admins/:id/deactivate` | Deactivate admin | — | Super | `200` / `404` |

**Roles legend:** `All` = SUPER_ADMIN, SUPPORT_ADMIN, ANALYST | `Super` = SUPER_ADMIN only | `Super, Support` = SUPER_ADMIN, SUPPORT_ADMIN

**Base URL:** `http://localhost:3000/api/v1` (dev) — all paths above are relative to this.

---

## 🚦 Frontend Implementation Notes

### Auth State Management
- Store the admin token separately from any business token (e.g., `admin_token` vs `business_token` in localStorage/Zustand).
- On admin login, clear any existing business session to avoid accidental cross-contamination.
- The admin token's `businessId` claim is always `"SYSTEM"` — business-scoped endpoints will reject it.

### Data Unwrapping
- Always destructure: `const { data } = await adminApi.get('/admin/stats')`.
- The interceptor wraps everything — even a flat array like `revenue-growth` becomes `{ success: true, data: [...], timestamp: "..." }`.

### Pagination Pattern
Use the `meta` object for pagination controls:

```typescript
interface PaginatedResponse<T> {
  results: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

This applies to: `GET /admin/businesses`, `GET /admin/audit-logs`.

### Chart Data Gap-Filling
For time-series endpoints (`revenue-growth`, `signups`, `transactions-volume`), the server only returns periods with data. For continuous charts, gap-fill on the frontend:

```typescript
function fillGaps(rows: { date: string; value: number }[], days: number = 30) {
  const map = new Map(rows.map(r => [r.date.slice(0, 10), r.value]));
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    result.push({ date, value: map.get(date) ?? 0 });
  }
  return result;
}
```

**⚠️ Range-aware gap-filling:** The range param affects granularity. For `today`/`yesterday` (hourly), gap-fill by hour instead of day. For `90d` (weekly), gap-fill by week. Adjust the fill logic based on the `range` value:
- `today` / `yesterday`: 24 hourly buckets
- `7d`: 7 daily buckets
- `30d`: 30 daily buckets
- `90d`: ~13 weekly buckets
- `1y` / `all`: 12 monthly buckets

### Handling Delta Percent Null

The `GET /admin/analytics/comparison` endpoint returns `deltaPercent: null` when the previous period's value is zero (division by zero avoided). **Always null-check before rendering trend indicators:**

```typescript
function formatTrend(metric: { current: number; previous: number; delta: number; deltaPercent: number | null }) {
  if (metric.deltaPercent === null) {
    return { label: '—', variant: 'neutral' }; // Display a dash or "N/A"
  }
  const sign = metric.deltaPercent > 0 ? '+' : '';
  const variant = metric.deltaPercent > 0 ? 'positive' : metric.deltaPercent < 0 ? 'negative' : 'neutral';
  return { label: `${sign}${metric.deltaPercent.toFixed(1)}%`, variant };
}
```

Do **not** render `"0%"` or `"+∞"` when `deltaPercent` is `null` — this is misleading to users.

### Admin Role-Aware UI

The frontend should read the admin's role from either:
- The JWT payload (decode the access token)
- A `GET /auth/profile` call after login

Use the role to conditionally render UI elements:

| Role | Show |
|------|------|
| `SUPER_ADMIN` | All sections: Dashboard, Analytics, Businesses, Verification, Search, Audit Logs, Notifications, **Admin Management** |
| `SUPPORT_ADMIN` | Dashboard, Analytics, Businesses, Search, Audit Logs |
| `ANALYST` | Dashboard, Analytics only |

- Hide navigation items the role cannot access.
- The API will return `403` if a restricted endpoint is called anyway — handle this gracefully in your HTTP client interceptor.
- The admin management section (CRUD for admin accounts) should only render for `SUPER_ADMIN`.

### Known Backend Gaps (Frontend Workarounds)

| Gap | Workaround |
|-----|-----------|
| Verification `notes` not persisted | Send notes; they won't break the request. Backend fix needed to add a `verificationNotes` column. |
| FCM not actually sent | Build the notification UI against the current response shape. FCM integration is a backend-side change — no frontend rework needed. |
| `globalSearch` not audited | N/A for frontend — just be aware search actions won't appear in audit logs yet. |
| Deactivated admins still hold valid JWTs | Tokens are short-lived (60 min). A deactivated admin can still use their token until it expires. For immediate revocation, a token blacklist (Redis) would be needed — v2 candidate. |

---

## 🔗 Related Documentation
- **[Authentication](./authentication.md)** — Admin login flow and token management
- **[Business](./business.md)** — Understanding the Business model fields referenced here
- **[Edge Cases](./edge_cases.md)** — Concurrency handling, decimal precision, and security mechanisms
