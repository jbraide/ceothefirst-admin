# Authentication Flow (v3)

How owners authenticate and switch between businesses.

---

## Overview

v3 separates identity from business. One owner can have multiple businesses. Login happens at the owner level. A business is selected after login.

```
Register (Owner) → Create Business → Select Business → Use App
                                                         │
                                                Switch Business ←→ Select Another
```

---

## Step 1 — Register (Owner)

`POST /auth/register`

| Field | Required | Example |
|-------|----------|---------|
| `phone` | Yes | `"08033551708"` |
| `pin` | Yes | `"3084"` |
| `ownerName` | Yes | `"Ibrahim Musa"` |

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "owner": {
      "id": "owner_xxx",
      "name": "Ibrahim Musa",
      "phone": "08033551708"
    },
    "businesses": []
  }
}
```

> The owner has no businesses yet. The token is owner-scoped (no `businessId`).

---

## Step 2 — Create First Business

`POST /businesses`

| Field | Required | Example |
|-------|----------|---------|
| `name` | Yes | `"Lagos Gadgets Hub"` |
| `businessType` | No | `"product"` |
| `category` | No | `"Retail"` |

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "biz_xxx",
    "name": "Lagos Gadgets Hub",
    "businessType": "product",
    "category": "Retail",
    "plan": { "name": "starter", "label": "Starter" },
    "planActivatedAt": "2026-06-01T00:00:00Z"
  }
}
```

---

## Step 3 — Select Business

`POST /auth/select-business`

| Field | Required | Example |
|-------|----------|---------|
| `businessId` | Yes | `"biz_xxx"` |

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "business": {
      "id": "biz_xxx",
      "name": "Lagos Gadgets Hub",
      "businessType": "product",
      "category": "Retail"
    }
  }
}
```

> This token has `businessId` set. All subsequent API calls use this.

---

## Login (Returning Owner)

`POST /auth/login`

| Field | Required | Example |
|-------|----------|---------|
| `phone` | Yes | `"08033551708"` |
| `pin` | Yes | `"3084"` |

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "owner": {
      "id": "owner_xxx",
      "name": "Ibrahim Musa",
      "phone": "08033551708"
    },
    "businesses": [
      {
        "id": "biz_a",
        "name": "Lagos Gadgets Hub",
        "businessType": "product",
        "category": "Retail",
        "plan": { "name": "growth", "label": "Growth" }
      },
      {
        "id": "biz_b",
        "name": "BlockTrade FX",
        "businessType": "service",
        "category": "Financial Services",
        "plan": { "name": "starter", "label": "Starter" }
      },
      {
        "id": "biz_c",
        "name": "Pixelcraft Studio",
        "businessType": "service",
        "category": "Creative Agency",
        "plan": { "name": "starter", "label": "Starter" }
      }
    ]
  }
}
```

---

## Create Additional Business

`POST /businesses` (same endpoint, can be called multiple times)

Each new business:
- Gets its own Starter plan
- Has independent products, transactions, contacts, staff
- Has its own Telegram link code
- Can be upgraded separately via admin

---

## Switch Business

`POST /auth/select-business` with a different `businessId`.

The frontend should:
1. Store the current `accessToken`
2. Call `/auth/select-business` with the new business ID
3. Replace the token
4. Reload dashboard / reset app state for the new business

---

## List My Businesses

`GET /businesses`

```json
{
  "success": true,
  "data": {
    "businesses": [
      { "id": "biz_a", "name": "Lagos Gadgets Hub", "businessType": "product", "category": "Retail" },
      { "id": "biz_b", "name": "BlockTrade FX", "businessType": "service", "category": "Financial Services" }
    ]
  }
}
```

---

## Token Lifecycle

| Token | Scope | Contains | Used For |
|-------|-------|----------|----------|
| Owner token | Owner only | `sub`, `phone`, `role` | Creating businesses, listing businesses |
| Business token | One business | `sub`, `phone`, `role`, `businessId` | All business operations |

**Expiration:** Access tokens: 60 min. Refresh tokens: 7 days with rotation.

**Auto-select:** If owner has exactly one business, the login response can auto-select it (skip the picker). Frontend can implement this by checking `businesses.length === 1`.

---

## Staff Login (Unchanged)

Staff login returns a business-scoped token directly — no owner layer. Staff cannot switch or create businesses.

`POST /auth/staff/login` → `{ accessToken, staff, business }`
