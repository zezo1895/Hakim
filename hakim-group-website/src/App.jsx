import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import About from "./pages/About";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Quality from "./pages/Quality";
import Certificates from "./pages/Certificates";
import Contact from "./pages/Contact";

import Admin from "./pages/Admin";
export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}