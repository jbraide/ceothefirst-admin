# Transactions Module

Transactions are the primary mechanism for financial record-keeping in NairaFlow. Every transaction is processed within a database lock to ensure data integrity across the ledger and inventory.

## Functional Logic

### 🛒 Recording a Sale (`POST /transactions/sell`)
Used when a customer buys products from the business.
1. **Inventory Sync:** The system automatically **decrements** the `stockLevel` of each product provided in the `items` array.
2. **Stock Guard:** If any product's stock is insufficient (less than requested qty), the transaction is rejected with a `400 Bad Request`.
3. **Debt Recording:** 
   - If `paymentMethod` is set to **`'credit'`**, the system automatically creates a `Debt` record.
   - The system links the debt to the provided **`contactId`**. If no `contactId` is provided, it uses the `contactName` for "walk-in" debt tracking.
4. **Profit Tracking:** The system captures both `unitPrice` (selling price) and `unitCost` (cost price to the business) at the moment of sale to enable accurate margin reporting.
5. **Staff Privacy:** When a **Staff** member retrieves transaction details, the `unitCost` fields are automatically stripped from the response to prevent them from seeing business margins.

### 📦 Recording a Purchase (`POST /transactions/buy`)
Used when the business buys stock from a supplier.
1. **Inventory Sync:** The system automatically **increments** the `stockLevel` of products.
2. **Debt Recording:**
   - If `paymentMethod` is set to **`'credit'`**, the system creates a `Debt` record of type **`payable`**.
   - This indicates money the business owes to the supplier.

### 💸 Recording an Expense (`POST /transactions/expense`)
Used for operational costs (Rent, Salaries, Internet). These do not affect inventory but are reflected in the Cash Book and Profit/Loss reports.

---

## API Reference

### List Transactions
`GET /transactions`
- **Query Parameters:** `page`, `limit`, `type`, `contactId`, `from`, `to`

**Response Example (Paginated):**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "cmo1b030t0011yqdnobwq6bw8",
        "businessId": "cmo0t6mud0000tui87824c7iu",
        "contactId": null,
        "type": "sale",
        "amount": "94500",
        "amountPaid": "94500",
        "description": null,
        "paymentMethod": "cash",
        "contactName": null,
        "contactPhone": null,
        "category": null,
        "staffId": null,
        "createdAt": "2026-04-16T09:55:32.045Z",
        "lines": [
          {
            "id": "cmo1b030t0012yqdn16g18xbz",
            "transactionId": "cmo1b030t0011yqdnobwq6bw8",
            "productId": "cmo1ay6ox000yyqdncizjfdfh",
            "productName": "Cement ",
            "qty": 8,
            "unitPrice": "9000",
            "unitCost": "6300"
          }
        ],
        "contact": null
      }
    ],
    "meta": {
      "total": 6,
      "page": 1,
      "limit": 2,
      "totalPages": 3
    }
  }
}
```

### Get Single Transaction
`GET /transactions/:id`

**Response Example:**
```json
{
  "success": true,
  "data": {
    "id": "cmo1b030t0011yqdnobwq6bw8",
    "businessId": "cmo0t6mud0000tui87824c7iu",
    "contactId": null,
    "type": "sale",
    "amount": "94500",
    "amountPaid": "94500",
    "description": null,
    "paymentMethod": "cash",
    "contactName": null,
    "contactPhone": null,
    "category": null,
    "staffId": null,
    "createdAt": "2026-04-16T09:55:32.045Z",
    "lines": [
      {
        "id": "cmo1b030t0012yqdn16g18xbz",
        "transactionId": "cmo1b030t0011yqdnobwq6bw8",
        "productId": "cmo1ay6ox000yyqdncizjfdfh",
        "productName": "Cement ",
        "qty": 8,
        "unitPrice": "9000",
        "unitCost": "6300"
      }
    ],
    "contact": null
  }
}
```

---

### Record Sale
`POST /transactions/sell`

**Parameters:**
- `contactId`: Optional. ID of the formal Contact.
- `items`: Array of products (`productId`, `qty`, `unitPrice`).
- `paymentMethod`: `cash`, `transfer`, `pos`, or **`credit`** (triggers debt).
- `contactName`: Required if `paymentMethod` is `credit` and no `contactId` is present.

**Example Request:**
```json
{
  "contactId": "cmny8...",
  "items": [
    { "productId": "cmny6qpig000...s", "qty": 2, "unitPrice": 1200 }
  ],
  "paymentMethod": "credit",
  "contactName": "Walk-in Customer"
}
```
*Note: `contactId` is optional. If provided, it overrides custom name strings for automated balance tracking.*

### Record a Sale (Non-Inventory / Service / No Stock Tracking)
`POST /transactions/sell`

For service-type products where stock tracking is not needed, set `trackStock: false` when creating the product. The sale will skip inventory validation for such products.

**Example Request:**
```json
{
  "items": [
    {
      "productName": "Delivery Service",
      "qty": 1,
      "unitPrice": 1500
    }
  ],
  "paymentMethod": "cash"
}
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "id": "cmny6p...",
    "type": "sale",
    "amount": "1500",
    "lines": [
      {
        "productId": null,
        "productName": "Delivery Service",
        "qty": 1,
        "unitPrice": "1500",
        "unitCost": null
      }
    ]
  }
}
```

### Record Purchase
`POST /transactions/buy`
Used for inventory restock. Works similarly to Sale but increments stock and creates `payable` debts if `paymentMethod` is `'credit'`.

**Payload:**
```json
{
  "contactId": "cmny8...",
  "items": [
    { "productId": "cmny6qpig000...s", "qty": 10, "unitPrice": 800 }
  ],
  "paymentMethod": "cash",
  "description": "Weekly restock"
}
```

### Record Expense
`POST /transactions/expense`
Used for non-inventory costs.

**Payload:**
```json
{
  "amount": 5000,
  "category": "Rent",
  "description": "Shop space for May"
}
```

### Quick Sale (`POST /transactions/quick-sell`)
Used for simple, single-line sales that don't require inventory linking. Ideal for walk-in customers, service sales, or miscellaneous income.

**Payload:**
```json
{
  "amount": 2000,
  "paymentMethod": "cash",
  "description": "Quick sale - water",
  "contactName": "Walk-in",
  "contactId": "optional_contact_id"
}
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "id": "cmny6p...",
    "type": "sale",
    "amount": "2000",
    "amountPaid": "2000",
    "paymentMethod": "cash",
    "lines": [
      {
        "productId": null,
        "productName": "Quick sale - water",
        "qty": 1,
        "unitPrice": "2000",
        "unitCost": null
      }
    ]
  }
}
```

**Note:** If `paymentMethod` is `credit`, a `Debt` record of type `receivable` is automatically created — same behavior as a regular sale.
