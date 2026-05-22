use axum::{
    routing::{get, post, put},
    Router,
};

use crate::handlers::order_handler;
use crate::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        // Customer-facing order endpoints
        .route("/api/orders", post(order_handler::place_order))
        .route("/api/orders", get(order_handler::list_orders))
        .route("/api/orders/:order_id", get(order_handler::get_order))
        .route(
            "/api/orders/:order_id/cancel",
            post(order_handler::cancel_order),
        )
        .route(
            "/api/orders/:order_id/return",
            post(order_handler::return_order),
        )
        // Mock invoice email (demo-safe)
        .route(
            "/api/orders/:order_id/send-invoice-email",
            post(order_handler::send_invoice_email),
        )
        // Delivery department endpoints (sales_manager role required)
        .route("/api/delivery/orders", get(order_handler::list_all_orders))
        .route(
            "/api/delivery/orders/:order_id/status",
            put(order_handler::update_delivery_status),
        )
}
