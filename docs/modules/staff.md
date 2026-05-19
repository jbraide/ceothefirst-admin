# Staff Module

The Staff module allows business owners to grant access to employees to perform sales and inventory management without full access to business profiles or financial reports.

## Functional Logic

### 👮 Role & PIN Security
- **Employee PINs:** Every staff member has a unique **4-digit PIN**.
- **Isolation:** Staff members sign in using the same Auth endpoints but receive a JWT with limited capabilities.
- **Data Privacy:** Staff cannot see `costPrice` in inventory (filtered in API) or access high-level financial `reports`.

### 🚫 Access Control
- **Add Staff:** Owners can create accounts for employees.
- **Deactivation:** If a staff member leaves, the owner should set `isActive: false`.
- **Management:** Only **Owners** can access `/staff` CRUD endpoints.

---

## API Reference

### Staff Login
`POST /auth/staff/login`
Staff members must use this dedicated endpoint to receive a JWT with the `STAFF` role. 
Request body: `{"phone": "08011223344", "pin": "1122"}`. Phone must be in Nigerian local format (starting with 070, 080, 081, or 090).

### Add Staff
`POST /staff`

**Request:**
```json
{
  "name": "Musa Okafor",
  "phone": "08112233445",
  "pin": "1122"
}
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "id": "cmny92rgc00...",
    "name": "Musa Okafor",
    "phone": "08112233445",
    "isActive": true,
    "createdAt": "2026-04-14T06:38:19.261Z"
  }
}
```

### List Staff
`GET /staff`
- **Query Parameters:** `page` (default: 1), `limit` (default: 50)

**Response Example:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "cmny92rgc00...",
        "name": "Musa Okafor",
        "phone": "08112233445",
        "isActive": true,
        "createdAt": "2026-04-14T06:38:19.261Z"
      }
    ],
    "meta": {
      "total": 1,
      "page": 1,
      "limit": 50,
      "pages": 1
    }
  }
}
```

### Deactivate/Delete Staff
`DELETE /staff/:id`

### Get Single Staff
`GET /staff/:id`

**Response Example:**
```json
{
  "success": true,
  "data": {
    "id": "cmny92rgc00...",
    "name": "Musa Okafor",
    "phone": "08112233445",
    "isActive": true,
    "createdAt": "2026-04-14T06:38:19.261Z"
  }
}
```

### Update Staff
`PATCH /staff/:id`

**Payload (Partial):**
```json
{
  "name": "Updated Name",
  "phone": "08012345678",
  "isActive": false
}
```
*Note: Use this to deactivate staff without deleting their transaction history.*

### Reset Staff PIN
`POST /staff/:id/reset-pin`
**Owner-only.** Request body: `{"pin": "5678"}`.
