import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// الاسترداد التلقائي في حال تحديث النسخة على الخادم وفشل تحميل أي Chunk ديناميكي قديم
window.addEventListener('vite:preloadError', (event) => {
  console.warn('تحديث جديد على الخادم، جاري إعادة تحميل الصفحة...');
  window.location.reload();
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
