use sqlx::PgPool;

use crate::models::user::User;

pub async fn create_user(
    pool: &PgPool,
    user_name: &str,
    email: &str,
    password_hash: &str,
    tax_id: &str,
    home_address: &str,
) -> Result<User, sqlx::Error> {
    sqlx::query_as::<_, User>(
        r#"
        INSERT INTO users (user_name, email, password_hash, tax_id, home_address)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING user_id, user_name, email, password_hash, role,
                  tax_id, home_address, balance::FLOAT8 AS balance, created_at, updated_at
        "#,
    )
    .bind(user_name)
    .bind(email)
    .bind(password_hash)
    .bind(tax_id)
    .bind(home_address)
    .fetch_one(pool)
    .await
}

pub async fn find_by_email(pool: &PgPool, email: &str) -> Result<Option<User>, sqlx::Error> {
    sqlx::query_as::<_, User>(
        r#"
        SELECT user_id, user_name, email, password_hash, role,
               tax_id, home_address, balance::FLOAT8 AS balance, created_at, updated_at
        FROM users
        WHERE email = $1
        "#,
    )
    .bind(email)
    .fetch_optional(pool)
    .await
}

pub async fn find_by_id(pool: &PgPool, user_id: i32) -> Result<Option<User>, sqlx::Error> {
    sqlx::query_as::<_, User>(
        r#"
        SELECT user_id, user_name, email, password_hash, role,
               tax_id, home_address, balance::FLOAT8 AS balance, created_at, updated_at
        FROM users
        WHERE user_id = $1
        "#,
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await
}

/// Adds `amount` to the user's balance and returns the new balance.
pub async fn credit_balance(
    pool: &PgPool,
    user_id: i32,
    amount: f64,
) -> Result<f64, sqlx::Error> {
    let row: (f64,) = sqlx::query_as(
        r#"
        UPDATE users
        SET balance = balance + $2::NUMERIC, updated_at = NOW()
        WHERE user_id = $1
        RETURNING balance::FLOAT8
        "#,
    )
    .bind(user_id)
    .bind(amount)
    .fetch_one(pool)
    .await?;
    Ok(row.0)
}
