# SuperMart Online — Testing Checklist & Execution Results

## Member 1: Registration Redirect, Login Flow & Shopping Access Control

This checklist documents the test cases, execution commands, and verified results across both backend automated suites and frontend manual verification.

---

### 1. Automated Integration & Unit Tests

The backend test suite was executed against the active MySQL database instance using Maven:

```bash
cd backend
.\mvnw.cmd test
```

#### Test Execution Summary:
- **Total Tests Executed:** 13
- **Failures:** 0
- **Errors:** 0
- **Skipped:** 0
- **Status:** **PASS (BUILD SUCCESS)**

| Test Case | Method | Scope / Assertions | Result |
| :--- | :--- | :--- | :--- |
| **TC-01** | `contextLoads` | Verifies Spring Boot application context and HikariCP connection pool load cleanly. | **PASS** |
| **TC-02** | `testSuccessfulRegistration` | Sends valid registration payload via MockMvc to `POST /api/auth/register`. Verifies HTTP 201 Created, verifies record in `users`, verifies BCrypt hash (`$2a$`), verifies record in `customer_profiles`, verifies `CUSTOMER` role in `user_roles`, and ensures no password/hash is returned in JSON. | **PASS** |
| **TC-03** | `testDuplicateEmailRejection` | Registers a user, then submits another registration using the identical email address. Verifies HTTP 409 Conflict with duplicate email warning. | **PASS** |
| **TC-04** | `testDuplicateMobileRejection` | Registers a user, then submits another registration with identical mobile number. Verifies HTTP 409 Conflict with duplicate mobile warning. | **PASS** |
| **TC-05** | `testPasswordMismatch` | Submits payload where `password != confirmPassword`. Verifies HTTP 400 Bad Request with "Passwords do not match". | **PASS** |
| **TC-06** | `testFieldValidations` | Submits missing first name, last name, invalid phone format, invalid email, and short password (<6 chars). Verifies HTTP 400 Bad Request with field-level error mappings. | **PASS** |
| **TC-07** | `testValidEmailLogin` | Authenticates with valid email and password via `POST /api/auth/login`. Verifies HTTP 200, safe user payload, establishes active `HttpSession`, and verifies session access via `GET /api/auth/me`. | **PASS** |
| **TC-08** | `testValidMobileLogin` | Authenticates using registered mobile number as the identifier. Verifies HTTP 200 and successful session establishment. | **PASS** |
| **TC-09** | `testInvalidCredentialsGenericError` | Submits non-existent account or incorrect password. Verifies HTTP 401 Unauthorized with generic message (`"Invalid email/mobile number or password."`) preventing account enumeration. | **PASS** |
| **TC-10** | `testDisabledAccountLoginRejected` | Attempts login with an account having `account_status = 'LOCKED'`. Verifies HTTP 403 Forbidden with account inactive warning. | **PASS** |
| **TC-11** | `testGuestCartAccessBlocked` | Guest without active session calls `POST /api/cart/add` or `POST /api/cart/checkout`. Verifies HTTP 401 Unauthorized blocking persistent cart access. | **PASS** |
| **TC-12** | `testAuthenticatedCustomerCanAddToCart` | Authenticated customer calls `POST /api/cart/add` and `POST /api/cart/checkout`. Verifies HTTP 200 OK and persistent cart creation in MySQL `carts` table. | **PASS** |
| **TC-13** | `testLogoutInvalidatesSession` | Performs `POST /api/auth/logout`. Verifies session invalidation and verifies subsequent calls to `GET /api/auth/me` return HTTP 401 Unauthorized. | **PASS** |

---

### 2. Frontend Build Verification

The frontend React + Tailwind CSS code was compiled and bundled:

```bash
cd frontend
npm run build
```

- **Result:** **PASS** (1924 modules transformed, built in 585ms with zero errors or warnings).

---

### 3. Requirement Verification Matrix

| Requirement | Verified Behavior | Status |
| :--- | :--- | :--- |
| **Req 1.1** | Registration form validation preserved (client and server side). | **Verified** |
| **Req 1.2** | On HTTP 201 Created, registration form redirects automatically to the login page. | **Verified** |
| **Req 1.3** | Customer ID, name, email, mobile number, and registration-success card are **NOT** displayed. | **Verified** |
| **Req 1.4** | Newly registered customer is not automatically logged in. | **Verified** |
| **Req 1.5** | Failed registration stays on the form with duplicate or validation error messages. | **Verified** |
| **Req 2.1** | Login page accepts **email OR mobile number** and password. | **Verified** |
| **Req 2.2** | Password verified against stored BCrypt hash (no plain-text comparison or storage). | **Verified** |
| **Req 2.3** | Invalid credentials rejected with generic error (no account enumeration). | **Verified** |
| **Req 2.4** | Disabled / locked accounts rejected (HTTP 403). | **Verified** |
| **Req 2.5** | Real authenticated session established with `HttpOnly` cookie (`JSESSIONID`, SameSite=Lax). No localStorage tokens. | **Verified** |
| **Req 3.1** | Store header displays "Sign In" and "Register" for guests, and customer name + "Log Out" for authenticated customers. | **Verified** |
| **Req 3.2** | Successful registration redirects to login; successful login redirects to store home. | **Verified** |
| **Req 3.3** | Logged-in customer can log out, clearing session and returning to guest state. | **Verified** |
| **Req 4.1** | Guests can freely browse store and view public product information. | **Verified** |
| **Req 4.2** | Guests clicking "Add to Cart" or checkout are prompted to sign in and redirected safely to the login page. | **Verified** |
| **Req 4.3** | Backend enforces HTTP 401 on `POST /api/cart/add` and `POST /api/cart/checkout` for guests. | **Verified** |
| **Req 4.4** | Authenticated customer successfully adds items to persistent cart and receives instant visual feedback. | **Verified** |

---

### 4. Manual Testing Steps

#### Step 1: Start Backend
```powershell
cd E:\supermarket\online-supermart\backend
.\mvnw.cmd spring-boot:run
```
*(Listening on `http://localhost:8080`)*

#### Step 2: Start Frontend
```powershell
cd E:\supermarket\online-supermart\frontend
npm run dev
```
*(Listening on `http://localhost:5173`)*

#### Step 3: Browser Verification Steps (Open `http://localhost:5173` manually)
1. **Store Browsing:** View home page as guest. Notice "Sign In" and "Register" buttons in header.
2. **Protected Action Guard:** Click "Add to Cart" on any product deal. Notice automatic redirection to the Login page with the banner: *"Please sign in to add items to your cart."*
3. **Registration Flow:**
   - Click "Create Account" or navigate to Register.
   - Enter details and submit.
   - Observe: Notification banner appears: *"Registration successful! Redirecting you to the login page..."*
   - Observe: **No customer details or detailed card are shown.**
   - Automatically navigates to Login page with banner: *"Account registered successfully! Please sign in with your credentials."*
4. **Login Flow:**
   - Try invalid password: see generic error *"Invalid email/mobile number or password."*
   - Enter valid email or mobile and password.
   - Click "Sign In": redirects to Store Home page.
   - Notice header updates: shows customer's name and role, and a "Log Out" button.
5. **Authenticated Shopping:**
   - Click "Add to Cart": item is added to cart, cart badge increments, and confirmation toast is displayed.
6. **Logout:**
   - Click "Log Out" in header: session is invalidated, header returns to guest state.
