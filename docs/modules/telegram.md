# Telegram Bot Module

The Telegram module allows businesses to interact with NairaFlow through a Telegram bot — check sales, record quick transactions, view balances, and receive notifications — all without opening the app.

---

## 🔗 How Linking Works

A business must link their Telegram account before the bot responds with financial data. The flow:

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│  NairaFlow   │         │   NairaFlow  │         │   Telegram   │
│  Mobile App  │         │     API      │         │     Bot      │
└──────┬───────┘         └──────┬───────┘         └──────┬───────┘
       │                        │                        │
       │ 1. Tap "Connect        │                        │
       │    Telegram"           │                        │
       │───────────────────────►│                        │
       │                        │                        │
       │ 2. POST /telegram/     │                        │
       │    link-code           │                        │
       │◄───────────────────────│                        │
       │    { code: "FKDT38" }  │                        │
       │                        │                        │
       │ 3. Show user: "Send    │                        │
       │    FKDT38 to @Bot"     │                        │
       │                        │                        │
       │                        │  4. User sends "FKDT38"│
       │                        │◄───────────────────────│
       │                        │                        │
       │                        │  5. Bot validates code │
       │                        │     Stores chatId on   │
       │                        │     Business record    │
       │                        │───────────────────────►│
       │                        │     "✅ Linked!"       │
       │                        │                        │
```

**Link codes:**
- Generated via `POST /telegram/link-code` (requires business auth)
- 6 characters, alphanumeric, case-insensitive
- Expire after 10 minutes
- One-time use — consumed on successful link

---

## 📡 API Reference

### Generate Link Code

**`POST /api/v1/telegram/link-code`**

Generates a one-time code that the business owner sends to the Telegram bot to link their account.

**Auth:** Requires business Bearer token (not admin, not staff).

**No request body.**

**Response (`data`):**
```json
{
  "code": "FKDT38",
  "expiresIn": "10 minutes"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `code` | `string` | 6-char code to send to the Telegram bot |
| `expiresIn` | `string` | Human-readable expiry |

**Status:** `201`
**Error:** `401` if not authenticated as a business

### Telegram Webhook

**`POST /api/v1/telegram/webhook`**

Receives updates from Telegram servers. Not called by the frontend — this is Telegram's callback.

**Headers:** `x-telegram-bot-api-secret-token` — validated against `TELEGRAM_WEBHOOK_SECRET` env var.

**Status:** `200`
**Error:** `401` if secret token is invalid

---

## 🤖 Bot Commands

Once linked, the business owner can use these commands in Telegram:

| Command | Example | Response |
|---------|---------|----------|
| `/start` | — | Welcome message or link instructions |
| `/help` | — | Lists all commands |
| `/sales` | — | `📊 Today's Sales: 5 sales, ₦45,000` |
| `/balance` | — | `💰 Today's Balance: +₦45,000 sales, −₦5,000 expenses` |
| `/debt` | — | `💳 Owed to you: ₦12,000 | You owe: ₦3,000` |
| `/quick 2000 cash Walk-in` | Record a cash sale | `✅ Sale recorded! ₦2,000 cash — Walk-in` |
| `/quick 5000 credit Jane` | Record a credit sale | `✅ Sale recorded! ₦5,000 credit — Jane` (auto-creates debt) |
| `/link FKDT38` | Link business | `✅ Linked! Type /help to see commands.` |

**Unlinked users** see a message prompting them to link their business. No financial data is exposed until linked.

**Quick sale notes:**
- Amount must be a positive number
- Payment method: `cash`, `transfer`, or `credit`
- `credit` automatically creates a `receivable` debt
- Customer name is everything after the method (can include spaces)

---

## 🔐 Security

| Concern | Protection |
|---------|-----------|
| Anyone can message the bot | Only linked businesses get financial data; unlinked users see a link prompt |
| Brute-force link codes | 6-char alphanumeric = 2.1 billion combinations. Codes expire in 10 minutes. Single-use only. |
| Webhook spoofing | `x-telegram-bot-api-secret-token` header validated on every webhook call |
| Financial data exposure | Bot only sends summaries (counts + totals), never full transaction lists |
| Bot token | Stored in `.env` only, never committed to source control |

---

## 🚦 Frontend Implementation Notes

### "Connect Telegram" Button Flow

The mobile app should add a "Connect Telegram" option in Settings. The flow:

```typescript
// 1. Call the link-code endpoint
const { data } = await api.post('/telegram/link-code');
const code = data.code;

// 2. Show the user the code and instructions
showModal({
  title: 'Connect Telegram',
  body: `Send this code to @NairaFlowBot on Telegram:\n\n${code}`,
  copyButton: true, // copy code to clipboard
  expiresIn: '10 minutes',
});
```

### State Tracking

Track whether a business has linked Telegram:

```typescript
// The Business profile endpoint returns telegramChatId if linked
const { data } = await api.get('/business/profile');
const isTelegramLinked = !!data.telegramChatId;
```

If `telegramChatId` is present, show "✅ Telegram connected" instead of the connect button.

### Environment

| Variable | Purpose |
|----------|---------|
| `TELEGRAM_BOT_TOKEN` | Bot token from BotFather |
| `TELEGRAM_WEBHOOK_URL` | Production webhook URL (e.g., `https://api.nairaflow.com/api/v1/telegram/webhook`) |
| `TELEGRAM_WEBHOOK_SECRET` | Random secret for webhook validation |

In development, only `TELEGRAM_BOT_TOKEN` is needed — the bot uses long polling.

---

## 🔗 Related Documentation

- **[Authentication](./authentication.md)** — Business login required for link-code generation
- **[Business](./business.md)** — Profile endpoint returns `telegramChatId` status
- **[Transactions](./transactions.md)** — The `/quick` command maps to the quick-sale endpoint
