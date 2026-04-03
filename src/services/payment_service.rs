use bcrypt::DEFAULT_COST;
use chrono::{Datelike, Utc};
use sqlx::PgPool;

use crate::models::payment::{
    CreatePaymentMethodRequest, PaymentMethod, PaymentMethodResponse, PaymentMethodsResponse,
    UpdatePaymentMethodRequest,
};
use crate::repository::payment_repository;
use crate::utils::errors::AppError;

#[derive(Clone)]
pub struct PaymentService {
    pool: PgPool,
}

struct SanitizedPaymentMethod {
    card_holder_name: String,
    masked_card_number: String,
    expire_month: i32,
    expire_year: i32,
    cvv_hash: String,
}

impl PaymentService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn list_payment_methods(
        &self,
        user_id: i32,
    ) -> Result<PaymentMethodsResponse, AppError> {
        let payment_methods = payment_repository::list_for_user(&self.pool, user_id)
            .await?
            .into_iter()
            .map(Self::to_response)
            .collect();

        Ok(PaymentMethodsResponse { payment_methods })
    }

    pub async fn get_payment_method(
        &self,
        user_id: i32,
        payment_id: i32,
    ) -> Result<PaymentMethodResponse, AppError> {
        let payment_method = payment_repository::find_for_user(&self.pool, user_id, payment_id)
            .await?
            .ok_or_else(|| AppError::NotFound("Payment method not found".into()))?;

        Ok(Self::to_response(payment_method))
    }

    pub async fn create_payment_method(
        &self,
        user_id: i32,
        req: CreatePaymentMethodRequest,
    ) -> Result<PaymentMethodResponse, AppError> {
        let sanitized = self.sanitize_payment_method(
            &req.card_holder_name,
            &req.card_number,
            req.expire_month,
            req.expire_year,
            &req.cvv,
        )?;

        let payment_method = payment_repository::create_payment_method(
            &self.pool,
            user_id,
            &sanitized.card_holder_name,
            &sanitized.masked_card_number,
            sanitized.expire_month,
            sanitized.expire_year,
            &sanitized.cvv_hash,
        )
        .await?;

        Ok(Self::to_response(payment_method))
    }

    pub async fn update_payment_method(
        &self,
        user_id: i32,
        payment_id: i32,
        req: UpdatePaymentMethodRequest,
    ) -> Result<PaymentMethodResponse, AppError> {
        let sanitized = self.sanitize_payment_method(
            &req.card_holder_name,
            &req.card_number,
            req.expire_month,
            req.expire_year,
            &req.cvv,
        )?;

        let payment_method = payment_repository::update_payment_method(
            &self.pool,
            user_id,
            payment_id,
            &sanitized.card_holder_name,
            &sanitized.masked_card_number,
            sanitized.expire_month,
            sanitized.expire_year,
            &sanitized.cvv_hash,
        )
        .await?
        .ok_or_else(|| AppError::NotFound("Payment method not found".into()))?;

        Ok(Self::to_response(payment_method))
    }

    pub async fn delete_payment_method(
        &self,
        user_id: i32,
        payment_id: i32,
    ) -> Result<(), AppError> {
        let deleted =
            payment_repository::delete_payment_method(&self.pool, user_id, payment_id).await?;

        if !deleted {
            return Err(AppError::NotFound("Payment method not found".into()));
        }

        Ok(())
    }

    fn sanitize_payment_method(
        &self,
        card_holder_name: &str,
        card_number: &str,
        expire_month: i32,
        expire_year: i32,
        cvv: &str,
    ) -> Result<SanitizedPaymentMethod, AppError> {
        let holder = card_holder_name.trim();
        if holder.is_empty() {
            return Err(AppError::BadRequest("Card holder name is required".into()));
        }
        if holder.len() > 100 {
            return Err(AppError::BadRequest(
                "Card holder name must be at most 100 characters".into(),
            ));
        }

        if !(1..=12).contains(&expire_month) {
            return Err(AppError::BadRequest(
                "Expiration month must be between 1 and 12".into(),
            ));
        }

        let now = Utc::now();
        let current_year = now.year();
        let current_month = now.month() as i32;

        if expire_year < 1000 {
            return Err(AppError::BadRequest(
                "Expiration year must be a four-digit year".into(),
            ));
        }
        if expire_year > current_year + 30 {
            return Err(AppError::BadRequest(
                "Expiration year is unrealistically far in the future".into(),
            ));
        }
        if is_expired_against(expire_month, expire_year, current_year, current_month) {
            return Err(AppError::BadRequest("Card is expired".into()));
        }

        let normalized_card_number = normalize_digits(card_number);
        if !(13..=19).contains(&normalized_card_number.len()) {
            return Err(AppError::BadRequest(
                "Card number must contain 13 to 19 digits".into(),
            ));
        }
        if !luhn_check(&normalized_card_number) {
            return Err(AppError::BadRequest("Card number is invalid".into()));
        }

        let normalized_cvv = normalize_digits(cvv);
        if !(3..=4).contains(&normalized_cvv.len()) {
            return Err(AppError::BadRequest(
                "CVV must contain 3 or 4 digits".into(),
            ));
        }

        let cvv_hash = bcrypt::hash(&normalized_cvv, DEFAULT_COST)
            .map_err(|e| AppError::Internal(format!("Failed to hash CVV: {e}")))?;

        Ok(SanitizedPaymentMethod {
            card_holder_name: holder.to_string(),
            masked_card_number: mask_card_number(&normalized_card_number),
            expire_month,
            expire_year,
            cvv_hash,
        })
    }

    fn to_response(payment_method: PaymentMethod) -> PaymentMethodResponse {
        let now = Utc::now();
        let expired = is_expired_against(
            payment_method.expire_month,
            payment_method.expire_year,
            now.year(),
            now.month() as i32,
        );
        let last_four = extract_last_four(&payment_method.card_number);

        PaymentMethodResponse {
            payment_id: payment_method.payment_id,
            card_holder_name: payment_method.card_holder_name,
            masked_card_number: payment_method.card_number,
            last_four,
            expire_month: payment_method.expire_month,
            expire_year: payment_method.expire_year,
            created_at: payment_method.created_at,
            expired,
        }
    }
}

