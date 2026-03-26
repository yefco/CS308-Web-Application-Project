//! # Authentication Routes
//!
//! Defines the URL → handler mapping for authentication endpoints
//! and the public main page. This module returns a `Router` that
//! is merged into the top-level router in `main.rs`.
//!
//! # Route Table
//!
//! | Method | Path                | Handler      | Auth Required |
//! |--------|---------------------|--------------|---------------|
//! | GET    | `/`                 | `main_page`  | No            |
//! | POST   | `/api/auth/sign-up` | `sign_up`    | No            |
//! | POST   | `/api/auth/login`   | `login`      | No            |

use axum::{
    routing::{get, post},
    Router,
};

use crate::handlers::auth_handler;
use crate::AppState;

/// Builds and returns the auth router.
///
/// All routes defined here are public (no JWT required).
/// Protected routes will be added in future modules with
/// middleware layers applied.
pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(auth_handler::main_page))
        .route("/api/auth/sign-up", post(auth_handler::sign_up))
        .route("/api/auth/login", post(auth_handler::login))
}