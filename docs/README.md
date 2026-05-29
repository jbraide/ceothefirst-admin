# NairaFlow API Documentation

Welcome to the NairaFlow API documentation. This modular documentation is designed to assist the frontend team in integrating the bookkeeping and inventory management features.

## 📁 Modules

- **[Authentication](./modules/authentication.md):** Registration, login, and PIN security.
- **[Business](./modules/business.md):** Profile management and bank validation.
- **[Inventory](./modules/inventory.md):** Products, categories, and stock tracking.
- **[Transactions](./modules/transactions.md):** Atomic recording of sales, purchases, and expenses.
- **[Debts](./modules/debts.md):** Automated tracking and repayment of credit transactions.
- **[Invoices](./modules/invoices.md):** Professional billing and payment tracking.
- **[Reports](./modules/reports.md):** Financial summaries and cash book log.
- **[Staff](./modules/staff.md):** Employee management and restricted access.
- **[Telegram](./modules/telegram.md):** Telegram bot integration for quick actions and notifications.
- **[Admin](./modules/admin.md):** Platform-wide dashboard and business management.
- **[Edge Cases](./modules/edge_cases.md):** Hidden safety mechanisms and race condition handling.

## 🚀 Environment Setup

**Base URL:** `http://localhost:3000/api/v1`

**Authentication:** Most endpoints require a Bearer Token in the `Authorization` header.
```bash
Authorization: Bearer <your_access_token>
```
