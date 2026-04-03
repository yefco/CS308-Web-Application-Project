use axum::{
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    Json,
};

use crate::middleware::auth::extract_authenticated_user_id;
use crate::models::payment::{CreatePaymentMethodRequest, UpdatePaymentMethodRequest};
use crate::utils::errors::AppError;
use crate::AppState;

pub async fn list_payment_methods(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, AppError> {
    let user_id = extract_authenticated_user_id(&headers, &state.jwt_secret)?;
    let response = state.payment_service.list_payment_methods(user_id).await?;
    Ok(Json(response))
}

pub async fn get_payment_method(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(payment_id): Path<i32>,
) -> Result<impl IntoResponse, AppError> {
    let user_id = extract_authenticated_user_id(&headers, &state.jwt_secret)?;
    let response = state
        .payment_service
        .get_payment_method(user_id, payment_id)
        .await?;
    Ok(Json(response))
}

pub async fn create_payment_method(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreatePaymentMethodRequest>,
) -> Result<impl IntoResponse, AppError> {
    let user_id = extract_authenticated_user_id(&headers, &state.jwt_secret)?;
    let response = state
        .payment_service
        .create_payment_method(user_id, payload)
        .await?;
    Ok((StatusCode::CREATED, Json(response)))
}

pub async fn update_payment_method(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(payment_id): Path<i32>,
    Json(payload): Json<UpdatePaymentMethodRequest>,
) -> Result<impl IntoResponse, AppError> {
    let user_id = extract_authenticated_user_id(&headers, &state.jwt_secret)?;
    let response = state
        .payment_service
        .update_payment_method(user_id, payment_id, payload)
        .await?;
    Ok(Json(response))
}

pub async fn delete_payment_method(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(payment_id): Path<i32>,
) -> Result<impl IntoResponse, AppError> {
    let user_id = extract_authenticated_user_id(&headers, &state.jwt_secret)?;
    state
        .payment_service
        .delete_payment_method(user_id, payment_id)
        .await?;
    Ok(StatusCode::NO_CONTENT)
}
