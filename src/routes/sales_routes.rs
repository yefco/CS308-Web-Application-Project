use axum::{
    routing::{get, patch, put},
    Router,
};

use crate::handlers::sales_handler;
use crate::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        // Discount
        .route(
            "/api/products/:id/discount",
            patch(sales_handler::set_discount),
        )
        // Revenue & invoices
        .route("/api/sales/revenue", get(sales_handler::get_revenue_report))
        .route("/api/sales/invoices", get(sales_handler::list_invoices))
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
