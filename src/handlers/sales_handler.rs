use axum::{
    extract::{Path, Query, State},
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};

use crate::middleware::auth::decode_jwt;
use crate::models::product::SetDiscountRequest;
use crate::models::return_request::PendingReturnRequestsResponse;
use crate::repository::{
    notification_repository, order_repository, product_repository, return_repository,
    user_repository,
};
use crate::utils::errors::AppError;
use crate::AppState;

// ─── Revenue / profit response ────────────────────────────────

#[derive(Debug, Serialize)]
pub struct RevenueReport {
    pub from_date: String,
    pub to_date: String,
    pub revenue: f64,
    pub refunds: f64,
    pub net_revenue: f64,
    pub order_count: i64,
    pub refund_count: i64,
}

#[derive(Debug, Deserialize)]
pub struct DateRangeQuery {
    pub from: Option<String>,
    pub to: Option<String>,
}

// ─── Helpers ─────────────────────────────────────────────────

fn require_sales_manager(headers: &HeaderMap, jwt_secret: &str) -> Result<(), AppError> {
    let auth = headers
        .get(axum::http::header::AUTHORIZATION)
        .ok_or_else(|| AppError::Unauthorized("Authorization header is required".into()))?
        .to_str()
        .map_err(|_| AppError::Unauthorized("Authorization header is invalid".into()))?;

    let token = auth.strip_prefix("Bearer ").ok_or_else(|| {
        AppError::Unauthorized("Authorization header must use Bearer token".into())
    })?;

    let claims = decode_jwt(token, jwt_secret)?;

    if claims.role != "salesmanager" {
        return Err(AppError::Unauthorized(
            "Only the sales manager can perform this action".into(),
        ));
    }

    Ok(())
}

// Invoice için sales manager veya product manager yetkisi
fn require_sales_or_product_manager(
    headers: &HeaderMap,
    jwt_secret: &str,
) -> Result<(), AppError> {
    let auth = headers
        .get(axum::http::header::AUTHORIZATION)
        .ok_or_else(|| AppError::Unauthorized("Authorization header is required".into()))?
        .to_str()
        .map_err(|_| AppError::Unauthorized("Authorization header is invalid".into()))?;

    let token = auth.strip_prefix("Bearer ").ok_or_else(|| {
        AppError::Unauthorized("Authorization header must use Bearer token".into())
    })?;

    let claims = decode_jwt(token, jwt_secret)?;

    if claims.role != "salesmanager" && claims.role != "productmanager" {
        return Err(AppError::Unauthorized(
            "Only sales managers or product managers can view invoices".into(),
        ));
    }

    Ok(())
}

// ─── PATCH /api/products/:id/discount (sales_manager) ─────────

pub async fn set_discount(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(product_id): Path<i32>,
    Json(payload): Json<SetDiscountRequest>,
) -> Result<impl IntoResponse, AppError> {
    require_sales_manager(&headers, &state.jwt_secret)?;

    if !(0.0..=100.0).contains(&payload.discount_percent) {
        return Err(AppError::BadRequest(
            "Discount percent must be between 0 and 100".into(),
        ));
    }

    let product = product_repository::set_discount(
        &state.pool,
        product_id,
        payload.discount_percent,
    )
    .await?
    .ok_or_else(|| AppError::NotFound("Product not found".into()))?;

    // Notify all users who have this product in their wishlist
    if payload.discount_percent > 0.0 {
        let wishlist_users =
            product_repository::get_wishlist_user_ids_for_product(&state.pool, product_id).await?;

        for user_id in wishlist_users {
            let msg = format!(
                "🏷️ {}% discount on \"{}\" — now ${:.2}!",
                payload.discount_percent as i32,
                product.product_name,
                product.price * (1.0 - payload.discount_percent / 100.0)
            );

            notification_repository::insert_notification(
                &state.pool,
                user_id,
                Some(product_id),
                &msg,
            )
            .await
            .ok();
        }
    }

    use crate::models::product::ProductResponse;
    Ok(Json(ProductResponse::from(product)))
}

// ─── GET /api/sales/revenue (sales_manager) ───────────────────

