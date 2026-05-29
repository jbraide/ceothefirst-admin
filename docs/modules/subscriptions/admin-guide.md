# Subscription Management — Admin Guide

How super admins manage plans, features, and business assignments.

---

## Endpoints

All endpoints are under `/admin`. Role requirements noted per endpoint.

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
| `PATCH` | `/admin/businesses/:id/plan/adjust` | Adjust plan with custom limits and notes |
| `GET` | `/admin/businesses/by-plan/:planName` | Filter businesses by plan |
| `GET` | `/admin/subscriptions/businesses` | List all businesses with plans (paginated) |
| `GET` | `/admin/subscriptions/overview` | Plan distribution, subscriber counts, revenue |

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

### Business Plan Adjustment

**`PATCH /admin/businesses/:id/plan/adjust`**

Change plan with optional custom limits and audit note.

**Request:**
```json
{
  "planId": "growth-plan-id",
  "customLimits": {
    "maxTransactions": 2000,
    "maxProducts": 500
  },
  "note": "Upgraded per customer request"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "businessId": "biz_xxx",
    "businessName": "Lagos Gadgets Hub",
    "previousPlan": "Starter",
    "adjustments": {
      "planId": "growth-plan-id",
      "note": "Upgraded per customer request"
    }
  }
}
```

### Subscription Overview

**`GET /admin/subscriptions/overview`** (SUPER_ADMIN, SUPPORT_ADMIN)

Plan distribution, subscriber counts, and estimated monthly revenue.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSubscribers": 17,
    "totalEstimatedRevenue": 5000,
    "plans": [
      { "planLabel": "Starter", "subscriberCount": 14, "price": 0, "estimatedMonthlyRevenue": 0 },
      { "planLabel": "Growth", "subscriberCount": 2, "price": 5000, "estimatedMonthlyRevenue": 10000 },
      { "planLabel": "Premium", "subscriberCount": 1, "price": 15000, "estimatedMonthlyRevenue": 15000 }
    ],
    "recentChanges": [
      { "targetId": "biz_xxx", "details": "...", "createdAt": "2026-05-29T...", "admin": { "name": "Super Admin" } }
    ]
  }
}
```

### List Businesses with Plans

**`GET /admin/subscriptions/businesses?plan=starter&isActive=true&page=1&limit=50`** (SUPER_ADMIN, SUPPORT_ADMIN)

Paginated list of all businesses with their current plan and trial expiry.

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "biz_xxx",
        "name": "Trial Biz 555",
        "ownerPhone": "08010000555",
        "businessType": "product",
        "category": null,
        "isActive": true,
        "planActivatedAt": "2026-05-29T20:00:58Z",
        "planExpiresAt": "2026-06-05T20:00:58Z",
        "createdAt": "2026-05-29T20:00:58Z",
        "plan": { "id": "cmpli9sxn...", "name": "starter", "label": "Starter", "price": "0" }
      }
    ],
    "meta": { "total": 17, "page": 1, "limit": 50, "pages": 1 }
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
| Business registers | Auto-assigned Starter plan with **7-day free trial** |
| Trial period | 7 days from registration. `planExpiresAt` = registration + 7 days |
| Trial expiry | `selectBusiness` returns 403 — "Your 7-day free trial has expired. Contact support to upgrade." |
| Admin upgrades | `PATCH /admin/businesses/:id/plan` → new plan active, expiry cleared |
| Admin adjusts | `PATCH /admin/businesses/:id/plan/adjust` → change plan with custom limits |
| Admin downgrades | Features gated, data preserved |
| Existing businesses (pre-v3) | `planExpiresAt: null` — no trial, indefinite access |

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
