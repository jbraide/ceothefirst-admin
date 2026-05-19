# NairaFlow API — Backlog & Improvements

This document tracks unimplemented features, endpoints, and architectural improvements for the NairaFlow API, categorized by priority and status.

---

## ✅ Query Optimization (May 2026)

Major performance overhaul completed across all services:

- **P0 — DB-Level Aggregations:** `getDashboard()`, `getSummary()`, and `debtSummary` now use `groupBy`/`_sum` instead of JavaScript-side `filter().reduce()`.
- **P0 — Database Indexes:** Added 14 composite indexes on all models targeting common query patterns (`businessId + createdAt`, `businessId + type`, `businessId + status`, etc.).
- **P1 — Pagination:** All unbounded list endpoints now support `page`/`limit` with standard `{ results, meta }` responses:
  - `GET /contacts`, `GET /staff`, `GET /debts`, `GET /inventory/categories`, `GET /inventory/products`, `GET /invoices`
- **P1 — Check-Then-Act Elimination:** Replaced `findFirst` + `update`/`delete` patterns with single queries and `P2025`/`P2003` error handling across inventory, staff, contacts, and invoices services.
- **P2 — Atomic Invoice Counter:** Fragile regex-based invoice numbering replaced with `InvoiceCounter` table using atomic `increment`.
- **P2 — `trackStock` Field:** Added `trackStock` boolean to `Product` model for service-type products.
- **P3 — Quick Sale Endpoint:** Added `POST /transactions/quick-sell` for simple single-line sales without inventory linking.

## ✅ Completed (Priority 1)

These critical endpoints were missing in the initial scaffold and have been implemented and verified.

### Inventory
- `GET /inventory/products/:id` — Single product detail.
- `PATCH /inventory/products/:id` — Update product details.
- `DELETE /inventory/products/:id` — Delete product.
- `PATCH /inventory/categories/:id` — Update category.
- `DELETE /inventory/categories/:id` — Delete category.
- `GET /inventory/products?search=` — Case-insensitive product name search.

### Transactions
- `GET /transactions/:id` — Single transaction lookup.
- `GET /transactions` — Paginated results (`page`, `limit`).
- `GET /transactions?from=&to=` — Date range filtering.
- `GET /transactions?contactId=` — Filter history by customer/supplier.

### Debts
- `GET /debts/:id` — Single debt detail.
- `GET /debts?contactId=` — Filter debt list by contact.

---

## 🟡 Priority 2 — Important (Planned Next)

### 👥 Staff Management
| Task | Endpoint | Requirement | Status |
|---|---|---|---|
| Get staff details | `GET /staff/:id` | View profile | ✅ |
| Update staff | `PATCH /staff/:id` | Update name/phone | ✅ |
| PIN Reset | `POST /staff/:id/reset-pin` | Owner can reset staff access | ✅ |

### 🧾 Invoices
| Task | Endpoint | Requirement | Status |
|---|---|---|---|
| Update Invoice | `PATCH /invoices/:id` | Change lines/due date | ✅ |
| Cancel Invoice | `DELETE /invoices/:id` | Logic to void invoice | ✅ |
| Contact Linking | `contactId` on `POST /invoices` | Link to formal directory | ✅ |
| Payment Integration | `POST /invoices/:id/pay` | Should sync to Cash Book | ✅ |

### 📋 Reports & History
| Task | Endpoint | Requirement | Status |
|---|---|---|---|
| Cash Book Pagination | `GET /reports/cash-book` | Standard `page`/`limit` | ✅ |
| Type Filtering | `GET /reports/cash-book?type=` | Filter by sale/purchase/etc | ✅ |
| Contact History | `GET /contacts/:id/transactions` | Contact activity feed | ✅ |

---

## ✅ Priority 3 — Complete

### 🏦 Business Infrastructure
- **Bank Validation:** `POST /business/bank/validate` to resolve account names via provider. (Mock resolution implemented). ✅
- **Dedicated Scheduling:** `PATCH /business/reminder-time` for granular notification control. ✅

### 📄 Document Generation
- **Invoice PDF:** `GET /invoices/:id/pdf` placeholder/boilerplate implemented. ✅

---

## 🏗️ Architectural Audit Summary

1. **Cash Book vs Invoices:** Resolved. Invoice payments now synchronously create `Transaction` records in the Cash Book.
2. **Staff Boundary:** Resolved. `RolesGuard` implemented and enforced across all sensitive endpoints (Reports, Business Profile updates, Staff Management).
3. **Data Privacy:** Resolved. API automatically filters sensitive fields like `costPrice` for staff members.
4. **API Documentation:** 100% module coverage achieved across `docs/modules/`.
