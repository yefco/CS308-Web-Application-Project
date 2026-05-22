use axum::{
    extract::{Path, State},
    http::HeaderMap,
    response::IntoResponse,
    Json,
};

use crate::middleware::auth::extract_authenticated_user_id;
use crate::models::wishlist::AddWishlistItemRequest;
use crate::utils::errors::AppError;
use crate::AppState;

pub async fn list_items(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, AppError> {
    let user_id = extract_authenticated_user_id(&headers, &state.jwt_secret)?;
    Ok(Json(state.wishlist_service.list_items(user_id).await?))
}

pub async fn add_item(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<AddWishlistItemRequest>,
) -> Result<impl IntoResponse, AppError> {
    let user_id = extract_authenticated_user_id(&headers, &state.jwt_secret)?;
    Ok(Json(
        state
            .wishlist_service
            .add_item(user_id, payload.product_id)
            .await?,
    ))
}

pub async fn remove_item(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(product_id): Path<i32>,
) -> Result<impl IntoResponse, AppError> {
    let user_id = extract_authenticated_user_id(&headers, &state.jwt_secret)?;
    state
        .wishlist_service
        .remove_item(user_id, product_id)
        .await?;
    Ok(axum::http::StatusCode::NO_CONTENT)
}
