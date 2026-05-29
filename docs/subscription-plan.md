# Subscription & Feature Gating Plan

> **Status:** Draft for review  
> **Depends on:** Unified schema plan (Phase 1 models integrated)  
> **Goal:** Tiered plans with feature toggles, usage limits, and an admin API to manage everything.

---

## 1. Plan Tiers

Three plans covering solo operators to growing businesses.

| Plan | Monthly Price | Target |
|------|--------------|--------|
| **Starter** | Free (₦0) | Solo operators testing the waters |
| **Growth** | ₦5,000 | Growing businesses needing more power |
| **Premium** | ₦15,000 | Established businesses, agencies, shortlet operators |

Each plan carries both **feature gates** (what modules are accessible) and **usage limits** (how much you can use).

---

## 2. Feature Inventory

Every module and capability in the system, organized by domain.

### 2.1 Core (always available)

| Key | Feature | Description |
|-----|---------|-------------|
| `auth` | Authentication | Phone + PIN login, PIN reset |
| `business_profile` | Business Profile | Business details, bank info, reminders |
| `contacts` | Contacts | Customer, supplier, client, guest management |
| `transactions` | Basic Transactions | Sales, purchases, expenses |
| `quick_sale` | Quick Sale / POS | Non-inventory fast sale recording |
| `debts` | Debt Tracking | Receivables and payables |
| `invoices` | Invoicing | Formal invoice creation, payment tracking, PDF export |
| `basic_reports` | Basic Reports | Dashboard, cash book, daily summary |
| `staff_1` | 1 Staff Member | Single employee access |

### 2.2 Retail & Operations

| Key | Feature | Description |
|-----|---------|-------------|
| `inventory` | Inventory Management | Products, categories, stock levels |
| `stock_tracking` | Stock Tracking | Automatic stock decrement on sales, low-stock alerts |
| `sales_channels` | Sales Channels | Track sales source: WhatsApp, Instagram, Walk-in |
| `discounts` | Discounts | Apply discount to sales transactions |
| `expense_receipts` | Expense Receipts | Upload and attach receipts to expenses |
| `expense_approval` | Expense Approval | Pending → Approved workflow for expenses |

### 2.3 Growth & Leads

| Key | Feature | Description |
|-----|---------|-------------|
| `leads` | Lead Management | Track inquiries, follow-ups, conversion to customer |
| `advanced_reports` | Advanced Reports | Period comparisons, custom date ranges, export |
| `staff_multi` | Multi Staff | Up to 5 (Growth) or unlimited (Premium) staff members |
| `recurring_invoices` | Recurring Invoices | Auto-generated weekly/monthly/quarterly invoices |

### 2.4 Freelancer & Agency

| Key | Feature | Description |
|-----|---------|-------------|
| `projects` | Project Management | Client projects with milestones, payments, deadlines |
| `project_tasks` | Project Tasks | Subtasks within projects, assignees, due dates |
| `service_catalog` | Service Catalog | List services with pricing and delivery timelines |

### 2.5 Shortlet & Hospitality

| Key | Feature | Description |
|-----|---------|-------------|
| `properties` | Property Management | Apartments, rates, room counts, availability |
| `bookings` | Booking Management | Date-based reservations, check-in/out, guest tracking |
| `booking_calendar` | Booking Calendar | Visual calendar of occupancy |
| `maintenance` | Maintenance Tracking | Issue reporting, vendor assignment, cost tracking |
| `reviews` | Guest Reviews | Ratings and feedback tied to bookings |

### 2.6 Premium

| Key | Feature | Description |
|-----|---------|-------------|
| `multi_currency` | Multi-Currency | USDT, BTC amounts alongside Naira |
| `product_variants` | Product Variants | Parent product with child SKUs (size, color) |
| `serial_tracking` | Serial / IMEI | Per-unit tracking for high-value items |
| `delivery_mgmt` | Delivery Management | Driver assignment, order status tracking |
| `priority_support` | Priority Support | Faster response, dedicated support channel |
| `api_access` | API Access | Programmatic access for integrations |
| `custom_reports` | Custom Reports | Build and save custom report templates |

---

## 3. Feature → Plan Mapping

Starter is intentionally lean — enough to be useful, not enough to run a full operation. Growth unlocks the primary vertical (retail, freelancer, or shortlet). Premium unlocks everything.

### 3.1 Starter (Free)

| Domain | Features |
|--------|----------|
| Core | `auth`, `business_profile`, `contacts`, `transactions`, `quick_sale`, `debts`, `invoices`, `basic_reports`, `staff_1` |

**Usage limits:**

| Limit | Value |
|-------|-------|
| Max transactions/month | 100 |
| Max products | 20 |
| Max staff | 1 |
| Max contacts | 50 |
| Invoice PDFs/month | 10 |

