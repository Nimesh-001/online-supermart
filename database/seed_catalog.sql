-- =============================================================================
-- SuperMart Online — Catalog Seed Data (Categories, Brands, Products, Offers, Inventory)
-- =============================================================================

USE online_supermarket;

-- 1. Categories
INSERT INTO categories (category_id, category_name, description, is_active) VALUES
(1, 'Fresh Fruits', 'Handpicked orchard fruits, berries, and tropical selections', TRUE),
(2, 'Crisp Vegetables', 'Farm-fresh organic greens, root vegetables, and herbs', TRUE),
(3, 'Dairy & Farm Eggs', 'Fresh pasteurized milk, cheeses, butter, and pasture eggs', TRUE),
(4, 'Bakery & Pastries', 'Artisan breads, morning pastries, and rolls baked fresh daily', TRUE),
(5, 'Pantry Staples', 'Premium grains, aromatic rice, oils, spices, and baking essentials', TRUE),
(6, 'Chilled Beverages', 'Cold-pressed juices, pure coconut water, and iced teas', TRUE)
ON DUPLICATE KEY UPDATE 
    category_name = VALUES(category_name),
    description = VALUES(description),
    is_active = VALUES(is_active);

-- 2. Brands
INSERT INTO brands (brand_id, brand_name, is_active) VALUES
(1, 'SuperMart Organic', TRUE),
(2, 'Highland Dairy', TRUE),
(3, 'Artisan Craft Breads', TRUE),
(4, 'Ceylon Pure Harvest', TRUE),
(5, 'Valley Green Farms', TRUE),
(6, 'Tropical Sip', TRUE)
ON DUPLICATE KEY UPDATE
    brand_name = VALUES(brand_name),
    is_active = VALUES(is_active);

-- 3. Products (Respects CHECK constraint: selling_unit='KG' requires price_per_kg, selling_unit='EACH' requires price_per_item)
INSERT INTO products (product_id, category_id, brand_id, product_name, description, selling_unit, price_per_kg, price_per_item, image_url, is_featured, product_status) VALUES
(1, 1, 1, 'Farm Fresh Organic Strawberries', 'Sweet, ruby-red highland strawberries rich in antioxidants and Vitamin C. Sold by weight.', 'KG', 2600.00, NULL, 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=80', TRUE, 'ACTIVE'),
(2, 2, 5, 'Crisp Broccoli Crown', 'Tender, nutrient-dense green florets freshly cut from organic highland farms.', 'KG', 760.00, NULL, 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=600&q=80', TRUE, 'ACTIVE'),
(3, 3, 2, 'Pasteurized Pure Full Cream Milk', '1 Litre bottle of fresh, farm-homogenized pure full cream cows milk.', 'EACH', NULL, 490.00, 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80', TRUE, 'ACTIVE'),
(4, 4, 3, 'Artisan Whole Wheat Sourdough', '450g slow-fermented, naturally leavened rustic sourdough bread with a golden crust.', 'EACH', NULL, 520.00, 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=600&q=80', TRUE, 'ACTIVE'),
(5, 1, 4, 'Cavendish Bananas', 'Naturally ripened, potassium-rich golden bananas with a smooth creamy texture.', 'KG', 340.00, NULL, 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80', FALSE, 'ACTIVE'),
(6, 2, 5, 'Vine-Ripened Roma Tomatoes', 'Juicy, deep-red plum tomatoes bursting with sun-ripened flavor, ideal for salads and sauces.', 'KG', 420.00, NULL, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80', FALSE, 'ACTIVE'),
(7, 2, 5, 'Crunchy Orange Carrots', 'Sweet, crisp root carrots harvested fresh with vibrant natural beta-carotene.', 'KG', 380.00, NULL, 'https://images.unsplash.com/photo-1598170845058-32b9d6a5c317?auto=format&fit=crop&w=600&q=80', FALSE, 'ACTIVE'),
(8, 3, 2, 'Rich Creamery Farm Butter 200g', 'Traditional cultured churned butter made from pure grass-fed cow cream with a touch of sea salt.', 'EACH', NULL, 680.00, 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80', FALSE, 'ACTIVE'),
(9, 5, 4, 'Organic Fragrant Basmati Rice 5kg', 'Extra-long grain aged aromatic basmati rice with slender grains and non-sticky fluffiness.', 'EACH', NULL, 2850.00, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80', TRUE, 'ACTIVE'),
(10, 6, 6, 'Cold Pressed Valencia Orange Juice 500ml', '100% freshly squeezed natural orange juice with gentle citrus pulp and zero added sugars.', 'EACH', NULL, 580.00, 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80', FALSE, 'ACTIVE'),
(11, 1, 1, 'Hass Creamy Avocados', 'Rich, buttery Hass avocados loaded with healthy monounsaturated heart-healthy fats.', 'KG', 1200.00, NULL, 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=600&q=80', TRUE, 'ACTIVE'),
(12, 3, 2, 'Free Range Brown Eggs (Pack of 10)', 'Farm-fresh brown eggs from cage-free hens raised on all-natural grain diets.', 'EACH', NULL, 590.00, 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80', FALSE, 'ACTIVE')
ON DUPLICATE KEY UPDATE
    category_id = VALUES(category_id),
    brand_id = VALUES(brand_id),
    product_name = VALUES(product_name),
    description = VALUES(description),
    selling_unit = VALUES(selling_unit),
    price_per_kg = VALUES(price_per_kg),
    price_per_item = VALUES(price_per_item),
    image_url = VALUES(image_url),
    is_featured = VALUES(is_featured),
    product_status = VALUES(product_status);

-- 4. Product Offers (Member 2 discount engine)
INSERT INTO product_offers (offer_id, product_id, offer_name, discount_percent, starts_at, ends_at, is_active) VALUES
(1, 1, 'Highland Berry Fest', 20.00, '2026-01-01 00:00:00', '2027-01-01 00:00:00', TRUE),
(2, 2, 'Crisp Veggies Weekly Deal', 15.00, '2026-01-01 00:00:00', '2027-01-01 00:00:00', TRUE),
(3, 3, 'Breakfast Dairy Saver', 11.00, '2026-01-01 00:00:00', '2027-01-01 00:00:00', TRUE),
(4, 4, 'Bakers Morning Delight', 13.00, '2026-01-01 00:00:00', '2027-01-01 00:00:00', TRUE)
ON DUPLICATE KEY UPDATE
    offer_name = VALUES(offer_name),
    discount_percent = VALUES(discount_percent),
    starts_at = VALUES(starts_at),
    ends_at = VALUES(ends_at),
    is_active = VALUES(is_active);

-- 5. Inventory (Ensures stock for each product)
INSERT INTO inventory (product_id, stock_quantity, low_stock_threshold) VALUES
(1, 85.500, 10.000),
(2, 120.000, 15.000),
(3, 200.000, 20.000),
(4, 60.000, 10.000),
(5, 300.000, 25.000),
(6, 150.000, 20.000),
(7, 180.000, 20.000),
(8, 90.000, 15.000),
(9, 75.000, 10.000),
(10, 110.000, 15.000),
(11, 45.000, 10.000),
(12, 160.000, 20.000)
ON DUPLICATE KEY UPDATE
    stock_quantity = VALUES(stock_quantity),
    low_stock_threshold = VALUES(low_stock_threshold);
