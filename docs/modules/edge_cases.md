# System Edge Cases & Safety Mechanisms

This document outlines the hidden safety features and edge cases handled by the NairaFlow API to ensure the frontend team is aware of system behavior during complex scenarios.

## 🛡️ Inventory & Concurrency

### 1. The "Overselling" Race Condition
**Scenario:** Two staff members sell the last item of a product at the exact same millisecond.
**Handled:** Every transaction is wrapped in a database-level `Prisma Transaction`. When `recordSale` runs, it decrements the stock. If the stock check and decrement aren't atomic, children could end up with negative stock. We use atomic decrements to ensure only one sale succeeds if stock is 1.

### 2. Referential Integrity
**Scenario:** User tries to delete a `Category` that still has `Products`.
**Handled:** The database blocks this deletion. The frontend should prompt the user to "Move products to a different category first."

## 💰 Financial Integrity

### 3. Partial Credit (The "Split Payment" Case)
**Scenario:** A customer buys items for ₦5,000 but only pays ₦2,000 upfront.
**Handled:** 
- The `Transaction` is recorded for ₦5,000 with `amountPaid = 2000`.
- A `Debt` is automatically created with `totalAmount = 5000` and `paidAmount = 2000`.
- The Reports module correctly identifies the net cash flow as +₦2,000.

### 4. Floating Point Precision
**Scenario:** Handling fractions of Naira (e.g., calculations involving percentage-based discounts).
**Handled:** The API uses **Decimal** types (via PostgreSQL `decimal` and Prisma `Decimal` class) instead of IEEE-754 Floats. This prevents rounding errors (e.g., `0.1 + 0.2 !== 0.3`).

## 🔐 Security & Access

### 5. Refresh Token Hijacking
**Scenario:** A hacker steals a user's `refreshToken`.
**Handled:** **Refresh Token Rotation**. Every time a refresh token is used, it is revoked and replaced. If a hacker and a real user both try to use the same refresh token, the rotation mismatch will invalidate all sessions for that account, forcing a re-login.

### 6. Role-Based Restricted Scoping
**Scenario:** A staff member tries to update the owner's bank account.
**Handled:** (In the Staff Guard) Staff members are restricted from the `/business/profile` PATCH endpoint. Access is denied via 403 Forbidden.

## 🧾 Invoicing

### 7. Concurrent Invoice numbering
**Scenario:** Two staff members create an invoice at the same time.
**Handled:** Invoice numbers are generated using a dedicated `InvoiceCounter` database table with atomic increments. This guarantees sequential, gap-free, and duplicate-free numbering even under high concurrency — no locks or race conditions possible.

### 8. Database Query Performance
**Scenario:** A business with thousands of transactions, contacts, and products experiences slow dashboard loading.
**Handled:** 
- **DB-Level Aggregations:** The dashboard and summary endpoints use PostgreSQL `GROUP BY` and `SUM` operations instead of fetching all rows and computing in application code. This keeps response times constant regardless of data volume.
- **Composite Indexes:** Strategic database indexes on `(businessId, createdAt)`, `(businessId, type)`, and `(businessId, status)` ensure all filtered queries use index scans.
- **Pagination:** All list endpoints support `page`/`limit` parameters to prevent loading entire tables into memory.
