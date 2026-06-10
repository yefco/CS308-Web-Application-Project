use axum::http::{
    header::AUTHORIZATION,
    HeaderMap,
};
use chrono::{Duration, Utc};
use jsonwebtoken::{encode, EncodingKey, Header};

use crate::{
    middleware::auth::{decode_jwt, extract_authenticated_user_id},
    services::auth_service::Claims,
    utils::errors::AppError,
};

fn build_token(sub: &str, role: &str, secret: &str) -> String {
    let now = Utc::now();
    let claims = Claims {
        sub: sub.to_string(),
        role: role.to_string(),
        iat: now.timestamp() as usize,
        exp: (now + Duration::hours(1)).timestamp() as usize,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .expect("token generation should succeed")
}

#[test]
fn decode_jwt_returns_claims_for_valid_token() {
    let secret = "batch-3-secret";
    let token = build_token("42", "customer", secret);

    let claims = decode_jwt(&token, secret).expect("token should decode");

    assert_eq!(claims.sub, "42");
    assert_eq!(claims.role, "customer");
}

#[test]
fn extract_authenticated_user_id_reads_valid_bearer_token() {
    let secret = "batch-3-secret";
    let token = build_token("17", "customer", secret);
    let mut headers = HeaderMap::new();
    headers.insert(
        AUTHORIZATION,
        format!("Bearer {token}").parse().expect("header should parse"),
    );

    let user_id = extract_authenticated_user_id(&headers, secret).expect("user id should parse");

    assert_eq!(user_id, 17);
}

#[test]
fn extract_authenticated_user_id_rejects_missing_authorization_header() {
    let headers = HeaderMap::new();

    let error = extract_authenticated_user_id(&headers, "batch-3-secret")
        .expect_err("missing header should fail");

    assert!(matches!(error, AppError::Unauthorized(message) if message == "Authorization header is required"));
}

#[test]
fn extract_authenticated_user_id_rejects_non_bearer_authorization_header() {
    let mut headers = HeaderMap::new();
    headers.insert(AUTHORIZATION, "Basic abc123".parse().expect("header should parse"));

    let error = extract_authenticated_user_id(&headers, "batch-3-secret")
        .expect_err("non-bearer header should fail");

    assert!(matches!(error, AppError::Unauthorized(message) if message == "Authorization header must use Bearer token"));
}

#[test]
fn extract_authenticated_user_id_rejects_non_numeric_subject() {
    let secret = "batch-3-secret";
    let token = build_token("not-a-number", "customer", secret);
    let mut headers = HeaderMap::new();
    headers.insert(
        AUTHORIZATION,
        format!("Bearer {token}").parse().expect("header should parse"),
    );

    let error = extract_authenticated_user_id(&headers, secret)
        .expect_err("non-numeric subject should fail");

    assert!(matches!(error, AppError::Unauthorized(message) if message == "Invalid token subject"));
}
