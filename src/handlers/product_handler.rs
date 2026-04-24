use axum::{
    extract::{Path, State},
    http::{header::AUTHORIZATION, HeaderMap, StatusCode},
    response::IntoResponse,
    Json,
};

use crate::middleware::auth::decode_jwt;
use crate::models::product::{
    CreateCategoryRequest, CreateProductRequest, UpdateCategoryRequest, UpdateProductRequest,
    UpdateStockRequest,
};
use crate::utils::errors::AppError;
use crate::AppState;

// ─── Public endpoints (no auth required) ─────────────────────

pub async fn list_products(State(state): State<AppState>) -> Result<impl IntoResponse, AppError> {
    Ok(Json(state.product_service.list_products().await?))
}

pub async fn get_product(
    State(state): State<AppState>,
    Path(product_id): Path<i32>,
) -> Result<impl IntoResponse, AppError> {
    Ok(Json(state.product_service.get_product(product_id).await?))
}

pub async fn list_categories(
    State(state): State<AppState>,
) -> Result<impl IntoResponse, AppError> {
    Ok(Json(state.product_service.list_categories().await?))
}

pub async fn get_category(
    State(state): State<AppState>,
    Path(category_id): Path<i32>,
) -> Result<impl IntoResponse, AppError> {
    Ok(Json(state.product_service.get_category(category_id).await?))
}

// ─── Product Manager endpoints (product_manager role required) ─

pub async fn create_product(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateProductRequest>,
) -> Result<impl IntoResponse, AppError> {
    require_product_manager(&headers, &state.jwt_secret)?;
    let response = state.product_service.create_product(payload).await?;
    Ok((StatusCode::CREATED, Json(response)))
}

pub async fn update_product(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(product_id): Path<i32>,
    Json(payload): Json<UpdateProductRequest>,
) -> Result<impl IntoResponse, AppError> {
    require_product_manager(&headers, &state.jwt_secret)?;
    Ok(Json(
        state.product_service.update_product(product_id, payload).await?,
    ))
}

pub async fn update_stock(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(product_id): Path<i32>,
    Json(payload): Json<UpdateStockRequest>,
) -> Result<impl IntoResponse, AppError> {
    require_product_manager(&headers, &state.jwt_secret)?;
    Ok(Json(
        state.product_service.update_stock(product_id, payload).await?,
    ))
}

pub async fn delete_product(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(product_id): Path<i32>,
) -> Result<impl IntoResponse, AppError> {
    require_product_manager(&headers, &state.jwt_secret)?;
    state.product_service.delete_product(product_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn create_category(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateCategoryRequest>,
) -> Result<impl IntoResponse, AppError> {
    require_product_manager(&headers, &state.jwt_secret)?;
    let response = state.product_service.create_category(payload).await?;
    Ok((StatusCode::CREATED, Json(response)))
}

pub async fn update_category(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(category_id): Path<i32>,
    Json(payload): Json<UpdateCategoryRequest>,
) -> Result<impl IntoResponse, AppError> {
    require_product_manager(&headers, &state.jwt_secret)?;
    Ok(Json(
        state.product_service.update_category(category_id, payload).await?,
    ))
}

pub async fn delete_category(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(category_id): Path<i32>,
) -> Result<impl IntoResponse, AppError> {
    require_product_manager(&headers, &state.jwt_secret)?;
    state.product_service.delete_category(category_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

// ─── Role guard ───────────────────────────────────────────────

fn require_product_manager(headers: &HeaderMap, jwt_secret: &str) -> Result<(), AppError> {
    let auth = headers
        .get(AUTHORIZATION)
        .ok_or_else(|| AppError::Unauthorized("Authorization header is required".into()))?
        .to_str()
        .map_err(|_| AppError::Unauthorized("Authorization header is invalid".into()))?;

    let token = auth
        .strip_prefix("Bearer ")
        .ok_or_else(|| AppError::Unauthorized("Authorization header must use Bearer token".into()))?;

    let claims = decode_jwt(token, jwt_secret)?;

    // JWT role for ProductManager: format!("{:?}", UserRole::ProductManager).to_lowercase() = "productmanager"
    if claims.role != "productmanager" {
        return Err(AppError::Unauthorized(
            "Only the product manager can perform this action".into(),
        ));
    }

    Ok(())
}
