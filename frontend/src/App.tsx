import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppFAB from './components/WhatsAppFAB';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import AboutPage from './pages/AboutPage';
import TestimonialsPage from './pages/TestimonialsPage';
import ContactPage from './pages/ContactPage';
import CombosPage from './pages/CombosPage';
import FAQPage from './pages/FAQPage';
import BlogListingPage from './pages/BlogListingPage';
import BlogPostDetailPage from './pages/BlogPostDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import CartPage from './pages/CartPage';
import WalletPage from './pages/WalletPage';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AdminRoute from './components/layout/AdminRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReviews from './pages/admin/AdminReviews';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import ScrollToTop from './components/ScrollToTop';

// Professional policy pages
function PolicyPage({ title }: { title: string }) {
  const getContent = () => {
    switch (title) {
      case 'Shipping Policy':
        return [
          {
            heading: '1. Order Processing & Dispatch',
            text: 'All orders are processed within 1–2 business days. Orders are not shipped or delivered on weekends or public holidays. You will receive a shipment confirmation email with tracking details once your order is dispatched.'
          },
          {
            heading: '2. Shipping Rates & Delivery Estimates',
            text: 'We offer standard shipping across India. Delivery typically takes 3–7 business days depending on your location. Shipping charges are calculated at checkout based on order weight and delivery pincode.'
          },
          {
            heading: '3. Damaged or Lost Shipments',
            text: 'If your package arrives damaged, please take photographs of the outer packaging and damaged items and contact our support team within 48 hours of delivery for a prompt replacement or refund.'
          }
        ];
      case 'Returns & Refunds Policy':
        return [
          {
            heading: '1. Eligibility for Returns',
            text: 'We accept returns within 7 days of delivery for items that are unused, unopened, and in their original packaging with safety seals intact. Due to the personal care nature of our products, used or opened items cannot be returned.'
          },
          {
            heading: '2. Return Process',
            text: 'To initiate a return, please contact our support team with your order number and photo/video proof of the issue. Once approved, our courier partner will pick up the item from your delivery address.'
          },
          {
            heading: '3. Refund Timelines',
            text: 'Once your returned item is received and inspected, we will notify you of the approval or rejection of your refund. Approved refunds are processed within 5–7 business days to your original payment method or store wallet.'
          }
        ];
      case 'Privacy Policy':
        return [
          {
            heading: '1. Information We Collect',
            text: 'We collect personal information you provide during account creation, checkout, or contact submissions, including your name, email address, phone number, shipping address, and order history.'
          },
          {
            heading: '2. How We Use Your Information',
            text: 'Your information is used strictly to process orders, communicate shipment updates, provide customer support, and improve our natural product offerings. We never sell or share your personal data with third-party advertisers.'
          },
          {
            heading: '3. Data Security',
            text: 'We implement industry-standard security protocols, encrypted connections (HTTPS), and secure token authentication to safeguard your personal data against unauthorized access.'
          }
        ];
      default: // Terms of Service
        return [
          {
            heading: '1. Acceptance of Terms',
            text: 'By accessing and using InbaNaturals website and purchasing our products, you agree to comply with and be bound by these Terms of Service.'
          },
          {
            heading: '2. Natural Ingredients Disclaimer',
            text: 'Our products are crafted with 100% natural ingredients and botanical extracts. While formulated for gentle care, we recommend performing a patch test before first use. InbaNaturals is not liable for individual allergic reactions.'
          },
          {
            heading: '3. Intellectual Property',
            text: 'All content, product photography, trademarks, and branding on this website are the intellectual property of InbaNaturals and may not be reproduced without explicit written consent.'
          }
        ];
    }
  };

  const sections = getContent();

  return (
    <div className="min-h-screen max-w-3xl mx-auto px-4 py-20">
      <h1 className="font-serif text-4xl text-charcoal mb-4">{title}</h1>
      <div className="bg-white rounded-2xl p-8 border border-ivory-dark shadow-sm space-y-6">
        {sections.map((sec, i) => (
          <div key={i}>
            <h3 className="font-serif text-lg text-charcoal mb-2">{sec.heading}</h3>
            <p className="text-charcoal-light text-sm leading-relaxed">
              {sec.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
        <ScrollToTop />
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1 flex flex-col">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/wallet" element={<WalletPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/orders/:id" element={<OrderDetailPage />} />
              </Route>
              <Route path="/admin" element={<AdminRoute />}>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="reviews" element={<AdminReviews />} />
              </Route>
              <Route path="/combos" element={<CombosPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/blog" element={<BlogListingPage />} />
              <Route path="/blog/:id" element={<BlogPostDetailPage />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/testimonials" element={<TestimonialsPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/shipping" element={<PolicyPage title="Shipping Policy" />} />
              <Route path="/returns" element={<PolicyPage title="Returns Policy" />} />
              <Route path="/privacy" element={<PolicyPage title="Privacy Policy" />} />
              <Route path="/terms" element={<PolicyPage title="Terms of Service" />} />
              <Route path="*" element={
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
              } />
            </Routes>
          </main>
          <Footer />
          <WhatsAppFAB />
        </div>
      </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

