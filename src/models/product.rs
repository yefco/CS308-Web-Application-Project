use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct Category {
    pub category_id: i32,
    pub category_name: String,
    pub description: Option<String>,
}

#[derive(Debug, Clone, FromRow)]
pub struct Product {
    pub product_id: i32,
    pub category_id: i32,
    pub product_name: String,
    pub model: Option<String>,
    pub serial_number: Option<String>,
    pub description: Option<String>,
    pub stock_quantity: i32,
    pub price: f64,
    pub discount_percent: f64,
    pub warranty_status: bool,
    pub distributor_info: Option<String>,
    pub created_at: DateTime<Utc>,
}

// ─── Request DTOs ─────────────────────────────────────────────

#[derive(Debug, Deserialize)]
pub struct CreateProductRequest {
    pub category_id: i32,
    pub product_name: String,
    pub model: Option<String>,
    pub serial_number: Option<String>,
    pub description: Option<String>,
    pub stock_quantity: Option<i32>,
    pub price: f64,
    pub warranty_status: Option<bool>,
    pub distributor_info: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProductRequest {
    pub category_id: i32,
    pub product_name: String,
    pub model: Option<String>,
    pub serial_number: Option<String>,
    pub description: Option<String>,
    pub price: f64,
    pub warranty_status: bool,
    pub distributor_info: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct SetDiscountRequest {
    pub discount_percent: f64,
}

#[derive(Debug, Deserialize)]
pub struct UpdateStockRequest {
    pub stock_quantity: i32,
}

#[derive(Debug, Deserialize)]
pub struct CreateCategoryRequest {
    pub category_name: String,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCategoryRequest {
    pub category_name: String,
    pub description: Option<String>,
}

// ─── Response DTOs ────────────────────────────────────────────

#[derive(Debug, Serialize)]
pub struct ProductResponse {
    pub product_id: i32,
    pub category_id: i32,
    pub product_name: String,
    pub model: Option<String>,
    pub serial_number: Option<String>,
    pub description: Option<String>,
    pub stock_quantity: i32,
    pub price: f64,
    pub discount_percent: f64,
    pub discounted_price: f64,
    pub warranty_status: bool,
    pub distributor_info: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct ProductsResponse {
    pub products: Vec<ProductResponse>,
}

#[derive(Debug, Serialize)]
pub struct CategoriesResponse {
    pub categories: Vec<Category>,
}

impl From<Product> for ProductResponse {
    fn from(p: Product) -> Self {
        let discounted_price = if p.discount_percent > 0.0 {
            (p.price * (1.0 - p.discount_percent / 100.0) * 100.0).round() / 100.0
        } else {
            p.price
        };
        Self {
            product_id: p.product_id,
            category_id: p.category_id,
            product_name: p.product_name,
            model: p.model,
            serial_number: p.serial_number,
            description: p.description,
            stock_quantity: p.stock_quantity,
            price: p.price,
            discount_percent: p.discount_percent,
            discounted_price,
            warranty_status: p.warranty_status,
            distributor_info: p.distributor_info,
            created_at: p.created_at,
        }
    }
}
