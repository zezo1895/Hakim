import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Bot, User, Sparkles, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const DEFAULT_WELCOME = "أهلاً بيك في حكيم جروب! 🌟 أنا المساعد الذكي، أقدر أساعدك إزاي في اختيار أنسب خامات التغليف؟";

export default function AIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "model", text: DEFAULT_WELCOME }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch custom welcome message from admin settings
  useEffect(() => {
    const fetchWelcome = async () => {
      try {
        const res = await fetch(`${API}/ai/settings`);
        if (res.ok) {
          const data = await res.json();
          if (data.welcome_message) {
            setMessages([{ role: "model", text: data.welcome_message }]);
          }
        }
      } catch (e) { /* fallback to default */ }
    };
    fetchWelcome();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");
    
    // Optimistic UI update
    const newMessages = [...messages, { role: "user", text: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch(`${API}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userText,
          history: messages 
        })
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, { role: "model", text: data.text }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { 
        role: "model", 
        text: "عفواً، واجهت مشكلة في الاتصال بالنظام. يرجى المحاولة مرة أخرى أو التواصل معنا عبر الواتساب." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-24 right-6 md:bottom-6 md:left-24 md:right-auto z-40 bg-gradient-to-r from-blue-600 to-brand-blue text-white p-4 rounded-full shadow-2xl flex items-center justify-center border-2 border-white/50 ${isOpen ? 'hidden' : 'flex'}`}
        style={{ boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)' }}
      >
        <Sparkles className="absolute -top-1 -right-1 text-yellow-300 animate-pulse" size={16} />
        <MessageSquare size={28} />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-4 left-4 md:right-auto md:left-6 md:w-[400px] h-[600px] max-h-[85vh] bg-white rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-100"
            dir="rtl"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-blue to-blue-600 p-4 text-white flex justify-between items-center shadow-md relative z-10">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm relative">
                  <Bot size={24} />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-brand-blue rounded-full"></span>
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">المساعد الذكي</h3>
                  <p className="text-xs text-blue-100">يرد فوراً (مدعوم بـ AI)</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 flex flex-col gap-4">
              {messages.map((msg, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx} 
                  className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.role === 'user' ? 'bg-gray-800 text-white' : 'bg-brand-blue text-white'}`}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-gray-800 text-white rounded-tl-sm' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tr-sm'
                  }`}>
                    {msg.role === 'model' ? (
                      <div className="prose prose-sm prose-blue max-w-none rtl">
                        <ReactMarkdown>
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      msg.text
                    )}
                  </div>
                </motion.div>
              ))}
              
              {loading && (
                <div className="flex gap-3 max-w-[85%] self-start">
                  <div className="w-8 h-8 rounded-full bg-brand-blue text-white flex items-center justify-center shrink-0 mt-1">
                    <Bot size={16} />
                  </div>
                  <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tr-sm shadow-sm flex items-center gap-2">
                    <Loader2 className="animate-spin text-brand-blue" size={16} />
                    <span className="text-xs text-gray-500">جاري التفكير...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
              <form onSubmit={sendMessage} className="flex gap-2 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="اسأل عن أي منتج أو خامة..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-full py-3 px-5 text-sm focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="w-12 h-12 bg-brand-blue hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center shadow-md transition-colors shrink-0"
                >
                  <Send size={18} className="rtl:rotate-180 -ml-1" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
