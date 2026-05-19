# Inventory Module

The Inventory module manages the "What" of the business—Products and Categories.

## Functional Logic

### 📊 Automated Stock Management
Stock levels are managed globally and updated in response to several events:
- **Sale:** Decreases stock (Transactions Module).
- **Purchase:** Increases stock (Transactions Module).
- **Manual Adjustment:** Used for corrections (Damage, Theft, Returns).

### 🚩 Low-Stock Flagging
The API provides a real-time `isLowStock` indicator. This is calculated dynamically:
- IF `stockLevel` <= `lowStockThreshold` THEN `isLowStock = true`.
- The frontend should use this to show alerting UI (red badges).
- Note: Adjusting stock manually (`/adjust-stock`) is the preferred way to handle edge cases like theft or damage, as it leaves an audit trail.

### 📁 Category-Product Hierarchy
- Every product **must** belong to a category.
- Deleting a category will fail if products are still assigned to it (referential integrity).

---

## API Reference

### List Categories
`GET /inventory/categories`
- **Query Parameters:** `page` (default: 1), `limit` (default: 50)

**Response Example:**
```json
{
  "success": true,
  "data": {
    "results": [
      { "id": "cmny6pb9c...", "name": "Snacks", "icon": "fastfood", "_count": { "products": 5 } }
    ],
    "meta": { "total": 1, "page": 1, "limit": 50, "pages": 1 }
  }
}
```

### Create Category
`POST /inventory/categories`

**Payload:**
```json
{
  "name": "Groceries",
  "icon": "shopping_cart"
}
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "id": "cmny6pb9c...",
    "name": "Groceries",
    "icon": "shopping_cart"
  }
}
```

### Update Category
`PATCH /inventory/categories/:id`

### Delete Category
`DELETE /inventory/categories/:id`

### List Products
`GET /inventory/products`

**Query Parameters:**
- `categoryId` (optional): Filter products by category ID.
- `search` (optional): Case-insensitive search by product name.
- `page` (default: 1), `limit` (default: 20)

**Response Example:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "cmny6qpig00...",
        "name": "Potato Chips",
        "sellingPrice": "1200",
        "stockLevel": 48,
        "isLowStock": false
      }
    ],
    "meta": { "total": 1, "page": 1, "limit": 20, "pages": 1 }
  }
}
```

### Create Product
`POST /inventory/products`

**Payload:**
```json
{
  "name": "Potato Chips",
  "categoryId": "cmny6pb9c...",
  "sellingPrice": 1200,
  "costPrice": 800,
  "stockLevel": 50,
  "lowStockThreshold": 5,
  "trackStock": true,
  "imageUrl": "https://..."
}
```

- `trackStock` (optional, default: `true`): Set to `false` for service-type products that don't need inventory tracking.

**Response Example:**
```json
{
  "success": true,
  "data": {
    "id": "cmny6qpig00...",
    "name": "Potato Chips",
    "sellingPrice": "1200",
    "stockLevel": 50,
    "isLowStock": false
  }
}
```

### Get Single Product
`GET /inventory/products/:id`

**Response Example:**
```json
{
  "success": true,
  "data": {
    "id": "cmo1ay6ox000yyqdncizjfdfh",
    "businessId": "cmo0t6mud0000tui87824c7iu",
    "categoryId": "cmo1axot6000wyqdnsoy90s9p",
    "name": "Cement ",
    "imageUrl": null,
    "sellingPrice": "9000",
    "costPrice": "6300",
    "stockLevel": 992,
    "lowStockThreshold": 5,
    "createdAt": "2026-04-16T09:54:03.489Z",
    "category": {
      "id": "cmo1axot6000wyqdnsoy90s9p",
      "businessId": "cmo0t6mud0000tui87824c7iu",
      "name": "Building materials ",
      "icon": "category",
      "createdAt": "2026-04-16T09:53:40.315Z"
    },
    "isLowStock": false
  }
}
```

### Update Product
`PATCH /inventory/products/:id`

**Payload (Partial Updates Allowed):**
```json
{
  "name": "New Product Name",
  "sellingPrice": 1500,
  "costPrice": 1000,
  "lowStockThreshold": 10,
  "imageUrl": "https://example.com/image.jpg"
}
```

### Delete Product
`DELETE /inventory/products/:id`
Permanently removes a product. Note: Historically, products used in transactions cannot be fully deleted; the system may restrict this in future updates to maintain data integrity.

### Adjust Stock
`PATCH /inventory/products/:id/adjust-stock`
Directly modify stock levels without creating a purchase/sale.

**Request:**
```json
{
  "quantity": -2,
  "reason": "DAMAGE", 
  "note": "Correction for broken items"
}
```
*Note: Use positive values for additions, negative for subtractions.*

**Response Example:**
```json
{
  "success": true,
  "data": {
    "id": "cmny6qpig00...",
    "stockLevel": 48
  }
}
```
