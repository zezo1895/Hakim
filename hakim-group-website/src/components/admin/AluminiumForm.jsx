import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Upload,
  Box,
  Image as ImageIcon,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Layers,
  Plus,
  Trash2,
  Edit2,
  Check,
} from "lucide-react";
import {
  getStoredAluminiumProducts,
  saveStoredAluminiumProducts,
  generateUUID,
} from "../../data/aluminiumProfiles";
import WoodFinishesModal from "./WoodFinishesModal";

export default function AluminiumForm({
  editProduct,
  onClose,
  onSaved,
  apiBase = "",
  materialGroups = [],
  onRefreshLookups,
}) {
  const [name, setName] = useState(editProduct?.name || "");
  const [code, setCode] = useState(editProduct?.code || "");
  const [showWoodModal, setShowWoodModal] = useState(false);

  // Derive API root
  const apiRoot = (
    import.meta.env.VITE_API_URL ||
    (apiBase ? apiBase.replace(/\/products$/, "") : "") ||
    "http://localhost:5000/api"
  ).replace(/\/$/, "");

  // Categories (materials under aluminium category)
  const [categories, setCategories] = useState([]);
  const [selectedCatId, setSelectedCatId] = useState(editProduct?.material_id || "");
  const [showCatManager, setShowCatManager] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatName, setEditingCatName] = useState("");
  const [alCatId, setAlCatId] = useState("al-cat-01");

  // Fetch categories from API
  const fetchCategories = useCallback(async (selectIdAfter = null) => {
    try {
      const res = await fetch(`${apiRoot}/products/materials`);
      if (res.ok) {
        const data = await res.json();
        const alCat = Array.isArray(data)
          ? data.find(
              (g) =>
                g.name === "ألومنيوم" ||
                g.id === "al-cat-01" ||
                String(g.name).toLowerCase().includes("ألومنيوم")
            )
          : null;
        if (alCat) {
          if (alCat.id) setAlCatId(alCat.id);
          const mats = alCat.materials || [];
          setCategories(mats);
          if (selectIdAfter) {
            setSelectedCatId(selectIdAfter);
          } else if (!selectedCatId && mats.length > 0) {
            setSelectedCatId(editProduct?.material_id || mats[0].id);
          }
        }
      }
    } catch (e) {
      console.warn("Could not fetch categories:", e);
    }
  }, [apiRoot, selectedCatId, editProduct]);

  useEffect(() => {
    if (Array.isArray(materialGroups) && materialGroups.length > 0) {
      const alCat = materialGroups.find(
        (g) =>
          g.name === "ألومنيوم" ||
          g.id === "al-cat-01" ||
          String(g.name).toLowerCase().includes("ألومنيوم")
      );
      if (alCat) {
        if (alCat.id) setAlCatId(alCat.id);
        const mats = alCat.materials || [];
        setCategories(mats);
        if (!selectedCatId && mats.length > 0) {
          setSelectedCatId(editProduct?.material_id || mats[0].id);
        }
      }
    }
    fetchCategories();
  }, [materialGroups]);

  // Handle Add Category
  const handleAddCategory = async () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    setIsAddingCat(true);
    setErrorMessage("");
    try {
      const token = localStorage.getItem("hakim_admin_token");
      const res = await fetch(`${apiRoot}/products/materials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          name: trimmed,
          category_id: alCatId || "al-cat-01",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewCatName("");
        await fetchCategories(data.id);
        onRefreshLookups?.();
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMessage(err.error || "فشل إضافة التصنيف");
      }
    } catch {
      setErrorMessage("فشل الاتصال بالخادم لإضافة التصنيف");
    } finally {
      setIsAddingCat(false);
    }
  };

  // Handle Delete Category
  const handleDeleteCategory = async (catId, catName) => {
    if (!window.confirm(`هل أنت متأكد من حذف تصنيف "${catName}"؟`)) return;
    setErrorMessage("");
    try {
      const token = localStorage.getItem("hakim_admin_token");
      const res = await fetch(`${apiRoot}/products/materials/${catId}`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (res.ok) {
        if (selectedCatId === catId) {
          setSelectedCatId("");
        }
        await fetchCategories();
        onRefreshLookups?.();
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMessage(err.error || "فشل حذف التصنيف");
      }
    } catch {
      setErrorMessage("فشل الاتصال بالخادم لحذف التصنيف");
    }
  };

  // Handle Update Category
  const handleUpdateCategory = async (catId) => {
    const trimmed = editingCatName.trim();
    if (!trimmed) {
      setEditingCatId(null);
      return;
    }
    setErrorMessage("");
    try {
      const token = localStorage.getItem("hakim_admin_token");
      const res = await fetch(`${apiRoot}/products/materials/${catId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) {
        setEditingCatId(null);
        setEditingCatName("");
        await fetchCategories();
        onRefreshLookups?.();
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMessage(err.error || "فشل تعديل التصنيف");
      }
    } catch {
      setErrorMessage("فشل الاتصال بالخادم لتعديل التصنيف");
    }
  };
  
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
      
      const targetMatId = selectedCatId || (categories.length > 0 ? categories[0].id : "al-mat-01");
      fd.append("material_id", targetMatId);
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
      const baseUrl = apiBase || `${apiRoot}/products`;
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
      onRefreshLookups?.();

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
          اسم القطاع الهندسي *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="مثال: قطاع IF-588 أو ضلفة باب 8 سم..."
          className="admin-input w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
          required
        />
      </div>

      {/* 2. كود المنتج وتصنيف الألومنيوم */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="admin-label block text-sm font-bold text-gray-700 mb-1.5">
            كود القطاع *
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="مثال: IF-588 أو AL-104..."
            className="admin-input w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue font-mono"
            required
          />
          <p className="text-[11px] text-gray-400 mt-1">يجب أن يكون الكود فريداً في النظام.</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="admin-label block text-sm font-bold text-gray-700">
              تصنيف القطاع (الكاتيجوري) *
            </label>
            <button
              type="button"
              onClick={() => setShowCatManager(!showCatManager)}
              className="text-xs font-bold text-brand-blue hover:text-blue-700 inline-flex items-center gap-1 transition-colors"
            >
              <Layers size={13} />
              <span>{showCatManager ? "إخفاء إدارة التصنيفات" : "+ إدارة التصنيفات"}</span>
            </button>
          </div>

          <select
            value={selectedCatId}
            onChange={(e) => setSelectedCatId(e.target.value)}
            className="admin-input w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue bg-white font-medium text-sm"
          >
            {categories.length === 0 ? (
              <option value="al-mat-01">قطاعات ألومنيوم عامة</option>
            ) : (
              categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))
            )}
          </select>
          <p className="text-[11px] text-gray-400 mt-1">
            يحدد تصنيف البروفيل (أبواب وشبابيك، واجهات، مطابخ...).
          </p>
        </div>
      </div>

      {/* لوحة إدارة وإضافة التصنيفات السريعة */}
      {showCatManager && (
        <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-3.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Layers size={15} className="text-brand-blue" />
              <span>إدارة تصنيفات الألومنيوم (إضافة، تعديل، حذف)</span>
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {categories.length} تصنيف متاح
            </span>
          </div>

          {/* إضافة تصنيف جديد */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCategory();
                }
              }}
              placeholder="اكتب تصنيف جديد (مثل: أبواب وشبابيك، واجهات كرتن وول...)"
              className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
            <button
              type="button"
              disabled={isAddingCat || !newCatName.trim()}
              onClick={handleAddCategory}
              className="px-4 py-2 bg-brand-blue text-white rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0 flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>{isAddingCat ? "جاري الإضافة..." : "إضافة تصنيف"}</span>
            </button>
          </div>

          {/* قائمة التصنيفات الحالية */}
          <div className="pt-2 border-t border-slate-200/60">
            <p className="text-[11px] font-semibold text-slate-500 mb-2">التصنيفات المتاحة حالياً:</p>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
              {categories.map((cat) => {
                const isSelected = selectedCatId === cat.id;
                const isEditing = editingCatId === cat.id;

                if (isEditing) {
                  return (
                    <div
                      key={cat.id}
                      className="inline-flex items-center gap-1 p-1 bg-white border border-brand-blue rounded-xl shadow-sm"
                    >
                      <input
                        type="text"
                        value={editingCatName}
                        onChange={(e) => setEditingCatName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleUpdateCategory(cat.id);
                          }
                        }}
                        className="px-2 py-0.5 text-xs border-none outline-none font-bold text-slate-800 w-28"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateCategory(cat.id)}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        title="حفظ"
                      >
                        <Check size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCatId(null)}
                        className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                        title="إلغاء"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={cat.id}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-blue-50 border-brand-blue text-brand-blue font-bold shadow-sm"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span
                      onClick={() => setSelectedCatId(cat.id)}
                      className="cursor-pointer"
                      title="انقر للاختيار لهذا المنتج"
                    >
                      {cat.name}
                    </span>

                    <div className="flex items-center gap-1 opacity-70 hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCatId(cat.id);
                          setEditingCatName(cat.name);
                        }}
                        className="text-slate-400 hover:text-brand-blue transition-colors p-0.5"
                        title="تعديل الاسم"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        className="text-slate-400 hover:text-red-600 transition-colors p-0.5"
                        title={`حذف تصنيف ${cat.name}`}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
            <p className="text-sm font-bold text-slate-700 mb-1">
              اسحب وأفلت ملف الـ 3D هنا أو <span className="text-brand-blue underline">تصفح من جهازك</span>
            </p>
            <p className="text-xs text-slate-400">
              صيغة .glb فقط (glTF 2.0 Binary)
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

      {/* التشطيبات الخشبية RAL Wood Finishes */}
      <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-amber-900 mb-0.5">
            تأثيرات الطلاء والتشطيبات الخشبية (Wood Sublimation)
          </h4>
          <p className="text-[11px] text-amber-700 leading-relaxed">
            يدعم محاكي الـ 3D تطبيق طلاء السابليه الخشن والأكسدة بالإضافة إلى تغليف تأثير الخشب الهندسي.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowWoodModal(true)}
          className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition-colors"
        >
          معاينة درجات الخشب
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
