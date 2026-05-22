use sqlx::{PgPool, Postgres, Transaction};

use crate::models::order::{Order, OrderItem, OrderStatus};
use crate::utils::errors::AppError;

pub async fn create_order_in_tx(
    tx: &mut Transaction<'_, Postgres>,
    user_id: i32,
    delivery_address: &str,
    total_amount: f64,
) -> Result<Order, sqlx::Error> {
    sqlx::query_as::<_, Order>(
        r#"
        INSERT INTO orders (user_id, delivery_address, total_amount, status)
        VALUES ($1, $2, $3, 'processing')
        RETURNING order_id, user_id, status, delivery_address,
                  total_amount::FLOAT8 AS total_amount, created_at, updated_at
        "#,
    )
    .bind(user_id)
    .bind(delivery_address)
    .bind(total_amount)
    .fetch_one(&mut **tx)
    .await
}

pub async fn create_order_items_in_tx(
    tx: &mut Transaction<'_, Postgres>,
    order_id: i32,
    product_id: i32,
    quantity: i32,
    unit_price: f64,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO order_items (order_id, product_id, quantity, unit_price)
        VALUES ($1, $2, $3, $4)
        "#,
    )
    .bind(order_id)
    .bind(product_id)
    .bind(quantity)
    .bind(unit_price)
    .execute(&mut **tx)
    .await
    .map(|_| ())
}

pub async fn get_order_items(pool: &PgPool, order_id: i32) -> Result<Vec<OrderItem>, sqlx::Error> {
    sqlx::query_as::<_, OrderItem>(
        r#"
        SELECT oi.order_item_id, oi.order_id, oi.product_id, oi.quantity,
               oi.unit_price::FLOAT8 AS unit_price, p.product_name
        FROM order_items oi
        JOIN products p ON p.product_id = oi.product_id
        WHERE oi.order_id = $1
        ORDER BY oi.order_item_id
        "#,
    )
    .bind(order_id)
    .fetch_all(pool)
    .await
}

pub async fn get_order_items_in_tx(
    tx: &mut Transaction<'_, Postgres>,
    order_id: i32,
) -> Result<Vec<OrderItem>, sqlx::Error> {
    sqlx::query_as::<_, OrderItem>(
        r#"
        SELECT oi.order_item_id, oi.order_id, oi.product_id, oi.quantity,
               oi.unit_price::FLOAT8 AS unit_price, p.product_name
        FROM order_items oi
        JOIN products p ON p.product_id = oi.product_id
        WHERE oi.order_id = $1
        ORDER BY oi.order_item_id
        "#,
    )
    .bind(order_id)
    .fetch_all(&mut **tx)
    .await
}

pub async fn list_user_orders(pool: &PgPool, user_id: i32) -> Result<Vec<Order>, sqlx::Error> {
    sqlx::query_as::<_, Order>(
        r#"
        SELECT order_id, user_id, status, delivery_address,
               total_amount::FLOAT8 AS total_amount, created_at, updated_at
        FROM orders
        WHERE user_id = $1
        ORDER BY created_at DESC, order_id DESC
        "#,
    )
    .bind(user_id)
    .fetch_all(pool)
    .await
}

pub async fn find_user_order(
    pool: &PgPool,
    user_id: i32,
    order_id: i32,
) -> Result<Option<Order>, sqlx::Error> {
    sqlx::query_as::<_, Order>(
        r#"
        SELECT order_id, user_id, status, delivery_address,
               total_amount::FLOAT8 AS total_amount, created_at, updated_at
        FROM orders
        WHERE user_id = $1 AND order_id = $2
        "#,
    )
    .bind(user_id)
    .bind(order_id)
    .fetch_optional(pool)
    .await
}

pub async fn find_order_for_update_in_tx(
    tx: &mut Transaction<'_, Postgres>,
    order_id: i32,
) -> Result<Option<Order>, sqlx::Error> {
    sqlx::query_as::<_, Order>(
        r#"
        SELECT order_id, user_id, status, delivery_address,
               total_amount::FLOAT8 AS total_amount, created_at, updated_at
        FROM orders
        WHERE order_id = $1
        FOR UPDATE
        "#,
    )
    .bind(order_id)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn find_user_order_for_update_in_tx(
    tx: &mut Transaction<'_, Postgres>,
    user_id: i32,
    order_id: i32,
) -> Result<Option<Order>, sqlx::Error> {
    sqlx::query_as::<_, Order>(
        r#"
        SELECT order_id, user_id, status, delivery_address,
               total_amount::FLOAT8 AS total_amount, created_at, updated_at
        FROM orders
        WHERE user_id = $1 AND order_id = $2
        FOR UPDATE
        "#,
    )
    .bind(user_id)
    .bind(order_id)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn update_order_status_in_tx(
    tx: &mut Transaction<'_, Postgres>,
    order_id: i32,
    status: &OrderStatus,
) -> Result<Order, sqlx::Error> {
    sqlx::query_as::<_, Order>(
        r#"
        UPDATE orders
        SET status = $2,
            updated_at = NOW()
        WHERE order_id = $1
        RETURNING order_id, user_id, status, delivery_address,
                  total_amount::FLOAT8 AS total_amount, created_at, updated_at
        "#,
    )
    .bind(order_id)
    .bind(status)
    .fetch_one(&mut **tx)
    .await
}

pub async fn list_all_orders(pool: &PgPool) -> Result<Vec<Order>, sqlx::Error> {
    sqlx::query_as::<_, Order>(
        r#"
        SELECT order_id, user_id, status, delivery_address,
               total_amount::FLOAT8 AS total_amount, created_at, updated_at
        FROM orders
        ORDER BY created_at DESC, order_id DESC
        "#,
    )
    .fetch_all(pool)
    .await
}

pub async fn list_orders_in_date_range(
    pool: &PgPool,
    from: &str,
    to: &str,
) -> Result<Vec<Order>, sqlx::Error> {
    sqlx::query_as::<_, Order>(
        r#"
        SELECT order_id, user_id, status, delivery_address,
               total_amount::FLOAT8 AS total_amount, created_at, updated_at
        FROM orders
        WHERE created_at::DATE >= $1::DATE
          AND created_at::DATE <= $2::DATE
        ORDER BY created_at DESC, order_id DESC
        "#,
    )
    .bind(from)
    .bind(to)
    .fetch_all(pool)
    .await
}

pub async fn has_purchased_product(
    pool: &PgPool,
    user_id: i32,
    product_id: i32,
) -> Result<bool, AppError> {
    #[derive(sqlx::FromRow)]
    struct Exists {
        exists: Option<bool>,
    }

    let row = sqlx::query_as::<_, Exists>(
        r#"
        SELECT EXISTS(
            SELECT 1
            FROM orders o
            JOIN order_items oi ON oi.order_id = o.order_id
            WHERE o.user_id = $1
              AND oi.product_id = $2
              AND o.status IN ('delivered', 'returned')
        ) AS exists
        "#,
    )
    .bind(user_id)
    .bind(product_id)
    .fetch_one(pool)
    .await
    .map_err(AppError::from)?;

    Ok(row.exists.unwrap_or(false))
}
