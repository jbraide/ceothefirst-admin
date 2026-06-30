# Feature Requests Module

Allows business owners and staff to submit, track, and upvote feature requests directly from the app, Telegram, or WhatsApp. Admins can triage, prioritise, and update statuses across all businesses.

---

## Data Model

```prisma
model FeatureRequest {
  id          String   @id @default(cuid())
  businessId  String
  business    Business @relation(fields: [businessId], references: [id])
  ownerId     String?
  owner       Owner?   @relation(fields: [ownerId], references: [id])
  module      String   // e.g. "inventory", "bookings", "reports"
  title       String   // Short one-line summary
  description String   // Full feature description
  priority    String   @default("medium")  // "low" | "medium" | "high" | "critical"
  status      String   @default("pending") // "pending" | "reviewed" | "planned" | "in_progress" | "completed" | "declined"
  adminNotes  String?  // Internal staff notes
  voteCount   Int      @default(0)
  source      String   @default("web")     // "web" | "telegram" | "whatsapp"
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Field Semantics

| Field | Description |
|-------|-------------|
| `module` | The NairaFlow module this request targets. One of 14 predefined values (see Supported Modules below). |
| `title` | Short, descriptive headline. Used in list views and notifications. |
| `description` | Full detail — what the feature should do, why it's needed, any workaround currently in use. |
| `priority` | User-assigned urgency. Guides the admin triage queue. |
| `status` | Lifecycle state managed by admins (see Status Lifecycle below). |
| `adminNotes` | Internal memo from the NairaFlow team. Not visible to the requester via the API (admin-only). |
| `voteCount` | Number of upvotes from other users in the same business. Helps gauge demand. |
| `source` | How the request was submitted — `web`, `telegram`, or `whatsapp`. |

### Status Lifecycle

```
pending ──→ reviewed ──→ planned ──→ in_progress ──→ completed
                │                        │
                └── declined             └── (any step can go back to pending)
```

| Status | Meaning |
|--------|---------|
| `pending` | New request, awaiting review |
| `reviewed` | Acknowledged by the team, under consideration |
| `planned` | Accepted and scheduled for a future sprint |
| `in_progress` | Currently being built |
| `completed` | Shipped and available |
| `declined` | Will not be implemented (reason in adminNotes) |

---

## API Reference

Base path: `/api/v1`

### Create Feature Request

`POST /feature-requests`

**Auth:** Owner & Staff (`@UseGuards(JwtAuthGuard)`)

**Request body:**

```json
{
  "module": "inventory",
  "title": "Bulk CSV export for products",
  "description": "I need to export all my products to CSV with columns for name, selling price, cost price, stock level, and category so I can analyse pricing across suppliers.",
  "priority": "high"
}
```

| Field | Required | Validation | Default |
|-------|----------|-----------|---------|
| `module` | ✅ | Non-empty string, matched against supported modules | — |
| `title` | ✅ | Min 3 characters | — |
| `description` | ✅ | Min 10 characters | — |
| `priority` | ❌ | One of: `low`, `medium`, `high`, `critical` | `medium` |

**Response `201 Created`:**

```json
{
  "success": true,
  "data": {
    "id": "cmqabc123def456",
    "module": "inventory",
    "title": "Bulk CSV export for products",
    "description": "I need to export all my products to CSV...",
    "priority": "high",
    "status": "pending",
    "voteCount": 0,
    "source": "web",
    "createdAt": "2026-06-29T22:30:00.000Z",
    "updatedAt": "2026-06-29T22:30:00.000Z"
  }
}
```

### List Feature Requests

`GET /feature-requests`

**Auth:** Owner & Staff

Returns all requests for the authenticated business, ordered by `createdAt` descending.

**Response `200 OK`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "cmqabc...",
      "module": "inventory",
      "title": "Bulk CSV export for products",
      "status": "pending",
      "priority": "high",
      "voteCount": 3,
      "source": "web",
      "createdAt": "2026-06-29T22:30:00.000Z"
    }
  ]
}
```

### Get Single Request

`GET /feature-requests/:id`

**Auth:** Owner & Staff

Returns the full request details. Validates the request belongs to the authenticated business.

### Update Request

`PATCH /feature-requests/:id`

**Auth:** Owner only (`@Roles('OWNER')`)

Allows the owner to change `module`, `title`, `description`, or `priority`. Cannot change `status` or `voteCount` (admin-only fields).

**Request body (partial):**

```json
{
  "title": "Updated: Bulk CSV export for products and categories",
  "priority": "critical"
}
```

### Delete Request

`DELETE /feature-requests/:id`

**Auth:** Owner only

Permanently removes the request. Cannot be undone.

### Upvote Request

`POST /feature-requests/:id/upvote`

**Auth:** Owner & Staff

