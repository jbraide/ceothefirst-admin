# Onboarding & Business Setup

How a business gets from zero to fully configured in NairaFlow.

---

## Overview

```
Register ──→ Auto-assigned Starter plan ──→ Logged in immediately
                  │
                  ├── Optional: Set business details (name, category, location)
                  ├── Optional: Add bank account
                  ├── Optional: Set daily reminder time
                  └── Optional: Enable push notifications (fcmToken)
```

Registration and login use phone number + 4-digit PIN only. No email, no password, no email verification.

---

## Step 1 — Register

`POST /auth/register`

| Field | Required | Validation | Example |
|-------|----------|-----------|---------|
| `phone` | ✅ Yes | Nigerian format: `0[789][01]XXXXXXXX` | `"08012345678"` |
| `pin` | ✅ Yes | Exactly 4 digits, numbers only | `"1234"` |
| `businessName` | ✅ Yes | Any string | `"Lagos Gadgets Hub"` |
| `businessType` | No | `"product"`, `"service"`, `"both"` | `"product"` |

**Example request:**
```json
{
  "phone": "08012345678",
  "pin": "1234",
  "businessName": "Lagos Gadgets Hub",
  "businessType": "product"
}
```

**What happens behind the scenes:**

1. **Phone uniqueness check** — if already registered, returns `409 Conflict`
2. **PIN hashed** — bcrypt, 10 rounds. Never stored in plain text
3. **Business record created** — `ownerPhone`, `pinHash`, `name`, `businessType`
4. **Starter plan auto-assigned** — `planId` linked, `planActivatedAt` set to current time
5. **Tokens returned** — `accessToken` (60 min) + `refreshToken` (7 days)

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Edge case:** If the Starter plan doesn't exist in the database (seed not run), a warning is logged and the business gets no plan. All feature-gated endpoints will return `403 — "No subscription plan assigned."`. Running the seed file fixes this.

---

## Step 2 — Login (subsequent sessions)

`POST /auth/login`

| Field | Required | Example |
|-------|----------|---------|
| `phone` | ✅ Yes | `"08012345678"` |
| `pin` | ✅ Yes | `"1234"` |

Returns the same token structure as registration. Tokens are short-lived (60 min access, 7 day refresh with rotation).

---

## Step 3 — Set Up Business Profile

`PATCH /business/profile`

Everything here is optional. The business can start recording transactions immediately after registration with just the business name. These fields add professionalism (appear on invoices and receipts) and enable features (reminders, push notifications, bank validation on invoices).

| Field | Purpose | When to ask |
|-------|---------|------------|
| `name` | Display name (can differ from registration) | During setup |
| `ownerName` | Owner's full name | During setup |
| `businessType` | `"product"`, `"service"`, `"both"` | During setup |
| `category` | Industry — see supported categories below | During setup |
| `state` / `city` | Location | During setup |
| `address` | Physical address for invoices | Before first invoice |
| `email` | Contact email | Optional |
| `bankName` | Bank for invoice payment instructions | Before first invoice |
| `accountNumber` | NUBAN account number | Before first invoice |
| `accountName` | Verified name from bank | After validation |
| `reminderTime` | `"20:30"` — daily push to close the books | Any time |
| `fcmToken` | Firebase Cloud Messaging token for push notifications | On app launch/login |

### Supported Categories

`category` is a free-text field. These are the canonical values mapped to each business class:

| Category | Business Class | Examples |
|----------|---------------|----------|
| `"Retail"` | Product Seller | Gadgets, fashion, perfume, mini-importers, Instagram vendors |
| `"Financial Services"` | Crypto / Financial | P2P traders, USDT merchants, FX operators |
| `"Hospitality"` | Shortlet / Hospitality | Apartment rentals, short-stay operators, guest houses |
| `"Creative Agency"` | Freelancer / Agency | Marketing agencies, consultants, logo designers, web developers |
| `"Food & Drinks"` | Food & Delivery | Cloud kitchens, restaurants, food vendors, frozen food suppliers |

> **Note:** If a business doesn't match any of the above, any string works. Uncategorized businesses show as `"category": null` in admin analytics. It's safe to leave this blank — the system functions normally without it.

