-- ============================================================
-- CONCEPT AUTOS POS — Complete Database Schema
-- ============================================================
-- Run this in phpMyAdmin → SQL tab
-- ============================================================

-- Create database (skip if exists)
CREATE DATABASE IF NOT EXISTS concept_autos_pos
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE concept_autos_pos;

-- ============================================================
-- 1. USERS (Admin / Manager / Employee)
-- ============================================================
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('ADMIN','MANAGER','EMPLOYEE') DEFAULT 'EMPLOYEE',
    phone VARCHAR(20) DEFAULT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Seed one admin (password is 'admin123' hashed with bcrypt — change immediately)
INSERT INTO users (name, email, password, role) VALUES
('Zaid Ikram', 'admin@conceptautos.pk', '$2y$10$e0MYzXyjpJS7Pd0RVvHwHe1HlT9LzE0d3JWtlKHYyK3u2L8R5L0ou', 'ADMIN');

-- ============================================================
-- 2. CUSTOMERS
-- ============================================================
DROP TABLE IF EXISTS customers;
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    alt_phone VARCHAR(20) DEFAULT NULL,
    whatsapp VARCHAR(20) DEFAULT NULL,
    email VARCHAR(100) DEFAULT NULL,
    address VARCHAR(255) DEFAULT NULL,
    city VARCHAR(50) DEFAULT NULL,
    opening_receivable DECIMAL(10,2) DEFAULT 0,
    credit_limit DECIMAL(10,2) DEFAULT 0,
    credit_days INT DEFAULT 0,
    loyalty ENUM('Standard','Silver','Gold','Platinum') DEFAULT 'Standard',
    notes TEXT DEFAULT NULL,
    status ENUM('Active','Inactive','Blocked') DEFAULT 'Active',
    oil_grade VARCHAR(50) DEFAULT NULL,
    total_purchases DECIMAL(12,2) DEFAULT 0,
    total_pending DECIMAL(12,2) DEFAULT 0,
    cai_numbers JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_phone (phone)
) ENGINE=InnoDB;

-- ============================================================
-- 3. VEHICLES
-- ============================================================
DROP TABLE IF EXISTS vehicles;
CREATE TABLE vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    reg_no VARCHAR(50) NOT NULL,
    make VARCHAR(50) DEFAULT NULL,
    model VARCHAR(50) DEFAULT NULL,
    year VARCHAR(10) DEFAULT NULL,
    oil_grade VARCHAR(50) DEFAULT NULL,
    cai_no VARCHAR(50) DEFAULT NULL,
    current_mileage INT DEFAULT 0,
    notes VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_reg_no (reg_no),
    INDEX idx_customer (customer_id)
) ENGINE=InnoDB;

-- ============================================================
-- 4. SUPPLIERS
-- ============================================================
DROP TABLE IF EXISTS suppliers;
CREATE TABLE suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    contact VARCHAR(50) DEFAULT NULL,
    address VARCHAR(255) DEFAULT NULL,
    total_purchases DECIMAL(12,2) DEFAULT 0,
    paid DECIMAL(12,2) DEFAULT 0,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB;

-- ============================================================
-- 5. PRODUCTS
-- ============================================================
DROP TABLE IF EXISTS products;
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) DEFAULT NULL,
    purchase_price DECIMAL(10,2) DEFAULT 0,
    wholesale_price DECIMAL(10,2) DEFAULT 0,
    sale_price DECIMAL(10,2) DEFAULT 0,
    stock_qty DECIMAL(10,2) DEFAULT 0,
    stock_ml INT DEFAULT 0,
    min_stock_level INT DEFAULT 5,
    rack VARCHAR(20) DEFAULT NULL,
    shelf VARCHAR(20) DEFAULT NULL,
    unit ENUM('pcs','L') DEFAULT 'pcs',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_category (category),
    INDEX idx_low_stock (stock_qty, min_stock_level)
) ENGINE=InnoDB;

