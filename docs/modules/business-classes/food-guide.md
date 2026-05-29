# NairaFlow for Food & Delivery

> Cloud kitchens, food vendors, frozen food suppliers, chicken suppliers, restaurants

## How It Works

Food businesses are a hybrid — prepared food uses the POS/quick-sale mode, while raw supplies (frozen chicken, ingredients) use full inventory tracking. Menu items are created as products with stock tracking turned off (you don't track that 1 plate of jollof = 200g rice — you just sell "Jollof Rice ₦2,500"). Inventory items like frozen chicken cartons are fully tracked.

## Key Features for Food Businesses

| Feature | What It Does |
|---------|-------------|
| **Quick Sale (POS)** | Fast sale recording — amount + description, done in seconds. No product lookup |
| **Menu Items** | Create menu products with trackStock=false for prepared food items |
| **Inventory Tracking** | Track raw supplies (frozen chicken, drinks, ingredients) with stock levels |
| **Sales Channels** | Track orders by source — walk-in, WhatsApp, Instagram |
| **Expenses** | Record ingredient purchases, gas, utilities, logistics |
| **Dashboard** | Daily sales total, expenses, net profit |
| **Cash Book** | Complete transaction log for end-of-day reconciliation |

## Test Results (Verified)

| Step | What | Result |
|------|------|--------|
| Register & Login | Phone + PIN | ✅ |
| Menu Setup | Category "Main Dishes", products: Jollof Rice (₦2.5K), Egusi (₦3K) — trackStock=false | ✅ |
| Inventory | Frozen Chicken carton (50 stock, ₦18K selling, ₦14K cost) — trackStock=true | ✅ |
| POS Sales | 4 quick sales: ₦2.5K + ₦3K + ₦5.5K + ₦18K = ₦29K | ✅ |
| Inventory Sale | Sold 3 frozen chicken cartons → stock: 50→47 | ✅ |
| Expenses | Ingredients ₦25K, Gas ₦8.5K | ✅ |
| Dashboard | Money In: ₦83K, Money Out: ₦33.5K, Net: ₦49.5K | ✅ |
| Daily Summary | Sales ₦83K, Expenses ₦33.5K, Profit ₦49.5K | ✅ |
| Cash Book | 7 transactions (5 sales + 2 expenses) | ✅ |

## Financial Verification

| Metric | Expected | Actual | Match |
|--------|----------|--------|-------|
| Total Sales | ₦83,000 | ₦83,000 | ✅ |
| Total Expenses | ₦33,500 | ₦33,500 | ✅ |
| Net Cash Flow | ₦49,500 | ₦49,500 | ✅ |
| Stock After Sale | 47 | 47 | ✅ |

---

## API Response Examples

### Quick Sale (POS mode — fast)
`POST /transactions/quick-sell`
```json
// Request
{ "amount": 2500, "description": "Jollof Rice + Chicken", "paymentMethod": "cash", "salesChannel": "walk_in" }

// Response
{
  "success": true,
  "data": {
    "id": "cmp...",
    "type": "sale",
    "amount": "2500",
    "amountPaid": "2500",
    "description": "Jollof Rice + Chicken",
    "paymentMethod": "cash",
    "salesChannel": "walk_in",
    "lines": [{ "productId": null, "productName": "Jollof Rice + Chicken", "qty": 1, "unitPrice": "2500" }]
  }
}
```

### Create menu item (no stock tracking)
`POST /inventory/products`
```json
// Request
{ "name": "Jollof Rice + Chicken", "categoryId": "cmp...", "sellingPrice": 2500, "costPrice": 1200, "stockLevel": 0, "trackStock": false }

// Response
{ "success": true, "data": { "id": "cmp...", "name": "Jollof Rice + Chicken", "isLowStock": false, "trackStock": false } }
```

### Expense (auto-paid)
`POST /transactions/expense`
```json
// Request
{ "amount": 25000, "category": "Ingredients", "description": "Market run" }

// Response
{ "success": true, "data": { "amount": "25000", "amountPaid": "25000", "category": "Ingredients" } }
```

### Dashboard (food business)
`GET /reports/dashboard`
```json
{
  "todaySummary": { "moneyIn": 0, "moneyOut": 5000, "netCashFlow": -5000 },
  "debtSummary": { "totalReceivable": 0, "totalPayable": 0 },
  "lowStockAlerts": 0
}
```

## Relevant Endpoints

- `POST /transactions/quick-sell` — POS mode (fast sale)
- `POST /transactions/sell` — Inventory sale (tracked stock)
- `POST /transactions/expense` — Record costs
- `POST /inventory/products` — Add menu items (trackStock=false) or inventory (trackStock=true)
- `GET /inventory/products/:id` — Check stock levels
- `GET /reports/dashboard` — Daily overview
- `GET /reports/daily-summary` — Day-level aggregates
- `GET /reports/cash-book` — Full transaction log

## Coming in Phase 2

- Menu modifiers (add extra meat +₦500)
- Delivery management (driver assignment, order status)
- Ingredient-to-menu-item linking for cost tracking
