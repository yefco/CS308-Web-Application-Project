use chrono::{TimeZone, Utc};

use crate::models::{
    product::{Product, ProductResponse},
    review::{PendingReviewResponse, PendingReviewRow, ReviewResponse, ReviewRow},
    user::{User, UserResponse, UserRole},
};

#[test]
fn product_response_keeps_original_price_without_discount() {
    let product = Product {
        product_id: 1,
        category_id: 2,
        product_name: "Laptop".into(),
        model: Some("L-100".into()),
        serial_number: Some("SN-1".into()),
        description: Some("Basic laptop".into()),
        stock_quantity: 5,
        price: 999.99,
        discount_percent: 0.0,
        warranty_status: true,
        distributor_info: Some("Distributor A".into()),
        created_at: Utc.with_ymd_and_hms(2026, 1, 10, 8, 30, 0).unwrap(),
    };

    let response = ProductResponse::from(product);

    assert_eq!(response.price, 999.99);
    assert_eq!(response.discounted_price, 999.99);
}

#[test]
fn product_response_rounds_discounted_price_to_two_decimals() {
    let product = Product {
        product_id: 2,
        category_id: 3,
        product_name: "Monitor".into(),
        model: None,
        serial_number: None,
        description: None,
        stock_quantity: 8,
        price: 19.99,
        discount_percent: 12.5,
        warranty_status: false,
        distributor_info: None,
        created_at: Utc.with_ymd_and_hms(2026, 2, 1, 12, 0, 0).unwrap(),
    };

    let response = ProductResponse::from(product);

    assert_eq!(response.discounted_price, 17.49);
}

#[test]
fn user_response_from_user_copies_public_fields() {
    let user = User {
        user_id: 7,
        user_name: "alice".into(),
        email: "alice@example.com".into(),
        password_hash: "secret-hash".into(),
        role: UserRole::Customer,
        tax_id: Some("1234567890".into()),
        home_address: Some("Ankara".into()),
        created_at: Utc.with_ymd_and_hms(2026, 3, 5, 14, 0, 0).unwrap(),
        updated_at: Utc.with_ymd_and_hms(2026, 3, 5, 14, 0, 0).unwrap(),
    };

    let response = UserResponse::from(user);

    assert_eq!(response.user_id, 7);
    assert_eq!(response.user_name, "alice");
    assert_eq!(response.email, "alice@example.com");
    assert_eq!(response.role, UserRole::Customer);
    assert_eq!(response.tax_id.as_deref(), Some("1234567890"));
    assert_eq!(response.home_address.as_deref(), Some("Ankara"));
}

#[test]
fn review_response_from_review_row_maps_fields() {
    let row = ReviewRow {
        review_id: 11,
        product_id: 3,
        user_id: 4,
        user_name: "bob".into(),
        rating: 5,
        comment: Some("Works well".into()),
        created_at: Utc.with_ymd_and_hms(2026, 4, 1, 9, 15, 0).unwrap(),
    };

    let response = ReviewResponse::from(row);

    assert_eq!(response.review_id, 11);
    assert_eq!(response.user_name, "bob");
    assert_eq!(response.rating, 5);
    assert_eq!(response.comment.as_deref(), Some("Works well"));
}

#[test]
fn pending_review_response_renames_review_fields_for_manager_view() {
    let row = PendingReviewRow {
        review_id: 15,
        product_id: 9,
        product_name: "Keyboard".into(),
        user_id: 6,
        user_name: "carol".into(),
        rating: 4,
        comment: Some("Needs better packaging".into()),
        created_at: Utc.with_ymd_and_hms(2026, 4, 20, 16, 45, 0).unwrap(),
    };

    let response = PendingReviewResponse::from(row);

    assert_eq!(response.comment_id, 15);
    assert_eq!(response.product_id, 9);
    assert_eq!(response.product_name, "Keyboard");
    assert_eq!(response.customer_name, "carol");
    assert_eq!(response.comment_text.as_deref(), Some("Needs better packaging"));
    assert_eq!(response.rating, 4);
}
