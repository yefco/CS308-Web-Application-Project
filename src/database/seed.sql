-- =============================================================
-- CS308 Online Store — Demo Seed Data
-- =============================================================
-- Run AFTER schema.sql:
--   psql online_store < src/database/schema.sql
--   psql online_store < src/database/seed.sql
--
-- Creates demo users via the API (see DEMO_CHECKLIST.md).
-- This file only seeds non-user data (categories + products).
-- =============================================================

-- ── Categories ────────────────────────────────────────────────

INSERT INTO categories (category_name, description) VALUES
  ('Laptops',      'Portable computers for work and creativity'),
  ('Smartphones',  'Mobile phones and accessories'),
  ('Audio',        'Headphones, earbuds, and speakers'),
  ('Accessories',  'Keyboards, mice, and peripherals')
ON CONFLICT (category_name) DO NOTHING;

-- ── Products ──────────────────────────────────────────────────
-- All nine required fields are populated:
--   product_id (serial), product_name, model, serial_number,
--   description, stock_quantity, price, warranty_status, distributor_info

INSERT INTO products
  (category_id, product_name, model, serial_number, description,
   stock_quantity, price, warranty_status, distributor_info)
VALUES
  -- Laptops (category 1)
  (1, 'MacBook Pro 14"',  'MBP14-M3',     'SN-MBP14-001',
   'Apple M3 chip, 16 GB unified memory, 512 GB SSD. Liquid Retina XDR display.',
   8, 1999.00, TRUE, 'Apple Inc. — APL-DIST-001'),

  (1, 'Dell XPS 13',      'XPS13-9340',   'SN-XPS13-001',
   'Intel Core Ultra 7, 16 GB LPDDR5x RAM, 512 GB PCIe SSD. Compact ultrabook.',
   5, 1299.00, TRUE, 'Dell Technologies — DELL-DIST-TR'),

  (1, 'Lenovo ThinkPad X1', 'X1C-G12',   'SN-TPX1-001',
   'Intel Core i7-1365U, 16 GB RAM, 1 TB SSD. Business flagship.',
   1, 1449.00, TRUE, 'Lenovo Group Ltd — LNV-DIST-EU'),

  -- Smartphones (category 2)
  (2, 'iPhone 15 Pro',    'A3102',        'SN-IP15P-001',
   'Apple A17 Pro chip, 48 MP main camera, titanium frame. 256 GB.',
   12, 999.00, TRUE, 'Apple Inc. — APL-DIST-001'),

  (2, 'Samsung Galaxy S24', 'SM-S921B',   'SN-S24-001',
   'Snapdragon 8 Gen 3, 50 MP camera, 6.2-inch Dynamic AMOLED. 256 GB.',
   0, 849.00, TRUE, 'Samsung Electronics — SEC-DIST-TR'),

  -- Audio (category 3)
  (3, 'AirPods Pro',      'MTJV3LL/A',   'SN-APP-001',
   'Active noise cancellation, Adaptive Audio, MagSafe charging case. 2nd gen.',
   20, 249.00, TRUE, 'Apple Inc. — APL-DIST-001'),

  (3, 'Sony WH-1000XM5',  'WH1000XM5/B', 'SN-SONY-001',
   'Industry-leading noise cancellation, 30-hour battery, multipoint connection.',
   7, 349.00, TRUE, 'Sony Corporation — SON-DIST-EU'),

  -- Accessories (category 4)
  (4, 'Magic Keyboard',   'MK2C3LL/A',   'SN-MK-001',
   'Wireless, rechargeable. Touch ID sensor. Compatible with Mac and iPad.',
   15, 99.00, FALSE, 'Apple Inc. — APL-DIST-001'),

  (4, 'Logitech MX Master 3S', '910-006556', 'SN-LOGI-001',
   '8K DPI sensor, silent clicks, USB-C charging, works on any surface.',
   18, 99.99, FALSE, 'Logitech International — LOGI-DIST-TR')

ON CONFLICT (serial_number) DO NOTHING;
