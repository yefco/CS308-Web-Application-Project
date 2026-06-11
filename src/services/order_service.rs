use chrono::{Duration, Utc};
use sqlx::PgPool;

use crate::models::cart::CartItemRow;
use crate::models::order::{
    Order, OrderItem, OrderItemResponse, OrderResponse, OrderStatus, OrdersResponse,
    PlaceOrderRequest,
};
use crate::repository::{cart_repository, order_repository, product_repository, return_repository, user_repository};
use crate::utils::errors::AppError;

#[derive(Clone)]
pub struct OrderService {
    pool: PgPool,
}

impl OrderService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Converts the user's current cart into a persisted order (status: processing)
    /// and clears the cart. The delivery_address falls back to the user's home_address.
    pub async fn place_order(
        &self,
        user_id: i32,
        req: PlaceOrderRequest,
    ) -> Result<OrderResponse, AppError> {
        let delivery_address = match req.delivery_address.filter(|a| !a.trim().is_empty()) {
            Some(addr) => addr,
            None => {
                let user = user_repository::find_by_id(&self.pool, user_id)
                    .await?
                    .ok_or_else(|| AppError::NotFound("User not found".into()))?;
                user.home_address.ok_or_else(|| {
                    AppError::BadRequest(
                        "No delivery address provided and no home address on file".into(),
                    )
                })?
            }
        };

        let mut tx = self.pool.begin().await?;
        let cart_id = cart_repository::get_or_create_user_cart_in_tx(&mut tx, user_id).await?;
        let mut cart_items = cart_repository::get_cart_items_in_tx(&mut tx, cart_id).await?;

        if cart_items.is_empty() {
            return Err(AppError::BadRequest("Cart is empty".into()));
        }

        cart_items.sort_by_key(|item| item.product_id);

        let total_amount: f64 = cart_items
            .iter()
            .map(|item| item.price * item.quantity as f64)
            .sum();

        for item in &cart_items {
            let updated_product =
                product_repository::decrement_stock_in_tx(&mut tx, item.product_id, item.quantity)
                    .await?;

            if updated_product.is_none() {
                let product =
                    product_repository::find_product_in_tx(&mut tx, item.product_id).await?;
                return match product {
                    Some(product) => Err(AppError::Conflict(format!(
                        "Insufficient stock for '{}' (requested {}, available {})",
                        product.product_name, item.quantity, product.stock_quantity
                    ))),
                    None => Err(AppError::NotFound(format!(
                        "Product {} no longer exists",
                        item.product_id
                    ))),
                };
            }
        }

        let order =
            order_repository::create_order_in_tx(&mut tx, user_id, &delivery_address, total_amount)
                .await?;

        for item in &cart_items {
            order_repository::create_order_items_in_tx(
                &mut tx,
                order.order_id,
                item.product_id,
                item.quantity,
                item.price,
            )
            .await?;
        }

        cart_repository::clear_cart_in_tx(&mut tx, cart_id).await?;
        tx.commit().await?;

        Ok(Self::build_order_response(
            order,
            cart_items
                .into_iter()
                .map(Self::cart_item_to_order_response_item)
                .collect(),
        ))
    }

    /// Returns all orders for the authenticated customer, each with its line items.
    pub async fn list_orders(&self, user_id: i32) -> Result<OrdersResponse, AppError> {
        let orders = order_repository::list_user_orders(&self.pool, user_id).await?;
        let mut responses = Vec::with_capacity(orders.len());
        for order in orders {
            responses.push(self.load_order_response(order).await?);
        }
        Ok(OrdersResponse { orders: responses })
    }

    /// Returns the full order detail (with items) for the authenticated customer.
    pub async fn get_order(&self, user_id: i32, order_id: i32) -> Result<OrderResponse, AppError> {
        let order = order_repository::find_user_order(&self.pool, user_id, order_id)
            .await?
            .ok_or_else(|| AppError::NotFound("Order not found".into()))?;

        self.load_order_response(order).await
    }

    /// Returns all orders across all users (delivery department view), each with its line items.
    pub async fn list_all_orders(&self) -> Result<OrdersResponse, AppError> {
        let orders = order_repository::list_all_orders(&self.pool).await?;
        let mut responses = Vec::with_capacity(orders.len());
        for order in orders {
            responses.push(self.load_order_response(order).await?);
        }
        Ok(OrdersResponse { orders: responses })
    }

    /// Updates the delivery status of an order (delivery department only).
    /// Returns the updated order with its items.
    pub async fn update_delivery_status(
        &self,
        order_id: i32,
        new_status: OrderStatus,
    ) -> Result<OrderResponse, AppError> {
        if matches!(new_status, OrderStatus::Cancelled | OrderStatus::Returned) {
            return Err(AppError::BadRequest(
                "Delivery dashboard cannot set cancelled or returned states".into(),
            ));
        }

        let mut tx = self.pool.begin().await?;
        let order = order_repository::find_order_for_update_in_tx(&mut tx, order_id)
            .await?
            .ok_or_else(|| AppError::NotFound("Order not found".into()))?;

        if !Self::can_transition_delivery_status(&order.status, &new_status) {
            return Err(AppError::Conflict(format!(
                "Cannot move order from '{}' to '{}'",
                Self::status_label(&order.status),
                Self::status_label(&new_status)
            )));
        }

        let updated_order = if order.status == new_status {
            order
        } else {
            order_repository::update_order_status_in_tx(&mut tx, order_id, &new_status).await?
        };

        let items = order_repository::get_order_items_in_tx(&mut tx, order_id).await?;
        tx.commit().await?;

        Ok(Self::build_order_response(
            updated_order,
            Self::map_order_items(items),
        ))
    }

    pub async fn cancel_order(
        &self,
        user_id: i32,
        order_id: i32,
    ) -> Result<OrderResponse, AppError> {
        let mut tx = self.pool.begin().await?;
        let order = order_repository::find_user_order_for_update_in_tx(&mut tx, user_id, order_id)
            .await?
            .ok_or_else(|| AppError::NotFound("Order not found".into()))?;

        match order.status {
            OrderStatus::Processing => {}
            OrderStatus::Cancelled => {
                return Err(AppError::Conflict(
                    "Order has already been cancelled".into(),
                ))
            }
            OrderStatus::Returned => {
                return Err(AppError::Conflict(
                    "Returned orders cannot be cancelled".into(),
                ))
            }
            _ => {
                return Err(AppError::Conflict(
                    "Only processing orders can be cancelled".into(),
                ))
            }
        }

        let mut items = order_repository::get_order_items_in_tx(&mut tx, order_id).await?;
        items.sort_by_key(|item| item.product_id);

        for item in &items {
            product_repository::increment_stock_in_tx(&mut tx, item.product_id, item.quantity)
                .await?;
        }

        let updated_order =
            order_repository::update_order_status_in_tx(&mut tx, order_id, &OrderStatus::Cancelled)
                .await?;
        tx.commit().await?;

        Ok(Self::build_order_response(
            updated_order,
            Self::map_order_items(items),
        ))
    }

    pub async fn return_order(
        &self,
        user_id: i32,
        order_id: i32,
    ) -> Result<OrderResponse, AppError> {
        let mut tx = self.pool.begin().await?;
        let order = order_repository::find_user_order_for_update_in_tx(&mut tx, user_id, order_id)
            .await?
            .ok_or_else(|| AppError::NotFound("Order not found".into()))?;

        match order.status {
            OrderStatus::Delivered => {}
            OrderStatus::Returned => {
                return Err(AppError::Conflict("Order has already been returned".into()))
            }
            OrderStatus::Cancelled => {
                return Err(AppError::Conflict(
                    "Cancelled orders cannot be returned".into(),
                ))
            }
            _ => {
                return Err(AppError::Conflict(
                    "Only delivered orders can be returned".into(),
                ))
            }
        }

        if !Self::is_within_return_window(order.created_at, Utc::now()) {
            return Err(AppError::Conflict(
                "Returns are only allowed within 30 days of purchase".into(),
            ));
        }

        let mut items = order_repository::get_order_items_in_tx(&mut tx, order_id).await?;
        items.sort_by_key(|item| item.product_id);

        for item in &items {
            product_repository::increment_stock_in_tx(&mut tx, item.product_id, item.quantity)
                .await?;
        }

        let updated_order =
            order_repository::update_order_status_in_tx(&mut tx, order_id, &OrderStatus::Returned)
                .await?;
        tx.commit().await?;

        // Cancel any pending item-level return requests so the sales manager
        // doesn't see stale requests for an already-returned order.
        return_repository::cancel_pending_requests_for_order(&self.pool, order_id).await?;

        // Credit the full order amount to the customer's balance.
        user_repository::credit_balance(&self.pool, user_id, updated_order.total_amount).await?;

        Ok(Self::build_order_response(
            updated_order,
            Self::map_order_items(items),
        ))
    }

    async fn load_order_response(&self, order: Order) -> Result<OrderResponse, AppError> {
        let items = order_repository::get_order_items(&self.pool, order.order_id).await?;
        Ok(Self::build_order_response(
            order,
            Self::map_order_items(items),
        ))
    }

    fn map_order_items(items: Vec<OrderItem>) -> Vec<OrderItemResponse> {
        items
            .into_iter()
            .map(|item| OrderItemResponse {
                order_item_id: item.order_item_id,
                product_id: item.product_id,
                product_name: item.product_name,
                quantity: item.quantity,
                unit_price: item.unit_price,
                subtotal: item.unit_price * item.quantity as f64,
            })
            .collect()
    }

    fn cart_item_to_order_response_item(item: CartItemRow) -> OrderItemResponse {
        OrderItemResponse {
            order_item_id: 0,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.price,
            subtotal: item.price * item.quantity as f64,
        }
    }

    fn build_order_response(order: Order, items: Vec<OrderItemResponse>) -> OrderResponse {
        OrderResponse {
            order_id: order.order_id,
            user_id: order.user_id,
            status: order.status,
            delivery_address: order.delivery_address,
            total_amount: order.total_amount,
            items,
            created_at: order.created_at,
            updated_at: order.updated_at,
        }
    }

    fn can_transition_delivery_status(current: &OrderStatus, next: &OrderStatus) -> bool {
        match (Self::delivery_rank(current), Self::delivery_rank(next)) {
            (Some(current_rank), Some(next_rank)) => next_rank >= current_rank,
            _ => false,
        }
    }

    fn delivery_rank(status: &OrderStatus) -> Option<u8> {
        match status {
            OrderStatus::Processing => Some(0),
            OrderStatus::InTransit => Some(1),
            OrderStatus::Delivered => Some(2),
            OrderStatus::Cancelled | OrderStatus::Returned => None,
        }
    }

    fn is_within_return_window(
        created_at: chrono::DateTime<Utc>,
        now: chrono::DateTime<Utc>,
    ) -> bool {
        let elapsed = now.signed_duration_since(created_at);
        elapsed >= Duration::zero() && elapsed <= Duration::days(30)
    }

    fn status_label(status: &OrderStatus) -> &'static str {
        match status {
            OrderStatus::Processing => "processing",
            OrderStatus::InTransit => "in_transit",
            OrderStatus::Delivered => "delivered",
            OrderStatus::Cancelled => "cancelled",
            OrderStatus::Returned => "returned",
        }
    }
}

