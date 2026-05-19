# QA Review — Admin Analytics Expansion + Controller Fixes

**Date:** 2025-05-18  
**Reviewer:** QA Specialist  
**Branch/Changes:** Uncommitted changes to `admin.controller.ts`, `admin.service.ts`, `admin-feature-summary.md`, `modules/admin.md`  
**Files changed:** 4 files, +1193 / −121 lines

---

## Verdict
🟡 **REQUEST CHANGES** — No critical blockers, but there are issues that should be addressed before committing (one potential data inconsistency, one missing edge case in response shape), plus several important performance and code-quality recommendations.

---

## Scope of Changes

| File | Summary |
|------|---------|
| `api/src/admin/admin.controller.ts` | Added 6 new analytics endpoints; improved pagination pipe pattern; added input validation for `globalSearch`; made `verifyBusiness` async with audit logging |
| `api/src/admin/admin.service.ts` | Added 6 new analytics service methods; formatting fixes; improved `getTopBusinesses` and `getCategoryDistribution` response mapping; added `select` clause to `globalSearch`; added `contacts` to `_count` in `getBusinessDetail` |
| `api/docs/admin-feature-summary.md` | Expanded analytics section with acquisition, engagement, financial, and performance subcategories |
| `api/docs/modules/admin.md` | Complete API reference rewrite: auth flow, error handling, all endpoint shapes with frontend notes |

---

## Findings

### 🟡 Important (should fix before committing)

#### 1. [Correctness] `admin.service.ts` — `getAverageVolumePerBusiness` returns inconsistent shape

**Location:** `api/src/admin/admin.service.ts`, early return at the `totalBusinesses === 0` guard.

When `totalBusinesses === 0`, the method returns `{ arpu: 0 }`, but the normal path returns `{ totalBusinesses, totalVolume, arpu }`. The frontend documentation (and the API spec in `modules/admin.md`) states the response always has all three fields. An early return of just `{ arpu: 0 }` will cause a frontend crash or `NaN` display when trying to access `data.totalBusinesses` or `data.totalVolume`.

**Suggested fix:**
```typescript
// Before
if (totalBusinesses === 0) return { arpu: 0 };

// After
if (totalBusinesses === 0) return { totalBusinesses: 0, totalVolume: 0, arpu: 0 };
```

**Severity:** Medium — will break frontend in edge case (zero active businesses).

---

#### 2. [Observability] `admin.controller.ts` — No error handling around `logAction` call

**Location:** `api/src/admin/admin.controller.ts`, `verifyBusiness` method.

If `logAction` fails (e.g., DB connectivity issue, constraint violation), the exception propagates to the client as a 500 error, even though the `verifyBusiness` mutation already succeeded. This creates a scenario where:

- The business status is updated successfully
- No audit trail exists for the action
- The admin sees an error, making them unsure whether to retry

**Suggested fix:**
```typescript
const result = await this.adminService.verifyBusiness(id, status, notes);
try {
  await this.adminService.logAction(
    admin.userId,
    'BUSINESS_VERIFICATION',
    id,
    `Set verificationStatus to ${status}${notes ? ` — ${notes}` : ''}`,
  );
} catch (err) {
  // Log failure but don't fail the request — the business was already updated
  console.error('Failed to write audit log for verifyBusiness:', err);
}
return result;
```

**Severity:** Medium — data inconsistency risk under failure conditions.

---

#### 3. [Performance] `admin.service.ts` — `getFeatureAdoption` runs 3 independent queries sequentially

**Location:** `api/src/admin/admin.service.ts`, `getFeatureAdoption` method.

The three `COUNT(DISTINCT "businessId")` queries against `Invoice`, `StaffMember`, and `Debt` are fully independent and should run in parallel with `Promise.all`. Currently they execute sequentially (~3x slower at DB round-trip latency).

