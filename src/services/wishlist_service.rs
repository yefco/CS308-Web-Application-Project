use sqlx::PgPool;

use crate::models::wishlist::{WishlistItemResponse, WishlistResponse};
use crate::repository::{product_repository, wishlist_repository};
use crate::utils::errors::AppError;

#[derive(Clone)]
pub struct WishlistService {
    pool: PgPool,
}

impl WishlistService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn list_items(&self, user_id: i32) -> Result<WishlistResponse, AppError> {
        let items = wishlist_repository::list_user_wishlist(&self.pool, user_id)
            .await?
            .into_iter()
            .map(WishlistItemResponse::from)
            .collect();
        Ok(WishlistResponse { items })
    }

    pub async fn add_item(
        &self,
        user_id: i32,
        product_id: i32,
    ) -> Result<WishlistItemResponse, AppError> {
        let product = product_repository::find_product(&self.pool, product_id).await?;
        if product.is_none() {
            return Err(AppError::NotFound("Product not found".into()));
        }

        let row = wishlist_repository::add_item(&self.pool, user_id, product_id).await?;
        Ok(row.into())
    }

    pub async fn remove_item(&self, user_id: i32, product_id: i32) -> Result<(), AppError> {
        let removed = wishlist_repository::remove_item(&self.pool, user_id, product_id).await?;
        if !removed {
            return Err(AppError::NotFound("Product not found in wishlist".into()));
        }
        Ok(())
    }
}
