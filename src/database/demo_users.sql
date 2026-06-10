-- =============================================================
-- CS308 Online Store — Demo User Seed
-- =============================================================
-- Run AFTER schema.sql and seed.sql.
-- Password for all accounts: demo1234
-- Hash generated with  bcrypt cost 12.
-- =============================================================

INSERT INTO users (user_id, user_name, email, password_hash, role, home_address)
OVERRIDING SYSTEM VALUE VALUES
  (1,
   'Demo Customer',
   'customer@demo.com',
   '$2y$12$mUYolWSMDDkxJl8ghNbCheI38P0QeCaIahv.r6B2wW4Uw6/KpHNjO',
   'customer',
   '123 Demo Street, Istanbul, TR'),

  (2,
   'Product Manager',
   'manager@demo.com',
   '$2y$12$mUYolWSMDDkxJl8ghNbCheI38P0QeCaIahv.r6B2wW4Uw6/KpHNjO',
   'product_manager',
   NULL),

  (3,
   'Sales Manager',
   'delivery@demo.com',
   '$2y$12$mUYolWSMDDkxJl8ghNbCheI38P0QeCaIahv.r6B2wW4Uw6/KpHNjO',
   'sales_manager',
   NULL)

ON CONFLICT (email) DO NOTHING;

-- Advance sequence past the manually assigned IDs
SELECT setval('users_user_id_seq', (SELECT MAX(user_id) FROM users));
