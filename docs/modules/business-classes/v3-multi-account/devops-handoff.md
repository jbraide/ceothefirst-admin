# v3 Owner-Business Separation — DevOps Handoff

**Commit:** `44f393f`  
**Date:** 2026-05-27  
**Status:** Deployed, tested, awaiting production stability before Phase 5 drop

---

## What Changed

### Schema

| Change | Detail |
|--------|--------|
| New `Owner` model | `id`, `phone` (@unique), `pinHash`, `name`, `refreshTokenHash` |
| `Business.ownerId` | FK to Owner, required |
| `Business.ownerPhone` | No longer @unique — multiple businesses share one phone |
| Data migrated | 11 existing businesses → 11 owners created and linked |

### Auth Flow

| Old | New |
|-----|-----|
| `POST /auth/register { phone, pin, businessName }` → business token | `POST /auth/register { phone, pin, ownerName, businessName? }` → owner token + businesses list. If `businessName` provided, auto-creates first business |
| `POST /auth/login { phone, pin }` → business token | `POST /auth/login { phone, pin }` → owner token + businesses list. Response includes `owner` and `businesses[]` |
| — | **NEW** `POST /auth/select-business { businessId }` → business-scoped token |
| — | **NEW** `POST /business` → create additional business |
| — | **NEW** `GET /business` → list owner's businesses |
| PIN reset | Now on `Owner` not `Business` — same phone, same flow |

### Response Shape Change

**Login response (new):**
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "owner": { "id": "...", "name": "Ibrahim", "phone": "080..." },
  "businesses": [
    { "id": "...", "name": "Lagos Gadgets Hub", "category": "Retail", "plan": { "name": "starter" } },
    { "id": "...", "name": "BlockTrade FX", "category": "Financial Services", "plan": { "name": "starter" } }
  ]
}
```

**After select-business:**
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "business": { "id": "...", "name": "Lagos Gadgets Hub", "category": "Retail" }
}
```

### Token Structure

| Token Type | JWT Payload | Used For |
|-----------|-------------|----------|
| Owner token | `{ sub, phone, role: "OWNER" }` — no businessId | Create/list businesses, select business |
| Business token | `{ sub, phone, role: "OWNER", businessId }` | All business operations |

### Files Changed (9)

```
api/prisma/schema.prisma          — Owner model, Business.ownerId, ownerPhone no longer @unique
api/prisma/seed.ts                — findFirst instead of findUnique for demo business
api/src/auth/auth.service.ts      — register/login on Owner, selectBusiness, PIN reset on Owner
api/src/auth/auth.controller.ts   — select-business endpoint
api/src/auth/dto/register.dto.ts  — ownerName added, businessName now optional
api/src/auth/dto/select-business.dto.ts — NEW
api/src/auth/strategies/jwt.strategy.ts — handle owner tokens (no businessId)
api/src/business/business.service.ts    — createBusiness, listBusinesses
api/src/business/business.controller.ts — POST /business, GET /business
```

---

## DevOps Tasks

### Phase 5 — Drop Legacy Columns

**⚠️ DO NOT RUN until v3 has been stable in production for 24-48 hours with zero issues.**

```sql
ALTER TABLE "Business" DROP COLUMN "ownerPhone";
ALTER TABLE "Business" DROP COLUMN "pinHash";
ALTER TABLE "Business" DROP COLUMN "refreshTokenHash";
ALTER TABLE "Business" DROP COLUMN "ownerName";
```

These columns still exist as a safety net. They are no longer used by any code — all auth now queries `Owner` instead of `Business`.

### Server Restart Required

The Prisma client must be regenerated after schema changes. Run on deployment:

```bash
cd api && npx prisma generate && npm run build && pm2 restart naira-flow-api
```

---

## Frontend Tasks

| Screen | Change |
|--------|--------|
| **Login** | Response now has `owner` + `businesses[]`. If `businesses.length === 1`, auto-select. If > 1, show picker. |
| **Business Picker** | **New screen** — list businesses from login response. Tap → call `/auth/select-business`. |
| **Create Business** | **New screen** — name, businessType, category → `POST /business`. |
| **Dashboard** | Must use business-scoped token (after select-business). |
| **Settings** | Add "Switch Business" and "Add Business" options. |

---

## Backward Compatibility

- **Old login flow still works** — existing endpoints respond, just with the new response shape
- **All business endpoints unchanged** — they still read `businessId` from JWT
- **Staff login unchanged** — no impact
- **Admin panel unchanged** — no impact
- **Telegram bot** — `telegramChatId` is per-business. Multiple businesses need separate Telegram links

---

## Rollback Path

If issues arise before Phase 5 drop:

1. Redeploy pre-v3 backend code
2. `ALTER TABLE "Business" DROP COLUMN "ownerId"`
3. `DROP TABLE "Owner"`
4. `ALTER TABLE "Business" ADD UNIQUE ("ownerPhone")`
5. All original data intact

---

## Verified

- ✅ Login → owner + businesses list
- ✅ Create 3 businesses under same owner
- ✅ Select business → business-scoped token
- ✅ Dashboard with business token
- ✅ Switch between businesses
- ✅ PIN reset on Owner
- ✅ Existing businesses still accessible
- ✅ Build passes
