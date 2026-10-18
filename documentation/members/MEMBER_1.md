# SuperMart Online — Member 1: Feature Documentation

## Customer Registration, Authentication, Session Management & Shopping Access Control

- **Project:** SuperMart Online
- **Member:** Member 1
- **Features Implemented:**
  1. Customer Registration & Admin Setup Planning
  2. Registration Redirect & Privacy Fix
  3. Customer Login & BCrypt Authentication
  4. Secure HTTP Session Management (`HttpOnly` Cookie)
  5. Shopping Access Control & Persistent Cart Guards
- **Tech Stack:**
  - Frontend: React + Tailwind CSS (Vite)
  - Backend: Java 21 + Spring Boot (JdbcTemplate, Handwritten SQL)
  - Database: MySQL (`online_supermarket`)
  - Architecture: `Controller` → `Service` → `DAO` → `MySQL`
  - Design Aesthetics: White, black, and emerald-green color palette

---

## 1. System Roles Architecture

The system supports three distinct roles stored in the `roles` table:

| Role ID | Role Name | Description | Responsibilities & Access Scope |
| :--- | :--- | :--- | :--- |
| 1 | **`SUPER_ADMIN`** | System Administrator | Manages operational manager accounts, system settings, audit logs, and high-level administration. |
| 2 | **`OPERATIONAL_MANAGER`** | Operational Manager | Manages products, inventory, orders, coupons, and reports. Created only by Super Admin. |
| 3 | **`CUSTOMER`** | Public Shopper | Browses products, manages shopping cart, customer profile, and places orders. |

### Role Security Guarantee
- Public registration at `POST /api/auth/register` assigns **only** the `CUSTOMER` role (Role ID: 3).
- The registration request payload does **not** expose or accept any role parameter. Any role parameter injected by an external caller is strictly ignored.
- The service dynamically queries the `roles` table for `CUSTOMER` and maps the user record in `user_roles`. Under no circumstances can a user register themselves as `SUPER_ADMIN` or `OPERATIONAL_MANAGER`.

---

## 2. Customer Registration Flow & Redirect Fix

### A. Privacy & Navigation Fix (Requirement 1)
- **Previous Behavior:** Displayed customer ID, full name, email, and mobile in a detailed "registration success card" on the registration screen.
- **Fixed Behavior:**
  - When backend responds with `HTTP 201 Created`, the frontend displays a concise, non-sensitive success banner (*"Registration successful! Redirecting to login..."*).
  - Automatically redirects the user to the login screen (`/login`) after 1.5 seconds (or immediately on user click).
  - Customer personal details (ID, name, email, mobile) are **never** displayed on a post-registration success card.
  - Does **not** automatically log in the customer.
  - If registration fails (e.g. duplicate email/mobile, invalid inputs), the user remains on the registration form with clear field-level error messages.

### B. Validation & Security Rules
- **Backend Validation (Jakarta Validation):**
  - First Name: `@NotBlank`, length between 2 and 100 characters.
  - Last Name: `@NotBlank`, length between 2 and 100 characters.
  - Email: `@NotBlank`, `@Email`, max 150 characters, normalized to lowercase.
  - Mobile: `@NotBlank`, regex pattern `^[0-9+()\\-\\s]{7,20}$`.
  - Password: `@NotBlank`, minimum length of 6 characters.
  - Confirm Password: Must match Password exactly.
- **Duplicate Checks:**
  - Email uniqueness verified via `SELECT COUNT(*) FROM users WHERE email = ?`.
  - Mobile uniqueness verified via `SELECT COUNT(*) FROM users WHERE mobile = ?`.
  - Returns `409 CONFLICT` with explicit field-level error messages if duplicates are detected.
- **Password Hashing:**
  - Handled via `BCryptPasswordEncoder` (Spring Security Crypto).
  - Plaintext passwords and hashes are strictly forbidden from being logged or returned in responses.
- **Transactional Integrity:**
  - `@Transactional(rollbackFor = Exception.class)` wraps user creation, role assignment, and profile creation.

---

## 3. Login Flow, Authentication & Session Security (Requirement 2 & 3)

### A. Architecture
Follows the required strict layered architecture:
`CustomerAuthController` → `CustomerAuthService` → `UserDao` → `JdbcTemplate` → MySQL (`users`, `user_roles`, `roles`, `login_attempts`).

