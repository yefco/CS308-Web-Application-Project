use crate::models::cart::{
    AddItemRequest, CartOwner, CartResponse, MergeCartRequest, UpdateQuantityRequest,
};
use crate::repository::{cart_repository, product_repository};
use crate::utils::errors::AppError;
use sqlx::PgPool;

#[derive(Clone)]
pub struct CartService {
    pool: PgPool,
}

impl CartService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    async fn cart_id(&self, owner: &CartOwner) -> Result<i32, AppError> {
        match owner {
            CartOwner::User(id) => {
                Ok(cart_repository::get_or_create_user_cart(&self.pool, *id).await?)
            }
            CartOwner::Guest(s) => {
                Ok(cart_repository::get_or_create_guest_cart(&self.pool, s).await?)
            }
        }
    }

    pub async fn get_cart(&self, owner: CartOwner) -> Result<CartResponse, AppError> {
        let cart_id = self.cart_id(&owner).await?;
        let items = cart_repository::get_cart_items(&self.pool, cart_id).await?;
        Ok(CartResponse { cart_id, items })
    }

    pub async fn add_item(
        &self,
        owner: CartOwner,
        req: AddItemRequest,
    ) -> Result<CartResponse, AppError> {
        if req.quantity <= 0 {
            return Err(AppError::BadRequest("Quantity must be positive".into()));
        }
        let product = product_repository::find_product(&self.pool, req.product_id)
            .await
            .map_err(AppError::from)?
            .ok_or_else(|| AppError::NotFound("Product not found".into()))?;
        if req.quantity > product.stock_quantity {
            return Err(AppError::Conflict(format!(
                "Only {} unit(s) available for '{}'",
                product.stock_quantity, product.product_name
            )));
        }
        let cart_id = self.cart_id(&owner).await?;
        cart_repository::upsert_item(&self.pool, cart_id, req.product_id, req.quantity).await?;
        let items = cart_repository::get_cart_items(&self.pool, cart_id).await?;
        Ok(CartResponse { cart_id, items })
    }

    pub async fn update_quantity(
        &self,
        owner: CartOwner,
        product_id: i32,
        req: UpdateQuantityRequest,
    ) -> Result<CartResponse, AppError> {
        if req.quantity <= 0 {
            return Err(AppError::BadRequest("Quantity must be positive".into()));
        }
        let product = product_repository::find_product(&self.pool, product_id)
            .await
            .map_err(AppError::from)?
            .ok_or_else(|| AppError::NotFound("Product not found".into()))?;
        if req.quantity > product.stock_quantity {
            return Err(AppError::Conflict(format!(
                "Only {} unit(s) available for '{}'",
                product.stock_quantity, product.product_name
            )));
        }
        let cart_id = self.cart_id(&owner).await?;
        let found =
            cart_repository::set_quantity(&self.pool, cart_id, product_id, req.quantity).await?;
        if !found {
            return Err(AppError::NotFound("Item not in cart".into()));
        }
        let items = cart_repository::get_cart_items(&self.pool, cart_id).await?;
        Ok(CartResponse { cart_id, items })
    }

    pub async fn remove_item(
        &self,
        owner: CartOwner,
        product_id: i32,
    ) -> Result<CartResponse, AppError> {
        let cart_id = self.cart_id(&owner).await?;
        cart_repository::remove_item(&self.pool, cart_id, product_id).await?;
        let items = cart_repository::get_cart_items(&self.pool, cart_id).await?;
        Ok(CartResponse { cart_id, items })
    }

    pub async fn clear(&self, owner: CartOwner) -> Result<(), AppError> {
        let cart_id = self.cart_id(&owner).await?;
        cart_repository::clear_cart(&self.pool, cart_id).await?;
        Ok(())
    }

    pub async fn merge(
        &self,
        user_id: i32,
        req: MergeCartRequest,
    ) -> Result<CartResponse, AppError> {
        cart_repository::merge_guest_into_user(&self.pool, &req.session_id, user_id).await?;
        self.get_cart(CartOwner::User(user_id)).await
    }
}
