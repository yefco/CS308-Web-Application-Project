use axum::{
    extract::State,
    http::HeaderMap,
    response::IntoResponse,
    Json,
};

use crate::middleware::auth::extract_authenticated_user_id;
use crate::models::notification::NotificationsResponse;
use crate::repository::notification_repository;
use crate::utils::errors::AppError;
use crate::AppState;

/// GET /api/notifications — list notifications for the authenticated user.
pub async fn list_notifications(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, AppError> {
    let user_id = extract_authenticated_user_id(&headers, &state.jwt_secret)?;

    let notifications = notification_repository::list_for_user(&state.pool, user_id)
        .await
        .map_err(AppError::from)?;

    let unread_count = notification_repository::unread_count(&state.pool, user_id)
        .await
        .map_err(AppError::from)?;

    Ok(Json(NotificationsResponse {
        notifications,
        unread_count,
    }))
}

/// PATCH /api/notifications/read — mark all notifications as read.
pub async fn mark_all_read(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, AppError> {
    let user_id = extract_authenticated_user_id(&headers, &state.jwt_secret)?;

    notification_repository::mark_all_read(&state.pool, user_id)
        .await
        .map_err(AppError::from)?;

    Ok(Json(serde_json::json!({ "status": "ok" })))
}
