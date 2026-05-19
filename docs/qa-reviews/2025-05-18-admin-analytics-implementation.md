# QA Review — Admin Analytics Expansion Implementation

**Date:** 2025-05-18  
**Reviewer:** QA Specialist  
**Scope:** Phase 1–3 implementation — `analytics.utils.ts`, `admin.controller.ts`, `admin.service.ts`  
**Files changed:** 3 files (1 new, 2 modified)

---

## Verdict
🟡 **REQUEST CHANGES** — Two issues to fix. Otherwise clean implementation, all plan amendments applied correctly.

---

## Scope of Changes

| File | Status | Summary |
|------|--------|---------|
| `api/src/admin/analytics.utils.ts` | **New** | Shared utilities: `resolveTimeRange`, `buildCategoryFilter`, `clampLimit`, `computeDelta` |
| `api/src/admin/admin.controller.ts` | Modified | All analytics endpoints now accept `range`, `category`, and `limit` query params; 3 new endpoints added |
| `api/src/admin/admin.service.ts` | Modified | All analytics methods retrofitted with time range + category filter; 3 new methods added |

---

## Findings

### 🟡 Important (should fix before committing)

#### 1. [Performance] `getComparison` — 8 sequential DB queries

**Location:** `api/src/admin/admin.service.ts`, `getComparison` method.

All 8 queries run sequentially — one after another. Four are for the current period, four for the previous. These are pairwise independent and should run in parallel. Currently it's 8 sequential round-trips to the database.

**Suggested fix:** Use `Promise.all`:
```typescript
const [
  [currentRevenueResult, previousRevenueResult],
  [currentTxnResult, previousTxnResult],
  [currentSignupsResult, previousSignupsResult],
  [currentActiveResult, previousActiveResult],
] = await Promise.all([
  Promise.all([currentRevenueQuery, previousRevenueQuery]),
  Promise.all([currentTxnQuery, previousTxnQuery]),
  Promise.all([currentSignupsQuery, previousSignupsQuery]),
  Promise.all([currentActiveQuery, previousActiveQuery]),
]);
```

This cuts 8 sequential round-trips to 1.

**Severity:** Medium — works correctly but adds unnecessary latency.

---

#### 2. [Consistency] `getTransactionsVolume` duplicates `buildCategoryFilter` logic

**Location:** `api/src/admin/admin.service.ts`, `getTransactionsVolume` method.

Every other analytics method uses the shared `buildCategoryFilter` utility. `getTransactionsVolume` rolls its own business-ID lookup instead:

```typescript
let categoryIds: string[] | null = null;
if (category) {
  const businesses = await this.prisma.business.findMany({
    where: { category },
    select: { id: true },
  });
  categoryIds = businesses.map((b) => b.id);
  if (categoryIds.length === 0) return [];
}
```

**Suggested fix:** Use `buildCategoryFilter` like the other endpoints. This also gains the `__no_match__` sentinel logic for free instead of the early `return []`, and keeps the codebase consistent.

**Severity:** Low — functional but inconsistent and duplicates code.

---

### 🔵 Nitpick

#### 3. [Edge Case] `getComparison` with `range=all`

When `range=all`, `currentWindow.start` is `new Date(0)` (Unix epoch: Jan 1, 1970). The previous period calculation then produces a start date before 1970. Since no data exists before epoch, the previous period will return zeros — functionally correct but the date strings in the response will show 1969 dates, which could look odd in the UI.

No action needed for now, just something to be aware of. If it becomes a concern, add a guard that returns `null` for the previous period when `range=all`.

---

## Plan Amendments — Verification

All 5 amendments from the [expansion plan review](./2025-05-18-admin-analytics-expansion-plan.md) were applied correctly:

| # | Amendment | Status |
|---|-----------|--------|
| 1 | `active-businesses` keeps `{ dau, mau }` shape — `dau` fixed at 24h, `mau` varies by `range` | ✅ Done |
| 2 | `platform-debt` drops `range` — only accepts `category` | ✅ Done |
| 3 | `computeDelta` handles division by zero — returns `null` for `deltaPercent` when `previous` is 0 | ✅ Done |
| 4 | `transactions-volume` uses `total` not `totalAmount` for field consistency | ✅ Done |
| 5 | `top-businesses` capped at 100 via `clampLimit(limit, 10, 100)` | ✅ Done |

---

## ✅ What Looks Good

- **`analytics.utils.ts`** — clean, well-typed, edge-case-aware. `resolveTimeRange` defaults invalid ranges to `30d`. `buildCategoryFilter` uses a `__no_match__` sentinel when a category has zero businesses. `computeDelta` correctly handles zero-previous with `null` fallback.
- **`getRevenueByCategory`** — LEFT JOIN with COALESCE correctly includes categories with zero transaction activity, matching the spec.
- **`getComparison` previous period calculation** — `end: new Date(currentWindow.start.getTime() - 1)` avoids period overlap. Correct.
- **`buildCategoryFilter` + `Prisma.join`** — clean integration between the utility and raw SQL endpoints.
- **All raw SQL is parameterized** — Prisma template literal interpolation, `Prisma.join()`, and `Prisma.sql` conditionals are all injection-safe.
- **Backward compatibility preserved** — all existing endpoints default to `30d` range and optional `category`, matching current behavior.
- **No new dependencies** — `Prisma` and `PrismaService` are the only new imports, both already in the project.
- **`resolveTimeRange` import in controller** — it's imported but appears unused in the controller itself (logic is delegated to the service). Consider removing if not needed, or keep if planned for validation. Not a blocker.

---

## Summary

The implementation is solid and follows the approved plan faithfully. All 5 amendments were applied correctly, the utility layer is clean, and there are no security concerns. Two fixes before committing:

1. Parallelize the 8 queries in `getComparison` with `Promise.all`
2. Switch `getTransactionsVolume` to use the shared `buildCategoryFilter`

After these, approved for merge.
