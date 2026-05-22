use axum::{
    routing::{delete, get, post},
    Router,
};

use crate::handlers::wishlist_handler;
use crate::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/api/wishlist", get(wishlist_handler::list_items))
        .route("/api/wishlist/items", post(wishlist_handler::add_item))
        .route(
            "/api/wishlist/items/:product_id",
            delete(wishlist_handler::remove_item),
        )
}