-- ============================================================
-- 6. INVOICES
-- ============================================================
DROP TABLE IF EXISTS invoices;
CREATE TABLE invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_no VARCHAR(50) NOT NULL UNIQUE,
    cai_invoice_no VARCHAR(50) DEFAULT NULL,
    reg_invoice_no VARCHAR(50) DEFAULT NULL,
    customer_id INT DEFAULT NULL,
    vehicle_id INT DEFAULT NULL,
    customer_name VARCHAR(150) DEFAULT NULL,
    customer_phone VARCHAR(20) DEFAULT NULL,
    customer_address VARCHAR(255) DEFAULT NULL,
    vehicle_no VARCHAR(50) DEFAULT NULL,
    vehicle_model VARCHAR(100) DEFAULT NULL,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    service_charges DECIMAL(10,2) DEFAULT 0,
    previous_pending DECIMAL(10,2) DEFAULT 0,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    pending_amount DECIMAL(10,2) DEFAULT 0,
    payment_method VARCHAR(50) DEFAULT 'Cash',
    payment_due_date DATE DEFAULT NULL,
    current_odometer VARCHAR(20) DEFAULT NULL,
    next_oil_change VARCHAR(20) DEFAULT NULL,
    dock_station VARCHAR(20) DEFAULT NULL,
    service_man_1 VARCHAR(100) DEFAULT NULL,
    service_man_2 VARCHAR(100) DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
    INDEX idx_invoice_no (invoice_no),
    INDEX idx_customer (customer_id),
    INDEX idx_date (created_at),
    INDEX idx_pending (pending_amount)
) ENGINE=InnoDB;

-- ============================================================
-- 7. INVOICE ITEMS
-- ============================================================
DROP TABLE IF EXISTS invoice_items;
CREATE TABLE invoice_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    product_id INT DEFAULT NULL,
    product_name VARCHAR(150) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit ENUM('pcs','L') DEFAULT 'pcs',
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    discounted_price DECIMAL(10,2) DEFAULT NULL,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    oil_used_l DECIMAL(10,3) DEFAULT NULL,
    mileage VARCHAR(20) DEFAULT NULL,
    next_interval_km INT DEFAULT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    INDEX idx_invoice (invoice_id),
    INDEX idx_product (product_id)
) ENGINE=InnoDB;

-- ============================================================
-- 8. INVOICE PAYMENTS (partial payments tracker)
-- ============================================================
DROP TABLE IF EXISTS invoice_payments;
CREATE TABLE invoice_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    method VARCHAR(50) DEFAULT 'Cash',
    notes VARCHAR(255) DEFAULT NULL,
    received_by VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    INDEX idx_invoice (invoice_id),
    INDEX idx_date (date)
) ENGINE=InnoDB;

-- ============================================================
-- 9. OIL CHANGES (vehicle service history)
-- ============================================================
DROP TABLE IF EXISTS oil_changes;
CREATE TABLE oil_changes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    invoice_id INT DEFAULT NULL,
    oil_product_id INT DEFAULT NULL,
    oil_used_ml INT NOT NULL DEFAULT 0,
    remaining_oil_ml INT DEFAULT 0,
    estimated_waste_ml INT DEFAULT 0,
    actual_waste_ml INT DEFAULT NULL,
    current_mileage INT DEFAULT 0,
    interval_km INT DEFAULT 5000,
    next_change_mileage INT DEFAULT 0,
    next_change_date DATE DEFAULT NULL,
    service_date DATE NOT NULL,
    notes VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
    FOREIGN KEY (oil_product_id) REFERENCES products(id) ON DELETE SET NULL,
    INDEX idx_vehicle (vehicle_id),
    INDEX idx_date (service_date)
) ENGINE=InnoDB;

-- ============================================================
-- 10. WASTE OIL INVENTORY
-- ============================================================
DROP TABLE IF EXISTS waste_oil;
CREATE TABLE waste_oil (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    source ENUM('Oil Change','Purchase','Sale','Adjustment','Transfer') DEFAULT 'Oil Change',
    quantity_ml INT NOT NULL DEFAULT 0,
    reference VARCHAR(50) DEFAULT NULL,
    buyer VARCHAR(150) DEFAULT NULL,
    rate DECIMAL(10,2) DEFAULT 0,
    amount DECIMAL(10,2) DEFAULT 0,
    notes VARCHAR(255) DEFAULT NULL,
    created_by VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_date (date),
    INDEX idx_source (source)
) ENGINE=InnoDB;

