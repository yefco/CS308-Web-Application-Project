use axum::{
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    Json,
};
use chrono::Utc;

use crate::middleware::auth::{decode_jwt, extract_authenticated_user_id};
use crate::models::order::{PlaceOrderRequest, UpdateOrderStatusRequest};
use crate::utils::errors::AppError;
use crate::AppState;

/// POST /api/orders — customer places an order from their current cart.
pub async fn place_order(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<PlaceOrderRequest>,
) -> Result<impl IntoResponse, AppError> {
    let user_id = extract_authenticated_user_id(&headers, &state.jwt_secret)?;
    let response = state.order_service.place_order(user_id, payload).await?;
    Ok((StatusCode::CREATED, Json(response)))
}

/// GET /api/orders — list all orders for the authenticated customer.
pub async fn list_orders(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, AppError> {
    let user_id = extract_authenticated_user_id(&headers, &state.jwt_secret)?;
    let response = state.order_service.list_orders(user_id).await?;
    Ok(Json(response))
}

/// GET /api/orders/:order_id — get full order detail for the authenticated customer.
pub async fn get_order(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(order_id): Path<i32>,
) -> Result<impl IntoResponse, AppError> {
    let user_id = extract_authenticated_user_id(&headers, &state.jwt_secret)?;
    let response = state.order_service.get_order(user_id, order_id).await?;
    Ok(Json(response))
}

/// POST /api/orders/:order_id/cancel — customer cancels a processing order.
pub async fn cancel_order(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(order_id): Path<i32>,
) -> Result<impl IntoResponse, AppError> {
    let user_id = extract_authenticated_user_id(&headers, &state.jwt_secret)?;
    let response = state.order_service.cancel_order(user_id, order_id).await?;
    Ok(Json(response))
}

/// POST /api/orders/:order_id/return — customer returns a delivered order.
pub async fn return_order(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(order_id): Path<i32>,
) -> Result<impl IntoResponse, AppError> {
    let user_id = extract_authenticated_user_id(&headers, &state.jwt_secret)?;
    let response = state.order_service.return_order(user_id, order_id).await?;
    Ok(Json(response))
}

/// GET /api/delivery/orders — delivery department sees all pending orders.
/// Requires sales_manager role.
pub async fn list_all_orders(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, AppError> {
    require_sales_manager(&headers, &state.jwt_secret)?;
    let response = state.order_service.list_all_orders().await?;
    Ok(Json(response))
}

/// PUT /api/delivery/orders/:order_id/status — delivery dept updates order status.
/// Requires sales_manager role.
pub async fn update_delivery_status(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(order_id): Path<i32>,
    Json(payload): Json<UpdateOrderStatusRequest>,
) -> Result<impl IntoResponse, AppError> {
    require_sales_manager(&headers, &state.jwt_secret)?;
    let response = state
        .order_service
        .update_delivery_status(order_id, payload.status)
        .await?;
    Ok(Json(response))
}

/// POST /api/orders/:order_id/send-invoice-email — mock email sending for demo.
/// Logs to console with a clear marker and returns a structured confirmation
/// that the frontend displays to the user. Requires authentication.
pub async fn send_invoice_email(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(order_id): Path<i32>,
) -> Result<impl IntoResponse, AppError> {
    let user_id = extract_authenticated_user_id(&headers, &state.jwt_secret)?;
    let order = state.order_service.get_order(user_id, order_id).await?;
    let timestamp = Utc::now().to_rfc3339();
    tracing::info!(
        "📧 [DEMO-EMAIL] ORDER #{} | user_id={} | total=${:.2} | ts={}",
        order.order_id,
        user_id,
        order.total_amount,
        timestamp,
    );
    Ok(axum::Json(serde_json::json!({
        "status": "sent",
        "message": format!("Invoice for Order #{} has been queued for delivery.", order.order_id),
        "order_id": order.order_id,
        "total_amount": order.total_amount,
        "recipient_user_id": user_id,
        "sent_at": timestamp,
    })))
}

fn require_sales_manager(headers: &HeaderMap, jwt_secret: &str) -> Result<(), AppError> {
    let auth_header = headers
        .get(axum::http::header::AUTHORIZATION)
        .ok_or_else(|| AppError::Unauthorized("Authorization header is required".into()))?
        .to_str()
        .map_err(|_| AppError::Unauthorized("Authorization header is invalid".into()))?;

    let token = auth_header.strip_prefix("Bearer ").ok_or_else(|| {
        AppError::Unauthorized("Authorization header must use Bearer token".into())
    })?;

    let claims = decode_jwt(token, jwt_secret)?;

    // JWT role for SalesManager is "salesmanager" (Debug + to_lowercase)
    if claims.role != "salesmanager" {
        return Err(AppError::Unauthorized(
            "Only the delivery department can perform this action".into(),
        ));
    }

    Ok(())
}
