use sqlx::PgPool;

use crate::models::notification::Notification;

pub async fn insert_notification(
    pool: &PgPool,
    user_id: i32,
    product_id: Option<i32>,
    message: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO notifications (user_id, product_id, message) VALUES ($1, $2, $3)",
    )
    .bind(user_id)
    .bind(product_id)
    .bind(message)
    .execute(pool)
    .await
    .map(|_| ())
}

pub async fn list_for_user(
    pool: &PgPool,
    user_id: i32,
) -> Result<Vec<Notification>, sqlx::Error> {
    sqlx::query_as::<_, Notification>(
        r#"
        SELECT notification_id, user_id, product_id, message, is_read, created_at
        FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 50
        "#,
    )
    .bind(user_id)
    .fetch_all(pool)
    .await
}

pub async fn unread_count(pool: &PgPool, user_id: i32) -> Result<i64, sqlx::Error> {
    sqlx::query_scalar(
        "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE",
    )
    .bind(user_id)
    .fetch_one(pool)
    .await
}

pub async fn mark_all_read(pool: &PgPool, user_id: i32) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE")
        .bind(user_id)
        .execute(pool)
        .await
        .map(|_| ())
}
