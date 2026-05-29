# Unified Schema Plan — Multi-Vertical Data Model

> **Status:** Draft for review  
> **Goal:** One schema that serves Retail, Freelancer/Agency, and Shortlet/Hospitality businesses without duplication.

---

## 1. Schema Overlap Matrix

Mapping the three domain schemas against the existing NairaFlow data model.

### 1.1 Business Profile

| User's Field | Current NairaFlow | Verdict |
|-------------|-------------------|---------|
| BusinessID | `Business.id` | ✅ Exists |
| BusinessName / BrandName | `Business.name` | ✅ Exists |
| BusinessType / ServiceCategory | `Business.businessType` | ✅ Added (P0) |
| OwnerName | — | ❌ Missing |
| PhoneNumber | `Business.ownerPhone` | ✅ Exists |
| EmailAddress | `Business.email` | ✅ Exists |
| Location | `Business.state` + `Business.city` | ✅ Exists |
| StartDate | `Business.createdAt` | ✅ Exists |
| PlanType (Starter/Growth/Premium) | — | ❌ Missing |
| Status (Active/Inactive) | `Business.isActive` | ✅ Exists |

---

### 1.2 Contacts (Customers / Clients / Guests)

| User's Field | Current NairaFlow | Verdict |
|-------------|-------------------|---------|
| CustomerID / ClientID / GuestID | `Contact.id` | ✅ Exists |
| BusinessID / FreelancerID / PropertyBusinessID | `Contact.businessId` | ✅ Exists |
| CustomerName / ClientName / GuestName | `Contact.name` | ✅ Exists |
| PhoneNumber | `Contact.phone` | ✅ Exists |
| EmailAddress | `Contact.email` | ✅ Exists |
| CustomerSource / ClientSource / GuestSource | — | ❌ Missing |
| FirstPurchaseDate / FirstProjectDate / FirstBookingDate | Computed from transactions | ⚠️ Query, not stored |
| LastPurchaseDate / LastProjectDate / LastBookingDate | Computed from transactions | ⚠️ Query, not stored |
| TotalPurchases / TotalProjects / TotalBookings | Computed from transactions | ⚠️ Query, not stored |
| TotalSpend | Computed from transactions | ⚠️ Query, not stored |
| CustomerStatus / ClientStatus / GuestStatus | — | ❌ Missing (or computed) |

> **Decision:** `source` and `customerStatus` should be added as fields. The purchase/project/booking counts and spend are better computed via aggregation queries than stored and kept in sync. This avoids staleness.

---

### 1.3 Products & Services

| User's Field | Current NairaFlow | Verdict |
|-------------|-------------------|---------|
| ProductID / ServiceID | `Product.id` | ✅ Exists |
| BusinessID / FreelancerID | `Product.businessId` | ✅ Exists |
| ProductName / ServiceName | `Product.name` | ✅ Exists |
| ProductCategory / ServiceCategory | `Product.categoryId` → `Category` | ✅ Exists |
| CostPrice | `Product.costPrice` | ✅ Exists |
| SellingPrice / BasePrice | `Product.sellingPrice` | ✅ Exists |
| CurrentStock | `Product.stockLevel` | ✅ Exists |
| ReorderLevel | `Product.lowStockThreshold` | ✅ Exists (same concept) |
| Status (Active/Discontinued) | — | ❌ Missing |
| TrackStock | `Product.trackStock` | ✅ Added (P0) |
| DeliveryTimeline (freelancer) | — | ❌ Missing (freelancer-specific) |

---

### 1.4 Transactions (Sales, Purchases, Expenses)

| User's Field | Current NairaFlow | Verdict |
|-------------|-------------------|---------|
| SaleID / ExpenseID | `Transaction.id` | ✅ Exists |
| BusinessID / FreelancerID | `Transaction.businessId` | ✅ Exists |
| CustomerID / ClientID | `Transaction.contactId` | ✅ Exists |
| SaleDate / ExpenseDate | `Transaction.createdAt` | ✅ Exists |
| PaymentMethod | `Transaction.paymentMethod` | ✅ Exists |
| SalesChannel (WhatsApp, Instagram, Walk-in) | — | ❌ Missing |
| TotalAmount | `Transaction.amount` | ✅ Exists |
| Discount | — | ❌ Missing |
| NetAmount | Computed: amount - discount | ⚠️ Can be computed |
| RecordedBy (Staff/AI/Owner) | `Transaction.staffId` | ⚠️ Partial — no "AI"/"Owner" enum |
| Notes / Description | `Transaction.description` | ✅ Exists |
| ReceiptLink (expenses) | — | ❌ Missing |
| Expense Status (Approved/Pending) | — | ❌ Missing |

