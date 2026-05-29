# QA Review — V3 Owner-Business Separation

**Date:** 2026-05-27  
**Reviewer:** QA Specialist  
**Scope:** Multi-business accounts — owner model, select-business flow, JWT changes  
**Commits:** `871fd1d` → `3fda904` (5 commits)  
**Files changed:** 17 files, +1,183 / −108 lines

---

## Verdict
🟡 **REQUEST CHANGES** — Two items to address. The architecture is sound; these are enforcement gaps.

---

## Architecture Summary

```
Before (v2)                           After (v3)
───────────────                       ───────────────
Business {                            Owner { id, phone, pinHash }
  ownerPhone (unique)                  Business {
  pinHash                               ownerId → Owner
}                                       ownerPhone (legacy, no unique)
                                        pinHash (legacy)
                                      }
```

**Token flow:**
1. `POST /auth/login` → owner token (`businessId: null`) + businesses list
2. `POST /auth/select-business` → business-scoped token (`businessId: set`)
3. `POST /auth/refresh` → always returns owner token (call select-business again)
4. `POST /business` → create additional businesses under the same owner

---

## Findings

### 🟡 Important

#### 1. [Security] `selectBusiness` doesn't check if the business is active

**Location:** `api/src/auth/auth.service.ts`, `selectBusiness` method.

A SUPER_ADMIN can suspend a business (`isActive = false`), but the owner can still select it via `selectBusiness` and get a working token. The query only checks ownership, not activation status:

```typescript
const business = await this.prisma.business.findFirst({
  where: { id: businessId, ownerId },
  // missing: isActive: true
});
```

**Resolution:** Add `isActive: true` to the where clause:
```typescript
where: { id: businessId, ownerId, isActive: true },
```

**Severity:** Medium — bypasses admin suspension.

---

#### 2. [Data Integrity] Major migration risk — `Business.ownerId` is non-nullable

**Location:** `api/prisma/schema.prisma`

The new `Owner` model and `Business.ownerId` (non-nullable) require a data migration to backfill existing businesses. Without it, `prisma migrate dev` on an existing database will fail because existing `Business` rows have no `ownerId`.

**Required migration steps:**
1. Create `Owner` table
2. Add `Business.ownerId` as nullable
3. For each unique `ownerPhone` in `Business`, create an `Owner` row and set `Business.ownerId`
4. Make `Business.ownerId` non-nullable
5. Drop `@unique` from `Business.ownerPhone`

The `schema-changes.md` doc should cover this. Verify it's documented and the migration SQL is committed.

**Severity:** High — deployment will fail without this migration.

---

### 🔵 Nitpicks

#### 3. [Limits] `createBusiness` doesn't check plan limits

`POST /business` creates a new business with its own Starter plan but doesn't check if the owner has hit any limit. An owner could create unlimited businesses, each getting a free Starter plan. For v1 this is acceptable (Starter is free), but should be noted for v2 when paid plans enforce business counts.

#### 4. [Behavior] Refresh tokens always return owner-level

After `selectBusiness`, the refresh token still returns an owner token (`businessId: null`). The client must call `selectBusiness` again after refreshing. This is by design but should be clearly documented for the frontend team — otherwise they'll get "No business selected" errors after refresh.

#### 5. [Legacy] `business.ownerPhone` and `business.pinHash` duplication

Every business under an owner stores a copy of the owner's phone and PIN hash. The comments say "legacy — will be removed in Phase 5." Track this so it doesn't linger indefinitely.

---

### ✅ What Looks Good

- **Owner-Business separation is clean** — `Owner` owns the identity (phone, PIN, refresh token), `Business` owns the data. One owner, many businesses.
- **Token flow is well-designed** — owner token for auth/listing businesses, business-scoped token for operations. Clear separation of concerns.
- **Login returns businesses list** — the frontend gets everything it needs in one call to render the business picker UI.
- **`register` is flexible** — allows registering without a business name (owner-only), then creating businesses later via `POST /business`.
- **JWT strategy handles null `businessId`** — returns `{ userId, businessId: null, ... }` for owner tokens. Downstream code can check for this.
- **`FeatureGuard` handles null `businessId` gracefully** — rejects with a clear message ("No business selected") if a feature is required, allows through if not.
- **Reports dashboard explicitly rejects null `businessId`** — clear error message instead of cryptic Prisma failures.
- **`RequireFeature` switched to `SetMetadata`** — standard NestJS pattern, more reliable than `Reflector.createDecorator`.
- **Telegram bot launch wrapped in try/catch** — no longer crashes the server on network issues.
- **`SelectBusinessDto` is minimal** — just `businessId`, validated with `@IsString` + `@IsNotEmpty`.
- **PIN reset moved to `Owner` model** — correct, since PIN is now an owner-level credential.

---

## Summary

Solid architecture for multi-business accounts. The owner-business separation is clean and the token flow is intuitive. Two items to address:

1. Add `isActive: true` to `selectBusiness` query to respect admin suspensions
2. Verify the data migration for `Business.ownerId` is documented and committed

After these, approved.
