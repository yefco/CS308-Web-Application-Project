-- =============================================================
-- CS308 Online Store — Demo User Seed
-- =============================================================
-- Run AFTER schema.sql and seed.sql.
-- Password for all accounts: demo1234
-- Hash generated with bcrypt cost 12.
-- =============================================================

INSERT INTO users (user_name, email, password_hash, role, home_address) VALUES
  ('Demo Customer',
   'customer@demo.com',
   '$2y$12$mUYolWSMDDkxJl8ghNbCheI38P0QeCaIahv.r6B2wW4Uw6/KpHNjO',
   'customer',
   '123 Demo Street, Istanbul, TR'),

  ('Product Manager',
   'manager@demo.com',
   '$2y$12$mUYolWSMDDkxJl8ghNbCheI38P0QeCaIahv.r6B2wW4Uw6/KpHNjO',
   'product_manager',
   NULL),

  ('Sales Manager',
   'delivery@demo.com',
   '$2y$12$mUYolWSMDDkxJl8ghNbCheI38P0QeCaIahv.r6B2wW4Uw6/KpHNjO',
   'sales_manager',
   NULL)

ON CONFLICT (email) DO NOTHING;
