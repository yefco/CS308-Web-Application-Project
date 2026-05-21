# Bug Reports — CS308 Online Store Progress Demo

> **Format**: Each bug follows the template: ID, Title, Severity, Status, Description, Root Cause, Fix Applied.
> These are real bugs discovered and fixed during development of this iteration.

---

## BUG-001 — Database Schema Mismatch (UUID vs SERIAL PKs)

**Severity**: Critical  
**Status**: Fixed  
**Component**: Backend / Database  

**Description**  
The running PostgreSQL database (`online_store`) had a UUID-based schema with tables using `id uuid PRIMARY KEY`, `quantity_in_stock integer`, and separate `ratings` and `comments` tables. This was completely incompatible with the Rust backend which expected `product_id SERIAL PRIMARY KEY`, `stock_quantity`, and a unified `product_reviews` table. Product listing returned empty arrays and all cart operations failed with column-not-found errors.

**Root Cause**  
An older schema version was applied to the database manually at some point. The `schema.sql` in the repository had since been rewritten to use SERIAL integer PKs to match the SQLx model derives, but the database was never reset.

**Fix**  
Dropped and recreated the database, then applied `schema.sql`, `seed.sql`, and `demo_users.sql` in order. Added explicit setup instructions to `README.md`.

```bash
dropdb online_store
createdb online_store
psql online_store < src/database/schema.sql
psql online_store < src/database/seed.sql
psql online_store < src/database/demo_users.sql
```

---

## BUG-002 — Order List Endpoint Missing Line Items

**Severity**: High  
**Status**: Fixed  
**Component**: Backend / Order Service  

**Description**  
`GET /api/orders` returned `OrderSummaryResponse` objects that contained only `order_id`, `status`, `total_amount`, and `delivery_address`. The Order Tracking page in the frontend tried to render `order.items` to show purchased products, which was always `undefined`, causing a blank items section and a React render error.

**Root Cause**  
`list_orders` in `order_service.rs` mapped orders to `OrderSummaryResponse` (a stripped-down struct without items) instead of the full `OrderResponse`. This was a copy-paste from an early stub that was never upgraded.

**Fix**  
Rewrote `list_orders` and `list_all_orders` in `order_service.rs` to perform a per-order item fetch and return full `OrderResponse` objects. Also updated `OrdersResponse` to wrap `Vec<OrderResponse>`.

---

## BUG-003 — Add to Cart Not Disabled for Out-of-Stock Products

**Severity**: High  
**Status**: Fixed  
**Component**: Frontend / HomePage  

**Description**  
The "Add to Cart" button on product cards was not reliably disabled for products with `stock_quantity = 0`. A user could click it and add an out-of-stock item to the cart. The backend would reject the order at checkout, but the UX was misleading and non-compliant with Requirement 3.

**Root Cause**  
The `disabled` prop was set to `product.stock === 0`, but some products loaded from the API had `stock` as a string `"0"` rather than number `0` due to JSON parsing, so the strict equality check failed.

**Fix**  
Changed the disabled check to `product.stock <= 0` (numeric comparison) to handle both string coercion and true zero.

---

## BUG-004 — Product Card Layout Misalignment

**Severity**: Medium  
**Status**: Fixed  
**Component**: Frontend / HomePage  

**Description**  
Product cards in the grid were vertically misaligned. Rating stars, price, and stock status appeared at different vertical positions across cards in the same row when product descriptions had different lengths. Cards with one-line descriptions showed the rating 1.3rem higher than cards with two-line descriptions.

**Root Cause**  
The description `Typography` used `-webkit-line-clamp: 2` to clip long text, but had no `minHeight`. Short descriptions collapsed the element height below 2 lines, pushing everything below it up.

**Fix**  
Added `minHeight: '2.6rem'` to the description typography `sx` prop. This anchors the layout at a consistent 2-line height regardless of actual content length.

---

## BUG-005 — Invoice Email Endpoint Leaked Internal User ID in Log

**Severity**: Low  
**Status**: Fixed  
**Component**: Backend / Order Handler  

**Description**  
The `send_invoice_email` handler decoded the JWT twice: once via `extract_authenticated_user_id` (which returns `i32`) and a second time via `decode_jwt` to retrieve `claims.sub` (which is the numeric user ID string). The log message labelled this as `user_id=` which was accurate but the field was named `user_email` in the source variable, causing a confusing mismatch for anyone reading the code.

**Root Cause**  
Copy-paste from an earlier version that used email as the JWT subject. When the JWT was changed to use `user_id` as `sub`, the variable name was not updated.

**Fix**  
Removed the redundant second JWT decode. The handler now uses the `user_id` from `extract_authenticated_user_id`, includes it in the log as `user_id=`, and adds a `sent_at` RFC3339 timestamp to the response JSON for demo traceability.

---

*Total bugs reported: 5 | Fixed: 5 | Open: 0*
