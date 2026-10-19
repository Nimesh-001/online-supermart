# SuperMart Online — Member 5: Feature Documentation

## Order Lifecycle, Multi-Step ACID Checkout, Two-Phase Locking, Sales Triggers & Invoice Reporting

- **Project:** SuperMart Online
- **Member:** Member 5
- **Features Implemented:**
  1. Order Lifecycle & Status Workflow (`orders`, `order_items`, `payments`, `customer_addresses`)
  2. Multi-Step ACID Stored Procedure `sp_place_order(customer_id, cart_id, address_id, coupon_code, payment_method, OUT order_id, OUT order_number)`
  3. Dynamic Two-Phase Concurrency Check via Stored Procedure `sp_test_checkout_concurrency_lock(cart_id, OUT can_checkout)`
  4. Coupon Discount Evaluation via Stored Function `fn_calculate_coupon_discount(coupon_code, subtotal)`
  5. Automatic Stock Movement Audit Logging on Checkout via Trigger `trg_after_order_item_sale`
  6. Billing & Invoice Snapshots via Database View `v_order_invoices`
  7. Automated Expired Order Cancellation via Scheduled Event `evt_cancel_expired_orders`
- **Tech Stack:**
  - Frontend: React + Tailwind CSS (Vite) with slide-over Cart Checkout, Simulated Card / COD payments, and Order History Modal
  - Backend: Java 21 + Spring Boot (JdbcTemplate, Strict Layered Architecture)
  - Database: MySQL 8.0+ (`online_supermarket`)
  - Architecture: `OrderController` → `OrderService` → `OrderDao` → `JdbcTemplate` → `MySQL`

---

## 1. Database Artifacts Implemented & Utilized

Member 5 contributes **6 dedicated advanced database artifacts** across the database schema:

| Artifact Type | Name | Purpose |
| :--- | :--- | :--- |
| **Tables (4)** | `orders`, `order_items`, `payments`, `customer_addresses` | Stores customer order records, itemized snapshots at time of purchase, payment transactions (`CARD_TEST`, `COD`), and delivery locations. |
| **View (1)** | `v_order_invoices` | Provides unified invoice data including `order_number`, customer name, destination, subtotal, discount, delivery fee, total, order status, and payment method. |
| **Function (1)** | `fn_calculate_coupon_discount(coupon_code, subtotal)` | Evaluates coupon eligibility rules (e.g. `'SAVE10PLUS'` with `subtotal >= 5000.00` gives a 10% discount; otherwise `0.00`). |
| **Trigger (1)** | `trg_after_order_item_sale` | `AFTER INSERT ON order_items` trigger that automatically creates a `SALE` entry in `stock_movements` recording `-NEW.quantity`. |
| **Procedure (1)** | `sp_place_order` | Multi-step ACID checkout transaction: computes subtotal with `fn_get_cart_subtotal`, calculates discount with `fn_calculate_coupon_discount`, calculates delivery fee, creates order, inserts line item snapshots, decrements inventory, creates payment record with transaction reference, and converts cart. |
| **Procedure (2)** | `sp_test_checkout_concurrency_lock` | Concurrency check executing `FOR UPDATE` pessimistic row lock on cart items against warehouse inventory to verify availability before checkout. |
| **Event (1)** | `evt_cancel_expired_orders` | Scheduled background job running `EVERY 1 HOUR` that marks pending orders older than 24 hours as `CANCELLED`. |

---

## 2. API Endpoints (Member 5)

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/orders/checkout` | Yes (Customer) | Places order atomically using `sp_place_order` and returns `OrderInvoiceDto`. |
| `POST` | `/api/orders/test-lock` | Yes (Customer) | Tests two-phase concurrency check via `sp_test_checkout_concurrency_lock`. |
| `POST` | `/api/orders/validate-coupon` | Yes (Customer) | Validates coupon codes using function `fn_calculate_coupon_discount`. |
| `GET` | `/api/orders/my-orders` | Yes (Customer) | Returns customer order history and billing invoices from `v_order_invoices`. |
| `GET` | `/api/orders/{id}/invoice` | Yes (Customer) | Fetches a single order invoice snapshot. |
| `GET` | `/api/orders/addresses` | Yes (Customer) | Retrieves saved delivery addresses. |
| `POST` | `/api/orders/addresses` | Yes (Customer) | Adds or saves a new delivery address. |
| `GET` | `/api/orders/all` | Yes (Staff/Manager) | Operational Manager view of all system orders. |
| `PUT` | `/api/orders/{id}/status` | Yes (Staff/Manager) | Updates order fulfillment status (`CONFIRMED` -> `PROCESSING` -> `COMPLETED`). |
| `POST` | `/api/orders/cancel-expired` | Yes / Staff | Simulates scheduled event `evt_cancel_expired_orders` on demand. |

---

## 3. Automated Test Execution Summary

The Member 5 suite was verified using Maven:

```bash
cd backend
.\mvnw.cmd test -Dtest=OrderEngineIntegrationTest
```

- **Tests Run:** 8
- **Failures:** 0
- **Errors:** 0
- **Status:** **PASS (BUILD SUCCESS)**

| Test Case | Scope / Assertions | Result |
| :--- | :--- | :--- |
| **TC-M5-01** | `testCouponDiscountFunction`: Validates `fn_calculate_coupon_discount` under and over 5000 threshold. | **PASS** |
| **TC-M5-02** | `testCheckoutConcurrencyLock`: Verifies `sp_test_checkout_concurrency_lock` pessimistic row lock. | **PASS** |
| **TC-M5-03** | `testPlaceOrderStoredProcedure`: Executes `sp_place_order`, stock decrement, payment creation, invoice. | **PASS** |
| **TC-M5-04** | `testTriggerAfterOrderItemSale`: Asserts `trg_after_order_item_sale` logs sale into `stock_movements`. | **PASS** |
| **TC-M5-05** | `testViewOrderInvoices`: Verifies `v_order_invoices` returns full billing snapshots. | **PASS** |
| **TC-M5-06** | `testCancelExpiredOrders`: Verifies `evt_cancel_expired_orders` cancels stale unconfirmed orders. | **PASS** |
| **TC-M5-07** | `testCheckoutEndpoint`: REST endpoint `POST /api/orders/checkout` places order and returns invoice. | **PASS** |
| **TC-M5-08** | `testUpdateOrderStatusEndpoint`: REST endpoint `PUT /api/orders/{id}/status` updates status. | **PASS** |
