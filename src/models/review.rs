use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

/// Row returned by JOIN query (reviews + user name)
#[derive(Debug, Clone, FromRow)]
pub struct ReviewRow {
    pub review_id:  i32,
    pub product_id: i32,
    pub user_id:    i32,
    pub user_name:  String,
    pub rating:     i32,
    pub comment:    Option<String>,
    pub created_at: DateTime<Utc>,
}

/// Public response shape for a single review
#[derive(Debug, Serialize)]
pub struct ReviewResponse {
    pub review_id:  i32,
    pub user_name:  String,
    pub rating:     i32,
    pub comment:    Option<String>,
    pub created_at: DateTime<Utc>,
}

impl From<ReviewRow> for ReviewResponse {
    fn from(r: ReviewRow) -> Self {
        Self {
            review_id:  r.review_id,
            user_name:  r.user_name,
            rating:     r.rating,
            comment:    r.comment,
            created_at: r.created_at,
        }
    }
}

/// List of reviews + aggregate stats
#[derive(Debug, Serialize)]
pub struct ReviewsResponse {
    pub reviews:        Vec<ReviewResponse>,
    pub average_rating: f64,
    pub total_reviews:  i64,
}

/// The user's own review (for pre-filling the form)
#[derive(Debug, Serialize, FromRow)]
pub struct UserReviewResponse {
    pub review_id:  i32,
    pub rating:     i32,
    pub comment:    Option<String>,
    pub created_at: DateTime<Utc>,
}

/// Request body sent by the frontend:
/// { "productId": 3, "rating": 5, "comment": "Great!" }
#[derive(Debug, Deserialize)]
pub struct SubmitReviewRequest {
    #[serde(rename = "productId")]
    pub product_id: i32,
    pub rating:     i32,
    pub comment:    Option<String>,
}

/// Row returned by the pending-reviews query (reviews + product name + user name)
#[derive(Debug, Clone, FromRow)]
pub struct PendingReviewRow {
    pub review_id:    i32,
    pub product_id:   i32,
    pub product_name: String,
    pub user_id:      i32,
    pub user_name:    String,
    pub rating:       i32,
    pub comment:      Option<String>,
    pub created_at:   DateTime<Utc>,
}

/// Single pending review shape returned to the product manager
#[derive(Debug, Serialize)]
pub struct PendingReviewResponse {
    pub comment_id:    i32,
    pub product_id:    i32,
    pub product_name:  String,
    pub customer_name: String,
    pub comment_text:  Option<String>,
    pub rating:        i32,
    pub created_at:    DateTime<Utc>,
}

impl From<PendingReviewRow> for PendingReviewResponse {
    fn from(r: PendingReviewRow) -> Self {
        Self {
            comment_id:    r.review_id,
            product_id:    r.product_id,
            product_name:  r.product_name,
            customer_name: r.user_name,
            comment_text:  r.comment,
            rating:        r.rating,
            created_at:    r.created_at,
        }
    }
}

/// Response wrapper for the pending reviews list
#[derive(Debug, Serialize)]
pub struct PendingReviewsResponse {
    pub comments: Vec<PendingReviewResponse>,
}
