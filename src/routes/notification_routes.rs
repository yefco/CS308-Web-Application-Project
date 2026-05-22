use axum::{
    routing::{get, patch},
    Router,
};

use crate::handlers::notification_handler;
use crate::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route(
            "/api/notifications",
            get(notification_handler::list_notifications),
        )
        .route(
            "/api/notifications/read",
            patch(notification_handler::mark_all_read),
        )
}
