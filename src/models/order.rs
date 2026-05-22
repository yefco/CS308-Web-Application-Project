use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[serde(rename_all = "snake_case")]
#[sqlx(type_name = "order_status", rename_all = "snake_case")]
pub enum OrderStatus {
    Processing,
    InTransit,
    Delivered,
    Cancelled,
    Returned,
}

#[derive(Debug, Clone, FromRow)]
pub struct Order {
    pub order_id: i32,
    pub user_id: i32,
    pub status: OrderStatus,
    pub delivery_address: String,
    pub total_amount: f64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, FromRow)]
pub struct OrderItem {
    pub order_item_id: i32,
    pub order_id: i32,
    pub product_id: i32,
    pub quantity: i32,
    pub unit_price: f64,
    pub product_name: String,
}

#[derive(Debug, Deserialize)]
pub struct PlaceOrderRequest {
    /// Shipping address; falls back to the user's home_address if omitted.
    pub delivery_address: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateOrderStatusRequest {
    pub status: OrderStatus,
}

#[derive(Debug, Serialize)]
pub struct OrderItemResponse {
    pub order_item_id: i32,
    pub product_id: i32,
    pub product_name: String,
    pub quantity: i32,
    pub unit_price: f64,
    pub subtotal: f64,
}

#[derive(Debug, Serialize)]
pub struct OrderResponse {
    pub order_id: i32,
    pub status: OrderStatus,
    pub delivery_address: String,
    pub total_amount: f64,
    pub items: Vec<OrderItemResponse>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct OrdersResponse {
    pub orders: Vec<OrderResponse>,
}
