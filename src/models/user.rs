//! # User Models
//!
//! Data structures for the `users` table. Separated into:
//! - **Domain model** (`User`) — full row as stored in the DB.
//! - **Request DTOs** — what the client sends to us.
//! - **Response DTOs** — what we send back (never includes secrets).
//!
//! The `sqlx::FromRow` derive lets SQLx map query results directly
//! into these structs without manual deserialization.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

// ─── Role Enum ───────────────────────────────────────────────

/// Maps to the PostgreSQL `user_role` enum defined in schema.sql.
/// SQLx handles the conversion automatically via `sqlx::Type`.
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "user_role", rename_all = "snake_case")]
pub enum UserRole {
    Customer,
    SalesManager,
    ProductManager,
}

// ─── Domain Model ────────────────────────────────────────────

/// Full user row from the database.
/// Contains `password_hash` — never expose this to the client.
#[derive(Debug, Clone, FromRow)]
pub struct User {
    pub user_id: i32,
    pub user_name: String,
    pub email: String,
    pub password_hash: String,
    pub role: UserRole,
    pub tax_id: Option<String>,
    pub home_address: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ─── Request DTOs ────────────────────────────────────────────

/// Payload for `POST /api/auth/sign-up`.
#[derive(Debug, Deserialize)]
pub struct SignUpRequest {
    pub user_name: String,
    pub email: String,
    pub password: String,
    pub tax_id: String,
    pub home_address: String,
}

/// Payload for `POST /api/auth/login`.
#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

// ─── Response DTOs ───────────────────────────────────────────

/// Safe user representation returned to the client.
/// Intentionally excludes `password_hash`.
#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub user_id: i32,
    pub user_name: String,
    pub email: String,
    pub role: UserRole,
    pub tax_id: Option<String>,
    pub home_address: Option<String>,
    pub created_at: DateTime<Utc>,
}

/// Returned after a successful sign-up or login.
#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: UserResponse,
}

// ─── Conversions ─────────────────────────────────────────────

/// Converts a full `User` into a client-safe `UserResponse`.
/// This is the single point where sensitive fields are stripped.
impl From<User> for UserResponse {
    fn from(user: User) -> Self {
        Self {
            user_id: user.user_id,
            user_name: user.user_name,
            email: user.email,
            role: user.role,
            tax_id: user.tax_id,
            home_address: user.home_address,
            created_at: user.created_at,
        }
    }
}
