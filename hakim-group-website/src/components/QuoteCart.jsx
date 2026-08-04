import React from "react";
import { useQuote } from "../context/QuoteContext";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Send, ShoppingCart } from "lucide-react";

export default function QuoteCart() {
  const { cart, removeFromCart, isCartOpen, setIsCartOpen, clearCart } = useQuote();
  
  // رقم واتساب الشركة، يمكن تغييره
  const WHATSAPP_NUMBER = "201000000000"; // استبدله برقمك

  const handleSendQuote = () => {
    if (cart.length === 0) return;
    
    let text = "مرحباً، أود الاستفسار عن عرض سعر للمنتجات التالية:\n\n";
    cart.forEach((p, i) => {
      text += `${i + 1}- ${p.name} (كود: ${p.code || "بدون"})\n`;
    });
    
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    
    // اختياري: مسح السلة بعد الإرسال
    // clearCart();
    setIsCartOpen(false);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-6 right-6 md:left-6 md:right-auto z-40 bg-[#25D366] text-white p-4 rounded-full shadow-2xl flex items-center justify-center border-2 border-white"
        title="طلب عرض سعر"
      >
        <ShoppingCart size={28} />
        {cart.length > 0 && (
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-black w-7 h-7 rounded-full flex items-center justify-center shadow-md border-2 border-white"
          >
            {cart.length}
          </motion.span>
        )}
      </motion.button>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 left-0 bottom-0 w-[90%] max-w-sm bg-white z-[60] shadow-2xl flex flex-col"
              dir="rtl"
            >
              <div className="p-5 flex items-center justify-between border-b border-gray-100 bg-gray-50">
                <h2 className="text-xl font-bold text-brand-blue flex items-center gap-2">
                  <ShoppingCart size={20} className="text-brand-orange" />
                  قائمة طلب التسعير
                </h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 hover:bg-gray-200 rounded-full transition"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
                    <ShoppingCart size={48} className="opacity-20" />
                    <p>القائمة فارغة. أضف منتجات لطلب عرض سعر.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((p) => (
                      <div key={p.id} className="flex items-center justify-between bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
                        <div>
                          <p className="font-bold text-sm text-gray-800">{p.name}</p>
                          {p.code && <p className="text-xs text-gray-500 mt-1">كود: {p.code}</p>}
                        </div>
                        <button
                          onClick={() => removeFromCart(p.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-5 border-t border-gray-100 bg-gray-50">
                  <button
                    onClick={handleSendQuote}
                    className="w-full flex justify-center items-center gap-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-green-500/30 transition-transform active:scale-95"
                  >
                    <Send size={20} />
                    إرسال الطلب عبر واتساب
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
