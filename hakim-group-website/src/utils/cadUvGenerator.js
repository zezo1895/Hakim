// src/utils/cadUvGenerator.js
// توليد إحداثيات UV ثلاثية الأبعاد (Box UV Projection) لقطاعات الألومنيوم الهندسية
// تضمن ظهور تجزيعة الخشب والملمس الحقيقي لكافة موديلات الـ CAD مهما كانت وحداتها (متر، سم، ملم)

import * as THREE from 'three';

export function ensureUVs(mesh) {
  if (!mesh.isMesh || !mesh.geometry) return;
  const geom = mesh.geometry;

  geom.computeBoundingBox();
  const bbox = geom.boundingBox;
  if (!bbox) return;

  const sizeX = Math.max(0.00001, bbox.max.x - bbox.min.x);
  const sizeY = Math.max(0.00001, bbox.max.y - bbox.min.y);
  const sizeZ = Math.max(0.00001, bbox.max.z - bbox.min.z);

  const pos = geom.attributes.position;
  const norm = geom.attributes.normal;
  const count = pos.count;
  const uvs = new Float32Array(count * 2);
  const uvMetric = new Float32Array(count * 2); // uv1: إسقاط صندوقي بالمليمتر (حبيبات متساوية الاتجاه)
  const maxDim = Math.max(sizeX, sizeY, sizeZ);
  const unitToMm = maxDim >= 50 ? 1 : maxDim >= 1 ? 10 : 1000; // نفس كشف الوحدات في المشغل

  // تحديد محور سحب القطاع (Extrusion Axis) تلقائياً بناءً على البعد الأطول
  const isExtrudedZ = sizeZ >= sizeX && sizeZ >= sizeY;
  const isExtrudedY = sizeY >= sizeX && sizeY >= sizeZ;

  for (let i = 0; i < count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    // تطبيع الإحداثيات بين 0.0 و 1.0 بالنسبة لحجم المجسم
    const nxPos = (x - bbox.min.x) / sizeX;
    const nyPos = (y - bbox.min.y) / sizeY;
    const nzPos = (z - bbox.min.z) / sizeZ;

    let nx = 0, ny = 0, nz = 1;
    if (norm) {
      nx = Math.abs(norm.getX(i));
      ny = Math.abs(norm.getY(i));
      nz = Math.abs(norm.getZ(i));
    }

    let u = 0;
    let v = 0;

    if (isExtrudedZ) {
      // السحب بطول محور Z (الشائع في معظم قطاعات الألومنيوم 100mm)
      // تكرار التجزيعة 4 مرات طولياً مع اتجاه السحب
      u = nzPos * 4.0;
      v = (nx >= ny ? nyPos : nxPos) * 1.5;
    } else if (isExtrudedY) {
      // السحب بطول محور Y
      u = nyPos * 4.0;
      v = (nx >= nz ? nzPos : nxPos) * 1.5;
    } else {
      // السحب بطول محور X
      u = nxPos * 4.0;
      v = (ny >= nz ? nzPos : nyPos) * 1.5;
    }

    uvs[i * 2] = u;
    uvs[i * 2 + 1] = v;

    // uv1 متري: الوجه الجانبي (a,e) والعلوي (b,e) وأغطية النهاية (a,b) حسب أكبر مركّبة للـ normal
    const ax = (x - bbox.min.x) * unitToMm;
    const ay = (y - bbox.min.y) * unitToMm;
    const az = (z - bbox.min.z) * unitToMm;
    let mu, mv;
    if (isExtrudedZ) {
      if (nz >= nx && nz >= ny) { mu = ax; mv = ay; } else if (nx >= ny) { mu = ay; mv = az; } else { mu = ax; mv = az; }
    } else if (isExtrudedY) {
      if (ny >= nx && ny >= nz) { mu = ax; mv = az; } else if (nx >= nz) { mu = az; mv = ay; } else { mu = ax; mv = ay; }
    } else {
      if (nx >= ny && nx >= nz) { mu = ay; mv = az; } else if (ny >= nz) { mu = az; mv = ax; } else { mu = ay; mv = ax; }
    }
    uvMetric[i * 2] = mu;
    uvMetric[i * 2 + 1] = mv;
  }

  // ضبط إحداثيات الـ UV وتفعيل التحديث في كارت الشاشة
  geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geom.attributes.uv.needsUpdate = true;
  geom.setAttribute('uv1', new THREE.BufferAttribute(uvMetric, 2));
  geom.attributes.uv1.needsUpdate = true;
}
