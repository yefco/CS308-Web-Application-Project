use axum::{
    routing::{get, patch, post},
    Router,
};

use crate::handlers::review_handler;
use crate::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        // Submit / update a review (matches frontend: POST /api/products/ratings)
        .route("/api/products/ratings", post(review_handler::submit_review))
        // All approved reviews for a product
        .route("/api/products/:product_id/ratings", get(review_handler::list_reviews))
        // Authenticated user's own review
        .route("/api/products/:product_id/user-rating", get(review_handler::get_user_review))
        // Purchase eligibility check
        .route("/api/products/:product_id/purchase-check", get(review_handler::purchase_check))
        // Product manager — approval queue
        .route("/api/reviews/pending", get(review_handler::list_pending_reviews))
        .route("/api/reviews/:review_id/approve", patch(review_handler::approve_review))
        .route("/api/reviews/:review_id/reject", patch(review_handler::reject_review))
}
