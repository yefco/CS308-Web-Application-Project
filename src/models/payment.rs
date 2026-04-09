use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, FromRow)]
pub struct PaymentMethod {
    pub payment_id: i32,
    pub card_holder_name: String,
    pub card_number: String,
    pub expire_month: i32,
    pub expire_year: i32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreatePaymentMethodRequest {
    pub card_holder_name: String,
    pub card_number: String,
    pub expire_month: i32,
    pub expire_year: i32,
    pub cvv: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePaymentMethodRequest {
    pub card_holder_name: String,
    pub card_number: String,
    pub expire_month: i32,
    pub expire_year: i32,
    pub cvv: String,
}

#[derive(Debug, Serialize)]
pub struct PaymentMethodResponse {
    pub payment_id: i32,
    pub card_holder_name: String,
    pub masked_card_number: String,
    pub last_four: String,
    pub expire_month: i32,
    pub expire_year: i32,
    pub created_at: DateTime<Utc>,
    pub expired: bool,
}

#[derive(Debug, Serialize)]
pub struct PaymentMethodsResponse {
    pub payment_methods: Vec<PaymentMethodResponse>,
}
