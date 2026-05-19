# Invoices Module

Invoices are used for formal billing, typically for services or large orders where immediate payment isn't required.

## Functional Logic

### 🔢 Invoice Numbering (`INV-XXX`)
The system uses an atomic counter per business to generate sequential invoice numbers.
- **Example:** Your first invoice will be `INV-001`, then `INV-002`, and so on.
- **Concurrency Safe:** Uses database-level atomic increments to prevent duplicate numbers even under high concurrent load.

### 💰 Payment Workflow & Status
Invoices transition through statuses based on the `paidAmount`:
1. **`PENDING`**: `paidAmount == 0`.
2. **`DEPOSIT`**: `0 < paidAmount < totalAmount`.
3. **`PAID`**: `paidAmount >= totalAmount`.

**Note:** Recording a payment on an invoice (`/invoices/:id/pay`) **automatically creates a separate Transaction record** of type `sale`. This ensures the income is captured in the global Cash Book and reporting modules.

### 🧾 Line Item Totals
The system automatically computes the `totalAmount` in the background:
`Subtotal - Discount + Tax + Shipping`.

---

## API Reference

### Create Invoice
`POST /invoices`

**Payload:**
```json
{
  "customerName": "Aliko Dangote",
  "lines": [
    { "description": "Construction Grade Cement", "qty": 100, "unitPrice": 4500 }
  ]
}
```

- `contactId` (optional): Link invoice to a formal Contact for balance tracking.
- `customerPhone` (optional): Customer's phone number.
- `taxAmount`, `discountAmount`, `shippingAmount` (optional): Adjust totals.
- `dueDate` (optional): ISO date string for payment deadline.

**Response Example:**
```json
{
  "success": true,
  "data": {
    "id": "cmny6s9l00...",
    "invoiceNumber": "INV-001",
    "customerName": "Aliko Dangote",
    "totalAmount": "450000",
    "status": "PENDING"
  }
}
```

### List Invoices
`GET /invoices`

- **Query Parameters:** `status` (PENDING|DEPOSIT|PAID), `contactId`, `page` (default: 1), `limit` (default: 20)

**Response Example:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "cmny6s9l00...",
        "invoiceNumber": "INV-001",
        "customerName": "Aliko Dangote",
        "totalAmount": "450000",
        "status": "PENDING"
      }
    ],
    "meta": { "total": 1, "page": 1, "limit": 20, "pages": 1 }
  }
}
```

### Get Invoice Detail
`GET /invoices/:id`

**Response Example:**
```json
{
  "success": true,
  "data": {
    "id": "cmny6s9l00...",
    "invoiceNumber": "INV-001",
    "customerName": "Aliko Dangote",
    "subtotal": "450000",
    "totalAmount": "450000",
    "lines": [
      { "description": "Construction Grade Cement", "qty": 100, "unitPrice": "4500" }
    ]
  }
}
```

### Record Payment
`POST /invoices/:id/pay`
Records a payment and syncs a `sale` transaction to the Cash Book.

**Request:**
```json
{ 
  "amount": 100000,
  "paymentMethod": "cash" 
}
```

### Cancel Invoice
`DELETE /invoices/:id`
Voids the invoice. **Only permitted if `paidAmount` is 0.**

### Generate PDF
`GET /invoices/:id/pdf`
Generates a downloadable PDF for the invoice. 
- Currently returns a placeholder boilerplate with a mock download URL.
- Recommended for professional client sharing.
