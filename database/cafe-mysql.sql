-- =====================================================================
--  Cafe Management System — MySQL database (re)build script
--
--  WARNING: drops and recreates the "cafe" database. All data is lost.
--
--  Run on Ubuntu:   sudo mysql < database/cafe-mysql.sql
--  Then start the backend with:  ./start-backend.sh mysql
--
--  The admin account (admin@cafe.com / admin123) is NOT inserted here:
--  the backend creates it on first start with a properly hashed password.
-- =====================================================================

DROP DATABASE IF EXISTS cafe;
CREATE DATABASE cafe CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'cafe'@'localhost' IDENTIFIED BY 'cafe123';
GRANT ALL PRIVILEGES ON cafe.* TO 'cafe'@'localhost';
FLUSH PRIVILEGES;

USE cafe;

-- ---------------------------------------------------------------- users
CREATE TABLE users (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    name           VARCHAR(100) NOT NULL,
    contact_number VARCHAR(20),
    email          VARCHAR(150) NOT NULL,
    password       VARCHAR(255) NOT NULL,          -- BCrypt hash
    status         BIT          NOT NULL,          -- 1 = approved by admin
    role           VARCHAR(10)  NOT NULL,          -- ADMIN | USER
    PRIMARY KEY (id),
    CONSTRAINT uk_users_email UNIQUE (email)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------- category
CREATE TABLE category (
    id   BIGINT       NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_category_name UNIQUE (name)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------- product
CREATE TABLE product (
    id          BIGINT         NOT NULL AUTO_INCREMENT,
    name        VARCHAR(100)   NOT NULL,
    category_fk BIGINT         NOT NULL,
    description VARCHAR(500),
    price       DECIMAL(10, 2) NOT NULL,
    status      BIT            NOT NULL,           -- 1 = available for ordering
    PRIMARY KEY (id),
    CONSTRAINT fk_product_category FOREIGN KEY (category_fk) REFERENCES category (id)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------- bill
CREATE TABLE bill (
    id              BIGINT         NOT NULL AUTO_INCREMENT,
    uuid            VARCHAR(60)    NOT NULL,
    name            VARCHAR(100)   NOT NULL,
    email           VARCHAR(150),
    contact_number  VARCHAR(20),
    payment_method  VARCHAR(30),
    total           DECIMAL(12, 2) NOT NULL,
    product_details TEXT           NOT NULL,       -- JSON snapshot of the order lines
    created_by      VARCHAR(150)   NOT NULL,
    created_at      DATETIME(6)    NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_bill_uuid UNIQUE (uuid)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------- online_order
-- Orders placed by customers on the public "Order Online" page.
CREATE TABLE online_order (
    id              BIGINT         NOT NULL AUTO_INCREMENT,
    code            VARCHAR(12)    NOT NULL,       -- tracking code given to the customer
    customer_name   VARCHAR(100)   NOT NULL,
    contact_number  VARCHAR(20)    NOT NULL,
    email           VARCHAR(150),
    order_type      VARCHAR(10)    NOT NULL,       -- PICKUP | DELIVERY
    address         VARCHAR(300),                  -- delivery only
    note            VARCHAR(300),
    product_details TEXT           NOT NULL,       -- JSON snapshot of the order lines
    total           DECIMAL(12, 2) NOT NULL,
    status          VARCHAR(12)    NOT NULL,       -- PENDING | ACCEPTED | READY | COMPLETED | CANCELLED
    bill_uuid       VARCHAR(60),                   -- bill created when completed
    handled_by      VARCHAR(150),
    created_at      DATETIME(6)    NOT NULL,
    updated_at      DATETIME(6)    NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_online_order_code UNIQUE (code),
    INDEX idx_online_order_status (status)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------- sample menu
INSERT INTO category (id, name) VALUES
    (1, 'Coffee'), (2, 'Tea'), (3, 'Cold Drinks'), (4, 'Bakery'), (5, 'Sandwiches');

INSERT INTO product (name, category_fk, description, price, status) VALUES
    ('Espresso',           1, 'Single shot of espresso',            2.20, 1),
    ('Cappuccino',         1, 'Espresso with steamed milk foam',    3.40, 1),
    ('Latte Macchiato',    1, 'Layered milk and espresso',          3.80, 1),
    ('Ethiopian Buna',     1, 'Traditional Ethiopian coffee',       3.00, 1),
    ('Black Tea',          2, 'Classic black tea',                  2.50, 1),
    ('Green Tea',          2, 'Japanese sencha',                    2.70, 1),
    ('Fresh Mint Tea',     2, 'Fresh mint leaves with honey',       3.00, 1),
    ('Iced Coffee',        3, 'Cold brew over ice',                 3.90, 1),
    ('Fresh Orange Juice', 3, 'Freshly squeezed, 0.3 l',            3.80, 1),
    ('Mineral Water',      3, 'Sparkling, 0.5 l',                   2.20, 1),
    ('Butter Croissant',   4, 'Baked fresh every morning',          2.10, 1),
    ('Apple Strudel',      4, 'With vanilla sauce',                 3.90, 1),
    ('Chocolate Muffin',   4, 'Double chocolate',                   2.80, 1),
    ('Cheese Sandwich',    5, 'Gouda, tomato and lettuce',          4.50, 1),
    ('Chicken Panini',     5, 'Grilled chicken, pesto, mozzarella', 6.20, 1);
