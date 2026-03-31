CREATE TYPE user_role AS ENUM ('customer', 'sales_manager', 'product_manager');



-- Create users table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    user_name VARCHAR(100) NOT NULL,
    tax_id VARCHAR(50),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    home_address TEXT,
    role user_role NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create categories table
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- Create products table
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    category_id INT NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    model VARCHAR(100),
    serial_number VARCHAR(100) UNIQUE,
    description TEXT,
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    warranty_status BOOLEAN DEFAULT FALSE,
    distributor_info TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id)
        REFERENCES categories(category_id)
        ON DELETE RESTRICT
);

-- Create payment_info table
CREATE TABLE payment_info (
    payment_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    card_holder_name VARCHAR(100) NOT NULL,
    card_number VARCHAR(255) NOT NULL,
    expire_month INT NOT NULL CHECK (expire_month BETWEEN 1 AND 12),
    expire_year INT NOT NULL,
    cvv VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_payment_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

-- Create shopping_carts table
-- Session id is for guest users, when login cart transfers to user id
CREATE TABLE shopping_carts (
    cart_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE,
    session_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_cart_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

-- Create cart_items table
CREATE TABLE cart_items (
    cart_item_id SERIAL PRIMARY KEY,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_cart_items_cart
        FOREIGN KEY (cart_id)
        REFERENCES shopping_carts(cart_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_cart_items_product
        FOREIGN KEY (product_id)
        REFERENCES products(product_id)
        ON DELETE CASCADE,

    CONSTRAINT uq_cart_product
        UNIQUE (cart_id, product_id)
);