
import React, { useState, useRef, useMemo } from "react";
import { X, Upload, Save, XCircle, Loader2, GripVertical, Search } from "lucide-react";

export default function BulkImageEditor({ products, onClose, onRefresh, apiFetch }) {
  const [removedImgIds, setRemovedImgIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRefs = useRef({});
  const [draggedItemInfo, setDraggedItemInfo] = useState(null);

  // Unified state for product images: { productId: [ { type: "existing", data: img }, { type: "new", data: File, id: tempId } ] }
  const [productImages, setProductImages] = useState(() => {
    const map = {};
    products.forEach(p => {
      map[p.id] = (p.images || []).map(img => ({ type: "existing", data: img, id: img.id }));
    });
    return map;
  });

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [products, searchTerm]);

  const onRemove = (pid, imgId) => {
    const imgToRemove = productImages[pid].find(i => i.id === imgId);
    if (imgToRemove && imgToRemove.type === "existing") {
      setRemovedImgIds(prev => [...prev, imgToRemove.data.id]);
    }
    
    setProductImages(prev => ({
      ...prev,
      [pid]: prev[pid].filter(i => i.id !== imgId)
    }));
  };

  const onFileChange = (e, pid) => {
    const files = Array.from(e.target.files).filter(f => f.type.startsWith("image/") && f.size <= 8 * 1024 * 1024);
    if (!files.length) return;
    
    const newItems = files.map((f, i) => ({
      type: "new",
      data: f,
      id: `temp-${Date.now()}-${i}`
    }));

    setProductImages(prev => ({
      ...prev,
      [pid]: [...(prev[pid] || []), ...newItems]
    }));
    e.target.value = "";
  };

  const handleDragStart = (pid, iIndex) => {
    setDraggedItemInfo({ pid, iIndex });
  };

  const handleDragOver = (e, pid, targetIndex) => {
    e.preventDefault();
    if (!draggedItemInfo || draggedItemInfo.pid !== pid || draggedItemInfo.iIndex === targetIndex) return;

    setProductImages(prev => {
      const arr = [...prev[pid]];
      const draggedItem = arr[draggedItemInfo.iIndex];
      arr.splice(draggedItemInfo.iIndex, 1);
      arr.splice(targetIndex, 0, draggedItem);
      return { ...prev, [pid]: arr };
    });
    
    setDraggedItemInfo({ pid, iIndex: targetIndex });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      
      if (removedImgIds.length) {
        fd.append("remove_image_ids", JSON.stringify(removedImgIds));
      }

      const orders = {}; // { pid: ["uuid1", "file:0", "uuid2"] }
      
      Object.keys(productImages).forEach(pid => {
        const pImgs = productImages[pid];
        let fileIndexCounter = 0;
        const orderArr = [];
        
        pImgs.forEach(item => {
          if (item.type === "existing") {
            orderArr.push(item.data.id);
          } else if (item.type === "new") {
            fd.append(`new_images_${pid}`, item.data);
            orderArr.push(`file:${fileIndexCounter}`);
            fileIndexCounter++;
          }
        });
        
        if (orderArr.length > 0 || pImgs.length === 0) {
           orders[pid] = orderArr;
        }
      });
      
      fd.append("orders", JSON.stringify(orders));
      
      const res = await apiFetch("/bulk-images", {
        method: "POST",
        body: fd
      });
      
        if (res.ok) {
        onRefresh();
        onClose();
      } else {
        const err = await res.json();
        alert("حدث خطأ: " + (err.error || ""));
      }
    } catch(e) {
      alert("حدث خطأ: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex flex-col p-4 sm:p-8" dir="rtl">
      <div className="bg-white flex-1 rounded-2xl shadow-xl flex flex-col overflow-hidden w-full max-w-6xl mx-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">تعديل صور جماعي</h2>
            <p className="text-sm text-gray-500 mt-1">
              يمكنك ترتيب الصور بالسحب والإفلات وحذف وإضافة الصور لجميع المنتجات.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="relative">
                <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="ابحث باسم أو كود المنتج" 
                  className="pl-4 pr-10 py-2 border border-gray-200 rounded-xl text-sm w-64 focus:outline-brand-blue"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-brand-blue text-white font-bold rounded-xl flex items-center gap-2 hover:bg-brand-blue/90 disabled:opacity-50"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
            </button>
            <button onClick={onClose} className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-5 bg-gray-50/30">
          <div className="space-y-4">
            {filteredProducts.map(p => (
              <div key={p.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                <div className="w-full lg:w-48 shrink-0 border-b lg:border-b-0 lg:border-l border-gray-100 pb-3 lg:pb-0 lg:pl-4">
                  <div className="font-bold text-gray-800 truncate" title={p.name}>{p.name}</div>
                  <div className="text-sm text-brand-blue font-mono mt-1">{p.code}</div>
                </div>
                
                <div className="flex-1 flex flex-wrap gap-2 items-center">
                  {(productImages[p.id] || []).map((imgObj, i) => (
                    <div 
                      key={imgObj.id} 
                      className={`relative group w-20 h-20 rounded-xl border-2 cursor-move ${draggedItemInfo?.pid === p.id && draggedItemInfo.iIndex === i ? "border-dashed border-brand-blue opacity-50" : "border-gray-200"}`}
                      draggable
                      onDragStart={() => handleDragStart(p.id, i)}
                      onDragOver={(e) => handleDragOver(e, p.id, i)}
                      onDragEnd={() => setDraggedItemInfo(null)}
                    >
                      <img
                        src={imgObj.type === "existing" ? imgObj.data.url : URL.createObjectURL(imgObj.data)}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"100\" height=\"100\"><rect width=\"100\" height=\"100\" fill=\"#f3f4f6\"/><text x=\"50\" y=\"50\" font-size=\"12\" fill=\"#9ca3af\" text-anchor=\"middle\" dy=\".3em\">بدون صورة</text></svg>");
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => onRemove(p.id, imgObj.id)}
                        className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-red-500 text-white rounded-full items-center justify-center hidden group-hover:flex"
                      >
                        <X size={11} />
                      </button>
                      <div className="absolute bottom-1 right-1 text-[10px] bg-black/60 text-white px-1.5 rounded-sm flex items-center gap-1">
                        <GripVertical size={10} className="text-white/70" /> {i + 1}
                      </div>
                    </div>
                  ))}
                  
                  <div 
                    onClick={() => fileInputRefs.current[p.id]?.click()}
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 hover:border-brand-blue hover:bg-blue-50/50 flex flex-col items-center justify-center cursor-pointer transition-colors"
                  >
                    <Upload size={18} className="text-gray-400 mb-1" />
                    <span className="text-[10px] text-gray-500 font-medium">إضافة</span>
                    <input 
                      ref={el => fileInputRefs.current[p.id] = el}
                      type="file" 
                      multiple 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => onFileChange(e, p.id)} 
                    />
                  </div>
                </div>
              </div>
            ))}
            
            {filteredProducts.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                لا يوجد أي منتجات تتطابق مع بحثك
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

