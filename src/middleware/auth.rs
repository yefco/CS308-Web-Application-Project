use axum::http::{header::AUTHORIZATION, HeaderMap};
use jsonwebtoken::{decode, DecodingKey, Validation};

use crate::services::auth_service::Claims;
use crate::utils::errors::AppError;

pub fn decode_jwt(token: &str, secret: &str) -> Result<Claims, AppError> {
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    )
    .map(|d| d.claims)
    .map_err(|_| AppError::Unauthorized("Invalid or expired token".into()))
}

pub fn extract_authenticated_user_id(headers: &HeaderMap, secret: &str) -> Result<i32, AppError> {
    let authorization = headers
        .get(AUTHORIZATION)
        .ok_or_else(|| AppError::Unauthorized("Authorization header is required".into()))?;
    let authorization = authorization
        .to_str()
        .map_err(|_| AppError::Unauthorized("Authorization header is invalid".into()))?;
    let token = authorization.strip_prefix("Bearer ").ok_or_else(|| {
        AppError::Unauthorized("Authorization header must use Bearer token".into())
    })?;

    let claims = decode_jwt(token, secret)?;
    claims
        .sub
        .parse::<i32>()
        .map_err(|_| AppError::Unauthorized("Invalid token subject".into()))
}
