use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

pub enum CartOwner {
    User(i32),
    Guest(String),
}

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct CartItemRow {
    pub cart_item_id: i32,
    pub cart_id: i32,
    pub product_id: i32,
    pub quantity: i32,
    pub added_at: DateTime<Utc>,
    pub product_name: String,
    pub price: f64,
}

#[derive(Debug, Deserialize)]
pub struct AddItemRequest {
    pub product_id: i32,
    pub quantity: i32,
}

#[derive(Debug, Deserialize)]
pub struct UpdateQuantityRequest {
    pub quantity: i32,
}

#[derive(Debug, Deserialize)]
pub struct MergeCartRequest {
    pub session_id: String,
}

#[derive(Debug, Serialize)]
pub struct CartResponse {
    pub cart_id: i32,
    pub items: Vec<CartItemRow>,
}
