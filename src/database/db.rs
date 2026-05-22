//! # Database Connection
//!
//! Initializes and returns a PostgreSQL connection pool using SQLx.
//! The pool is created once at startup and shared across all
//! request handlers via Axum's `State` extractor.
//!
//! Connection limits and timeouts are configured here. Adjust
//! `max_connections` based on your deployment environment.

use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;

/// Creates a new PostgreSQL connection pool.
///
/// # Arguments
/// * `database_url` — A full PostgreSQL connection string,
///   e.g., `postgres://user:pass@localhost:5432/online_store`.
///
/// # Panics
/// Panics if the pool cannot be established. This is intentional
/// at startup — there is no point running the server without a
/// working database connection.
///
/// # Example
/// ```rust
/// let pool = init_pool("postgres://postgres:postgres@localhost:5432/online_store").await;
/// ```
pub async fn init_pool(database_url: &str) -> PgPool {
    let pool = PgPoolOptions::new()
        // Maximum number of concurrent connections.
        // Tune this based on your PostgreSQL `max_connections` setting
        // and the expected number of concurrent requests.
        .max_connections(10)
        // How long to wait for a connection from the pool before
        // returning an error. Prevents request stacking under load.
        .acquire_timeout(std::time::Duration::from_secs(5))
        .connect(database_url)
        .await
        .expect("Failed to connect to PostgreSQL. Is the database running?");

    ensure_schema_compatibility(&pool)
        .await
        .expect("Failed to apply startup schema compatibility checks");

    pool
}

async fn ensure_schema_compatibility(pool: &PgPool) -> Result<(), sqlx::Error> {
    sqlx::query("ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'cancelled'")
        .execute(pool)
        .await?;

    sqlx::query("ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'returned'")
        .execute(pool)
        .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS wishlist_items (
            wishlist_item_id SERIAL PRIMARY KEY,
            user_id INT NOT NULL,
            product_id INT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_wishlist_user
                FOREIGN KEY (user_id)
                REFERENCES users(user_id)
                ON DELETE CASCADE,
            CONSTRAINT fk_wishlist_product
                FOREIGN KEY (product_id)
                REFERENCES products(product_id)
                ON DELETE CASCADE,
            CONSTRAINT uq_wishlist_user_product
                UNIQUE (user_id, product_id)
        )
        "#,
    )
    .execute(pool)
    .await?;

    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_id ON wishlist_items (user_id)",
    )
    .execute(pool)
    .await?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id)")
        .execute(pool)
        .await?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders (user_id, status)")
        .execute(pool)
        .await?;

    Ok(())
}