---

### 1.5 Sales Items / Transaction Lines

| User's Field | Current NairaFlow | Verdict |
|-------------|-------------------|---------|
| SalesItemID | `TransactionLine.id` | ✅ Exists |
| SaleID | `TransactionLine.transactionId` | ✅ Exists |
| ProductID | `TransactionLine.productId` | ✅ Exists |
| Quantity | `TransactionLine.qty` | ✅ Exists |
| UnitPrice | `TransactionLine.unitPrice` | ✅ Exists |
| CostPrice | `TransactionLine.unitCost` | ✅ Exists |
| LineTotal | Computed: qty × unitPrice | ⚠️ Compute, don't store |
| GrossProfit | Computed: lineTotal − (qty × unitCost) | ⚠️ Compute, don't store |

---

### 1.6 New Entities (No Current Equivalent)

| Entity | Domain | Priority | Notes |
|--------|--------|----------|-------|
| **Leads / Inquiries** | Retail, Freelancer | P1 | Pre-customer prospects. Shared model works for both. |
| **Projects** | Freelancer | P1 | Groups multiple tasks, milestones, and payments under one client engagement. |
| **Project Tasks** | Freelancer | P2 | Subtasks within a project. Can start without this. |
| **Properties** | Shortlet | P1 | Rooms/apartments with rates and availability. |
| **Bookings** | Shortlet | P1 | Date-based reservations linking property to guest. |
| **Maintenance** | Shortlet | P2 | Repair/issues tracking for properties. |
| **Reviews** | Shortlet | P2 | Guest feedback tied to bookings. |
| **Daily Summary** | All | P2 | Pre-computed daily metrics. Can be implemented as a cached view later. |

---

## 2. Proposed Unified Schema

### 2.1 Changes to Existing Models

#### Business — Add 2 fields

```
ownerName         String?    // Owner's full name (separate from business name)
planType          String?    // "starter" | "growth" | "premium"
```

`isActive`, `businessType`, and `createdAt` already exist.

#### Contact — Add 2 fields

```
source            String?    // "instagram" | "whatsapp" | "referral" | "walk_in" | "airbnb" | "booking_com" | "linkedin"
contactStatus     String?    // "new" | "returning" | "vip" | "inactive"
```

Spend/purchase counts remain computed via query. `type` already handles CUSTOMER/SUPPLIER/BOTH.

#### Product — Add 2 fields

```
status            String     @default("active")   // "active" | "discontinued"
deliveryTimeline  String?                          // e.g. "3-5 business days" (freelancer services)
```

`trackStock` already handles stock vs service distinction.

#### Transaction — Add 4 fields

```
salesChannel      String?    // "whatsapp" | "instagram" | "walk_in" | "airbnb" | "booking_com"
discount          Decimal    @default(0)
receiptLink       String?    // URL to uploaded receipt (for expenses)
expenseStatus     String?    // "approved" | "pending" | "rejected" (for expenses)
```

`salesChannel` is distinct from `paymentMethod`. A customer can buy via WhatsApp and pay via transfer.

---

### 2.2 New Models

#### Lead — Universal (Retail + Freelancer)

```prisma
model Lead {
  id              String    @id @default(cuid())
  businessId      String
  business        Business  @relation(fields: [businessId], references: [id])
  name            String
  phone           String?
  source          String?   // "instagram" | "whatsapp" | "referral" | "linkedin"
  interest        String?   // What product/service they asked about
  inquiryDate     DateTime  @default(now())
  status          String    @default("new")  // "new" | "follow_up" | "converted" | "lost"
  followUpDate    DateTime?
  assignedTo      String?   // StaffMember ID
  notes           String?
  convertedToContactId String? // Link to Contact if converted
  createdAt       DateTime  @default(now())

  @@index([businessId, status])
  @@index([businessId, inquiryDate])
}
```

**Design decisions:**
- Single `Lead` model serves both retail and freelancer. `interest` holds what product/service they asked about — no need to link to Product/Service table since leads are pre-purchase.
- When a lead converts, `convertedToContactId` links to the Contact record. This creates an audit trail from lead → customer.
- Shortlet businesses can use this too (guest inquiries before booking).
- No separate "InterestedProduct" foreign key — leads are informal, so a text field is more flexible.

