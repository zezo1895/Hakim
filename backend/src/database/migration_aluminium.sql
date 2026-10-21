-- ============================================
-- Migration: إضافة دعم قطاع الألومنيوم وملفات المجسمات 3D (GLB)
-- شغّلها على قاعدة البيانات:
--   mysql -u root -p hakim_group < migration_aluminium.sql
-- ============================================

-- 1. إضافة عمودي model_url و model_file_id لجدول products
SET @col_url_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'products'
    AND COLUMN_NAME = 'model_url'
);

SET @sql_url := IF(
  @col_url_exists = 0,
  'ALTER TABLE products ADD COLUMN model_url VARCHAR(500) DEFAULT NULL AFTER notes_en',
  'SELECT "model_url already exists"'
);
PREPARE stmt_url FROM @sql_url;
EXECUTE stmt_url;
DEALLOCATE PREPARE stmt_url;

SET @col_fid_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'products'
    AND COLUMN_NAME = 'model_file_id'
);

SET @sql_fid := IF(
  @col_fid_exists = 0,
  'ALTER TABLE products ADD COLUMN model_file_id VARCHAR(255) DEFAULT NULL AFTER model_url',
  'SELECT "model_file_id already exists"'
);
PREPARE stmt_fid FROM @sql_fid;
EXECUTE stmt_fid;
DEALLOCATE PREPARE stmt_fid;

-- 2. التأكد من وجود فئة الألومنيوم الرئيسية في material_categories
INSERT INTO material_categories (id, name)
VALUES ('al-cat-01', 'ألومنيوم')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 3. التأكد من وجود خامات وتصنيفات فرعية تحت الألومنيوم لربط المنتجات بها
INSERT INTO materials (id, category_id, name)
VALUES 
  ('al-mat-01', 'al-cat-01', 'قطاعات ألومنيوم عامة'),
  ('al-mat-02', 'al-cat-01', 'أبواب وشبابيك'),
  ('al-mat-03', 'al-cat-01', 'واجهات وكرتن وول'),
  ('al-mat-04', 'al-cat-01', 'مطابخ وديكور'),
  ('al-mat-05', 'al-cat-01', 'قطاعات إنشائية ومعمارية')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 4. التأكد من وجود فئتي المواسير والبلاستيك لضمان تكامل القطاعات الثلاثة
INSERT INTO material_categories (id, name)
VALUES ('pipes-cat-01', 'مواسير')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO materials (id, category_id, name)
VALUES ('pipes-mat-01', 'pipes-cat-01', 'مواسير بلاستيك')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO material_categories (id, name)
VALUES ('plastic-cat-01', 'بلاستيك')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 5. تحديث أي معرفات قديمة لقطاعات الألومنيوم لتكون UUIDs قياسية
UPDATE products SET id = '0ea1518e-7853-48ad-94a1-7d24b20f846c' 
WHERE (code = 'IF-588' OR id = 'IF-588' OR id = 'al-if-588') AND id != '0ea1518e-7853-48ad-94a1-7d24b20f846c';

UPDATE products SET id = 'c2e13df2-b032-42f4-a4b4-619d3c0fd645' 
WHERE (code = 'IF-589' OR id = 'IF-589' OR id = 'al-if-589') AND id != 'c2e13df2-b032-42f4-a4b4-619d3c0fd645';

UPDATE products SET id = UUID() 
WHERE (material_id = 'al-mat-01' OR model_url IS NOT NULL) AND LENGTH(id) != 36;

-- 6. إدراج قطاعات الألومنيوم الافتراضية بمعرفات UUID v4
INSERT INTO products (id, name, code, material_id, temp, size, notes, model_url)
VALUES ('0ea1518e-7853-48ad-94a1-7d24b20f846c', 'IF-588', 'IF-588', 'al-mat-01', 'both', '75.0 × 17.5 mm', 'بروفيل ألومنيوم معماري عالي الدقة (IF-588).', '/models/IF-588.glb')
ON DUPLICATE KEY UPDATE model_url = VALUES(model_url), size = VALUES(size);

INSERT INTO product_images (id, product_id, url, public_id)
VALUES ('img-0ea1518e-7853-48ad', '0ea1518e-7853-48ad-94a1-7d24b20f846c', '/models/IF-588.png', 'local_if_588')
ON DUPLICATE KEY UPDATE url = VALUES(url);

INSERT INTO products (id, name, code, material_id, temp, size, notes, model_url)
VALUES ('c2e13df2-b032-42f4-a4b4-619d3c0fd645', 'IF-589', 'IF-589', 'al-mat-01', 'both', '61.5 × 20.0 mm', 'بروفيل ألومنيوم إنشائي للزجاج المزدوج (IF-589).', '/models/IF-589.glb')
ON DUPLICATE KEY UPDATE model_url = VALUES(model_url), size = VALUES(size);

INSERT INTO product_images (id, product_id, url, public_id)
VALUES ('img-c2e13df2-b032-42f4', 'c2e13df2-b032-42f4-a4b4-619d3c0fd645', '/models/IF-589.png', 'local_if_589')
ON DUPLICATE KEY UPDATE url = VALUES(url);
