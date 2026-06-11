use chrono::{TimeZone, Utc};

use crate::models::{
    notification::{Notification, NotificationsResponse},
    order::{OrderItemResponse, OrderResponse, OrderStatus, OrdersResponse},
    payment::{PaymentMethodResponse, PaymentMethodsResponse},
    user::{AuthResponse, UserResponse, UserRole},
    wishlist::{WishlistItemResponse, WishlistResponse},
};

#[test]
fn auth_response_serializes_token_and_nested_user() {
    let response = AuthResponse {
        token: "jwt-token".into(),
        user: UserResponse {
            user_id: 5,
            user_name: "alice".into(),
            email: "alice@example.com".into(),
            role: UserRole::Customer,
            tax_id: Some("1234567890".into()),
            home_address: Some("Ankara".into()),
            created_at: Utc.with_ymd_and_hms(2026, 1, 1, 10, 0, 0).unwrap(),
        },
    };

    let json = serde_json::to_value(&response).expect("response should serialize");

    assert_eq!(json["token"], "jwt-token");
    assert_eq!(json["user"]["user_id"], 5);
    assert_eq!(json["user"]["email"], "alice@example.com");
}

#[test]
fn payment_methods_response_serializes_last_four_and_expired_flag() {
    let response = PaymentMethodsResponse {
        payment_methods: vec![PaymentMethodResponse {
            payment_id: 9,
            card_holder_name: "Alice Example".into(),
            masked_card_number: "**** **** **** 4242".into(),
            last_four: "4242".into(),
            expire_month: 12,
            expire_year: 2028,
            created_at: Utc.with_ymd_and_hms(2026, 2, 2, 8, 30, 0).unwrap(),
            expired: false,
        }],
    };

    let json = serde_json::to_value(&response).expect("response should serialize");

    assert_eq!(json["payment_methods"][0]["last_four"], "4242");
    assert_eq!(json["payment_methods"][0]["expired"], false);
}

#[test]
fn notifications_response_serializes_unread_count() {
    let response = NotificationsResponse {
        notifications: vec![Notification {
            notification_id: 4,
            user_id: 2,
            product_id: Some(11),
            message: "Back in stock".into(),
            is_read: false,
            created_at: Utc.with_ymd_and_hms(2026, 3, 3, 9, 45, 0).unwrap(),
        }],
        unread_count: 1,
    };

    let json = serde_json::to_value(&response).expect("response should serialize");

    assert_eq!(json["unread_count"], 1);
    assert_eq!(json["notifications"][0]["message"], "Back in stock");
    assert_eq!(json["notifications"][0]["is_read"], false);
}

#[test]
fn orders_response_serializes_status_as_snake_case() {
    let response = OrdersResponse {
        orders: vec![OrderResponse {
            order_id: 12,
            user_id: 7,
            status: OrderStatus::InTransit,
            delivery_address: "Istanbul".into(),
            total_amount: 149.95,
            items: vec![OrderItemResponse {
                order_item_id: 1,
                product_id: 3,
                product_name: "Mouse".into(),
                quantity: 2,
                unit_price: 74.975,
                subtotal: 149.95,
            }],
            created_at: Utc.with_ymd_and_hms(2026, 4, 4, 12, 0, 0).unwrap(),
            updated_at: Utc.with_ymd_and_hms(2026, 4, 5, 12, 0, 0).unwrap(),
        }],
    };

    let json = serde_json::to_value(&response).expect("response should serialize");

    assert_eq!(json["orders"][0]["status"], "in_transit");
    assert_eq!(json["orders"][0]["items"][0]["subtotal"], 149.95);
}

#[test]
fn wishlist_response_serializes_saved_at_field() {
    let response = WishlistResponse {
        items: vec![WishlistItemResponse {
            wishlist_item_id: 8,
            product_id: 20,
            product_name: "Keyboard".into(),
            description: Some("Mechanical keyboard".into()),
            stock_quantity: 6,
            price: 89.99,
            saved_at: Utc.with_ymd_and_hms(2026, 5, 6, 14, 20, 0).unwrap(),
        }],
    };

    let json = serde_json::to_value(&response).expect("response should serialize");

    assert_eq!(json["items"][0]["wishlist_item_id"], 8);
    assert_eq!(json["items"][0]["product_name"], "Keyboard");
    assert!(json["items"][0]["saved_at"].is_string());
}
