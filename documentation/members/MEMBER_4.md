# SuperMart Online — Member 4: Feature Documentation

## Shopping Cart Lifecycle, Order Line Calculations, Transaction Savepoints & Abandoned Cart Cleanup

- **Project:** SuperMart Online
- **Member:** Member 4
- **Features Implemented:**
  1. Active Shopping Cart Management & Session Association (`carts` & `cart_items`)
  2. Dynamic Order Line Calculation via Database View `v_cart_details` (differentiating `KG` vs `EACH` price computation)
  3. Automated Cart Subtotal Calculation via Stored Function `fn_get_cart_subtotal(p_cart_id)`
  4. Cart Quantity Integrity & Non-Zero Enforcement via MySQL Trigger `trg_validate_cart_qty` (SQLSTATE 45000)
  5. Upsert Cart Item Ingestion via Stored Procedure `sp_add_to_cart(p_cart_id, p_product_id, p_quantity)`
  6. High-Concurrency Stock Reservation with Transaction Savepoints via Stored Procedure `sp_reserve_cart_with_savepoint(p_cart_id, p_product_id, p_qty, OUT p_reserve_status)`
  7. Automated Periodic Abandoned Cart Cleanup via MySQL Scheduled Event `evt_cleanup_abandoned_carts`
- **Tech Stack:**
  - Frontend: React + Tailwind CSS (Vite) with interactive slide-over `CartDrawer` and real-time ADBMS Concurrency Sandbox
  - Backend: Java 21 + Spring Boot (JdbcTemplate, Strict Layered Architecture)
  - Database: MySQL 8.0+ (`online_supermarket`)
  - Architecture: `CustomerCartController` → `CartService` → `CartDao` → `JdbcTemplate` → `MySQL`

---

## 1. Database Artifacts Implemented & Utilized

Member 4 contributes **6 dedicated advanced database artifacts** across the database schema:

| Artifact Type | Name | Purpose |
| :--- | :--- | :--- |
| **Tables (2)** | `carts`, `cart_items` | Stores customer cart state (`ACTIVE`, `COMPLETED`, `ABANDONED`) and associated line items with timestamps. |
| **View (1)** | `v_cart_details` | Joins `cart_items`, `products`, and `carts` to calculate line totals dynamically: `ROUND(ci.quantity * p.price_per_kg, 2)` for produce sold in KG vs `ROUND(ci.quantity * p.price_per_item, 2)` for packaged goods sold in EACH. |
| **Function (1)** | `fn_get_cart_subtotal(p_cart_id)` | Deterministic SQL function aggregating the line totals for an active cart into a precise decimal subtotal. |
| **Trigger (1)** | `trg_validate_cart_qty` | `BEFORE INSERT` and `BEFORE UPDATE` trigger on `cart_items` that throws SQLSTATE `45000` (`'Cart item quantity must be greater than zero'`) if `NEW.quantity <= 0`. |
| **Procedure (1)** | `sp_add_to_cart(p_cart_id, p_product_id, p_quantity)` | Handles adding items into the cart or safely updating existing line quantities using `ON DUPLICATE KEY UPDATE`. |
| **Procedure (2)** | `sp_reserve_cart_with_savepoint(p_cart_id, p_product_id, p_qty, OUT p_reserve_status)` | Executes pessimistic row locking (`SELECT quantity_on_hand FROM inventory ... FOR UPDATE`) with `SAVEPOINT sp_before_reservation`. If stock is deficient, rolls back to the savepoint and returns `INSUFFICIENT_STOCK_ROLLED_BACK`. If sufficient, decrements inventory, adds to cart, and returns `SUCCESS_RESERVED`. |
| **Event (1)** | `evt_cleanup_abandoned_carts` | Scheduled MySQL background job running `EVERY 12 HOUR` that updates `ACTIVE` carts untouched for more than 7 days (`updated_at < NOW() - INTERVAL 7 DAY`) to `ABANDONED`. |

---

