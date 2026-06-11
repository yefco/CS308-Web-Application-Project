use sqlx::PgPool;

use crate::models::return_request::ReturnRequestFull;

pub async fn create_return_request(
    pool: &PgPool,
    order_id: i32,
    order_item_id: i32,
    user_id: i32,
    refund_amount: f64,
) -> Result<ReturnRequestFull, sqlx::Error> {
    sqlx::query_as::<_, ReturnRequestFull>(
        r#"
        INSERT INTO return_requests (order_id, order_item_id, user_id, refund_amount)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (order_item_id) DO UPDATE
            SET status = 'pending', refund_amount = EXCLUDED.refund_amount,
                resolved_at = NULL
        RETURNING
            return_requests.request_id, return_requests.order_id,
            return_requests.order_item_id, return_requests.user_id,
            (SELECT product_id FROM order_items WHERE order_item_id = return_requests.order_item_id) AS product_id,
            (SELECT p.product_name FROM order_items oi JOIN products p ON p.product_id = oi.product_id
             WHERE oi.order_item_id = return_requests.order_item_id) AS product_name,
            (SELECT quantity FROM order_items WHERE order_item_id = return_requests.order_item_id) AS quantity,
            return_requests.refund_amount::FLOAT8 AS refund_amount,
            return_requests.status, return_requests.requested_at, return_requests.resolved_at
        "#,
    )
    .bind(order_id)
    .bind(order_item_id)
    .bind(user_id)
    .bind(refund_amount)
    .fetch_one(pool)
    .await
}

pub async fn find_return_request(
    pool: &PgPool,
    request_id: i32,
) -> Result<Option<ReturnRequestFull>, sqlx::Error> {
    sqlx::query_as::<_, ReturnRequestFull>(
        r#"
        SELECT rr.request_id, rr.order_id, rr.order_item_id, rr.user_id,
               oi.product_id, p.product_name, oi.quantity,
               rr.refund_amount::FLOAT8 AS refund_amount,
               rr.status, rr.requested_at, rr.resolved_at
        FROM return_requests rr
        JOIN order_items oi ON oi.order_item_id = rr.order_item_id
        JOIN products p ON p.product_id = oi.product_id
        WHERE rr.request_id = $1
        "#,
    )
    .bind(request_id)
    .fetch_optional(pool)
    .await
}

pub async fn list_pending_return_requests(
    pool: &PgPool,
) -> Result<Vec<ReturnRequestFull>, sqlx::Error> {
    sqlx::query_as::<_, ReturnRequestFull>(
        r#"
        SELECT rr.request_id, rr.order_id, rr.order_item_id, rr.user_id,
               oi.product_id, p.product_name, oi.quantity,
               rr.refund_amount::FLOAT8 AS refund_amount,
               rr.status, rr.requested_at, rr.resolved_at
        FROM return_requests rr
        JOIN order_items oi ON oi.order_item_id = rr.order_item_id
        JOIN products p ON p.product_id = oi.product_id
        WHERE rr.status = 'pending'
        ORDER BY rr.requested_at
        "#,
    )
    .fetch_all(pool)
    .await
}

pub async fn update_return_request_status(
    pool: &PgPool,
    request_id: i32,
    status: &str,
) -> Result<Option<ReturnRequestFull>, sqlx::Error> {
    sqlx::query_as::<_, ReturnRequestFull>(
        r#"
        UPDATE return_requests
        SET status = $2, resolved_at = NOW()
        WHERE request_id = $1
        RETURNING
            return_requests.request_id, return_requests.order_id,
            return_requests.order_item_id, return_requests.user_id,
            (SELECT oi.product_id FROM order_items oi WHERE oi.order_item_id = return_requests.order_item_id) AS product_id,
            (SELECT p.product_name FROM order_items oi JOIN products p ON p.product_id = oi.product_id
             WHERE oi.order_item_id = return_requests.order_item_id) AS product_name,
            (SELECT oi.quantity FROM order_items oi WHERE oi.order_item_id = return_requests.order_item_id) AS quantity,
            return_requests.refund_amount::FLOAT8 AS refund_amount,
            return_requests.status, return_requests.requested_at, return_requests.resolved_at
        "#,
    )
    .bind(request_id)
    .bind(status)
    .fetch_optional(pool)
    .await
}

/// Marks all pending return requests for an order as rejected.
/// Called when the customer does a whole-order return so the manager
/// doesn't see stale item-level requests for the same order.
pub async fn cancel_pending_requests_for_order(
    pool: &PgPool,
    order_id: i32,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE return_requests SET status = 'rejected', resolved_at = NOW()
         WHERE order_id = $1 AND status = 'pending'",
    )
    .bind(order_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn get_order_item_for_return(
    pool: &PgPool,
    order_item_id: i32,
    user_id: i32,
) -> Result<Option<(i32, f64, i32)>, sqlx::Error> {
    // Returns (product_id, unit_price, quantity) if the item belongs to this user's delivered order
    let row: Option<(i32, f64, i32)> = sqlx::query_as(
        r#"
        SELECT oi.product_id, oi.unit_price::FLOAT8, oi.quantity
        FROM order_items oi
        JOIN orders o ON o.order_id = oi.order_id
        WHERE oi.order_item_id = $1
          AND o.user_id = $2
          AND o.status = 'delivered'
          AND NOW() - o.created_at <= INTERVAL '30 days'
        "#,
    )
    .bind(order_item_id)
    .bind(user_id)
    .fetch_optional(pool)
    .await?;
    Ok(row)
}
