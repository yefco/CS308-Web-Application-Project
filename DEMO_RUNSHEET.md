# CS308 Demo Runsheet
> Click-by-click script for the 15-minute live demo.

---

## 10 minutes before — Startup Checklist

```bash
# 1. Kill anything on port 3000
lsof -ti :3000 | xargs kill -9 2>/dev/null

# 2. Reset the database to clean demo state
psql postgres://mehmetaltunoren:@localhost:5432/online_store \
     < src/database/demo_reset.sql

# 3. Start backend  (leave this terminal open)
cargo run

# 4. Start frontend  (new terminal)
cd src/frontend && npm start
# Opens http://localhost:3001  (or browser auto-opens)
```

Confirm before starting:
- [ ] http://localhost:3001 loads the store homepage
- [ ] Samsung Galaxy S24 shows "Out of stock" — Add to Cart is greyed out
- [ ] Lenovo ThinkPad X1 shows "1 in stock"

---

## Demo Accounts (password for all: **demo1234**)

| Role | Email | Notes |
|------|-------|-------|
| Customer | `customer@demo.com` | Has pre-seeded orders E–H |
| Product Manager | `manager@demo.com` | |
| Sales Manager | `delivery@demo.com` | Also controls delivery status |

---

## Product Reference

| Demo letter | Name | product_id | Stock | Notes |
|-------------|------|-----------|-------|-------|
| A | Samsung Galaxy S24 | 5 | 0 | Out of stock |
| B | Lenovo ThinkPad X1 | 3 | 1 | Buy in Step 3 |
| C | AirPods Pro | 6 | 20 | Wishlist in Step 1 |
| D | *(added live)* | — | — | Product manager adds in Step 4 |
| E | Dell XPS 13 | 2 | 5 | Delivered 46 days ago — no return |
| F | Sony WH-1000XM5 | 7 | 7 | Delivered 14 days ago — return in Step 2 |
| G | Magic Keyboard | 8 | 15 | Processing — cancel in Step 1 |
| H | Logitech MX Master 3S | 9 | 18 | In Transit |

---

## Step 1 — Customer Wishlist (Feature 13)

**Log in** → `customer@demo.com` / `demo1234`

1. Click **My Profile** → show: User ID, Name, Tax ID (TC-12345678901), Email, Home Address
2. Homepage: search **"Samsung"** → Samsung Galaxy S24 appears, Add to Cart **disabled**
3. Search **"Lenovo"** → Lenovo ThinkPad X1, stock = 1
4. Search **"AirPods"** → AirPods Pro, stock = 20
5. Search **"Product D"** (or any string not in catalog) → no results
6. Click ❤️ on **AirPods Pro** → added to wishlist
7. Click **My Orders** → show all 4 orders:
   - Dell XPS 13 — Delivered (no return button — outside 30 days)
   - Sony WH-1000XM5 — Delivered (return button visible)
   - **Magic Keyboard — Processing** → click **Cancel Order** → confirm → status changes to Cancelled
   - Logitech MX Master 3S — In Transit
8. On **Dell XPS 13** order → click **Rate this product** → enter rating (1–5) + comment → submit
   - Status will show "Pending approval" until product manager approves

---

## Step 2 — Refund Request (Feature 15)

Still logged in as customer.

1. In **My Orders**, find **Sony WH-1000XM5** (Delivered, 14 days ago)
2. Click **Request Return** on the Sony item → confirm
3. Show the **Dell XPS 13** order — no Return option (>30 days)
4. *(Optional)* point out the grayed/missing return button on E vs. the visible one on F

---

## Step 3 — Credit Card Purchase (Feature 14)

Still as customer.

1. Homepage → find **Lenovo ThinkPad X1** (stock = 1) → **Add to Cart**
2. Cart page → click **Checkout**
3. Payment page:
   - Add new card: any name, `4532015112830366`, `12/28`, `123`
   - Enter delivery address: `456 Test Avenue, Istanbul, TR`
   - Click **Confirm Purchase**
4. Invoice dialog appears on screen — show order ID, items, total, address
5. Email alert appears under invoice ("Invoice email sent to customer@demo.com")
6. Close dialog → **My Orders** → Lenovo ThinkPad X1 shows **Processing**
7. Show delivery address matches — note it for Step 4 cross-check

