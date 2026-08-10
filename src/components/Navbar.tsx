import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, MessageCircle, Plus, Minus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { WHATSAPP_NUMBER, getWhatsAppCartLink } from '../config';

const navLinks = [
  { label: 'Home', id: 'hero' },
  { label: 'Shop', id: 'shop' },
  { label: 'Combos', id: 'combos' },
  { label: 'Blog', id: 'blog' },
  { label: 'About', id: 'about' },
  { label: 'Testimonials', id: 'testimonials' },
  { label: 'FAQ', id: 'faq' },
  { label: 'Contact', id: 'contact' },
];

const sectionIds = navLinks.map(link => link.id);

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeScrollPath, setActiveScrollPath] = useState('hero');
  const { cart, cartCount, cartTotal, addToCart, removeFromCart } = useCart();
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  // Close drawers on route change
  useEffect(() => {
    setMobileOpen(false);
    setCartOpen(false);
  }, [location.pathname]);

  // Scrollspy effect for the Home page
  useEffect(() => {
    if (location.pathname !== '/') return;

    const activeSections = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        let changed = false;
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            activeSections.add(entry.target.id);
            changed = true;
          } else {
            activeSections.delete(entry.target.id);
            changed = true;
          }
        });

        if (changed) {
          // Find the first intersecting section in DOM order (highest on the page)
          const topmostSection = sectionIds.find(id => activeSections.has(id));
          
          if (topmostSection) {
            setActiveScrollPath(topmostSection);
          } else if (window.scrollY < 100) {
            // Fallback: if we are at the top and nothing is intersecting, default to Home
            setActiveScrollPath('hero');
          }
        }
      },
      {
        // A generous 40vh band in the middle of the screen (30% from top, 30% from bottom)
        // This guarantees no gaps are missed during fast scrolling and tracks the section the user is actually looking at.
        rootMargin: '-30% 0px -30% 0px',
        threshold: 0
      }
    );

    // Because of PageTransitions (AnimatePresence mode="wait"), the new page's DOM
    // might not be present immediately when the location changes. We poll briefly to attach observers.
    const unobservedIds = new Set(sectionIds);
    let pollInterval: ReturnType<typeof setInterval>;

    const tryObserve = () => {
      unobservedIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          observer.observe(el);
          unobservedIds.delete(id);
        }
      });
      if (unobservedIds.size === 0 && pollInterval) {
        clearInterval(pollInterval);
      }
    };

    tryObserve();
    if (unobservedIds.size > 0) {
      pollInterval = setInterval(tryObserve, 100);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      observer.disconnect();
    };
  }, [location.pathname]);

  // Framer motion variants
  const backdropVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3, ease: 'easeInOut' } },
  };

  const drawerVariants: Variants = {
    hidden: shouldReduceMotion ? { opacity: 0 } : { x: '100%', opacity: 1 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeInOut' } },
  };

  return (
    <>
      {/* ─── Main Sticky Header ─── */}
      <header className="sticky top-0 z-40 bg-ivory/90 backdrop-blur-md border-b border-ivory-dark shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group" aria-label="InbaNaturals home">
              <div className="w-8 h-8 rounded-full bg-sage flex items-center justify-center shadow-sm group-hover:bg-sage-dark transition-colors">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M9 2 C5 2, 2 5.5, 2 9 C2 12.5, 5 16, 9 16 C13 16, 16 12.5, 16 9 C14 9, 9 13, 6 8 C8 6, 13 7, 16 9 C16 5.5, 13 2, 9 2Z" fill="#FAF6EE" fillOpacity="0.9" />
                </svg>
              </div>
              <span className="font-serif text-xl font-bold text-charcoal tracking-tight">
                Inba<span className="text-sage">Naturals</span>
              </span>
            </Link>

            {/* Desktop Nav — hidden on mobile */}
            <nav className="hidden lg:flex items-center gap-6">
              {navLinks.map(({ label, id }) => {
                const isReallyActive = location.pathname === '/' ? activeScrollPath === id : false;
                return (
                  <Link
                    key={id}
                    to={id === 'hero' ? '/' : `/?scrollTo=${id}`}
                    onClick={(e) => {
                      if (location.pathname === '/') {
                        e.preventDefault();
                        const el = document.getElementById(id);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth' });
                          setActiveScrollPath(id);
                        }
                      }
                    }}
                    className={`relative text-sm font-medium transition-colors duration-200 ease-out pb-0.5 ${
                      isReallyActive
                        ? 'text-sage'
                        : 'text-charcoal-light hover:text-charcoal'
                    }`}
                  >
                    {label}
                    {isReallyActive && (
                      <motion.div
                        layoutId="nav-underline"
                        className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-sage rounded-full"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right-side actions */}
            <div className="flex items-center gap-2">
              {/* WhatsApp pill — hidden on small screens */}
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-sage text-sage hover:bg-sage hover:text-white transition-all duration-200 ease-out active:scale-[0.98]"
              >
                <MessageCircle size={14} />
                WhatsApp
              </a>

              {/* Cart icon */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative flex items-center justify-center w-10 h-10 rounded-xl hover:bg-ivory-dark transition-all duration-200 ease-out active:scale-[0.98] cursor-pointer"
                aria-label="Shopping cart"
              >
                <ShoppingCart size={20} className="text-charcoal" />
                {cartCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-terracotta text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Hamburger button — only on mobile */}
              <button
                className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl hover:bg-ivory-dark transition-all duration-200 ease-out active:scale-[0.98] cursor-pointer"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation menu"
                aria-expanded={mobileOpen}
              >
                <Menu size={22} className="text-charcoal" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Mobile Slide-in Drawer ─── */}
      {/* Rendered as a sibling OUTSIDE the header so backdrop-filter doesn't clip the z-index */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[9999] flex lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
            {/* Dark backdrop — click anywhere to close */}
            <motion.div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileOpen(false)}
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            />

            {/* Drawer panel slides in from right */}
            <motion.div
              className="absolute top-0 right-0 h-full w-72 max-w-[80vw] bg-white shadow-2xl flex flex-col"
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-ivory-dark">
                <span className="font-serif text-lg font-bold text-charcoal">
                  Inba<span className="text-sage">Naturals</span>
                </span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-9 h-9 rounded-xl bg-ivory hover:bg-ivory-dark flex items-center justify-center text-charcoal transition-all duration-200 ease-out active:scale-[0.98] cursor-pointer"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                {navLinks.map(({ label, id }) => {
                  const isReallyActive = location.pathname === '/' ? activeScrollPath === id : false;
                  return (
                    <Link
                      key={id}
                      to={id === 'hero' ? '/' : `/?scrollTo=${id}`}
                      onClick={(e) => {
                        if (location.pathname === '/') {
                          e.preventDefault();
                          const el = document.getElementById(id);
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth' });
                            setActiveScrollPath(id);
                          }
                        }
                        setMobileOpen(false);
                      }}
                      className={`relative flex items-center px-4 py-3.5 rounded-2xl text-base font-medium transition-colors duration-200 ease-out ${
                        isReallyActive
                          ? 'text-sage font-semibold'
                          : 'text-charcoal hover:bg-ivory-dark active:scale-[0.98]'
                      }`}
                    >
                      {isReallyActive && (
                        <motion.div
                          layoutId="nav-bg-mobile"
                          className="absolute inset-0 bg-sage/10 rounded-2xl"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">{label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Drawer footer with WhatsApp CTA */}
              <div className="px-5 py-5 border-t border-ivory-dark space-y-3">
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-sage hover:bg-sage-dark text-white rounded-2xl text-sm font-semibold transition-all duration-200 ease-out active:scale-[0.98]"
                >
                  <MessageCircle size={16} />
                  Chat on WhatsApp
                </a>
                <p className="text-[10px] text-center text-charcoal-light">
                  © {new Date().getFullYear()} InbaNaturals · Made with 🌿
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Cart Slide-in Drawer ─── */}
      <AnimatePresence>
        {cartOpen && (
          <div className="fixed inset-0 z-[9999] flex justify-end" role="dialog" aria-modal="true" aria-label="Shopping Cart">
            {/* Dark backdrop — click anywhere to close */}
            <motion.div
              className="absolute inset-0 bg-black/50"
              onClick={() => setCartOpen(false)}
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            />

            {/* Drawer panel slides in from right */}
            <motion.div
              className="relative h-full w-96 max-w-[90vw] bg-ivory shadow-2xl flex flex-col"
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-ivory-dark bg-white">
                <span className="font-serif text-lg font-bold text-charcoal">
                  Your Cart
                </span>
                <button
                  onClick={() => setCartOpen(false)}
                  className="w-9 h-9 rounded-xl bg-ivory hover:bg-ivory-dark flex items-center justify-center text-charcoal transition-all duration-200 ease-out active:scale-[0.98] cursor-pointer"
                  aria-label="Close cart"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-5">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-charcoal-light">
                    <ShoppingCart size={48} className="mb-4 opacity-50" />
                    <p>Your cart is empty.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={`${item.id}-${item.size || 'default'}`} className="flex gap-4 bg-white p-4 rounded-2xl border border-ivory-dark shadow-sm">
                        {item.image ? (
                          <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-ivory-dark">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded-xl bg-sage/10 flex items-center justify-center shrink-0">
                            <span className="text-xs text-sage font-medium">No img</span>
                          </div>
                        )}
                        
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="text-sm font-semibold text-charcoal line-clamp-2">{item.name}</h4>
                            {item.size && <p className="text-xs text-charcoal-light mt-0.5">{item.size}</p>}
                          </div>
                          
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-3 bg-ivory-dark rounded-lg px-2 py-1">
                              <button
                                onClick={() => {
                                  if (item.quantity > 1) {
                                    addToCart({ ...item, quantity: -1 });
                                  } else {
                                    removeFromCart(item.id, item.size);
                                  }
                                }}
                                className="text-charcoal hover:text-sage transition-all duration-200 ease-out active:scale-[0.9] cursor-pointer"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="text-xs font-semibold text-charcoal w-4 text-center">{item.quantity}</span>
                              <button
                                onClick={() => addToCart({ ...item, quantity: 1 })}
                                className="text-charcoal hover:text-sage transition-all duration-200 ease-out active:scale-[0.9] cursor-pointer"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-charcoal">{item.price}</span>
                              <button
                                onClick={() => removeFromCart(item.id, item.size)}
                                className="text-terracotta/70 hover:text-terracotta transition-all duration-200 ease-out active:scale-[0.9] cursor-pointer"
                                aria-label="Remove item"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              {cart.length > 0 && (
                <div className="bg-white border-t border-ivory-dark p-5 space-y-4">
                  <div className="flex items-center justify-between font-serif text-lg text-charcoal">
                    <span>Total</span>
                    <span className="font-bold">₹{cartTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <a
                    href={getWhatsAppCartLink(cart, cartTotal)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setCartOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-4 bg-sage hover:bg-sage-dark text-white rounded-2xl text-sm font-semibold transition-all duration-200 ease-out active:scale-[0.98]"
                  >
                    <MessageCircle size={18} />
                    Checkout via WhatsApp
                  </a>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Inline keyframe for the drawer slide animation */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
