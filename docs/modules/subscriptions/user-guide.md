# Subscription Plans — User Guide

How business owners interact with plans, features, and limits.

---

## Which Plan Am I On?

`GET /business/profile`

The response includes plan details:

```json
{
  "success": true,
  "data": {
    "name": "Lagos Gadgets Hub",
    "plan": {
      "id": "cmpli9sxn...",
      "name": "starter",
      "label": "Starter",
      "price": "0",
      "maxTransactions": 100,
      "maxProducts": 20,
      "maxStaff": 1,
      "maxContacts": 50,
      "maxProjects": 0,
      "maxProperties": 0
    },
    "planId": "cmpli9sxn...",
    "planActivatedAt": "2026-05-27T00:00:00Z",
    "planExpiresAt": null
  }
}
```

### Key Fields

| Field | Meaning |
|-------|---------|
| `plan.name` | Plan identifier (`starter`, `growth`, `premium`) |
| `plan.label` | Display name (`Starter`, `Growth`, `Premium`) |
| `plan.price` | Monthly price in Naira |
| `plan.maxTransactions` | Monthly transaction cap (-1 = unlimited, 0 = not allowed) |
| `planExpiresAt` | Currently null — plans are indefinite |

---

## What Happens When I Hit a Limit?

The API returns `403 Forbidden` with a clear message:

```json
{
  "success": false,
  "statusCode": 403,
  "message": "Project limit (0) reached. Upgrade to add more projects.",
  "error": "Forbidden"
}
```

**Common limit errors:**

| Limit | Starter | Growth | Message |
|-------|---------|--------|---------|
| Projects | 0 | 20 | "Project limit (0) reached. Upgrade to add more projects." |
| Properties | 0 | 5 | "Property limit (0) reached. Upgrade to add more properties." |
| Staff | 1 | 5 | "Staff limit (1) reached. Upgrade to add more staff." |
| Products | 20 | 200 | "Product limit (20) reached. Upgrade to add more products." |
| Transactions | 100/mo | 1,000/mo | "Monthly transaction limit (100) reached. Upgrade to continue." |

---

## What Happens When a Feature Is Locked?

If the plan doesn't include a feature, the API returns:

```json
{
  "success": false,
  "statusCode": 403,
  "message": "\"inventory\" is not available on your Starter plan. Upgrade to access this feature.",
  "error": "Forbidden"
}
```

---

## How Do I Upgrade?

Currently, upgrades are manual via admin. Contact support or the admin to upgrade your plan.

Upgrade response:
```json
{
  "businessId": "biz_xxx",
  "businessName": "Lagos Gadgets Hub",
  "plan": "growth",
  "message": "Business upgraded to Growth."
}
```

---

## Plan Duration

Plans are **indefinite** — there is no expiration. Once assigned, a plan stays active until an admin changes it. There is no recurring billing in the current version.

---

## Switching Businesses

If you own multiple businesses, each has its own plan. Switch between them via:

1. Login → businesses list shown
2. Tap a business → `POST /auth/select-business` → business-scoped token
3. Each business has independent plan, limits, and data
