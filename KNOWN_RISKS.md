# Known Risks & Pre-Demo Checklist

---

## Fragile Items

### 1. Database state is ephemeral (HIGH RISK)
**Risk:** Any test run before the demo (login, buy, cancel) dirtied the DB. You'll demo broken orders.
**Fix:** Always run `psql online_store < src/database/demo_reset.sql` at most 5 minutes before going live.

### 2. Lenovo ThinkPad (Product B) has exactly 1 unit (HIGH RISK)
**Risk:** If someone (or a stale cart) purchases it before the demo, stock drops to 0 and Step 3 fails.
**Fix:** After seeding, keep the DB clean. The `demo_reset.sql` restores stock=1.

### 3. Product G (Magic Keyboard) must be in `processing` state (HIGH RISK)
**Risk:** If the Magic Keyboard order was previously cancelled (from any test), Step 1's "cancel" demo has nothing to cancel.
**Fix:** Re-seed. `demo_reset.sql` creates a fresh processing order every time.

### 4. Product D is created live — must not exist before Step 4 (MEDIUM RISK)
**Risk:** If a test previously created Product D, Step 4's "add new product" duplicates it or causes a serial number conflict.
**Fix:** `demo_reset.sql` deletes all non-core products (id > 9). Run it before the demo.

### 5. Discount notification only fires for wishlist users (MEDIUM RISK)
**Risk:** In Step 5, setting discounts on C (AirPods) and F (Sony) only sends a notification to customers who have those products wishlisted. AirPods is added live in Step 1. Sony (F) is pre-seeded in the wishlist.
**Fix:** Customer MUST add AirPods Pro to wishlist in Step 1 BEFORE the grader reaches Step 5. Don't skip it.

### 6. SMTP email shows "demo" status if not configured (LOW RISK)
**Risk:** The email alert says "Invoice email sent to..." but SMTP is not configured in `.env`. The backend returns `"status":"demo"` and the alert still shows. Grader might notice.
**Fix:** Either configure real SMTP in `.env` before the demo, or verbally explain the backend has SMTP support and the demo runs in local mode.

### 7. Review/comment on Product E requires a delivered order for the customer (MEDIUM RISK)
**Risk:** The review system checks that the logged-in user has a delivered order containing the product. The seeded E order (Dell XPS 13, 46 days ago, delivered) satisfies this. If E order is missing, the "Rate Product" button won't appear.
**Fix:** `demo_reset.sql` creates this order. Verify it appears in My Orders before demo.

### 8. Return window math (LOW RISK)
**Risk:** The 30-day return window is computed at request time by the backend. Product F is seeded 14 days ago — safe margin. Product E is 46 days ago — safely outside the window.
**Fix:** No action needed, but do not re-seed very close to the demo day and then wait weeks.

---

## Pre-Demo Checklist (run 10 minutes before)

```
□ Kill existing backend:   lsof -ti :3000 | xargs kill -9
□ Reset DB:                psql online_store < src/database/demo_reset.sql
□ Start backend:           cargo run          (keep terminal open)
□ Start frontend:          cd src/frontend && npm start
□ Open browser at:         http://localhost:3001
□ Confirm homepage loads and shows 9 products
□ Samsung Galaxy S24 — Add to Cart button DISABLED (stock=0)
□ Lenovo ThinkPad X1 — shows "1 in stock"
□ Log in as customer@demo.com / demo1234
□ My Orders shows 4 orders (Dell/Sony/Magic Keyboard/Logitech)
□ Magic Keyboard is Processing (not cancelled)
□ Dell XPS 13 has NO return button visible
□ Sony WH-1000XM5 HAS a return button visible
□ Log out — ready to start demo from scratch
```

---

## If Something Goes Wrong Live

| Problem | Quick fix |
|---------|-----------|
| Backend won't start (port in use) | `lsof -ti :3000 \| xargs kill -9` then `cargo run` |
| Wrong orders / missing products | `psql online_store < src/database/demo_reset.sql` (takes ~1s) |
| "Out of stock" on B before Step 3 | `psql online_store -c "UPDATE products SET stock_quantity=1 WHERE product_id=3"` |
| Return button missing on F | `psql online_store -c "SELECT NOW() - created_at FROM orders WHERE order_id=<F_order_id>"` — verify it's <30 days |
| Notification bell empty after discount | Customer must have product in wishlist BEFORE discount is set; re-seed and redo Step 1 |
