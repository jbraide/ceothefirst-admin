# MVP Business Scope — Multi-Vertical Support Plan

> **Status:** Draft  
> **Target:** MVP Launch  
> **Goal:** Ensure NairaFlow serves all five target business classes at launch without overbuilding.

---

## 1. The Five Business Classes

NairaFlow's MVP must serve these distinct business types:

| # | Class | Examples | Volume Characteristics |
|---|-------|----------|----------------------|
| **1** | Product Sellers | Gadget shops (KACEO-style), fashion vendors, perfume sellers, mini-importers, Instagram vendors | Medium volume, inventory-centric |
| **2** | Crypto / Financial Operators | P2P traders, USDT merchants, FX operators | Low-medium volume, multi-currency, counterparty-heavy |
| **3** | Shortlet / Hospitality | Apartment rentals, short-stay operators, guest houses | Low volume, booking/date-based, deposit-balance payments |
| **4** | Service Businesses & Agencies | Marketing agencies, freelancers, consultants, logistics operators, creative agencies | Low-medium volume, project/retainer-based, expense-heavy |
| **5** | Food & Delivery | Cloud kitchens, food vendors, frozen food suppliers, chicken suppliers, restaurants | High volume (for vendors), inventory hybrid |

---

## 2. How the Current System Works

Today, NairaFlow is built around an inventory-first model. Every sale expects:

1. Products are pre-created in inventory with stock levels, cost price, and selling price.
2. A sale = selecting one or more products → stock is deducted automatically.
3. Profit = selling price minus cost price.
4. Categories organize products into groups.
5. Low-stock alerts warn when inventory runs low.

There is also a lighter "service sale" path — where you provide a description, quantity, and price instead of selecting a product. But this currently feels like a **workaround**, not a first-class flow.

---

## 3. Class-by-Class Fit Analysis

### Class 1: Product Sellers (Gadgets, Fashion, Perfume, Mini-Importers, Instagram Vendors)

**Fit:** ✅ Strong

The current inventory model was built for these businesses. They have physical stock, need to track what sells, and care about profit margins.

**Minor gaps (defer to Phase 2):**
- **Product variants** — A gadget in multiple colors/storage sizes or a perfume in 50ml vs 100ml requires separate product entries today. A parent-child variant system would be cleaner.
- **Serial / IMEI tracking** — High-value gadgets often need per-unit tracking.
- **One-off items** — Instagram vendors sometimes sell single unique items and may not want to create a product record first. The service-sale path partially covers this.

**Verdict:** Works today. No MVP changes required for this class.

---

### Class 2: Crypto / Financial Service Operators

**Fit:** ❌ Poor

These businesses have no physical inventory. Transactions involve buying and selling digital assets (USDT, BTC) with counterparties. Margins are rate-based: buy at ₦1,550/USDT, sell at ₦1,560/USDT.

**What works today:**
- Service-style sales (description + Naira amount) — can record trades
- Expense tracking — for operational costs
- Contacts — for counterparty tracking
- Credit/debt — for unsettled trades

**Gaps:**
- No multi-currency awareness. Selling "1,000 USDT" must be manually converted to a Naira amount.
- No concept of "rate" — users calculate Naira equivalents themselves.
- No P2P trade ledger showing net position per counterparty.

**MVP approach:** Accept Naira-only recording. Crypto operators can record each trade as a service sale with the Naira equivalent and a description noting the asset and rate. Full multi-currency support is Phase 2.

**Verdict:** Functional today if users denominate everything in Naira. Not ideal, but serviceable for MVP.

---

### Class 3: Shortlet / Hospitality Businesses

**Fit:** ❌ Poor

These businesses manage properties (rooms, apartments) booked by guests for specific dates. Payment is often split: deposit upfront, balance later or on arrival.

**What works today:**
- **Invoices** — Can issue a bill for the stay. Deposit → balance workflow maps well to invoice partial payments.
- **Contacts** — Guest records with contact details and history.
- **Expenses** — Cleaning, maintenance, utilities.

**Gaps:**
- No concept of a **booking** with check-in and check-out dates.
- No **calendar view** showing which properties are occupied when.
- Inventory doesn't map to "Room A available Dec 5-7."
- Can't see which guests are currently staying in which property.

