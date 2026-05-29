# NairaFlow for Shortlet & Hospitality

> Apartment rentals, short-stay operators, guest houses

## How It Works

Shortlet operators manage properties, bookings, guests, maintenance, and reviews — all in one place. Each property has a daily rate, optional weekend rate, and cleaning fee. Bookings link guests to properties with check-in/check-out dates. Payments can be split (deposit now, balance later).

## Key Features for Shortlet

| Feature | What It Does |
|---------|-------------|
| **Properties** | Add apartments/studios/duplexes with room count, rates, and address |
| **Bookings** | Create date-based reservations linking guests to properties |
| **Guest Management** | Track guests with booking history, source (Airbnb, Booking.com, WhatsApp), and status |
| **Payment Tracking** | Split payments — record deposits and track balances |
| **Maintenance** | Log issues per property, assign vendors, track costs and resolution |
| **Reviews** | Collect guest ratings (1-5) and feedback tied to bookings |
| **Invoices** | Issue formal invoices for bookings — deposit now, balance on arrival |
| **Expenses** | Track cleaning, utilities, repairs |
| **Dashboard** | Today's bookings, revenue, expenses, occupancy |

## Test Results (Verified)

| Step | What | Result |
|------|------|--------|
| Register & Login | Phone + PIN | ✅ |
| Guests | Added Michael Adebayo (Airbnb) and Sarah Johnson (Booking.com) | ✅ |
| Property | "Lekki Phase 1 — 3BR" apartment, ₦35K/night, ₦40K weekends, ₦5K cleaning | ✅ |
| Booking 1 | Michael: Jun 1-5, ₦140K (₦70K paid — deposit) | ✅ |
| Booking 2 | Sarah: Jun 10-12, ₦80K (fully paid) | ✅ |
| Maintenance | AC repair logged for Lekki Phase 1, assigned to CoolTech | ✅ |
| Review | Sarah rated 4/5 — "Great stay, clean apartment" | ✅ |
| Expense | Post-checkout deep clean ₦15,000 | ✅ |
| Invoice | INV-001 issued to Michael for the 4-night stay | ✅ |
| Dashboard | Revenue and expenses tracked | ✅ |

## Edge Cases to Be Aware Of

### Overlapping Bookings
The system currently does NOT validate that two bookings for the same property don't overlap. Two guests could book the same apartment for the same dates. **Always check the property calendar manually before confirming a booking.**

### Date Validation
The system does not enforce that `checkOut` is after `checkIn`. A booking with check-in Jun 10 and check-out Jun 5 would be accepted. **Always verify dates before creating.**

### Property Status
Booking a property that is under maintenance does not block the booking. The `status` field on Property is informational only.

### Payment Transitions
A booking marked as "paid" can still accept additional payments. The status is derived from `amountPaid >= amount`.

### Cancellation
There is no formal cancellation workflow. To cancel, update the booking status to "cancelled" manually via PATCH.

### Rate Calculation
Weekend vs weekday rates are NOT auto-calculated. The system stores rates but you must manually compute the total when creating a booking.

---

## API Response Examples

### Create property
`POST /properties`
```json
// Request
{ "name": "Lekki Phase 1 — 3BR", "type": "apartment", "rooms": 3, "dailyRate": 35000, "weekendRate": 40000, "cleaningFee": 5000 }

// Response
{
  "success": true,
  "data": {
    "id": "cmp...",
    "name": "Lekki Phase 1 — 3BR",
    "type": "apartment",
    "rooms": 3,
    "dailyRate": "35000",
    "weekendRate": "40000",
    "cleaningFee": "5000",
    "status": "available"
  }
}
```

### Create booking (with payment)
`POST /bookings`
```json
// Request
{
  "propertyId": "cmp...", "guestId": "cmp...",
  "checkIn": "2026-06-01T14:00:00Z", "checkOut": "2026-06-05T11:00:00Z",
  "guests": 2, "source": "airbnb",
  "amount": 140000, "amountPaid": 70000, "paymentMethod": "transfer"
}

// Response
{
  "success": true,
  "data": {
    "id": "cmp...",
    "property": { "name": "Lekki Phase 1 — 3BR", "status": "occupied" },
    "guest": { "name": "Michael Adebayo" },
    "checkIn": "2026-06-01T14:00:00.000Z", "checkOut": "2026-06-05T11:00:00.000Z",
    "amount": "140000", "amountPaid": "70000",
    "paymentStatus": "part_payment",
    "status": "confirmed"
  }
}
```

### Record additional payment (update booking)
`PATCH /bookings/:id`
```json
// Request — pay remaining balance
{ "amountPaid": 140000, "paymentMethod": "transfer" }

// Response
{
  "paymentStatus": "paid",
  "amountPaid": "140000"
}
// A sale transaction is automatically created for the payment delta (₦70,000)
```

### Cancel booking
`POST /bookings/:id/cancel`
```json
// Response
{ "status": "cancelled" }
// Property status auto-set back to "available" if no remaining bookings
```

### Overlap error (409)
```json
{ "success": false, "statusCode": 400, "message": "This property is already booked from 2026-06-01 to 2026-06-05." }
```

### Date validation error
```json
{ "success": false, "statusCode": 400, "message": "Check-out date must be after check-in date." }
```

## Relevant Endpoints

- `POST /properties` — Add property
- `POST /bookings` — Create booking
- `GET /bookings?propertyId=X` — View property calendar
- `POST /maintenance` — Log issue
- `POST /reviews` — Submit review
- `GET /reviews` — View guest feedback
- `POST /transactions/expense` — Record costs
- `POST /invoices` — Issue booking invoice
- `GET /reports/dashboard` — Daily overview
- `GET /reports/daily-summary` — Day-level aggregates with booking metrics

## Coming in Phase 2

- Booking calendar with visual date picker
- Automatic overlap detection (block double-booking)
- Date validation (checkOut must be after checkIn)
- Status-based booking rules (can't book maintenance properties)
- Auto rate calculation (weekday vs weekend)
- Cancellation workflow
- Cleaning fee auto-inclusion
