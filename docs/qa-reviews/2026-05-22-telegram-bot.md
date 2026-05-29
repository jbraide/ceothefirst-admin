# QA Review — Telegram Bot Integration

**Date:** 2026-05-22  
**Reviewer:** QA Specialist  
**Scope:** Telegram bot — commands, linking, webhook, schema, docs  
**Files changed:** 11 files (4 new, 7 modified)

---

## Verdict
🟢 **APPROVED** — All issues resolved. Ready to commit.

> **Resolution log:** `transactionId` passed on credit debt, `/quick` wrapped in `prisma.$transaction`, rate-limiting claim removed from docs → replaced with "single-use only".

---

## Scope of Changes

| File | Status | Summary |
|------|--------|---------|
| `api/src/telegram/telegram.types.ts` | **New** | TypeScript interfaces: `TelegramBusinessContext`, `LinkCode` |
| `api/src/telegram/telegram.module.ts` | **New** | NestJS module wiring |
| `api/src/telegram/telegram.controller.ts` | **New** | Webhook endpoint + link-code generation endpoint |
| `api/src/telegram/telegram.service.ts` | **New** | Bot initialization, command routing, linking, message sending |
| `api/prisma/schema.prisma` | Modified | Added `telegramChatId String?` to `Business` model |
| `api/package.json` | Modified | Added `telegraf` ^4.16.3 dependency |
| `api/src/app.module.ts` | Modified | Registered `TelegramModule` |
| `api/docs/README.md` | Modified | Added Telegram link to module index |
| `api/docs/modules/telegram.md` | **New** | Full module documentation |
| `api/docs/qa-reviews/2026-05-22-telegram-bot-plan.md` | **New** | Feature plan document |
| `api/package-lock.json` | Modified | Lockfile update for telegraf |

---

## Findings

### 🟡 Important (should fix before committing)

#### 1. [Correctness] `/quick` with credit — missing `transactionId` on Debt

**Location:** `api/src/telegram/telegram.service.ts`, `/quick` command handler.

The `Debt` model likely requires a `transactionId` (the seed file always sets it). The `/quick` credit flow creates a debt without one:

```typescript
await this.prisma.debt.create({
  data: {
    businessId: biz.businessId,
    type: 'receivable',
    contactName,
    totalAmount: amount,
    paidAmount: 0,
    status: 'OPEN',
    // transactionId is missing
  },
});
```

**Action:** Verify if `transactionId` is required on the `Debt` model. If so, capture the result of the `transaction.create` call above and pass `transactionId: newTransaction.id`. If `transactionId` is optional in the schema, this is fine — but verify explicitly.

**Severity:** Medium — potential runtime error on credit sales.

**✅ Resolved:** `transactionId: txn.id` passed from the transaction created inside the `$transaction` block.

---

#### 2. [Correctness] `/quick` not wrapped in a Prisma transaction

**Location:** `api/src/telegram/telegram.service.ts`, `/quick` command handler.

The transaction create and debt create are two separate DB calls with no atomicity guarantee. If the debt creation fails after the transaction succeeds, the sale is recorded but the credit debt is silently lost.

```typescript
await this.prisma.transaction.create({ ... });   // succeeds
// If this next call fails...
await this.prisma.debt.create({ ... });           // ...this never runs
```

**Suggested fix:** Wrap in a Prisma interactive transaction:
```typescript
await this.prisma.$transaction(async (tx) => {
  const txn = await tx.transaction.create({ data: { ... } });
  if (method === 'credit') {
    await tx.debt.create({ data: { ... transactionId: txn.id ... } });
  }
  return txn;
});
```

This also solves issue #1 since the transaction ID becomes available.

**Severity:** Medium — data inconsistency risk under partial failure.

**✅ Resolved:** Entire `/quick` flow wrapped in `this.prisma.$transaction(async (tx) => { ... })`.

---

#### 3. [Missing Feature] Rate limiting on link codes is documented but not implemented

**Location:** `api/docs/modules/telegram.md` and `api/docs/qa-reviews/2026-05-22-telegram-bot-plan.md`.

Both documents state: "Rate-limited: 3 attempts per chat per hour." The code has no rate limiting — a malicious actor can send unlimited link codes without restriction.

**Action:** Either:
- Implement rate limiting (track attempts per `chatId` in memory with timestamps, reject after 3 failures in 1 hour), or
- Remove the claim from both docs and add a `// TODO: rate limit link code attempts` comment.

**Severity:** Low — 6-char alphanumeric codes with 10-min expiry already provide ~2.1B combinations. Rate limiting is a defense-in-depth measure for v2 but shouldn't be documented as present if it isn't.

**✅ Resolved:** "3 attempts per chat per hour" claim removed from both `telegram.md` and the plan doc. Replaced with "Single-use only."

---

### 🔵 Nitpicks / Suggestions

#### 4. [Resilience] In-memory link codes lost on server restart

`private linkCodes: Map<string, LinkCode>` is stored in process memory. Server restart or horizontal scaling will lose pending codes and cause link-code generation to fail across instances. Acceptable for single-instance MVP, but document as a known limitation for v2 migration to Redis or DB.

#### 5. [Edge Case] `setHours(0,0,0,0)` uses server-local time, not business timezone

`/sales` and `/balance` compute "today" with `new Date().setHours(0,0,0,0)` using the server's local timezone. If the server is UTC but the business operates in Nigeria (UTC+1), the cutoff is off by an hour. Add a TODO for timezone-aware date boundaries.

#### 6. [Typing] `any` on controller parameters

`req: any` in `webhook()` and `user: any` in `generateLinkCode()`. Consider using proper types — the `TelegramBusinessContext` interface from `telegram.types.ts` already exists.

#### 7. [Code Quality] `Math.random()` for link code generation

`Math.random().toString(36).substring(2, 8)` is not cryptographically secure. For 6-char temporary codes this is low-risk, but switching to `crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6)` is a one-liner change and removes any concern.

---

### ✅ What Looks Good

- **Architecture** — lives inside the existing API, no separate server, no new database tables (just one nullable column). Exactly as planned.
- **Webhook + long-polling fallback** — `registerWebhook()` for production, `bot.launch()` for dev. Single code path via `handleUpdate()` for both modes.
- **Linking flow** — clean separation: unlinked users get prompts, linked users get data. `getBusiness()` enforces this at every command entry point.
- **Link code expiry** — dual mechanism: `expiresAt` check on validation + `setTimeout` cleanup. No stale codes accumulate.
- **`/quick` parsing** — handles missing name with a sensible default, validates amount and method. Good UX.
- **Webhook secret validation** — skipped when `TELEGRAM_WEBHOOK_SECRET` is not set (dev mode), enforced when set (production). Well documented.
- **`/debt` queries parallelized** — `Promise.all` for receivables and payables.
- **No sensitive data exposed** — bot only sends summaries (counts + totals), never full transaction lists.
- **`telegramChatId` is nullable** — existing businesses and new registrations unaffected by the migration.
- **Documentation** — comprehensive. Linking flow diagram, command reference table, security table, frontend implementation notes, env var table.
- **Package choice** — `telegraf` v4 is the standard Telegram bot framework for Node.js. Well-maintained, lightweight.

---

## Summary

The bot is well-structured, the linking flow is secure, and the commands cover the right MVP surface. Three items to fix before committing:

1. Pass `transactionId` to debt on `/quick` credit (or verify it's optional in the schema)
2. Wrap `/quick` transaction + debt creation in a Prisma `$transaction` for atomicity
3. Either implement link-code rate limiting or remove the claim from the docs

After these, approved for merge.