---

#### Project — Freelancer/Agency

```prisma
model Project {
  id              String    @id @default(cuid())
  businessId      String
  business        Business  @relation(fields: [businessId], references: [id])
  clientId        String
  client          Contact   @relation(fields: [clientId], references: [id])
  serviceId       String?
  service         Product?  @relation(fields: [serviceId], references: [id])  // Optional link to service catalog
  title           String
  description     String?
  startDate       DateTime?
  deadline        DateTime?
  amount          Decimal
  amountPaid      Decimal   @default(0)
  paymentStatus   String    @default("pending")  // "pending" | "part_payment" | "paid"
  status          String    @default("ongoing")  // "ongoing" | "completed" | "revision" | "cancelled"
  notes           String?
  createdAt       DateTime  @default(now())

  tasks           ProjectTask[]
  invoices        Invoice[]  // Optional: link formal invoices to project

  @@index([businessId, clientId])
  @@index([businessId, status])
}
```

**Design decisions:**
- `serviceId` is optional — freelancers can link a project to their service catalog, or just describe it in `title`.
- `amount` and `amountPaid` track project finances. A full payment integration can be done via invoices linked to the project.
- `paymentStatus` is derived from `amountPaid` vs `amount`: pending (0), part_payment (partial), paid (full).
- Project tasks are a separate table for granularity.

---

#### ProjectTask — Freelancer/Agency (P2, can defer)

```prisma
model ProjectTask {
  id          String    @id @default(cuid())
  projectId   String
  project     Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  title       String
  assignedTo  String?   // StaffMember ID
  startDate   DateTime?
  dueDate     DateTime?
  status      String    @default("pending")  // "pending" | "ongoing" | "completed"
  notes       String?
  createdAt   DateTime  @default(now())

  @@index([projectId])
}
```

---

#### Property — Shortlet

```prisma
model Property {
  id              String    @id @default(cuid())
  businessId      String
  business        Business  @relation(fields: [businessId], references: [id])
  name            String
  type            String?   // "apartment" | "duplex" | "studio" | "house"
  rooms           Int       @default(1)
  address         String?
  dailyRate       Decimal
  weekendRate     Decimal?
  cleaningFee     Decimal   @default(0)
  status          String    @default("available")  // "available" | "occupied" | "maintenance"
  createdAt       DateTime  @default(now())

  bookings        Booking[]
  maintenance     Maintenance[]

  @@index([businessId, status])
}
```

**Design decisions:**
- `weekendRate` is optional — falls back to `dailyRate` if not set.
- `status` reflects current state. "Occupied" is derived from active bookings.
- Property is NOT a Product — it has fundamentally different attributes (dates, rates, rooms). Forcing it into Product would create a mess of conditional logic.

---

#### Booking — Shortlet

```prisma
model Booking {
  id              String    @id @default(cuid())
  propertyId      String
  property        Property  @relation(fields: [propertyId], references: [id])
  guestId         String
  guest           Contact   @relation(fields: [guestId], references: [id])
  bookingDate     DateTime  @default(now())
  checkIn         DateTime
  checkOut        DateTime
  guests          Int       @default(1)
  source          String?   // "airbnb" | "booking_com" | "whatsapp" | "direct" | "instagram"
  amount          Decimal
  amountPaid      Decimal   @default(0)
  paymentStatus   String    @default("pending")  // "pending" | "paid"
  status          String    @default("confirmed") // "confirmed" | "checked_in" | "completed" | "cancelled"
  notes           String?
  createdAt       DateTime  @default(now())

  reviews         Review[]

  @@index([propertyId, checkIn, checkOut])
  @@index([guestId])
  @@index([businessId, status])  // needs businessId for scoping
}
```

> **Note:** `businessId` is needed on Booking for query scoping. Either add it directly or join through Property.

**Better:** Add `businessId` directly to avoid the join:

```prisma
model Booking {
  id              String    @id @default(cuid())
  businessId      String
  business        Business  @relation(fields: [businessId], references: [id])
  propertyId      String
  property        Property  @relation(fields: [propertyId], references: [id])
  guestId         String
  guest           Contact   @relation(fields: [guestId], references: [id])
  // ... rest same
}
```

---

#### Maintenance — Shortlet (P2)