### 3.2 Growth (₦5,000/mo)

Everything in Starter, plus:

| Domain | Features |
|--------|----------|
| Retail | `inventory`, `stock_tracking`, `sales_channels`, `discounts`, `expense_receipts` |
| Growth | `leads`, `advanced_reports`, `expense_approval`, `staff_multi` |
| Freelancer | `projects`, `service_catalog` |
| Shortlet | `properties`, `bookings` |

**Usage limits:**

| Limit | Value |
|-------|-------|
| Max transactions/month | 1,000 |
| Max products | 200 |
| Max staff | 5 |
| Max contacts | 500 |
| Max projects | 20 |
| Max properties | 5 |
| Invoice PDFs/month | 50 |

### 3.3 Premium (₦15,000/mo)

Everything in Growth, plus all remaining features without limits:

| Domain | Features |
|--------|----------|
| Growth | `recurring_invoices` |
| Freelancer | `project_tasks` |
| Shortlet | `booking_calendar`, `maintenance`, `reviews` |
| Premium | `multi_currency`, `product_variants`, `serial_tracking`, `delivery_mgmt`, `priority_support`, `api_access`, `custom_reports` |

**Usage limits:** All unlimited.

---

## 4. Schema Design

Three new models: `SubscriptionPlan`, `Feature`, and a junction `PlanFeature`. Usage limits stored on the plan. Business linked to a plan.

```prisma
model SubscriptionPlan {
  id              String            @id @default(cuid())
  name            String            @unique   // "starter" | "growth" | "premium"
  label           String                      // "Starter" | "Growth" | "Premium"
  price           Decimal                     // Monthly price in Naira
  description     String?
  isActive        Boolean           @default(true)

  // Usage limits (0 = unlimited)
  maxTransactions Int               @default(100)
  maxProducts     Int               @default(20)
  maxStaff        Int               @default(1)
  maxContacts     Int               @default(50)
  maxProjects     Int               @default(0)
  maxProperties   Int               @default(0)
  maxInvoicePDFs  Int               @default(10)

  features        PlanFeature[]
  businesses      Business[]
  createdAt       DateTime          @default(now())
}

model Feature {
  id          String        @id @default(cuid())
  key         String        @unique   // e.g. "inventory", "leads", "projects"
  name        String                  // Human-readable: "Inventory Management"
  description String?
  category    String                  // "core" | "retail" | "growth" | "freelancer" | "shortlet" | "premium"
  createdAt   DateTime      @default(now())

  plans       PlanFeature[]
}

model PlanFeature {
  id        String           @id @default(cuid())
  planId    String
  plan      SubscriptionPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
  featureId String
  feature   Feature          @relation(fields: [featureId], references: [id], onDelete: Cascade)
  isEnabled Boolean          @default(true)

  @@unique([planId, featureId])
}
```

**Add to Business:**

```prisma
model Business {
  // ... existing fields ...
  planId            String?
  plan              SubscriptionPlan? @relation(fields: [planId], references: [id])
  planActivatedAt   DateTime?
  planExpiresAt     DateTime?
}
```

---

## 5. How Feature Gating Works at Runtime

### 5.1 The Guard

A `FeatureGuard` decorator that checks if the authenticated business's plan includes the required feature:

```typescript
// Usage in controller
@Post('sell')
@UseGuards(JwtAuthGuard, FeatureGuard)
@RequireFeature('inventory')  // custom decorator
recordSale(@GetBusiness() business: BusinessContext, @Body() dto: CreateSaleDto) {
  // ...
}
```

**How it resolves:**

1. Extract `businessId` from JWT.
2. Load business with `plan.features` (eager or cached).
3. Check if the `Feature` with `key = 'inventory'` exists and `PlanFeature.isEnabled = true`.
4. If not → `403 Forbidden` with message: *"Inventory Management is not available on your Starter plan. Upgrade to Growth."*

### 5.2 Limit Checking (Middleware or Service)

For usage limits, check before mutating:

```typescript
// In TransactionService.recordSale
async recordSale(businessId: string, dto: CreateSaleDto) {
  const business = await this.getBusinessWithPlan(businessId);

  // Check transaction limit
  if (business.plan.maxTransactions > 0) {
    const count = await this.prisma.transaction.count({
      where: {
        businessId,
        createdAt: { gte: startOfMonth() },
      },
    });
    if (count >= business.plan.maxTransactions) {
      throw new ForbiddenException(
        `Monthly transaction limit (${business.plan.maxTransactions}) reached. Upgrade to continue.`
      );
    }
  }

  // ... proceed with sale
}
```

### 5.3 Caching

