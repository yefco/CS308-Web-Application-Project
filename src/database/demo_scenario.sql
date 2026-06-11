-- =============================================================
-- CS308 Final Demo Scenario Seed
-- =============================================================
-- Maps existing seeded products to the demo roles:
--
--   Product A  (out of stock, button disabled) = Samsung Galaxy S24
--   Product B  (1 in stock, bought in Step 3)  = Lenovo ThinkPad X1
--   Product C  (wishlisted, 20% discount)      = AirPods Pro
--   Product D  (added live by product manager) = not seeded
--   Product E  (delivered >1 month ago)        = Dell XPS 13
--   Product F  (delivered <1 month ago)        = Sony WH-1000XM5
--   Product G  (processing, customer cancels)  = Magic Keyboard
--   Product H  (in transit)                    = Logitech MX Master 3S
--
-- Safe to re-run: skips orders that already exist for each product.
-- =============================================================

DO $$
DECLARE
  order_e_id  INT;
  order_f_id  INT;
  order_g_id  INT;
  order_h_id  INT;
BEGIN

  -- Product E: Dell XPS 13 (product_id=2), delivered 46 days ago
  -- Outside 30-day return window → customer CANNOT request return
  IF NOT EXISTS (
    SELECT 1 FROM orders o JOIN order_items oi ON o.order_id = oi.order_id
    WHERE o.user_id = 1 AND oi.product_id = 2 AND o.status = 'delivered'
      AND o.created_at < NOW() - INTERVAL '30 days'
  ) THEN
    INSERT INTO orders (user_id, status, delivery_address, total_amount, created_at, updated_at)
    VALUES (1, 'delivered', '123 Demo Street, Istanbul, TR', 1299.00,
            NOW() - INTERVAL '46 days', NOW() - INTERVAL '40 days')
    RETURNING order_id INTO order_e_id;
    INSERT INTO order_items (order_id, product_id, quantity, unit_price)
    VALUES (order_e_id, 2, 1, 1299.00);
  END IF;

  -- Product F: Sony WH-1000XM5 (product_id=7), delivered 14 days ago
  -- Within 30-day return window → customer CAN request return
  IF NOT EXISTS (
    SELECT 1 FROM orders o JOIN order_items oi ON o.order_id = oi.order_id
    WHERE o.user_id = 1 AND oi.product_id = 7 AND o.status = 'delivered'
  ) THEN
    INSERT INTO orders (user_id, status, delivery_address, total_amount, created_at, updated_at)
    VALUES (1, 'delivered', '123 Demo Street, Istanbul, TR', 349.00,
            NOW() - INTERVAL '14 days', NOW() - INTERVAL '10 days')
    RETURNING order_id INTO order_f_id;
    INSERT INTO order_items (order_id, product_id, quantity, unit_price)
    VALUES (order_f_id, 7, 1, 349.00);
  END IF;

  -- Product G: Magic Keyboard (product_id=8), processing
  -- Customer will cancel this during the demo
  IF NOT EXISTS (
    SELECT 1 FROM orders o JOIN order_items oi ON o.order_id = oi.order_id
    WHERE o.user_id = 1 AND oi.product_id = 8 AND o.status = 'processing'
  ) THEN
    INSERT INTO orders (user_id, status, delivery_address, total_amount, created_at, updated_at)
    VALUES (1, 'processing', '123 Demo Street, Istanbul, TR', 99.00,
            NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day')
    RETURNING order_id INTO order_g_id;
    INSERT INTO order_items (order_id, product_id, quantity, unit_price)
    VALUES (order_g_id, 8, 1, 99.00);
  END IF;

  -- Product H: Logitech MX Master 3S (product_id=9), in_transit
  IF NOT EXISTS (
    SELECT 1 FROM orders o JOIN order_items oi ON o.order_id = oi.order_id
    WHERE o.user_id = 1 AND oi.product_id = 9 AND o.status = 'in_transit'
  ) THEN
    INSERT INTO orders (user_id, status, delivery_address, total_amount, created_at, updated_at)
    VALUES (1, 'in_transit', '123 Demo Street, Istanbul, TR', 99.99,
            NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day')
    RETURNING order_id INTO order_h_id;
    INSERT INTO order_items (order_id, product_id, quantity, unit_price)
    VALUES (order_h_id, 9, 1, 99.99);
  END IF;

END $$;