fn normalize_digits(value: &str) -> String {
    value.chars().filter(|ch| ch.is_ascii_digit()).collect()
}

fn mask_card_number(card_number: &str) -> String {
    let last_four = &card_number[card_number.len() - 4..];
    format!("**** **** **** {last_four}")
}

fn extract_last_four(masked_card_number: &str) -> String {
    let digits = normalize_digits(masked_card_number);
    if digits.len() >= 4 {
        digits[digits.len() - 4..].to_string()
    } else {
        digits
    }
}

fn is_expired_against(
    expire_month: i32,
    expire_year: i32,
    current_year: i32,
    current_month: i32,
) -> bool {
    expire_year < current_year || (expire_year == current_year && expire_month < current_month)
}

fn luhn_check(card_number: &str) -> bool {
    let mut sum = 0;
    let mut should_double = false;

    for ch in card_number.chars().rev() {
        let Some(mut digit) = ch.to_digit(10) else {
            return false;
        };

        if should_double {
            digit *= 2;
            if digit > 9 {
                digit -= 9;
            }
        }

        sum += digit;
        should_double = !should_double;
    }

    sum > 0 && sum % 10 == 0
}

#[cfg(test)]
mod tests {
    use super::{
        extract_last_four, is_expired_against, luhn_check, mask_card_number, normalize_digits,
    };

    #[test]
    fn normalizes_card_digits() {
        assert_eq!(normalize_digits("4111-1111 1111 1111"), "4111111111111111");
    }

    #[test]
    fn accepts_valid_luhn_numbers() {
        assert!(luhn_check("4111111111111111"));
        assert!(luhn_check("4242424242424242"));
    }

    #[test]
    fn rejects_invalid_luhn_numbers() {
        assert!(!luhn_check("4111111111111112"));
    }

    #[test]
    fn masks_only_last_four_digits() {
        assert_eq!(mask_card_number("4111111111111111"), "**** **** **** 1111");
        assert_eq!(extract_last_four("**** **** **** 1111"), "1111");
    }

    #[test]
    fn detects_expired_cards() {
        assert!(is_expired_against(3, 2026, 2026, 4));
        assert!(!is_expired_against(4, 2026, 2026, 4));
        assert!(!is_expired_against(12, 2027, 2026, 4));
    }
}
