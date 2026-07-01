-- ============================================
-- HAKIM GROUP — Product Management Schema
-- (مُحدَّثة لتطابق models/productModel.js و models/lookupModel.js)
-- ============================================

CREATE DATABASE IF NOT EXISTS hakim_group CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hakim_group;

-- أنواع المنتجات (كوب، طبق، علبة، غطاء، سلطانية ...) — قابلة للإضافة من لوحة التحكم
CREATE TABLE product_types (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  name       VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- فئات الخامات الرئيسية (بلاستيك، كرتون، فوم ...)
CREATE TABLE material_categories (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  name       VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- الخامات الفرعية تحت كل فئة
CREATE TABLE materials (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  category_id INT NOT NULL,
  name        VARCHAR(100) NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES material_categories(id) ON DELETE CASCADE,
  UNIQUE KEY uq_material_per_category (category_id, name)
);

-- Groups (parent categories for size siblings)
CREATE TABLE product_groups (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  name       VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Core products table
CREATE TABLE products (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(255) NOT NULL,
  code        VARCHAR(100),
  type_id     INT DEFAULT NULL,
  material_id INT DEFAULT NULL,
  temp        ENUM('hot','cold','both') NOT NULL DEFAULT 'both',
  group_id    INT DEFAULT NULL,
  size        VARCHAR(100),
  notes       TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (type_id)     REFERENCES product_types(id)     ON DELETE SET NULL,
  FOREIGN KEY (material_id) REFERENCES materials(id)         ON DELETE SET NULL,
  FOREIGN KEY (group_id)    REFERENCES product_groups(id)    ON DELETE SET NULL,
  INDEX idx_name (name),
  INDEX idx_code (code),
  INDEX idx_type (type_id),
  INDEX idx_material (material_id)
);

-- Product images (multiple per product, stored as Cloudinary URLs)
CREATE TABLE product_images (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  product_id  INT NOT NULL,
  url         VARCHAR(500) NOT NULL,
  public_id   VARCHAR(255) NOT NULL,   -- needed for Cloudinary deletion
  sort_order  INT DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product (product_id)
);

-- Matching lids (many-to-many: a product can have multiple lid options)
CREATE TABLE product_lids (
  product_id  INT NOT NULL,
  lid_id      INT NOT NULL,            -- lid_id references another product of type 'غطاء'
  PRIMARY KEY (product_id, lid_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (lid_id)     REFERENCES products(id) ON DELETE CASCADE
);

-- ============================================
-- MANUAL LIDS TABLES (للأغطية اليدوية غير المسجلة كمنتجات)
-- ============================================

CREATE TABLE IF NOT EXISTS manual_lids (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name)
);

CREATE TABLE IF NOT EXISTS product_manual_lids (
  product_id INT NOT NULL,
  manual_lid_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (product_id, manual_lid_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (manual_lid_id) REFERENCES manual_lids(id) ON DELETE CASCADE
);
