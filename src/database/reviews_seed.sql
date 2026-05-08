-- =============================================================
-- CS308 Online Store — Demo Reviews Seed
-- =============================================================
-- Run AFTER schema.sql, seed.sql, and demo_users.sql:
--   psql online_store < src/database/reviews_seed.sql
--
-- Creates 10 fictional reviewer accounts and inserts approved
-- reviews so that "Sort by Popularity" shows a clear ranking.
--
-- Popularity ranking (review count):
--   MacBook Pro 14"       — 8 reviews  ★★★★★ avg ~4.6
--   iPhone 15 Pro         — 7 reviews  ★★★★★ avg ~4.7
--   AirPods Pro           — 6 reviews  ★★★★  avg ~4.3
--   Dell XPS 13           — 5 reviews  ★★★★  avg ~4.0
--   Sony WH-1000XM5       — 4 reviews  ★★★★  avg ~4.3
--   Lenovo ThinkPad X1    — 3 reviews  ★★★★  avg ~4.0
--   Logitech MX Master 3S — 2 reviews  ★★★★★ avg ~4.5
--   Samsung Galaxy S24    — 2 reviews  ★★★   avg ~3.5
--   Magic Keyboard        — 1 review   ★★★★  avg ~4.0
-- =============================================================

-- ── Reviewer accounts ────────────────────────────────────────
-- Password hash = bcrypt("demo1234", cost=12) — same as demo accounts.
-- These accounts are for seed data only; login is not needed for the demo.

INSERT INTO users (user_name, email, password_hash, role) VALUES
  ('Alice Johnson',  'alice@reviewers.demo',  '$2y$12$mUYolWSMDDkxJl8ghNbCheI38P0QeCaIahv.r6B2wW4Uw6/KpHNjO', 'customer'),
  ('Bob Martinez',   'bob@reviewers.demo',    '$2y$12$mUYolWSMDDkxJl8ghNbCheI38P0QeCaIahv.r6B2wW4Uw6/KpHNjO', 'customer'),
  ('Carol Lee',      'carol@reviewers.demo',  '$2y$12$mUYolWSMDDkxJl8ghNbCheI38P0QeCaIahv.r6B2wW4Uw6/KpHNjO', 'customer'),
  ('David Chen',     'david@reviewers.demo',  '$2y$12$mUYolWSMDDkxJl8ghNbCheI38P0QeCaIahv.r6B2wW4Uw6/KpHNjO', 'customer'),
  ('Eva Rossi',      'eva@reviewers.demo',    '$2y$12$mUYolWSMDDkxJl8ghNbCheI38P0QeCaIahv.r6B2wW4Uw6/KpHNjO', 'customer'),
  ('Frank Yıldız',   'frank@reviewers.demo',  '$2y$12$mUYolWSMDDkxJl8ghNbCheI38P0QeCaIahv.r6B2wW4Uw6/KpHNjO', 'customer'),
  ('Grace Kim',      'grace@reviewers.demo',  '$2y$12$mUYolWSMDDkxJl8ghNbCheI38P0QeCaIahv.r6B2wW4Uw6/KpHNjO', 'customer'),
  ('Henry Patel',    'henry@reviewers.demo',  '$2y$12$mUYolWSMDDkxJl8ghNbCheI38P0QeCaIahv.r6B2wW4Uw6/KpHNjO', 'customer'),
  ('Ivan Sokolov',   'ivan@reviewers.demo',   '$2y$12$mUYolWSMDDkxJl8ghNbCheI38P0QeCaIahv.r6B2wW4Uw6/KpHNjO', 'customer'),
  ('Julia Müller',   'julia@reviewers.demo',  '$2y$12$mUYolWSMDDkxJl8ghNbCheI38P0QeCaIahv.r6B2wW4Uw6/KpHNjO', 'customer')
ON CONFLICT (email) DO NOTHING;

