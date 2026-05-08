# Sprint Backlog — CS308 Online Store

> Sprint duration: 2 weeks per sprint.  
> Story points: 1 (trivial) → 3 (small) → 5 (medium) → 8 (large) → 13 (extra-large).  
> Status: Done / In Progress / Blocked / To Do.

---

## Sprint 1 — Foundation & Product Catalog

**Goal**: Database schema, backend skeleton, product listing, and basic frontend routing.

| # | Task | Story | SP | Assignee | Status |
|---|------|-------|----|----------|--------|
| S1-01 | Define PostgreSQL schema for users, products, categories, orders, cart, reviews | PB-01 | 5 | Team | Done |
| S1-02 | Implement seed data with 4 categories and 9 demo products | PB-01 | 3 | Team | Done |
| S1-03 | Set up Axum project structure (handlers, services, repos, routes, models) | — | 5 | Team | Done |
| S1-04 | Implement `GET /api/products` endpoint with all 9 required fields | PB-01 | 3 | Team | Done |
| S1-05 | Implement `GET /api/categories` endpoint | PB-04 | 2 | Team | Done |
| S1-06 | Create React CRA project with MUI v7, routing, and proxy config | — | 3 | Team | Done |
| S1-07 | Build HomePage product grid with card layout (image, name, price, stock badge) | PB-01 | 5 | Team | Done |
| S1-08 | Add search by name/description | PB-02 | 3 | Team | Done |
| S1-09 | Add sort by price and category filter | PB-03, PB-04 | 3 | Team | Done |
| S1-10 | Fetch and display product ratings on product cards | PB-01 | 3 | Team | Done |

**Sprint 1 Total**: 35 SP

---

## Sprint 2 — Authentication & Cart

**Goal**: User registration/login, JWT auth, guest cart, logged-in cart, cart merge.

| # | Task | Story | SP | Assignee | Status |
|---|------|-------|----|----------|--------|
| S2-01 | Implement `POST /api/auth/register` with bcrypt password hashing | PB-06 | 5 | Team | Done |
| S2-02 | Implement `POST /api/auth/login` returning signed JWT | PB-07 | 5 | Team | Done |
| S2-03 | Build JWT middleware (`extract_authenticated_user_id`) | — | 3 | Team | Done |
| S2-04 | Build SignUpPage and LoginPage with form validation | PB-06, PB-07 | 5 | Team | Done |
| S2-05 | Implement guest cart via `X-Session-ID` header and `shopping_carts` table | PB-05 | 8 | Team | Done |
| S2-06 | Implement `POST /api/cart/merge` to transfer guest cart on login | PB-07 | 5 | Team | Done |
| S2-07 | Build CartContext (React Context) with addItem, removeItem, updateQty, clear | PB-08 | 5 | Team | Done |
| S2-08 | Build CartPage with item list, quantity controls, subtotal, and checkout CTA | PB-08 | 5 | Team | Done |
| S2-09 | Disable "Add to Cart" for out-of-stock products (frontend + backend guard) | PB-09 | 3 | Team | Done |
| S2-10 | Implement cart count badge in Header | — | 2 | Team | Done |
| S2-11 | Write cartUtils.js with addToCart, removeFromCart, getCartTotal, validateCart | PB-08 | 3 | Team | Done |
| S2-12 | Write Jest tests for cartUtils (18 test cases) | — | 3 | Team | Done |

**Sprint 2 Total**: 52 SP

---

## Sprint 3 — Checkout, Orders & Invoice

**Goal**: Full checkout flow, order placement, stock decrement, invoice dialog, PDF, mock email.

| # | Task | Story | SP | Assignee | Status |
|---|------|-------|----|----------|--------|
| S3-01 | Implement `POST /api/orders` with atomic stock decrement and cart clear | PB-10, PB-18 | 8 | Team | Done |
| S3-02 | Implement `GET /api/orders` returning full order with line items | PB-14 | 5 | Team | Done |
| S3-03 | Implement `GET /api/orders/:id` for single order detail | PB-11 | 3 | Team | Done |
| S3-04 | Build PaymentMethodsPage with card management (add/edit/delete) | PB-20 | 8 | Team | Done |
| S3-05 | Build invoice Dialog showing order ID, date, items table, totals, address | PB-11 | 5 | Team | Done |
| S3-06 | Add `Print / Save as PDF` button using `window.print()` | PB-12 | 2 | Team | Done |
| S3-07 | Add `@media print` CSS so only invoice content prints, not the whole app | PB-12 | 3 | Team | Done |
| S3-08 | Implement `POST /api/orders/:id/send-invoice-email` mock endpoint | PB-13 | 3 | Team | Done |
| S3-09 | Show visible email confirmation banner in invoice dialog after mock email | PB-13 | 2 | Team | Done |
| S3-10 | Build OrderTrackingPage with stepper and status chips | PB-14 | 5 | Team | Done |
| S3-11 | Write Python unit tests for cart logic, stock logic, search/sort (33 tests) | — | 5 | Team | Done |

**Sprint 3 Total**: 49 SP

---

## Sprint 4 — Delivery, Reviews & Comment Approval

**Goal**: Sales manager delivery dashboard, customer review submission, product manager approval.

| # | Task | Story | SP | Assignee | Status |
|---|------|-------|----|----------|--------|
| S4-01 | Implement `GET /api/delivery/orders` (all orders, sales manager only) | PB-17 | 3 | Team | Done |
| S4-02 | Implement `PUT /api/delivery/orders/:id/status` with enum validation | PB-17 | 3 | Team | Done |
| S4-03 | Build DeliveryPage dashboard with order table and status dropdown | PB-17 | 5 | Team | Done |
| S4-04 | Add "Delivery Dashboard" to Header user menu for sales_manager role | PB-17 | 2 | Team | Done |
| S4-05 | Implement `POST /api/products/ratings` (authenticated, purchase-gated) | PB-15 | 5 | Team | Done |
| S4-06 | Implement `GET /api/products/:id/ratings` (public, returns aggregate) | PB-01 | 3 | Team | Done |
| S4-07 | Implement `GET /api/products/:id/purchase-check` | PB-15 | 2 | Team | Done |
| S4-08 | Build RatingsModal with star rating input and comment textarea | PB-15 | 5 | Team | Done |
| S4-09 | Implement `GET /api/reviews/pending` (product manager only) | PB-16 | 3 | Team | Done |
| S4-10 | Implement `PATCH /api/reviews/:id/approve` and `PATCH /api/reviews/:id/reject` | PB-16 | 3 | Team | Done |
| S4-11 | Build CommentApprovalPage with approve/reject buttons and confirmation dialog | PB-16 | 5 | Team | Done |
| S4-12 | Add "Comment Approval" to ProductManagerPage navigation | PB-16 | 2 | Team | Done |
| S4-13 | Build ProductDetailModal showing product info and approved reviews | PB-21 | 5 | Team | Done |
| S4-14 | Display approved comment text in public product detail view | PB-21 | 3 | Team | Done |
| S4-15 | Write Python unit tests for comment approval logic (5 test cases) | — | 3 | Team | Done |

**Sprint 4 Total**: 52 SP

---

**Grand Total**: 188 SP across 4 sprints, 48 sprint tasks
