# SuperMart Online — API Documentation

## Authentication, Session & Shopping Access Module

- **Base URL:** `http://localhost:8080`
- **Content-Type:** `application/json`
- **Session Mechanism:** Servlet Container `HttpSession` with `JSESSIONID` HttpOnly, SameSite=Lax cookie.

---

### 1. Endpoint: Backend Health & Service Info

Returns the live status, version, and active service endpoints.

- **URL:** `/` or `/api`
- **Method:** `GET`
- **Authentication Required:** No (Public)

#### Response Example — HTTP `200 OK`
```json
{
  "status": "UP",
  "service": "SuperMart Online Backend API",
  "version": "1.0.0",
  "timestamp": "2026-10-18T09:44:21.000",
  "endpoints": {
    "customerRegistration": "POST /api/auth/register",
    "customerLogin": "POST /api/auth/login",
    "currentUser": "GET /api/auth/me",
    "customerLogout": "POST /api/auth/logout",
    "addToCart": "POST /api/cart/add",
    "cartCheckout": "POST /api/cart/checkout"
  },
  "message": "SuperMart Online API is running smoothly."
}
```

---

### 2. Endpoint: Customer Registration

Registers a new customer, hashes the password via BCrypt, assigns the `CUSTOMER` role, and creates an associated profile record.

- **URL:** `/api/auth/register`
- **Method:** `POST`
- **Authentication Required:** No (Public)
- **Role Assigned:** `CUSTOMER` (Strictly enforced)

#### Request Body
```json
{
  "firstName": "Kasun",
  "lastName": "Perera",
  "mobile": "+94771234567",
  "email": "kasun.perera@example.com",
  "password": "SecurePassword123!",
  "confirmPassword": "SecurePassword123!",
  "marketingOptIn": true
}
```

#### Response Example — HTTP `201 Created`
> **Security Notice:** Passwords and password hashes are never returned.

```json
{
  "success": true,
  "message": "Customer registration successful! Welcome to SuperMart Online.",
  "data": {
    "userId": 1,
    "firstName": "Kasun",
    "lastName": "Perera",
    "email": "kasun.perera@example.com",
    "mobile": "+94771234567",
    "role": "CUSTOMER",
    "accountStatus": "ACTIVE"
  }
}
```

---

### 3. Endpoint: Customer Login & Session Authentication

Authenticates a customer using either **email address OR mobile number** and a password. On success, sets an `HttpOnly` session cookie (`JSESSIONID`).

- **URL:** `/api/auth/login`
- **Method:** `POST`
- **Authentication Required:** No (Public)

#### Request Body
```json
{
  "identifier": "kasun.perera@example.com",
  "password": "SecurePassword123!"
}
```
*(Or using mobile number as the identifier: `"+94771234567"`)*

#### Success Response — HTTP `200 OK`
```json
{
  "success": true,
  "message": "Login successful. Welcome back!",
  "data": {
    "userId": 1,
    "firstName": "Kasun",
    "lastName": "Perera",
    "email": "kasun.perera@example.com",
    "mobile": "+94771234567",
    "role": "CUSTOMER",
    "accountStatus": "ACTIVE"
  }
}
```
*Response Header:* `Set-Cookie: JSESSIONID=...; Path=/; HttpOnly; SameSite=Lax`

#### Generic Authentication Failure — HTTP `401 Unauthorized`
> **Account Enumeration Defense:** Generic message returned for either invalid identifier or wrong password.
```json
{
  "timestamp": "2026-10-18T09:34:16.123",
  "status": 401,
  "error": "Invalid Credentials",
  "message": "Invalid email/mobile number or password."
}
```

#### Account Inactive Failure — HTTP `403 Forbidden`
```json
{
  "timestamp": "2026-10-18T09:34:16.456",
  "status": 403,
  "error": "Account Inactive",
  "message": "Your account is currently locked. Please contact customer support."
}
```

---

### 4. Endpoint: Get Current Authenticated User

Retrieves current profile information from the active `HttpSession`.

- **URL:** `/api/auth/me`
- **Method:** `GET`
- **Authentication Required:** Yes (Active session cookie required)

#### Success Response — HTTP `200 OK`
```json
{
  "success": true,
  "message": "Active session authenticated.",
  "data": {
    "userId": 1,
    "firstName": "Kasun",
    "lastName": "Perera",
    "email": "kasun.perera@example.com",
    "mobile": "+94771234567",
    "role": "CUSTOMER",
    "accountStatus": "ACTIVE"
  }
}
```

#### Unauthenticated Response — HTTP `401 Unauthorized`
```json
{
  "timestamp": "2026-10-18T09:34:16.789",
  "status": 401,
  "error": "Unauthorized",
  "message": "No active authenticated session. Please sign in."
}
```

---

### 5. Endpoint: Customer Logout

Invalidates the active `HttpSession` and clears server-side authenticated state.

- **URL:** `/api/auth/logout`
- **Method:** `POST`
- **Authentication Required:** Optional

#### Response Example — HTTP `200 OK`
```json
{
  "success": true,
  "message": "Logged out successfully.",
  "data": null
}
```

---

### 6. Endpoint: Add Item to Cart (Guarded Shopping Action)

Enforces that only authenticated customers can add products to a persistent shopping cart. Unauthenticated guests are blocked with HTTP `401 Unauthorized`.

- **URL:** `/api/cart/add`
- **Method:** `POST`
- **Authentication Required:** Yes (Active session)

#### Request Body
```json
{
  "productId": 1,
  "productName": "Farm Fresh Organic Strawberries",
  "quantity": 1
}
```

#### Success Response — HTTP `200 OK`
```json
{
  "success": true,
  "message": "Added Farm Fresh Organic Strawberries to your cart.",
  "data": {
    "productId": 1,
    "quantity": 1,
    "customerId": 1
  }
}
```

#### Blocked Guest Response — HTTP `401 Unauthorized`
```json
{
  "timestamp": "2026-10-18T09:34:16.901",
  "status": 401,
  "error": "Unauthorized",
  "message": "Authentication required. Please sign in to add items to your cart."
}
```

---

### 7. Endpoint: Checkout Guard Check

Verifies that the customer is authenticated before allowing checkout proceedings.

- **URL:** `/api/cart/checkout`
- **Method:** `POST`
- **Authentication Required:** Yes (Active session)

#### Success Response — HTTP `200 OK`
```json
{
  "success": true,
  "message": "Customer verified for checkout.",
  "data": {
    "customerId": 1
  }
}
```

#### Blocked Guest Response — HTTP `401 Unauthorized`
```json
{
  "timestamp": "2026-10-18T09:34:17.002",
  "status": 401,
  "error": "Unauthorized",
  "message": "Authentication required. Please sign in to proceed to checkout."
}
```
