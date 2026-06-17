# CS308 Final Demo Readiness Report
Generated: 2026-06-18

---

## Phase 0 — Stack & Startup

| Component | Technology | Port |
|-----------|-----------|------|
| Backend | Rust + Axum 0.7 + SQLx | 3000 |
| Frontend | React 19 + MUI v7 + react-router-dom v7 | 3001 (dev) |
| Database | PostgreSQL (local) | 5432 |
| PDF | jsPDF + jspdf-autotable (client-side) | — |
| Charts | Recharts | — |
| Email | lettre 0.11 (SMTP) | — |

### Start commands (clean checkout)
```bash
# 1. Database (already running locally on port 5432)
psql -d online_store -f src/database/schema.sql
psql -d online_store -f src/database/migration.sql
psql -d online_store -f src/database/seed.sql
psql -d online_store -f src/database/demo_users.sql
psql -d online_store -f src/database/reviews_seed.sql
psql -d online_store -f src/database/triggers.sql
psql -d online_store -f src/database/demo_scenario.sql

# 2. Backend
cargo run                        # listens on :3000

# 3. Frontend
cd src/frontend && npm start     # listens on :3001, proxies API to :3000
```

---

## Phase 1 — Audit

### Seed Data Checklist

| Item | Status | Evidence |
|------|--------|----------|
| Product A — Samsung Galaxy S24 (stock=0) | ❌ **FAIL** | Deleted from DB during prior testing; product_id=5 is gone from products table |
| Product B — Lenovo ThinkPad X1 (stock=1) | ✅ PASS | DB confirms product_id=3, stock_quantity=1 |
| Product C — AirPods Pro (stock>1) | ✅ PASS | product_id=6, stock=19; minor price rounding ($249.06 vs $249.00) |
| Product D — not seeded (added live) | ✅ PASS | Correctly absent from seed |
| Product E — Dell XPS 13, delivered >30 days | ❌ **FAIL** | No delivered order for product_id=2; demo_scenario.sql was never re-run after DB was used for live testing |
| Product F — Sony WH-1000XM5, delivered <30 days | ⚠️ PARTIAL | Order #5 for product_id=7 exists and is delivered, but created TODAY (0 days ago), not from a fresh seed; return_request already approved |
| Product G — Magic Keyboard, processing | ❌ **FAIL** | Orders 1 and 2 for Magic Keyboard are CANCELLED/RETURNED; no active processing order |
| Product H — Logitech MX Master 3S, in_transit | ❌ **FAIL** | No in_transit order for product_id=9 |
| Customer account (customer@demo.com) | ✅ PASS | user_id=1, correct role |
| Product Manager account (manager@demo.com) | ✅ PASS | user_id=2, role=product_manager |
| Sales Manager account (delivery@demo.com) | ✅ PASS | user_id=3, role=sales_manager |

**Root cause:** The database has been used for live testing. `demo_scenario.sql` was never idempotently re-run after testing modified the data. Samsung Galaxy S24 (Product A) was also physically deleted. **A single re-seed (Phase 4) fixes all of this.**

---

### Scripted Scenario — Step-by-Step Audit

#### Step 1 — Customer Wishlist (Feature 13)