-- ============================================================
-- 11. STOCK HISTORY
-- ============================================================
DROP TABLE IF EXISTS stock_history;
CREATE TABLE stock_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    product_name VARCHAR(150) DEFAULT NULL,
    date DATE NOT NULL,
    type ENUM('Sale','Purchase','Adjustment','Waste','Return','Transfer') NOT NULL,
    qty DECIMAL(10,2) NOT NULL DEFAULT 0,
    before_stock DECIMAL(10,2) DEFAULT NULL,
    after_stock DECIMAL(10,2) DEFAULT NULL,
    reference VARCHAR(50) DEFAULT NULL,
    user VARCHAR(100) DEFAULT 'Admin',
    notes VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_product (product_id),
    INDEX idx_date (date),
    INDEX idx_type (type)
) ENGINE=InnoDB;

-- ============================================================
-- 12. LEDGER (Cash In / Cash Out / Pending aggregation)
-- ============================================================
DROP TABLE IF EXISTS ledger;
CREATE TABLE ledger (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description VARCHAR(255) DEFAULT NULL,
    reference VARCHAR(50) DEFAULT NULL,
    direction ENUM('in','out','pending') NOT NULL,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_by VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_date (date),
    INDEX idx_direction (direction),
    INDEX idx_type (type)
) ENGINE=InnoDB;

-- ============================================================
-- 13. SUPPLIER PAYMENTS
-- ============================================================
DROP TABLE IF EXISTS supplier_payments;
CREATE TABLE supplier_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT NOT NULL,
    date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    method VARCHAR(50) DEFAULT 'Cash',
    notes VARCHAR(255) DEFAULT NULL,
    products JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    INDEX idx_supplier (supplier_id),
    INDEX idx_date (date)
) ENGINE=InnoDB;

-- ============================================================
-- 14. AUDIT LOG (optional — tracks important actions)
-- ============================================================
DROP TABLE IF EXISTS audit_log;
CREATE TABLE audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    user_name VARCHAR(100) DEFAULT NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(50) DEFAULT NULL,
    entity_id INT DEFAULT NULL,
    details TEXT DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ============================================================
-- 15. SETTINGS (key-value store for shop info, templates, etc.)
-- ============================================================
DROP TABLE IF EXISTS settings;
CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Seed default settings
INSERT INTO settings (setting_key, setting_value) VALUES
('business_name',        'Concept Autos'),
('business_tagline',     'An Authentic Lubricant in Town'),
('business_address',     'Site No 39,40 Old Nadra Office Road Zia Shaheed Chowk Haroonabad'),
('business_phone',       '0306-2876599'),
('business_whatsapp',    '0339-4303099'),
('business_website',     'WWW.CONCEPTAUTOS.PK'),
('currency',             'PKR'),
('default_oil_interval', '5000'),
('waste_oil_percent',    '95'),
('invoice_footer_note',  'Only check warranty of oil filter. In case of oil filter leakage, only oil filter will be replaced and no responsibility of any loss.'),
('invoice_thanks',       'Thank you for visiting us!'),
('purchase_template',    'Assalam-o-Alaikum {name}, thank you for your purchase from Concept Autos! Invoice: {invoice_no}, Amount: Rs. {amount}. Thank you!'),
('oil_reminder_template','Assalam-o-Alaikum {name}, your vehicle {vehicle} is due for its next oil change. Please visit Concept Autos. Contact: 0339-4303099'),
('pending_template',     'Assalam-o-Alaikum {name}, this is a friendly reminder that Rs. {amount} is pending. Kindly clear at your convenience. Contact: 0306-2876599');

-- ============================================================
-- 16. DASHBOARD DAILY SNAPSHOT (optional — for fast dashboard)
-- ============================================================
DROP TABLE IF EXISTS daily_summary;
CREATE TABLE daily_summary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    total_sales DECIMAL(12,2) DEFAULT 0,
    total_purchases DECIMAL(12,2) DEFAULT 0,
    total_profit DECIMAL(12,2) DEFAULT 0,
    total_pending DECIMAL(12,2) DEFAULT 0,
    invoice_count INT DEFAULT 0,
    oil_change_count INT DEFAULT 0,
    waste_oil_collected_ml INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_date (date)
) ENGINE=InnoDB;

-- ============================================================
-- DONE ✅
-- ============================================================
-- Database: concept_autos_pos
-- 16 tables created
-- 1 admin user seeded (admin@conceptautos.pk)
-- 13 default settings