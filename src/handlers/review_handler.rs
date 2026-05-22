use axum::{
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    Json,
};

use crate::middleware::auth::{decode_jwt, extract_authenticated_user_id};
use crate::models::review::SubmitReviewRequest;
use crate::utils::errors::AppError;
use crate::AppState;

/// POST /api/products/ratings
/// Body: { "productId": 3, "rating": 5, "comment": "..." }
/// Requires authentication.
pub async fn submit_review(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<SubmitReviewRequest>,
) -> Result<impl IntoResponse, AppError> {
    let user_id = extract_authenticated_user_id(&headers, &state.jwt_secret)?;
    state
        .review_service
        .submit_review(payload.product_id, user_id, payload.rating, payload.comment)
        .await?;
    Ok(StatusCode::CREATED)
}

/// GET /api/products/:product_id/ratings
/// Public — no auth required.
pub async fn list_reviews(
    State(state): State<AppState>,
    Path(product_id): Path<i32>,
) -> Result<impl IntoResponse, AppError> {
    let response = state.review_service.list_reviews(product_id).await?;
    Ok(Json(response))
}

/// GET /api/products/:product_id/user-rating
/// Returns the authenticated user's own review, or 404.
pub async fn get_user_review(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(product_id): Path<i32>,
) -> Result<impl IntoResponse, AppError> {
    let user_id = extract_authenticated_user_id(&headers, &state.jwt_secret)?;
    let response = state
        .review_service
        .get_user_review(product_id, user_id)
        .await?;
    Ok(Json(response))
}

/// GET /api/products/:product_id/purchase-check
/// Authenticated — returns { "can_review": bool }.
pub async fn purchase_check(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(product_id): Path<i32>,
) -> Result<impl IntoResponse, AppError> {
    let user_id = extract_authenticated_user_id(&headers, &state.jwt_secret)?;
    let can_review = state.review_service.can_review(product_id, user_id).await?;
    Ok(Json(serde_json::json!({ "can_review": can_review })))
}

/// GET /api/reviews/pending
/// Product manager only — returns all pending reviews across all products.
pub async fn list_pending_reviews(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, AppError> {
    require_product_manager(&headers, &state.jwt_secret)?;
    let response = state.review_service.list_pending_reviews().await?;
    Ok(Json(response))
}

/// PATCH /api/reviews/:review_id/approve
/// Product manager only — marks a review as approved.
pub async fn approve_review(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(review_id): Path<i32>,
) -> Result<impl IntoResponse, AppError> {
    require_product_manager(&headers, &state.jwt_secret)?;
    state.review_service.approve_review(review_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

/// PATCH /api/reviews/:review_id/reject
/// Product manager only — marks a review as rejected.
pub async fn reject_review(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(review_id): Path<i32>,
) -> Result<impl IntoResponse, AppError> {
    require_product_manager(&headers, &state.jwt_secret)?;
    state.review_service.reject_review(review_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

fn require_product_manager(headers: &HeaderMap, jwt_secret: &str) -> Result<(), AppError> {
    let auth_header = headers
        .get(axum::http::header::AUTHORIZATION)
        .ok_or_else(|| AppError::Unauthorized("Authorization header is required".into()))?
        .to_str()
        .map_err(|_| AppError::Unauthorized("Authorization header is invalid".into()))?;

    let token = auth_header.strip_prefix("Bearer ").ok_or_else(|| {
        AppError::Unauthorized("Authorization header must use Bearer token".into())
    })?;

    let claims = decode_jwt(token, jwt_secret)?;

    if claims.role != "productmanager" {
        return Err(AppError::Unauthorized(
            "Only product managers can perform this action".into(),
        ));
    }

    Ok(())
}
