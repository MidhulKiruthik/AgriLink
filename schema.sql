-- Create database
CREATE DATABASE IF NOT EXISTS farm_fresh;
USE farm_fresh;

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  image_url VARCHAR(255),
  stock INT NOT NULL DEFAULT 0,
  organic BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('customer', 'admin', 'farmer') DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Carts table
CREATE TABLE IF NOT EXISTS carts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cart_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  customer_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  zip VARCHAR(20) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'processing', 'shipped', 'completed', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Sample data for products
INSERT INTO products (name, description, price, category, stock, organic) VALUES
('Organic Tomatoes', 'Fresh, locally grown organic tomatoes. Perfect for salads and cooking.', 3.99, 'vegetables', 120, TRUE),
('Fresh Apples', 'Crisp and juicy apples picked at peak ripeness.', 2.49, 'fruits', 200, FALSE),
('Whole Milk', 'Creamy, organic whole milk from grass-fed cows.', 4.99, 'dairy', 50, TRUE),
('Brown Rice', 'Organic brown rice, rich in fiber and nutrients.', 5.99, 'grains', 80, TRUE),
('Carrots', 'Fresh carrots, great for snacking or cooking.', 1.99, 'vegetables', 150, FALSE),
('Strawberries', 'Sweet, organic strawberries grown without pesticides.', 4.49, 'fruits', 60, TRUE),
('Yogurt', 'Creamy yogurt made from local milk.', 3.49, 'dairy', 75, FALSE),
('Quinoa', 'Organic quinoa, a complete protein source.', 6.99, 'grains', 40, TRUE),
('Spinach', 'Organic spinach, rich in iron and vitamins.', 2.99, 'vegetables', 90, TRUE),
('Bananas', 'Sweet, ripe bananas.', 1.49, 'fruits', 300, FALSE);

-- Sample user
INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@example.com', '$2b$10$XdR5Md4Y5A9pAswEP6YZWe5HNi1UKj7QJJ/5ksP3UJVxGqAUwh8Oe', 'admin'),
('Customer User', 'customer@example.com', '$2b$10$XdR5Md4Y5A9pAswEP6YZWe5HNi1UKj7QJJ/5ksP3UJVxGqAUwh8Oe', 'customer');

-- Sample cart
INSERT INTO carts (user_id) VALUES (2);

-- Sample cart items
INSERT INTO cart_items (cart_id, product_id, quantity) VALUES
(1, 1, 2),
(1, 3, 1);

