-- =============================================================
-- CS308 Online Store — Demo User Seed
-- =============================================================
-- Run AFTER schema.sql and seed.sql.
-- Password for all accounts: demo1234
-- Hash generated with bcrypt cost 12.
-- Idempotent: safe to re-run on any state of the database.
-- =============================================================

DO $$
BEGIN
  -- Remove non-demo users squatting on IDs 1–3 so the INSERT can claim them.
  -- (ON DELETE RESTRICT on orders means this only silently no-ops if a squatter
  --  somehow has orders; the upsert below will still update demo users by email.)
  DELETE FROM users
  WHERE user_id IN (1, 2, 3)
    AND email NOT IN ('customer@demo.com', 'manager@demo.com', 'delivery@demo.com');

  -- Upsert: fresh DB gets explicit IDs 1/2/3; re-run refreshes name/hash/role/address
  -- without touching user_id (avoids FK cascade issues on existing child rows).
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
  ON CONFLICT (email) DO UPDATE SET
    user_name     = EXCLUDED.user_name,
    password_hash = EXCLUDED.password_hash,
    role          = EXCLUDED.role,
    home_address  = EXCLUDED.home_address;

  -- Advance the sequence past the highest ID so future inserts never collide.
  PERFORM setval(
    'users_user_id_seq',
    GREATEST(3, (SELECT COALESCE(MAX(user_id), 0) FROM users))
  );
END $$;