pub async fn get_revenue_report(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(params): Query<DateRangeQuery>,
) -> Result<impl IntoResponse, AppError> {
    require_sales_manager(&headers, &state.jwt_secret)?;

    let from = params.from.as_deref().unwrap_or("2000-01-01");
    let to = params.to.as_deref().unwrap_or("2100-12-31");

    #[derive(sqlx::FromRow)]
    struct RevenueRow {
        revenue: Option<f64>,
        order_count: Option<i64>,
    }

    #[derive(sqlx::FromRow)]
    struct RefundRow {
        refunds: Option<f64>,
        refund_count: Option<i64>,
    }

    let rev: RevenueRow = sqlx::query_as(
        r#"
        SELECT
            COALESCE(SUM(total_amount), 0)::FLOAT8 AS revenue,
            COUNT(*)::BIGINT AS order_count
        FROM orders
        WHERE status IN ('processing', 'in_transit', 'delivered')
          AND created_at::DATE >= $1::DATE
          AND created_at::DATE <= $2::DATE
        "#,
    )
    .bind(from)
    .bind(to)
    .fetch_one(&state.pool)
    .await
    .map_err(AppError::from)?;

    let ref_row: RefundRow = sqlx::query_as(
        r#"
        SELECT
            COALESCE(SUM(total_amount), 0)::FLOAT8 AS refunds,
            COUNT(*)::BIGINT AS refund_count
        FROM orders
        WHERE status = 'returned'
          AND created_at::DATE >= $1::DATE
          AND created_at::DATE <= $2::DATE
        "#,
    )
    .bind(from)
    .bind(to)
    .fetch_one(&state.pool)
    .await
    .map_err(AppError::from)?;

    let revenue = rev.revenue.unwrap_or(0.0);
    let refunds = ref_row.refunds.unwrap_or(0.0);

    Ok(Json(RevenueReport {
        from_date: from.to_string(),
        to_date: to.to_string(),
        revenue,
        refunds,
        net_revenue: revenue - refunds,
        order_count: rev.order_count.unwrap_or(0),
        refund_count: ref_row.refund_count.unwrap_or(0),
    }))
}

// ─── GET /api/sales/invoices (sales_manager + product_manager) ───────────────

pub async fn list_invoices(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(params): Query<DateRangeQuery>,
) -> Result<impl IntoResponse, AppError> {
    require_sales_or_product_manager(&headers, &state.jwt_secret)?;

    let from = params.from.as_deref().unwrap_or("2000-01-01");
    let to = params.to.as_deref().unwrap_or("2100-12-31");

    let orders = order_repository::list_orders_in_date_range(&state.pool, from, to).await?;

    let mut responses = Vec::with_capacity(orders.len());

    for order in orders {
        let items = order_repository::get_order_items(&state.pool, order.order_id).await?;

        use crate::models::order::{OrderItemResponse, OrderResponse};

        let item_responses: Vec<OrderItemResponse> = items
            .into_iter()
            .map(|item| OrderItemResponse {
                order_item_id: item.order_item_id,
                product_id: item.product_id,
                product_name: item.product_name,
                quantity: item.quantity,
                unit_price: item.unit_price,
                subtotal: item.unit_price * item.quantity as f64,
            })
            .collect();

        responses.push(OrderResponse {
            order_id: order.order_id,
            status: order.status,
            delivery_address: order.delivery_address,
            total_amount: order.total_amount,
            items: item_responses,
            created_at: order.created_at,
            updated_at: order.updated_at,
        });
    }

    use crate::models::order::OrdersResponse;
    Ok(Json(OrdersResponse { orders: responses }))
}

// ─── GET /api/returns/pending (sales_manager) ────────────────

pub async fn list_pending_returns(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, AppError> {
    require_sales_manager(&headers, &state.jwt_secret)?;

    let requests = return_repository::list_pending_return_requests(&state.pool).await?;
    let mapped = requests.into_iter().map(|r| r.into()).collect();

    Ok(Json(PendingReturnRequestsResponse { requests: mapped }))
}

// ─── PUT /api/returns/:id/approve (sales_manager) ────────────

pub async fn approve_return(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(request_id): Path<i32>,
) -> Result<impl IntoResponse, AppError> {
    require_sales_manager(&headers, &state.jwt_secret)?;

    let req = return_repository::find_return_request(&state.pool, request_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Return request not found".into()))?;

    if req.status != "pending" {
        return Err(AppError::Conflict(format!(
            "Return request is already {}",
            req.status
        )));
    }

    // Re-stock the item
    product_repository::increment_stock(&state.pool, req.product_id, req.quantity).await?;

    // Credit the refund to the customer's account balance
    user_repository::credit_balance(&state.pool, req.user_id, req.refund_amount).await?;

    let updated =
        return_repository::update_return_request_status(&state.pool, request_id, "approved")
            .await?
            .ok_or_else(|| AppError::NotFound("Return request not found".into()))?;

    tracing::info!(
        "✅ Return #{} approved: user_id={} refund=${:.2} credited to account",
        request_id, req.user_id, req.refund_amount
    );

    use crate::models::return_request::ReturnRequestResponse;
    Ok(Json(ReturnRequestResponse::from(updated)))
}

// ─── PUT /api/returns/:id/reject (sales_manager) ─────────────

pub async fn reject_return(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(request_id): Path<i32>,
) -> Result<impl IntoResponse, AppError> {
    require_sales_manager(&headers, &state.jwt_secret)?;

    let req = return_repository::find_return_request(&state.pool, request_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Return request not found".into()))?;

    if req.status != "pending" {
        return Err(AppError::Conflict(format!(
            "Return request is already {}",
            req.status
        )));
    }

    let updated =
        return_repository::update_return_request_status(&state.pool, request_id, "rejected")
            .await?
            .ok_or_else(|| AppError::NotFound("Return request not found".into()))?;

    use crate::models::return_request::ReturnRequestResponse;
    Ok((StatusCode::OK, Json(ReturnRequestResponse::from(updated))))
}