### B. Login Mechanics
1. **Identifier Flexibility:**
   - The login endpoint `POST /api/auth/login` accepts `identifier` (either Email OR Mobile Number) and `password`.
   - SQL queries look up the user by:
     ```sql
     SELECT u.user_id, u.first_name, u.last_name, u.email, u.mobile, u.password_hash,
            u.account_status, r.role_id, r.role_name
     FROM users u
     JOIN user_roles ur ON u.user_id = ur.user_id
     JOIN roles r ON ur.role_id = r.role_id
     WHERE LOWER(u.email) = LOWER(?) OR u.mobile = ?
     ```
2. **Password Verification:**
   - Verifies submitted plaintext password against stored BCrypt hash using `passwordEncoder.matches(request.getPassword(), user.getPasswordHash())`.
   - Plaintext passwords are never compared using standard string equality, nor stored anywhere.
3. **Anti-Enumeration Protection:**
   - If the user is not found, or if the password hash does not match, a generic `BadCredentialsException` is thrown:
     `"Invalid email/mobile number or password."`
   - Maps to `HTTP 401 Unauthorized`. An attacker cannot discern whether an email or mobile exists in the database.
4. **Account Status Verification:**
   - If `account_status != 'ACTIVE'` (e.g., `'INACTIVE'` or `'LOCKED'`), the system throws `AccountDisabledException` returning `HTTP 403 Forbidden` (*"Account is disabled or locked. Please contact support."*).
5. **Audit Logging:**
   - Every login attempt (successful or failed) is recorded in the `login_attempts` table with `user_id`, `ip_address`, `attempt_status` (`SUCCESS` or `FAILURE`), `user_agent`, and `attempted_at`.

### C. Secure Session Management (Zero LocalStorage Token Vulnerabilities)
- **Implementation:** Standard Java Servlet `HttpSession` managed by Spring Boot.
- **Cookie Security:**
  - Cookie name: `JSESSIONID`
  - `server.servlet.session.cookie.http-only=true`: JavaScript cannot access the session cookie, neutralizing Cross-Site Scripting (XSS) session theft.
  - `server.servlet.session.cookie.same-site=lax`: Protects against Cross-Site Request Forgery (CSRF).
  - `server.servlet.session.cookie.secure=false` (development) / `true` (HTTPS production).
  - Session timeout configured to 30 minutes.
- **Session Attributes:**
  - `AUTH_USER_ID`: Authenticated `user_id` (BIGINT).
  - `AUTH_USER_ROLE`: Authenticated role name (e.g., `'CUSTOMER'`).
- **Endpoints:**
  - `POST /api/auth/login`: Authenticates, invalidates old session, establishes new session, records audit, returns `LoginResponse`.
  - `GET /api/auth/me`: Validates active `HttpSession`. If valid, returns authenticated user details; if absent/invalid, returns `HTTP 401 Unauthorized`.
  - `POST /api/auth/logout`: Invalidates `HttpSession` on the server and clears `SecurityContextHolder`.

---

## 4. Navigation & Header Integration (Requirement 3)

### A. Navigation States
- **Guest State:** Header displays "Sign In" button and "Register" link.
- **Customer State:** Header displays customer full name, "Customer" badge, dynamic cart item counter badge, and a "Log Out" button.
- **Post-Registration:** Automatically transitions user to `/login`.
- **Post-Login:** Automatically navigates back to store home page (`/`) or to an intercepted destination (e.g., resuming an attempted checkout or cart add).
- **Logout:** Sends `POST /api/auth/logout`, clears local React authentication state, and resets the interface.

---

## 5. Shopping Access Control & Persistent Cart Guard (Requirement 4)

### A. Public vs. Protected Actions
- **Public (Guests & Customers):** Browsing products, searching categories, viewing store deals, reading product specifications.
- **Protected (Customers Only):**
  1. Adding items to cart (`POST /api/cart/add`).
  2. Accessing persistent cart data.
  3. Proceeding to checkout / order placement (`POST /api/cart/checkout`).

### B. Dual-Layer Enforcement
1. **Frontend UX Guard:**
   - If a guest clicks "Add to Cart" or "Checkout", the frontend intercepts the action, notifies the user (*"Please sign in to add items to your shopping cart"*), saves the pending action, and routes to `/login`.
   - After successful authentication, the pending action can be executed seamlessly.
2. **Backend Enforcement (Real Security Barrier):**
   - Hiding buttons is not security. `CustomerCartController` enforces authentication at the API layer:
     - Checks `session.getAttribute("AUTH_USER_ID")`.
     - If missing or null, throws `UnauthorizedException("Authentication required. Please sign in to access your shopping cart.")` returning `HTTP 401 Unauthorized`.
