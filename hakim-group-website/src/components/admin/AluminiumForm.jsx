import React, { useState, useRef } from "react";
import { Upload, Box, Image as ImageIcon, X, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import {
  getStoredAluminiumProducts,
  saveStoredAluminiumProducts,
  generateUUID,
} from "../../data/aluminiumProfiles";
import WoodFinishesModal from "./WoodFinishesModal";

export default function AluminiumForm({ editProduct, onClose, onSaved, apiBase = "" }) {
  const [name, setName] = useState(editProduct?.name || "");
  const [code, setCode] = useState(editProduct?.code || "");
  const [showWoodModal, setShowWoodModal] = useState(false);
  
  // 2D Image State
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(
    editProduct?.images?.[0]?.url || editProduct?.images?.[0] || null
  );
  const [removeExistingImage, setRemoveExistingImage] = useState(false);

  // 3D GLB Model State
  const [glbFile, setGlbFile] = useState(null);
  const [glbInfo, setGlbInfo] = useState(() => {
    if (editProduct?.model_url) {
      return {
        isExisting: true,
        url: editProduct.model_url,
        name: "مجسم 3D حالي (GLB)",
      };
    }
    return null;
  });
  const [removeExistingModel, setRemoveExistingModel] = useState(false);

  // Upload Progress & Errors
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const imageInputRef = useRef(null);
  const glbInputRef = useRef(null);

  // Handle 2D Image Selection
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("يجب أن يكون الملف المختار صورة صالحة (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage("حجم الصورة يجب ألا يتجاوز 8 ميجابايت.");
      return;
    }

    setErrorMessage("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveExistingImage(false);
  };

  // Handle 3D GLB File Selection with instant client-side validation
  const handleGlbChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".glb")) {
      setErrorMessage("يجب اختيار ملف ثلاثي الأبعاد بصيغة .glb فقط.");
      return;
    }

    // Client-side header validation (glTF magic bytes check)
    try {
      const buffer = await file.slice(0, 4).arrayBuffer();
      const header = new TextDecoder().decode(buffer);
      if (header !== "glTF") {
        setErrorMessage("الملف غير صالح: ترويسة الملف ليست بصيغة glTF 2.0 Binary.");
        return;
      }
    } catch {
      // Fallback if arrayBuffer fails
    }

    setErrorMessage("");
    setGlbFile(file);
    setGlbInfo({
      isExisting: false,
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
    });
    setRemoveExistingModel(false);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 MB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("يرجى إدخال اسم القطاع.");
      return;
    }
    if (!code.trim()) {
      setErrorMessage("يرجى إدخال كود القطاع.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("code", code.trim());
      fd.append("category", "ألومنيوم");
      fd.append("material_id", "al-mat-01");
      fd.append("type_id", "al-type-01");
      fd.append("temp", "both");

      // Handle 2D Image
      if (imageFile) {
        fd.append("images", imageFile);
      }
      if (removeExistingImage && editProduct?.images?.[0]?.id) {
        fd.append("remove_image_ids", JSON.stringify([editProduct.images[0].id]));
      }

      // Handle 3D GLB Model
      if (glbFile) {
        fd.append("model", glbFile);
      } else if (removeExistingModel) {
        fd.append("remove_model", "true");
      }

      // Prepare target endpoint
      const baseUrl = apiBase || (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/products` : "/api/products");
      const url = editProduct ? `${baseUrl}/${editProduct.id}` : baseUrl;
      const method = editProduct ? "PUT" : "POST";

      const token = localStorage.getItem("hakim_admin_token");

      const responseData = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url);

        if (token) {
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        }

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percent);
          }
        };

        xhr.onload = () => {
          let resData = {};
          try {
            resData = JSON.parse(xhr.responseText);
          } catch {
            resData = {};
          }

          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(resData);
          } else {
            let err = resData.error || `فشل الحفظ على السيرفر (كود: ${xhr.status})`;
            if (xhr.status === 400 && resData.error?.includes("الكود مستخدم")) {
              err = "هذا الكود مستخدم بالفعل لمنتج آخر. يرجى اختيار كود غير مكرر.";
            } else if (xhr.status === 401 || xhr.status === 403) {
              err = "انتهت جلسة تسجيل الدخول، يرجى تسجيل الدخول مجدداً للأدمن.";
            }
            reject(new Error(err));
          }
        };

        xhr.onerror = () => {
          reject(new Error("تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت."));
        };

        xhr.send(fd);
      });

      onSaved(editProduct ? "تم تحديث منتج الألومنيوم بنجاح ✓" : "تمت إضافة منتج الألومنيوم بنجاح ✓");
      onClose();

      if (window.refreshAdminData && typeof window.refreshAdminData === "function") {
        window.refreshAdminData();
      }
    } catch (err) {
      setErrorMessage(err.message || "حدث خطأ أثناء الحفظ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-7 space-y-6">
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-sm">
          <AlertCircle size={20} className="shrink-0 text-red-500 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
          <button
            type="button"
            onClick={() => setErrorMessage("")}
            className="text-red-400 hover:text-red-600"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* 1. اسم المنتج */}
      <div>
        <label className="admin-label block text-sm font-bold text-gray-700 mb-1.5">
          اسم قطاع الألومنيوم *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="مثال: قطاع ألومنيوم تانجو زجاج مفرد..."
          className="admin-input w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
          required
        />
      </div>

      {/* 2. كود المنتج */}
      <div>
        <label className="admin-label block text-sm font-bold text-gray-700 mb-1.5">
          كود القطاع *
        </label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="مثال: IF 588 أو AL-104..."
          className="admin-input w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue font-mono"
          required
        />
        <p className="text-xs text-gray-400 mt-1">يجب أن يكون الكود فريداً وغير مكرر في النظام.</p>
      </div>

      {/* 3. الصورة ثنائية الأبعاد (2D Image) */}
      <div>
        <label className="admin-label block text-sm font-bold text-gray-700 mb-1.5">
          صورة المنتج ثنائية الأبعاد (2D)
        </label>
        <div className="flex items-start gap-4">
          {imagePreview && !removeExistingImage ? (
            <div className="relative w-32 aspect-[4/3] rounded-2xl border border-gray-200 overflow-hidden bg-gray-50 shadow-sm shrink-0 group">
              <img
                src={imagePreview}
                alt="معاينة"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                  setRemoveExistingImage(true);
                }}
                className="absolute top-1.5 left-1.5 p-1 bg-red-600/80 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                title="حذف الصورة"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div
              onClick={() => imageInputRef.current?.click()}
              className="w-32 aspect-[4/3] rounded-2xl border-2 border-dashed border-gray-200 hover:border-brand-blue flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-blue-50/50 transition-colors shrink-0"
            >
              <ImageIcon size={24} className="text-gray-400 mb-1" />
              <span className="text-[11px] font-bold text-gray-500">اختر صورة</span>
            </div>
          )}

          <div className="flex-1">
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-2 mb-2"
            >
              <Upload size={14} />
              <span>{imagePreview ? "تغيير الصورة" : "رفع صورة 2D"}</span>
            </button>
            <p className="text-xs text-gray-400 leading-relaxed">
              ستظهر هذه الصورة في الكتالوج الرئيسي والمعاينة الجانبية. الحد الأقصى 8 ميجابايت (PNG / JPG).
            </p>
          </div>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>
      </div>

      {/* 4. ملف 3D بصيغة GLB */}
      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
        <label className="admin-label block text-sm font-bold text-slate-800 mb-1.5 flex items-center gap-2">
          <Box size={18} className="text-brand-blue" />
          <span>ملف المجسم ثلاثي الأبعاد (3D GLB Model)</span>
        </label>
        
        {glbInfo && !removeExistingModel ? (
          <div className="mt-3 p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800 truncate max-w-xs">{glbInfo.name}</p>
                <p className="text-xs text-emerald-600 font-medium">
                  {glbInfo.isExisting ? "مجسم محفوظ على السحابة" : `جاهز للرفع (${glbInfo.size})`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => glbInputRef.current?.click()}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5"
              >
                <RefreshCw size={13} />
                <span>استبدال</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setGlbFile(null);
                  setGlbInfo(null);
                  setRemoveExistingModel(true);
                }}
                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="إلغاء الملف"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => glbInputRef.current?.click()}
            className="mt-3 p-6 border-2 border-dashed border-slate-300 hover:border-brand-blue rounded-xl flex flex-col items-center justify-center cursor-pointer bg-white hover:bg-blue-50/30 transition-all text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-brand-blue flex items-center justify-center mb-2">
              <Upload size={22} />
            </div>
            <p className="text-sm font-bold text-gray-800 mb-1">
              اسحب وأفلت ملف الـ GLB هنا أو اضغط للاختيار
            </p>
            <p className="text-xs text-gray-400">
              يُقبل فقط ملفات بصيغة <span className="font-mono text-brand-blue font-bold">.glb</span> بترويسة glTF القياسية (الحد الأقصى 30MB)
            </p>
          </div>
        )}

        <input
          ref={glbInputRef}
          type="file"
          accept=".glb"
          onChange={handleGlbChange}
          className="hidden"
        />
      </div>

      {/* 5. إدارة صور وخامات الخشب للألومنيوم */}
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl shrink-0">
            🌲
          </div>
          <div>
            <p className="text-xs font-bold text-amber-950">إدارة صور وخامات الخشب للألومنيوم</p>
            <p className="text-[11px] text-amber-800/80">
              رفع عينات الخشب، المعاينة الحية 3D على القطاع، ونسخ كود التشطيب الهندسي
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowWoodModal(true)}
          className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm"
        >
          إدارة عينات الخشب
        </button>
      </div>

      {showWoodModal && (
        <WoodFinishesModal
          isOpen={showWoodModal}
          onClose={() => setShowWoodModal(false)}
        />
      )}

      {/* شريط تقدم الرفع */}
      {isSubmitting && (
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
          <div className="flex items-center justify-between text-xs font-bold text-brand-blue mb-2">
            <span>جاري الرفع والمعالجة إلى السحابة...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full h-2.5 bg-blue-200/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-blue transition-all duration-300 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* أزرار الإجراءات */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-bold transition-colors"
        >
          إلغاء
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-7 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-brand-blue/20 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>جاري الحفظ...</span>
            </>
          ) : (
            <span>{editProduct ? "حفظ التعديلات" : "إضافة قطاع الألومنيوم"}</span>
          )}
        </button>
      </div>
    </form>
  );
}
