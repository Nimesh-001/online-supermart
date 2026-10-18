# SuperMart Online — Member 2: Feature Documentation

## Product Catalog, Category Management, Brands & Produce Weight Pricing Engine

- **Project:** SuperMart Online
- **Member:** Member 2
- **Features Implemented:**
  1. Active Product Catalog with Dual Selling Units (`KG` vs `EACH`)
  2. Category & Brand Hierarchies with Active Product Counts
  3. Dynamic Produce 100g Price Breakdown via Database View `v_active_product_catalog`
  4. Interactive Weight Price Calculator via Stored Function `fn_calc_price_100g`
  5. Promotional Discount Rules & Timed Offers Engine (`product_offers`)
  6. Operational Manager Price Updates with Pessimistic Row Lock (`sp_update_product_price`) and Negative Price Prevention Trigger (`trg_prevent_negative_price`)
- **Tech Stack:**
  - Frontend: React + Tailwind CSS (Vite)
  - Backend: Java 21 + Spring Boot (JdbcTemplate, Strict Layered Architecture)
  - Database: MySQL 8.0+ (`online_supermarket`)
  - Architecture: `ProductCatalogController` → `ProductCatalogService` → `ProductDao` → `JdbcTemplate` → `MySQL`

---

## 1. Database Artifacts Implemented & Utilized

Member 2 contributes **6 dedicated database artifacts** across the database schema:

| Artifact Type | Name | Purpose |
| :--- | :--- | :--- |
| **Tables (4)** | `categories`, `brands`, `products`, `product_offers` | Stores hierarchical departments, brand registries, dual-unit items, and timed discounts. |
| **View (1)** | `v_active_product_catalog` | Projects active products with a calculated `price_per_100g` column for weight produce (`KG`). |
| **Function (1)** | `fn_calc_price_100g(p_product_id, p_grams)` | Calculates exact mathematically rounded price for weight portions ($(\text{grams} / 1000) \times \text{price}$). |
| **Trigger (1)** | `trg_prevent_negative_price` | `BEFORE UPDATE` trigger on `products` throwing `SIGNAL SQLSTATE '45000'` if prices $\le 0$. |
| **Procedures (2)**| `sp_update_product_price`, `sp_fetch_product_for_pricing_lock` | Row-locked price adjustments and shared read locks (`FOR SHARE`) for concurrency. |
| **Event (1)** | `evt_disable_expired_offers` | Hourly background job deactivating offers where `ends_at <= NOW()`. |

---

## 2. API Endpoints (Member 2)

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/products` | No (Public) | Fetches active catalog with category filtering, search, and 100g produce rates. |
| `GET` | `/api/products/{id}` | No (Public) | Fetches single product details with offer discounts and stock status. |
| `GET` | `/api/categories` | No (Public) | Fetches all active categories with dynamic active product counts. |
| `GET` | `/api/brands` | No (Public) | Fetches active brands with product counts. |
| `POST` | `/api/products/calculate-price` | No (Public) | Calls MySQL stored function `fn_calc_price_100g` for weight portions. |
| `PUT` | `/api/products/{id}/price` | Operational Manager / Admin | Updates product price via stored procedure `sp_update_product_price`. |

---

## 3. Automated Test Execution Summary

The Member 2 backend suite was executed using Maven:

```bash
cd backend
.\mvnw.cmd test -Dtest=ProductCatalogIntegrationTest
```

- **Tests Run:** 8
- **Failures:** 0
- **Errors:** 0
- **Skipped:** 0
- **Status:** **PASS (BUILD SUCCESS)**

| Test Case | Method | Scope / Assertions | Result |
| :--- | :--- | :--- | :--- |
| **TC-M2-01** | `testGetActiveProductCatalog` | Queries `v_active_product_catalog`, verifies dual pricing (`pricePer100g` on KG items, `pricePerItem` on EACH items). | **PASS** |
| **TC-M2-02** | `testFilterCatalogByCategory` | Tests category filtering (e.g. `Fresh Fruits`), ensures all returned items match. | **PASS** |
| **TC-M2-03** | `testSearchCatalogByKeyword` | Searches by keyword (`Broccoli`), verifies matching product and unit. | **PASS** |
| **TC-M2-04** | `testGetCategories` | Retrieves all 6 categories with active product counts. | **PASS** |
| **TC-M2-05** | `testGetBrands` | Retrieves registered brands. | **PASS** |
| **TC-M2-06** | `testCalculateGramPriceForKgProduct` | Calls `POST /api/products/calculate-price` for 250g strawberries, verifies stored function calculation. | **PASS** |
| **TC-M2-07** | `testCalculateGramPriceRejectedForEachProduct` | Verifies gram calculations are rejected for packaged unit items (returns 400). | **PASS** |
| **TC-M2-08** | `testUpdateProductPrice` | Verifies `sp_update_product_price` updates price and recalculates `price_per_100g`. | **PASS** |

---

## 4. Frontend Integration & Features

1. **Live Catalog from MySQL:** The home page (`/`) dynamically loads products from `v_active_product_catalog`.
2. **Category Filter Pills:** Customers can filter by "All", "Fresh Fruits", "Crisp Vegetables", "Dairy & Farm Eggs", "Bakery & Pastries", etc., with live count tags.
3. **Produce 100g Price Comparison:** Fresh fruits and vegetables prominently display their rate per 100g to help shoppers make value comparisons.
4. **Interactive Weight Calculator Widget:** Clicking **"Calculate Weight"** opens a modal where customers choose 100g, 250g, 500g, 750g, 1kg, or custom grams, dynamically computing the exact price via `fn_calc_price_100g` and adding the portion to the cart.
5. **Promotional Offers Display:** Active discounts (e.g., 20% OFF Highland Berry Fest) are rendered automatically with strike-through base pricing and discount tags.