**Example — full profile update:**
```json
{
  "name": "Lagos Gadgets Hub",
  "ownerName": "Ibrahim Musa",
  "businessType": "product",
  "category": "Retail",
  "state": "Lagos",
  "city": "Ikeja",
  "address": "12 Allen Avenue, Ikeja",
  "bankName": "GTBank",
  "accountNumber": "0123456789",
  "reminderTime": "20:30"
}
```

### Response Example (after update)

```json
{
  "success": true,
  "data": {
    "id": "cmp...",
    "ownerPhone": "08012345678",
    "name": "Lagos Gadgets Hub",
    "ownerName": "Ibrahim Musa",
    "businessType": "product",
    "category": "Retail",
    "state": "Lagos",
    "city": "Ikeja",
    "address": "12 Allen Avenue, Ikeja",
    "bankName": "GTBank",
    "accountNumber": "0123456789",
    "accountName": null,
    "reminderTime": "20:30",
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
    "planActivatedAt": "2026-05-26T23:09:40.750Z",
    "planExpiresAt": null,
    "isActive": true
  }
}
```

**Key fields for frontend:**
- `plan.id` → current plan identifier
- `plan.name` / `plan.label` → display tier name ("Starter", "Growth", "Premium")
- `plan.price` → monthly price in Naira
- `plan.maxTransactions` etc. → usage limits (-1 = unlimited, 0 = not allowed)
- `planActivatedAt` → when current plan started
- `planExpiresAt` → null for active plans, set when subscription lapses
- `address` → prints on invoices

---

## Step 4 — Validate Bank Account

`POST /business/bank/validate`

Validates a 10-digit NUBAN account number against a bank code.

```json
{
  "bankCode": "058",
  "accountNumber": "0123456789"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bankCode": "058",
    "accountNumber": "0123456789",
    "accountName": "CHUKWUMA OKAFOR"
  }
}
```

> Currently returns mock data. Production will call Paystack/Flutterwave's resolve API.

---

## What the Business Can Do At Each Stage

### Immediately after registration (no profile setup)

| Allowed | Not Allowed (until upgraded) |
|---------|------------------------------|
| Record sales (quick-sale) | Inventory management |
| Record expenses | Projects |
| Create contacts | Properties & bookings |
| Create invoices | Leads |
| View basic reports (dashboard, cash book) | Multi-staff |
| Track debts | Recurring invoices |
| Add 1 staff member | Maintenance & reviews |

### After profile setup

- Invoices show business name, address, and bank details professionally
- Daily reminder notifications fire at the set time
- Push notifications work if `fcmToken` is provided

### After admin upgrade (Starter → Growth/Premium)

- Admin assigns new plan via `PATCH /admin/businesses/:id/plan`
- Features unlock immediately on next request (guard re-evaluates)
- Usage limits raised immediately

---

## Plan Assignment

| Event | What Happens |
|-------|-------------|
| Registration | Auto-assigned **Starter** (free, 100 tx/month, 20 products, 1 staff) |
| Admin upgrade | `PATCH /admin/businesses/:id/plan` → Growth or Premium |
| Admin downgrade | Plan reverted, data preserved but access gated |
| Non-payment | After 7-day grace period, reverts to Starter defaults |

---

## Frontend Integration Notes

1. **Registration form** — 3 required fields (phone, PIN, business name) + 1 optional dropdown (business type)
2. **Post-registration** — token is returned immediately, no email verification, no OTP. User lands on dashboard
3. **Profile setup** — can be a one-time wizard or settings page. All fields optional
4. **Business type selection** — should offer a guided picker driven by `manifest.json` → `businessClasses`:
   - "I sell products" → retail flow
   - "I provide services" → freelancer/agency flow
   - "I do both" → hybrid flow
   - Crypto, shortlet, and food are subtypes of the above
5. **Bank validation** — call `POST /business/bank/validate` before saving bank details
6. **Push notifications** — send `fcmToken` on every app launch and token refresh
7. **Plan awareness** — check `GET /business/profile` → `planId` to know current tier. Use `manifest.json` → `features[key].plan` to show upgrade prompts
