# NairaFlow for Freelancers & Agencies

> Marketing agencies, freelancers, consultants, logistics operators, creative agencies

## How It Works

Freelancers use NairaFlow in service mode. You build a service catalog (products with stock tracking turned off), manage clients as contacts, and track projects with payment milestones. Recurring invoices handle monthly retainers. Expenses track project costs for profitability analysis.

## Key Features for Freelancers

| Feature | What It Does |
|---------|-------------|
| **Service Catalog** | List services with pricing, delivery timelines, and categories |
| **Projects** | Track client engagements with deadlines, payment milestones, and status |
| **Clients** | Manage client contacts with source tracking and VIP/returning status |
| **Recurring Invoices** | Auto-generate monthly/quarterly invoices for retainer clients |
| **Quick Sale** | Record one-off gigs instantly with just an amount and description |
| **Expenses** | Track project costs — software subscriptions, freelancer payments, ads |
| **Leads** | Track prospective clients from LinkedIn, referrals, Instagram |
| **Dashboard** | Daily income, expenses, active projects, completed projects |

## Test Results (Verified)

| Step | What | Result |
|------|------|--------|
| Register & Login | Phone + PIN | ✅ |
| Clients | Zenith Bank PLC (VIP, LinkedIn), FoodCo Nigeria (returning, referral) | ✅ |
| Service Catalog | Category "Design Services", product "Brand Identity Design" (₦500K, 2-week delivery) | ✅ |
| Project 1 | Zenith Bank Rebrand — ₦1.5M (₦750K paid) | ✅ |
| Project 2 | FoodCo Social Media — ₦300K (fully paid, no service linked) | ✅ |
| Recurring Invoice | INV-001 for FoodCo, ₦300K monthly | ✅ |
| Quick Sale | Logo design gig ₦75,000 | ✅ |
| Expenses | Adobe Suite ₦50K, Internet ₦35K | ✅ |
| Lead | TechStart Inc — website redesign, ₦2M budget | ✅ |
| Dashboard | Money In: ₦75K, Money Out: ₦85K, 2 active projects | ✅ |
| Daily Summary | 2 new clients, 1 lead, 2 active, 0 completed | ✅ |

---

## API Response Examples

### Create project
`POST /projects`
```json
// Request
{
  "clientId": "cmp...", "serviceId": "cmp...",
  "title": "Zenith Bank Rebrand 2026",
  "description": "Full brand refresh",
  "startDate": "2026-05-20T00:00:00Z", "deadline": "2026-07-15T00:00:00Z",
  "amount": 1500000, "amountPaid": 750000
}

// Response
{
  "success": true,
  "data": {
    "id": "cmp...",
    "title": "Zenith Bank Rebrand 2026",
    "client": { "name": "Zenith Bank PLC" },
    "amount": "1500000", "amountPaid": "750000",
    "paymentStatus": "part_payment",
    "status": "ongoing"
  }
}
```

### Create recurring invoice
`POST /invoices/recurring`
```json
// Request
{
  "customerName": "FoodCo Nigeria", "contactId": "cmp...",
  "lines": [{ "description": "Monthly Social Media Management", "qty": 1, "unitPrice": 300000 }],
  "isRecurring": true, "recurringFrequency": "monthly"
}

// Response
{
  "invoiceNumber": "INV-001",
  "customerName": "FoodCo Nigeria",
  "totalAmount": "300000",
  "isRecurring": true,
  "recurringFrequency": "monthly",
  "status": "PENDING"
}
```

### Daily summary (freelancer)
`GET /reports/daily-summary`
```json
{
  "success": true,
  "data": {
    "date": "2026-05-26",
    "totalSales": 0, "totalExpenses": 0, "grossProfit": 0,
    "newCustomers": 0, "leadsReceived": 0,
    "activeProjects": 2, "completedProjects": 0,
    "bookedOrders": 0, "lowStockItems": 0
  }
}
```

## Relevant Endpoints

- `POST /inventory/products` — Add service (set trackStock=false)
- `POST /projects` — Create project with client, amount, deadlines
- `GET /projects` — View all projects with status filters
- `POST /invoices/recurring` — Create auto-renewing invoice
- `POST /transactions/quick-sell` — One-off gig payment
- `POST /transactions/expense` — Project and ops costs
- `POST /leads` — Track prospective clients
- `POST /contacts` — Add clients with source tracking
- `GET /reports/dashboard` — Daily overview
- `GET /reports/daily-summary` — Active/completed project counts
