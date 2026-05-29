# Schema Changes (v3)

Model-level changes for Owner ↔ Business separation.

---

## New Model: Owner

```
Owner
├── id            String @id
├── phone         String @unique    ← moves from Business
├── pinHash       String            ← moves from Business
├── name          String?           ← ownerName from Business
├── refreshTokenHash String?        ← moves from Business
├── createdAt     DateTime
└── businesses    Business[]        ← one-to-many
```

---

## Business Model Changes

### Fields Kept as Legacy (Phases 1–4)

These remain on `Business` for backward compatibility. They are populated on create but will be dropped in Phase 5:

- `ownerPhone String` — duplicated from `Owner.phone`. **`@unique` is removed** after Phase 3 migration.
- `pinHash String` — duplicated from `Owner.pinHash`
- `refreshTokenHash String?` — moved to `Owner`; unused on `Business` after v3
- `ownerName String?` — duplicated from `Owner.name`

> **Why keep them?** During the migration window, old code (pre-v3) still reads these fields. Once v3 is deployed and stable, Phase 5 drops them.

### Fields Added
- `ownerId String` — foreign key to Owner
- `owner Owner` — relation

### Fields Unchanged
All business data fields remain: `name`, `businessType`, `category`, `state`, `city`, `address`, `email`, `bankName`, `accountNumber`, `accountName`, `reminderTime`, `fcmToken`, `telegramChatId`, `isActive`, `planId`, `planActivatedAt`, `planExpiresAt`, `verificationStatus`, `verificationDocs`, `createdAt`.

All relations remain: `products`, `transactions`, `debts`, `invoices`, `staff`, `categories`, `contacts`, `leads`, `projects`, `properties`, `bookings`, `maintenanceLogs`.

---

## Migration SQL

> **⚠️ Safe deployment: No data is dropped until Phase 5. Phases 1-4 are fully reversible.**

### Phase 1 — Add Owner table (no impact on existing data)

```sql
CREATE TABLE "Owner" (
  "id" TEXT PRIMARY KEY,
  "phone" TEXT UNIQUE NOT NULL,
  "pinHash" TEXT NOT NULL,
  "name" TEXT,
  "refreshTokenHash" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);
```

### Phase 2 — Add ownerId column (nullable, no impact)

```sql
ALTER TABLE "Business" ADD COLUMN "ownerId" TEXT;
```

### Phase 3 — Migrate data (copy, don't delete)

```sql
-- For each Business, create an Owner record.
-- Uses gen_random_uuid() for IDs — new records created by Prisma will use
-- cuid() instead. Both are valid unique strings; the format difference is cosmetic.
INSERT INTO "Owner" ("id", "phone", "pinHash", "name", "refreshTokenHash", "createdAt")
SELECT gen_random_uuid(), "ownerPhone", "pinHash", "ownerName", "refreshTokenHash", "createdAt"
FROM "Business"
WHERE "ownerPhone" IS NOT NULL;

-- Link Business to Owner by matching on phone.
-- Safe because Business.ownerPhone is still @unique at this point.
UPDATE "Business" SET "ownerId" = (
  SELECT "id" FROM "Owner" WHERE "Owner"."phone" = "Business"."ownerPhone"
);

-- Verify: should return 0 rows (every business now has an ownerId)
SELECT COUNT(*) FROM "Business" WHERE "ownerId" IS NULL;
```

**Verification query:**
```sql
-- Every Business should have exactly one Owner with the same phone
SELECT b.id AS business_id, b.name, b."ownerPhone", o.id AS owner_id, o.phone
FROM "Business" b
LEFT JOIN "Owner" o ON b."ownerId" = o.id
WHERE o.id IS NULL OR b."ownerPhone" != o.phone;
-- Expected: 0 rows
```

**⚠️ STOP HERE. Deploy backend changes. Test everything.**

### Phase 4 — Enforce constraint (after verification)

```sql
ALTER TABLE "Business" ALTER COLUMN "ownerId" SET NOT NULL;
ALTER TABLE "Business" ADD CONSTRAINT fk_owner FOREIGN KEY ("ownerId") REFERENCES "Owner"("id");
```

**⚠️ STOP HERE. Run in production for 24-48 hours. Verify zero issues.**

### Phase 5 — Drop legacy columns + unique constraint (only after full verification)

```sql
-- Only run this when Phase 4 has been stable in production for 48+ hours.
-- Backend code must already be compiled without these fields.

-- First, drop the unique constraint on ownerPhone (no longer needed)
ALTER TABLE "Business" DROP CONSTRAINT IF EXISTS "Business_ownerPhone_key";

-- Then drop the legacy columns
ALTER TABLE "Business" DROP COLUMN "ownerPhone";
ALTER TABLE "Business" DROP COLUMN "pinHash";
ALTER TABLE "Business" DROP COLUMN "refreshTokenHash";
ALTER TABLE "Business" DROP COLUMN "ownerName";
```

> ❌ **Not reversible without backup.** Ensure a full DB backup exists before running Phase 5.

---

## Deployment Checklist

| Phase | Action | Verify | Reversible? |
|-------|--------|--------|-------------|
| 1 | Create Owner table | Table exists, empty | ✅ Just drop table |
| 2 | Add ownerId column | Column exists, nullable | ✅ Just drop column |
| 3 | Migrate data | Every Business has an Owner. Login still works with old code. | ✅ Remove ownerId values, drop table |
| 3b | Deploy new backend code | Login → business picker works. Existing data accessible. Old endpoints still functional. | ✅ Redeploy old code |
| 4 | Enforce NOT NULL + FK | No null ownerIds. Constraints active. | ✅ Drop constraint, make nullable |
| 5 | Drop old columns | Backend compiles without old fields. All tests pass. | ❌ Restore from backup |

---

## Indexes

### Required (add in Phase 4)

```prisma
@@index([ownerId])  // fast lookup of businesses by owner
```

### Optional (consider for Phase 5+)

```prisma
@@unique([ownerId, name])  // prevent duplicate business names per owner
```

> ⚠️ Only add `@@unique([ownerId, name])` if you've verified no existing owner has two businesses with the same name. Otherwise the migration will fail on constraint creation.

---

## Rollback Plan

| Phase | Rollback command | Data loss? |
|-------|-----------------|------------|
| 1 | `DROP TABLE "Owner"` | None |
| 2 | `ALTER TABLE "Business" DROP COLUMN "ownerId"` | None |
| 3 | Remove `ownerId` values, drop Owner table. Redeploy old code. | None — original data untouched |
| 4 | `ALTER TABLE "Business" DROP CONSTRAINT fk_owner; ALTER TABLE "Business" ALTER COLUMN "ownerId" DROP NOT NULL` | None |
| 5 | Restore from backup | ❌ Columns dropped — backup required |

---

## Backend Changes Checklist (per phase)

| Phase | Backend change |
|-------|---------------|
| 1 | No code change — schema only |
| 2 | No code change — schema only |
| 3b | Deploy v3 code: `auth.service` uses `Owner` model, JWT strategy handles null `businessId`, `FeatureGuard` rejects null on feature-required endpoints, `POST /auth/select-business` live, `POST /business` for multi-business creation |
| 4 | No code change — constraints only. Verify `selectBusiness` adds `isActive: true` filter (see [QA review](../../../qa-reviews/2026-05-27-owner-business-separation.md)). |
| 5 | Remove legacy field references from Prisma schema, DTOs, and service methods. Regenerate Prisma client. |
