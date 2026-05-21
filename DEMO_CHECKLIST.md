# CS308 Online Store — Demo Checklist (May 6 Mock Demo)

## How to Run the Project

### Prerequisites
- Rust + Cargo (stable)
- Node.js 18+ / npm
- PostgreSQL running locally

### 1. Database Setup

```bash
# Create the database
createdb online_store

# Apply the schema
psql online_store < src/database/schema.sql

# Load seed data (categories + products)
psql online_store < src/database/seed.sql

# Load demo users (customer, manager, sales_manager)
psql online_store < src/database/demo_users.sql

# Load demo reviews (enables meaningful popularity sort)
psql online_store < src/database/reviews_seed.sql
```

### 2. Create Demo Users

Start the backend first (step 3), then run these curl commands:

```bash
# Customer account
curl -s -X POST http://localhost:3000/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{"user_name":"Demo Customer","email":"customer@demo.com","password":"demo1234"}'

# Product-manager account (created as customer, then promoted)
curl -s -X POST http://localhost:3000/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{"user_name":"Product Manager","email":"manager@demo.com","password":"demo1234"}'

# Promote to product_manager role
psql online_store -c "UPDATE users SET role = 'product_manager' WHERE email = 'manager@demo.com';"
```

### 3. Run the Backend

```bash
# From the project root
cargo run
# Listens on http://localhost:3000
```

### 4. Run the Frontend

```bash
cd src/frontend
npm install      # first time only
npm start
# Opens http://localhost:3001  (proxies /api → localhost:3000)
```

---

## Demo Login Credentials

| Role             | Email                  | Password   |
|------------------|------------------------|------------|
| Customer         | customer@demo.com      | demo1234   |
| Product Manager  | manager@demo.com       | demo1234   |

> If you prefer, create accounts via the Sign Up page — they will always get the `customer` role. Use the SQL command above to promote one to `product_manager`.

---

## Requirements Coverage

| Req | Feature | Status |
|-----|---------|--------|
| 1   | Product browsing with categories | ✅ Complete |
| 1   | Add to cart (guest + logged-in) | ✅ Complete |
| 1   | Cart quantities & total price | ✅ Complete |
| 1   | Cart persists across navigation | ✅ Complete (backend-backed) |
| 3   | Stock quantity shown per product | ✅ Complete |
| 3   | Stock decrements on order placement | ✅ Complete (atomic transaction) |
| 3   | Out-of-stock → Add to Cart disabled | ✅ Complete |
| 3   | Order status: processing / in_transit / delivered | ✅ Complete |
| 3   | Order tracking page with stepper | ✅ Complete |
| 4   | Guest can browse without login | ✅ Complete |
| 4   | Guest can add to cart (session-based) | ✅ Complete |
| 4   | Login required before checkout | ✅ Complete |
| 4   | Mock payment flow (card / cash / card-on-delivery) | ✅ Complete |
| 4   | Invoice shown on screen after payment | ✅ Complete |
| 5   | Submit 1-5 star rating + comment | ✅ Complete |
| 5   | Must purchase before reviewing | ✅ Complete (backend-enforced) |
| 5   | Comments hidden until approved | ✅ Complete (status=pending default) |
| 5   | Product manager approves / rejects comments | ✅ Complete |
| 5   | Approved comments appear on product page | ✅ Complete |
| 7   | Search by name or description | ✅ Complete |
| 7   | Sort by price (low→high, high→low) | ✅ Complete |
| 7   | Sort by popularity (review count) | ✅ Complete |
| 7   | Out-of-stock products appear in search | ✅ Complete |
| 7   | Out-of-stock → Add to Cart disabled | ✅ Complete |
| 9   | Product has ID, name, model, serial number | ✅ In DB schema |
| 9   | Product has description, stock qty, price | ✅ In DB schema |
| 9   | Product has warranty status, distributor info | ✅ In DB schema |

---

## Main User Demo Flow

```
Browse products (no login needed)
  → Search by name / description
  → Filter by category
  → Sort by price or popularity
  → Click product card → product detail modal (reviews visible)
  → Add to Cart (disabled if out of stock)
→ Cart page (shows quantities, subtotal, tax, shipping)
  → "Sign In to Checkout" → Login page
  → [Login as customer@demo.com / demo1234]
  → Back to cart → "Proceed to Checkout"
→ Payment page
  → Enter a card (any test number, e.g. 4111 1111 1111 1111, 12/26, 123)
  → Enter delivery address
  → "Confirm Order"
→ Invoice dialog appears (order ID, items, totals, address, payment method)
  → "View My Orders"
→ Order Tracking page (shows processing status with stepper)
```

## Product Manager Demo Flow

```
Login as manager@demo.com / demo1234
→ Navigate to /product-manager
→ Products tab: create, edit, update stock, delete products
→ Categories tab: create, edit, delete categories
→ Comment Approval tab: approve or reject pending reviews
```

---

## Known Limitations

- **Invoice PDF/email**: Invoice is shown on-screen only; no PDF generation or email sending is implemented. `TODO: wire up PDF export / email if required for final demo.`
- **Order items in tracking page**: The My Orders list shows order summary (status, total, address) but not the line-item breakdown; the detail endpoint `/api/orders/:id` has the full item list.
- **Sales manager / delivery department**: The backend routes `/api/delivery/orders` (view all orders) and `/api/delivery/orders/:id/status` (update status) exist and work, but there is no dedicated frontend page for the `sales_manager` role. Status can be updated via direct API call for demo.
- **Password recovery**: Forgot Password button exists in the UI but is not wired.
- **Image CDN**: Product images use hardcoded CDN URLs by product name; any product whose name doesn't match the map shows "No Image".

---

## Running Tests

### Python unit tests (33 tests — no server required)
```bash
python3 src/tests/unit_tests.py
```

### JavaScript/React tests (18 tests — no server required)
```bash
cd src/frontend
npm test -- --watchAll=false
```

---

## Commit Count per Member

| Member            | Commits |
|-------------------|---------|
| Mehmet Altunören  | 13      |
| Defalt            | 10      |
| yefco             | 8       |
| unknown           | 8       |
| kaan sayin        | 7       |
| Başak             | 4       |
| Kaan sayın        | 3       |
| kaan-syn          | 1       |

> `unknown` and `kaan-syn`/`kaan sayin`/`Kaan sayın` are likely the same person with different git configs. Merge count is ~19 for that member.