```prisma
model Maintenance {
  id              String    @id @default(cuid())
  propertyId      String
  property        Property  @relation(fields: [propertyId], references: [id])
  issue           String
  reportedDate    DateTime  @default(now())
  assignedTo      String?   // vendor/technician name
  resolutionDate  DateTime?
  cost            Decimal   @default(0)
  status          String    @default("pending")  // "pending" | "ongoing" | "resolved"
  notes           String?
  createdAt       DateTime  @default(now())

  @@index([propertyId, status])
}
```

---

#### Review — Shortlet (P2)

```prisma
model Review {
  id              String    @id @default(cuid())
  bookingId       String
  booking         Booking   @relation(fields: [bookingId], references: [id])
  guestId         String
  guest           Contact   @relation(fields: [guestId], references: [id])
  rating          Int       // 1-5
  comment         String?
  platform        String?   // "airbnb" | "booking_com" | "direct"
  status          String    @default("pending")  // "pending" | "resolved"
  createdAt       DateTime  @default(now())

  @@index([propertyId])  // via booking
}
```

---

## 3. Implementation Phases

### Phase 1 — Foundation (Must ship for all three verticals)

| # | Change | Type | Models Affected |
|---|--------|------|----------------|
| 1 | Add `ownerName`, `planType` to Business | Alter | Business |
| 2 | Add `source`, `contactStatus` to Contact | Alter | Contact |
| 3 | Add `status`, `deliveryTimeline` to Product | Alter | Product |
| 4 | Add `salesChannel`, `discount`, `receiptLink`, `expenseStatus` to Transaction | Alter | Transaction |
| 5 | Create `Lead` model | New | Lead |
| 6 | Create `Project` model | New | Project |
| 7 | Create `Property` model | New | Property |
| 8 | Create `Booking` model | New | Booking |

**Phase 1 delivers:**
- Retail: Full product/sales tracking with sales channels, discounts, leads, and customer sources
- Freelancer: Projects with clients, payment tracking, service catalog, leads
- Shortlet: Properties with rates, bookings with check-in/out, guest management

---

### Phase 2 — Depth (Post-MVP)

| # | Change | Type |
|---|--------|------|
| 9 | Create `ProjectTask` model | New |
| 10 | Create `Maintenance` model | New |
| 11 | Create `Review` model | New |
| 12 | Daily Summary caching layer | Infrastructure |
| 13 | Recurring invoice generation | Logic |

---

## 4. What Stays the Same

These existing models require **zero changes** — they already serve all three verticals:

| Model | Used By |
|-------|---------|
| **Category** | Retail (product categories), Freelancer (service categories) |
| **Debt** | Retail (customer credit), Freelancer (unpaid projects), Shortlet (unpaid bookings) |
| **Invoice** | Retail (formal bills), Freelancer (project invoices), Shortlet (booking receipts) |
| **StaffMember** | All — employee access management |
| **Transaction + TransactionLine** | All — the core ledger, already polymorphic via `type` field |
| **Quick-sale** (`POST /transactions/quick-sell`) | All — non-inventory transactions for any vertical |

---

## 5. Total Schema Size After Phase 1

| Category | Models |
|----------|--------|
| Existing (unchanged) | Category, Debt, Invoice, InvoiceLine, StaffMember, InvoiceCounter, SuperAdmin, AdminAuditLog |
| Existing (altered) | Business (+2 fields), Contact (+2), Product (+2), Transaction (+4) |
| New | Lead, Project, Property, Booking |
| **Total models** | **18** (up from 14) |

After Phase 2: 21 models (adds ProjectTask, Maintenance, Review).

---

## 6. Key Design Principles

1. **One model per concept, not per vertical.** `Contact` serves customers, clients, and guests. `Transaction` serves sales, purchases, and expenses. Don't create "RetailCustomer" and "ShortletGuest" — use `type` and `source` fields.

2. **Computed over stored where possible.** Customer lifetime value, purchase counts, booking totals — these are aggregation queries, not stored fields that drift out of sync.

3. **Separate only when attributes diverge fundamentally.** Property has dates, rates, and rooms. Product has stock and cost. They're different entities. But a lead is a lead whether they're asking about shoes or a logo design — one model.

4. **businessId on every model.** Every entity scoped to a business for multi-tenancy and simple query filtering.

5. **Status enums as strings, not separate tables.** `"active"`, `"inactive"`, `"ongoing"`, `"completed"` — simple, queryable, no joins needed.
