-- ============================================
-- Migration: إضافة ترتيب يدوي للمنتجات (sort_order)
-- شغّلها مرة واحدة بس على قاعدة البيانات الحالية:
--   mysql -u root -p hakim_group < migration_sort_order.sql
-- آمنة تمامًا: لو العمود موجود قبل كده مش هتعمل حاجة.
-- ============================================

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'products'
    AND COLUMN_NAME = 'sort_order'
);

SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE products ADD COLUMN sort_order INT NOT NULL DEFAULT 0 AFTER notes',
  'SELECT "sort_order already exists"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- نبدئ الترتيب الحالي بنفس ترتيب الإنشاء (الأحدث أولاً) عشان الشكل ما يتقلبش فجأة
SET @rownum := 0;
UPDATE products
JOIN (
  SELECT id, (@rownum := @rownum + 1) AS rn
  FROM products
  ORDER BY created_at DESC
) ranked ON ranked.id = products.id
SET products.sort_order = ranked.rn
WHERE products.sort_order = 0;
