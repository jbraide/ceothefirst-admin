# Frontend Integration Guide (v3)

How the frontend handles multi-business accounts.

---

## App Flow

```
App Launch
    │
    ▼
Check stored token
    │
    ├── No token → Login Screen
    │
    └── Has token → Is it expired?
           │
           ├── Expired → Use refresh token → Retry
           │
           └── Valid → Is businessId present?
                  │
                  ├── No (owner token) → Business Picker Screen
                  │
                  └── Yes (business token) → Dashboard
```

---

## Screen: Login

**Fields:** Phone, PIN, [Login button]

**On success:**
1. Store `accessToken` and `refreshToken`
2. Check `businesses` array:
   - Empty → "You don't have any businesses yet. Create one?"
   - One business → Auto-select it (call `/auth/select-business`)
   - Multiple → Show business picker

---

## Screen: Business Picker

Show list of businesses from login response:

```
┌─────────────────────────────────┐
│  Choose a business              │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 📱 Lagos Gadgets Hub      │  │
│  │    Retail · Growth         │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ 💱 BlockTrade FX          │  │
│  │    Financial Services      │  │
│  │    Starter                 │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ 🎨 Pixelcraft Studio      │  │
│  │    Creative Agency         │  │
│  │    Starter                 │  │
│  └───────────────────────────┘  │
│                                 │
│  [+ Create New Business]        │
└─────────────────────────────────┘
```

**On tap:** Call `/auth/select-business` → get business-scoped token → navigate to dashboard.

---

## Screen: Create Business

**Fields:** Name, Business Type (dropdown from manifest), Category (auto-set from type)

**On success:**
- If this is the first business → auto-select it
- If there are others → go back to picker (new business appears in list)

---

## Switching Businesses

**Trigger:** Settings → "Switch Business" or a switcher in the nav bar.

1. Call `GET /businesses` to get current list
2. Show picker screen (same as after login)
3. On select: call `/auth/select-business` → replace token → reset app state

**What resets:**
- All cached data (products, transactions, contacts — they belong to the old business)
- Dashboard state
- Navigation stack

**What persists:**
- Owner auth token (used to call `/auth/select-business`)

---

## Token Management

```typescript
interface AuthState {
  ownerToken: string | null;       // For login / business management
  businessToken: string | null;    // For all business operations
  refreshToken: string | null;
  currentBusiness: Business | null;
  businesses: Business[];
}

// When making API calls:
function getAuthHeader(): string {
  return `Bearer ${authState.businessToken || authState.ownerToken}`;
}
```

---

## Edge Cases for Frontend

| Scenario | Handling |
|----------|----------|
| Token expires mid-session | Refresh using `/auth/token/refresh` |
| User has 1 business | Auto-select on login — no picker needed |
| User creates business | If first business, auto-select |
| User deletes last business | Show "Create your first business" screen |
| Staff login | No business switcher — staff is tied to one business |
| Deep link / notification | Ensure business-scoped token before navigating |
