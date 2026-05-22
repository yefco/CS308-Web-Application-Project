use sqlx::PgPool;

use crate::models::review::{
    PendingReviewsResponse, ReviewResponse, ReviewsResponse, UserReviewResponse,
};
use crate::repository::{order_repository, review_repository};
use crate::utils::errors::AppError;

#[derive(Clone)]
pub struct ReviewService {
    pool: PgPool,
}

impl ReviewService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Check whether a user has purchased a product (required before reviewing).
    pub async fn can_review(&self, product_id: i32, user_id: i32) -> Result<bool, AppError> {
        order_repository::has_purchased_product(&self.pool, user_id, product_id).await
    }

    /// Submit (or update) a review. Rating must be 1‑5.
    /// Returns Forbidden if the user has not purchased the product.
    pub async fn submit_review(
        &self,
        product_id: i32,
        user_id: i32,
        rating: i32,
        comment: Option<String>,
    ) -> Result<(), AppError> {
        if !(1..=5).contains(&rating) {
            return Err(AppError::BadRequest(
                "Rating must be between 1 and 5".into(),
            ));
        }
        let purchased =
            order_repository::has_purchased_product(&self.pool, user_id, product_id).await?;
        if !purchased {
            return Err(AppError::Forbidden(
                "You must purchase this product before leaving a review".into(),
            ));
        }
        review_repository::upsert_review(
            &self.pool,
            product_id,
            user_id,
            rating,
            comment.as_deref(),
        )
        .await
    }

    /// Return approved review comments + aggregate stats for a product.
    /// Aggregate (avg rating, count) includes pending reviews so stars appear immediately.
    /// Comment text only shows once approved by a product manager.
    pub async fn list_reviews(&self, product_id: i32) -> Result<ReviewsResponse, AppError> {
        let (avg, total) =
            review_repository::get_product_rating_stats(&self.pool, product_id).await?;
        let rows = review_repository::list_product_reviews(&self.pool, product_id).await?;
        let reviews = rows.into_iter().map(ReviewResponse::from).collect();
        Ok(ReviewsResponse {
            reviews,
            average_rating: (avg * 10.0).round() / 10.0,
            total_reviews: total,
        })
    }

    /// Return the authenticated user's own review, or 404 if none.
    pub async fn get_user_review(
        &self,
        product_id: i32,
        user_id: i32,
    ) -> Result<UserReviewResponse, AppError> {
        review_repository::get_user_review(&self.pool, product_id, user_id)
            .await?
            .ok_or_else(|| AppError::NotFound("No review found for this product".into()))
    }

    /// Return all pending reviews across all products (product manager queue).
    pub async fn list_pending_reviews(&self) -> Result<PendingReviewsResponse, AppError> {
        let rows = review_repository::list_pending_reviews(&self.pool).await?;
        let comments = rows.into_iter().map(|r| r.into()).collect();
        Ok(PendingReviewsResponse { comments })
    }

    /// Approve a review by ID.
    pub async fn approve_review(&self, review_id: i32) -> Result<(), AppError> {
        review_repository::update_review_status(&self.pool, review_id, "approved").await
    }

    /// Reject a review by ID.
    pub async fn reject_review(&self, review_id: i32) -> Result<(), AppError> {
        review_repository::update_review_status(&self.pool, review_id, "rejected").await
    }
}
