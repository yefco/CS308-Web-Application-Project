

-- Insert user
INSERT INTO users (user_name, tax_id, email, password_hash, home_address, role)
VALUES ('Kaan Sayin', '12345678901', 'kaan@example.com', 'hashed_pw_here', 'Istanbul, Turkey', 'customer');

-- Insert category
INSERT INTO categories (category_name, description)
VALUES ('Electronics', 'Electronic devices and accessories');

-- Insert product
INSERT INTO products (
    category_id, product_name, model, serial_number, description,
    stock_quantity, price, warranty_status, distributor_info
)
VALUES (
    1, 'Wireless Mouse', 'MX-200', 'SN123456',
    'Ergonomic wireless mouse', 25, 799.99, TRUE, 'Logi Distributor Turkey'
);

-- Insert payment information
INSERT INTO payment_info (
    user_id, card_holder_name, card_number, expire_month, expire_year, cvv
)
VALUES (
    1, 'Kaan Sayin', '4111111111111111', 12, 2028, '123'
);

-- List all products with category name
SELECT
    p.product_id,
    p.product_name,
    c.category_name,
    p.price,
    p.stock_quantity
FROM products p
JOIN categories c ON p.category_id = c.category_id;

-- Get payment information for a specific user
SELECT
    p.payment_id,
    u.user_name,
    p.card_holder_name,
    p.expire_month,
    p.expire_year
FROM payment_info p
JOIN users u ON p.user_id = u.user_id
WHERE u.user_id = 1;

-- List products that are in stock
SELECT *
FROM products
WHERE stock_quantity > 0;

-- Search products by name
SELECT *
FROM products
WHERE product_name ILIKE '%mouse%';