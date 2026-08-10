import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppFAB from './components/WhatsAppFAB';
import HomePage from './pages/HomePage';
import ProductDetailPage from './pages/ProductDetailPage';
import BlogPostDetailPage from './pages/BlogPostDetailPage';
import { CartProvider } from './context/CartContext';
import ScrollToTop from './components/ScrollToTop';
import ShippingPolicyPage from './pages/ShippingPolicyPage';
import ReturnsPolicyPage from './pages/ReturnsPolicyPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';
import PageTransition from './components/PageTransition';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
        
        {/* Redirect old pages to SPA sections */}
        <Route path="/shop" element={<Navigate to="/?scrollTo=shop" replace />} />
        <Route path="/combos" element={<Navigate to="/?scrollTo=combos" replace />} />
        <Route path="/faq" element={<Navigate to="/?scrollTo=faq" replace />} />
        <Route path="/blog" element={<Navigate to="/?scrollTo=blog" replace />} />
        <Route path="/about" element={<Navigate to="/?scrollTo=about" replace />} />
        <Route path="/testimonials" element={<Navigate to="/?scrollTo=testimonials" replace />} />
        <Route path="/contact" element={<Navigate to="/?scrollTo=contact" replace />} />

        {/* Individual detail pages */}
        <Route path="/blog/:id" element={<PageTransition><BlogPostDetailPage /></PageTransition>} />
        <Route path="/product/:id" element={<PageTransition><ProductDetailPage /></PageTransition>} />
        
        {/* Policy pages */}
        <Route path="/shipping" element={<PageTransition><ShippingPolicyPage /></PageTransition>} />
        <Route path="/returns" element={<PageTransition><ReturnsPolicyPage /></PageTransition>} />
        <Route path="/privacy" element={<PageTransition><PrivacyPolicyPage /></PageTransition>} />
        <Route path="/terms" element={<PageTransition><TermsPage /></PageTransition>} />
        
        {/* 404 */}
        <Route path="*" element={
          <PageTransition>
            <div className="min-h-screen flex items-center justify-center text-center px-4">
              <div>
                <p className="text-sage font-medium text-sm uppercase tracking-widest mb-2">404</p>
                <h1 className="font-serif text-5xl text-charcoal mb-3">Page Not Found</h1>
                <p className="text-charcoal-light mb-6">The page you're looking for doesn't exist.</p>
                <a href="/" className="bg-sage text-white px-6 py-3 rounded-2xl font-medium hover:bg-sage-dark transition-colors">
                  Back to Home
                </a>
              </div>
            </div>
          </PageTransition>
        } />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1">
            <AnimatedRoutes />
          </main>
          <Footer />
          <WhatsAppFAB />
        </div>
      </BrowserRouter>
    </CartProvider>
  );
}


