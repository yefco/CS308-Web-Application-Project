//! # Application Errors
//!
//! Defines a unified error type (`AppError`) that can be returned
//! from any handler. Axum's `IntoResponse` implementation converts
//! each variant into the appropriate HTTP status code and JSON body.

use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};

#[derive(Debug)]
pub enum AppError {
    BadRequest(String),
    Unauthorized(String),
    NotFound(String),
    Conflict(String),
    Internal(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg),
            AppError::Unauthorized(msg) => (StatusCode::UNAUTHORIZED, msg),
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
            AppError::Conflict(msg) => (StatusCode::CONFLICT, msg),
            AppError::Internal(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg),
        };
        let body = serde_json::json!({ "error": message });
        (status, Json(body)).into_response()
    }
}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        // Detect PostgreSQL unique constraint violations (code 23505)
        // and return a user-friendly Conflict instead of a 500.
        if let sqlx::Error::Database(ref db_err) = err {
            if db_err.code().as_deref() == Some("23505") {
                return AppError::Conflict("A record with that value already exists".to_string());
            }
        }
        tracing::error!("Database error: {:?}", err);
        AppError::Internal("An internal error occurred".to_string())
    }
}
