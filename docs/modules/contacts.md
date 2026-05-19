# Contacts Module
The Contacts module manages relationships with **Customers** and **Suppliers**. It tracks their profiles, transaction history, and net financial balance.

## Endpoints

### Create Contact
`POST /contacts`

**Request Body:**
```json
{
  "name": "Aliko Dangote",
  "phone": "08012345678",
  "email": "info@dangote.com",
  "address": "Lagos, Nigeria",
  "type": "SUPPLIER"
}
```
*Note: `type` can be `CUSTOMER`, `SUPPLIER`, or `BOTH`.*

### List Contacts
`GET /contacts?type=CUSTOMER&page=1&limit=50`

**Query Parameters:**
- `type` (optional): `CUSTOMER`, `SUPPLIER`, or `BOTH`
- `page` (default: 1), `limit` (default: 50)

**Response Example:**
```json
{
  "success": true,
  "data": {
    "results": [
      { "id": "cmny...", "name": "Aliko Dangote", "phone": "08012345678", "type": "SUPPLIER" }
    ],
    "meta": { "total": 1, "page": 1, "limit": 50, "pages": 1 }
  }
}
```

### Get Contact Details
`GET /contacts/:id`
Returns the contact profile, recent transaction history, and their current **net balance** (Total Receivables - Total Payables).

### Update Contact
`PATCH /contacts/:id`

**Payload:**
```json
{
  "name": "New Name",
  "phone": "080...",
  "type": "BOTH"
}
```

### Delete Contact
`DELETE /contacts/:id`
*Note: Contacts with existing transaction history cannot be deleted to maintain ledger integrity.*

### Get Contact Transaction History
`GET /contacts/:id/transactions`
Returns a paginated list of all transactions linked to this contact.

**Response Example:**
```json
{
  "success": true,
  "data": {
    "results": [...],
    "meta": { "total": 45, "page": 1, "limit": 20, "pages": 3 }
  }
}
```

## Relationship Logic
- **Receivables**: When a sale is recorded with `paymentMethod: 'credit'` and linked to a `contactId`, a debt of type `receivable` is automatically linked to this contact.
- **Payables**: When a purchase is recorded with `paymentMethod: 'credit'` and linked to a `contactId`, a debt of type `payable` is automatically linked to this contact.
- **Balance Calculation**: 
  - `Balance = (Total Receivables) - (Total Payables)`
  - A positive balance means the contact owes the business money (Customer).
  - A negative balance means the business owes the contact money (Supplier).