## 2. API Endpoints (Member 4)

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/cart` | Yes (Customer) | Retrieves active cart with items from `v_cart_details` and subtotal from `fn_get_cart_subtotal`. |
| `POST` | `/api/cart/items` | Yes (Customer) | Adds an item to the cart using stored procedure `sp_add_to_cart`. |
| `POST` | `/api/cart/add` | Yes (Customer) | Dual-compatible add endpoint for Member 1 & Member 4 callers with legacy field mappings. |
| `POST` | `/api/cart/reserve` | Yes (Customer) | Concurrency stock reservation executing `sp_reserve_cart_with_savepoint` with pessimistic row locking. |
| `PUT` | `/api/cart/items/{id}` | Yes (Customer) | Updates cart item quantity (enforced by trigger `trg_validate_cart_qty`). |
| `DELETE` | `/api/cart/items/{id}` | Yes (Customer) | Removes a specific line item from the cart. |
| `DELETE` | `/api/cart/clear` | Yes (Customer) | Empties all items from the active cart. |
| `POST` | `/api/cart/checkout` | Yes (Customer) | Completes and closes the active cart (`COMPLETED`). |
| `POST` | `/api/cart/cleanup-abandoned` | Yes / Staff | Executes the automated event cleanup routine on demand for testing. |

---

## 3. Automated Test Execution Summary

The Member 4 backend suite was thoroughly verified using Maven:

```bash
cd backend
.\mvnw.cmd test -Dtest=CartEngineIntegrationTest
```

- **Tests Run:** 8
- **Failures:** 0
- **Errors:** 0
- **Skipped:** 0
- **Status:** **PASS (BUILD SUCCESS)**
- **Cumulative Test Suite Across Members 1, 2, 3, and 4:** **42/42 PASSED (100%)**

| Test Case | Method | Scope / Assertions | Result |
| :--- | :--- | :--- | :--- |
| **TC-M4-01** | `testViewCartDetails_LineTotalCalculation` | Verifies `v_cart_details` line total calculation for both KG (Strawberries) and EACH (Milk). | **PASS** |
| **TC-M4-02** | `testCartSubtotalFunction` | Validates `fn_get_cart_subtotal(cart_id)` against the sum of line totals. | **PASS** |
| **TC-M4-03** | `testTriggerValidateCartQty_RejectZeroOrNegative` | Asserts trigger `trg_validate_cart_qty` throws SQLSTATE 45000 when quantity is `<= 0`. | **PASS** |
| **TC-M4-04** | `testStoredProcedureAddToCart_UpsertBehavior` | Confirms `sp_add_to_cart` correctly creates and updates line quantities on subsequent calls. | **PASS** |
| **TC-M4-05** | `testStoredProcedureReserveCart_Success` | Tests `sp_reserve_cart_with_savepoint` under sufficient inventory, verifying `SUCCESS_RESERVED`. | **PASS** |
| **TC-M4-06** | `testStoredProcedureReserveCart_RollbackOnInsufficientStock` | Tests `sp_reserve_cart_with_savepoint` when stock is deficient, asserting savepoint rollback and `INSUFFICIENT_STOCK_ROLLED_BACK`. | **PASS** |
| **TC-M4-07** | `testUpdateAndRemoveCartItem` | Tests RESTful item quantity updates and removals. | **PASS** |
| **TC-M4-08** | `testCleanupAbandonedCarts` | Confirms the logic of `evt_cleanup_abandoned_carts` marks untouched carts as `ABANDONED`. | **PASS** |

---

## 4. Frontend User Experience & ADBMS Sandbox

The frontend provides an interactive slide-over drawer:
1. **Live Line Items:** Fetches `v_cart_details` displaying product name, unit badge (`KG` / `EACH`), unit price, quantity increment/decrement controls, and calculated line totals.
2. **Dynamic Subtotal:** Automatically calculates the live subtotal via `fn_get_cart_subtotal`.
3. **Checkout & Clear:** Single-click order placement and cart clearing.
4. **ADBMS Engine Sandbox:** A built-in testing section allowing users and evaluators to interactively:
   - Test `sp_reserve_cart_with_savepoint` live with row locking and savepoint rollbacks.
   - Observe trigger `trg_validate_cart_qty` enforcement.
   - Simulate `evt_cleanup_abandoned_carts` on demand.

---

## 5. Verification Checklist

- [x] Database view `v_cart_details` created and functional.
- [x] Database function `fn_get_cart_subtotal` created and functional.
- [x] Database trigger `trg_validate_cart_qty` created and functional.
- [x] Database procedure `sp_add_to_cart` created and functional.
- [x] Database procedure `sp_reserve_cart_with_savepoint` created and functional.
- [x] Database event `evt_cleanup_abandoned_carts` created and functional.
- [x] Full layered backend (`CustomerCartController`, `CartService`, `CartDao`, `CartDaoImpl`, DTOs) implemented.
- [x] 8 automated integration tests written and passed (100% BUILD SUCCESS).
- [x] All 42 tests across Members 1, 2, 3, and 4 pass without any regression.
- [x] Frontend `CartDrawer` component created, styled, and integrated.
- [x] Production bundle builds cleanly (`npm run build`).
