import { useState, useEffect, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ArrowRight, Leaf, Sparkles, Heart,
  SlidersHorizontal, Search, Check, ShoppingBag, MessageSquare,
  Calendar, User, Sprout, Phone, Mail, Clock, MapPin, Send, MessageCircle
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import LeafDivider from '../components/LeafDivider';
import ProductCard from '../components/ProductCard';
import StarRating from '../components/StarRating';
import FAQAccordion from '../components/FAQAccordion';
import { products } from '../data/products';
import { blogPosts } from '../data/blog';
import { INSTAGRAM_URL, getWhatsAppComboLink, WHATSAPP_NUMBER } from '../config';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';

type FilterCategory = 'all' | 'hair' | 'face';
type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name';
type BlogCategory = 'All' | 'Hair Care' | 'Skin Care' | 'Wellness';

interface ComboDefinition {
  id: string;
  name: string;
  tagline: string;
  productIds: string[];
  discountPercent: number;
}

const combos: ComboDefinition[] = [
  {
    id: 'hair-combo',
    name: 'Hair Care Combo',
    tagline: 'Deep nourishment & conditioning for complete hair revival',
    productIds: ['hair-oil', 'hair-pack'],
    discountPercent: 22,
  },
  {
    id: 'glow-combo',
    name: 'Glow Combo',
    tagline: 'Purifying clay mask combined with our youth-boosting Vitamin C serum',
    productIds: ['face-pack', 'face-serum'],
    discountPercent: 21,
  },
];

const testimonialsList = [
  {
    name: 'Priya Sharma',
    location: 'Mumbai',
    rating: 5,
    product: 'Hair Oil',
    quote: 'The Hair Oil is absolutely divine! My hair has never felt so nourished and the fragrance is so calming. I\'ve been using it for 3 months and the difference is incredible.',
  },
  {
    name: 'Ananya Reddy',
    location: 'Hyderabad',
    rating: 5,
    product: 'Face Serum',
    quote: 'The Face Serum gives me such a beautiful glow every morning. It absorbs so quickly and my skin feels plump and hydrated all day long. Love it!',
  },
  {
    name: 'Meera Iyer',
    location: 'Bangalore',
    rating: 5,
    product: 'Face Pack & Hair Pack',
    quote: 'Tried the Face Pack and Hair Pack together as a weekend ritual. My skin and hair feel completely transformed. 100% natural and it truly shows!',
  },
];

export default function HomePage() {
  const location = useLocation();
  const { addToCart } = useCart();

  // Scroll to hash on mount or location change
  useEffect(() => {
    // Check if there's a scrollTo query param
    const searchParams = new URLSearchParams(location.search);
    const scrollTo = searchParams.get('scrollTo');
    const targetId = scrollTo || location.hash.replace('#', '');
    
    if (targetId) {
      setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location]);

  // ---- SHOP STATE ----
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [sort, setSort] = useState<SortOption>('default');
  const [search, setSearch] = useState('');
  
  const filteredProducts = products
    .filter((p) => {
      const matchCat = filter === 'all' || p.category === filter;
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    })
    .sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'price-asc') return parseInt(a.price.replace(/\D/g, '')) - parseInt(b.price.replace(/\D/g, ''));
      if (sort === 'price-desc') return parseInt(b.price.replace(/\D/g, '')) - parseInt(a.price.replace(/\D/g, ''));
      return 0;
    });

  // ---- COMBOS STATE ----
  const [comboSelections, setComboSelections] = useState<Record<string, string[]>>({
    'hair-combo': ['hair-oil', 'hair-pack'],
    'glow-combo': ['face-pack', 'face-serum'],
  });

  const handleProductToggle = (comboId: string, productId: string) => {
    setComboSelections((prev) => {
      const selected = prev[comboId] || [];
      const updated = selected.includes(productId)
        ? selected.filter((id) => id !== productId)
        : [...selected, productId];
      return { ...prev, [comboId]: updated };
    });
  };

  const calculateComboPrices = (combo: ComboDefinition) => {
    const selectedIds = comboSelections[combo.id] || [];
    let originalTotal = 0;
    
    selectedIds.forEach((id) => {
      const prod = products.find((p) => p.id === id);
      if (prod) {
        originalTotal += parseInt(prod.price.replace(/\D/g, '')) || 0;
      }
    });

    const isAllSelected = selectedIds.length === combo.productIds.length;
    const discount = isAllSelected ? combo.discountPercent : 0;
    const finalTotal = Math.round(originalTotal * (1 - discount / 100));

    return {
      originalTotal,
      finalTotal,
      discountApplied: discount,
      savings: originalTotal - finalTotal,
    };
  };

  const handleAddComboToCart = (combo: ComboDefinition) => {
    const selectedIds = comboSelections[combo.id] || [];
    if (selectedIds.length === 0) return;

    const { finalTotal } = calculateComboPrices(combo);
    const isAllSelected = selectedIds.length === combo.productIds.length;
    
    if (isAllSelected) {
      addToCart({
        id: combo.id,
        name: combo.name,
        price: `₹${finalTotal}`,
        size: `${selectedIds.length} Products`,
        image: products.find((p) => p.id === selectedIds[0])?.image,
      });
    } else {
      selectedIds.forEach((id) => {
        const prod = products.find((p) => p.id === id);
        if (prod) {
          addToCart({
            id: prod.id,
            name: prod.name,
            price: prod.price,
            size: prod.sizes[0],
            image: prod.image,
          });
        }
      });
    }
  };

  const handleOrderComboWhatsApp = (combo: ComboDefinition) => {
    const selectedIds = comboSelections[combo.id] || [];
    if (selectedIds.length === 0) return;
    
    const selectedProductNames = selectedIds.map(
      (id) => products.find((p) => p.id === id)?.name || id
    );

    const { finalTotal } = calculateComboPrices(combo);

    // Log to Supabase asynchronously
    (async () => {
      try {
        const items = selectedIds.map(id => {
          const prod = products.find(p => p.id === id);
          return {
            id: id,
            name: prod?.name || id,
            price: prod?.price || '',
            size: prod?.sizes[0] || 'Standard',
            quantity: 1,
            image: prod?.image || ''
          };
        });

        const { error } = await supabase.from('orders').insert({
          items: items,
          total_amount: finalTotal
        });
        if (error) console.error('Supabase async error:', error);
      } catch (err) {
        console.error('Supabase sync error:', err);
      }
    })();

    const waLink = getWhatsAppComboLink(combo.name, selectedProductNames);
    window.open(waLink, '_blank');
  };

  // ---- BLOG STATE ----
  const [activeCategory, setActiveCategory] = useState<BlogCategory>('All');
  const filteredPosts = blogPosts.filter(
    (post) => activeCategory === 'All' || post.category === activeCategory
  );

  // ---- CONTACT STATE ----
  const [formState, setFormState] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContactSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!formState.name.trim() || !formState.email.trim() || !formState.message.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formState.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          access_key: "27812200-cf31-43a4-8dd4-ed7e2ad2e73f",
          ...formState
        })
      });

      const result = await response.json();
      if (response.status === 200) {
        setSubmitted(true);
      } else {
        setError(result.message || 'Something went wrong. Please try again later.');
      }
    } catch (err) {
      console.error('Web3Forms fetch error:', err);
      setError('Failed to send message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-x-hidden">
      <Helmet>
        <title>Home - InbaNaturals</title>
        <meta name="description" content="Discover our handcrafted botanical beauty rituals — made with the purest ingredients from nature, for skin and hair that truly thrives." />
      </Helmet>

      {/* ─── HERO ─── */}
      <section
        id="hero"
        className="relative min-h-[90vh] flex items-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #EEF4EC 0%, #FAF6EE 50%, #F5EDE0 100%)' }}
      >
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 -translate-y-1/2 translate-x-1/3" style={{ background: '#7A9471' }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-10 translate-y-1/2 -translate-x-1/3" style={{ background: '#C97C5D' }} />

        {/* Botanical SVG accent top-left */}
        <svg className="absolute top-8 left-8 opacity-10" width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden="true">
          <circle cx="60" cy="60" r="50" stroke="#7A9471" strokeWidth="1" strokeDasharray="4 6"/>
          <path d="M60 20 C40 30, 20 50, 30 80 C40 100, 80 100, 90 80 C100 50, 80 30, 60 20Z" stroke="#7A9471" strokeWidth="1.5" fill="none"/>
          <line x1="60" y1="20" x2="60" y2="100" stroke="#7A9471" strokeWidth="1" strokeDasharray="3 5"/>
        </svg>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center py-20">
          {/* Text */}
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 text-sage text-sm font-medium uppercase tracking-widest mb-4">
              <Leaf size={14} /> Pure. Natural. Botanical.
            </span>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-charcoal leading-tight mb-6">
              Glow from the{' '}
              <span className="italic text-sage">inside</span>{' '}
              out.
            </h1>
            <p className="text-charcoal-light text-lg leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
              Discover our handcrafted botanical beauty rituals — made with the purest ingredients from nature, for skin and hair that truly thrives.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                to="/shop"
                className="inline-flex items-center justify-center gap-2 bg-sage hover:bg-sage-dark text-white font-medium px-8 py-4 rounded-2xl transition-all duration-200 ease-out active:scale-[0.98] hover:shadow-lg text-base cursor-pointer"
              >
                Shop Now <ArrowRight size={18} />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center justify-center gap-2 border-2 border-sage text-sage hover:bg-sage hover:text-white font-medium px-8 py-4 rounded-2xl transition-all duration-200 ease-out active:scale-[0.98] text-base cursor-pointer"
              >
                Our Story
              </Link>
            </div>
          </div>

          {/* Hero image placeholder */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative">
              {/* Main placeholder */}
              <div className="w-80 h-80 md:w-96 md:h-96 rounded-[3rem] shadow-2xl overflow-hidden border-4 border-white/60">
                <img
                  src="https://placehold.co/400x400/7A9471/FAF6EE?text=InbaNaturals"
                  alt="InbaNaturals hero product"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl px-5 py-3 border border-ivory-dark">
                <p className="text-xs text-charcoal-light font-medium">⭐ Rated</p>
                <p className="font-serif text-charcoal font-bold text-lg">4.9/5</p>
                <p className="text-xs text-sage">by 200+ customers</p>
              </div>
              {/* Floating ingredient tag */}
              <div className="absolute -top-4 -right-4 bg-terracotta text-white text-sm font-medium px-4 py-2 rounded-2xl shadow-lg">
                🌿 100% Natural
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SHOP ─── */}
      <section id="shop" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-sage text-xs font-medium uppercase tracking-widest">Everything Natural</span>
          <h2 className="font-serif text-4xl md:text-5xl text-charcoal mt-2 mb-3">Shop All Products</h2>
          <LeafDivider />
          <p className="text-charcoal-light mt-4 max-w-xl mx-auto leading-relaxed">
            Handcrafted botanical beauty for your hair and skin — free from harmful chemicals, full of plant love.
          </p>
        </div>

        {/* Filter / Sort bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-ivory-dark p-4 mb-8 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-light" />
            <input
              type="text"
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-ivory-dark text-sm focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 transition-colors bg-ivory text-charcoal placeholder-charcoal-light"
            />
          </div>

          {/* Category filter pills */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'hair', 'face'] as FilterCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 capitalize ${
                  filter === cat
                    ? 'bg-sage text-white shadow-sm'
                    : 'bg-ivory text-charcoal-light hover:bg-ivory-dark border border-ivory-dark'
                }`}
              >
                {cat === 'all' ? 'All' : cat === 'hair' ? 'Hair Care' : 'Skin Care'}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-charcoal-light shrink-0" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="bg-ivory border border-ivory-dark text-sm text-charcoal rounded-xl px-3 py-2.5 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 cursor-pointer"
            >
              <option value="default">Sort: Default</option>
              <option value="name">Name: A–Z</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <p className="text-charcoal-light text-sm mb-6">
          Showing <span className="font-medium text-charcoal">{filteredProducts.length}</span> product{filteredProducts.length !== 1 ? 's' : ''}
        </p>

        {/* Product grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-charcoal-light">
            <p className="font-serif text-2xl mb-2">No products found</p>
            <p className="text-sm">Try adjusting your filters or search term.</p>
          </div>
        )}
      </section>

      {/* ─── COMBOS ─── */}
      <section id="combos" className="py-20 bg-ivory-dark border-t border-b border-ivory-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-sage text-xs font-medium uppercase tracking-widest flex items-center justify-center gap-1">
              <Sparkles size={12} className="text-terracotta" /> Best Value Packages
            </span>
            <h2 className="font-serif text-4xl md:text-5xl text-charcoal mt-2 mb-3">Combo Offers & Bundles</h2>
            <LeafDivider />
            <p className="text-charcoal-light mt-4 max-w-xl mx-auto leading-relaxed">
              Unlock maximum savings when you purchase our customized product bundles. Customize your combo below!
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {combos.map((combo) => {
              const selectedIds = comboSelections[combo.id] || [];
              const { originalTotal, finalTotal, discountApplied, savings } = calculateComboPrices(combo);

              return (
                <div
                  key={combo.id}
                  className="bg-white rounded-3xl p-6 sm:p-8 border border-ivory-dark shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between hover:scale-[1.01]"
                >
                  <div>
                    {/* Badges & Title */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="text-xs bg-sage/10 text-sage font-semibold uppercase tracking-widest px-3 py-1 rounded-full">
                        Bundle Deal
                      </span>
                      {discountApplied > 0 && (
                        <span className="text-xs bg-terracotta text-white font-bold px-3 py-1 rounded-full animate-pulse">
                          Save {discountApplied}%
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif text-2xl sm:text-3xl text-charcoal font-bold mb-2">
                      {combo.name}
                    </h3>
                    <p className="text-charcoal-light text-sm mb-6 leading-relaxed">
                      {combo.tagline}
                    </p>

                    {/* Combined Thumbnails */}
                    <div className="flex gap-3 mb-6 bg-ivory p-4 rounded-2xl border border-ivory-dark">
                      {combo.productIds.map((id) => {
                        const prod = products.find((p) => p.id === id);
                        const isSelected = selectedIds.includes(id);
                        if (!prod) return null;
                        return (
                          <div
                            key={id}
                            onClick={() => handleProductToggle(combo.id, id)}
                            className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 cursor-pointer transition-all duration-200 ${
                              isSelected ? 'border-sage scale-105 shadow-sm' : 'border-transparent opacity-40 hover:opacity-60'
                            }`}
                          >
                            <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                            {isSelected && (
                              <div className="absolute top-1 right-1 w-5 h-5 bg-sage text-white rounded-full flex items-center justify-center">
                                <Check size={12} strokeWidth={3} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Customizer Toggles */}
                    <div className="space-y-3 mb-6">
                      <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-light">
                        Customize Bundle Products:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {combo.productIds.map((id) => {
                          const prod = products.find((p) => p.id === id);
                          const isSelected = selectedIds.includes(id);
                          if (!prod) return null;
                          return (
                            <button
                              key={id}
                              onClick={() => handleProductToggle(combo.id, id)}
                              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                                isSelected
                                  ? 'bg-sage text-white'
                                  : 'bg-ivory text-charcoal-light border border-ivory-dark hover:bg-ivory-dark'
                              }`}
                            >
                              <span className="text-lg">{isSelected ? '✓' : '+'}</span>
                              {prod.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Price & Actions */}
                  <div className="mt-8 pt-6 border-t border-ivory-dark space-y-4">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <p className="text-xs text-charcoal-light uppercase font-medium tracking-wider">Combo Price</p>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-3xl font-bold text-terracotta">₹{finalTotal}</span>
                          {discountApplied > 0 && (
                            <span className="text-charcoal-light text-base line-through">₹{originalTotal}</span>
                          )}
                        </div>
                      </div>
                      {discountApplied > 0 && (
                        <div className="text-right">
                          <p className="text-xs text-sage font-medium">Instant Savings</p>
                          <p className="text-lg font-semibold text-sage">-₹{savings}</p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        onClick={() => handleAddComboToCart(combo)}
                        disabled={selectedIds.length === 0}
                        className="w-full flex items-center justify-center gap-1.5 bg-sage hover:bg-sage-dark text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 ease-out active:scale-[0.98] text-xs sm:text-sm disabled:opacity-40 disabled:pointer-events-none cursor-pointer hover:-translate-y-0.5 hover:shadow-sm"
                      >
                        <ShoppingBag size={16} />
                        Add Bundle
                      </button>
                      <button
                        onClick={() => handleOrderComboWhatsApp(combo)}
                        disabled={selectedIds.length === 0}
                        className="w-full flex items-center justify-center gap-1.5 bg-terracotta hover:bg-terracotta-dark text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 ease-out active:scale-[0.98] text-xs sm:text-sm disabled:opacity-40 disabled:pointer-events-none cursor-pointer hover:-translate-y-0.5 hover:shadow-sm"
                      >
                        <MessageSquare size={16} />
                        WhatsApp Order
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── BLOG ─── */}
      <section id="blog" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-sage text-xs font-medium uppercase tracking-widest">Botanical Living</span>
            <h2 className="font-serif text-4xl md:text-5xl text-charcoal mt-2 mb-3">Our Blog & Natural Tips</h2>
            <LeafDivider />
            <p className="text-charcoal-light mt-4 max-w-xl mx-auto leading-relaxed">
              Explore Ayurvedic rituals, clean beauty tips, and botanical guides for healthy skin and hair.
            </p>
          </div>

          {/* Category filter pills */}
          <div className="flex justify-center gap-2 mb-10 flex-wrap">
            {(['All', 'Hair Care', 'Skin Care', 'Wellness'] as BlogCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 capitalize cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-sage text-white shadow-sm'
                    : 'bg-ivory text-charcoal-light hover:bg-ivory-dark border border-ivory-dark'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Blog Post Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-3xl overflow-hidden border border-ivory-dark shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col group hover:scale-[1.01]"
              >
                {/* Image */}
                <Link to={`/blog/${post.id}`} className="block h-52 overflow-hidden bg-ivory-dark relative">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-sage text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-ivory-dark">
                    {post.category}
                  </span>
                </Link>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1 justify-between">
                  <div>
                    {/* Meta */}
                    <div className="flex items-center gap-4 text-xs text-charcoal-light mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {post.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        {post.author}
                      </span>
                    </div>

                    <Link to={`/blog/${post.id}`}>
                      <h3 className="font-serif text-xl font-bold text-charcoal leading-snug mb-3 hover:text-sage transition-colors">
                        {post.title}
                      </h3>
                    </Link>
                    <p className="text-charcoal-light text-sm mb-5 leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                  </div>

                  <Link
                    to={`/blog/${post.id}`}
                    className="inline-flex items-center gap-2 text-sage hover:text-sage-dark text-sm font-semibold mt-auto"
                  >
                    Read More <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ABOUT ─── */}
      <section id="about" className="py-20 bg-ivory">
        {/* Founder story */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="text-center mb-12">
            <span className="text-sage text-xs font-medium uppercase tracking-widest">Our Story</span>
            <h2 className="font-serif text-4xl md:text-5xl text-charcoal mt-2 mb-3">About InbaNaturals</h2>
            <LeafDivider />
          </div>
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            {/* Photo placeholder */}
            <div className="flex justify-center lg:justify-start">
              <div className="relative">
                <div className="w-72 h-80 md:w-96 md:h-[26rem] rounded-3xl overflow-hidden shadow-xl border-4 border-white">
                  <img
                    src="https://placehold.co/400x450/A8C1A1/2E2A26?text=Founder+Photo"
                    alt="Founder placeholder"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Decorative element */}
                <div className="absolute -bottom-5 -right-5 w-28 h-28 bg-ivory-dark rounded-3xl border-4 border-white flex items-center justify-center shadow-md">
                  <div className="text-center">
                    <p className="font-serif text-2xl font-bold text-sage">5+</p>
                    <p className="text-xs text-charcoal-light">Years of<br/>Research</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Story text */}
            <div>
              <span className="text-sage text-xs font-medium uppercase tracking-widest">Meet the Founder</span>
              <h3 className="font-serif text-4xl text-charcoal mt-2 mb-4 leading-tight">
                A passion for <em>pure beauty</em>, born in a kitchen.
              </h3>
              <p className="text-charcoal-light leading-relaxed mb-4">
                InbaNaturals was born from a simple frustration — the inability to find beauty products free from harsh chemicals that actually worked.
              </p>
              <p className="text-charcoal-light leading-relaxed mb-4">
                What started as small-batch experiments in a home kitchen, guided by grandmother's age-old Ayurvedic wisdom, blossomed into a passionate brand dedicated to clean, conscious beauty. Every formula is a labour of love, tested on family and friends before it ever reaches your hands.
              </p>
              <p className="text-charcoal-light leading-relaxed mb-6">
                We believe that nature has everything your skin and hair need. Our mission is simply to bring those gifts to you — thoughtfully, sustainably, and beautifully.
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-sage">
                  <img src="https://placehold.co/50x50/7A9471/FAF6EE?text=Founder" alt="Founder signature" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-serif text-charcoal font-semibold">Ananya Founder</p>
                  <p className="text-sage text-xs">Founder & Formulator, InbaNaturals</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mission statement */}
        <div className="py-16 mb-20" style={{ background: 'linear-gradient(135deg, #EEF4EC, #FAF6EE)' }}>
          <div className="max-w-3xl mx-auto px-4 text-center">
            <span className="text-sage text-xs font-medium uppercase tracking-widest">Our Mission</span>
            <h3 className="font-serif text-4xl md:text-5xl text-charcoal mt-2 mb-4 leading-tight">
              Clean beauty that <em>honours</em> both you and the planet.
            </h3>
            <LeafDivider />
            <p className="text-charcoal-light mt-5 leading-relaxed">
              We are committed to formulating products that harness the best of nature — sustainably sourced, cruelty-free, and crafted without compromise. Because what goes on your body matters just as much as what goes in it.
            </p>
          </div>
        </div>

        {/* Process / Values */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-sage text-xs font-medium uppercase tracking-widest">Our Values</span>
            <h3 className="font-serif text-4xl text-charcoal mt-2 mb-3">The InbaNaturals Way</h3>
            <LeafDivider />
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Leaf size={36} className="text-sage" />,
                title: 'Sustainably Sourced',
                desc: 'We partner with ethical farms and co-operatives to source the purest botanical ingredients — respecting both the land and the people who tend it.',
              },
              {
                icon: <Sprout size={36} className="text-sage" />,
                title: 'Small-Batch Crafted',
                desc: 'Every batch is made in small quantities to ensure maximum freshness, potency, and quality. No shortcuts, no mass production.',
              },
              {
                icon: <Heart size={36} className="text-sage" />,
                title: 'Cruelty-Free Always',
                desc: "We never test on animals. Our products are certified cruelty-free and vegan, because beauty should never come at another's expense.",
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="text-center group">
                <div className="w-20 h-20 bg-sage/10 group-hover:bg-sage/20 transition-colors rounded-full flex items-center justify-center mx-auto mb-5">
                  {icon}
                </div>
                <h4 className="font-serif text-xl text-charcoal font-semibold mb-3">{title}</h4>
                <p className="text-charcoal-light text-sm leading-relaxed max-w-xs mx-auto">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section id="testimonials" className="pt-20 pb-10 bg-white">
        <div className="text-center mb-12">
          <span className="text-sage text-xs font-medium uppercase tracking-widest">Real Stories</span>
          <h2 className="font-serif text-4xl md:text-5xl text-charcoal mt-2 mb-3">Customer Love</h2>
          <LeafDivider />
          <p className="text-charcoal-light mt-4 max-w-xl mx-auto leading-relaxed">
            Don't just take our word for it — hear from our community of natural beauty believers.
          </p>
        </div>

        {/* Overall rating banner */}
        {testimonialsList.length > 0 && (
          <div className="bg-sage py-10 mb-20">
            <div className="max-w-3xl mx-auto px-4 text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <StarRating rating={5} />
                <span className="font-serif text-4xl text-white font-bold">5.0</span>
              </div>
              <p className="text-white/80 text-sm">Early feedback from our first customers</p>
            </div>
          </div>
        )}

        {/* Testimonial cards grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          {testimonialsList.length === 0 && (
            <div className="text-center py-10">
              <p className="text-charcoal text-base font-medium bg-ivory-dark inline-block px-6 py-3 rounded-2xl border border-ivory-dark">
                Early feedback from our first customers coming soon! 🌿
              </p>
            </div>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonialsList.map((t, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 p-7 border border-ivory-dark flex flex-col"
              >
                {/* Top */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center font-serif font-bold text-sage text-base">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-charcoal text-sm">{t.name}</p>
                      <p className="text-charcoal-light text-xs">{t.location}</p>
                    </div>
                  </div>
                  <StarRating rating={t.rating} />
                </div>

                {/* Quote */}
                <p className="text-charcoal-light text-sm leading-relaxed flex-1 italic">
                  "{t.quote}"
                </p>

                {/* Product tag */}
                <div className="mt-4 pt-4 border-t border-ivory-dark">
                  <span className="inline-block bg-sage/10 text-sage text-xs font-medium px-3 py-1 rounded-full">
                    ✓ Verified: {t.product}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center px-4">
          <div className="max-w-lg mx-auto bg-ivory-dark rounded-3xl p-10 border border-ivory-dark">
            <h3 className="font-serif text-3xl text-charcoal mb-3">Love InbaNaturals?</h3>
            <p className="text-charcoal-light text-sm mb-6 leading-relaxed">
              Share your experience and help others discover the power of natural beauty.
            </p>
            <button className="bg-sage hover:bg-sage-dark text-white font-medium px-8 py-3.5 rounded-2xl transition-all duration-200 ease-out active:scale-[0.98] cursor-pointer hover:shadow-lg hover:-translate-y-0.5">
              Write a Review
            </button>
          </div>
        </div>
      </section>

      {/* ─── INSTAGRAM GRID ─── */}
      <section id="instagram-feed" className="py-20 bg-ivory-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-sage text-xs font-medium uppercase tracking-widest">Follow Our Journey</span>
            <h2 className="font-serif text-4xl text-charcoal mt-2 mb-1">@inbanaturals</h2>
            <LeafDivider />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
            {Array.from({ length: 6 }).map((_, i) => {
              const likes = [142, 98, 245, 112, 87, 310][i];
              const comments = [18, 5, 23, 14, 9, 31][i];
              return (
                <a
                  key={i}
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square rounded-2xl overflow-hidden bg-ivory border border-ivory-dark shadow-sm hover:shadow-md"
                >
                  <img
                    src={`https://placehold.co/300x300/${['7A9471', 'A8C1A1', 'C97C5D', 'FAF6EE', '5A7453', 'F0E8D6'][i]}/${['FAF6EE', '2E2A26', 'FAF6EE', '7A9471', 'FAF6EE', '2E2A26'][i]}?text=✦`}
                    alt={`Instagram post ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/40 transition-all duration-300 flex flex-col items-center justify-center gap-1">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[11px] font-semibold text-white flex items-center gap-2 mt-1">
                      <span>❤️ {likes}</span>
                      <span>💬 {comments}</span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
          <div className="text-center">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border-2 border-sage text-sage hover:bg-sage hover:text-white font-semibold px-8 py-3.5 rounded-full transition-all duration-200 ease-out active:scale-[0.98] text-sm cursor-pointer"
            >
              Follow us @inbanaturals
            </a>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-20 bg-ivory">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-sage text-xs font-medium uppercase tracking-widest">Help & Support</span>
            <h2 className="font-serif text-4xl md:text-5xl text-charcoal mt-2 mb-3">Frequently Asked Questions</h2>
            <LeafDivider />
            <p className="text-charcoal-light mt-4 max-w-xl mx-auto leading-relaxed">
              Find instant answers to common questions about our products, ingredients, shipping, and returns.
            </p>
          </div>
          
          <div className="mt-12">
            <FAQAccordion />
          </div>
          
          {/* WhatsApp Help CTA */}
          <div className="max-w-md mx-auto mt-14 text-center px-4">
            <div className="bg-white rounded-3xl p-8 border border-ivory-dark shadow-sm">
              <h3 className="font-serif text-xl font-bold text-charcoal mb-2">Still have questions?</h3>
              <p className="text-charcoal-light text-sm mb-6 leading-relaxed">
                We are always happy to help. Chat with us directly on WhatsApp for personalized support.
              </p>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-sage hover:bg-sage-dark text-white font-medium px-8 py-3.5 rounded-2xl transition-all duration-200 ease-out active:scale-[0.98] cursor-pointer hover:shadow-lg hover:-translate-y-0.5"
              >
                Ask on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CONTACT ─── */}
      <section id="contact" className="py-20 bg-ivory-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sage text-xs font-medium uppercase tracking-widest">We're Here For You</span>
            <h2 className="font-serif text-4xl md:text-5xl text-charcoal mt-2 mb-3">Get in Touch</h2>
            <LeafDivider />
            <p className="text-charcoal-light mt-4 max-w-xl mx-auto leading-relaxed">
              Have a question about our products or your order? We'd love to hear from you. We typically respond within 24 hours.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-10">
            {/* Contact info card */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-ivory-dark p-7">
                <h3 className="font-serif text-2xl text-charcoal mb-6">Contact Info</h3>
                <ul className="space-y-5">
                  <li className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-sage/10 flex items-center justify-center shrink-0">
                      <Phone size={18} className="text-sage" />
                    </div>
                    <div>
                      <p className="text-xs text-charcoal-light font-medium uppercase tracking-wider mb-0.5">Phone</p>
                      <p className="text-charcoal text-sm font-medium">+91 8610866523</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-sage/10 flex items-center justify-center shrink-0">
                      <Mail size={18} className="text-sage" />
                    </div>
                    <div>
                      <p className="text-xs text-charcoal-light font-medium uppercase tracking-wider mb-0.5">Email</p>
                      <p className="text-charcoal text-sm font-medium">santhosh20060911@gmail.com</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-sage/10 flex items-center justify-center shrink-0">
                      <Clock size={18} className="text-sage" />
                    </div>
                    <div>
                      <p className="text-xs text-charcoal-light font-medium uppercase tracking-wider mb-0.5">Business Hours</p>
                      <p className="text-charcoal text-sm font-medium">Mon–Sat, 10am–6pm IST</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-sage/10 flex items-center justify-center shrink-0">
                      <MapPin size={18} className="text-sage" />
                    </div>
                    <div>
                      <p className="text-xs text-charcoal-light font-medium uppercase tracking-wider mb-0.5">Location</p>
                      <p className="text-charcoal text-sm font-medium">Coimbatore, TamilNadu, India</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* WhatsApp card */}
              <div
                className="rounded-2xl p-6 text-white"
                style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
              >
                <MessageCircle size={28} className="mb-3" />
                <h4 className="font-serif text-xl font-semibold mb-2">Chat on WhatsApp</h4>
                <p className="text-white/80 text-sm mb-4 leading-relaxed">
                  Get instant replies! Message us directly on WhatsApp for fast support.
                </p>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white text-green-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-green-50 transition-colors"
                >
                  <MessageCircle size={16} /> Start Chat
                </a>
              </div>
            </div>

            {/* Contact form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-ivory-dark p-8">
                <h3 className="font-serif text-2xl text-charcoal mb-2">Send us a Message</h3>
                <p className="text-charcoal-light text-sm mb-7">
                  Fill in the form below and we'll get back to you as soon as possible.
                </p>

                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-sage/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Send size={28} className="text-sage" />
                    </div>
                    <h4 className="font-serif text-2xl text-charcoal mb-2">Message Sent! 🌿</h4>
                    <p className="text-charcoal-light text-sm">
                      Thank you for reaching out. We'll reply within 24 hours.
                    </p>
                    <button
                      onClick={() => { setSubmitted(false); setFormState({ name: '', email: '', subject: '', message: '' }); }}
                      className="mt-6 text-sage text-sm font-medium hover:underline cursor-pointer"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-5" noValidate>
                    {error && (
                      <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-100">
                        {error}
                      </div>
                    )}
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="contact-name" className="block text-sm font-medium text-charcoal mb-1.5">
                          Full Name <span className="text-terracotta">*</span>
                        </label>
                        <input
                          id="contact-name"
                          type="text"
                          required
                          value={formState.name}
                          onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                          placeholder="Your full name"
                          className="w-full px-4 py-3 rounded-xl border border-ivory-dark bg-ivory text-charcoal text-sm placeholder-charcoal-light focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 transition-colors"
                        />
                      </div>
                      <div>
                        <label htmlFor="contact-email" className="block text-sm font-medium text-charcoal mb-1.5">
                          Email Address <span className="text-terracotta">*</span>
                        </label>
                        <input
                          id="contact-email"
                          type="email"
                          required
                          value={formState.email}
                          onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                          placeholder="your@email.com"
                          className="w-full px-4 py-3 rounded-xl border border-ivory-dark bg-ivory text-charcoal text-sm placeholder-charcoal-light focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="contact-subject" className="block text-sm font-medium text-charcoal mb-1.5">
                        Subject
                      </label>
                      <input
                        id="contact-subject"
                        type="text"
                        value={formState.subject}
                        onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                        placeholder="e.g. Order query, Product info…"
                        className="w-full px-4 py-3 rounded-xl border border-ivory-dark bg-ivory text-charcoal text-sm placeholder-charcoal-light focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 transition-colors"
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-message" className="block text-sm font-medium text-charcoal mb-1.5">
                        Message <span className="text-terracotta">*</span>
                      </label>
                      <textarea
                        id="contact-message"
                        required
                        rows={6}
                        value={formState.message}
                        onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                        placeholder="Tell us how we can help you…"
                        className="w-full px-4 py-3 rounded-xl border border-ivory-dark bg-ivory text-charcoal text-sm placeholder-charcoal-light focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 transition-colors resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className={`w-full flex items-center justify-center gap-2 bg-sage hover:bg-sage-dark text-white font-semibold py-4 rounded-2xl transition-all duration-200 ease-out active:scale-[0.98] ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer'}`}
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send size={18} />
                      )}
                      {loading ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
