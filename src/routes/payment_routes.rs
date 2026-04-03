use axum::{
    routing::{delete, get, post, put},
    Router,
};

use crate::handlers::payment_handler;
use crate::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route(
            "/api/payment-methods",
            get(payment_handler::list_payment_methods),
        )
        .route(
            "/api/payment-methods",
            post(payment_handler::create_payment_method),
        )
        .route(
            "/api/payment-methods/:payment_id",
            get(payment_handler::get_payment_method),
        )
        .route(
            "/api/payment-methods/:payment_id",
            put(payment_handler::update_payment_method),
        )
        .route(
            "/api/payment-methods/:payment_id",
            delete(payment_handler::delete_payment_method),
        )
}
