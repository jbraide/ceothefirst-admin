# Subscription Management — Admin Guide

How super admins manage plans, features, and business assignments.

---

## Endpoints

All endpoints are under `/admin` and require `SUPER_ADMIN` role.

### Plans

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/plans` | List all plans with features |
| `GET` | `/admin/plans/:id` | Get plan details |
| `POST` | `/admin/plans` | Create a new plan |
| `PATCH` | `/admin/plans/:id` | Update plan name, price, limits |
| `DELETE` | `/admin/plans/:id` | Deactivate plan (soft delete) |

**Response: `GET /admin/plans`**
```json
{
  "success": true,
  "data": [
    {
      "id": "cmpli9sxn...",
      "name": "starter",
      "label": "Starter",
      "price": "0",
      "maxTransactions": 100,
      "maxProducts": 20,
      "maxStaff": 1,
      "maxContacts": 50,
      "maxProjects": 0,
      "maxProperties": 0,
      "maxInvoicePDFs": 10,
      "features": [
        { "feature": { "key": "auth", "name": "Authentication", "category": "core" }, "isEnabled": true },
        { "feature": { "key": "quick_sale", "name": "Quick Sale / POS", "category": "core" }, "isEnabled": true }
      ]
    }
  ]
}
```

**Limits:**
- `-1` = unlimited
- `0` = not allowed
- Any positive number = hard limit

### Features

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/features` | List all features by category |
| `POST` | `/admin/features` | Create a new feature flag |
| `PATCH` | `/admin/features/:id` | Update feature name/description |
| `DELETE` | `/admin/features/:id` | Delete feature (cascades to plan links) |

### Plan-Feature Toggles

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/plans/:id/features` | All features with enabled state for this plan |
| `PATCH` | `/admin/plans/:planId/features/:featureId` | Toggle `isEnabled` for a feature |

**Toggle request:**
```json
{ "isEnabled": true }
```

### Business Plan Assignment

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/businesses/:id/plan` | Get current plan for a business |
| `PATCH` | `/admin/businesses/:id/plan` | Assign or change plan |
| `GET` | `/admin/businesses/by-plan/:planName` | Filter businesses by plan |

**Assign plan request:**
```json
{ "planId": "growth-plan-id" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "businessId": "biz_xxx",
    "businessName": "Lagos Gadgets Hub",
    "plan": "growth",
    "message": "Business upgraded to Growth."
  }
}
```

---

## Default Plans (Seeded)

| Plan | Price | Transactions | Products | Staff | Contacts | Projects | Properties |
|------|-------|-------------|----------|-------|----------|----------|------------|
| Starter | ₦0 | 100 | 20 | 1 | 50 | 0 | 0 |
| Growth | ₦5,000 | 1,000 | 200 | 5 | 500 | 20 | 5 |
| Premium | ₦15,000 | Unlimited | Unlimited | Unlimited | Unlimited | Unlimited | Unlimited |

---

## Plan Lifecycle

| Event | What Happens |
|-------|-------------|
| Business registers | Auto-assigned Starter plan |
| Admin upgrades | `PATCH /admin/businesses/:id/plan` → new plan active immediately |
| Admin downgrades | Features gated, data preserved |
| Subscription duration | **Indefinite** — no expiration. Plans persist until admin changes them. |
| Billing | Not implemented yet — manual admin assignment only. |

---

## Feature Categories

| Category | Features |
|----------|----------|
| `core` | auth, business_profile, contacts, transactions, quick_sale, debts, invoices, basic_reports, staff_1 |
| `retail` | inventory, stock_tracking, sales_channels, discounts, expense_receipts, expense_approval |
| `growth` | leads, advanced_reports, staff_multi, recurring_invoices |
| `freelancer` | projects, project_tasks, service_catalog |
| `shortlet` | properties, bookings, booking_calendar, maintenance, reviews |
| `premium` | multi_currency, product_variants, serial_tracking, delivery_mgmt, priority_support, api_access, custom_reports |
