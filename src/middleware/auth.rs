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
