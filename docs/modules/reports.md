# Reports Module

The Reports module distills raw transactions into actionable financial data.

## Functional Logic

### 🗓️ Periodical Summary (`/reports/summary`)
This endpoint calculates the **Net Cash Flow** for a specific time window.
- **Money In:** Sum of all `sale` and `debt_repayment` (received) transactions.
- **Money Out:** Sum of all `purchase`, `expense`, and `debt_repayment` (made) transactions.
- **Net Position:** `Money In` - `Money Out`.

### 🗂️ All-Time Aggregates (`/reports/all-time`)
Returns lifetime totals for Sales, Expenses, and Purchases. Use this for dashboard "Lifetime Revenue" counters.

### 🏦 Cash Book (`/reports/cash-book`)
A chronological record of every ledger movement.
- **Tip:** Each row includes a `type` field (`sale`, `purchase`, `expense`, `debt_repayment`). The frontend should use this to conditionally render icons (e.g., Green arrow for `sale`, Red arrow for `expense`).
### 📊 Mobile Dashboard (`/reports/dashboard`)
Combines multiple aggregates into a single request specifically designed for the mobile app's home screen.
- **Today's Summary:** Totals for `moneyIn`, `moneyOut`, and `netCashFlow` occurring strictly today.
- **Debt Summary:** Global `totalReceivable`, `totalPayable`, and `netDebt` representing the overall debtor/creditor position.
- **Low Stock Alerts:** Raw count of items currently at or below their low-stock threshold.
- **Recent Transactions:** The 5 most recent transactions for quick activity review.

### 🛡️ Access Control (RBAC)
- **Financial Reports:** All endpoints in the `Reports` module are restricted to the **Business Owner** only. 
- **Staff Privacy:** Staff members cannot see transaction cost data or high-level aggregates.

---

## API Reference

### Get Cash Book
`GET /reports/cash-book`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `type` (optional): Filter by transaction type (`sale`, `purchase`, `expense`, `debt_repayment`)

**Response Example:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "cmny6qwlg00...",
        "type": "sale",
        "amount": "2400",
        "paymentMethod": "cash",
        "contactName": null,
        "createdAt": "2026-04-14T05:31:26.541Z"
      }
    ],
    "meta": {
      "total": 125,
      "page": 1,
      "limit": 20,
      "pages": 7
    }
  }
}
```

### Get Summary
`GET /reports/summary?from=ISO_DATE&to=ISO_DATE`

**Response Example:**
```json
{
  "success": true,
  "data": {
    "moneyIn": 2400,
    "moneyOut": 0,
    "netCashFlow": 2400,
    "transactionCount": 1
  }
}
```

### Get All-Time aggregates
`GET /reports/all-time`

**Response Example:**
```json
{
  "success": true,
  "data": {
    "totalSales": 2400,
    "totalPurchases": 0,
    "totalExpenses": 0,
    "totalRepayments": 0
  }
}
```

### Get Dashboard
`GET /reports/dashboard`

**Response Example:**
```json
{
  "success": true,
  "data": {
    "todaySummary": {
      "moneyIn": 0,
      "moneyOut": 0,
      "netCashFlow": 0
    },
    "debtSummary": {
      "totalReceivable": 7400,
      "totalPayable": 0,
      "netDebt": 7400
    },
    "lowStockAlerts": 0,
    "recentTransactions": [
      {
        "id": "cmnygy4wq000413b7l8tj3js4",
        "type": "sale",
        "amount": "2400",
        "amountPaid": "0"
      }
    ]
  }
}
```
