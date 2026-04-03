use sqlx::PgPool;

use crate::models::payment::PaymentMethod;

pub async fn list_for_user(pool: &PgPool, user_id: i32) -> Result<Vec<PaymentMethod>, sqlx::Error> {
    sqlx::query_as::<_, PaymentMethod>(
        r#"
        SELECT payment_id, card_holder_name, card_number, expire_month,
               expire_year, created_at
        FROM payment_info
        WHERE user_id = $1
        ORDER BY created_at DESC, payment_id DESC
        "#,
    )
    .bind(user_id)
    .fetch_all(pool)
    .await
}

pub async fn find_for_user(
    pool: &PgPool,
    user_id: i32,
    payment_id: i32,
) -> Result<Option<PaymentMethod>, sqlx::Error> {
    sqlx::query_as::<_, PaymentMethod>(
        r#"
        SELECT payment_id, card_holder_name, card_number, expire_month,
               expire_year, created_at
        FROM payment_info
        WHERE user_id = $1 AND payment_id = $2
        "#,
    )
    .bind(user_id)
    .bind(payment_id)
    .fetch_optional(pool)
    .await
}

pub async fn create_payment_method(
    pool: &PgPool,
    user_id: i32,
    card_holder_name: &str,
    card_number: &str,
    expire_month: i32,
    expire_year: i32,
    cvv_hash: &str,
) -> Result<PaymentMethod, sqlx::Error> {
    sqlx::query_as::<_, PaymentMethod>(
        r#"
        INSERT INTO payment_info (
            user_id, card_holder_name, card_number, expire_month, expire_year, cvv
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING payment_id, card_holder_name, card_number, expire_month,
                  expire_year, created_at
        "#,
    )
    .bind(user_id)
    .bind(card_holder_name)
    .bind(card_number)
    .bind(expire_month)
    .bind(expire_year)
    .bind(cvv_hash)
    .fetch_one(pool)
    .await
}

pub async fn update_payment_method(
    pool: &PgPool,
    user_id: i32,
    payment_id: i32,
    card_holder_name: &str,
    card_number: &str,
    expire_month: i32,
    expire_year: i32,
    cvv_hash: &str,
) -> Result<Option<PaymentMethod>, sqlx::Error> {
    sqlx::query_as::<_, PaymentMethod>(
        r#"
        UPDATE payment_info
        SET card_holder_name = $3,
            card_number = $4,
            expire_month = $5,
            expire_year = $6,
            cvv = $7
        WHERE user_id = $1 AND payment_id = $2
        RETURNING payment_id, card_holder_name, card_number, expire_month,
                  expire_year, created_at
        "#,
    )
    .bind(user_id)
    .bind(payment_id)
    .bind(card_holder_name)
    .bind(card_number)
    .bind(expire_month)
    .bind(expire_year)
    .bind(cvv_hash)
    .fetch_optional(pool)
    .await
}

pub async fn delete_payment_method(
    pool: &PgPool,
    user_id: i32,
    payment_id: i32,
) -> Result<bool, sqlx::Error> {
    sqlx::query(
        r#"
        DELETE FROM payment_info
        WHERE user_id = $1 AND payment_id = $2
        "#,
    )
    .bind(user_id)
    .bind(payment_id)
    .execute(pool)
    .await
    .map(|result| result.rows_affected() > 0)
}
