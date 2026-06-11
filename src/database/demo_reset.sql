-- =============================================================
-- CS308 Final Demo — Full Reset Seed
-- =============================================================
-- Run this ONCE before the demo (or any time the DB is dirty):
--
--   psql online_store < src/database/demo_reset.sql
--   (or with explicit connection:)
--   psql postgres://USER:PASS@HOST:5432/online_store < src/database/demo_reset.sql
--
-- Idempotent: safe to re-run as many times as needed.
-- Prints demo credentials at the end.
--
-- What it does:
--   1. Resets all product prices / discounts / stock to seed values
--   2. Re-inserts Samsung Galaxy S24 (Product A, stock=0) if missing
--   3. Wipes the demo customer's orders, cart, notifications, wishlist
--   4. Creates fresh demo scenario orders (E, F, G, H)
--   5. Pre-seeds Sony WH-1000XM5 (F) into customer wishlist
--   6. Resets demo user accounts (balance=0, tax_id set)
-- =============================================================

BEGIN;

-- ── 1. Reset product prices, discounts, and stock ─────────────

UPDATE products SET price = 1999.00, discount_percent = 0, stock_quantity = 8  WHERE product_id = 1;  -- MacBook Pro 14"
UPDATE products SET price = 1299.00, discount_percent = 0, stock_quantity = 5  WHERE product_id = 2;  -- Dell XPS 13        (Product E)
UPDATE products SET price = 1449.00, discount_percent = 0, stock_quantity = 1  WHERE product_id = 3;  -- Lenovo ThinkPad X1 (Product B)
UPDATE products SET price =  999.00, discount_percent = 0, stock_quantity = 12 WHERE product_id = 4;  -- iPhone 15 Pro
UPDATE products SET price =  249.00, discount_percent = 0, stock_quantity = 20 WHERE product_id = 6;  -- AirPods Pro        (Product C)
UPDATE products SET price =  349.00, discount_percent = 0, stock_quantity = 7  WHERE product_id = 7;  -- Sony WH-1000XM5    (Product F)
UPDATE products SET price =   99.00, discount_percent = 0, stock_quantity = 15 WHERE product_id = 8;  -- Magic Keyboard     (Product G)
UPDATE products SET price =   99.99, discount_percent = 0, stock_quantity = 18 WHERE product_id = 9;  -- Logitech MX Master (Product H)

-- Remove any leftover test products and categories from live testing
DELETE FROM products  WHERE product_id NOT IN (1,2,3,4,5,6,7,8,9);
DELETE FROM categories WHERE category_id NOT IN (1,2,3,4);

-- ── 2. Re-insert Samsung Galaxy S24 (Product A — stock=0) ─────

-- Clear any stale record that might block the insert
DELETE FROM products WHERE serial_number = 'SN-S24-001' AND product_id != 5;

INSERT INTO products
  (product_id, category_id, product_name, model, serial_number, description,
   stock_quantity, price, warranty_status, distributor_info, discount_percent)
OVERRIDING SYSTEM VALUE
VALUES
  (5, 2, 'Samsung Galaxy S24', 'SM-S921B', 'SN-S24-001',
   'Snapdragon 8 Gen 3, 50 MP camera, 6.2-inch Dynamic AMOLED. 256 GB.',
   0, 849.00, TRUE, 'Samsung Electronics — SEC-DIST-TR', 0)
ON CONFLICT (product_id) DO UPDATE SET
  category_id      = 2,
  product_name     = 'Samsung Galaxy S24',
  model            = 'SM-S921B',
  serial_number    = 'SN-S24-001',
  description      = 'Snapdragon 8 Gen 3, 50 MP camera, 6.2-inch Dynamic AMOLED. 256 GB.',
  stock_quantity   = 0,
  price            = 849.00,
  warranty_status  = TRUE,
  distributor_info = 'Samsung Electronics — SEC-DIST-TR',
  discount_percent = 0;

-- Advance the sequence past the highest product_id
SELECT setval('products_product_id_seq',
  GREATEST(9, (SELECT COALESCE(MAX(product_id), 0) FROM products)));

-- ── 3. Wipe demo customer's transient data ─────────────────────

DELETE FROM notifications  WHERE user_id = 1;
DELETE FROM wishlist_items WHERE user_id = 1;
DELETE FROM cart_items     WHERE cart_id IN (SELECT cart_id FROM shopping_carts WHERE user_id = 1);
DELETE FROM shopping_carts WHERE user_id = 1;
DELETE FROM return_requests WHERE user_id = 1;
DELETE FROM orders         WHERE user_id = 1;  -- cascades order_items

-- ── 4. Fresh demo scenario orders ─────────────────────────────

DO $$
DECLARE
  oid INT;
