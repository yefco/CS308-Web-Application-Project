use crate::models::cart::CartItemRow;
use sqlx::{PgPool, Postgres, Transaction};

pub async fn get_or_create_user_cart(pool: &PgPool, user_id: i32) -> Result<i32, sqlx::Error> {
    sqlx::query_scalar(
        "INSERT INTO shopping_carts (user_id) VALUES ($1)
         ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
         RETURNING cart_id",
    )
    .bind(user_id)
    .fetch_one(pool)
    .await
}

pub async fn get_or_create_user_cart_in_tx(
    tx: &mut Transaction<'_, Postgres>,
    user_id: i32,
) -> Result<i32, sqlx::Error> {
    sqlx::query_scalar(
        "INSERT INTO shopping_carts (user_id) VALUES ($1)
         ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
         RETURNING cart_id",
    )
    .bind(user_id)
    .fetch_one(&mut **tx)
    .await
}

pub async fn get_or_create_guest_cart(pool: &PgPool, session_id: &str) -> Result<i32, sqlx::Error> {
    sqlx::query_scalar(
        "INSERT INTO shopping_carts (session_id) VALUES ($1)
         ON CONFLICT (session_id) DO UPDATE SET updated_at = NOW()
         RETURNING cart_id",
    )
    .bind(session_id)
    .fetch_one(pool)
    .await
}

pub async fn get_cart_items(pool: &PgPool, cart_id: i32) -> Result<Vec<CartItemRow>, sqlx::Error> {
    sqlx::query_as(
        r#"SELECT ci.cart_item_id, ci.cart_id, ci.product_id, ci.quantity, ci.added_at,
                p.product_name,
                (p.price * (1.0 - p.discount_percent / 100.0))::FLOAT8 AS price
         FROM cart_items ci
         JOIN products p ON p.product_id = ci.product_id
         WHERE ci.cart_id = $1"#,
    )
    .bind(cart_id)
    .fetch_all(pool)
    .await
}

pub async fn get_cart_items_in_tx(
    tx: &mut Transaction<'_, Postgres>,
    cart_id: i32,
) -> Result<Vec<CartItemRow>, sqlx::Error> {
    sqlx::query_as(
        r#"SELECT ci.cart_item_id, ci.cart_id, ci.product_id, ci.quantity, ci.added_at,
                p.product_name,
                (p.price * (1.0 - p.discount_percent / 100.0))::FLOAT8 AS price
         FROM cart_items ci
         JOIN products p ON p.product_id = ci.product_id
         WHERE ci.cart_id = $1"#,
    )
    .bind(cart_id)
    .fetch_all(&mut **tx)
    .await
}

pub async fn upsert_item(
    pool: &PgPool,
    cart_id: i32,
    product_id: i32,
    quantity: i32,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3)
         ON CONFLICT (cart_id, product_id)
         DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity",
    )
    .bind(cart_id)
    .bind(product_id)
    .bind(quantity)
    .execute(pool)
    .await
    .map(|_| ())
}

pub async fn set_quantity(
    pool: &PgPool,
    cart_id: i32,
    product_id: i32,
    quantity: i32,
) -> Result<bool, sqlx::Error> {
    sqlx::query("UPDATE cart_items SET quantity = $3 WHERE cart_id = $1 AND product_id = $2")
        .bind(cart_id)
        .bind(product_id)
        .bind(quantity)
        .execute(pool)
        .await
        .map(|r| r.rows_affected() > 0)
}

pub async fn remove_item(pool: &PgPool, cart_id: i32, product_id: i32) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2")
        .bind(cart_id)
        .bind(product_id)
        .execute(pool)
        .await
        .map(|_| ())
}

pub async fn clear_cart(pool: &PgPool, cart_id: i32) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM cart_items WHERE cart_id = $1")
        .bind(cart_id)
        .execute(pool)
        .await
        .map(|_| ())
}

pub async fn clear_cart_in_tx(
    tx: &mut Transaction<'_, Postgres>,
    cart_id: i32,
) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM cart_items WHERE cart_id = $1")
        .bind(cart_id)
        .execute(&mut **tx)
        .await
        .map(|_| ())
}

pub async fn merge_guest_into_user(
    pool: &PgPool,
    session_id: &str,
    user_id: i32,
) -> Result<(), sqlx::Error> {
    let guest_cart_id: Option<i32> =
        sqlx::query_scalar("SELECT cart_id FROM shopping_carts WHERE session_id = $1")
            .bind(session_id)
            .fetch_optional(pool)
            .await?;

    let Some(guest_cart_id) = guest_cart_id else {
        return Ok(());
    };

    let user_cart_id = get_or_create_user_cart(pool, user_id).await?;

    sqlx::query(
        "INSERT INTO cart_items (cart_id, product_id, quantity)
         SELECT $2, product_id, quantity FROM cart_items WHERE cart_id = $1
         ON CONFLICT (cart_id, product_id)
         DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity",
    )
    .bind(guest_cart_id)
    .bind(user_cart_id)
    .execute(pool)
    .await?;

    sqlx::query("DELETE FROM shopping_carts WHERE cart_id = $1")
        .bind(guest_cart_id)
        .execute(pool)
        .await
        .map(|_| ())
}
