-- ============================================
-- HAKIM GROUP — Product Management Schema
-- (مُحدَّثة بالكامل لتطابق جميع الجداول والأعمدة في الإنتاج)
-- ============================================

CREATE DATABASE IF NOT EXISTS hakim_group CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hakim_group;

-- 1. أنواع المنتجات (كوب، طبق، علبة، غطاء، سلطانية ...)
CREATE TABLE IF NOT EXISTS product_types (
  id         VARCHAR(36) PRIMARY KEY,
  name       VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. فئات الخامات الرئيسية (بلاستيك، كرتون، فوم ...)
CREATE TABLE IF NOT EXISTS material_categories (
  id         VARCHAR(36) PRIMARY KEY,
  name       VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. الخامات الفرعية تحت كل فئة
CREATE TABLE IF NOT EXISTS materials (
  id          VARCHAR(36) PRIMARY KEY,
  category_id VARCHAR(36) NOT NULL,
  name        VARCHAR(100) NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES material_categories(id) ON DELETE CASCADE,
  UNIQUE KEY uq_material_per_category (category_id, name)
);

-- 4. المجموعات (Parent groups for size siblings)
CREATE TABLE IF NOT EXISTS product_groups (
  id         VARCHAR(36) PRIMARY KEY,
  name       VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. جدول المنتجات الرئيسي
CREATE TABLE IF NOT EXISTS products (
  id          VARCHAR(36) PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  name_en     VARCHAR(255) DEFAULT NULL,
  code        VARCHAR(100),
  type_id     VARCHAR(36) DEFAULT NULL,
  material_id VARCHAR(36) DEFAULT NULL,
  temp        ENUM('hot','cold','both') NOT NULL DEFAULT 'both',
  group_id    VARCHAR(36) DEFAULT NULL,
  size        VARCHAR(100),
  size_en     VARCHAR(100) DEFAULT NULL,
  notes       TEXT,
  notes_en    TEXT,
  sort_order  INT DEFAULT 0,
  views_count INT DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (type_id)     REFERENCES product_types(id)     ON DELETE SET NULL,
  FOREIGN KEY (material_id) REFERENCES materials(id)         ON DELETE SET NULL,
  FOREIGN KEY (group_id)    REFERENCES product_groups(id)    ON DELETE SET NULL,
  UNIQUE KEY unique_code (code),
  INDEX idx_name (name),
  INDEX idx_code (code),
  INDEX idx_type (type_id),
  INDEX idx_material (material_id),
  INDEX idx_sort_order (sort_order)
);

-- 6. صور المنتجات (Cloudinary URLs)
CREATE TABLE IF NOT EXISTS product_images (
  id          VARCHAR(36) PRIMARY KEY,
  product_id  VARCHAR(36) NOT NULL,
  url         VARCHAR(500) NOT NULL,
  public_id   VARCHAR(255) NOT NULL,
  sort_order  INT DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product (product_id)
);

-- 7. الأغطية المتوافقة (Many-to-Many بين المنتجات)
CREATE TABLE IF NOT EXISTS product_lids (
  product_id  VARCHAR(36) NOT NULL,
  lid_id      VARCHAR(36) NOT NULL,
  PRIMARY KEY (product_id, lid_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (lid_id)     REFERENCES products(id) ON DELETE CASCADE
);

-- 8. الأغطية اليدوية غير المسجلة كمنتجات
CREATE TABLE IF NOT EXISTS manual_lids (
  id         VARCHAR(36) PRIMARY KEY,
  name       VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name)
);

CREATE TABLE IF NOT EXISTS product_manual_lids (
  product_id    VARCHAR(36) NOT NULL,
  manual_lid_id VARCHAR(36) NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (product_id, manual_lid_id),
  FOREIGN KEY (product_id)    REFERENCES products(id)    ON DELETE CASCADE,
  FOREIGN KEY (manual_lid_id) REFERENCES manual_lids(id) ON DELETE CASCADE
);

-- 9. المجموعات المرتبطة الإضافية
CREATE TABLE IF NOT EXISTS product_related_groups (
  product_id VARCHAR(36) NOT NULL,
  group_id   VARCHAR(36) NOT NULL,
  PRIMARY KEY (product_id, group_id),
  FOREIGN KEY (product_id) REFERENCES products(id)       ON DELETE CASCADE,
  FOREIGN KEY (group_id)   REFERENCES product_groups(id)  ON DELETE CASCADE
);

-- 10. سجلات البحث للتحليلات
CREATE TABLE IF NOT EXISTS search_logs (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  query      VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_query (query)
);

-- 11. إصدارات تطبيق الموبايل (OTA / APK updates)
CREATE TABLE IF NOT EXISTS app_version (
  id             INT PRIMARY KEY DEFAULT 1,
  latest_version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
  download_url   TEXT NOT NULL,
  force_update   BOOLEAN DEFAULT TRUE,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 12. إعدادات المساعد الذكي
CREATE TABLE IF NOT EXISTS ai_settings (
  id                  INT PRIMARY KEY DEFAULT 1,
  custom_instructions TEXT,
  welcome_message     VARCHAR(500) DEFAULT 'أهلاً بيك في حكيم جروب! 🌟 أنا المساعد الذكي، أقدر أساعدك إزاي في اختيار أنسب خامات التغليف؟',
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
