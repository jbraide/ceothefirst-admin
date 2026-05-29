# v3 Frontend Implementation Guide

How to update the frontend for multi-business accounts.

---

## What Changed

v3 separates identity (Owner) from business entities. One phone number can now own multiple businesses.

### Before (v2)
```
Login → business-scoped token → dashboard
```

### After (v3)
```
Login → owner token + businesses list → pick business → business-scoped token → dashboard
                                              │
                                              └── or create new business
```

---

## New Response Shapes

### 1. Register

`POST /auth/register`

**Request:**
```json
{
  "phone": "08033551708",
  "pin": "3084",
  "ownerName": "Ibrahim Musa",
  "businessName": "My Store",
  "businessType": "product"
}
```

> `businessName` is optional. If omitted, the owner is created with no businesses.

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "owner": { "id": "cmpo...", "name": "Ibrahim Musa", "phone": "08033551708" },
    "businesses": [
      { "id": "cmpn...", "name": "My Store", "businessType": "product", "category": null, "plan": { "name": "starter", "label": "Starter" } }
    ]
  }
}
```

### 2. Login

`POST /auth/login`

**Request:** (unchanged)
```json
{ "phone": "08033551708", "pin": "3084" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "owner": { "id": "cmpo...", "name": "Ibrahim Musa", "phone": "08033551708" },
    "businesses": [
      { "id": "biz_a", "name": "Lagos Gadgets Hub", "businessType": "product", "category": "Retail", "plan": { "name": "growth", "label": "Growth" } },
      { "id": "biz_b", "name": "BlockTrade FX", "businessType": "service", "category": "Financial Services", "plan": { "name": "starter", "label": "Starter" } },
      { "id": "biz_c", "name": "Pixelcraft Studio", "businessType": "service", "category": "Creative Agency", "plan": { "name": "starter", "label": "Starter" } }
    ]
  }
}
```

### 3. Select Business

`POST /auth/select-business`

**Request:**
```json
{ "businessId": "biz_a" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "business": { "id": "biz_a", "name": "Lagos Gadgets Hub", "businessType": "product", "category": "Retail" }
  }
}
```

### 4. Create Business

`POST /business`

**Request:**
```json
{ "name": "My New Venture", "businessType": "service", "category": "Creative Agency" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new_biz_id",
    "name": "My New Venture",
    "businessType": "service",
    "category": "Creative Agency",
    "plan": { "name": "starter", "label": "Starter" },
    "planActivatedAt": "2026-06-01T00:00:00.000Z"
  }
}
```

### 5. List My Businesses

`GET /business`

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": "biz_a", "name": "Lagos Gadgets Hub", "businessType": "product", "category": "Retail", "plan": { "name": "growth", "label": "Growth" } },
    { "id": "biz_b", "name": "BlockTrade FX", "businessType": "service", "category": "Financial Services", "plan": { "name": "starter", "label": "Starter" } }
  ]
}
```

---

## Implementation Checklist

### Step 1: Update Auth Store

```typescript
interface AuthState {
  ownerToken: string | null;       // From login/register — for business management
  businessToken: string | null;    // From select-business — for all app operations
  refreshToken: string | null;
  owner: { id: string; name: string; phone: string } | null;
  businesses: Business[];
  currentBusiness: Business | null;
}

// API helper — use the right token
function getAuthHeader(): string {
  return `Bearer ${authState.businessToken || authState.ownerToken}`;
}
```

### Step 2: Update Login Screen

After login success:
```
if (businesses.length === 0) → "Create your first business" screen
if (businesses.length === 1) → auto-select, skip picker
if (businesses.length > 1)  → show business picker
```

### Step 3: Build Business Picker Screen

```
┌─────────────────────────────────┐
│  Choose a business              │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 📱 Lagos Gadgets Hub      │  │
│  │    Retail · Growth         │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ 💱 BlockTrade FX          │  │
│  │    Financial Services      │  │
│  │    Starter                 │  │
│  └───────────────────────────┘  │
│                                 │
│  [+ Create New Business]        │
└─────────────────────────────────┘
```

On tap: call `/auth/select-business` → store `businessToken` → navigate to dashboard.

### Step 4: Build Create Business Screen

Fields: Name (required), Business Type dropdown, Category (auto-set from type)

On success: if first business → auto-select and navigate to dashboard. Otherwise → back to picker.

### Step 5: Add Business Switcher

In settings or nav bar: "Switch Business" → show picker → on select, replace `businessToken`, reset app state, navigate to dashboard.

---

## Token Management

| Token | Stored as | Contains | Expires |
|-------|----------|----------|---------|
| Owner token | `ownerToken` | `sub`, `phone`, `role` — no `businessId` | 60 min |
| Business token | `businessToken` | `sub`, `phone`, `role`, `businessId` | 60 min |
| Refresh token | `refreshToken` | Rotates on use | 7 days |

**When to refresh:**
- If `businessToken` expires → use `refreshToken` with `/auth/token/refresh`
- If `ownerToken` expires → re-login (or use refresh token)

**On app launch:**
1. Check stored `businessToken` — if valid and has `businessId`, go to dashboard
2. If expired, try refresh
3. If refresh fails, check `ownerToken` → go to business picker
4. If owner token also expired → go to login

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Owner has no businesses | Show "Create your first business" — can't proceed to dashboard |
| Owner has 1 business | Auto-select on login — no picker needed |
| Business token expires mid-session | Refresh → if fails, return to picker (owner token still valid) |
| Staff login | No change — staff token has businessId directly, no picker |
| Registration with businessName | Business auto-created, auto-selected if only one |
| Registration without businessName | Empty businesses list — must create one before proceeding |
