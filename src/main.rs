//! # Online Store — Application Entry Point
//!
//! This is where everything comes together:
//! 1. Load environment variables and configuration.
//! 2. Initialize the PostgreSQL connection pool. <- KAAN
//! 3. Construct shared application state (services).
//! 4. Build the Axum router with all route groups. <- Should work now, but is vulnerable. Requires a second look in more depth.
//! 5. Bind to the configured address and start serving.
//!
//! To run the server:
//! cargo run

mod config;
mod database;
mod handlers;
mod middleware;
mod models;
mod repository;
mod routes;
mod services;
mod utils;

use std::net::SocketAddr;

use axum::Router;
use tokio::net::TcpListener;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;

use crate::config::app_config::AppConfig;
use crate::database::db;
use crate::routes::{auth_routes, cart_routes, order_routes, payment_routes};
use crate::services::auth_service::AuthService;
use crate::services::cart_service::CartService;
use crate::services::order_service::OrderService;
use crate::services::payment_service::PaymentService;

// ─── Shared Application State ────────────────────────────────

/// Shared state injected into every handler via Axum's `State`
/// extractor. Add new services here as the project grows.
///
/// `Clone` is derived because Axum clones the state for each
/// request. All inner types are either `Clone`-cheap (like `PgPool`,
/// which is an `Arc` internally) or wrapped in `Arc`.
#[derive(Clone)]
pub struct AppState {
    pub auth_service: AuthService,
    pub cart_service: CartService,
    pub order_service: OrderService,
    pub payment_service: PaymentService,
    pub jwt_secret: String,
}

// ─── Main ────────────────────────────────────────────────────

#[tokio::main]
async fn main() {
    // ── Initialize logging ───────────────────────────────────
    tracing_subscriber::fmt()
        .with_target(false)
        .compact()
        .init();

    // ── Load .env file (if present) ──────────────────────────
    dotenvy::dotenv().ok();

    // ── Load configuration ───────────────────────────────────
    let config = AppConfig::from_env();

    // ── Connect to PostgreSQL ────────────────────────────────
    tracing::info!("Connecting to database...");
    let pool = db::init_pool(&config.database_url).await;
    tracing::info!("Database connected.");

    // ── Build services ───────────────────────────────────────
    let auth_service = AuthService::new(
        pool.clone(),
        config.jwt_secret.clone(),
        config.jwt_expiration_hours,
    );
    let cart_service = CartService::new(pool.clone());
    let order_service = OrderService::new(pool.clone());
    let payment_service = PaymentService::new(pool.clone());

    let state = AppState {
        auth_service,
        cart_service,
        order_service,
        payment_service,
        jwt_secret: config.jwt_secret.clone(),
    };

    // ── Build router ─────────────────────────────────────────
    // CORS is configured to allow any origin during development.
    // Restrict this to your frontend's domain in production.
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .merge(auth_routes::routes())
        .merge(cart_routes::routes())
        .merge(order_routes::routes())
        .merge(payment_routes::routes())
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    // ── Start server ─────────────────────────────────────────
    let addr = SocketAddr::from(([0, 0, 0, 0], config.server_port));
    tracing::info!("Server listening on {}", addr);

    let listener = TcpListener::bind(addr)
        .await
        .expect("Failed to bind to address");

    axum::serve(listener, app)
        .await
        .expect("Server failed to start");
}
