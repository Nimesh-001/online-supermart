-- =================================================================
-- SuperMart Online: Seed Roles
-- Script: documentation/seed_roles.sql
-- Description: Ensures the three core system roles exist in roles table.
-- =================================================================

INSERT INTO roles (role_name, description)
SELECT 'SUPER_ADMIN', 'Manages operational manager accounts, users, system settings, audit logs and administration'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE role_name = 'SUPER_ADMIN');

INSERT INTO roles (role_name, description)
SELECT 'OPERATIONAL_MANAGER', 'Manages products, inventory, orders, coupons and reports'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE role_name = 'OPERATIONAL_MANAGER');

INSERT INTO roles (role_name, description)
SELECT 'CUSTOMER', 'Browses products, maintains a profile, manages a cart and places orders'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE role_name = 'CUSTOMER');
