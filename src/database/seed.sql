-- Seed categories
INSERT INTO categories (category_name, description) VALUES
  ('Laptops', 'Portable computers'),
  ('Smartphones', 'Mobile phones'),
  ('Tablets', 'Tablet devices'),
  ('Accessories', 'Tech accessories');

-- Seed products
INSERT INTO products (category_id, product_name, model, serial_number, description, stock_quantity, price, warranty_status, distributor_info) VALUES
  (1, 'MacBook Pro 14"',      'MBP14-M3',   'SN-MBP14-001', 'High-performance laptop with M3 Max chip',               12, 1999.00, TRUE,  'Apple Inc.'),
  (1, 'Dell XPS 13',          'XPS13-9340', 'SN-XPS13-001', 'Ultrabook with stunning display and portability',         15, 1299.00, TRUE,  'Dell Technologies'),
  (1, 'Lenovo ThinkPad',      'TP-X1C',     'SN-TP-001',    'Business laptop with reliability and performance',        20,  849.00, TRUE,  'Lenovo Group'),
  (2, 'iPhone 15 Pro',        'A2848',      'SN-IP15P-001', 'Latest flagship smartphone with advanced camera',         25,  999.00, TRUE,  'Apple Inc.'),
  (2, 'Samsung Galaxy S24',   'SM-S921',    'SN-SGS24-001', 'Powerful Android flagship with excellent display',        30,  899.00, TRUE,  'Samsung Electronics'),
  (3, 'iPad Air',             'MYFM2LL',    'SN-IPAD-001',  'Versatile tablet perfect for work and creativity',        18,  599.00, TRUE,  'Apple Inc.'),
  (4, 'AirPods Pro',          'MTJV3LL',    'SN-APP-001',   'Premium wireless earbuds with noise cancellation',        45,  249.00, TRUE,  'Apple Inc.'),
  (4, 'Magic Keyboard',       'MK2C3LL',    'SN-MK-001',    'Wireless keyboard for seamless typing experience',        50,  149.00, TRUE,  'Apple Inc.');
