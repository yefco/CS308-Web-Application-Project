# Demo Checklist — CS308 Online Store Progress Demo

Run through this checklist **before** the TA arrives. All items must be GREEN.

---

## 1. Environment Setup

- [ ] PostgreSQL is running: `psql -c "\l" | grep online_store`
- [ ] Database has correct schema (SERIAL PKs, not UUIDs):
  ```bash
  psql online_store -c "\d products" | grep product_id
  # Expected: product_id | integer | not null | nextval(...)
  ```
- [ ] 9 products are seeded:
  ```bash
  psql online_store -c "SELECT COUNT(*) FROM products;"
  # Expected: 9
  ```
- [ ] 3 demo users exist:
  ```bash
  psql online_store -c "SELECT email, role FROM users ORDER BY user_id;"
  # Expected rows: customer@demo.com (customer), manager@demo.com (product_manager), delivery@demo.com (sales_manager)
  ```
- [ ] Demo product stocks are correct:
  ```bash
  psql online_store -c "SELECT product_name, stock_quantity FROM products WHERE product_name IN ('Samsung Galaxy S24', 'Lenovo ThinkPad X1', 'AirPods Pro');"
  # Expected: Samsung Galaxy S24 = 0, Lenovo ThinkPad X1 = 1, AirPods Pro = 20
  ```

---

## 2. Backend

- [ ] `.env` file is present and `DATABASE_URL` points to `online_store`:
  ```bash
  cat .env | grep DATABASE_URL
  ```
- [ ] Backend starts without errors:
  ```bash
  cargo run
  # Last line: "Server listening on 0.0.0.0:3000"
  ```
- [ ] `GET /api/products` returns 9 products:
  ```bash
  curl -s http://localhost:3000/api/products | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d) if isinstance(d,list) else len(d.get('products',[])))"
  # Expected: 9
  ```
- [ ] Login works for demo customer:
  ```bash
  curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"customer@demo.com","password":"demo1234"}' | python3 -c "import json,sys; d=json.load(sys.stdin); print('OK' if 'token' in d else 'FAIL')"
  # Expected: OK
  ```

---

## 3. Frontend

- [ ] Frontend starts without errors:
  ```bash
  cd src/frontend && npm start
  # Browser opens on http://localhost:3001
  ```
- [ ] Home page loads and shows product cards
- [ ] Search box filters products in real-time
- [ ] Sort By dropdown works
- [ ] "Samsung Galaxy S24" → Add to Cart button is **disabled** (grey, not clickable)
- [ ] "Lenovo ThinkPad X1" shows "1 in stock"
- [ ] "AirPods Pro" shows "20 in stock"

---

## 4. Auth Flow

- [ ] Sign Up page accessible at `/signup`
- [ ] Login page accessible at `/login`
- [ ] Login as `customer@demo.com` / `demo1234` succeeds
- [ ] After login, user avatar appears in header
- [ ] Logout clears session and shows Sign In / Sign Up buttons

---

## 5. Cart Flow

- [ ] Guest (logged out) can add AirPods Pro to cart
- [ ] Cart count badge shows correct number
- [ ] Cart page shows item with correct price
- [ ] Quantity +/- controls work
- [ ] Remove item works
- [ ] After login, guest cart items are still present (merge)

---

## 6. Checkout & Invoice

- [ ] Payment Methods page accessible from cart checkout
- [ ] Delivery address field accepts input
- [ ] "Confirm Order" button creates order
- [ ] **Invoice dialog appears** with:
  - [ ] Order ID visible
  - [ ] Timestamp visible
  - [ ] Items table with product name, quantity, unit price, line total
  - [ ] Subtotal / Tax / Shipping / Grand Total
  - [ ] Delivery address
  - [ ] Payment method
- [ ] "Print / Save as PDF" button opens browser print dialog
- [ ] Print preview shows **only invoice content** (no header/navbar visible)
- [ ] After ~2 seconds, green banner appears: "📧 Mock invoice email sent to customer@demo.com"
- [ ] Backend log shows: `📧 [DEMO-EMAIL] ORDER #X | user_id=Y | total=$Z`

---

## 7. Order Tracking

- [ ] `/order-tracking` shows placed orders
- [ ] Order status shown with correct chip (Processing / In Transit / Delivered)
- [ ] Stepper reflects current status

---

## 8. Delivery Dashboard

- [ ] Login as `delivery@demo.com` / `demo1234`
- [ ] User menu shows "Delivery Dashboard"
- [ ] Dashboard at `/delivery` shows all orders in table
- [ ] Status dropdown changes order status
- [ ] After status change, customer's order tracking page reflects new status

---

## 9. Ratings & Comment Approval

- [ ] Customer can click "Rate & Review" on a purchased product
- [ ] RatingsModal shows "You have purchased this product"
- [ ] Star rating + comment submission works
- [ ] After submission, comment is **not** publicly visible (pending)
- [ ] Login as `manager@demo.com` → navigate to Product Manager → Comment Approval
- [ ] Pending comment appears with correct product name and comment text
- [ ] Approve action removes it from pending list
- [ ] Approved comment is now visible in product detail modal

---

## 10. Tests

- [ ] Python tests pass: `source .venv/bin/activate && python -m pytest src/tests/unit_tests.py -v` → **33 passed**
- [ ] Frontend tests pass: `cd src/frontend && npm test -- --watchAll=false` → **18 passed**

---

## Quick Reset (if demo goes wrong)

```bash
# Reset database to clean state
psql -c "DROP DATABASE IF EXISTS online_store;"
psql -c "CREATE DATABASE online_store;"
psql online_store < src/database/schema.sql
psql online_store < src/database/seed.sql
psql online_store < src/database/demo_users.sql
echo "Database reset complete. Restart: cargo run"
```

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Customer | customer@demo.com | demo1234 |
| Product Manager | manager@demo.com | demo1234 |
| Sales Manager | delivery@demo.com | demo1234 |
