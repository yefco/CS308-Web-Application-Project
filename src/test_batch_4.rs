use crate::models::{
    cart::{AddItemRequest, MergeCartRequest, UpdateQuantityRequest},
    order::{OrderStatus, UpdateOrderStatusRequest},
    review::SubmitReviewRequest,
};

#[test]
fn add_item_request_deserializes_from_json() {
    let request: AddItemRequest = serde_json::from_str(
        r#"{
            "product_id": 12,
            "quantity": 3
        }"#,
    )
    .expect("request should deserialize");

    assert_eq!(request.product_id, 12);
    assert_eq!(request.quantity, 3);
}

#[test]
fn update_quantity_request_deserializes_from_json() {
    let request: UpdateQuantityRequest = serde_json::from_str(
        r#"{
            "quantity": 7
        }"#,
    )
    .expect("request should deserialize");

    assert_eq!(request.quantity, 7);
}

#[test]
fn merge_cart_request_deserializes_session_id() {
    let request: MergeCartRequest = serde_json::from_str(
        r#"{
            "session_id": "guest-session-42"
        }"#,
    )
    .expect("request should deserialize");

    assert_eq!(request.session_id, "guest-session-42");
}

#[test]
fn submit_review_request_uses_product_id_alias() {
    let request: SubmitReviewRequest = serde_json::from_str(
        r#"{
            "productId": 9,
            "rating": 4,
            "comment": "Solid product"
        }"#,
    )
    .expect("request should deserialize");

    assert_eq!(request.product_id, 9);
    assert_eq!(request.rating, 4);
    assert_eq!(request.comment.as_deref(), Some("Solid product"));
}

#[test]
fn update_order_status_request_deserializes_snake_case_enum() {
    let request: UpdateOrderStatusRequest = serde_json::from_str(
        r#"{
            "status": "in_transit"
        }"#,
    )
    .expect("request should deserialize");

    assert_eq!(request.status, OrderStatus::InTransit);
}
