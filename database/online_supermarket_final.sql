-- =============================================================================
-- SUPERMART ONLINE — COMPLETE MASTER DATABASE SCRIPT
-- MySQL 8.0+ | Engine: InnoDB | File Format: DYNAMIC
-- Covers all 36 artifacts across 6 Members:
-- Tables, Constraints, Views, Functions, Triggers, Procedures, Events & Indexing
-- =============================================================================

CREATE DATABASE IF NOT EXISTS online_supermarket;
USE online_supermarket;

-- Enable the native MySQL Event Scheduler
SET GLOBAL event_scheduler = ON;

-- =============================================================================
-- SECTION 1: CORE TABLES (21 TABLES)
-- =============================================================================

-- 1. Roles
CREATE TABLE IF NOT EXISTS roles (
    role_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(40) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB ROW_FORMAT = DYNAMIC;

-- 2. Users
CREATE TABLE IF NOT EXISTS users (
    user_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NULL UNIQUE,
    mobile VARCHAR(20) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nic VARCHAR(20) NULL UNIQUE,
    gender ENUM('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY') NULL,
    account_status ENUM('ACTIVE', 'INACTIVE', 'LOCKED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CHECK (email IS NULL OR email <> ''),
    CHECK (mobile <> ''),
    INDEX idx_users_name (last_name, first_name),
    INDEX idx_users_status (account_status),
    INDEX idx_users_login_lookup (mobile, email, account_status)
) ENGINE = InnoDB ROW_FORMAT = DYNAMIC;

-- 3. User Roles
CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE RESTRICT
) ENGINE = InnoDB ROW_FORMAT = DYNAMIC;

-- 4. Customer Profiles
CREATE TABLE IF NOT EXISTS customer_profiles (
    customer_profile_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL UNIQUE,
    marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_customer_profiles_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE = InnoDB ROW_FORMAT = DYNAMIC;

-- 5. Customer Addresses
CREATE TABLE IF NOT EXISTS customer_addresses (
    address_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    customer_id BIGINT NOT NULL,
    address_label VARCHAR(50) NOT NULL DEFAULT 'Home',
    address_line VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_addresses_customer FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    INDEX idx_addresses_customer (customer_id, is_default)
) ENGINE = InnoDB ROW_FORMAT = DYNAMIC;

-- 6. Categories
CREATE TABLE IF NOT EXISTS categories (
    category_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB ROW_FORMAT = DYNAMIC;

-- 7. Brands
CREATE TABLE IF NOT EXISTS brands (
    brand_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    brand_name VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB ROW_FORMAT = DYNAMIC;

-- 8. Products
CREATE TABLE IF NOT EXISTS products (
    product_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    category_id BIGINT NOT NULL,
    brand_id BIGINT NULL,
    product_name VARCHAR(180) NOT NULL,
    description TEXT,
    selling_unit ENUM('KG', 'EACH') NOT NULL,
    price_per_kg DECIMAL(12,2) NULL,
    price_per_item DECIMAL(12,2) NULL,
    image_url VARCHAR(500) NULL,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    product_status ENUM('ACTIVE', 'INACTIVE', 'DISCONTINUED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE RESTRICT,
    CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES brands(brand_id) ON DELETE RESTRICT,
    CONSTRAINT chk_product_price_type CHECK (
        (selling_unit = 'KG' AND price_per_kg IS NOT NULL AND price_per_kg > 0 AND price_per_item IS NULL) OR
        (selling_unit = 'EACH' AND price_per_item IS NOT NULL AND price_per_item > 0 AND price_per_kg IS NULL)
    ),
    INDEX idx_products_category_status (category_id, product_status),
    INDEX idx_products_brand (brand_id),
    INDEX idx_products_featured_status (is_featured, product_status)
) ENGINE = InnoDB ROW_FORMAT = DYNAMIC;

-- 9. Product Offers
CREATE TABLE IF NOT EXISTS product_offers (
    offer_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    product_id BIGINT NOT NULL,
    offer_name VARCHAR(120) NOT NULL,
    discount_percent DECIMAL(5,2) NOT NULL,
    starts_at DATETIME NOT NULL,
    ends_at DATETIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_offers_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT,
    CONSTRAINT chk_offer_discount CHECK (discount_percent > 0 AND discount_percent <= 100),
    CONSTRAINT chk_offer_dates CHECK (ends_at > starts_at),
    INDEX idx_offers_product_dates (product_id, starts_at, ends_at)
) ENGINE = InnoDB ROW_FORMAT = DYNAMIC;

-- 10. Inventory
CREATE TABLE IF NOT EXISTS inventory (
    product_id BIGINT PRIMARY KEY,
    stock_quantity DECIMAL(12,3) NOT NULL DEFAULT 0,
    low_stock_threshold DECIMAL(12,3) NOT NULL DEFAULT 5,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_inventory_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT,
    CONSTRAINT chk_inventory_quantity CHECK (stock_quantity >= 0),
    CONSTRAINT chk_inventory_threshold CHECK (low_stock_threshold >= 0),
    INDEX idx_inventory_threshold_seek (stock_quantity, low_stock_threshold)
) ENGINE = InnoDB ROW_FORMAT = DYNAMIC;

-- 11. Stock Movements
CREATE TABLE IF NOT EXISTS stock_movements (
    movement_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    product_id BIGINT NOT NULL,
    actor_user_id BIGINT NULL,
    movement_type ENUM('STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'SALE', 'RETURN') NOT NULL,
    quantity_change DECIMAL(12,3) NOT NULL,
    reference_type VARCHAR(40),
    reference_id BIGINT NULL,
    notes VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_stock_movements_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT,
    CONSTRAINT fk_stock_movements_actor FOREIGN KEY (actor_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_stock_movements_product_date (product_id, created_at)
) ENGINE = InnoDB ROW_FORMAT = DYNAMIC;

-- 12. Low Stock Alerts
CREATE TABLE IF NOT EXISTS low_stock_alerts (
    alert_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    product_id BIGINT NOT NULL,
    stock_quantity DECIMAL(12,3) NOT NULL,
    threshold_quantity DECIMAL(12,3) NOT NULL,
    alert_status ENUM('OPEN', 'RESOLVED') NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME NULL,
    CONSTRAINT fk_low_stock_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT,
    INDEX idx_low_stock_status_date (alert_status, created_at)
) ENGINE = InnoDB ROW_FORMAT = DYNAMIC;

-- 13. Carts
CREATE TABLE IF NOT EXISTS carts (
    cart_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    customer_id BIGINT NOT NULL,
    cart_status ENUM('ACTIVE', 'CONVERTED', 'ABANDONED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_carts_customer FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    INDEX idx_carts_customer_status (customer_id, cart_status)
) ENGINE = InnoDB ROW_FORMAT = DYNAMIC;

-- 14. Cart Items
CREATE TABLE IF NOT EXISTS cart_items (
    cart_item_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(cart_id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT,
    CONSTRAINT chk_cart_quantity CHECK (quantity > 0),
    UNIQUE KEY uq_cart_product (cart_id, product_id)
) ENGINE = InnoDB ROW_FORMAT = DYNAMIC;

-- 15. Coupons
CREATE TABLE IF NOT EXISTS coupons (
    coupon_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    coupon_code VARCHAR(40) NOT NULL UNIQUE,
    description VARCHAR(255),
    coupon_type ENUM('PERCENT', 'FIXED') NOT NULL,
    discount_value DECIMAL(12,2) NOT NULL DEFAULT 0,
    minimum_subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    free_shipping BOOLEAN NOT NULL DEFAULT FALSE,
    starts_at DATETIME NOT NULL,
    expires_at DATETIME NOT NULL,
    usage_limit INT NULL,
    per_customer_limit INT NOT NULL DEFAULT 1,
    times_redeemed INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_coupon_value CHECK (discount_value >= 0),
    CONSTRAINT chk_coupon_minimum CHECK (minimum_subtotal >= 0),
    CONSTRAINT chk_coupon_dates CHECK (expires_at > starts_at),
    INDEX idx_coupons_active_dates (is_active, starts_at, expires_at)
) ENGINE = InnoDB ROW_FORMAT = DYNAMIC;

-- 16. Orders
CREATE TABLE IF NOT EXISTS orders (
    order_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(40) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL,
    address_id BIGINT NULL,
    coupon_id BIGINT NULL,
    delivery_name VARCHAR(200) NOT NULL,
    delivery_mobile VARCHAR(20) NOT NULL,
    delivery_address VARCHAR(255) NOT NULL,
    delivery_city VARCHAR(100) NOT NULL,
    delivery_postal_code VARCHAR(20) NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    delivery_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    order_status ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    payment_status ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    payment_method ENUM('COD', 'CARD_TEST') NOT NULL,
    notes VARCHAR(500),
    placed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_orders_address FOREIGN KEY (address_id) REFERENCES customer_addresses(address_id) ON DELETE SET NULL,
    CONSTRAINT fk_orders_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(coupon_id) ON DELETE SET NULL,
    INDEX idx_orders_customer_date (customer_id, placed_at),
    INDEX idx_orders_status_date (order_status, placed_at)
) ENGINE = InnoDB ROW_FORMAT = DYNAMIC;

-- 17. Order Items
CREATE TABLE IF NOT EXISTS order_items (
    order_item_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    product_name_snapshot VARCHAR(180) NOT NULL,
    selling_unit_snapshot ENUM('KG', 'EACH') NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit_price_snapshot DECIMAL(12,2) NOT NULL,
    line_total DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE RESTRICT,
    CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT,
    INDEX idx_order_items_order (order_id)
) ENGINE = InnoDB ROW_FORMAT = DYNAMIC;

-- 18. Payments
CREATE TABLE IF NOT EXISTS payments (
    payment_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    payment_method ENUM('COD', 'CARD_TEST') NOT NULL,
    payment_status ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    amount DECIMAL(12,2) NOT NULL,
    transaction_reference VARCHAR(150) NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE RESTRICT,
    INDEX idx_payments_order (order_id)
) ENGINE = InnoDB ROW_FORMAT = DYNAMIC;

-- 19. Coupon Redemptions
CREATE TABLE IF NOT EXISTS coupon_redemptions (
    redemption_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    coupon_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    order_id BIGINT NOT NULL UNIQUE,
    discount_amount DECIMAL(12,2) NOT NULL,
    redeemed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_redemptions_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(coupon_id) ON DELETE RESTRICT,
    CONSTRAINT fk_redemptions_customer FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_redemptions_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE RESTRICT
) ENGINE = InnoDB ROW_FORMAT = DYNAMIC;

-- 20. Audit Logs (Includes Novel Virtual Generated Column)
CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    actor_user_id BIGINT NULL,
    action_type VARCHAR(80) NOT NULL,
    entity_name VARCHAR(80) NOT NULL,
    entity_id VARCHAR(100) NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    -- Novel Concept: Virtual Generated Column extracting JSON key for fast indexing
    logged_status VARCHAR(50) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(new_values, '$.status'))) VIRTUAL,
    description VARCHAR(500),
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_actor FOREIGN KEY (actor_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_audit_action_date (action_type, created_at),
    INDEX idx_audit_virtual_status (logged_status)
) ENGINE = InnoDB ROW_FORMAT = DYNAMIC;

-- 21. Login Attempts
CREATE TABLE IF NOT EXISTS login_attempts (
    login_attempt_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NULL,
    attempted_identifier VARCHAR(150) NOT NULL,
    was_successful BOOLEAN NOT NULL,
    failure_reason VARCHAR(100) NULL,
    ip_address VARCHAR(45) NULL,
    attempted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_login_attempt_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_login_recent (user_id, was_successful, attempted_at)
) ENGINE = InnoDB ROW_FORMAT = DYNAMIC;

-- 22. Daily Sales Summaries
CREATE TABLE IF NOT EXISTS daily_sales_summaries (
    summary_date DATE PRIMARY KEY,
    completed_order_count INT NOT NULL DEFAULT 0,
    gross_sales DECIMAL(14,2) NOT NULL DEFAULT 0,
    discounts_total DECIMAL(14,2) NOT NULL DEFAULT 0,
    delivery_fees_total DECIMAL(14,2) NOT NULL DEFAULT 0,
    net_sales DECIMAL(14,2) NOT NULL DEFAULT 0,
    last_refreshed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB ROW_FORMAT = DYNAMIC;

-- 23. System Settings
CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value VARCHAR(500) NOT NULL,
    description VARCHAR(255),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB ROW_FORMAT = DYNAMIC;

-- =============================================================================
-- SECTION 2: BASE SEED DATA
-- =============================================================================

INSERT IGNORE INTO roles (role_id, role_name, description) VALUES
(1, 'SUPER_ADMIN', 'System Administrator with full access'),
(2, 'OPERATIONAL_MANAGER', 'Store Inventory and Catalog Manager'),
(3, 'CUSTOMER', 'Public Online Shopper');

INSERT IGNORE INTO coupons (coupon_id, coupon_code, description, coupon_type, discount_value, minimum_subtotal, free_shipping, starts_at, expires_at) VALUES
(1, 'FREEDEL3000', 'Buy above Rs. 3,000 and get Free Delivery', 'FIXED', 0.00, 3000.00, TRUE, '2026-01-01 00:00:00', '2027-01-01 00:00:00'),
(2, 'SAVE10PLUS', 'Buy above Rs. 5,000 and get 10% OFF + Free Delivery', 'PERCENT', 10.00, 5000.00, TRUE, '2026-01-01 00:00:00', '2027-01-01 00:00:00');

-- =============================================================================
-- SECTION 3: DATABASE VIEWS (6 VIEWS)
-- =============================================================================

-- Member 1 View: Customer Profile
CREATE OR REPLACE VIEW v_customer_profiles AS
SELECT 
    u.user_id, 
    u.first_name, 
    u.last_name, 
    u.email, 
    u.mobile, 
    u.account_status, 
    cp.marketing_opt_in, 
    u.created_at
FROM users u
JOIN customer_profiles cp ON u.user_id = cp.user_id;

-- Member 2 View: Active Product Catalog with 100g Price
CREATE OR REPLACE VIEW v_active_product_catalog AS
SELECT 
    p.product_id, 
    p.product_name, 
    c.category_name, 
    b.brand_name, 
    p.selling_unit,
    p.price_per_kg,
    CASE 
        WHEN p.selling_unit = 'KG' THEN ROUND(p.price_per_kg / 10.0, 2) 
        ELSE NULL 
    END AS price_per_100g,
    p.price_per_item, 
    p.image_url, 
    p.is_featured
FROM products p
JOIN categories c ON p.category_id = c.category_id
LEFT JOIN brands b ON p.brand_id = b.brand_id
WHERE p.product_status = 'ACTIVE' AND c.is_active = TRUE;

-- Member 3 View: Low Stock Report
CREATE OR REPLACE VIEW v_low_stock_report AS
SELECT 
    p.product_id, 
    p.product_name, 
    c.category_name, 
    inv.stock_quantity, 
    inv.low_stock_threshold
FROM inventory inv
JOIN products p ON inv.product_id = p.product_id
JOIN categories c ON p.category_id = c.category_id
WHERE inv.stock_quantity <= inv.low_stock_threshold;

-- Member 4 View: Cart Details with Computed Line Totals
CREATE OR REPLACE VIEW v_cart_details AS
SELECT 
    c.cart_id, 
    c.customer_id, 
    ci.cart_item_id, 
    p.product_name, 
    p.selling_unit, 
    ci.quantity,
    CASE WHEN p.selling_unit = 'KG' THEN p.price_per_kg ELSE p.price_per_item END AS unit_price,
    CASE WHEN p.selling_unit = 'KG' THEN ROUND(ci.quantity * p.price_per_kg, 2) 
         ELSE ROUND(ci.quantity * p.price_per_item, 2) END AS line_total
FROM carts c
JOIN cart_items ci ON c.cart_id = ci.cart_id
JOIN products p ON ci.product_id = p.product_id
WHERE c.cart_status = 'ACTIVE';

-- Member 5 View: Order Invoices
CREATE OR REPLACE VIEW v_order_invoices AS
SELECT 
    o.order_id, 
    o.order_number, 
    o.delivery_name, 
    o.delivery_city, 
    o.subtotal,
    o.discount_amount, 
    o.delivery_fee, 
    o.total_amount, 
    o.order_status, 
    o.payment_method, 
    o.placed_at
FROM orders o;

-- Member 6 View: Admin Sales Overview
CREATE OR REPLACE VIEW v_admin_sales_overview AS
SELECT 
    summary_date, 
    completed_order_count, 
    gross_sales, 
    discounts_total, 
    net_sales
FROM daily_sales_summaries;

-- =============================================================================
-- SECTION 4: STORED FUNCTIONS (6 FUNCTIONS)
-- =============================================================================

SET GLOBAL log_bin_trust_function_creators = 1;

-- Member 1 Function: Account Active Check
DROP FUNCTION IF EXISTS fn_is_account_active;
DELIMITER $$
CREATE FUNCTION fn_is_account_active(p_user_id BIGINT)
RETURNS BOOLEAN
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_status VARCHAR(20);
    SELECT account_status INTO v_status FROM users WHERE user_id = p_user_id;
    RETURN (v_status = 'ACTIVE');
END$$
DELIMITER ;

-- Member 2 Function: Dynamic Gram Price Calculator (100g base)
DROP FUNCTION IF EXISTS fn_calc_price_100g;
DELIMITER $$
CREATE FUNCTION fn_calc_price_100g(p_product_id BIGINT, p_grams DECIMAL(10,3))
RETURNS DECIMAL(12,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_price_kg DECIMAL(12,2);
    SELECT price_per_kg INTO v_price_kg FROM products WHERE product_id = p_product_id;
    IF v_price_kg IS NULL THEN RETURN 0.00; END IF;
    RETURN ROUND((p_grams / 1000.0) * v_price_kg, 2);
END$$
DELIMITER ;

-- Member 3 Function: Stock Status Classifier
DROP FUNCTION IF EXISTS fn_get_stock_status;
DELIMITER $$
CREATE FUNCTION fn_get_stock_status(p_product_id BIGINT)
RETURNS VARCHAR(20)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_stock DECIMAL(12,3);
    DECLARE v_thresh DECIMAL(12,3);
    SELECT stock_quantity, low_stock_threshold INTO v_stock, v_thresh FROM inventory WHERE product_id = p_product_id;

    IF v_stock IS NULL OR v_stock <= 0 THEN RETURN 'OUT_OF_STOCK';
    ELSEIF v_stock <= v_thresh THEN RETURN 'LOW_STOCK';
    ELSE RETURN 'IN_STOCK';
    END IF;
END$$
DELIMITER ;

-- Member 4 Function: Cart Subtotal Aggregator
DROP FUNCTION IF EXISTS fn_get_cart_subtotal;
DELIMITER $$
CREATE FUNCTION fn_get_cart_subtotal(p_cart_id BIGINT)
RETURNS DECIMAL(12,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_subtotal DECIMAL(12,2);

    SELECT SUM(
        CASE 
            WHEN p.selling_unit = 'KG' THEN (ci.quantity * p.price_per_kg)
            ELSE (ci.quantity * p.price_per_item)
        END
    ) INTO v_subtotal
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.product_id
    WHERE ci.cart_id = p_cart_id;

    RETURN IFNULL(ROUND(v_subtotal, 2), 0.00);
END$$
DELIMITER ;

-- Member 5 Function: Coupon Discount Rule Evaluator
DROP FUNCTION IF EXISTS fn_calculate_coupon_discount;
DELIMITER $$
CREATE FUNCTION fn_calculate_coupon_discount(p_coupon_code VARCHAR(40), p_subtotal DECIMAL(12,2))
RETURNS DECIMAL(12,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    IF p_coupon_code IS NOT NULL AND UPPER(p_coupon_code) = 'SAVE10PLUS' AND p_subtotal >= 5000.00 THEN
        RETURN ROUND(p_subtotal * 0.10, 2);
    END IF;
    RETURN 0.00;
END$$
DELIMITER ;

-- Member 6 Function: Daily Net Revenue Fetcher
DROP FUNCTION IF EXISTS fn_get_daily_revenue;
DELIMITER $$
CREATE FUNCTION fn_get_daily_revenue(p_date DATE)
RETURNS DECIMAL(14,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_rev DECIMAL(14,2);
    SELECT net_sales INTO v_rev FROM daily_sales_summaries WHERE summary_date = p_date;
    RETURN IFNULL(v_rev, 0.00);
END$$
DELIMITER ;

-- =============================================================================
-- SECTION 5: DATABASE TRIGGERS (6 TRIGGERS)
-- =============================================================================

-- Member 1 Trigger: Sanitize User Input
DROP TRIGGER IF EXISTS trg_users_before_insert;
DELIMITER $$
CREATE TRIGGER trg_users_before_insert
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
    IF NEW.email IS NOT NULL THEN
        SET NEW.email = LOWER(TRIM(NEW.email));
    END IF;
    SET NEW.first_name = TRIM(NEW.first_name);
    SET NEW.last_name = TRIM(NEW.last_name);
END$$
DELIMITER ;

-- Member 2 Trigger: Prevent Negative Pricing
DROP TRIGGER IF EXISTS trg_prevent_negative_price;
DELIMITER $$
CREATE TRIGGER trg_prevent_negative_price
BEFORE UPDATE ON products
FOR EACH ROW
BEGIN
    IF (NEW.price_per_kg IS NOT NULL AND NEW.price_per_kg <= 0) OR
       (NEW.price_per_item IS NOT NULL AND NEW.price_per_item <= 0) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Product price must be strictly positive.';
    END IF;
END$$
DELIMITER ;

-- Member 3 Trigger: Autonomous Low Stock Alerting
DROP TRIGGER IF EXISTS trg_check_low_stock;
DELIMITER $$
CREATE TRIGGER trg_check_low_stock
AFTER UPDATE ON inventory
FOR EACH ROW
BEGIN
    IF NEW.stock_quantity <= NEW.low_stock_threshold THEN
        IF NOT EXISTS (SELECT 1 FROM low_stock_alerts WHERE product_id = NEW.product_id AND alert_status = 'OPEN') THEN
            INSERT INTO low_stock_alerts (product_id, stock_quantity, threshold_quantity, alert_status)
            VALUES (NEW.product_id, NEW.stock_quantity, NEW.low_stock_threshold, 'OPEN');
        END IF;
    END IF;
END$$
DELIMITER ;

-- Member 4 Trigger: Validate Positive Cart Quantity
DROP TRIGGER IF EXISTS trg_validate_cart_qty;
DELIMITER $$
CREATE TRIGGER trg_validate_cart_qty
BEFORE INSERT ON cart_items
FOR EACH ROW
BEGIN
    IF NEW.quantity <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cart item quantity must be greater than zero.';
    END IF;
END$$
DELIMITER ;

-- Member 5 Trigger: Record Stock Movement on Order Item Sale
DROP TRIGGER IF EXISTS trg_after_order_item_sale;
DELIMITER $$
CREATE TRIGGER trg_after_order_item_sale
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    INSERT INTO stock_movements (product_id, movement_type, quantity_change, reference_type, reference_id, notes)
    VALUES (NEW.product_id, 'SALE', -NEW.quantity, 'ORDER', NEW.order_id, 'Customer Checkout Sale');
END$$
DELIMITER ;

-- Member 6 Trigger: Audit User Status Changes to JSON
DROP TRIGGER IF EXISTS trg_audit_user_update;
DELIMITER $$
CREATE TRIGGER trg_audit_user_update
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    IF OLD.account_status <> NEW.account_status THEN
        INSERT INTO audit_logs (actor_user_id, action_type, entity_name, entity_id, old_values, new_values, description)
        VALUES (
            NEW.user_id, 'STATUS_CHANGE', 'users', CAST(NEW.user_id AS CHAR),
            JSON_OBJECT('status', OLD.account_status),
            JSON_OBJECT('status', NEW.account_status),
            'User status modified'
        );
    END IF;
END$$
DELIMITER ;

-- =============================================================================
-- SECTION 6: STORED PROCEDURES & CONCURRENCY CONTROL (11 PROCEDURES)
-- =============================================================================

-- Member 1 Main Procedure: Customer Registration Transaction
DROP PROCEDURE IF EXISTS sp_register_customer;
DELIMITER $$
CREATE PROCEDURE sp_register_customer(
    IN p_first_name VARCHAR(100),
    IN p_last_name VARCHAR(100),
    IN p_email VARCHAR(150),
    IN p_mobile VARCHAR(20),
    IN p_password_hash VARCHAR(255),
    OUT p_user_id BIGINT
)
BEGIN
    DECLARE v_role_id BIGINT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_user_id = NULL;
    END;

    START TRANSACTION;

    SELECT role_id INTO v_role_id FROM roles WHERE role_name = 'CUSTOMER' LIMIT 1;

    INSERT INTO users (first_name, last_name, email, mobile, password_hash, account_status)
    VALUES (p_first_name, p_last_name, p_email, p_mobile, p_password_hash, 'ACTIVE');

    SET p_user_id = LAST_INSERT_ID();

    INSERT INTO user_roles (user_id, role_id) VALUES (p_user_id, v_role_id);
    INSERT INTO customer_profiles (user_id, marketing_opt_in) VALUES (p_user_id, FALSE);

    COMMIT;
END$$
DELIMITER ;

-- Member 1 Concurrency: Exclusive Row Lock on Login
DROP PROCEDURE IF EXISTS sp_secure_login_concurrency_check;
DELIMITER $$
CREATE PROCEDURE sp_secure_login_concurrency_check(
    IN p_identifier VARCHAR(150),
    OUT p_user_id BIGINT,
    OUT p_password_hash VARCHAR(255),
    OUT p_account_status VARCHAR(20)
)
BEGIN
    SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
    START TRANSACTION;

    SELECT user_id, password_hash, account_status
    INTO p_user_id, p_password_hash, p_account_status
    FROM users
    WHERE (LOWER(email) = LOWER(p_identifier) OR mobile = p_identifier)
    LIMIT 1
    FOR UPDATE;

    COMMIT;
END$$
DELIMITER ;

-- Member 2 Main Procedure: Product Price Update
DROP PROCEDURE IF EXISTS sp_update_product_price;
DELIMITER $$
CREATE PROCEDURE sp_update_product_price(
    IN p_product_id BIGINT,
    IN p_new_price DECIMAL(12,2)
)
BEGIN
    DECLARE v_unit VARCHAR(10);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
    END;

    START TRANSACTION;

    SELECT selling_unit INTO v_unit FROM products WHERE product_id = p_product_id FOR UPDATE;

    IF v_unit = 'KG' THEN
        UPDATE products SET price_per_kg = p_new_price, updated_at = NOW() WHERE product_id = p_product_id;
    ELSE
        UPDATE products SET price_per_item = p_new_price, updated_at = NOW() WHERE product_id = p_product_id;
    END IF;

    COMMIT;
END$$
DELIMITER ;

-- Member 2 Concurrency: Shared Read Lock on Catalog
DROP PROCEDURE IF EXISTS sp_fetch_product_for_pricing_lock;
DELIMITER $$
CREATE PROCEDURE sp_fetch_product_for_pricing_lock(
    IN p_product_id BIGINT,
    OUT p_selling_unit VARCHAR(10),
    OUT p_effective_price DECIMAL(12,2)
)
BEGIN
    START TRANSACTION;

    SELECT 
        selling_unit, 
        CASE WHEN selling_unit = 'KG' THEN price_per_kg ELSE price_per_item END
    INTO p_selling_unit, p_effective_price
    FROM products
    WHERE product_id = p_product_id AND product_status = 'ACTIVE'
    FOR SHARE;

    COMMIT;
END$$
DELIMITER ;

-- Member 3 Main Procedure: Stock Replenishment
DROP PROCEDURE IF EXISTS sp_add_stock;
DELIMITER $$
CREATE PROCEDURE sp_add_stock(
    IN p_product_id BIGINT,
    IN p_qty DECIMAL(12,3),
    IN p_actor_id BIGINT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
    END;

    START TRANSACTION;

    SELECT stock_quantity FROM inventory WHERE product_id = p_product_id FOR UPDATE;

    UPDATE inventory SET stock_quantity = stock_quantity + p_qty WHERE product_id = p_product_id;

    INSERT INTO stock_movements (product_id, actor_user_id, movement_type, quantity_change, notes)
    VALUES (p_product_id, p_actor_id, 'STOCK_IN', p_qty, 'Warehouse stock replenishment');

    COMMIT;
END$$
DELIMITER ;

-- Member 3 Concurrency: Atomic Stock Decrement with Row-Level Lock
DROP PROCEDURE IF EXISTS sp_atomic_stock_decrement;
DELIMITER $$
CREATE PROCEDURE sp_atomic_stock_decrement(
    IN p_product_id BIGINT,
    IN p_deduct_qty DECIMAL(12,3),
    OUT p_is_success BOOLEAN
)
BEGIN
    DECLARE v_current_stock DECIMAL(12,3);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_is_success = FALSE;
    END;

    START TRANSACTION;

    SELECT stock_quantity INTO v_current_stock
    FROM inventory
    WHERE product_id = p_product_id
    FOR UPDATE;

    IF v_current_stock >= p_deduct_qty THEN
        UPDATE inventory 
        SET stock_quantity = stock_quantity - p_deduct_qty 
        WHERE product_id = p_product_id;
        
        SET p_is_success = TRUE;
        COMMIT;
    ELSE
        SET p_is_success = FALSE;
        ROLLBACK;
    END IF;
END$$
DELIMITER ;

-- Member 4 Main Procedure: Add or Increment Cart Item
DROP PROCEDURE IF EXISTS sp_add_to_cart;
DELIMITER $$
CREATE PROCEDURE sp_add_to_cart(
    IN p_cart_id BIGINT,
    IN p_product_id BIGINT,
    IN p_quantity DECIMAL(10,3)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
    END;

    START TRANSACTION;

    INSERT INTO cart_items (cart_id, product_id, quantity)
    VALUES (p_cart_id, p_product_id, p_quantity)
    ON DUPLICATE KEY UPDATE 
        quantity = quantity + p_quantity,
        updated_at = NOW();

    UPDATE carts SET updated_at = NOW() WHERE cart_id = p_cart_id;

    COMMIT;
END$$
DELIMITER ;

-- Member 4 Concurrency: Cart Reservation with Transaction Savepoint
DROP PROCEDURE IF EXISTS sp_reserve_cart_with_savepoint;
DELIMITER $$
CREATE PROCEDURE sp_reserve_cart_with_savepoint(
    IN p_cart_id BIGINT,
    IN p_product_id BIGINT,
    IN p_qty DECIMAL(10,3),
    OUT p_reserve_status VARCHAR(50)
)
BEGIN
    DECLARE v_available_stock DECIMAL(12,3);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_reserve_status = 'FAIL_TRANSACTION_ABORTED';
    END;

    START TRANSACTION;

    SAVEPOINT sp_before_reservation;

    SELECT stock_quantity INTO v_available_stock
    FROM inventory
    WHERE product_id = p_product_id
    FOR UPDATE;

    IF v_available_stock < p_qty THEN
        ROLLBACK TO SAVEPOINT sp_before_reservation;
        SET p_reserve_status = 'INSUFFICIENT_STOCK_ROLLED_BACK';
        COMMIT;
    ELSE
        INSERT INTO cart_items (cart_id, product_id, quantity)
        VALUES (p_cart_id, p_product_id, p_qty)
        ON DUPLICATE KEY UPDATE quantity = p_qty;

        SET p_reserve_status = 'SUCCESS_RESERVED';
        COMMIT;
    END IF;
END$$
DELIMITER ;

-- Member 5 Main Procedure: Multi-Step ACID Checkout
DROP PROCEDURE IF EXISTS sp_place_order;
DELIMITER $$
CREATE PROCEDURE sp_place_order(
    IN p_customer_id BIGINT,
    IN p_cart_id BIGINT,
    IN p_address_id BIGINT,
    IN p_coupon_code VARCHAR(40),
    IN p_payment_method VARCHAR(20),
    OUT p_order_id BIGINT,
    OUT p_order_number VARCHAR(40)
)
BEGIN
    DECLARE v_subtotal DECIMAL(12,2);
    DECLARE v_discount DECIMAL(12,2) DEFAULT 0.00;
    DECLARE v_delivery_fee DECIMAL(12,2) DEFAULT 350.00;
    DECLARE v_total DECIMAL(12,2);
    DECLARE v_name VARCHAR(150);
    DECLARE v_mobile VARCHAR(20);
    DECLARE v_line VARCHAR(255);
    DECLARE v_city VARCHAR(100);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_order_id = NULL;
        SET p_order_number = NULL;
    END;

    START TRANSACTION;

    SET v_subtotal = fn_get_cart_subtotal(p_cart_id);
    SET v_discount = fn_calculate_coupon_discount(p_coupon_code, v_subtotal);

    IF v_subtotal >= 3000.00 THEN
        SET v_delivery_fee = 0.00;
    END IF;

    SET v_total = v_subtotal - v_discount + v_delivery_fee;
    SET p_order_number = CONCAT('ORD-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND()*9999), 4, '0'));

    SELECT CONCAT(u.first_name, ' ', u.last_name), u.mobile, ca.address_line, ca.city
    INTO v_name, v_mobile, v_line, v_city
    FROM customer_addresses ca
    JOIN users u ON ca.customer_id = u.user_id
    WHERE ca.address_id = p_address_id;

    INSERT INTO orders (
        order_number, customer_id, address_id, delivery_name, delivery_mobile, 
        delivery_address, delivery_city, subtotal, discount_amount, delivery_fee, total_amount,
        order_status, payment_status, payment_method
    )
    VALUES (
        p_order_number, p_customer_id, p_address_id, v_name, v_mobile,
        v_line, v_city, v_subtotal, v_discount, v_delivery_fee, v_total,
        'CONFIRMED', CASE WHEN p_payment_method = 'CARD_TEST' THEN 'PAID' ELSE 'PENDING' END, p_payment_method
    );

    SET p_order_id = LAST_INSERT_ID();

    INSERT INTO order_items (order_id, product_id, product_name_snapshot, selling_unit_snapshot, quantity, unit_price_snapshot, line_total)
    SELECT p_order_id, ci.product_id, p.product_name, p.selling_unit, ci.quantity,
           CASE WHEN p.selling_unit = 'KG' THEN p.price_per_kg ELSE p.price_per_item END,
           CASE WHEN p.selling_unit = 'KG' THEN (ci.quantity * p.price_per_kg) ELSE (ci.quantity * p.price_per_item) END
    FROM cart_items ci JOIN products p ON ci.product_id = p.product_id WHERE ci.cart_id = p_cart_id;

    UPDATE inventory inv JOIN cart_items ci ON inv.product_id = ci.product_id
    SET inv.stock_quantity = inv.stock_quantity - ci.quantity WHERE ci.cart_id = p_cart_id;

    INSERT INTO payments (order_id, payment_method, payment_status, amount, transaction_reference)
    VALUES (p_order_id, p_payment_method, CASE WHEN p_payment_method = 'CARD_TEST' THEN 'PAID' ELSE 'PENDING' END, v_total, CONCAT('TXN-', UUID_SHORT()));

    UPDATE carts SET cart_status = 'CONVERTED' WHERE cart_id = p_cart_id;
    DELETE FROM cart_items WHERE cart_id = p_cart_id;

    COMMIT;
END$$
DELIMITER ;

-- Member 5 Concurrency: Two-Phase Locking Check
DROP PROCEDURE IF EXISTS sp_test_checkout_concurrency_lock;
DELIMITER $$
CREATE PROCEDURE sp_test_checkout_concurrency_lock(
    IN p_cart_id BIGINT,
    OUT p_can_checkout BOOLEAN
)
BEGIN
    START TRANSACTION;

    IF EXISTS (
        SELECT 1 
        FROM cart_items ci
        JOIN inventory inv ON ci.product_id = inv.product_id
        WHERE ci.cart_id = p_cart_id AND inv.stock_quantity < ci.quantity
        FOR UPDATE
    ) THEN
        SET p_can_checkout = FALSE;
        ROLLBACK;
    ELSE
        SET p_can_checkout = TRUE;
        COMMIT;
    END IF;
END$$
DELIMITER ;

-- Member 6 Main Procedure: Daily Sales Reconciliation Batch
DROP PROCEDURE IF EXISTS sp_daily_sales_summary;
DELIMITER $$
CREATE PROCEDURE sp_daily_sales_summary(IN p_date DATE)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
    END;

    START TRANSACTION;

    INSERT INTO daily_sales_summaries (
        summary_date, completed_order_count, gross_sales, discounts_total, delivery_fees_total, net_sales, last_refreshed_at
    )
    SELECT 
        p_date,
        COUNT(order_id),
        IFNULL(SUM(subtotal), 0),
        IFNULL(SUM(discount_amount), 0),
        IFNULL(SUM(delivery_fee), 0),
        IFNULL(SUM(total_amount), 0),
        NOW()
    FROM orders
    WHERE DATE(placed_at) = p_date AND order_status IN ('CONFIRMED', 'PROCESSING', 'COMPLETED')
    ON DUPLICATE KEY UPDATE
        completed_order_count = VALUES(completed_order_count),
        gross_sales = VALUES(gross_sales),
        discounts_total = VALUES(discounts_total),
        delivery_fees_total = VALUES(delivery_fees_total),
        net_sales = VALUES(net_sales),
        last_refreshed_at = NOW();

    COMMIT;
END$$
DELIMITER ;

-- =============================================================================
-- SECTION 7: SCHEDULED EVENTS (6 EVENTS)
-- =============================================================================

-- Member 1 Event: Purge Old Login Attempts Daily
DROP EVENT IF EXISTS evt_purge_old_login_attempts;
CREATE EVENT evt_purge_old_login_attempts
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
    DELETE FROM login_attempts WHERE attempted_at < NOW() - INTERVAL 30 DAY;

-- Member 2 Event: Disable Expired Product Offers Hourly
DROP EVENT IF EXISTS evt_disable_expired_offers;
CREATE EVENT evt_disable_expired_offers
ON SCHEDULE EVERY 1 HOUR
DO
    UPDATE product_offers SET is_active = FALSE WHERE ends_at <= NOW() AND is_active = TRUE;

-- Member 3 Event: Daily Inventory Health Verification
DROP EVENT IF EXISTS evt_daily_stock_check;
CREATE EVENT evt_daily_stock_check
ON SCHEDULE EVERY 1 DAY
DO
    INSERT INTO audit_logs (action_type, entity_name, description)
    VALUES ('STOCK_HEALTH_CHECK', 'inventory', 'Daily automated stock verification completed');

-- Member 4 Event: Cleanup Abandoned Carts Every 12 Hours
DROP EVENT IF EXISTS evt_cleanup_abandoned_carts;
CREATE EVENT evt_cleanup_abandoned_carts
ON SCHEDULE EVERY 12 HOUR
DO
    UPDATE carts SET cart_status = 'ABANDONED'
    WHERE cart_status = 'ACTIVE' AND updated_at < NOW() - INTERVAL 7 DAY;

-- Member 5 Event: Cancel Expired Pending Orders Hourly
DROP EVENT IF EXISTS evt_cancel_expired_orders;
CREATE EVENT evt_cancel_expired_orders
ON SCHEDULE EVERY 1 HOUR
DO
    UPDATE orders SET order_status = 'CANCELLED' 
    WHERE order_status = 'PENDING' AND placed_at < NOW() - INTERVAL 24 HOUR;

-- Member 6 Event: Midnight Automated Daily Sales Aggregator
DROP EVENT IF EXISTS evt_midnight_sales_summary;
CREATE EVENT evt_midnight_sales_summary
ON SCHEDULE EVERY 1 DAY
STARTS (CURRENT_DATE + INTERVAL 23 HOUR + INTERVAL 59 MINUTE)
DO
    CALL sp_daily_sales_summary(CURRENT_DATE());

