# NairaFlow for Crypto & Financial Operators

> P2P traders, USDT merchants, FX operators

## How It Works

Crypto operators use NairaFlow's service-mode. Every trade is recorded as a quick sale with a description noting the asset, amount, and rate. Contacts track counterparties. The system works entirely in Naira — crypto amounts and rates are noted in descriptions for now. Full multi-currency support is planned for a future release.

## Key Features for Crypto Operators

| Feature | What It Does |
|---------|-------------|
| **Quick Sale** | Record each trade with amount, description (e.g. "Sold 1000 USDT @ 1560/USD"), and payment method |
| **Credit Trades** | Trades where the counterparty will pay later — auto-creates a receivable debt |
| **Contacts** | Track counterparties with trade history, source (WhatsApp, referral), and status |
| **Expenses** | Record operational costs — internet, data, platform fees |
| **Leads** | Track potential trading partners before they become active |
| **Dashboard** | Daily money-in, money-out, net cash flow, outstanding receivables |
| **Cash Book** | Complete chronological trade and expense log |

## Test Results (Verified)

| Step | What | Result |
|------|------|--------|
| Register & Login | Phone + PIN | ✅ |
| Counterparty | Created contact "Ahmed Trader" (BOTH type, WhatsApp source) | ✅ |
| Cash Trade | Sold 1000 USDT via transfer → ₦1,560,000 | ✅ |
| Credit Trade | Sold 500 USDT on credit → ₦780,000 receivable | ✅ |
| Expense | Internet ₦15,000 | ✅ |
| Debt Check | Ahmed Trader owes ₦780,000 (OPEN) | ✅ |
| Lead | Fatima Yusuf interested in USDT trading | ✅ |
| Dashboard | Money In: ₦1,560,000, Receivable: ₦780,000 | ✅ |

---

## API Response Examples

### Quick Sale (USDT trade)
`POST /transactions/quick-sell`
```json
// Request
{ "amount": 1560000, "description": "Sold 1000 USDT @ 1560/USD", "paymentMethod": "transfer", "contactId": "cmp...", "salesChannel": "whatsapp" }

// Response
{
  "success": true,
  "data": {
    "id": "cmp...",
    "type": "sale",
    "amount": "1560000",
    "amountPaid": "1560000",
    "description": "Sold 1000 USDT @ 1560/USD",
    "paymentMethod": "transfer",
    "salesChannel": "whatsapp",
    "lines": [{ "productId": null, "productName": "Sold 1000 USDT @ 1560/USD", "qty": 1, "unitPrice": "1560000" }]
  }
}
```

### Credit trade (creates receivable debt)
```json
// Response (debt auto-created)
{
  "type": "sale",
  "amount": "780000",
  "amountPaid": "0",
  "paymentMethod": "credit"
}
// Check debts: GET /debts → { "totalReceivable": 780000, "status": "OPEN" }
```

## Relevant Endpoints

- `POST /transactions/quick-sell` — Record each trade
- `POST /transactions/expense` — Record costs
- `POST /contacts` — Add counterparties
- `GET /debts` — Track outstanding trades
- `POST /leads` — Track prospective traders
- `GET /reports/dashboard` — Daily overview
- `GET /reports/daily-summary` — Day-level aggregates

## Coming in Phase 2

- Multi-currency support (USDT, BTC amounts alongside Naira)
- Rate tracking per trade
- P2P trade ledger with net position per counterparty
