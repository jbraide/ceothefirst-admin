# Owner ↔ Business Separation Plan

> **Status:** Draft  
> **Version:** v3 — Multi-Account Architecture  
> **Depends on:** v2 Multi-Vertical MVP (complete)

## Problem

Currently, `Business` conflates two concepts:
- **Identity** — `ownerPhone`, `pinHash`, `refreshTokenHash` (who you are)
- **Entity** — `name`, `category`, `planId`, all transaction data (what you run)

This means: **one phone number = one business**. A gadget seller who also runs a crypto side-hustle needs two phone numbers and two separate logins.

## Solution

Split into two models: `Owner` (identity) and `Business` (entity). One `Owner` can have many `Businesses`. Same login, switch between businesses.

```
Owner: 08033551708, PIN: 3084
│
├── Business A: "Lagos Gadgets Hub"   (Retail, product)
├── Business B: "BlockTrade FX"        (Financial Services, service)
└── Business C: "Pixelcraft Studio"    (Creative Agency, service)
```

## Schema Changes

### New Model: Owner

```prisma
model Owner {
  id        String     @id @default(cuid())
  phone     String     @unique
  pinHash   String
  name      String?
  refreshTokenHash String?
  createdAt DateTime   @default(now())

  businesses Business[]
}
```

### Business Model — Remove auth fields, add ownerId

Remove from Business: `ownerPhone`, `pinHash`, `refreshTokenHash`, `verificationStatus`, `verificationDocs`

Add to Business:
```prisma
  ownerId          String
  owner            Owner     @relation(fields: [ownerId], references: [id])
  verificationStatus String  @default("PENDING")
  verificationDocs   String[] @default([])
```

Keep all other fields and relations unchanged.

## Auth Flow

### Current Flow
```
POST /auth/register { phone, pin, businessName } → Business created + tokens
POST /auth/login    { phone, pin }                → Business-scoped tokens
```

### New Flow
```
Step 1: POST /auth/register { phone, pin, ownerName }
→ Owner created, no business yet
→ Returns owner-scoped token + empty businesses list

Step 2: POST /businesses { name, businessType, category }
→ Business created under owner
→ Auto-assigns Starter plan

Step 3: POST /auth/select-business { businessId }
→ Returns business-scoped token
→ All subsequent API calls use this token

Step 4: POST /auth/login { phone, pin }
→ Returns owner-scoped token + list of businesses
→ User picks which business to enter
```

### Token Structure

**Owner token (after login):**
```json
{
  "sub": "owner_id",
  "phone": "08033551708",
  "role": "OWNER",
  "businessId": null
}
```

**Business token (after select-business):**
```json
{
  "sub": "owner_id",
  "phone": "08033551708",
  "role": "OWNER",
  "businessId": "business_a_id"
}
```

All existing guards (`JwtAuthGuard`, `FeatureGuard`, `RolesGuard`, `GetBusiness`) continue to work — they only read `businessId` from the JWT. The only change is that `businessId` is now set *after* selection, not at login.

## New Endpoints

### `POST /auth/register`
```json
// Request
{ "phone": "08033551708", "pin": "3084", "ownerName": "Ibrahim Musa" }

// Response
{
  "accessToken": "owner_token",
  "refreshToken": "owner_refresh",
  "owner": { "id": "owner_id", "name": "Ibrahim Musa", "phone": "08033551708" },
  "businesses": []
}
```

### `POST /auth/login`
```json
// Request
{ "phone": "08033551708", "pin": "3084" }

// Response
{
  "accessToken": "owner_token",
  "refreshToken": "owner_refresh",
  "owner": { "id": "owner_id", "name": "Ibrahim Musa", "phone": "08033551708" },
  "businesses": [
    { "id": "biz_a", "name": "Lagos Gadgets Hub", "businessType": "product", "category": "Retail", "plan": { "name": "starter" } },
    { "id": "biz_b", "name": "BlockTrade FX", "businessType": "service", "category": "Financial Services", "plan": { "name": "starter" } },
    { "id": "biz_c", "name": "Pixelcraft Studio", "businessType": "service", "category": "Creative Agency", "plan": { "name": "starter" } }
  ]
}
```

### `POST /auth/select-business`
```json
// Request
{ "businessId": "biz_a" }

// Response
{
  "accessToken": "business_scoped_token",
  "refreshToken": "business_refresh",
  "business": { "id": "biz_a", "name": "Lagos Gadgets Hub", "businessType": "product", "category": "Retail" }
}
```

### `POST /businesses`
```json
// Request
{ "name": "My New Venture", "businessType": "service", "category": "Creative Agency" }

// Response
{
  "id": "new_biz_id",
  "name": "My New Venture",
  "businessType": "service",
  "category": "Creative Agency",
  "plan": { "name": "starter", "label": "Starter" },
  "planActivatedAt": "2026-06-01T00:00:00Z"
}
```

### `GET /businesses`
```json
// Response
{
  "businesses": [
    { "id": "biz_a", "name": "Lagos Gadgets Hub", "businessType": "product", "category": "Retail" },
    { "id": "biz_b", "name": "BlockTrade FX", "businessType": "service", "category": "Financial Services" }
  ]
}
```

## What Changes Per Layer

| Layer | Change |
|-------|--------|
| **Prisma Schema** | New `Owner` model, `ownerId` on Business, remove auth fields from Business |
| **Auth Module** | Register/login target Owner, not Business. Add `select-business`. Add `create-business` in Business module |
| **JWT** | `businessId` now set at business selection, not login |
| **Guards** | `GetBusiness` decorator reads `businessId` from JWT — already works |
| **Frontend** | Login → pick business screen → dashboard. "Add business" in settings |
| **API endpoints** | All existing endpoints unchanged — they still read `businessId` from JWT |

## What Doesn't Change

- All 16 existing modules — each already scopes by `businessId`
- Plans, features, limits — per business, unchanged
- Staff — per business, unchanged  
- Reports, dashboard, cash book — per business, unchanged
- Telegram bot — links to a business, owner can link each business separately
- Admin panel — views businesses, not owners (unchanged)

## Migration Path

1. **Create Owner model** — add to schema, `prisma db push`
2. **Migrate data** — for each existing Business, create an Owner record:
   - Copy `ownerPhone` → `Owner.phone`
   - Copy `pinHash` → `Owner.pinHash`
   - Copy `refreshTokenHash` → `Owner.refreshTokenHash`
   - Set `Business.ownerId` to the new Owner's ID
3. **Remove old fields** — drop `ownerPhone`, `pinHash`, `refreshTokenHash` from Business
4. **Update auth service** — register/login on Owner, add select-business, add create-business
5. **Update JWT strategy** — read `businessId` optionally (null for owner tokens)
6. **Update frontend** — login → business picker → dashboard

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Owner registers with no business | Gets empty token, must create a business to proceed |
| Owner has one business | Auto-select it on login (skip picker screen) |
| Owner creates duplicate business name | Allowed — business names are not unique globally |
| Business is deactivated | Still in list but marked, can't select |
| Staff login | Unchanged — staff tokens already scoped to a business |
| Telegram bot | Link code scoped to business — each business gets a separate link |
