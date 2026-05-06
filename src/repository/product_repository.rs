use sqlx::{PgPool, Postgres, Transaction};

use crate::models::product::{Category, Product};

// ─── Category queries ─────────────────────────────────────────

pub async fn list_categories(pool: &PgPool) -> Result<Vec<Category>, sqlx::Error> {
    sqlx::query_as::<_, Category>(
        "SELECT category_id, category_name, description FROM categories ORDER BY category_name",
    )
    .fetch_all(pool)
    .await
}

pub async fn find_category(
    pool: &PgPool,
    category_id: i32,
) -> Result<Option<Category>, sqlx::Error> {
    sqlx::query_as::<_, Category>(
        "SELECT category_id, category_name, description FROM categories WHERE category_id = $1",
    )
    .bind(category_id)
    .fetch_optional(pool)
    .await
}

pub async fn create_category(
    pool: &PgPool,
    category_name: &str,
    description: Option<&str>,
) -> Result<Category, sqlx::Error> {
    sqlx::query_as::<_, Category>(
        r#"
        INSERT INTO categories (category_name, description)
        VALUES ($1, $2)
        RETURNING category_id, category_name, description
        "#,
    )
    .bind(category_name)
    .bind(description)
    .fetch_one(pool)
    .await
}

pub async fn update_category(
    pool: &PgPool,
    category_id: i32,
    category_name: &str,
    description: Option<&str>,
) -> Result<Option<Category>, sqlx::Error> {
    sqlx::query_as::<_, Category>(
        r#"
        UPDATE categories
        SET category_name = $2, description = $3
        WHERE category_id = $1
        RETURNING category_id, category_name, description
        "#,
    )
    .bind(category_id)
    .bind(category_name)
    .bind(description)
    .fetch_optional(pool)
    .await
}

pub async fn delete_category(pool: &PgPool, category_id: i32) -> Result<bool, sqlx::Error> {
    sqlx::query("DELETE FROM categories WHERE category_id = $1")
        .bind(category_id)
        .execute(pool)
        .await
        .map(|r| r.rows_affected() > 0)
}

// ─── Product queries ──────────────────────────────────────────

pub async fn list_products(pool: &PgPool) -> Result<Vec<Product>, sqlx::Error> {
    sqlx::query_as::<_, Product>(
        r#"
        SELECT product_id, category_id, product_name, model, serial_number,
               description, stock_quantity, price::FLOAT8 AS price,
               warranty_status, distributor_info, created_at
        FROM products
        ORDER BY created_at DESC, product_id DESC
        "#,
    )
    .fetch_all(pool)
    .await
}

pub async fn find_product(pool: &PgPool, product_id: i32) -> Result<Option<Product>, sqlx::Error> {
    sqlx::query_as::<_, Product>(
        r#"
        SELECT product_id, category_id, product_name, model, serial_number,
               description, stock_quantity, price::FLOAT8 AS price,
               warranty_status, distributor_info, created_at
        FROM products
        WHERE product_id = $1
        "#,
    )
    .bind(product_id)
    .fetch_optional(pool)
    .await
}

pub async fn find_product_in_tx(
    tx: &mut Transaction<'_, Postgres>,
    product_id: i32,
) -> Result<Option<Product>, sqlx::Error> {
    sqlx::query_as::<_, Product>(
        r#"
        SELECT product_id, category_id, product_name, model, serial_number,
               description, stock_quantity, price::FLOAT8 AS price,
               warranty_status, distributor_info, created_at
        FROM products
        WHERE product_id = $1
        "#,
    )
    .bind(product_id)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn create_product(
    pool: &PgPool,
    category_id: i32,
    product_name: &str,
    model: Option<&str>,
    serial_number: Option<&str>,
    description: Option<&str>,
    stock_quantity: i32,
    price: f64,
    warranty_status: bool,
    distributor_info: Option<&str>,
) -> Result<Product, sqlx::Error> {
    sqlx::query_as::<_, Product>(
        r#"
        INSERT INTO products (
            category_id, product_name, model, serial_number, description,
            stock_quantity, price, warranty_status, distributor_info
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING product_id, category_id, product_name, model, serial_number,
                  description, stock_quantity, price::FLOAT8 AS price,
                  warranty_status, distributor_info, created_at
        "#,
    )
    .bind(category_id)
    .bind(product_name)
    .bind(model)
    .bind(serial_number)
    .bind(description)
    .bind(stock_quantity)
    .bind(price)
    .bind(warranty_status)
    .bind(distributor_info)
    .fetch_one(pool)
    .await
}

pub async fn update_product(
    pool: &PgPool,
    product_id: i32,
    category_id: i32,
    product_name: &str,
    model: Option<&str>,
    serial_number: Option<&str>,
    description: Option<&str>,
    price: f64,
    warranty_status: bool,
    distributor_info: Option<&str>,
) -> Result<Option<Product>, sqlx::Error> {
    sqlx::query_as::<_, Product>(
        r#"
        UPDATE products
        SET category_id = $2,
            product_name = $3,
            model = $4,
            serial_number = $5,
            description = $6,
            price = $7,
            warranty_status = $8,
            distributor_info = $9
        WHERE product_id = $1
        RETURNING product_id, category_id, product_name, model, serial_number,
                  description, stock_quantity, price::FLOAT8 AS price,
                  warranty_status, distributor_info, created_at
        "#,
    )
    .bind(product_id)
    .bind(category_id)
    .bind(product_name)
    .bind(model)
    .bind(serial_number)
    .bind(description)
    .bind(price)
    .bind(warranty_status)
    .bind(distributor_info)
    .fetch_optional(pool)
    .await
}

pub async fn update_stock(
    pool: &PgPool,
    product_id: i32,
    stock_quantity: i32,
) -> Result<Option<Product>, sqlx::Error> {
    sqlx::query_as::<_, Product>(
        r#"
        UPDATE products
        SET stock_quantity = $2
        WHERE product_id = $1
        RETURNING product_id, category_id, product_name, model, serial_number,
                  description, stock_quantity, price::FLOAT8 AS price,
                  warranty_status, distributor_info, created_at
        "#,
    )
    .bind(product_id)
    .bind(stock_quantity)
    .fetch_optional(pool)
    .await
}

pub async fn decrement_stock_in_tx(
    tx: &mut Transaction<'_, Postgres>,
    product_id: i32,
    quantity: i32,
) -> Result<Option<Product>, sqlx::Error> {
    sqlx::query_as::<_, Product>(
        r#"
        UPDATE products
        SET stock_quantity = stock_quantity - $2
        WHERE product_id = $1
          AND stock_quantity >= $2
        RETURNING product_id, category_id, product_name, model, serial_number,
                  description, stock_quantity, price::FLOAT8 AS price,
                  warranty_status, distributor_info, created_at
        "#,
    )
    .bind(product_id)
    .bind(quantity)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn delete_product(pool: &PgPool, product_id: i32) -> Result<bool, sqlx::Error> {
    sqlx::query("DELETE FROM products WHERE product_id = $1")
        .bind(product_id)
        .execute(pool)
        .await
        .map(|r| r.rows_affected() > 0)
}
