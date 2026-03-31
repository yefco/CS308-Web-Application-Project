//! # Authentication Service
//!
//! Business logic for user registration and login. This layer
//! sits between handlers and the repository:
//!
//!   Handler → AuthService → UserRepository → PostgreSQL
//!
//! Responsibilities:
//! - Hashing passwords with bcrypt before storage.
//! - Verifying passwords during login.
//! - Issuing signed JWT tokens on successful auth.

use chrono::{Duration, Utc};
use jsonwebtoken::{encode, EncodingKey, Header};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use crate::models::user::{AuthResponse, LoginRequest, SignUpRequest, User, UserResponse};
use crate::repository::user_repository;
use crate::utils::errors::AppError;

// ─── JWT Claims ──────────────────────────────────────────────

/// The payload embedded inside every JWT token.
///
/// - `sub`: the user's UUID (subject).
/// - `role`: the user's role string, used for authorization.
/// - `exp`: expiration timestamp (seconds since UNIX epoch).
/// - `iat`: issued-at timestamp.
#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub role: String,
    pub exp: usize,
    pub iat: usize,
}

// ─── Service ─────────────────────────────────────────────────

/// Core authentication service.
///
/// Holds a reference to the database pool and the JWT secret.
/// Cloned cheaply when stored in `AppState`.
#[derive(Clone)]
pub struct AuthService {
    pool: PgPool,
    jwt_secret: String,
    jwt_expiration_hours: i64,
}

impl AuthService {
    /// Creates a new `AuthService`.
    pub fn new(pool: PgPool, jwt_secret: String, jwt_expiration_hours: i64) -> Self {
        Self {
            pool,
            jwt_secret,
            jwt_expiration_hours,
        }
    }

    /// Registers a new user account.
    ///
    /// # Flow
    /// 1. Check if the email is already taken.
    /// 2. Hash the plaintext password with bcrypt (cost factor 12).
    /// 3. Insert the user row via the repository.
    /// 4. Generate a JWT and return it with the user data.
    pub async fn sign_up(&self, req: SignUpRequest) -> Result<AuthResponse, AppError> {
        // ── Guard: duplicate email ───────────────────────────
        let existing = user_repository::find_by_email(&self.pool, &req.email).await?;
        if existing.is_some() {
            return Err(AppError::Conflict("Email is already registered".into()));
        }

        // ── Hash password ────────────────────────────────────
        let password_hash = bcrypt::hash(&req.password, 12)
            .map_err(|e| AppError::Internal(format!("Password hashing failed: {}", e)))?;

        // ── Persist user ─────────────────────────────────────
        let user = user_repository::create_user(
            &self.pool,
            &req.user_name,
            &req.email,
            &password_hash,
        )
        .await?;

        // ── Issue token ──────────────────────────────────────
        let token = self.generate_token(&user)?;

        Ok(AuthResponse {
            token,
            user: UserResponse::from(user),
        })
    }

    /// Authenticates a user with email and password.
    ///
    /// # Flow
    /// 1. Look up the user by email.
    /// 2. Verify the plaintext password against the bcrypt hash.
    /// 3. Generate and return a JWT.
    pub async fn login(&self, req: LoginRequest) -> Result<AuthResponse, AppError> {
        // ── Find user ────────────────────────────────────────
        let user = user_repository::find_by_email(&self.pool, &req.email)
            .await?
            .ok_or_else(|| AppError::Unauthorized("Invalid email or password".into()))?;

        // ── Verify password ──────────────────────────────────
        let valid = bcrypt::verify(&req.password, &user.password_hash)
            .map_err(|e| AppError::Internal(format!("Password verification failed: {}", e)))?;

        if !valid {
            return Err(AppError::Unauthorized("Invalid email or password".into()));
        }

        // ── Issue token ──────────────────────────────────────
        let token = self.generate_token(&user)?;

        Ok(AuthResponse {
            token,
            user: UserResponse::from(user),
        })
    }

    /// Creates a signed JWT for the given user.
    ///
    /// The token encodes the user's ID and role, and expires
    /// after the configured number of hours.
    fn generate_token(&self, user: &User) -> Result<String, AppError> {
        let now = Utc::now();
        let expiration = now + Duration::hours(self.jwt_expiration_hours);

        let claims = Claims {
            sub: user.user_id.to_string(),
            role: format!("{:?}", user.role).to_lowercase(),
            iat: now.timestamp() as usize,
            exp: expiration.timestamp() as usize,
        };

        encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.jwt_secret.as_bytes()),
        )
        .map_err(|e| AppError::Internal(format!("Token generation failed: {}", e)))
    }
}