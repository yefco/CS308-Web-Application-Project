# 10-Minute Progress Demo Script — CS308 Online Store

> **Audience**: CS308 TA  
> **Duration**: ~10 minutes  
> **Who drives**: One team member shares screen; others ready to assist.  
> **Pre-flight**: Complete `DEMO_CHECKLIST.md` before starting.

---

## 0:00 — 0:30 | Setup (before TA arrives)

- Backend running: `cargo run` in project root → see "Server listening on 0.0.0.0:3000"
- Frontend running: `cd src/frontend && npm start` → browser opens on `localhost:3001`
- PostgreSQL running, seeded (`psql online_store -c "SELECT product_name, stock_quantity FROM products;"` shows 9 products)
- Three browser tabs ready: `localhost:3001`, `localhost:3001/delivery`, `localhost:3001/product-manager/comment-approval`

---

## 0:30 — 1:30 | Feature 1 — Product Catalog (Req 9: 9 required fields)

**Say**: "This is the home page. Products are fetched from our backend."

1. Point to any product card → "Each product has name, category, price, stock, rating."
2. Click a product card → ProductDetailModal opens → show: **model, serial number, description, warranty status, distributor info** → "All 9 required fields are present."
3. Close modal.

---

## 1:30 — 2:30 | Feature 7 — Search and Sort

**Say**: "Search and sort are implemented server-side data, filtered on the frontend."

1. In the search box, type **"Samsung"** → one card appears: *Samsung Galaxy S24* → "This is Product A — out of stock."
2. Notice the **"Add to Cart" button is disabled** (greyed out). Point this out explicitly.
3. Clear search → type **"Lenovo"** → *Lenovo ThinkPad X1* appears → "This is Product B — exactly 1 in stock."
4. Clear search → type **"AirPods"** → *AirPods Pro* appears → "This is Product C — 20 in stock."
5. Clear search → use the **Sort By** dropdown → select "Price: Low to High" → cards reorder.
6. Switch to **"Best Rating"** → cards reorder by star rating.

---

## 2:30 — 3:30 | Feature 3 — Guest Cart

**Say**: "Guest cart works without an account, using a session ID."

1. Make sure you are **logged out** (Header shows "Sign In / Sign Up").
2. Click **"Add to Cart"** on AirPods Pro → snackbar: "AirPods Pro added to cart!"
3. Cart badge in header shows **1**.
4. Click the cart icon → CartPage shows the item.
5. "The cart is persisted in the browser session — no login required."

---

## 3:30 — 5:30 | Feature 1 + 4 — Sign Up, Login, Checkout, Invoice

**Say**: "Now we log in and complete a checkout."

1. Click **"Sign In"** → LoginPage.
2. Enter credentials: `customer@demo.com` / `demo1234` → click Sign In.
3. "After login, the guest cart is merged with the user cart automatically." → Cart still shows 1 item.
4. Navigate to cart → click **"Proceed to Checkout"**.
5. On PaymentMethodsPage → select **"Cash on Delivery"** (or add a card).
6. In "Delivery Address" field → type `123 Demo Street, Istanbul`.
7. Click **"Confirm Order"**.
8. **Invoice Dialog appears** → point out:
   - Order ID (e.g., #7)
   - Date/timestamp
   - Items table: AirPods Pro × 1 — $249.00
   - Subtotal / Tax / Shipping / Grand Total
   - Delivery address
   - Payment method
9. Wait ~2 seconds → **green banner**: "📧 Mock invoice email sent to customer@demo.com — confirmation logged on server"
10. Click **"Print / Save as PDF"** → browser print dialog opens → show that only the invoice content is visible, not the header/sidebar.
11. Close print dialog.
12. In a separate terminal, show the backend log line:
    ```
    📧 [DEMO-EMAIL] ORDER #7 | user_id=X | total=$249.00 | ts=2025-...
    ```
13. Click **"View My Orders"** → OrderTrackingPage.

---

## 5:30 — 6:30 | Feature 5 — Delivery Status

**Say**: "The sales manager can update the delivery status."

1. Open the second browser tab: `localhost:3001` → log in as `delivery@demo.com` / `demo1234`.
2. Click the user avatar → **"Delivery Dashboard"** in the menu.
3. The Delivery Dashboard shows all orders in a table.
4. Find Order #7 (just placed) → Status shows **"Processing"**.
5. Change the dropdown to **"In Transit"** → status chip updates to blue "In Transit".
6. Change to **"Delivered"** → status chip updates to green "Delivered".
7. Switch back to the customer tab → go to **Order Tracking** → refresh → status stepper shows **"Delivered"**.

---

## 6:30 — 8:00 | Feature 9 — Ratings & Comment Approval

**Say**: "Customers can rate products they have purchased. Comments are moderated."

1. Stay on customer tab → go to Home → find AirPods Pro → click **"Rate & Review"**.
2. RatingsModal opens:
   - "You have purchased this product" (because we just bought it).
   - Select 5 stars → type a comment: `"Excellent noise cancellation, very impressed!"`
   - Click **"Submit"**.
3. "The comment is now pending — not visible to the public yet."
4. Switch to the third tab: `localhost:3001/product-manager/comment-approval`.
5. If not logged in → log in as `manager@demo.com` / `demo1234` → navigate to `/product-manager` → click "Comment Approval".
6. The pending comment appears: *"Excellent noise cancellation, very impressed!"*
7. Click **"Approve"** → confirmation dialog → click **"Confirm"**.
8. Comment is removed from the pending list.
9. Go back to the home page → open AirPods Pro detail → the comment is now **publicly visible**.

---

## 8:00 — 9:00 | Stock Decrease Verification

**Say**: "Let me show that stock decreased after the purchase."

1. On the home page, search for **"Lenovo"** → *Lenovo ThinkPad X1* shows **"1 in stock"**.
2. As the customer, add it to cart → proceed to checkout → confirm order.
3. Go back to home → search "Lenovo" → "**0 in stock**" / "Out of stock" — Add to Cart is now disabled.
4. "Stock decremented atomically in the database."

---

## 9:00 — 9:30 | Unit Tests

**Say**: "We have a full test suite covering all demo scenarios."

1. In terminal: `source .venv/bin/activate && python -m pytest src/tests/unit_tests.py -v`
   - Show: **33 tests, all PASSED**
   - Tests cover: cart logic, stock validation, search/sort, comment approval, product model fields
2. In a second terminal: `cd src/frontend && npm test -- --watchAll=false`
   - Show: **18 tests, all PASSED**
   - Tests cover: token validation, cart add/remove/update, out-of-stock prevention

---

## 9:30 — 10:00 | Wrap-up

**Say**: "To summarise what we demonstrated:"

- Req 9: Product catalog with all 9 fields ✓
- Req 7: Search, sort, and category filter ✓
- Req 3: Guest cart, out-of-stock prevention, stock decrement ✓
- Req 1: Signup, login, cart merge ✓
- Req 4: Checkout, on-screen invoice, PDF print, mock email ✓
- Req 5: Delivery status flow end-to-end ✓
- Req 9 (reviews): Rating submission + comment approval ✓
- Tests: 51 unit tests passing ✓

"Any questions?"

---

## Fallback Notes

| If… | Do this |
|-----|---------|
| Backend not responding | Check `cargo run` is still running; check `.env` DATABASE_URL |
| Login fails | Verify demo users: `psql online_store < src/database/demo_users.sql` |
| Cart empty after login | Manually add item, then merge is not needed |
| Comment approval not showing | Ensure product_manager token is valid; check review `status = 'pending'` |
| Stock not decreasing | Check backend logs for transaction errors |
