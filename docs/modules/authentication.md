# Authentication Module

The Authentication module handles user onboarding, session management, and secure PIN recovery.

## Security & Functional Logic

### 🔐 PIN-based Onboarding
- **Format:** Users must provide a **4-digit numerical PIN**.
- **Hashing:** The system never stores the plain PIN. It is hashed with `bcrypt` (10 rounds) before storage.
- **Uniqueness:** Businesses are identified by their Phone Number. Each phone number can only be registered once.

### 🎫 Token Management (JWT)
- **Claims:** The `accessToken` contains the `businessId` (as the `sub` claim) and the `phone`.
- **Expiration:** Access tokens are short-lived (60 minutes). Refresh tokens last 7 days.
- **Rotation:** When you use a Refresh Token to get a new Access Token, the system deletes the old Refresh Token and issues a new one. This ensures that a stolen Refresh Token becomes useless as soon as the real user's app rotates it.

### 🛡️ PIN Reset Flow
1. **Verification:** The system generates a random 4-digit OTP.
2. **Persistence:** The OTP is stored in Redis with a 5-minute expiration.
3. **Delivery:** The SMS is processed as a background job via BullMQ to avoid slowing down the API response.

### 🔄 Token Rotation
NairaFlow uses a secure token rotation mechanism. The Refresh Token is hashed and stored in the database. When a new Access Token is requested, the Refresh Token is replaced (rotated) to prevent replay attacks.

- **Endpoint:** `POST /auth/token/refresh`

### 🛡️ PIN Reset (OTP)
Uses a two-step verification process:
1. **Request:** Generates a 4-digit OTP, stores it in Redis (5m TTL), and queues an SMS via BullMQ.
2. **Confirm:** Verifies the OTP and updates the PIN.

---

## API Reference

### Register
`POST /auth/register`
```json
{
  "phone": "08000000001",
  "pin": "1234",
  "businessName": "Demo Store"
}
```

### Login (Business Owner)
`POST /auth/login`
```json
{
  "phone": "08000000001",
  "pin": "1234"
}
```

### Login (Super Admin)
`POST /auth/admin/login`
Dedicated login for platform administrators.
```json
{
  "email": "admin@nairaflow.com",
  "password": "admin_password"
}
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1Ni...",
    "refreshToken": "eyJhbGciOiJIUzI1Ni..."
  }
}
```

### Refresh Token
`POST /auth/token/refresh`
**Request:**
```json
{ "refreshToken": "current_refresh_token" }
```
**Response Example:**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_access_token",
    "refreshToken": "new_rotated_refresh_token"
  }
}
```

### PIN Reset (Request)
`POST /auth/pin/reset-request`
**Request:**
```json
{ "phone": "08000000001" }
```
**Response:** `{"success": true, "message": "OTP sent to phone"}`

### PIN Reset (Confirm)
`POST /auth/pin/reset-confirm`
**Request:**
```json
{
  "phone": "08000000001",
  "otp": "1234",
  "newPin": "5678"
}
```
**Response:** `{"success": true, "message": "PIN updated successfully"}`