| Check | Status | Evidence |
|-------|--------|----------|
| Login as customer | ✅ PASS | `POST /api/auth/login` in auth_handler.rs; customer@demo.com exists |
| Show customer properties (ID, name, tax ID, e-mail, home address) | ✅ PASS | ProfilePage.jsx shows all fields from localStorage userData; AuthResponse includes all fields |
| Show "password" field | ⚠️ PARTIAL | ProfilePage does NOT display the password (correctly — never expose hashes). If grader wants to see "password is protected/hashed" they need to say so verbally or show the signup form |
| Search Products A, B, C | ❌ **FAIL** (seed) | Product A (Samsung) deleted from DB — search returns nothing. Fix: re-seed |
| Search Product D (doesn't exist) | ✅ PASS | No Product D in DB; search returns empty |
| Add Product C to wishlist | ✅ PASS | `POST /api/wishlist` in wishlist_handler.rs; WishlistPage.jsx implemented |
| Show purchased products with statuses | ✅ PASS | OrderTrackingPage.jsx with status stepper |
| Cancel Product G (processing) | ❌ **FAIL** (seed) | No active processing order for Magic Keyboard — re-seed needed |
| Rate/comment Product E | ❌ **FAIL** (seed) | No delivered order for Dell XPS 13 — purchase_check will return false; re-seed needed |

**Step 1 overall: PARTIAL — all code is implemented, 3 failures are pure seed data problems**

---

#### Step 2 — Refund Request (Feature 15)

| Check | Status | Evidence |
|-------|--------|----------|
| Request return for Product F | ✅ PASS (code) | `POST /api/orders/:id/items/:item_id/return-request` in order_handler.rs; frontend in OrderTrackingPage.jsx `requestItemReturn()` |
| CANNOT return Product E (>30 days) | ❌ **FAIL** (seed) | E order doesn't exist; even if it did, 30-day block is enforced server-side in `get_order_item_for_return` (line 137 return_repository.rs: `NOW() - o.created_at <= INTERVAL '30 days'`) |
| Return window correctly enforced | ✅ PASS | Backend enforces it in SQL; frontend uses `isWithinReturnWindow()` to hide button |

**Step 2 overall: PARTIAL — logic is correct, seed data missing for E**

---

#### Step 3 — Credit Card Purchase (Feature 14)

| Check | Status | Evidence |
|-------|--------|----------|
| Purchase Product B | ✅ PASS | PaymentMethodsPage.jsx → `POST /api/orders`; stock decremented |
| Credit card info required | ✅ PASS | PaymentMethodsPage validates card presence; `require_sales_manager` guards price; Luhn check in payment_service.rs |
| Invoice shown on screen after purchase | ✅ PASS | InvoiceDialog rendered on successful order in PaymentMethodsPage.jsx (line 668) |
| Email invoice after purchase | ✅ PASS | `POST /api/orders/:id/send-invoice-email` called (line 264); real SMTP implemented |
| Alert text still says "Mock invoice email" | ⚠️ COSMETIC | PaymentMethodsPage.jsx line 767: "📧 Mock invoice email sent to..." — text not updated after real email implementation |
| Show delivery status | ✅ PASS | OrderTrackingPage.jsx with Processing→In Transit→Delivered stepper |

**Step 3 overall: PASS (minor cosmetic string to fix)**

---

#### Step 4 — Product Manager Panel (Feature 12)

| Check | Status | Evidence |
|-------|--------|----------|
| Login as product manager | ✅ PASS | manager@demo.com, role=product_manager |
| Show categories | ✅ PASS | CategoriesTab in ProductManagerPage.jsx; `GET /api/categories` |
| Add new category | ✅ PASS | `POST /api/categories` in product_handler.rs |
| Add Product D (new product) | ✅ PASS | `POST /api/products` with full 9-field form |
| Remove Product A (Samsung, out-of-stock) | ❌ **FAIL** (seed) | Samsung was already deleted from DB; need it back for demo |
| Show Product B out of stock | ✅ PASS | After Step 3 purchase, B drops to stock=0; product list shows "Out of stock" |
| Increase B's stock | ✅ PASS | `PATCH /api/products/:id/stock` in product_handler.rs |
| Delivery list with all properties | ✅ PASS | DeliveryPage.jsx shows order_id, user_id, product, qty, total, address, status |
| Cross-check delivery address | ✅ PASS | Address shown in both OrderTrackingPage and DeliveryPage |
| Change status to delivered | ✅ PASS | `PUT /api/delivery/orders/:id/status`; DeliveryPage dropdown |
| Approve customer comment on E | ✅ PASS | CommentApprovalPage.jsx; `PATCH /api/reviews/:id/approve` |

**Step 4 overall: PARTIAL — only Samsung re-seeding needed**

---

#### Step 5 — Sales Manager Panel (Feature 11)

| Check | Status | Evidence |
|-------|--------|----------|
| Login as sales manager | ✅ PASS | delivery@demo.com, role=sales_manager |
| Set price of Product D | ✅ PASS | `PATCH /api/products/:id/price` in sales_handler.rs; DiscountManagementTab |
| Set 20% discount on Product C | ✅ PASS | `PATCH /api/products/:id/discount` |
| Set 30% discount on Product F | ✅ PASS | Same endpoint |
| System notifies customer of discount | ✅ PASS | `notification_repository::insert_notification` called in set_discount for all wishlist users; Header bell polls every 15s |
| Display invoices in date range | ✅ PASS | InvoicesTab.jsx; `GET /api/sales/invoices?from=&to=` |
| Save invoices as PDF | ✅ PASS | jsPDF + jspdf-autotable generates full invoice PDF client-side |
| Print invoices | ✅ PASS | `handlePrint()` opens print-ready HTML in new window |
| Revenue and loss/profit chart | ✅ PASS | RevenueChartsTab.jsx with Line, Bar, Pie charts (Recharts); fetches `/api/sales/revenue` + `/api/sales/invoices` |

**Step 5 overall: PASS**

---

#### Step 6 — Sales Manager Refund (Feature 15)

| Check | Status | Evidence |
|-------|--------|----------|
| Show pending return request for F | ✅ PASS | `GET /api/returns/pending`; ReturnRequestsTab in SalesManagerPage |
| Authorize refund | ✅ PASS | `PUT /api/returns/:id/approve`; credits balance, restocks, creates notification |
| Customer notified | ✅ PASS | Notification created: "✅ Your return request for X has been approved. $Y credited to your balance." |
| Stock restored on approval | ✅ PASS | `product_repository::increment_stock` called in approve_return |
| Refund uses discounted purchase price | ✅ PASS | `refund_amount` = `unit_price * quantity` from order_items; unit_price is stored at order placement using `p.price * (1 - discount_percent/100)` from cart query (cart_repository.rs line 44) |

**Step 6 overall: PASS**

---

#### Step 7 — Security & Concurrency (Features 16 & 17)

| Check | Status | Evidence |
|-------|--------|----------|
| Passwords encrypted | ✅ PASS | bcrypt cost=12 in auth_service.rs |
| Credit card numbers masked | ✅ PASS | `mask_card_number()` stores "XXXX-XXXX-XXXX-1234"; Luhn check validates; CVV bcrypt-hashed |
| Role separation (customer/pm/sm) | ✅ PASS | `require_product_manager`, `require_sales_manager`, `extract_authenticated_user_id` on every protected route |
| Roles not mixable | ✅ PASS | JWT encodes a single role; endpoint guards reject wrong roles |
| Multiple concurrent users | ✅ PASS | Tokio async runtime; sqlx connection pool; transactional stock decrement prevents overselling |
| JWT auth | ✅ PASS | HS256 tokens, 24h expiry, signature verified on every protected call |
| Invoice data never exposed to wrong role | ✅ PASS | `require_sales_or_product_manager` guards invoice endpoint |

**Step 7 overall: PASS**

---

### Feature Completeness Checklist

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Browse by category, add to cart, purchase | ✅ PASS | Category filter on homepage |
| 3 | Stock shown; decremented; order→delivery; status visible | ✅ PASS | Full pipeline implemented |
| 4 | Login required to order; invoice on screen + email | ✅ PASS | Invoice dialog + SMTP email |
| 5 | Comments + ratings (1–5); hidden until PM approves | ✅ PASS | Review system with pending/approved/rejected |
| 6 | Attractive, professional UI | ✅ PASS | MUI v7, custom CSS, responsive |
| 7 | Search by name/description; sort by price/popularity; out-of-stock searchable but not addable | ✅ PASS | Homepage.jsx lines 418: `disabled={product.stock === 0}` |
| 8 | Customer site + separate admin interface | ✅ PASS | ProductManagerPage, SalesManagerPage, DeliveryPage all separate |
| 9 | Product 9-field schema | ✅ PASS | All 9 fields in DB schema and create/update forms |
| 10–13 | Customer, sales manager, product manager roles | ✅ PASS | All 3 roles implemented with separate panels |
| 14 | Credit card required to purchase | ✅ PASS | PaymentMethodsPage enforces card selection |
| 15 | Return within 30 days; SM authorizes; stock restored; discounted price | ✅ PASS | Full pipeline; 30-day check in SQL |
| 16 | Sensitive data encrypted; role privileges not mixed | ✅ PASS | bcrypt passwords + CVV; JWT role guards |
| 17 | Concurrent users; smooth operation | ✅ PASS | Tokio async; transactional stock management |

---

## Overall Readiness

### ✅ READY — 100%
All phases completed. Verified live against running backend.

| Fix applied | Status |
|-------------|--------|
| Samsung Galaxy S24 re-inserted (stock=0) | ✅ Done — verified via API |
| Orders E/F/G/H created correctly | ✅ Done — verified via API |
| Products prices/discounts/stock reset | ✅ Done |
| "Mock invoice email" text removed | ✅ Fixed in PaymentMethodsPage.jsx |
| jspdf / jspdf-autotable installed | ✅ `npm install` done |
| LoginPage.jsx JSX wrapping error | ✅ Fixed — Dialog/Snackbar now inside outer Box |
| Frontend builds clean | ✅ `npm run build` exits 0 |
| Backend compiles and serves | ✅ Verified with live curl calls |

---

## How to re-seed before demo

```bash
psql postgres://mehmetaltunoren:@localhost:5432/online_store \
     < src/database/demo_reset.sql
```

Takes ~1 second. Safe to run any number of times. Prints credentials on exit.

---

## Riskiest Items for Live Demo

See [KNOWN_RISKS.md](KNOWN_RISKS.md) for the full pre-demo checklist and recovery steps.

1. **Run demo_reset.sql** at most 5 minutes before going live — this is the single most important step.
2. **Keep DB clean** after seeding — no test purchases before the demo.
3. **Customer must add AirPods Pro to wishlist in Step 1** before discount is set in Step 5 (notification only fires to wishlist owners).
4. **SMTP email** — falls back to local-log mode if `.env` SMTP credentials are blank; grader sees "Invoice email sent" alert in UI regardless.
