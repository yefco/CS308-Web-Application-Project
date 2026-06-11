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
    Forbidden(String),
    NotFound(String),
    Conflict(String),
    Internal(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg),
            AppError::Unauthorized(msg) => (StatusCode::UNAUTHORIZED, msg),
            AppError::Forbidden(msg) => (StatusCode::FORBIDDEN, msg),
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
            match db_err.code().as_deref() {
                Some("23505") => {
                    return AppError::Conflict("A record with that value already exists".to_string());
                }
                Some("23503") => {
                    return AppError::Conflict(
                        "Cannot delete: this record is referenced by existing data (e.g. orders)".to_string(),
                    );
                }
                _ => {}
            }
        }
        tracing::error!("Database error: {:?}", err);
        AppError::Internal("An internal error occurred".to_string())
    }
}

#[cfg(test)]
mod tests {
    use axum::{
        body::to_bytes,
        http::StatusCode,
        response::IntoResponse,
    };

    use super::AppError;

    async fn assert_error_response(error: AppError, expected_status: StatusCode, expected_body: &str) {
        let response = error.into_response();
        assert_eq!(response.status(), expected_status);

        let body = to_bytes(response.into_body(), usize::MAX)
            .await
            .expect("response body should be readable");
        assert_eq!(
            String::from_utf8(body.to_vec()).expect("response body should be valid utf-8"),
            expected_body
        );
    }

    #[tokio::test]
    async fn bad_request_maps_to_400_with_json_body() {
        assert_error_response(
            AppError::BadRequest("invalid input".into()),
            StatusCode::BAD_REQUEST,
            r#"{"error":"invalid input"}"#,
        )
        .await;
    }

    #[tokio::test]
    async fn unauthorized_maps_to_401_with_json_body() {
        assert_error_response(
            AppError::Unauthorized("login required".into()),
            StatusCode::UNAUTHORIZED,
            r#"{"error":"login required"}"#,
        )
        .await;
    }

    #[tokio::test]
    async fn forbidden_maps_to_403_with_json_body() {
        assert_error_response(
            AppError::Forbidden("access denied".into()),
            StatusCode::FORBIDDEN,
            r#"{"error":"access denied"}"#,
        )
        .await;
    }

    #[tokio::test]
    async fn not_found_maps_to_404_with_json_body() {
        assert_error_response(
            AppError::NotFound("product not found".into()),
            StatusCode::NOT_FOUND,
            r#"{"error":"product not found"}"#,
        )
        .await;
    }

    #[tokio::test]
    async fn internal_maps_to_500_with_json_body() {
        assert_error_response(
            AppError::Internal("unexpected failure".into()),
            StatusCode::INTERNAL_SERVER_ERROR,
            r#"{"error":"unexpected failure"}"#,
        )
        .await;
    }
}