Plan + feature data is read on every request. Cache it:

- Load plan with features on login → store in Redis with TTL.
- Invalidate cache when admin changes a plan's features.
- Business context in JWT already carries `businessId`; extend it to carry `plan` and `features[]`.

---

## 6. Admin API

All endpoints restricted to `SUPER_ADMIN` role.

### 6.1 Plan Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/plans` | List all plans |
| `GET` | `/admin/plans/:id` | Get plan with features and limits |
| `POST` | `/admin/plans` | Create a new plan |
| `PATCH` | `/admin/plans/:id` | Update plan name, price, limits |
| `DELETE` | `/admin/plans/:id` | Soft-delete (set `isActive = false`) |

### 6.2 Feature Toggling Per Plan

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/plans/:id/features` | All features with their enabled state for this plan |
| `PATCH` | `/admin/plans/:id/features/:featureId` | Toggle `isEnabled` for a feature on a plan |

**Example — Enable leads on Starter:**
```
PATCH /admin/plans/starter-id/features/leads-feature-id
{ "isEnabled": true }
```

### 6.3 Feature Catalog

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/features` | List all features by category |
| `POST` | `/admin/features` | Define a new feature |
| `PATCH` | `/admin/features/:id` | Update feature name/description |
| `DELETE` | `/admin/features/:id` | Remove a feature (cascades to PlanFeature) |

### 6.4 Business Plan Assignment

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/businesses/:id/plan` | Current plan for a business |
| `PATCH` | `/admin/businesses/:id/plan` | Assign or change a business's plan |
| `GET` | `/admin/businesses?plan=starter` | Filter businesses by plan |

**Example — Upgrade a business:**
```
PATCH /admin/businesses/biz-123/plan
{ "planId": "growth-plan-id" }
```

Response includes what was gained: *"Business upgraded to Growth. Unlocked: Inventory, Leads, Projects, Multi-staff."*

---

## 7. Plan Lifecycle

### 7.1 Default Assignment

- New businesses default to **Starter** plan on registration.
- `planActivatedAt` = registration date.
- `planExpiresAt` = null (Starter doesn't expire).

### 7.2 Upgrades

- Business pays → admin or automated system sets `planId` to new plan.
- `planActivatedAt` updated to now.
- Features immediately available (guard re-evaluates on next request).
- Usage limits immediately raised.

### 7.3 Downgrades

- If a business downgrades (Growth → Starter):
  - Features are immediately gated.
  - Existing data is NOT deleted — just inaccessible while on the lower plan.
  - Warning shown: *"You have 150 products. Starter allows 20. Existing data will be hidden but not deleted. Upgrade to restore access."*

### 7.4 Expiry / Non-Payment

- `planExpiresAt` set when subscription lapses.
- After expiry, plan reverts to Starter defaults (features + limits).
- Grace period: 7 days with full access before downgrade.

---

## 8. Seed Data

Default plans created via Prisma seed:

```typescript
const starter = await prisma.subscriptionPlan.create({
  data: {
    name: 'starter',
    label: 'Starter',
    price: 0,
    description: 'For solo operators getting started',
    maxTransactions: 100,
    maxProducts: 20,
    maxStaff: 1,
    maxContacts: 50,
    maxProjects: 0,
    maxProperties: 0,
    maxInvoicePDFs: 10,
  },
});

const growth = await prisma.subscriptionPlan.create({
  data: {
    name: 'growth',
    label: 'Growth',
    price: 5000,
    description: 'For growing businesses ready to scale',
    maxTransactions: 1000,
    maxProducts: 200,
    maxStaff: 5,
    maxContacts: 500,
    maxProjects: 20,
    maxProperties: 5,
    maxInvoicePDFs: 50,
  },
});

const premium = await prisma.subscriptionPlan.create({
  data: {
    name: 'premium',
    label: 'Premium',
    price: 15000,
    description: 'For established businesses that need everything',
    maxTransactions: 0,  // unlimited
    maxProducts: 0,
    maxStaff: 0,
    maxContacts: 0,
    maxProjects: 0,
    maxProperties: 0,
    maxInvoicePDFs: 0,
  },
});
```

Features seeded and linked to plans per the mapping in Section 3.

---

## 9. Summary

| Concern | Approach |
|---------|----------|
| Feature gating | `FeatureGuard` + `@RequireFeature('key')` decorator |
| Usage limits | Service-level checks before mutations |
| Admin control | REST API to toggle features per plan, assign plans to businesses |
| Caching | Plan + features cached per business, invalidated on change |
| Downgrade safety | Data preserved, access gated — not deleted |
| Defaults | All new businesses start on Starter |
| Seed data | 3 plans × 30+ features pre-configured |
