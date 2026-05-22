use sqlx::PgPool;

use crate::models::wishlist::WishlistItemRow;

pub async fn list_user_wishlist(
    pool: &PgPool,
    user_id: i32,
) -> Result<Vec<WishlistItemRow>, sqlx::Error> {
    sqlx::query_as::<_, WishlistItemRow>(
        r#"
        SELECT
            wi.wishlist_item_id,
            wi.user_id,
            wi.product_id,
            p.product_name,
            p.description,
            p.stock_quantity,
            p.price::FLOAT8 AS price,
            wi.created_at
        FROM wishlist_items wi
        JOIN products p ON p.product_id = wi.product_id
        WHERE wi.user_id = $1
        ORDER BY wi.created_at DESC, wi.wishlist_item_id DESC
        "#,
    )
    .bind(user_id)
    .fetch_all(pool)
    .await
}

pub async fn add_item(
    pool: &PgPool,
    user_id: i32,
    product_id: i32,
) -> Result<WishlistItemRow, sqlx::Error> {
    sqlx::query_as::<_, WishlistItemRow>(
        r#"
        INSERT INTO wishlist_items (user_id, product_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, product_id) DO UPDATE
        SET created_at = wishlist_items.created_at
        RETURNING
            wishlist_item_id,
            user_id,
            product_id,
            (
                SELECT p.product_name
                FROM products p
                WHERE p.product_id = wishlist_items.product_id
            ) AS product_name,
            (
                SELECT p.description
                FROM products p
                WHERE p.product_id = wishlist_items.product_id
            ) AS description,
            (
                SELECT p.stock_quantity
                FROM products p
                WHERE p.product_id = wishlist_items.product_id
            ) AS stock_quantity,
            (
                SELECT p.price::FLOAT8
                FROM products p
                WHERE p.product_id = wishlist_items.product_id
            ) AS price,
            created_at
        "#,
    )
    .bind(user_id)
    .bind(product_id)
    .fetch_one(pool)
    .await
}

pub async fn remove_item(
    pool: &PgPool,
    user_id: i32,
    product_id: i32,
) -> Result<bool, sqlx::Error> {
    sqlx::query(
        r#"
        DELETE FROM wishlist_items
        WHERE user_id = $1 AND product_id = $2
        "#,
    )
    .bind(user_id)
    .bind(product_id)
    .execute(pool)
    .await
    .map(|result| result.rows_affected() > 0)
}
