use axum::{
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    Json,
};

use crate::middleware::auth::decode_jwt;
use crate::models::cart::{AddItemRequest, CartOwner, MergeCartRequest, UpdateQuantityRequest};
use crate::utils::errors::AppError;
use crate::AppState;

fn extract_owner(headers: &HeaderMap, state: &AppState) -> Result<CartOwner, AppError> {
    if let Some(val) = headers.get(axum::http::header::AUTHORIZATION) {
        if let Ok(s) = val.to_str() {
            if let Some(token) = s.strip_prefix("Bearer ") {
                let claims = decode_jwt(token, &state.jwt_secret)?;
                let user_id = claims
                    .sub
                    .parse::<i32>()
                    .map_err(|_| AppError::Unauthorized("Invalid token subject".into()))?;
                return Ok(CartOwner::User(user_id));
            }
        }
    }
    if let Some(val) = headers.get("x-session-id") {
        if let Ok(s) = val.to_str() {
            return Ok(CartOwner::Guest(s.to_string()));
        }
    }
    Err(AppError::Unauthorized(
        "Provide Authorization header or X-Session-ID".into(),
    ))
}

pub async fn get_cart(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, AppError> {
    let owner = extract_owner(&headers, &state)?;
    let cart = state.cart_service.get_cart(owner).await?;
    Ok(Json(cart))
}

pub async fn add_item(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<AddItemRequest>,
) -> Result<impl IntoResponse, AppError> {
    let owner = extract_owner(&headers, &state)?;
    let cart = state.cart_service.add_item(owner, payload).await?;
    Ok((StatusCode::CREATED, Json(cart)))
}

pub async fn update_quantity(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(product_id): Path<i32>,
    Json(payload): Json<UpdateQuantityRequest>,
) -> Result<impl IntoResponse, AppError> {
    let owner = extract_owner(&headers, &state)?;
    let cart = state
        .cart_service
        .update_quantity(owner, product_id, payload)
        .await?;
    Ok(Json(cart))
}

pub async fn remove_item(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(product_id): Path<i32>,
) -> Result<impl IntoResponse, AppError> {
    let owner = extract_owner(&headers, &state)?;
    let cart = state.cart_service.remove_item(owner, product_id).await?;
    Ok(Json(cart))
}

pub async fn clear_cart(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, AppError> {
    let owner = extract_owner(&headers, &state)?;
    state.cart_service.clear(owner).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn merge_cart(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<MergeCartRequest>,
) -> Result<impl IntoResponse, AppError> {
    let owner = extract_owner(&headers, &state)?;
    let CartOwner::User(user_id) = owner else {
        return Err(AppError::Unauthorized(
            "Authentication required to merge cart".into(),
        ));
    };
    let cart = state.cart_service.merge(user_id, payload).await?;
    Ok(Json(cart))
}
