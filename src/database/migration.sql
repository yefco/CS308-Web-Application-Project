-- ============================================================
-- CS308 Final Demo Migration
-- Run AFTER the original schema + seed:
--   psql online_store < src/database/migration.sql
-- ============================================================

-- ── Discount support on products ─────────────────────────────
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0
        CHECK (discount_percent >= 0 AND discount_percent <= 100);

-- ── Selective item return requests ───────────────────────────
CREATE TABLE IF NOT EXISTS return_requests (
    request_id      SERIAL PRIMARY KEY,
    order_id        INT NOT NULL,
    order_item_id   INT NOT NULL,
    user_id         INT NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'rejected')),
    refund_amount   NUMERIC(10,2) NOT NULL CHECK (refund_amount >= 0),
    requested_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    resolved_at     TIMESTAMPTZ,

    CONSTRAINT fk_rr_order      FOREIGN KEY (order_id)      REFERENCES orders(order_id)      ON DELETE CASCADE,
    CONSTRAINT fk_rr_order_item FOREIGN KEY (order_item_id) REFERENCES order_items(order_item_id) ON DELETE CASCADE,
    CONSTRAINT fk_rr_user       FOREIGN KEY (user_id)       REFERENCES users(user_id)         ON DELETE CASCADE,
    CONSTRAINT uq_rr_item       UNIQUE (order_item_id)
);

-- ── Discount notifications for wishlist owners ────────────────
CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id         INT NOT NULL,
    product_id      INT,
    message         TEXT NOT NULL,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notif_user    FOREIGN KEY (user_id)    REFERENCES users(user_id)    ON DELETE CASCADE,
    CONSTRAINT fk_notif_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
    ON notifications (user_id, is_read)
    WHERE is_read = FALSE;
