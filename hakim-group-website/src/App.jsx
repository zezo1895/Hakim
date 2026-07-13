import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/Home";
import About from "./pages/About";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Quality from "./pages/Quality";
import Certificates from "./pages/Certificates";
import Contact from "./pages/Contact";

import Admin from "./pages/Admin";
import TVShowcase from "./pages/TVShowcase";
import TVConfig from "./pages/TVConfig";
import TVGate from "./components/TVGate";    

// ─────────────────────────────────────────────────────────────
// /tv و /tv-config صفحات مستقلة تمامًا عن الموقع الأساسي:
// من غير Navbar ومن غير Footer، Full Screen حقيقي.
// كل صفحات الموقع التانية شغالة زي ما هي بالظبط من غير أي تعديل.
// ─────────────────────────────────────────────────────────────
function AppShell() {
  const location = useLocation();
  const isKiosk = location.pathname.startsWith("/tv");

  if (isKiosk) {
    return (
      <TVGate>
        <Routes>
          <Route path="/tv" element={<TVShowcase />} />
          <Route path="/tv-config" element={<TVConfig />} />
        </Routes>
      </TVGate>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-arabic" dir="rtl">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/"              element={<Home />} />
          <Route path="/about"         element={<About />} />
          <Route path="/products"      element={<Products />} />
          <Route path="/products/:id"  element={<ProductDetail />} />
          <Route path="/quality"       element={<Quality />} />
          <Route path="/certificates"  element={<Certificates />} />
          <Route path="/contact"       element={<Contact />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppShell />
    </BrowserRouter>
  );
}