Increments the `voteCount` by 1. No request body needed. Idempotent — each call adds 1 vote (no duplicate detection per user — the frontend should disable the button after first click).

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "cmqabc...",
    "voteCount": 4
  }
}
```

---

## Admin Endpoints

### List All Requests (Cross-Business)

`GET /admin/feature-requests`

**Auth:** `SUPER_ADMIN`, `SUPPORT_ADMIN`

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter by status: `pending`, `reviewed`, `planned`, `in_progress`, `completed`, `declined` |
| `module` | string | Filter by module key (e.g. `inventory`) |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 50) |

**Response:**

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "cmqabc...",
        "module": "inventory",
        "title": "Bulk CSV export for products",
        "status": "pending",
        "priority": "high",
        "voteCount": 3,
        "source": "web",
        "business": { "name": "Lagos Gadgets Hub" },
        "createdAt": "2026-06-29T22:30:00.000Z"
      }
    ],
    "meta": {
      "total": 42,
      "page": 1,
      "limit": 50,
      "pages": 1
    }
  }
}
```

### Update Request Status

`PATCH /admin/feature-requests/:id`

**Auth:** `SUPER_ADMIN`, `SUPPORT_ADMIN`

**Request body:**

```json
{
  "status": "planned",
  "adminNotes": "Scheduled for sprint 24. Estimated effort: 3 days."
}
```

| Field | Required | Validation |
|-------|----------|-----------|
| `status` | ❌ | One of: `pending`, `reviewed`, `planned`, `in_progress`, `completed`, `declined` |
| `adminNotes` | ❌ | Free text |

---

## Supported Modules

| # | Module Key | Category | Description |
|---|-----------|----------|-------------|
| 1 | `contacts` | Core | Customers, suppliers, client management |
| 2 | `transactions` | Core | Sales, purchases, expenses |
| 3 | `debts` | Core | Receivables and payables |
| 4 | `invoices` | Core | Invoice creation and tracking |
| 5 | `reports` | Core | Dashboard, cash book, summaries |
| 6 | `staff` | Core | Team member management |
| 7 | `inventory` | Retail | Products, categories, stock |
| 8 | `leads` | Growth | Prospect tracking and conversion |
| 9 | `projects` | Freelancer | Client projects and milestones |
| 10 | `properties` | Shortlet | Rental property management |
| 11 | `bookings` | Shortlet | Reservations and check-in/out |
| 12 | `maintenance` | Shortlet | Issue tracking and resolution |
| 13 | `reviews` | Shortlet | Guest ratings and feedback |
| 14 | `other` | — | Anything not covered above |

---

## Bot Flows

### Telegram

**Command:** `/feature`

Triggers a 4-step wizard directly in the chat:

```
User: /feature
Bot: What module? (1-14)
User: 7 (Inventory)
Bot: Give it a short title
User: Bulk CSV export
Bot: Describe it in detail
User: I need to export products to CSV...
Bot: What priority? (1-4)
User: 2 (High)
Bot: ✅ Submitted!
```

All steps are validated — invalid inputs get a retry prompt with the exact error. Cancelling mid-flow is handled by simply starting over with `/feature`.

### WhatsApp

**Command:** Reply `feature` or `request`

Same 4-step wizard but adapted for WhatsApp plain-text format:

```
User: feature
Bot: What module? Reply with a number 1-14
User: 7
Bot: ✅ Module noted! Now give your feature a short title...
```

---

## Edge Cases

| Scenario | Behaviour |
|----------|-----------|
| Empty title | Rejected — minimum 3 characters |
| Short description | Rejected — minimum 10 characters |
| Invalid module number | Re-prompt with valid range 1-14 |
| User cancels mid-flow | State cleaned up on next unrelated message; restart with `/feature` or `feature` |
| Business not linked (Telegram) | `/feature` shows error: "You need to link a business first" |
| API unreachable (bot) | Friendly error: "Could not submit your request" — state cleaned up |
| Duplicate submission | No automatic dedup — user can submit multiple times |
| Upvote from same user multiple times | Allowed at API level; frontend should gate to one per user per request |
| Admin deletes request | Not implemented — requests are soft-managed via status |

---

## Access Control

| Role | Create | List | Update | Delete | Upvote | Admin List | Admin Update |
|------|--------|------|--------|--------|--------|------------|--------------|
| Owner | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Staff | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| SUPER_ADMIN | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| SUPPORT_ADMIN | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## Database Indexes

```sql
CREATE INDEX IF NOT EXISTS "FeatureRequest_businessId_idx" ON "FeatureRequest"("businessId");
CREATE INDEX IF NOT EXISTS "FeatureRequest_module_idx" ON "FeatureRequest"("module");
CREATE INDEX IF NOT EXISTS "FeatureRequest_status_idx" ON "FeatureRequest"("status");
```

These cover the three common query patterns: listing by business, filtering by module (admin view), and filtering by status (admin triage queue).
