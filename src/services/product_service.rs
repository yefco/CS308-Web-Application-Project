use sqlx::PgPool;

use crate::models::product::{
    CategoriesResponse, Category, CreateCategoryRequest, CreateProductRequest, ProductResponse,
    ProductsResponse, UpdateCategoryRequest, UpdateProductRequest, UpdateStockRequest,
};
use crate::repository::product_repository;
use crate::utils::errors::AppError;

#[derive(Clone)]
pub struct ProductService {
    pool: PgPool,
}

impl ProductService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    // ─── Categories ───────────────────────────────────────────

    pub async fn list_categories(&self) -> Result<CategoriesResponse, AppError> {
        let categories = product_repository::list_categories(&self.pool).await?;
        Ok(CategoriesResponse { categories })
    }

    pub async fn get_category(&self, category_id: i32) -> Result<Category, AppError> {
        product_repository::find_category(&self.pool, category_id)
            .await?
            .ok_or_else(|| AppError::NotFound("Category not found".into()))
    }

    pub async fn create_category(&self, req: CreateCategoryRequest) -> Result<Category, AppError> {
        let name = req.category_name.trim().to_string();
        if name.is_empty() {
            return Err(AppError::BadRequest("Category name is required".into()));
        }
        product_repository::create_category(&self.pool, &name, req.description.as_deref())
            .await
            .map_err(AppError::from)
    }

    pub async fn update_category(
        &self,
        category_id: i32,
        req: UpdateCategoryRequest,
    ) -> Result<Category, AppError> {
        let name = req.category_name.trim().to_string();
        if name.is_empty() {
            return Err(AppError::BadRequest("Category name is required".into()));
        }
        product_repository::update_category(
            &self.pool,
            category_id,
            &name,
            req.description.as_deref(),
        )
        .await?
        .ok_or_else(|| AppError::NotFound("Category not found".into()))
    }

    pub async fn delete_category(&self, category_id: i32) -> Result<(), AppError> {
        let deleted = product_repository::delete_category(&self.pool, category_id).await?;
        if !deleted {
            return Err(AppError::NotFound("Category not found".into()));
        }
        Ok(())
    }

    // ─── Products ─────────────────────────────────────────────

    pub async fn list_products(&self) -> Result<ProductsResponse, AppError> {
        let products = product_repository::list_products(&self.pool)
            .await?
            .into_iter()
            .map(ProductResponse::from)
            .collect();
        Ok(ProductsResponse { products })
    }

    pub async fn get_product(&self, product_id: i32) -> Result<ProductResponse, AppError> {
        product_repository::find_product(&self.pool, product_id)
            .await?
            .map(ProductResponse::from)
            .ok_or_else(|| AppError::NotFound("Product not found".into()))
    }

    pub async fn create_product(
        &self,
        req: CreateProductRequest,
    ) -> Result<ProductResponse, AppError> {
        let name = req.product_name.trim().to_string();
        if name.is_empty() {
            return Err(AppError::BadRequest("Product name is required".into()));
        }
        if req.price < 0.0 {
            return Err(AppError::BadRequest("Price must be non-negative".into()));
        }
        let stock = req.stock_quantity.unwrap_or(0);
        if stock < 0 {
            return Err(AppError::BadRequest(
                "Stock quantity must be non-negative".into(),
            ));
        }

        product_repository::create_product(
            &self.pool,
            req.category_id,
            &name,
            req.model.as_deref(),
            req.serial_number.as_deref(),
            req.description.as_deref(),
            stock,
            req.price,
            req.warranty_status.unwrap_or(false),
            req.distributor_info.as_deref(),
        )
        .await
        .map(ProductResponse::from)
        .map_err(AppError::from)
    }

    pub async fn update_product(
        &self,
        product_id: i32,
        req: UpdateProductRequest,
    ) -> Result<ProductResponse, AppError> {
        let name = req.product_name.trim().to_string();
        if name.is_empty() {
            return Err(AppError::BadRequest("Product name is required".into()));
        }
        if req.price < 0.0 {
            return Err(AppError::BadRequest("Price must be non-negative".into()));
        }

        product_repository::update_product(
            &self.pool,
            product_id,
            req.category_id,
            &name,
            req.model.as_deref(),
            req.serial_number.as_deref(),
            req.description.as_deref(),
            req.price,
            req.warranty_status,
            req.distributor_info.as_deref(),
        )
        .await?
        .map(ProductResponse::from)
        .ok_or_else(|| AppError::NotFound("Product not found".into()))
    }

    pub async fn update_stock(
        &self,
        product_id: i32,
        req: UpdateStockRequest,
    ) -> Result<ProductResponse, AppError> {
        if req.stock_quantity < 0 {
            return Err(AppError::BadRequest(
                "Stock quantity must be non-negative".into(),
            ));
        }
        product_repository::update_stock(&self.pool, product_id, req.stock_quantity)
            .await?
            .map(ProductResponse::from)
            .ok_or_else(|| AppError::NotFound("Product not found".into()))
    }

    pub async fn delete_product(&self, product_id: i32) -> Result<(), AppError> {
        let deleted = product_repository::delete_product(&self.pool, product_id).await?;
        if !deleted {
            return Err(AppError::NotFound("Product not found".into()));
        }
        Ok(())
    }
}