**MVP approach:** Use invoices as the primary tool. Each booking = one invoice with the property and dates in the description. Properties can optionally be set up as products (with stock = 1 per unit) but this is clunky. A proper booking module with calendar is Phase 2.

**Verdict:** Invoices paper over the gaps for MVP. Hospitality-specific features are a Phase 2 deliverable.

---

### Class 4: Service Businesses & Agencies

**Fit:** ⚠️ Partial

These businesses sell expertise, not products. Revenue comes from projects, retainers, or milestone payments. Expenses (ad spend, freelancer costs, software) are significant and need to be tracked against client revenue for profitability.

**What works today:**
- Service-style sales — ✅
- Expenses — ✅
- Contacts as clients — ✅
- Invoices for formal billing — ✅
- Reports for revenue vs cost visibility — ✅
- Credit/debt for unpaid invoices — ✅

**Gaps:**
- No **recurring invoices** — A marketing agency billing a client ₦500,000 monthly must manually recreate the invoice each month.
- No **milestone/project tracking** — "50% upfront, 50% on completion" is doable via invoice partial payments but not intuitive.
- The app feels inventory-first. Service businesses may feel like second-class users.

**MVP approach:** Service sales + expenses + invoices already cover the core needs. The key change is making service-mode feel **native and intentional**, not a workaround. Recurring invoices are a strong P1 candidate.

**Verdict:** Works decently today. Needs UX elevation to "first-class" service mode.

---

### Class 5: Food & Delivery Businesses

**Fit:** ⚠️ Partial (hybrid)

This is a split class:

| Sub-type | Inventory Model | Fit |
|----------|----------------|-----|
| **Frozen food / chicken suppliers** | Traditional inventory — crates, cartons, bags | ✅ Strong |
| **Cloud kitchens / restaurants** | Sell prepared meals. Ingredients ≠ finished products. They sell "Jollof Rice ₦2,500," not "200g rice + 50g oil." | ⚠️ Needs menu-style, not ingredient tracking |
| **Food vendors** | High volume, fast pace. 100+ sales a day. Need speed above all. | ⚠️ Needs quick-sale mode |

**What works today:**
- **Suppliers** — Full inventory tracking works perfectly.
- **Restaurants** — Could add menu items as products with stock set to "not tracked" or unlimited. Or use service-style sales for each order.
- **Vendors** — Service-style sales work but the flow is too slow for high volume.

**Gaps:**
- **High-volume speed** — The current sale flow (select products → confirm → record) is too slow for someone doing 100+ daily transactions.
- **Menu management** — Creating 50+ products in inventory for a menu is tedious. No concept of a simple price list.
- **Modifiers / add-ons** — "Add extra meat +₦500." Post-MVP.
- **Delivery tracking** — Driver assignment, order status. Post-MVP.

**MVP approach:** This class is the strongest argument for a **quick-sale / POS mode**: tap a price, record it, next. No product lookup required. Suppliers get full inventory. Restaurants/vendors get speed.

**Verdict:** The high-volume food niche is underrated. A quick-sale mode is a high-impact MVP addition.

---

## 4. The Core Problem

All five classes map to two fundamental transaction patterns:

| Pattern | Businesses | Needs |
|---------|-----------|-------|
| **Inventory Sale** | Class 1, Class 5-suppliers | Select products → stock decrements → profit tracked |
| **Quick Sale (Non-Inventory)** | Class 2, 3, 4, 5-vendors | Amount + description → recorded → done |

The current system does both, but inventory is the "default" and quick sale feels like an escape hatch. The MVP needs to make both paths feel equally native.

---

## 5. MVP Scope: What We Build Now

### P0 — Must Have (Unlocks All 5 Classes)

#### 5.1 Quick-Sale / POS Mode

A streamlined sale recording flow that requires zero product selection:

| Field | Required? | Notes |
|-------|-----------|-------|
| Amount | Yes | The total sale value in Naira |
| Description | No | What was sold (e.g., "Jollof Rice x2", "USDT trade", "Consulting session") |
| Payment Method | Yes | Cash, Transfer, POS, or Credit |
| Customer / Contact | No | Optional link to a contact for history tracking |

**Behavior:**
- No stock is affected (no inventory link).
- If payment method is "Credit," a receivable debt is created as usual.
- Appears in Cash Book and Reports like any other sale.
- Fast: minimum taps from "new sale" to "done."

