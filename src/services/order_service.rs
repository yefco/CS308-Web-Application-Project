use sqlx::PgPool;

use crate::models::order::{
    OrderItemResponse, OrderResponse, OrderStatus, OrderSummaryResponse, OrdersResponse,
    PlaceOrderRequest,
};
use crate::repository::{cart_repository, order_repository, user_repository};
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
        // Resolve delivery address
        let delivery_address = match req.delivery_address.filter(|a| !a.trim().is_empty()) {
            Some(addr) => addr,
            None => {
                let user = user_repository::find_by_id(&self.pool, user_id)
                    .await?
                    .ok_or_else(|| AppError::NotFound("User not found".into()))?;
                user.home_address
                    .ok_or_else(|| AppError::BadRequest(
                        "No delivery address provided and no home address on file".into(),
                    ))?
            }
        };

        // Load cart
        let cart_id = cart_repository::get_or_create_user_cart(&self.pool, user_id).await?;
        let cart_items = cart_repository::get_cart_items(&self.pool, cart_id).await?;

        if cart_items.is_empty() {
            return Err(AppError::BadRequest("Cart is empty".into()));
        }

        // Compute total
        let total_amount: f64 = cart_items
            .iter()
            .map(|item| item.price * item.quantity as f64)
            .sum();

        // Persist order
        let order = order_repository::create_order(
            &self.pool,
            user_id,
            &delivery_address,
            total_amount,
        )
        .await?;

        // Persist order items
        for item in &cart_items {
            order_repository::create_order_items(
                &self.pool,
                order.order_id,
                item.product_id,
                item.quantity,
                item.price,
            )
            .await?;
        }

        // Clear cart
        cart_repository::clear_cart(&self.pool, cart_id).await?;

        // Build response
        let items = cart_items
            .into_iter()
            .map(|item| OrderItemResponse {
                order_item_id: 0, // not critical for the immediate response
                product_id: item.product_id,
                product_name: item.product_name,
                quantity: item.quantity,
                unit_price: item.price,
                subtotal: item.price * item.quantity as f64,
            })
            .collect();

        Ok(OrderResponse {
            order_id: order.order_id,
            status: order.status,
            delivery_address: order.delivery_address,
            total_amount: order.total_amount,
            items,
            created_at: order.created_at,
            updated_at: order.updated_at,
        })
    }

    /// Returns all orders for the authenticated customer.
    pub async fn list_orders(&self, user_id: i32) -> Result<OrdersResponse, AppError> {
        let orders = order_repository::list_user_orders(&self.pool, user_id).await?;
        let summaries = orders
            .into_iter()
            .map(|o| OrderSummaryResponse {
                order_id: o.order_id,
                status: o.status,
                delivery_address: o.delivery_address,
                total_amount: o.total_amount,
                created_at: o.created_at,
                updated_at: o.updated_at,
            })
            .collect();
        Ok(OrdersResponse { orders: summaries })
    }

    /// Returns the full order detail (with items) for the authenticated customer.
    pub async fn get_order(
        &self,
        user_id: i32,
        order_id: i32,
    ) -> Result<OrderResponse, AppError> {
        let order = order_repository::find_user_order(&self.pool, user_id, order_id)
            .await?
            .ok_or_else(|| AppError::NotFound("Order not found".into()))?;

        let db_items = order_repository::get_order_items(&self.pool, order_id).await?;
        let items = db_items
            .into_iter()
            .map(|i| OrderItemResponse {
                order_item_id: i.order_item_id,
                product_id: i.product_id,
                product_name: i.product_name,
                quantity: i.quantity,
                unit_price: i.unit_price,
                subtotal: i.unit_price * i.quantity as f64,
            })
            .collect();

        Ok(OrderResponse {
            order_id: order.order_id,
            status: order.status,
            delivery_address: order.delivery_address,
            total_amount: order.total_amount,
            items,
            created_at: order.created_at,
            updated_at: order.updated_at,
        })
    }

    /// Returns all orders across all users (delivery department view).
    pub async fn list_all_orders(&self) -> Result<OrdersResponse, AppError> {
        let orders = order_repository::list_all_orders(&self.pool).await?;
        let summaries = orders
            .into_iter()
            .map(|o| OrderSummaryResponse {
                order_id: o.order_id,
                status: o.status,
                delivery_address: o.delivery_address,
                total_amount: o.total_amount,
                created_at: o.created_at,
                updated_at: o.updated_at,
            })
            .collect();
        Ok(OrdersResponse { orders: summaries })
    }

    /// Updates the delivery status of an order (delivery department only).
    /// Returns the updated order with its items.
    pub async fn update_delivery_status(
        &self,
        order_id: i32,
        new_status: OrderStatus,
    ) -> Result<OrderResponse, AppError> {
        let order = order_repository::update_order_status(&self.pool, order_id, &new_status)
            .await?
            .ok_or_else(|| AppError::NotFound("Order not found".into()))?;

        let db_items = order_repository::get_order_items(&self.pool, order_id).await?;
        let items = db_items
            .into_iter()
            .map(|i| OrderItemResponse {
                order_item_id: i.order_item_id,
                product_id: i.product_id,
                product_name: i.product_name,
                quantity: i.quantity,
                unit_price: i.unit_price,
                subtotal: i.unit_price * i.quantity as f64,
            })
            .collect();

        Ok(OrderResponse {
            order_id: order.order_id,
            status: order.status,
            delivery_address: order.delivery_address,
            total_amount: order.total_amount,
            items,
            created_at: order.created_at,
            updated_at: order.updated_at,
        })
    }
}
