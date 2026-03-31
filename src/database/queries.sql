

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


-- Create a shopping cart for a logged-in user
INSERT INTO shopping_carts (user_id)
VALUES (1);

-- Create a shopping cart for a guest user
INSERT INTO shopping_carts (session_id)
VALUES ('guest_abc123');

-- Add a product to the cart
INSERT INTO cart_items (cart_id, product_id, quantity)
VALUES (1, 1, 2);

-- Add a product to the cart, or increase quantity if it already exists
INSERT INTO cart_items (cart_id, product_id, quantity)
VALUES (1, 1, 1)
ON CONFLICT (cart_id, product_id)
DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity;

-- Show all items in a specific cart
SELECT
    ci.cart_item_id,
    ci.cart_id,
    p.product_id,
    p.product_name,
    p.price,
    ci.quantity,
    (p.price * ci.quantity) AS line_total
FROM cart_items ci
JOIN products p ON ci.product_id = p.product_id
WHERE ci.cart_id = 1;

-- Show total price of a specific cart
SELECT
    ci.cart_id,
    COALESCE(SUM(p.price * ci.quantity), 0) AS cart_total
FROM cart_items ci
JOIN products p ON ci.product_id = p.product_id
WHERE ci.cart_id = 1
GROUP BY ci.cart_id;

-- Show total number of items in a specific cart
SELECT
    cart_id,
    COALESCE(SUM(quantity), 0) AS total_items
FROM cart_items
WHERE cart_id = 1
GROUP BY cart_id;

-- Increase quantity of a product in the cart
UPDATE cart_items
SET quantity = quantity + 1
WHERE cart_id = 1 AND product_id = 1;

-- Decrease quantity of a product in the cart
UPDATE cart_items
SET quantity = quantity - 1
WHERE cart_id = 1 AND product_id = 1 AND quantity > 1;

-- Remove a specific product from the cart
DELETE FROM cart_items
WHERE cart_id = 1 AND product_id = 1;

-- Remove all items from a cart
DELETE FROM cart_items
WHERE cart_id = 1;

-- Find cart by logged-in user
SELECT *
FROM shopping_carts
WHERE user_id = 1;

-- Find guest cart by session_id
SELECT *
FROM shopping_carts
WHERE session_id = 'guest_abc123';

-- Assign guest cart to user after login
UPDATE shopping_carts
SET user_id = 1,
    session_id = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE session_id = 'guest_abc123';

-- Show all cart contents for a specific user
SELECT
    sc.cart_id,
    p.product_name,
    p.price,
    ci.quantity
FROM shopping_carts sc
JOIN cart_items ci ON sc.cart_id = ci.cart_id
JOIN products p ON ci.product_id = p.product_id
WHERE sc.user_id = 1;

-- Show cart items together with stock availability
SELECT
    p.product_name,
    ci.quantity,
    p.stock_quantity,
    CASE
        WHEN ci.quantity <= p.stock_quantity THEN 'available'
        ELSE 'not enough stock'
    END AS stock_status
FROM cart_items ci
JOIN products p ON ci.product_id = p.product_id
WHERE ci.cart_id = 1;