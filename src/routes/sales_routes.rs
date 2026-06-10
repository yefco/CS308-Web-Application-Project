use axum::{
    routing::{get, patch, put},
    Router,
};

use crate::handlers::sales_handler;
use crate::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        // Price
        .route(
            "/api/products/:id/price",
            patch(sales_handler::set_price),
        )

        // Discount
        .route(
            "/api/products/:id/discount",
            patch(sales_handler::set_discount),
        )

        // Revenue
        .route(
            "/api/sales/revenue",
            get(sales_handler::get_revenue_report),
        )

        // Invoices
        // Sales manager eski endpoint üzerinden görebilir.
        .route(
            "/api/sales/invoices",
            get(sales_handler::list_invoices),
        )
        // Product manager bu endpoint üzerinden invoice görüntüler.
        .route(
            "/api/product-manager/invoices",
            get(sales_handler::list_invoices),
        )

        // Return request management (sales manager)
        .route(
            "/api/returns/pending",
            get(sales_handler::list_pending_returns),
        )
        .route(
            "/api/returns/:id/approve",
            put(sales_handler::approve_return),
        )
        .route(
            "/api/returns/:id/reject",
            put(sales_handler::reject_return),
        )
}