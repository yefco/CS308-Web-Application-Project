use sqlx::PgPool;

use crate::models::review::{PendingReviewRow, ReviewRow, UserReviewResponse};
use crate::utils::errors::AppError;

/// Insert or update the user's review for a product (upsert).
pub async fn upsert_review(
    pool:       &PgPool,
    product_id: i32,
    user_id:    i32,
    rating:     i32,
    comment:    Option<&str>,
) -> Result<(), AppError> {
    sqlx::query(
        r#"
        INSERT INTO product_reviews (product_id, user_id, rating, comment, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (product_id, user_id)
        DO UPDATE SET
            rating     = EXCLUDED.rating,
            comment    = EXCLUDED.comment,
            status     = 'pending',
            updated_at = NOW()
        "#,
    )
    .bind(product_id)
    .bind(user_id)
    .bind(rating)
    .bind(comment)
    .execute(pool)
    .await
    .map_err(AppError::from)?;

    Ok(())
}

/// Fetch all APPROVED reviews for a product, joined with user names.
pub async fn list_product_reviews(
    pool:       &PgPool,
    product_id: i32,
) -> Result<Vec<ReviewRow>, AppError> {
    sqlx::query_as::<_, ReviewRow>(
        r#"
        SELECT
            pr.review_id,
            pr.product_id,
            pr.user_id,
            u.user_name,
            pr.rating,
            pr.comment,
            pr.created_at
        FROM product_reviews pr
        JOIN users u ON u.user_id = pr.user_id
        WHERE pr.product_id = $1 AND pr.status = 'approved'
        ORDER BY pr.created_at DESC
        "#,
    )
    .bind(product_id)
    .fetch_all(pool)
    .await
    .map_err(AppError::from)
}

/// Fetch aggregate stats (avg rating, total count) for a product — includes pending + approved,
/// excludes rejected. Used so ratings show immediately without waiting for approval.
pub async fn get_product_rating_stats(
    pool:       &PgPool,
    product_id: i32,
) -> Result<(f64, i64), AppError> {
    #[derive(sqlx::FromRow)]
    struct Stats { avg_rating: Option<f64>, total: Option<i64> }

    let row = sqlx::query_as::<_, Stats>(
        r#"
        SELECT
            AVG(rating::float) AS avg_rating,
            COUNT(*)::bigint   AS total
        FROM product_reviews
        WHERE product_id = $1 AND status IN ('pending', 'approved')
        "#,
    )
    .bind(product_id)
    .fetch_one(pool)
    .await
    .map_err(AppError::from)?;

    Ok((row.avg_rating.unwrap_or(0.0), row.total.unwrap_or(0)))
}

/// Fetch all pending reviews across all products (for product manager approval queue).
pub async fn list_pending_reviews(pool: &PgPool) -> Result<Vec<PendingReviewRow>, AppError> {
    sqlx::query_as::<_, PendingReviewRow>(
        r#"
        SELECT
            pr.review_id,
            pr.product_id,
            p.product_name,
            pr.user_id,
            u.user_name,
            pr.rating,
            pr.comment,
            pr.created_at
        FROM product_reviews pr
        JOIN products p ON p.product_id = pr.product_id
        JOIN users    u ON u.user_id    = pr.user_id
        WHERE pr.status = 'pending'
        ORDER BY pr.created_at ASC
        "#,
    )
    .fetch_all(pool)
    .await
    .map_err(AppError::from)
}

/// Update a review's status to 'approved' or 'rejected'.
pub async fn update_review_status(
    pool:      &PgPool,
    review_id: i32,
    status:    &str,
) -> Result<(), AppError> {
    let rows_affected = sqlx::query(
        r#"
        UPDATE product_reviews
        SET status = $1, updated_at = NOW()
        WHERE review_id = $2
        "#,
    )
    .bind(status)
    .bind(review_id)
    .execute(pool)
    .await
    .map_err(AppError::from)?
    .rows_affected();

    if rows_affected == 0 {
        return Err(AppError::NotFound(format!("Review {} not found", review_id)));
    }
    Ok(())
}

/// Fetch the authenticated user's own review for a product, if any.
pub async fn get_user_review(
    pool:       &PgPool,
    product_id: i32,
    user_id:    i32,
) -> Result<Option<UserReviewResponse>, AppError> {
    sqlx::query_as::<_, UserReviewResponse>(
        r#"
        SELECT review_id, rating, comment, created_at
        FROM product_reviews
        WHERE product_id = $1 AND user_id = $2
        "#,
    )
    .bind(product_id)
    .bind(user_id)
    .fetch_optional(pool)
    .await
    .map_err(AppError::from)
}
