use axum::{
    routing::{delete, get, patch, post, put},
    Router,
};

use crate::handlers::product_handler;
use crate::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        // Public
        .route("/api/products", get(product_handler::list_products))
        .route(
            "/api/products/:product_id",
            get(product_handler::get_product),
        )
        .route("/api/categories", get(product_handler::list_categories))
        .route(
            "/api/categories/:category_id",
            get(product_handler::get_category),
        )
        // Product Manager only
        .route("/api/products", post(product_handler::create_product))
        .route(
            "/api/products/:product_id",
            put(product_handler::update_product),
        )
        .route(
            "/api/products/:product_id/stock",
            patch(product_handler::update_stock),
        )
        .route(
            "/api/products/:product_id",
            delete(product_handler::delete_product),
        )
        .route("/api/categories", post(product_handler::create_category))
        .route(
            "/api/categories/:category_id",
            put(product_handler::update_category),
        )
        .route(
            "/api/categories/:category_id",
            delete(product_handler::delete_category),
        )
}