---

## Step 4 — Product Manager Panel (Feature 12)

**Log out** → **Log in** as `manager@demo.com` / `demo1234`

1. Go to **Product Manager** (header link or `/product-manager`)
2. **Categories tab** → list visible → click **Add Category** → name e.g. "Gaming" → save
3. **Products tab** → click **Add Product**:
   - Name: `UltraBook Pro D`, Category: Gaming (just created), Model: `UBD-2026`, Serial: `SN-UBD-001`, Price: `1200`, Stock: `5`, fill remaining fields → Save
   - Product D now appears in the list
4. Find **Samsung Galaxy S24** → click **Delete** → confirm → Product A gone
5. Find **Lenovo ThinkPad X1** — show stock = 0 (after Step 3 purchase) → click **Update Stock** → set to `5` → save
6. **Delivery tab** → all orders listed with: Order ID, Customer ID, Products, Qty, Total Price, Address, Status
7. Find the Lenovo order from Step 3 → highlight the delivery address (matches what customer entered) → change status to **Delivered**
8. **Comment Approval tab** → find Dell XPS 13 review from Step 1 → click **Approve**

---

## Step 5 — Sales Manager Panel (Feature 11)

**Log out** → **Log in** as `delivery@demo.com` / `demo1234`

1. Go to **Sales Manager** (header link or `/sales-manager`)
2. **Discount Management tab**:
   - Find **UltraBook Pro D** (Product D) → click **Set Price** → enter `999` → save
   - Find **AirPods Pro** (C) → click **Set Discount** → enter `20` → save
   - Find **Sony WH-1000XM5** (F) → click **Set Discount** → enter `30` → save
3. *(Switch to customer tab or show notification bell)* — Customer has unread notification for AirPods Pro discount (20% off — $199.20)
4. **Invoices tab**:
   - Set date range from a week ago to today → **Load Invoices** → 4+ invoices appear
   - Click **Save as PDF** → PDF downloads with all invoice data
   - Click **Print** → browser print dialog opens
5. **Analytics & Charts tab**:
   - Update date range → click **Update Charts**
   - Show: Daily Revenue vs Refunds line chart, Profit/Loss bar chart, Period Summary, Status Distribution pie

---

## Step 6 — Sales Manager Refund (Feature 15)

Still as Sales Manager.

1. **Return Requests tab** → Sony WH-1000XM5 return request from Step 2 appears
2. Show: product name, refund amount ($349.00 — the price they paid)
3. Click **Approve** → confirm
4. *(Switch to customer tab or show notification bell)* — Customer gets "✅ Your return request for Sony WH-1000XM5 has been approved. $349.00 credited to your account balance"
5. **Discount Management tab** → Sony stock increased by 1 (back to 8)
6. *(Optional)* log in as customer → My Profile → Account Balance = $349.00

---

## Step 7 — Security & Concurrency (Features 16 & 17)

Talking points — no specific clicks needed:

| Topic | Evidence to show |
|-------|-----------------|
| Passwords encrypted | Mention bcrypt cost=12; no plaintext anywhere in DB or API responses |
| Credit card masked | Payment list shows "****1234" format; CVV is bcrypt-hashed |
| Role separation | Show trying to access `/api/products` DELETE as customer → 401; trying `/api/sales/revenue` without SM token → 401 |
| Concurrent safety | Explain: stock decremented in a DB transaction; two simultaneous orders for the last unit of B would only let one succeed |
| JWT tokens | Short-lived (24h), encoded with HS256 |

---

## URLs Quick Reference

| Page | URL |
|------|-----|
| Store home | http://localhost:3001/ |
| Login | http://localhost:3001/login |
| Cart | http://localhost:3001/cart |
| Checkout/Payment | http://localhost:3001/payment-methods |
| My Orders | http://localhost:3001/order-tracking |
| My Profile | http://localhost:3001/profile |
| Wishlist | http://localhost:3001/wishlist |
| Product Manager | http://localhost:3001/product-manager |
| Comment Approval | http://localhost:3001/product-manager/comment-approval |
| Sales Manager | http://localhost:3001/sales-manager |
| Delivery | http://localhost:3001/delivery |
