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
    PgPoolOptions::new()
        // Maximum number of concurrent connections.
        // Tune this based on your PostgreSQL `max_connections` setting
        // and the expected number of concurrent requests.
        .max_connections(10)
        // How long to wait for a connection from the pool before
        // returning an error. Prevents request stacking under load.
        .acquire_timeout(std::time::Duration::from_secs(5))
        .connect(database_url)
        .await
        .expect("Failed to connect to PostgreSQL. Is the database running?")
}