#[cfg(test)]
mod tests {
    use chrono::{TimeZone, Utc};

    use super::OrderService;
    use crate::models::order::OrderStatus;

    #[test]
    fn delivery_status_can_only_move_forward() {
        assert!(OrderService::can_transition_delivery_status(
            &OrderStatus::Processing,
            &OrderStatus::Delivered,
        ));
        assert!(OrderService::can_transition_delivery_status(
            &OrderStatus::InTransit,
            &OrderStatus::Delivered,
        ));
        assert!(!OrderService::can_transition_delivery_status(
            &OrderStatus::Delivered,
            &OrderStatus::Processing,
        ));
        assert!(!OrderService::can_transition_delivery_status(
            &OrderStatus::Cancelled,
            &OrderStatus::Delivered,
        ));
    }

    #[test]
    fn return_window_is_thirty_days_or_less() {
        let created_at = Utc.with_ymd_and_hms(2026, 5, 1, 9, 0, 0).unwrap();
        let inside_window = Utc.with_ymd_and_hms(2026, 5, 31, 9, 0, 0).unwrap();
        let outside_window = Utc.with_ymd_and_hms(2026, 6, 1, 9, 0, 1).unwrap();

        assert!(OrderService::is_within_return_window(
            created_at,
            inside_window
        ));
        assert!(!OrderService::is_within_return_window(
            created_at,
            outside_window
        ));
    }
}