BEGIN

  -- Product E: Dell XPS 13 (product_id=2), delivered 46 days ago
  -- CANNOT return (outside 30-day window)
  INSERT INTO orders (user_id, status, delivery_address, total_amount, created_at, updated_at)
  VALUES (1, 'delivered', '123 Demo Street, Istanbul, TR', 1299.00,
          NOW() - INTERVAL '46 days', NOW() - INTERVAL '40 days')
  RETURNING order_id INTO oid;
  INSERT INTO order_items (order_id, product_id, quantity, unit_price)
  VALUES (oid, 2, 1, 1299.00);

  -- Product F: Sony WH-1000XM5 (product_id=7), delivered 14 days ago
  -- CAN return (within 30-day window); customer submits return in Step 2
  INSERT INTO orders (user_id, status, delivery_address, total_amount, created_at, updated_at)
  VALUES (1, 'delivered', '123 Demo Street, Istanbul, TR', 349.00,
          NOW() - INTERVAL '14 days', NOW() - INTERVAL '10 days')
  RETURNING order_id INTO oid;
  INSERT INTO order_items (order_id, product_id, quantity, unit_price)
  VALUES (oid, 7, 1, 349.00);

  -- Product G: Magic Keyboard (product_id=8), processing
  -- Customer will CANCEL this in Step 1
  INSERT INTO orders (user_id, status, delivery_address, total_amount, created_at, updated_at)
  VALUES (1, 'processing', '123 Demo Street, Istanbul, TR', 99.00,
          NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day')
  RETURNING order_id INTO oid;
  INSERT INTO order_items (order_id, product_id, quantity, unit_price)
  VALUES (oid, 8, 1, 99.00);

  -- Product H: Logitech MX Master 3S (product_id=9), in_transit
  INSERT INTO orders (user_id, status, delivery_address, total_amount, created_at, updated_at)
  VALUES (1, 'in_transit', '123 Demo Street, Istanbul, TR', 99.99,
          NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day')
  RETURNING order_id INTO oid;
  INSERT INTO order_items (order_id, product_id, quantity, unit_price)
  VALUES (oid, 9, 1, 99.99);

END $$;

-- ── 5. Pre-seed wishlist ───────────────────────────────────────
-- Product F (Sony WH-1000XM5) pre-seeded so discount notification fires in Step 5.
-- Product C (AirPods Pro) is added LIVE by the customer in Step 1.
INSERT INTO wishlist_items (user_id, product_id)
VALUES (1, 7)
ON CONFLICT (user_id, product_id) DO NOTHING;

-- ── 6. Reset demo user accounts ────────────────────────────────

DO $$
BEGIN
  DELETE FROM users
  WHERE user_id IN (1, 2, 3)
    AND email NOT IN ('customer@demo.com', 'manager@demo.com', 'delivery@demo.com');

  INSERT INTO users
    (user_id, user_name, email, password_hash, role, home_address, tax_id, balance)
  OVERRIDING SYSTEM VALUE
  VALUES
    (1, 'Demo Customer',   'customer@demo.com',
     '$2y$12$mUYolWSMDDkxJl8ghNbCheI38P0QeCaIahv.r6B2wW4Uw6/KpHNjO',
     'customer',        '123 Demo Street, Istanbul, TR', 'TC-12345678901', 0),
    (2, 'Product Manager', 'manager@demo.com',
     '$2y$12$mUYolWSMDDkxJl8ghNbCheI38P0QeCaIahv.r6B2wW4Uw6/KpHNjO',
     'product_manager', NULL, NULL, 0),
    (3, 'Sales Manager',   'delivery@demo.com',
     '$2y$12$mUYolWSMDDkxJl8ghNbCheI38P0QeCaIahv.r6B2wW4Uw6/KpHNjO',
     'sales_manager',   NULL, NULL, 0)
  ON CONFLICT (email) DO UPDATE SET
    user_name     = EXCLUDED.user_name,
    password_hash = EXCLUDED.password_hash,
    role          = EXCLUDED.role,
    home_address  = EXCLUDED.home_address,
    tax_id        = EXCLUDED.tax_id,
    balance       = 0;

  PERFORM setval('users_user_id_seq',
    GREATEST(3, (SELECT COALESCE(MAX(user_id), 0) FROM users)));
END $$;

COMMIT;

-- ── Final state confirmation ───────────────────────────────────

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '  CS308 DEMO SEED COMPLETE';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '  customer@demo.com   / demo1234  (customer)';
  RAISE NOTICE '  manager@demo.com    / demo1234  (product manager)';
  RAISE NOTICE '  delivery@demo.com   / demo1234  (sales manager)';
  RAISE NOTICE '----------------------------------------------';
  RAISE NOTICE '  Product A  Samsung Galaxy S24    stock=0   (out of stock)';
  RAISE NOTICE '  Product B  Lenovo ThinkPad X1    stock=1   (buy in Step 3)';
  RAISE NOTICE '  Product C  AirPods Pro            stock=20  (add to wishlist in Step 1)';
  RAISE NOTICE '  Product D  (does not exist yet)            (added live in Step 4)';
  RAISE NOTICE '  Product E  Dell XPS 13            delivered 46 days ago  (no return)';
  RAISE NOTICE '  Product F  Sony WH-1000XM5        delivered 14 days ago  (return in Step 2)';
  RAISE NOTICE '  Product G  Magic Keyboard         processing              (cancel in Step 1)';
  RAISE NOTICE '  Product H  Logitech MX Master 3S  in_transit';
  RAISE NOTICE '==============================================';
END $$;
