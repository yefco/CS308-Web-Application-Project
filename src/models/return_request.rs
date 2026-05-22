use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct ReturnRequest {
    pub request_id: i32,
    pub order_id: i32,
    pub order_item_id: i32,
    pub user_id: i32,
    pub status: String,
    pub refund_amount: f64,
    pub requested_at: DateTime<Utc>,
    pub resolved_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize)]
pub struct ReturnRequestResponse {
    pub request_id: i32,
    pub order_id: i32,
    pub order_item_id: i32,
    pub user_id: i32,
    pub product_id: i32,
    pub product_name: String,
    pub quantity: i32,
    pub refund_amount: f64,
    pub status: String,
    pub requested_at: DateTime<Utc>,
    pub resolved_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, FromRow)]
pub struct ReturnRequestFull {
    pub request_id: i32,
    pub order_id: i32,
    pub order_item_id: i32,
    pub user_id: i32,
    pub product_id: i32,
    pub product_name: String,
    pub quantity: i32,
    pub refund_amount: f64,
    pub status: String,
    pub requested_at: DateTime<Utc>,
    pub resolved_at: Option<DateTime<Utc>>,
}

impl From<ReturnRequestFull> for ReturnRequestResponse {
    fn from(r: ReturnRequestFull) -> Self {
        Self {
            request_id: r.request_id,
            order_id: r.order_id,
            order_item_id: r.order_item_id,
            user_id: r.user_id,
            product_id: r.product_id,
            product_name: r.product_name,
            quantity: r.quantity,
            refund_amount: r.refund_amount,
            status: r.status,
            requested_at: r.requested_at,
            resolved_at: r.resolved_at,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct PendingReturnRequestsResponse {
    pub requests: Vec<ReturnRequestResponse>,
}
