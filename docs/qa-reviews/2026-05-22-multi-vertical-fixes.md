# QA Review — Multi-Vertical MVP Fixes

**Date:** 2026-05-22  
**Reviewer:** QA Specialist  
**Commit:** `9899f3f` — "fix: address, plan details, expenses, bookings, dashboard"  
**Files changed:** 6 files, +99 / −8 lines

---

## Verdict
🟢 **APPROVED** — Clean fix commit. No blockers.

---

## Changes Analyzed

| File | Change | Assessment |
|------|--------|------------|
| `api/prisma/schema.prisma` | Added `address String?` to `Business` | ✅ Simple, nullable, no migration risk |
| `api/src/bookings/bookings.service.ts` | Auto-set `paymentStatus` on create; wrap update in `$transaction`; create payment transactions on amount increases | ✅ Correct financial tracking |
| `api/src/business/business.service.ts` | Include `plan` details in `getProfile` response | ✅ Frontend needs this for subscription UI |
| `api/src/business/dto/update-business.dto.ts` | Removed `planType` from update DTO | ✅ Security — prevents self-plan-upgrade |
| `api/src/reports/reports.service.ts` | Low stock query filters `trackStock = true` | ✅ Excludes non-tracked products (menu items) |
| `api/src/transactions/transactions.service.ts` | Expenses set `amountPaid: dto.amount` | ✅ Fixes reporting — expenses now show as fully paid |

---

## Findings

### 🔵 Nitpicks

#### 1. Bookings update — payment transaction hardcodes `paymentMethod: 'transfer'`

When a payment increase triggers a transaction, `paymentMethod` is always `'transfer'`. If the guest pays via cash or another method, this won't reflect reality.

**Severity:** Low — acceptable default for v1. Can add a `paymentMethod` field to the update DTO later.

#### 2. Bookings create — payment status auto-set doesn't call usage limits

`create()` doesn't check `usageLimits.checkTransactionLimit`, but since no transaction is created on create (only on update when payment increases), this is currently fine. If transactions are ever created on create, the limit check should be added.

**Severity:** Low — no impact in current code path.

---

### ✅ What Looks Good

- **Booking update wrapped in `$transaction`** — payment status update, transaction creation, and booking update are all atomic. No partial failures.
- **Payment status auto-computed** — `paid` when fully paid, `part_payment` when partially paid. Correct logic for both create and update paths.
- **Payment delta transactions** — when `amountPaid` increases, a transaction is created for the *difference*, not the full amount. Correct accounting.
- **`planType` removed from update DTO** — businesses can no longer set their own plan type. Plan changes are admin-only. Good security posture.
- **Low stock report fix** — `trackStock = true` filter correctly excludes food delivery menu items and other non-tracked products from low-stock counts.
- **Expense `amountPaid` fix** — previously defaulted to `0`, now correctly set to the expense amount. Fixes cash book and balance calculations.
- **Business profile returns plan** — includes `id`, `name`, `label`, `price`, and all limit fields. Everything the frontend needs for a subscription/upgrade screen.

---

## Summary

Clean, well-scoped fix commit. Every change addresses a concrete issue — no unnecessary refactoring. The booking payment tracking is the most impactful change, properly recording payment inflows as transactions. Approved for push.
