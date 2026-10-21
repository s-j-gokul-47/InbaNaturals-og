import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, Image as ImageIcon, Package, CheckCircle2, AlertTriangle, Sparkles, X } from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../components/ui/Toast';
import type { Product } from '../../types';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: 'hair',
    tagline: '',
    description: '',
    ingredients: '',
    how_to_use: '',
    price: '',
    original_price: '',
    sizes: 'Standard',
    image_url: '',
    in_stock: true,
    stock_quantity: '100',
    is_featured: false,
  });

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products', { params: { page_size: 100 } });
      setProducts(res.data.items || res.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch products', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        slug: product.slug,
        category: product.category,
        tagline: product.tagline,
        description: product.description,
        ingredients: product.ingredients,
        how_to_use: product.how_to_use,
        price: product.price.toString(),
        original_price: product.original_price?.toString() || '',
        sizes: (() => {
          try {
            return JSON.parse(product.sizes || '[]').join(', ');
          } catch {
            return product.sizes || '';
          }
        })(),
        image_url: product.image_url,
        in_stock: product.in_stock,
        stock_quantity: product.stock_quantity.toString(),
        is_featured: product.is_featured,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        slug: '',
        category: 'hair',
        tagline: '',
        description: '',
        ingredients: '',
        how_to_use: '',
        price: '',
        original_price: '',
        sizes: 'Standard',
        image_url: '',
        in_stock: true,
        stock_quantity: '100',
        is_featured: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setFormData(prev => ({ ...prev, name, slug }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const sizesArray = formData.sizes.split(',').map(s => s.trim()).filter(Boolean);
      const payload = {
        ...formData,
        price: Number(formData.price),
        original_price: formData.original_price ? Number(formData.original_price) : null,
        stock_quantity: Number(formData.stock_quantity),
        sizes: JSON.stringify(sizesArray),
      };

      if (editingProduct) {
        await api.put(`/admin/products/${editingProduct.id}`, payload);
        showToast('Product updated successfully', 'success');
      } else {
        await api.post('/admin/products', payload);
        showToast('Product created successfully', 'success');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.detail || 'Failed to save product', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      showToast('Product deleted', 'success');
      fetchProducts();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete product', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-64 items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <p className="text-xs font-mono uppercase tracking-widest">Loading Catalog Database...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* ── Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#111827] border border-[#1F2937] shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Package size={22} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Product Catalog Management</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage formulations, pricing, stock levels, and store visibility.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2.5 rounded-xl font-semibold transition-all shadow-md shadow-emerald-950 text-xs font-sans cursor-pointer"
        >
          <Plus size={16} /> Add New Formulation
        </button>
      </div>

      {/* ── Table Container ── */}
      <div className="rounded-2xl bg-[#111827] border border-[#1F2937] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0E1420] border-b border-[#1C2638] text-slate-400 font-mono text-[10px] uppercase">
              <tr>
                <th className="px-5 py-4 font-semibold">Formulation</th>
                <th className="px-5 py-4 font-semibold">Category</th>
                <th className="px-5 py-4 font-semibold text-right">Price (₹)</th>
                <th className="px-5 py-4 font-semibold text-center">Inventory</th>
                <th className="px-5 py-4 font-semibold text-center">Featured</th>
                <th className="px-5 py-4 font-semibold text-right">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C2638]">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name} 
                          className="w-10 h-10 rounded-xl object-cover border border-[#1F2937] shrink-0" 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-400 border border-[#1F2937] shrink-0">
                          <ImageIcon size={18} />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-white">{product.name}</p>
                        <p className="text-[10px] font-mono text-slate-400">SKU #{product.id} · /{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="capitalize px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                      {product.category} Care
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono font-bold text-white text-sm">
                    ₹{product.price}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold ${
                      product.in_stock 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}>
                      {product.in_stock ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                      {product.stock_quantity} units
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {product.is_featured ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded text-[10px] font-bold uppercase font-mono">
                        <Sparkles size={10} /> Featured
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenModal(product)}
                        className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Edit Formulation"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete Formulation"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]">
          <div className="bg-[#111827] border border-[#1F2937] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl text-white">
            <div className="p-5 border-b border-[#1C2638] flex justify-between items-center bg-[#0E1420]">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-emerald-400" />
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider">
                  {editingProduct ? 'Edit Product Formulation' : 'Create New Formulation'}
                </h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <form id="product-form" onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono font-semibold text-slate-400 mb-1.5 uppercase">Product Name</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.name} 
                      onChange={handleNameChange} 
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#1F2937] bg-[#0B0F17] text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-semibold text-slate-400 mb-1.5 uppercase">Slug URL</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.slug} 
                      onChange={(e) => setFormData(prev => ({...prev, slug: e.target.value}))} 
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#1F2937] bg-[#0B0F17] text-white text-xs font-mono focus:outline-none focus:border-emerald-500 transition-colors" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono font-semibold text-slate-400 mb-1.5 uppercase">Selling Price (₹)</label>
                    <input 
                      type="number" 
                      required 
                      value={formData.price} 
                      onChange={(e) => setFormData(prev => ({...prev, price: e.target.value}))} 
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#1F2937] bg-[#0B0F17] text-white text-xs font-mono focus:outline-none focus:border-emerald-500 transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-semibold text-slate-400 mb-1.5 uppercase">Orig. Price (₹)</label>
                    <input 
                      type="number" 
                      value={formData.original_price} 
                      onChange={(e) => setFormData(prev => ({...prev, original_price: e.target.value}))} 
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#1F2937] bg-[#0B0F17] text-white text-xs font-mono focus:outline-none focus:border-emerald-500 transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-semibold text-slate-400 mb-1.5 uppercase">Category</label>
                    <select 
                      required 
                      value={formData.category} 
                      onChange={(e) => setFormData(prev => ({...prev, category: e.target.value}))} 
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#1F2937] bg-[#0B0F17] text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                    >
                      <option value="hair">Hair Care</option>
                      <option value="face">Face Care</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-semibold text-slate-400 mb-1.5 uppercase">Image URL or Asset Path</label>
                  <input 
                    type="text" 
                    value={formData.image_url} 
                    onChange={(e) => setFormData(prev => ({...prev, image_url: e.target.value}))} 
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#1F2937] bg-[#0B0F17] text-white text-xs font-mono focus:outline-none focus:border-emerald-500 transition-colors" 
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-semibold text-slate-400 mb-1.5 uppercase">Sizes (comma-separated)</label>
                  <input 
                    type="text" 
                    value={formData.sizes} 
                    onChange={(e) => setFormData(prev => ({...prev, sizes: e.target.value}))} 
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#1F2937] bg-[#0B0F17] text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors" 
                    placeholder="e.g. 50ml, 100ml, 200ml" 
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-semibold text-slate-400 mb-1.5 uppercase">Tagline</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.tagline} 
                    onChange={(e) => setFormData(prev => ({...prev, tagline: e.target.value}))} 
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#1F2937] bg-[#0B0F17] text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors" 
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-semibold text-slate-400 mb-1.5 uppercase">Description</label>
                  <textarea 
                    required 
                    rows={2} 
                    value={formData.description} 
                    onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))} 
                    className="w-full px-3.5 py-2 rounded-xl border border-[#1F2937] bg-[#0B0F17] text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors resize-none" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono font-semibold text-slate-400 mb-1.5 uppercase">Ingredients</label>
                    <textarea 
                      required 
                      rows={2} 
                      value={formData.ingredients} 
                      onChange={(e) => setFormData(prev => ({...prev, ingredients: e.target.value}))} 
                      className="w-full px-3.5 py-2 rounded-xl border border-[#1F2937] bg-[#0B0F17] text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors resize-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-semibold text-slate-400 mb-1.5 uppercase">How to Use</label>
                    <textarea 
                      required 
                      rows={2} 
                      value={formData.how_to_use} 
                      onChange={(e) => setFormData(prev => ({...prev, how_to_use: e.target.value}))} 
                      className="w-full px-3.5 py-2 rounded-xl border border-[#1F2937] bg-[#0B0F17] text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors resize-none" 
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6 p-4 rounded-xl bg-[#0E1420] border border-[#1C2638]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.in_stock} 
                      onChange={(e) => setFormData(prev => ({...prev, in_stock: e.target.checked}))} 
                      className="w-4 h-4 text-emerald-500 accent-emerald-500 rounded border-[#1F2937]" 
                    />
                    <span className="text-xs font-semibold text-white">In Stock</span>
                  </label>
                  
                  <div className="flex items-center gap-3 border-l border-[#1C2638] pl-6">
                    <label className="text-[10px] font-mono font-semibold text-slate-400 uppercase">Stock Qty:</label>
                    <input 
                      type="number" 
                      required 
                      value={formData.stock_quantity} 
                      onChange={(e) => setFormData(prev => ({...prev, stock_quantity: e.target.value}))} 
                      className="w-24 px-3 py-1.5 rounded-lg border border-[#1F2937] bg-[#0B0F17] text-white text-xs font-mono focus:outline-none focus:border-emerald-500" 
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer border-l border-[#1C2638] pl-6">
                    <input 
                      type="checkbox" 
                      checked={formData.is_featured} 
                      onChange={(e) => setFormData(prev => ({...prev, is_featured: e.target.checked}))} 
                      className="w-4 h-4 text-emerald-500 accent-emerald-500 rounded border-[#1F2937]" 
                    />
                    <span className="text-xs font-semibold text-white">Featured In Hero</span>
                  </label>
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-[#1C2638] bg-[#0E1420] flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="product-form" 
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all font-sans cursor-pointer shadow-md shadow-emerald-950"
              >
                Save Formulation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
