//! # Application Configuration
//!
//! Loads all runtime configuration from environment variables.
//! Values are read once at startup and stored in an immutable
//! `AppConfig` struct that is shared across the application.
//!
//! Required env vars are listed in `.env.example`.

/// Holds all configuration values needed by the application.
///
/// This struct is constructed once in `main.rs` and parts of it
/// are passed into services that need them (e.g., `jwt_secret`
/// goes to `AuthService`, `database_url` goes to the DB pool).
#[derive(Debug, Clone)]
pub struct AppConfig {
    /// PostgreSQL connection string.
    pub database_url: String,

    /// Address the server binds to (e.g., "0.0.0.0").
    pub server_host: String,

    /// Port the server listens on.
    pub server_port: u16,

    /// Secret key used to sign and verify JWT tokens.
    /// Must be kept confidential in production.
    pub jwt_secret: String,

    /// How many hours a JWT token stays valid.
    pub jwt_expiration_hours: i64,
}

impl AppConfig {
    /// Reads configuration from environment variables.
    ///
    /// # Panics
    /// Panics on startup if a required variable is missing,
    /// which is intentional — fail fast rather than at runtime.
    pub fn from_env() -> Self {
        Self {
            database_url: std::env::var("DATABASE_URL").expect("DATABASE_URL must be set"),

            server_host: std::env::var("SERVER_HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),

            server_port: std::env::var("SERVER_PORT")
                .unwrap_or_else(|_| "3000".to_string())
                .parse()
                .expect("SERVER_PORT must be a valid u16"),

            jwt_secret: std::env::var("JWT_SECRET").expect("JWT_SECRET must be set"),

            jwt_expiration_hours: std::env::var("JWT_EXPIRATION_HOURS")
                .unwrap_or_else(|_| "24".to_string())
                .parse()
                .expect("JWT_EXPIRATION_HOURS must be a valid integer"),
        }
    }
}
