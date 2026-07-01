import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Pencil, X, Upload, Search,
  Loader2, CheckCircle2, AlertCircle, Package,
  Settings, ChevronDown, ChevronRight, Tag,
} from "lucide-react";

const API    = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SECRET = import.meta.env.VITE_ADMIN_SECRET;

// ─────────────────────────────────────────────────────────────
// Reusable helpers
// ─────────────────────────────────────────────────────────────
const apiFetch = (path, opts = {}) => {
  const cleanPath = path.startsWith('/products') 
    ? path 
    : path === '' || path === '/' 
      ? '/products' 
      : `/products${path}`;
  
  return fetch(`${API}${cleanPath}`, {
    ...opts,
    headers: { 
      ...opts.headers,
      "x-admin-secret": SECRET 
    },
  });
};

const TEMPS = [
  { value: "hot",  label: "🔥 ساخن" },
  { value: "cold", label: "❄️ بارد" },
  { value: "both", label: "✅ الاتنين" },
];

// ─────────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); });
  return (
    <motion.div dir="rtl"
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className={`fixed bottom-6 right-6 z-[300] flex items-center gap-3 px-5 py-3.5
        rounded-2xl shadow-2xl text-sm font-bold text-white
        ${type === "success" ? "bg-green-600" : "bg-red-500"}`}
    >
      {type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      {msg}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Inline editable list
// ─────────────────────────────────────────────────────────────
function MiniManager({ title, items, onAdd, onDelete, onEdit, placeholder = "اسم جديد..." }) {
  const [input, setInput] = useState("");
  const [editing, setEditing] = useState(null);

  const handleAdd = async () => {
    if (!input.trim()) return;
    await onAdd(input.trim());
    setInput("");
  };

  const handleEdit = async () => {
    if (!editing?.name.trim()) return;
    await onEdit(editing.id, editing.name.trim());
    setEditing(null);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4">
      <h4 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-3">
        {title}
      </h4>

      <div className="space-y-1.5 mb-3 max-h-44 overflow-y-auto">
        {items.map((item) => (
          <div key={item.id}
            className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl group">
            {editing?.id === item.id ? (
              <>
                <input
                  value={editing.name}
                  onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && handleEdit()}
                  className="flex-1 text-sm bg-white border border-brand-blue/40 rounded-lg px-2 py-1 outline-none"
                  autoFocus
                />
                <button onClick={handleEdit}
                  className="text-brand-green text-xs font-bold px-2 py-1 bg-green-50 rounded-lg hover:bg-green-100">
                  حفظ
                </button>
                <button onClick={() => setEditing(null)}
                  className="text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium text-gray-700">{item.name}</span>
                <button onClick={() => setEditing({ id: item.id, name: item.name })}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-brand-blue transition-all">
                  <Pencil size={12} />
                </button>
                <button onClick={() => onDelete(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all">
                  <Trash2 size={12} />
                </button>
              </>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-2">لا يوجد عناصر</p>
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder={placeholder}
          className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2
                     focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
        />
        <button onClick={handleAdd}
          className="px-3 py-2 bg-brand-blue text-white rounded-xl hover:opacity-90
                     transition flex items-center gap-1 text-sm font-bold">
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Materials Manager
// ─────────────────────────────────────────────────────────────
function MaterialsManager({ grouped, onRefresh, toast }) {
  const [expanded, setExpanded] = useState({});
  const [newSub, setNewSub]     = useState({});

  const toggleCat = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const addCategory = async (name) => {
    const res = await apiFetch("/material-categories", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) { toast("تمت الإضافة ✓"); onRefresh(); }
    else toast("حدث خطأ", "error");
  };

  const delCategory = async (id) => {
    if (!confirm("هيتحذف وكل خاماته الفرعية!")) return;
    await apiFetch(`/material-categories/${id}`, { method: "DELETE" });
    onRefresh();
  };

  const editCategory = async (id, name) => {
    await apiFetch(`/material-categories/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    onRefresh();
  };

  const addSub = async (catId) => {
    const name = newSub[catId]?.trim();
    if (!name) return;
    const res = await apiFetch("/materials", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, category_id: catId }),
    });
    if (res.ok) { toast("تمت إضافة الخامة ✓"); setNewSub((p) => ({ ...p, [catId]: "" })); onRefresh(); }
    else toast("موجودة بالفعل", "error");
  };

  const delSub = async (id) => {
    await apiFetch(`/materials/${id}`, { method: "DELETE" });
    onRefresh();
  };

  const editSub = async (id, name) => {
    await apiFetch(`/materials/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    onRefresh();
  };

  return (
    <div className="space-y-3">
      <MiniManager
        title="الفئات الرئيسية (بلاستيك، كرتون...)"
        items={grouped.map((g) => ({ id: g.id, name: g.name }))}
        onAdd={addCategory}
        onDelete={delCategory}
        onEdit={editCategory}
        placeholder="فئة جديدة..."
      />

      {grouped.map((cat) => (
        <div key={cat.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <button
            onClick={() => toggleCat(cat.id)}
            className="w-full flex items-center justify-between px-4 py-3
                       hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-bold text-gray-700">
              خامات <span className="text-brand-blue">{cat.name}</span>
              <span className="mr-2 text-xs text-gray-400">({cat.materials?.length || 0})</span>
            </span>
            {expanded[cat.id] ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>

          <AnimatePresence>
            {expanded[cat.id] && (
              <motion.div
                initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                className="overflow-hidden border-t border-gray-50"
              >
                <div className="p-3 space-y-1.5">
                  {cat.materials?.map((sub) => (
                    <SubItem key={sub.id} item={sub} onDelete={delSub} onEdit={editSub} />
                  ))}

                  <div className="flex gap-2 pt-1">
                    <input
                      value={newSub[cat.id] || ""}
                      onChange={(e) => setNewSub((p) => ({ ...p, [cat.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && addSub(cat.id)}
                      placeholder="مثال: PP، PET، HDPE"
                      className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2
                                 focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                    />
                    <button onClick={() => addSub(cat.id)}
                      className="px-3 py-2 bg-brand-blue text-white rounded-xl hover:opacity-90 transition">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

function SubItem({ item, onDelete, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [name, setName]       = useState(item.name);

  const save = () => { onEdit(item.id, name); setEditing(false); };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl group">
      {editing ? (
        <>
          <input value={name} onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            className="flex-1 text-sm bg-white border border-brand-blue/40 rounded-lg px-2 py-1 outline-none"
            autoFocus />
          <button onClick={save} className="text-xs font-bold text-green-600 px-2 py-1 bg-green-50 rounded-lg">حفظ</button>
          <button onClick={() => setEditing(false)}><X size={13} className="text-gray-400" /></button>
        </>
      ) : (
        <>
          <span className="flex-1 text-sm text-gray-700 font-mono font-semibold">{item.name}</span>
          <button onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-brand-blue">
            <Pencil size={12} />
          </button>
          <button onClick={() => onDelete(item.id)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500">
            <Trash2 size={12} />
          </button>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Lid Selector with manual lid support
// ─────────────────────────────────────────────────────────────
function LidSelector({ selectedLids, onChange }) {
  const [query, setQuery]           = useState("");
  const [results, setResults]       = useState([]);
  const [searching, setSearching]   = useState(false);
  const [noLids, setNoLids]         = useState(selectedLids.length === 0);
  const timer                       = useRef(null);

  useEffect(() => {
    setNoLids(selectedLids.length === 0);
  }, [selectedLids]);

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    const res  = await apiFetch(`/search/lids?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(data);
    setSearching(false);
  }, []);

  const handleQuery = (e) => {
    const v = e.target.value;
    setQuery(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => doSearch(v), 250);
  };

  const addLid = (lid) => {
    if (selectedLids.find((l) => l.id === lid.id)) return;
    onChange([...selectedLids, lid]);
    setNoLids(false);
    setQuery("");
    setResults([]);
  };

  // إضافة غطاء يدوي
  const addManualLid = () => {
    if (!query.trim()) return;
    if (selectedLids.some((l) => l.name === query.trim())) {
      alert("هذا الغطاء مضاف بالفعل");
      return;
    }
    const newLid = {
      id: `manual_${Date.now()}`,
      name: query.trim(),
      manual: true,
      isManual: true,
      source: 'manual'
    };
    onChange([...selectedLids, newLid]);
    setQuery("");
    setResults([]);
    setNoLids(false);
  };

  const removeLid = (id) => {
    const next = selectedLids.filter((l) => l.id !== id);
    onChange(next);
    if (next.length === 0) setNoLids(true);
  };

  const toggleNoLids = () => {
    if (!noLids) { onChange([]); setNoLids(true); }
    else { setNoLids(false); }
  };

  return (
    <div className="space-y-3">
      {/* No lids toggle */}
      <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-brand-blue/30 transition-colors">
        <div
          onClick={toggleNoLids}
          className={`w-10 h-6 rounded-full relative transition-colors cursor-pointer
            ${noLids ? "bg-gray-300" : "bg-brand-blue"}`}
        >
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all
            ${noLids ? "right-1" : "right-5"}`} />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-700">لا توجد أغطية مناسبة</p>
          <p className="text-xs text-gray-400">{noLids ? "محدد — لن يظهر قسم الأغطية" : "غير محدد — يمكنك إضافة أغطية"}</p>
        </div>
      </label>

      {/* Lid picker — hidden when noLids */}
      <AnimatePresence>
        {!noLids && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {/* Selected lids */}
            {selectedLids.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedLids.map((lid) => (
                  <span key={lid.id}
                    className={`inline-flex items-center gap-1.5 pl-1 pr-3 py-1.5 text-xs font-bold rounded-full border
                      ${lid.isManual || lid.manual
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-brand-blue/10 text-brand-blue border-brand-blue/20'}`}
                  >
                    <span>{lid.name}</span>
                    {lid.size && <span className="text-gray-500 text-[10px]">{lid.size}</span>}
                    {(lid.isManual || lid.manual) && (
                      <span className="text-purple-500 text-[9px]">· يدوي</span>
                    )}
                    {!lid.isManual && !lid.manual && lid.material_name && (
                      <span className="text-gray-400 text-[9px]">· {lid.material_name}</span>
                    )}
                    <button onClick={() => removeLid(lid.id)}
                      className="w-4 h-4 bg-brand-blue/20 hover:bg-red-100 hover:text-red-500
                                 rounded-full flex items-center justify-center transition-colors">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search input */}
            <div className="relative">
              <Tag size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={handleQuery}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (results.length > 0) {
                      addLid(results[0]);
                    } else {
                      addManualLid();
                    }
                  }
                }}
                placeholder="ابحث بالاسم أو الكود، أو اكتب اسماً جديداً واضغط Enter"
                className="w-full pr-9 pl-4 py-2.5 text-sm border border-gray-200 rounded-xl
                           focus:outline-none focus:ring-2 focus:ring-brand-blue/30 bg-white"
              />
              {searching && (
                <Loader2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
              )}
            </div>

            {/* Results dropdown */}
            <AnimatePresence>
              {results.length > 0 && (
                <motion.ul
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="border border-gray-200 rounded-2xl mt-1.5 overflow-hidden bg-white shadow-xl max-h-52 overflow-y-auto"
                >
                  {results.map((r) => {
                    const already = selectedLids.some((l) => l.id === r.id);
                    const isManual = r.source === 'manual';
                    return (
                      <li key={r.id}
                        onClick={() => !already && addLid(r)}
                        className={`flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0
                          transition-colors
                          ${already
                            ? "bg-green-50 cursor-default"
                            : isManual 
                              ? "hover:bg-purple-50 cursor-pointer"
                              : "hover:bg-blue-50 cursor-pointer"}`}
                      >
                        {r.thumbnail
                          ? <img src={r.thumbnail} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                          : <div className={`w-9 h-9 rounded-lg shrink-0 flex items-center justify-center
                              ${isManual ? 'bg-purple-100 text-purple-600' : 'bg-gray-100'}`}>
                              {isManual ? '📝' : ''}
                            </div>}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-800 truncate">{r.name}</p>
                          <p className="text-[11px] text-gray-400">
                            {isManual ? (
                              <span className="text-purple-500">غطاء يدوي (غير مسجل كمنتج)</span>
                            ) : (
                              <>
                                {r.code && <span className="font-mono text-brand-blue">{r.code}</span>}
                                {r.code && r.size && " · "}
                                {r.size} · {r.material_name}
                              </>
                            )}
                          </p>
                        </div>
                        {already
                          ? <span className="text-xs font-bold text-green-600">✓ مضاف</span>
                          : <Plus size={15} className={`shrink-0 ${isManual ? 'text-purple-600' : 'text-brand-blue'}`} />}
                      </li>
                    );
                  })}
                </motion.ul>
              )}
            </AnimatePresence>

            {/* رسالة عند عدم وجود نتائج */}
            {query.trim() && !searching && results.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    لا يوجد غطاء باسم "{query.trim()}"
                  </p>
                  <p className="text-xs text-purple-600">سيتم تخزينه كاسم فقط في قاعدة البيانات</p>
                </div>
                <button
                  onClick={addManualLid}
                  className="px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-xl hover:opacity-90 transition flex items-center gap-2"
                >
                  <Plus size={14} />
                  أضف الاسم
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Image Uploader
// ─────────────────────────────────────────────────────────────
function ImageUploader({ newFiles, onNewFiles, existingImgs, onRemoveExisting }) {
  const ref = useRef();
  const add = (files) => {
    const valid = Array.from(files).filter(
      (f) => f.type.startsWith("image/") && f.size <= 5 * 1024 * 1024
    );
    onNewFiles((p) => [...p, ...valid]);
  };

  return (
    <div className="space-y-3">
      {existingImgs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {existingImgs.map((img) => (
            <div key={img.id} className="relative group w-20 h-20">
              <img src={img.url} className="w-full h-full object-cover rounded-xl border-2 border-gray-200" />
              <button type="button" onClick={() => onRemoveExisting(img.id)}
                className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-red-500 text-white rounded-full
                           items-center justify-center hidden group-hover:flex">
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); add(e.dataTransfer.files); }}
        onClick={() => ref.current?.click()}
        className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center
                   cursor-pointer hover:border-brand-blue hover:bg-blue-50/40 transition-all group"
      >
        <Upload size={24} className="mx-auto mb-2 text-gray-300 group-hover:text-brand-blue transition-colors" />
        <p className="text-sm text-gray-500">
          اسحب الصور هنا أو <span className="text-brand-blue font-bold">اختر من جهازك</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">JPG · PNG · WEBP · حجم أقصى 5MB</p>
        <input ref={ref} type="file" multiple accept="image/*" className="hidden"
          onChange={(e) => add(e.target.files)} />
      </div>

      {newFiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {newFiles.map((f, i) => (
            <div key={i} className="relative group w-20 h-20">
              <img src={URL.createObjectURL(f)}
                className="w-full h-full object-cover rounded-xl border-2 border-brand-blue/30" />
              <button type="button" onClick={() => onNewFiles((p) => p.filter((_, j) => j !== i))}
                className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-red-500 text-white rounded-full
                           items-center justify-center hidden group-hover:flex">
                <X size={11} />
              </button>
              <span className="absolute bottom-1 right-1 text-[9px] bg-black/60 text-white px-1 rounded">
                {i + 1}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Autocomplete for product name
// ─────────────────────────────────────────────────────────────
function NameAutocomplete({ value, onChange }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen]               = useState(false);
  const timer                         = useRef(null);

  const handleChange = (e) => {
    const v = e.target.value;
    onChange(v);
    clearTimeout(timer.current);
    if (v.length < 2) { setSuggestions([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      const res  = await apiFetch(`/search?q=${encodeURIComponent(v)}`);
      const data = await res.json();
      setSuggestions(data);
      setOpen(data.length > 0);
    }, 280);
  };

  return (
    <div className="relative">
      <input
        value={value}
        onChange={handleChange}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        placeholder="اسم المنتج..."
        className="admin-input"
        autoComplete="off"
        required
      />
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute z-50 top-full right-0 left-0 mt-1.5 bg-white border border-gray-200
                       rounded-2xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto"
          >
            <li className="px-4 py-2 text-[10px] font-extrabold text-orange-600 bg-orange-50 border-b border-orange-100 uppercase tracking-wider">
              ⚠ منتجات مشابهة موجودة
            </li>
            {suggestions.map((s) => (
              <li key={s.id}
                onMouseDown={() => { onChange(s.name); setOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0"
              >
                {s.thumbnail
                  ? <img src={s.thumbnail} className="w-9 h-9 object-cover rounded-xl shrink-0" />
                  : <div className="w-9 h-9 bg-gray-100 rounded-xl shrink-0" />}
                <div>
                  <p className="text-sm font-bold text-gray-800">{s.name}</p>
                  <p className="text-[11px] text-gray-400">
                    {s.code && <span className="font-mono">{s.code} · </span>}
                    {s.material_name} · {s.size}
                  </p>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Product Form Modal
// ─────────────────────────────────────────────────────────────
const EMPTY = {
  name: "", code: "", type_id: "", material_id: "",
  temp: "both", group_id: "", size: "", notes: "",
};

function ProductFormModal({ editProduct, types, materialGroups, groups, allProducts,
                            onClose, onSaved }) {
  const [form,         setForm]         = useState(EMPTY);
  const [selectedLids, setSelectedLids] = useState([]);
  const [newFiles,     setNewFiles]     = useState([]);
  const [existingImgs, setExistingImgs] = useState([]);
  const [removeIds,    setRemoveIds]    = useState([]);
  const [saving,       setSaving]       = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [showNewGroup, setShowNewGroup] = useState(false);

  const [selectedCatId, setSelectedCatId] = useState("");
  const subMaterials = materialGroups.find((g) => g.id === Number(selectedCatId))?.materials || [];

  useEffect(() => {
    if (!editProduct) return;
    setForm({
      name:        editProduct.name,
      code:        editProduct.code || "",
      type_id:     editProduct.type_id || "",
      material_id: editProduct.material_id || "",
      temp:        editProduct.temp,
      group_id:    editProduct.group_id || "",
      size:        editProduct.size || "",
      notes:       editProduct.notes || "",
    });
    setSelectedLids(editProduct.lids || []);
    setExistingImgs(editProduct.images || []);

    for (const cat of materialGroups) {
      if (cat.materials?.some((m) => m.id === editProduct.material_id)) {
        setSelectedCatId(String(cat.id));
        break;
      }
    }
  }, [editProduct]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (showNewGroup && newGroupName.trim())
        fd.append("new_group_name", newGroupName.trim());
      
      // إرسال الأغطية - عادية ويدوية
      const lidsToSend = selectedLids.map((l) => {
        if (l.isManual || l.manual) {
          return { name: l.name, manual: true };
        }
        return l.id;
      });
      fd.append("lid_ids", JSON.stringify(lidsToSend));
      
      if (removeIds.length) fd.append("remove_image_ids", JSON.stringify(removeIds));
      newFiles.forEach((f) => fd.append("images", f));

      const url    = editProduct ? `/${editProduct.id}` : "";
      const method = editProduct ? "PUT" : "POST";
      const res    = await apiFetch(url, { method, body: fd });

      if (!res.ok) throw new Error((await res.json()).error);
      onSaved(editProduct ? "تم التحديث ✓" : "تمت الإضافة ✓");
      onClose();
    } catch (err) {
      onSaved(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm
                 flex items-start justify-center p-4 overflow-y-auto"
    >
      <motion.div dir="rtl"
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        className="bg-white rounded-3xl w-full max-w-2xl my-6 shadow-2xl"
      >
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
          <h2 className="text-xl font-black text-gray-800">
            {editProduct ? "✏️ تعديل المنتج" : "➕ إضافة منتج جديد"}
          </h2>
          <button onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-7 space-y-5">
          <div>
            <label className="admin-label">اسم المنتج *</label>
            <NameAutocomplete value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="admin-label">الكود</label>
              <input value={form.code} onChange={set("code")} placeholder="10.301"
                className="admin-input font-mono" />
            </div>
            <div>
              <label className="admin-label">المقاس</label>
              <input value={form.size} onChange={set("size")} placeholder="8 أونصة / 500 مل"
                className="admin-input" />
            </div>
          </div>

          <div>
            <label className="admin-label">النوع *</label>
            <select value={form.type_id} onChange={set("type_id")} className="admin-input" required>
              <option value="">— اختر النوع —</option>
              {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="admin-label">فئة الخامة</label>
              <select
                value={selectedCatId}
                onChange={(e) => {
                  setSelectedCatId(e.target.value);
                  setForm((f) => ({ ...f, material_id: "" }));
                }}
                className="admin-input"
              >
                <option value="">— اختر الفئة —</option>
                {materialGroups.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="admin-label">الخامة التفصيلية</label>
              <select value={form.material_id} onChange={set("material_id")} className="admin-input"
                disabled={!selectedCatId}>
                <option value="">— اختر الخامة —</option>
                {subMaterials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="admin-label">ملائمة الحرارة *</label>
            <div className="flex gap-3">
              {TEMPS.map((t) => (
                <label key={t.value}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl
                    border-2 cursor-pointer text-sm font-bold transition-all select-none
                    ${form.temp === t.value
                      ? "border-brand-blue bg-brand-blue text-white"
                      : "border-gray-200 text-gray-600 hover:border-brand-blue/40"}`}
                >
                  <input type="radio" name="temp" value={t.value}
                    checked={form.temp === t.value} onChange={set("temp")} className="hidden" />
                  {t.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="admin-label">المجموعة (للمقاسات المترابطة)</label>
            <select
              value={showNewGroup ? "__new__" : form.group_id}
              onChange={(e) => {
                if (e.target.value === "__new__") {
                  setShowNewGroup(true);
                  setForm((f) => ({ ...f, group_id: "" }));
                } else {
                  setShowNewGroup(false);
                  setForm((f) => ({ ...f, group_id: e.target.value }));
                }
              }}
              className="admin-input"
            >
              <option value="">— بدون مجموعة —</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              <option value="__new__">➕ إنشاء مجموعة جديدة...</option>
            </select>
            {showNewGroup && (
              <input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder='اسم المجموعة — مثال: "KFC Cup"'
                className="admin-input mt-2"
              />
            )}
          </div>

          <div>
            <label className="admin-label">الأغطية المناسبة</label>
            <LidSelector
              selectedLids={selectedLids}
              onChange={setSelectedLids}
            />
          </div>

          <div>
            <label className="admin-label">ملاحظات</label>
            <textarea value={form.notes} onChange={set("notes")} rows={2}
              placeholder="أي تفاصيل إضافية..." className="admin-input resize-none" />
          </div>

          <div>
            <label className="admin-label">صور المنتج</label>
            <ImageUploader
              newFiles={newFiles} onNewFiles={setNewFiles}
              existingImgs={existingImgs}
              onRemoveExisting={(id) => {
                setRemoveIds((r) => [...r, id]);
                setExistingImgs((imgs) => imgs.filter((i) => i.id !== id));
              }}
            />
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button type="submit" disabled={saving || !form.name || !form.type_id}
              className="flex-1 py-3.5 bg-brand-blue text-white font-bold rounded-2xl
                         hover:opacity-90 transition flex items-center justify-center gap-2
                         disabled:opacity-50 disabled:cursor-not-allowed">
              {saving && <Loader2 size={16} className="animate-spin" />}
              {editProduct ? "حفظ التعديلات" : "إضافة المنتج"}
            </button>
            <button type="button" onClick={onClose}
              className="px-6 py-3.5 border-2 border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50">
              إلغاء
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Settings Panel
// ─────────────────────────────────────────────────────────────
function SettingsPanel({ types, materialGroups, groups, onRefresh, toast }) {
  const [tab, setTab] = useState("types");

  const crud = (endpoint) => ({
    add:    async (name) => {
      await apiFetch(`/${endpoint}`, { method: "POST",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
      toast("تمت الإضافة ✓"); onRefresh();
    },
    del:    async (id) => {
      await apiFetch(`/${endpoint}/${id}`, { method: "DELETE" });
      onRefresh();
    },
    edit:   async (id, name) => {
      await apiFetch(`/${endpoint}/${id}`, { method: "PUT",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
      onRefresh();
    },
  });

  const typesCrud  = crud("types");
  const groupsCrud = crud("groups");

  const TABS = [
    { key: "types",     label: "الأنواع" },
    { key: "materials", label: "الخامات" },
    { key: "groups",    label: "المجموعات" },
  ];

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex border-b border-gray-200 bg-white">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-3 text-sm font-bold transition-colors
              ${tab === t.key
                ? "text-brand-blue border-b-2 border-brand-blue bg-blue-50/50"
                : "text-gray-500 hover:text-gray-700"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {tab === "types" && (
          <MiniManager
            title="أنواع المنتجات"
            items={types}
            onAdd={typesCrud.add}
            onDelete={typesCrud.del}
            onEdit={typesCrud.edit}
            placeholder="مثال: كوب، طبق، علبة..."
          />
        )}
        {tab === "materials" && (
          <MaterialsManager
            grouped={materialGroups}
            onRefresh={onRefresh}
            toast={toast}
          />
        )}
        {tab === "groups" && (
          <MiniManager
            title="المجموعات"
            items={groups}
            onAdd={groupsCrud.add}
            onDelete={groupsCrud.del}
            onEdit={groupsCrud.edit}
            placeholder='مثال: "KFC Cup" أو "Lunch Box"'
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Admin Page
// ─────────────────────────────────────────────────────────────
export default function Admin() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const secret     = params.get("secret");

  useEffect(() => {
    if (!secret || secret !== SECRET) navigate("/", { replace: true });
  }, [secret, navigate]);

  const [products,       setProducts]       = useState([]);
  const [types,          setTypes]          = useState([]);
  const [materialGroups, setMaterialGroups] = useState([]);
  const [groups,         setGroups]         = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [toast,          setToast]          = useState(null);
  const [showForm,       setShowForm]       = useState(false);
  const [editTarget,     setEditTarget]     = useState(null);
  const [deleteId,       setDeleteId]       = useState(null);
  const [showSettings,   setShowSettings]   = useState(false);
  const [search,         setSearch]         = useState("");
  const [filterType,     setFilterType]     = useState("");

  const notify = useCallback((msg, type = "success") => setToast({ msg, type }), []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, t, m, g] = await Promise.all([
        apiFetch("").then((r) => {
          if (!r.ok) throw new Error(`Failed to fetch products: ${r.status}`);
          return r.json();
        }),
        apiFetch("/types").then((r) => {
          if (!r.ok) throw new Error(`Failed to fetch types: ${r.status}`);
          return r.json();
        }),
        apiFetch("/materials").then((r) => {
          if (!r.ok) throw new Error(`Failed to fetch materials: ${r.status}`);
          return r.json();
        }),
        apiFetch("/groups").then((r) => {
          if (!r.ok) throw new Error(`Failed to fetch groups: ${r.status}`);
          return r.json();
        }),
      ]);
      
      setProducts(Array.isArray(p) ? p : []);
      setTypes(Array.isArray(t) ? t : []);
      setMaterialGroups(Array.isArray(m) ? m : []);
      setGroups(Array.isArray(g) ? g : []);
    } catch (error) {
      console.error("Error loading data:", error);
      notify("فشل تحميل البيانات", "error");
      setProducts([]);
      setTypes([]);
      setMaterialGroups([]);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    if (secret === SECRET) {
      load();
    }
  }, [load, secret]);

  const openEdit = async (p) => {
    const res  = await apiFetch(`/${p.id}`);
    const data = await res.json();
    setEditTarget(data);
    setShowForm(true);
  };

  const handleDelete = async () => {
    const res = await apiFetch(`/${deleteId}`, { method: "DELETE" });
    if (res.ok) { notify("تم الحذف"); load(); }
    else notify("فشل الحذف", "error");
    setDeleteId(null);
  };

  const filtered = Array.isArray(products) ? products.filter((p) => {
    const matchS = !search || p.name.includes(search) || p.code?.includes(search);
    const matchT = !filterType || p.type_id === Number(filterType);
    return matchS && matchT;
  }) : [];

  if (!secret || secret !== SECRET) return null;

  return (
    <div dir="rtl" className="pt-20 min-h-screen bg-gray-50">
      <div className="bg-brand-blue text-white py-10 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black">🛠️ لوحة تحكم المنتجات</h1>
            <p className="text-blue-200 text-sm mt-1">{Array.isArray(products) ? products.length : 0} منتج</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowSettings((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-full border transition
                ${showSettings
                  ? "bg-white text-brand-blue border-white"
                  : "border-white/30 text-white hover:bg-white/10"}`}>
              <Settings size={15} />
              إدارة الأنواع والخامات
            </button>
            <button
              onClick={() => { setEditTarget(null); setShowForm(true); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-green text-white text-sm font-bold rounded-full hover:opacity-90 transition">
              <Plus size={16} />
              إضافة منتج
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} className="overflow-hidden"
            >
              <SettingsPanel
                types={types} materialGroups={materialGroups} groups={groups}
                onRefresh={load} toast={notify}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو الكود..."
              className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white
                         focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className="py-2.5 px-4 rounded-xl border border-gray-200 text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-brand-blue/30">
            <option value="">كل الأنواع</option>
            {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-brand-blue" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[750px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["","الاسم","الكود","النوع","الخامة","المقاس","الحرارة",""].map((h, i) => (
                      <th key={i} className="px-4 py-3 text-right text-xs font-bold text-gray-500 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-3">
                        {p.images?.[0]?.url
                          ? <img src={p.images[0].url} className="w-11 h-11 object-cover rounded-xl" />
                          : <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center">
                              <Package size={18} className="text-gray-300" />
                            </div>}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800 max-w-[180px] truncate">
                        {p.name}
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-500 text-xs">{p.code || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-brand-blue text-xs font-bold">
                          {p.type_name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {p.material_name
                          ? <><span className="font-mono font-bold">{p.material_name}</span>
                            <span className="text-gray-400"> / {p.material_category}</span></>
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{p.size || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold
                          ${p.temp === "hot" ? "text-orange-500"
                          : p.temp === "cold" ? "text-sky-500"
                          : "text-emerald-600"}`}>
                          {p.temp === "hot" ? "ساخن" : p.temp === "cold" ? "بارد" : "ساخن وبارد"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(p)}
                            className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-brand-blue transition-colors">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => setDeleteId(p.id)}
                            className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  <Package size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">لا توجد منتجات مطابقة</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <ProductFormModal
            key={editTarget?.id ?? "new"}
            editProduct={editTarget}
            types={types}
            materialGroups={materialGroups}
            groups={groups}
            allProducts={products}
            onClose={() => setShowForm(false)}
            onSaved={(msg, type) => {
              notify(msg, type);
              if (type !== "error") load();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/60 flex items-center justify-center p-4">
            <motion.div dir="rtl" initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={28} className="text-red-500" />
              </div>
              <h3 className="font-extrabold text-xl text-gray-800 mb-2">حذف المنتج؟</h3>
              <p className="text-sm text-gray-500 mb-7">هيتحذف نهائياً مع كل صوره من Cloudinary.</p>
              <div className="flex gap-3">
                <button onClick={handleDelete}
                  className="flex-1 py-3 bg-red-500 text-white font-bold rounded-2xl hover:opacity-90">
                  نعم، احذف
                </button>
                <button onClick={() => setDeleteId(null)}
                  className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50">
                  إلغاء
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}