3. **Database Persistence:**
   - When an authenticated customer adds an item, `UserDaoImpl` checks or creates an active cart in `carts`:
     ```sql
     SELECT cart_id FROM carts WHERE customer_id = ? AND status = 'ACTIVE' LIMIT 1
     ```
     If none exists:
     ```sql
     INSERT INTO carts (customer_id, status, created_at, updated_at) VALUES (?, 'ACTIVE', NOW(), NOW())
     ```
   - Persists items in `cart_items` with appropriate foreign key handling.

---

## 6. Admin Account Setup Planning (Task B)

### Secure Bootstrap Strategy (Zero Hardcoded Passwords)
To prevent security vulnerabilities, the Super Admin account setup follows an air-gapped bootstrap process:

1. **No Hardcoded Defaults:**
   - Never commit default admin credentials (e.g., `admin / admin123`) into SQL scripts or source code.
2. **Controlled CLI Bootstrap Command:**
   - Administrative CLI command or Spring Boot bootstrap runner triggered explicitly via environment variables or CLI arguments:
     ```bash
     java -jar backend.jar --app.bootstrap.super-admin=true \
       --admin.firstName="Super" \
       --admin.lastName="Admin" \
       --admin.email="admin@supermart.com" \
       --admin.mobile="+94700000001" \
       --admin.tempPassword="<SECURE_RANDOMLY_GENERATED_PASSWORD>"
     ```
   - Verifies whether an account with `SUPER_ADMIN` role already exists. If one exists, bootstrap terminates with a warning.
   - Generates a BCrypt hash of the provided password, inserts the user into `users`, and inserts the `SUPER_ADMIN` role into `user_roles`.
   - Mandatory password change on first login (`account_status = 'ACTIVE'`).
3. **Subsequent Operational Manager Accounts:**
   - Created exclusively through a dedicated admin-only endpoint (`POST /api/admin/managers`) accessible only by authenticated `SUPER_ADMIN` sessions.

---

## 7. Verification & Automated Test Suite

All 13 integration tests were executed via `./mvnw.cmd test` against the local MySQL database with **100% success**:

### A. Test Execution Summary

| Test Class | Method | Requirement Verified | Status |
| :--- | :--- | :--- | :--- |
| `CustomerRegistrationIntegrationTest` | `testSuccessfulRegistration` | Registration inserts records, assigns CUSTOMER role, hashes password | **PASS** |
| `CustomerRegistrationIntegrationTest` | `testDuplicateEmailRejection` | Duplicate email returns HTTP 409 Conflict | **PASS** |
| `CustomerRegistrationIntegrationTest` | `testDuplicateMobileRejection` | Duplicate mobile returns HTTP 409 Conflict | **PASS** |
| `CustomerRegistrationIntegrationTest` | `testPasswordMismatch` | Mismatched password returns HTTP 400 Bad Request | **PASS** |
| `CustomerRegistrationIntegrationTest` | `testFieldValidations` | Invalid/empty fields return HTTP 400 with field errors | **PASS** |
| `AuthenticationAndShoppingAccessIntegrationTest` | `testSuccessfulLoginWithEmailAndSessionCreation` | Login with email returns 200, sets JSESSIONID, provides user info | **PASS** |
| `AuthenticationAndShoppingAccessIntegrationTest` | `testSuccessfulLoginWithMobileNumber` | Login with mobile number succeeds and sets session | **PASS** |
| `AuthenticationAndShoppingAccessIntegrationTest` | `testInvalidCredentialsGenericError` | Bad credentials return generic 401 without user enumeration | **PASS** |
| `AuthenticationAndShoppingAccessIntegrationTest` | `testDisabledAccountLoginRejected` | Inactive/disabled account returns 403 Forbidden | **PASS** |
| `AuthenticationAndShoppingAccessIntegrationTest` | `testGuestCannotAccessCartOrCheckout` | Unauthenticated cart/checkout returns 401 Unauthorized | **PASS** |
| `AuthenticationAndShoppingAccessIntegrationTest` | `testAuthenticatedCustomerCanAddCartItem` | Authenticated customer with session cookie can add to cart | **PASS** |
| `AuthenticationAndShoppingAccessIntegrationTest` | `testLogoutInvalidatesSession` | Logout invalidates session, subsequent `/me` returns 401 | **PASS** |
| `BackendApplicationTests` | `contextLoads` | Spring Boot application context boots cleanly | **PASS** |

**Total Tests Run: 13, Failures: 0, Errors: 0, Skipped: 0.**

### B. Frontend Production Build
- Executed `npm run build` in `frontend/`.
- Build completed successfully in 843ms with 0 errors and generated optimized production bundles in `frontend/dist/`.
