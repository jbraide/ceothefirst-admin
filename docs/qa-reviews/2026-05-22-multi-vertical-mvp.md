# QA Review — Multi-Vertical MVP

**Date:** 2026-05-22  
**Reviewer:** QA Specialist  
**Scope:** Full multi-vertical MVP — 5 business classes, 23 models, 18 modules  
**Files changed:** 65 files, +3,696 / −14 lines

---

## Verdict
🟢 **APPROVED** — All issues resolved in follow-up commit `4c1c7a2`.

> **Resolution log:** Cache TODO added to FeatureGuard, `deleteMany` reviews before booking delete, property status reset to "available" on cancellation.

---

## Scope of Changes

### New Models (8)
`Lead`, `Project`, `ProjectTask`, `Property`, `Booking`, `Maintenance`, `Review`, `SubscriptionPlan`, `Feature`, `PlanFeature`

### New Modules (5)
`bookings`, `leads`, `projects`, `properties`, `maintenance`, `reviews`

### Enhanced Modules
`admin` (plan/feature management), `transactions` (usage limits, salesChannel, discount, expenseStatus), `auth` (auto-assign starter plan, businessType on register), `contacts` (source, contactStatus), `inventory` (status, deliveryTimeline), `invoices` (recurring, projectId), `reports` (expanded summaries)

### Infrastructure
`FeatureGuard` — feature-gating by plan; `UsageLimitsService` — plan limit enforcement; `SubscriptionPlan` assignments on registration

---

## Findings

### 🟡 Important

#### 1. [Performance] `FeatureGuard` does a DB lookup on every guarded request

**Location:** `api/src/common/guards/feature.guard.ts`

Every request to a feature-gated endpoint triggers a DB query loading the business, its plan, and all enabled features with their feature definitions. For endpoints with high call volume (e.g., transactions, products), this adds latency to every single request.

```typescript
const biz = await this.prisma.business.findUnique({
  where: { id: business.businessId },
  include: {
    plan: {
      include: {
        features: {
          where: { isEnabled: true },
          include: { feature: true },
        },
      },
    },
  },
});
```

**Suggested fix:** Cache at minimum for the request lifetime (plan doesn't change mid-request). Better: cache plan + features in-memory with a short TTL (e.g., 60s) and invalidate on plan change. For v1, at least add a `// TODO: cache plan features` comment.

**Severity:** Medium — latency impact scales with endpoint usage.

**✅ Resolved:** Added `// TODO: Cache plan + features` with implementation options (in-memory Map, Redis).

---

#### 2. [Data Integrity] Booking `remove` endpoint can leave orphaned reviews

**Location:** `api/src/bookings/bookings.service.ts`, `remove` method.

The `Review` model references `Booking` but has no `onDelete: Cascade`:

```prisma
model Review {
  bookingId  String
  booking    Booking   @relation(fields: [bookingId], references: [id])
  // no onDelete: Cascade
}
```

When `bookingsService.remove()` calls `prisma.booking.delete()`, it will fail with a foreign key constraint error if the booking has associated reviews.

**Resolution:** Either:
- Add `onDelete: Cascade` to `Review.booking` relation in the schema, or
- Delete associated reviews before deleting the booking in `remove()`

**Severity:** Medium — runtime error on delete if reviews exist.

**✅ Resolved:** `prisma.review.deleteMany({ where: { bookingId: id } })` called before `prisma.booking.delete()`.

---

#### 3. [Data Integrity] `cancel` method doesn't update property status back to "available"

**Location:** `api/src/bookings/bookings.service.ts`, `cancel` method.

When a booking is created, the property is auto-set to `"occupied"`. But when `cancel()` is called, the property status is not updated back to `"available"`. This leaves the property in a permanently occupied state after a cancellation.

**Resolution:** After updating the booking status to `"cancelled"`, check if the property has any other non-cancelled bookings. If not, set property status back to `"available"`:

```typescript
const remaining = await this.prisma.booking.count({
  where: {
    propertyId: booking.propertyId,
    status: { not: 'cancelled' },
    id: { not: id },
  },
});
if (remaining === 0) {
  await this.prisma.property.update({
    where: { id: booking.propertyId },
    data: { status: 'available' },
  });
}
```

**Severity:** Medium — incorrect property availability state.

**✅ Resolved:** After cancellation, checks `booking.count({ propertyId, status: { not: 'cancelled' } })`. If zero, sets property status to `"available"`.

---

### 🔵 Nitpicks

#### 4. [Security] No DTO validation on admin plan/feature endpoints

`@Body() body: any` on `createPlan`, `updatePlan`, `createFeature`, `updateFeature`. SUPER_ADMIN could send malformed data that bypasses type safety. For internal admin endpoints this is low risk, but still worth adding basic DTOs with `@IsString`, `@IsNumber` validators on critical fields like `price`, `name`.

#### 5. [Time Zone] `UsageLimitsService.startOfMonth()` uses local time

Same `setHours(0,0,0,0)` pattern as the Telegram bot. Monthly transaction limits will reset at server-local midnight on the 1st, not necessarily the business's timezone. Low impact for v1.

#### 6. [UX] Bookings auto-sets property to "occupied" immediately on future bookings

When a booking is created for a future date, the property immediately shows as `"occupied"`. Consider only updating status when `checkIn` is today or in the past, or adding a separate `"booked"` status for future reservations.

#### 7. [Resilience] Silent skip if Starter plan doesn't exist on registration

`auth.service.ts` silently skips plan assignment if `starterPlan` is null. This is a reasonable fallback, but the business will have no plan and all feature-gated endpoints will fail with "No subscription plan assigned." Consider logging a warning at minimum.

---

### ✅ What Looks Good

- **Schema design** — 10 new models, all properly indexed, foreign keys correct, sensible defaults. The `PlanFeature` composite unique `@@unique([planId, featureId])` is the right pattern for many-to-many with metadata.
- **Overlapping booking detection** — standard `checkIn < end AND checkOut > start` algorithm. Correct.
- **Usage limits integration** — `UsageLimitsService` is injected into `TransactionsService` and `ProjectsService` and checked before creates. Consistent pattern.
- **Auto-assign starter plan on registration** — businesses get immediate access to core features without manual setup.
- **Feature flag system** — `FeatureGuard` + `RequireFeature` decorator provides declarative feature gating. Clean API.
- **Subscription plan management in admin** — full CRUD for plans, features, and plan-feature toggles. SUPER_ADMIN can configure the product without code changes.
- **Seed file** — now seeds 3 tiers of plans + 28 features across 5 categories. Staff uses `upsert` for idempotency. Comprehensive dev setup.
- **Existing modules enhanced, not rewritten** — `salesChannel`, `discount`, `expenseStatus` fields added to existing DTOs and service methods. Backward compatible (all nullable/optional).
- **Three test scripts** — `test-retail.sh`, `test-food-delivery.sh`, `test_shortlet.sh` provide end-to-end smoke tests for each vertical.
- **Documentation** — 7 new user guides (`retail-guide.md`, `food-guide.md`, etc.) plus `subscription-plan.md` and `unified-schema-plan.md`.

---

## Summary

Massive, well-structured commit. The multi-vertical architecture is clean — each business class gets its own module with shared infrastructure (FeatureGuard, UsageLimitsService). Three items to address:

1. Add a cache TODO on `FeatureGuard` to avoid per-request DB lookups
2. Fix `BookingsService.remove()` to handle orphaned reviews (or add cascade)
3. Update property status back to "available" on booking cancellation

After these, approved.
