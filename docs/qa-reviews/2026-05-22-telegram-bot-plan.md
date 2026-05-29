# Telegram Bot Integration Plan

**Date:** 2026-05-22  
**Status:** Draft — awaiting approval

---

## Overview

A Telegram bot lets businesses interact with NairaFlow without opening the app — record a quick sale, check today's balance, see who owes them money. The bot runs inside the existing NestJS API (no separate service), using Telegram's webhook mechanism.

---

## Architecture

```
Telegram Servers
       │
       │  HTTPS webhook
       ▼
┌──────────────────────────────┐
│  POST /api/v1/telegram/webhook│  ← single entry point
└──────────┬───────────────────┘
           │
     ┌─────▼─────┐
     │  Telegram  │  ← new module
     │  Service   │
     │            │
     │  • Routes commands
     │  • Authenticates users
     │  • Calls existing services
     └─────┬──────┘
           │
     ┌─────▼─────┐
     │  Business  │  ← existing modules
     │  Transaction│
     │  Debts     │
     └────────────┘
```

- **Webhook, not polling** — the bot registers a single webhook URL with Telegram. Telegram POSTs updates to us. No polling loop, no extra process.
- **No new database table needed** — we add a `telegramChatId` string field to the existing `Business` model. That's it.
- **Stateless** — the bot doesn't hold sessions. Every message carries the chat ID; we look up which business it belongs to.

---

## How Businesses Link Their Telegram

A business needs to prove they own a Telegram account before the bot will respond with financial data. The flow:

```
1. Business owner opens NairaFlow app → Settings → "Connect Telegram"
2. App shows: "Message @NairaFlowBot with code: BLUE-FISH-42"
3. Owner sends "BLUE-FISH-42" to the bot on Telegram
4. Bot validates the code, stores chatId on the Business record
5. Bot replies: "✅ Linked! Type /help to get started."
```

The link code is generated on-demand, stored temporarily, and expires after 10 minutes. This prevents anyone from claiming a business's Telegram link.

---

## Supported Commands

### Phase 1 — Essential (MVP)

| Command | What it does |
|---------|-------------|
| `/start` | Welcome message, shows link instructions if not linked |
| `/help` | Lists all available commands |
| `/sales` | Today's sales count + total (e.g., "📊 Today: 5 sales, ₦45,000") |
| `/balance` | Cash balance: total sales − total expenses today |
| `/debt` | Who owes you money (receivables) and who you owe (payables) |
| `/quick` | Quick-sale shortcut — message format: `/quick 2000 cash Walk-in customer` |
| `/link CODE` | Link this Telegram account to a business (alternative to the app flow) |

### Phase 2 — Notifications (via BullMQ)

| Notification | Trigger |
|-------------|---------|
| Daily summary | Every evening at reminder time — today's sales, expenses, debt reminders |
| Debt due alert | When a debt's `dueDate` is today or overdue |
| Low stock alert | When a product drops below `lowStockThreshold` |
| Large transaction | When a sale exceeds a configurable threshold |

These reuse the existing BullMQ infrastructure already in the project for SMS.

---

## Implementation Plan

### Phase 1 — Core bot (1 file, ~200 lines)

**New dependency:** `telegraf` (most popular Telegram bot framework for Node.js, ~300k weekly downloads)

```
npm install telegraf
```

**New files:**

| File | Purpose |
|------|---------|
| `src/telegram/telegram.module.ts` | NestJS module |
| `src/telegram/telegram.service.ts` | Command routing, business logic |
| `src/telegram/telegram.controller.ts` | Single webhook endpoint |
| `src/telegram/telegram.types.ts` | TypeScript types for bot context |

**Schema change:**

```prisma
model Business {
  // ... existing fields ...
  telegramChatId  String?  // Telegram chat ID, null = not linked
}
```

**Environment variable:**

```
TELEGRAM_BOT_TOKEN=your_token_here
TELEGRAM_WEBHOOK_SECRET=a_random_secret_for_webhook_auth
```

**Webhook registration:** On app startup, the TelegramService calls `telegram.setWebhook('https://api.nairaflow.com/api/v1/telegram/webhook')` with the webhook URL. In dev, we use a tunnel (ngrok) since Telegram needs a public HTTPS URL.

### Phase 2 — Notifications (~100 lines)

Add a `TelegramNotificationService` that:
- Accepts `businessId` + `message` 
- Looks up `telegramChatId`
- Sends via `bot.telegram.sendMessage(chatId, message)`
- Queued via BullMQ like SMS notifications

### Phase 3 — Deep linking + rich UI

- Inline keyboards for common actions ("Mark as paid", "View details")
- `/report` command with daily/weekly/monthly options
- `/invoice` to create an invoice from Telegram
- Link code generation via API endpoint

---

## Security

| Concern | Mitigation |
|---------|-----------|
| Anyone can send messages to the bot | Every command checks: is this `chatId` linked to a business? Unlinked users get the link instructions. |
| Webhook spoofing | Telegram sends a `X-Telegram-Bot-Api-Secret-Token` header. We validate it against `TELEGRAM_WEBHOOK_SECRET`. |
| Brute-force link codes | Codes are 6-character alphanumeric, expire in 10 minutes, and are single-use only. |
| Sensitive data in chat | Telegram chats are encrypted, but we never send full transaction lists — only summaries. |
| Bot token in code | Token is in environment variables only, never committed. |

---

## What this does NOT require

- ❌ No separate server or microservice
- ❌ No new database tables (just one column)
- ❌ No auth changes (linking is separate from login)
- ❌ No frontend changes (the bot is standalone; linking can be added to the app later)
- ❌ No new BullMQ queues (reuses existing notification queue)

---

## Summary

| Phase | What | New files | Lines | Time |
|-------|------|-----------|-------|------|
| 1 | Core bot: commands, linking, webhook | 4 | ~200 | 2–3 hr |
| 2 | Notifications via BullMQ | 1 | ~100 | 1 hr |
| 3 | Deep linking, inline keyboards, reports | 2 | ~200 | 2 hr |
| Schema | `telegramChatId` on Business | 0 (migration only) | 1 line | 5 min |
| **Total** | | **7 files** | **~500** | **~5 hr** |

The bot lives alongside the existing API — same process, same database, same auth. The only new dependency is `telegraf`.