-- ── Reviews ──────────────────────────────────────────────────
-- All inserted as 'approved' so they are visible on product pages
-- and counted in the popularity sort.
-- Safe to re-run: ON CONFLICT (product_id, user_id) DO NOTHING.

INSERT INTO product_reviews (product_id, user_id, rating, comment, status) VALUES

  -- ── MacBook Pro 14" — 8 reviews ─────────────────────────────
  (
    (SELECT product_id FROM products WHERE serial_number = 'SN-MBP14-001'),
    (SELECT user_id FROM users WHERE email = 'alice@reviewers.demo'),
    5, 'Absolutely love this machine. The M3 chip handles everything I throw at it.', 'approved'
  ),
  (
    (SELECT product_id FROM products WHERE serial_number = 'SN-MBP14-001'),
    (SELECT user_id FROM users WHERE email = 'bob@reviewers.demo'),
    5, 'Battery life is incredible — easily 16+ hours of real work. Worth every penny.', 'approved'
  ),
  (
    (SELECT product_id FROM products WHERE serial_number = 'SN-MBP14-001'),
    (SELECT user_id FROM users WHERE email = 'carol@reviewers.demo'),
    4, 'Great display and performance. A bit pricey but justifiable for the build quality.', 'approved'
  ),
  (
    (SELECT product_id FROM products WHERE serial_number = 'SN-MBP14-001'),
    (SELECT user_id FROM users WHERE email = 'david@reviewers.demo'),
    5, 'Switched from Windows and never looked back. Exceptional machine.', 'approved'
  ),
  (
    (SELECT product_id FROM products WHERE serial_number = 'SN-MBP14-001'),
    (SELECT user_id FROM users WHERE email = 'eva@reviewers.demo'),
    4, 'Fast, silent, and beautiful. The notch takes getting used to.', 'approved'
  ),
  (
    (SELECT product_id FROM products WHERE serial_number = 'SN-MBP14-001'),
    (SELECT user_id FROM users WHERE email = 'frank@reviewers.demo'),
    5, 'Perfect for video editing. Renders in a fraction of the time my old Intel Mac did.', 'approved'
  ),
  (
    (SELECT product_id FROM products WHERE serial_number = 'SN-MBP14-001'),
    (SELECT user_id FROM users WHERE email = 'grace@reviewers.demo'),
    4, 'Premium feel. Keyboard and trackpad are best in class.', 'approved'
  ),
  (
    (SELECT product_id FROM products WHERE serial_number = 'SN-MBP14-001'),
    (SELECT user_id FROM users WHERE email = 'henry@reviewers.demo'),
    5, 'Blazing fast. Gets warm under sustained load but not uncomfortable.', 'approved'
  ),

  -- ── iPhone 15 Pro — 7 reviews ───────────────────────────────
  (
    (SELECT product_id FROM products WHERE serial_number = 'SN-IP15P-001'),
    (SELECT user_id FROM users WHERE email = 'alice@reviewers.demo'),
    5, 'Camera quality is stunning. Night mode photos blow me away every time.', 'approved'
  ),
  (
    (SELECT product_id FROM products WHERE serial_number = 'SN-IP15P-001'),
    (SELECT user_id FROM users WHERE email = 'bob@reviewers.demo'),
    5, 'The titanium frame feels premium without being too heavy.', 'approved'
  ),
  (
    (SELECT product_id FROM products WHERE serial_number = 'SN-IP15P-001'),
    (SELECT user_id FROM users WHERE email = 'carol@reviewers.demo'),
    4, 'Great phone, love the Action Button. Battery could be bigger.', 'approved'
  ),
  (
    (SELECT product_id FROM products WHERE serial_number = 'SN-IP15P-001'),
    (SELECT user_id FROM users WHERE email = 'david@reviewers.demo'),
    5, 'USB-C is finally here. 4K ProRes video recording is a game changer.', 'approved'
  ),
  (
    (SELECT product_id FROM products WHERE serial_number = 'SN-IP15P-001'),
    (SELECT user_id FROM users WHERE email = 'eva@reviewers.demo'),
    5, 'Smooth 120Hz display and a17 Pro chip — this phone is fast.', 'approved'
  ),
  (
    (SELECT product_id FROM products WHERE serial_number = 'SN-IP15P-001'),
    (SELECT user_id FROM users WHERE email = 'frank@reviewers.demo'),
    4, 'Best iPhone I have owned. Slightly expensive but top-tier specs.', 'approved'
  ),
  (
    (SELECT product_id FROM products WHERE serial_number = 'SN-IP15P-001'),
    (SELECT user_id FROM users WHERE email = 'grace@reviewers.demo'),
    5, 'Telephoto lens is amazing for travel photography.', 'approved'
  ),

  -- ── AirPods Pro — 6 reviews ─────────────────────────────────
  (
    (SELECT product_id FROM products WHERE serial_number = 'SN-APP-001'),
    (SELECT user_id FROM users WHERE email = 'alice@reviewers.demo'),
    5, 'ANC is the best I have tried. Transparency mode sounds completely natural.', 'approved'
  ),
  (
    (SELECT product_id FROM products WHERE serial_number = 'SN-APP-001'),
    (SELECT user_id FROM users WHERE email = 'bob@reviewers.demo'),
    4, 'Sound quality is excellent. Fit could be better for larger ears.', 'approved'
  ),
  (
    (SELECT product_id FROM products WHERE serial_number = 'SN-APP-001'),
    (SELECT user_id FROM users WHERE email = 'carol@reviewers.demo'),
    5, 'The Adaptive Audio feature is brilliant — works perfectly in noisy cafes.', 'approved'
  ),
  (
    (SELECT product_id FROM products WHERE serial_number = 'SN-APP-001'),
    (SELECT user_id FROM users WHERE email = 'david@reviewers.demo'),
    4, 'Great earbuds if you are in the Apple ecosystem. Case is very compact.', 'approved'
  ),
  (
    (SELECT product_id FROM products WHERE serial_number = 'SN-APP-001'),
    (SELECT user_id FROM users WHERE email = 'eva@reviewers.demo'),
    4, 'Battery life is decent. I wish they lasted longer per charge.', 'approved'
  ),
  (
    (SELECT product_id FROM products WHERE serial_number = 'SN-APP-001'),
    (SELECT user_id FROM users WHERE email = 'frank@reviewers.demo'),
    4, 'Comfortable for long flights. Noise cancellation blocks out engine noise well.', 'approved'
  ),

  -- ── Dell XPS 13 — 5 reviews ─────────────────────────────────
  (
    (SELECT product_id FROM products WHERE serial_number = 'SN-XPS13-001'),
    (SELECT user_id FROM users WHERE email = 'alice@reviewers.demo'),
    4, 'Compact and powerful. Great for travel. Webcam placement is awkward though.', 'approved'
  ),
  (
    (SELECT product_id FROM products WHERE serial_number = 'SN-XPS13-001'),
    (SELECT user_id FROM users WHERE email = 'bob@reviewers.demo'),
    4, 'Solid build quality and fast SSD. Runs warm under load.', 'approved'
  ),
  (
    (SELECT product_id FROM products WHERE serial_number = 'SN-XPS13-001'),
    (SELECT user_id FROM users WHERE email = 'carol@reviewers.demo'),
    5, 'The display is gorgeous. Perfect laptop for developers on the go.', 'approved'
  ),
  (
    (SELECT product_id FROM products WHERE serial_number = 'SN-XPS13-001'),
    (SELECT user_id FROM users WHERE email = 'david@reviewers.demo'),
    3, 'Good laptop but battery life disappoints me. Expect 6-7 hours max.', 'approved'
  ),
  (
    (SELECT product_id FROM products WHERE serial_number = 'SN-XPS13-001'),
    (SELECT user_id FROM users WHERE email = 'eva@reviewers.demo'),
    4, 'Ultra-thin and light. Perfect for my daily commute.', 'approved'
  ),

  -- ── Sony WH-1000XM5 — 4 reviews ─────────────────────────────
  (
    (SELECT product_id FROM products WHERE serial_number = 'SN-SONY-001'),
    (SELECT user_id FROM users WHERE email = 'alice@reviewers.demo'),
    5, 'Best headphones I have ever owned. ANC is industry leading, period.', 'approved'
  ),
  (
    (SELECT product_id FROM products WHERE serial_number = 'SN-SONY-001'),
    (SELECT user_id FROM users WHERE email = 'bob@reviewers.demo'),
    4, 'Incredibly comfortable for long listening sessions. Sound signature is warm and detailed.', 'approved'
  ),
  (
    (SELECT product_id FROM products WHERE serial_number = 'SN-SONY-001'),
    (SELECT user_id FROM users WHERE email = 'carol@reviewers.demo'),
    4, 'Multipoint Bluetooth works flawlessly between my phone and laptop.', 'approved'
  ),
  (
    (SELECT product_id FROM products WHERE serial_number = 'SN-SONY-001'),
    (SELECT user_id FROM users WHERE email = 'david@reviewers.demo'),
    4, 'No 3.5 mm jack while powered off is annoying. Sound quality otherwise excellent.', 'approved'
  ),

  -- ── Lenovo ThinkPad X1 — 3 reviews ──────────────────────────
  (
    (SELECT product_id FROM products WHERE serial_number = 'SN-TPX1-001'),
    (SELECT user_id FROM users WHERE email = 'alice@reviewers.demo'),
    4, 'Rock-solid build. Keyboard is still the best in the laptop market.', 'approved'
  ),
  (
    (SELECT product_id FROM products WHERE serial_number = 'SN-TPX1-001'),
    (SELECT user_id FROM users WHERE email = 'bob@reviewers.demo'),
    4, 'Enterprise-grade reliability. I have been using ThinkPads for ten years.', 'approved'
  ),
  (
    (SELECT product_id FROM products WHERE serial_number = 'SN-TPX1-001'),
    (SELECT user_id FROM users WHERE email = 'carol@reviewers.demo'),
    4, 'Solid performance and great security features. Display could be brighter.', 'approved'
  ),

  -- ── Logitech MX Master 3S — 2 reviews ───────────────────────
  (
    (SELECT product_id FROM products WHERE serial_number = 'SN-LOGI-001'),
    (SELECT user_id FROM users WHERE email = 'alice@reviewers.demo'),
    5, 'Best productivity mouse on the market. The MagSpeed scroll wheel is addictive.', 'approved'
  ),
  (
    (SELECT product_id FROM products WHERE serial_number = 'SN-LOGI-001'),
    (SELECT user_id FROM users WHERE email = 'bob@reviewers.demo'),
    4, 'Ergonomic and precise. Silent clicks are a nice touch in an open office.', 'approved'
  ),

  -- ── Samsung Galaxy S24 — 2 reviews ──────────────────────────
  (
    (SELECT product_id FROM products WHERE serial_number = 'SN-S24-001'),
    (SELECT user_id FROM users WHERE email = 'ivan@reviewers.demo'),
    4, 'Snapdragon performance is snappy. AI features are actually useful.', 'approved'
  ),
  (
    (SELECT product_id FROM products WHERE serial_number = 'SN-S24-001'),
    (SELECT user_id FROM users WHERE email = 'julia@reviewers.demo'),
    3, 'Good phone but the base 128 GB storage fills up fast. Screen is beautiful though.', 'approved'
  ),

  -- ── Magic Keyboard — 1 review ────────────────────────────────
  (
    (SELECT product_id FROM products WHERE serial_number = 'SN-MK-001'),
    (SELECT user_id FROM users WHERE email = 'ivan@reviewers.demo'),
    4, 'Compact and responsive. Touch ID integration is seamless. No number pad is a trade-off.', 'approved'
  )

ON CONFLICT (product_id, user_id) DO NOTHING;
