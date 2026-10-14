-- ============================================================
-- كود إضافة قطاعات الألومنيوم الثلاثة كاملة إلى قاعدة البيانات (DBeaver)
-- باستخدام REPLACE لتجنب أي تعارض في الصور
-- ============================================================

-- 1. التأكد من وجود أعمدة الموديلات 3D
ALTER TABLE products ADD COLUMN IF NOT EXISTS model_url VARCHAR(500) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS model_file_id VARCHAR(200) DEFAULT NULL;

-- 2. إدخال الفئة والخامة ونوع المنتج
INSERT IGNORE INTO material_categories (id, name) VALUES ('al-cat-01', 'ألومنيوم');
INSERT IGNORE INTO materials (id, category_id, name) VALUES ('al-mat-01', 'al-cat-01', 'قطاعات ألومنيوم');
INSERT IGNORE INTO product_types (id, name) VALUES ('al-type-01', 'قطاع ألومنيوم');

-- 3. إدراج أو تحديث قطاعات الألومنيوم الثلاثة بروابط ImageKit
REPLACE INTO products (id, name, name_en, code, type_id, material_id, temp, size, notes, model_url)
VALUES 
('a39b4d82-9f12-4e89-8d54-1b98cf587001', 'IF-587', 'IF-587', 'IF-587', 'al-type-01', 'al-mat-01', 'both', '46.2 × 20.4 mm', 'بروفيل ألومنيوم معماري عالي الدقة (IF-587).', 'https://ik.imagekit.io/wdtbpfrpv/hakim/aluminium/models/IF-587.glb'),
('0ea1518e-7853-48ad-94a1-7d24b20f846c', 'IF-588', 'IF-588', 'IF-588', 'al-type-01', 'al-mat-01', 'both', '75.0 × 17.5 mm', 'بروفيل ألومنيوم معماري عالي الدقة (IF-588).', 'https://ik.imagekit.io/wdtbpfrpv/hakim/aluminium/models/IF-588.glb'),
('c2e13df2-b032-42f4-a4b4-619d3c0fd645', 'IF-589', 'IF-589', 'IF-589', 'al-type-01', 'al-mat-01', 'both', '61.5 × 20.0 mm', 'بروفيل ألومنيوم إنشائي للزجاج المزدوج (IF-589).', 'https://ik.imagekit.io/wdtbpfrpv/hakim/aluminium/models/IF-589.glb');

-- 4. إدراج أو استبدال صور المخططات 2D من ImageKit
REPLACE INTO product_images (id, product_id, url, public_id)
VALUES 
('img-if-587', 'a39b4d82-9f12-4e89-8d54-1b98cf587001', 'https://ik.imagekit.io/wdtbpfrpv/hakim/aluminium/models/IF-587.png', 'hakim_al_if_587'),
('img-if-588', '0ea1518e-7853-48ad-94a1-7d24b20f846c', 'https://ik.imagekit.io/wdtbpfrpv/hakim/aluminium/models/IF-588.png', 'hakim_al_if_588'),
('img-if-589', 'c2e13df2-b032-42f4-a4b4-619d3c0fd645', 'https://ik.imagekit.io/wdtbpfrpv/hakim/aluminium/models/IF-589.png', 'hakim_al_if_589');
