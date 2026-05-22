use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, FromRow)]
pub struct WishlistItemRow {
    pub wishlist_item_id: i32,
    pub user_id: i32,
    pub product_id: i32,
    pub product_name: String,
    pub description: Option<String>,
    pub stock_quantity: i32,
    pub price: f64,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct AddWishlistItemRequest {
    pub product_id: i32,
}

#[derive(Debug, Serialize)]
pub struct WishlistItemResponse {
    pub wishlist_item_id: i32,
    pub product_id: i32,
    pub product_name: String,
    pub description: Option<String>,
    pub stock_quantity: i32,
    pub price: f64,
    pub saved_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct WishlistResponse {
    pub items: Vec<WishlistItemResponse>,
}

impl From<WishlistItemRow> for WishlistItemResponse {
    fn from(row: WishlistItemRow) -> Self {
        Self {
            wishlist_item_id: row.wishlist_item_id,
            product_id: row.product_id,
            product_name: row.product_name,
            description: row.description,
            stock_quantity: row.stock_quantity,
            price: row.price,
            saved_at: row.created_at,
        }
    }
}
