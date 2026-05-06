use axum::{
    routing::{delete, get, post, put},
    Router,
};

use crate::handlers::cart_handler;
use crate::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/api/cart", get(cart_handler::get_cart))
        .route("/api/cart", delete(cart_handler::clear_cart))
        .route("/api/cart/items", post(cart_handler::add_item))
        .route("/api/cart/items/:product_id", put(cart_handler::update_quantity))
        .route("/api/cart/items/:product_id", delete(cart_handler::remove_item))
        .route("/api/cart/merge", post(cart_handler::merge_cart))
}
