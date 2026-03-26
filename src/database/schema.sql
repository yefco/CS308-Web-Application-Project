-- ═══════════════════════════════════════════════════════════════
-- Online Store — Database Schema
-- ═══════════════════════════════════════════════════════════════
-- This migration creates all tables required by the CS 308
-- Online Store project. Run it once against a fresh database:
--
--   psql -U postgres -d online_store -f schema.sql
--
-- Tables are created in dependency order so that foreign keys
-- resolve correctly on first run.
-- ═══════════════════════════════════════════════════════════════


-- ── Extensions ───────────────────────────────────────────────
-- `uuid-ossp` provides uuid_generate_v4() for default IDs.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ─────────────────────────────────────────────────────────────
-- 1. USERS
-- ─────────────────────────────────────────────────────────────
-- Covers all three roles: customer, sales_manager, product_manager.
-- Sensitive fields (password_hash) are stored encrypted via bcrypt
-- at the application layer.
-- ─────────────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('customer', 'sales_manager', 'product_manager');

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255)    NOT NULL,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    password_hash   TEXT            NOT NULL,
    role            user_role       NOT NULL DEFAULT 'customer',
    tax_id          VARCHAR(50),
    home_address    TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Fast lookup for login queries.
CREATE INDEX idx_users_email ON users (email);


-- ─────────────────────────────────────────────────────────────
-- 2. CATEGORIES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE categories (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255)    NOT NULL UNIQUE,
    description     TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────
-- 3. PRODUCTS
-- ─────────────────────────────────────────────────────────────
-- Contains every field required by the spec: ID, name, model,
-- serial number, description, quantity in stock, price, warranty
-- status, and distributor information.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE products (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id         UUID            NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name                VARCHAR(255)    NOT NULL,
    model               VARCHAR(255),
    serial_number       VARCHAR(255)    UNIQUE,
    description         TEXT,
    quantity_in_stock   INT             NOT NULL DEFAULT 0 CHECK (quantity_in_stock >= 0),
    price               NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    discount_percent    NUMERIC(5, 2)  NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
    warranty_status     VARCHAR(100),
    distributor_info    TEXT,
    image_url           TEXT,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Full-text search index for product name and description (requirement 7).
CREATE INDEX idx_products_search ON products USING GIN (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))
);

CREATE INDEX idx_products_category ON products (category_id);


-- ─────────────────────────────────────────────────────────────
-- 4. SHOPPING CART
-- ─────────────────────────────────────────────────────────────
-- Users can add items without logging in (tracked by session),
-- but carts are associated with a user once they authenticate.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE shopping_carts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID            REFERENCES users(id) ON DELETE CASCADE,
    session_id      VARCHAR(255),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE cart_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id         UUID            NOT NULL REFERENCES shopping_carts(id) ON DELETE CASCADE,
    product_id      UUID            NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity        INT             NOT NULL DEFAULT 1 CHECK (quantity > 0),
    added_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- Prevent duplicate product entries in the same cart.
    UNIQUE (cart_id, product_id)
);


-- ─────────────────────────────────────────────────────────────
-- 5. ORDERS & ORDER ITEMS
-- ─────────────────────────────────────────────────────────────
-- Order status tracks the delivery lifecycle:
-- processing → in_transit → delivered (requirement 3).
-- ─────────────────────────────────────────────────────────────
CREATE TYPE order_status AS ENUM ('processing', 'in_transit', 'delivered', 'cancelled');

CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_price     NUMERIC(12, 2) NOT NULL CHECK (total_price >= 0),
    status          order_status    NOT NULL DEFAULT 'processing',
    delivery_address TEXT           NOT NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        UUID            NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id      UUID            NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity        INT             NOT NULL CHECK (quantity > 0),
    unit_price      NUMERIC(12, 2) NOT NULL,
    discount_applied NUMERIC(5, 2) NOT NULL DEFAULT 0
);

CREATE INDEX idx_orders_user ON orders (user_id);


-- ─────────────────────────────────────────────────────────────
-- 6. INVOICES
-- ─────────────────────────────────────────────────────────────
-- Generated after successful payment (requirement 4).
-- Stored as a record; PDF generation happens at app layer.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE invoices (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        UUID            NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    user_id         UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_amount    NUMERIC(12, 2) NOT NULL,
    pdf_url         TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_date ON invoices (created_at);
CREATE INDEX idx_invoices_user ON invoices (user_id);


-- ─────────────────────────────────────────────────────────────
-- 7. PAYMENTS
-- ─────────────────────────────────────────────────────────────
-- Mock banking entity (requirement 4 & 14).
-- Credit card info is encrypted at the application layer.
-- ─────────────────────────────────────────────────────────────
CREATE TYPE payment_status AS ENUM ('pending', 'confirmed', 'failed', 'refunded');

CREATE TABLE payments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id            UUID            NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id             UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount              NUMERIC(12, 2) NOT NULL,
    status              payment_status  NOT NULL DEFAULT 'pending',
    -- Card details stored encrypted; these are ciphertext, not plaintext.
    encrypted_card_info TEXT,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────
-- 8. COMMENTS & RATINGS
-- ─────────────────────────────────────────────────────────────
-- Comments require product manager approval before becoming
-- visible (requirement 5). Ratings are 1–10.
-- ─────────────────────────────────────────────────────────────
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE comments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID            NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id         UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content         TEXT            NOT NULL,
    approval        approval_status NOT NULL DEFAULT 'pending',
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE ratings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID            NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id         UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score           INT             NOT NULL CHECK (score >= 1 AND score <= 10),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- One rating per user per product.
    UNIQUE (product_id, user_id)
);

CREATE INDEX idx_ratings_product ON ratings (product_id);


-- ─────────────────────────────────────────────────────────────
-- 9. WISHLISTS
-- ─────────────────────────────────────────────────────────────
-- Users are notified when a wishlisted product gets a discount
-- (requirement 11). Notification is handled at app layer.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE wishlists (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id      UUID            NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    UNIQUE (user_id, product_id)
);


-- ─────────────────────────────────────────────────────────────
-- 10. DELIVERIES
-- ─────────────────────────────────────────────────────────────
-- Spec fields: delivery_id, customer_id, product_id, quantity,
-- total_price, delivery_address, is_completed (requirement 12).
-- ─────────────────────────────────────────────────────────────
CREATE TABLE deliveries (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id            UUID            NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    customer_id         UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id          UUID            NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity            INT             NOT NULL CHECK (quantity > 0),
    total_price         NUMERIC(12, 2) NOT NULL,
    delivery_address    TEXT            NOT NULL,
    is_completed        BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────
-- 11. REFUND REQUESTS
-- ─────────────────────────────────────────────────────────────
-- Customers can request refunds within 30 days of purchase.
-- Sales manager approves/rejects (requirement 15).
-- ─────────────────────────────────────────────────────────────
CREATE TYPE refund_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE refund_requests (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_item_id   UUID            NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    user_id         UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason          TEXT,
    status          refund_status   NOT NULL DEFAULT 'pending',
    refund_amount   NUMERIC(12, 2) NOT NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ
);


-- ─────────────────────────────────────────────────────────────
-- 12. NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────
-- Used to notify users about discount events on wishlisted
-- products and order status changes.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message         TEXT            NOT NULL,
    is_read         BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications (user_id, is_read);