**Unlocks:** Classes 2, 3, 4, 5-vendors/restaurants.

#### 5.2 Optional Stock Tracking on Products

When creating or editing a product, a toggle: **"Track stock?"**

| Setting | Behavior |
|---------|----------|
| **On (default)** | Stock level tracked. Sales decrement stock. Low-stock alerts fire. |
| **Off** | Stock is unlimited / not tracked. Sales do not decrement. No low-stock alerts. |

**Use cases:**
- A restaurant adds "Jollof Rice" as a product. Stock tracking = off. It appears in the product list for quick selection but doesn't require stock management.
- A service business adds "Logo Design" as a product for quick sale selection. Stock tracking = off.

**Unlocks:** Classes 4 (service catalogs), 5 (digital menus).

---

### P1 — Strongly Recommended

#### 5.3 Business Type at Onboarding

During registration, after entering phone + PIN + business name, the user selects their business type:

| Option | App Behaviour |
|--------|--------------|
| **I sell products** | Inventory-first dashboard. Products and stock front-and-center. Quick-sale available but secondary. |
| **I provide services** | Service-first dashboard. Quick-sale prominent. Invoices and expenses front-and-center. Inventory available but secondary. |
| **Both** | Hybrid dashboard. Equal weight to both flows. |

**Impact:** Low implementation cost, high perceived fit. Makes each class feel like the app was built for them.

#### 5.4 Recurring Invoices

Ability to mark an invoice as recurring with a frequency (weekly, monthly, quarterly). The system auto-generates the next invoice on schedule.

**Unlocks:** Class 3 (monthly shortlet billing), Class 4 (agency retainers).

---

### P2 — Phase 2 (Post-MVP)

| Feature | For |
|---------|-----|
| Booking management (date-based availability, check-in/out, calendar) | Class 3 — Hospitality |
| Multi-currency awareness (USDT, BTC alongside Naira) | Class 2 — Crypto |
| Product variants (parent product → child SKUs: size, color, storage) | Class 1 — Fashion, Gadgets |
| Menu modifiers (add-ons, customizations per item) | Class 5 — Restaurants |
| Serial number / IMEI tracking per unit | Class 1 — Gadgets |
| Delivery management (driver assignment, order status) | Class 5 — Food delivery |

---

## 6. What Stays the Same

These features work across all classes without modification:

- **Authentication** — Phone + PIN for all users.
- **Contacts** — Customers, suppliers, clients, guests, counterparties. All classes benefit.
- **Debts (Receivables & Payables)** — Credit tracking works regardless of business type.
- **Expenses** — Universal. Every business has operational costs.
- **Reports & Dashboard** — Aggregates work the same; quick-sale and inventory-sale both feed into the same cash book.
- **Staff** — Employee access control is class-agnostic.
- **Invoices** — Formal billing works for all.

---

## 7. Summary: What MVP Delivers Per Class

| Class | MVP Experience |
|-------|---------------|
| **1 — Product Sellers** | Full inventory management. Products, stock, categories, profit tracking. Quick-sale available for one-off items. |
| **2 — Crypto Operators** | Quick-sale mode for trades. Contacts for counterparties. Naira-only (manual conversion). Expenses for ops costs. |
| **3 — Hospitality** | Invoices for bookings with deposit → balance workflow. Contacts for guests. Expenses for maintenance. Manual date tracking in descriptions. |
| **4 — Service Businesses** | Quick-sale + invoices as first-class flows. Expenses for project costs. Contacts for clients. Recurring invoices for retainers (P1). |
| **5 — Food & Delivery** | Suppliers get full inventory. Vendors/restaurants get quick-sale POS mode + optional stock tracking for menu items. |

---

## 8. What "Done" Looks Like

For MVP launch, a user from any of the five classes should be able to:

1. ✅ Sign up and select their business type.
2. ✅ Record their primary type of transaction (inventory sale or quick sale) in under 15 seconds.
3. ✅ Track who owes them money and who they owe.
4. ✅ See their daily financial summary on the dashboard.
5. ✅ Add staff if needed with appropriate restrictions.
6. ✅ Issue invoices to customers/clients when formal documentation is required.
7. ✅ Record expenses and see them reflected in reports.
