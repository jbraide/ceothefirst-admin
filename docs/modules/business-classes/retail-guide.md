# NairaFlow for Product Sellers

> Retail, gadgets, fashion, perfume, mini-importers, Instagram vendors

## How It Works

NairaFlow's inventory engine is built for product sellers. Every product has a stock level, cost price, and selling price. When you record a sale, stock decreases automatically. Profit margins are tracked per item.

## Key Features for Retail

| Feature | What It Does |
|---------|-------------|
| **Inventory Management** | Add products, organize into categories, set prices and stock levels |
| **Stock Tracking** | Stock auto-decrements on every sale. Low-stock alerts when inventory runs low |
| **Sales Channels** | Track where each sale came from — WhatsApp, Instagram, Walk-in, etc. |
| **Discounts** | Apply per-transaction discounts |
| **Credit Sales** | Sell on credit — a receivable debt is created automatically and tracked until paid |
| **Quick Sale (POS)** | For one-off items or services — no product lookup needed |
| **Contacts** | Track customers with purchase history, source, and status (new/returning/vip) |
| **Leads** | Track inquiries before they become customers. Convert leads to contacts |
| **Invoices** | Issue formal numbered invoices for large orders |
| **Expenses** | Record operational costs (logistics, rent, data) with receipt uploads |
| **Dashboard** | Daily money-in, money-out, net cash flow, low-stock count, recent transactions |
| **Staff** | Give employees limited access to record sales without seeing financials |

## Test Results (Verified)

| Step | What | Result |
|------|------|--------|
| Register & Login | Phone + PIN | ✅ |
| Inventory Setup | Created category "Phones", product "iPhone 15 Pro" (10 stock, ₦1.2M selling, ₦950K cost) | ✅ |
| Cash Sale | Sold 2 iPhones via WhatsApp with ₦50K discount → ₦2.35M | ✅ |
| Credit Sale | Sold 1 iPhone on credit to Chidi Okonkwo → ₦1.2M receivable | ✅ |
| Stock After Sales | Stock: 10 → 7 (2 cash + 1 credit = 3 sold) | ✅ |
| Quick Sale | Screen protector installation ₦15K cash | ✅ |
| Expense | Logistics ₦50K | ✅ |
| Invoice | INV-001 for 3 iPhones, ₦3.6M pending | ✅ |
| Lead | Amina Bello, interested in iPhone 15 Pro Max | ✅ |
| Dashboard | Money In: ₦2,415,000, Net: ₦2,365,000 | ✅ |

---

## API Response Examples

### Record an inventory sale
`POST /transactions/sell`
```json
// Request
{
  "items": [{ "productId": "cmp...", "qty": 2, "unitPrice": 1200000 }],
  "paymentMethod": "cash",
  "salesChannel": "whatsapp",
  "discount": 50000
}

// Response
{
  "success": true,
  "data": {
    "id": "cmp...",
    "type": "sale",
    "amount": "2400000",
    "amountPaid": "2400000",
    "paymentMethod": "cash",
    "salesChannel": "whatsapp",
    "discount": "50000",
    "lines": [
      { "productId": "cmp...", "productName": "iPhone 15 Pro", "qty": 2, "unitPrice": "1200000", "unitCost": "950000" }
    ]
  }
}
```

### Dashboard
`GET /reports/dashboard`
```json
{
  "success": true,
  "data": {
    "todaySummary": { "moneyIn": 0, "moneyOut": 0, "netCashFlow": 0 },
    "debtSummary": { "totalReceivable": 1200000, "totalPayable": 0, "netDebt": 1200000 },
    "lowStockAlerts": 0,
    "recentTransactions": [ /* last 5 transactions */ ]
  }
}
```

### Business Profile (with plan)
`GET /business/profile`
```json
{
  "success": true,
  "data": {
    "name": "Lagos Gadgets Hub",
    "category": "Retail",
    "address": "12 Allen Avenue, Ikeja",
    "plan": { "name": "starter", "label": "Starter", "price": "0", "maxTransactions": 100, "maxProducts": 20 },
    "planId": "cmp...",
    "planActivatedAt": "2026-05-26T23:09:40.750Z"
  }
}
```

## Relevant Endpoints

- `POST /inventory/products` — Add products
- `POST /transactions/sell` — Record inventory sale
- `POST /transactions/quick-sell` — Record non-inventory sale
- `POST /transactions/expense` — Record expense
- `GET /reports/dashboard` — Daily overview
- `GET /reports/daily-summary` — Day-level aggregates
- `POST /leads` — Track inquiries
- `POST /invoices` — Issue invoices
- `GET /debts` — View outstanding credit
