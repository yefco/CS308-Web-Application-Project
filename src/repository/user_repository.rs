//! # User Repository
//!
//! Encapsulates all SQL queries related to the `users` table.
//! This is the only layer that talks directly to the database —
//! services call these functions instead of writing raw SQL.
//!
//! Every function takes a `&PgPool` reference so that the pool
//! lifetime is managed by the caller (main.rs / AppState).

use sqlx::PgPool;

use crate::models::user::User;

/// Inserts a new user row and returns the complete `User`.
///
/// The caller is responsible for hashing the password before
/// passing it here — this layer stores whatever it receives.
///
/// # Errors
/// Returns `sqlx::Error` if the email already exists (unique
/// constraint violation) or if the connection fails.
pub async fn create_user(
    pool: &PgPool,
    user_name: &str,
    email: &str,
    password_hash: &str,
) -> Result<User, sqlx::Error> {
    sqlx::query_as::<_, User>(
        r#"
        INSERT INTO users (user_name, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING user_id, user_name, email, password_hash, role,
                  tax_id, home_address, created_at, updated_at
        "#,
    )
    .bind(user_name)
    .bind(email)
    .bind(password_hash)
    .fetch_one(pool)
    .await
}

/// Looks up a user by email address.
///
/// Returns `None` if no user with that email exists.
/// Used during login to verify credentials.
pub async fn find_by_email(
    pool: &PgPool,
    email: &str,
) -> Result<Option<User>, sqlx::Error> {
    sqlx::query_as::<_, User>(
        r#"
        SELECT user_id, user_name, email, password_hash, role,
               tax_id, home_address, created_at, updated_at
        FROM users
        WHERE email = $1
        "#,
    )
    .bind(email)
    .fetch_optional(pool)
    .await
}

/// Looks up a user by their UUID primary key.
///
/// Used to resolve the user from a JWT token's `sub` claim
/// during authenticated requests.
pub async fn find_by_id(
    pool: &PgPool,
    user_id: i32,
) -> Result<Option<User>, sqlx::Error> {
    sqlx::query_as::<_, User>(
        r#"
        SELECT user_id, user_name, email, password_hash, role,
               tax_id, home_address, created_at, updated_at
        FROM users
        WHERE user_id = $1
        "#,
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await
}