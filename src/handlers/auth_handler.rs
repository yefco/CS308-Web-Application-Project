//! # Authentication Handlers
//!
//! Axum handler functions for the authentication endpoints and
//! the public main page. Each handler:
//!
//! 1. Extracts the request payload via Axum's typed extractors.
//! 2. Delegates to `AuthService` for business logic.
//! 3. Maps the `Result` to an appropriate HTTP response.
//!
//! Handlers should contain zero business logic — they are the
//! thin HTTP boundary of the application.

use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    Json,
};

use crate::models::user::{LoginRequest, SignUpRequest};
use crate::utils::errors::AppError;
use crate::AppState;

// ─── Sign Up ─────────────────────────────────────────────────

/// `POST /api/auth/sign-up`
///
/// Creates a new customer account.
///
/// **Request body** (`application/json`):
/// ```json
/// {
///   "name": "John Doe",
///   "email": "john@example.com",
///   "password": "securepassword"
/// }
/// ```
///
/// **Success response** (`201 Created`):
/// Returns an `AuthResponse` with JWT token and user data.
///
/// **Error responses**:
/// - `409 Conflict` — email already registered.
/// - `500 Internal` — unexpected server error.
pub async fn sign_up(
    State(state): State<AppState>,
    Json(payload): Json<SignUpRequest>,
) -> Result<impl IntoResponse, AppError> {
    let response = state.auth_service.sign_up(payload).await?;
    Ok((StatusCode::CREATED, Json(response)))
}

// ─── Login ───────────────────────────────────────────────────

/// `POST /api/auth/login`
///
/// Authenticates a user and returns a JWT token.
///
/// **Request body** (`application/json`):
/// ```json
/// {
///   "email": "john@example.com",
///   "password": "securepassword"
/// }
/// ```
///
/// **Success response** (`200 OK`):
/// Returns an `AuthResponse` with JWT token and user data.
///
/// **Error responses**:
/// - `401 Unauthorized` — invalid credentials.
pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<impl IntoResponse, AppError> {
    let response = state.auth_service.login(payload).await?;
    Ok((StatusCode::OK, Json(response)))
}

// ─── Main Page ───────────────────────────────────────────────

/// `GET /`
///
/// Public health-check / landing endpoint. Returns basic API
/// information. No authentication required.
///
/// In production, this could return a list of featured products
/// or redirect to the frontend's main page.
pub async fn main_page() -> impl IntoResponse {
    Json(serde_json::json!({
        "status": "ok",
        "message": "Welcome to the Online Store API",
        "version": env!("CARGO_PKG_VERSION"),
        "endpoints": {
            "sign_up": "POST /api/auth/sign-up",
            "login":   "POST /api/auth/login",
        }
    }))
}