**Suggested fix:**
```typescript
let usingInvoices = 0, usingStaff = 0, usingDebts = 0;

if (totalBusinesses > 0) {
  const [inv, staff, debt] = await Promise.all([
    this.prisma.$queryRaw`SELECT COUNT(DISTINCT "businessId")::int as count FROM "Invoice"`,
    this.prisma.$queryRaw`SELECT COUNT(DISTINCT "businessId")::int as count FROM "StaffMember"`,
    this.prisma.$queryRaw`SELECT COUNT(DISTINCT "businessId")::int as count FROM "Debt"`,
  ]);
  usingInvoices = (inv as any[])[0]?.count || 0;
  usingStaff = (staff as any[])[0]?.count || 0;
  usingDebts = (debt as any[])[0]?.count || 0;
}
```

**Severity:** Low — functional but wasteful under load.

---

### 🔵 Nitpicks / Suggestions (non-blocking improvements)

#### 4. [Code Quality] `admin.controller.ts` — `any` type for `@GetBusiness()` parameter

The `admin` parameter in `verifyBusiness` is typed as `any`. Since the JWT strategy (`jwt.strategy.ts`) returns a known shape for admin users, consider defining an interface:

```typescript
interface AdminUser {
  userId: string;
  businessId: 'SYSTEM';
  email: string;
  role: 'SUPER_ADMIN';
}
```

This would provide compile-time safety when accessing `admin.userId`.

---

#### 5. [Code Quality] `admin.service.ts` — `getTopBusinesses` optional chaining

`Number(r._sum.amount || 0)` is safe in practice because `_sum` is always present in Prisma `groupBy` results, but `Number(r._sum?.amount ?? 0)` would be more defensive and idiomatic TypeScript.

---

#### 6. [Security / Code Quality] `admin.service.ts` — Console.log left in notification methods (pre-existing)

```typescript
console.log(`Broadcasting to ${tokens.length} tokens: ${title}`);
console.log(`Sending targeted notification to ${business.fcmToken}: ${title}`);
```

Logging FCM tokens to stdout is a privacy concern. Replace with a proper logger at `debug` level or use the NestJS `Logger` service. Not introduced by this diff but worth cleaning up while touching this file.

---

#### 7. [Naming] `get-business.decorator.ts` — Misleading decorator name

The `@GetBusiness()` decorator actually returns `request.user` (the authenticated user), not a business entity. This is confusing in the admin context where the user is a `SuperAdmin`, not a business. Consider renaming to `@GetUser()` in a follow-up refactor. Not introduced by this diff.

---

## ✅ What Looks Good

- **Comprehensive API documentation** in `modules/admin.md` — auth flow, error formats, all endpoint shapes, frontend implementation notes. This is exactly what a frontend team needs to integrate without guesswork.
- **Input validation on `globalSearch`** — rejecting empty/whitespace-only queries with a clear 400 `BadRequestException` is the right call.
- **`DefaultValuePipe` + `ParseIntPipe` pattern** for pagination params — cleaner and more idiomatic than the old `ParseIntPipe({ optional: true })` + default value fallback.
- **New analytics methods are well-structured** — each does one thing, uses appropriate Prisma queries (raw SQL where aggregation is needed, `groupBy` where simpler), and returns cleanly shaped data.
- **`verifyBusiness` now creates an audit trail** — closing a critical observability gap.
- **No new dependencies introduced** — all imports are from existing NestJS packages or internal modules.
- **No SQL injection risks** — all `$queryRaw` calls use template literals with Prisma's safe parameterization (Date objects are properly handled by the driver).

---

## Summary

The diff adds 6 well-designed analytics endpoints (signups growth, verification funnel, active businesses, feature adoption, platform debt, average volume), improves input validation on `globalSearch`, and closes an audit-logging gap in `verifyBusiness`. 

**Three items to address before committing:**
1. Fix inconsistent return shape in `getAverageVolumePerBusiness` when zero active businesses
2. Wrap `logAction` in try/catch to avoid audit trail loss on logging failure
3. Parallelize the 3 independent queries in `getFeatureAdoption` with `Promise.all`

The documentation is excellent and the code structure is clean. After these fixes, this is good to merge.
